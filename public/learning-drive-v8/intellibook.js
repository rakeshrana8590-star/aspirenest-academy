(() => {
  'use strict';

  const ASPIRENEST_INTELLIBOOK_RUNTIME = 'P14_G19_M2_FOCUSED_READER_V2';
  const PDFJS_MODULE_URL = '/vendor/pdfjs/pdf.mjs';
  const PDFJS_WORKER_URL = '/vendor/pdfjs/pdf.worker.mjs';
  const BOOK_MODE_KEY = 'aspirenest:intellibook:content-mode:v1';
  const BOOK_LAYOUT_KEY = 'aspirenest:intellibook:layout:v1';
  const BOOK_ZOOM_KEY = 'aspirenest:intellibook:zoom:v1';
  const BOOK_PROGRESS_PREFIX = 'aspirenest:intellibook:progress:v1';
  const BOOK_FIT_KEY = 'aspirenest:intellibook:fit:v2';
  const BOOK_PAGES_PANEL_KEY = 'aspirenest:intellibook:pages-panel:v2';
  const BOOK_STUDY_PANEL_KEY = 'aspirenest:intellibook:study-panel:v2';
  const MIN_ZOOM = 0.55;
  const MAX_ZOOM = 2.5;
  const ZOOM_STEP = 0.1;
  const STUDY_ACTIONS = new Set(['highlight', 'underline', 'note', 'doubt', 'bookmark', 'flashcard', 'revision']);

  window.__ASPIRENEST_INTELLIBOOK_RUNTIME__ = ASPIRENEST_INTELLIBOOK_RUNTIME;

  const clean = (value = '') => String(value ?? '').trim();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
  const safeFileName = (value = 'AspireNest-Note') => clean(value)
    .replace(/[^a-zA-Z0-9\u0900-\u097F _.-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'AspireNest-Note';

  const memoryStorage = Object.create(null);
  const localStore = window.__aspirenestStorage || {
    getItem(key) {
      try { return window.localStorage.getItem(key); }
      catch (_) { return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null; }
    },
    setItem(key, value) {
      try { window.localStorage.setItem(key, String(value)); }
      catch (_) { memoryStorage[key] = String(value); }
    },
  };

  const runtime = () => window.__aspirenestIntelliTextDrawerRuntime || null;
  const studentApi = () => window.__aspirenestStudentAPI || null;
  const drawer = () => document.getElementById('detailDrawer');
  const readerArticle = () => document.getElementById('readerArticle');
  const toast = (message, icon = '✦') => {
    const api = studentApi();
    if (typeof api?.toast === 'function') api.toast(message, icon);
  };

  let pdfJsPromise = null;
  let activeBook = null;
  let mutationObserver = null;
  let syncTimer = 0;

  const currentTextbookId = () => clean(studentApi()?.state?.readerResourceId);
  const currentContentVersion = () => Math.max(
    1,
    Number(drawer()?.dataset?.intellitextContentVersion || 1) || 1
  );
  const currentUid = () => {
    const session = window.__aspirenestAuthSession || {};
    return clean(session.uid || session.user?.uid || session.email || 'anonymous')
      .replace(/[^a-zA-Z0-9_.@-]+/g, '_');
  };
  const progressKey = (textbookId) => `${BOOK_PROGRESS_PREFIX}:${currentUid()}:${clean(textbookId).replace(/[^a-zA-Z0-9_.-]+/g, '_')}`;

  const readProgress = (textbookId) => {
    try {
      return JSON.parse(localStore.getItem(progressKey(textbookId)) || 'null') || {};
    } catch (_) {
      return {};
    }
  };

  const pageRangeLabel = (book = activeBook) => {
    if (!book) return 'Page 1';
    if (book.layout === 'spread') {
      const pages = pageNumbersFor(book);
      return pages.length > 1 ? `Pages ${pages[0]}–${pages[1]}` : `Page ${pages[0] || book.pageNumber}`;
    }
    return `Page ${book.pageNumber}`;
  };

  const writeProgress = (book = activeBook) => {
    if (!book?.textbookId || !book.pageCount) return;
    const progressPercent = Math.round((book.pageNumber / book.pageCount) * 100);
    localStore.setItem(progressKey(book.textbookId), JSON.stringify({
      textbookId: book.textbookId,
      contentVersion: book.contentVersion,
      sectionId: `pdf-page-${book.pageNumber}`,
      blockId: `pdf-page-${book.pageNumber}-text`,
      pageNumber: book.pageNumber,
      pageCount: book.pageCount,
      progressPercent,
      layout: book.layout,
      zoom: book.zoom,
      fitMode: book.fitMode,
      updatedAt: new Date().toISOString(),
    }));
    const progress = document.getElementById('readerProgressBar');
    if (progress) progress.style.width = `${progressPercent}%`;
    document.querySelectorAll('[data-intellibook-progress-label]').forEach((label) => {
      label.textContent = `${progressPercent}% • ${pageRangeLabel(book)} of ${book.pageCount}`;
    });
    document.querySelectorAll('[data-intellibook-current-page]').forEach((label) => {
      label.textContent = book.layout === 'spread'
        ? pageNumbersFor(book).join('–')
        : String(book.pageNumber);
    });
  };

  const responsiveSize = () => {
    const width = Number(drawer()?.clientWidth || window.innerWidth || 0);
    if (width < 680) return 'compact';
    if (width < 1120) return 'medium';
    return 'wide';
  };

  const normalizeLayout = (value = '') => {
    const requested = clean(value).toLowerCase();
    const size = responsiveSize();
    if (requested === 'scroll') return 'scroll';
    if (requested === 'spread' && size === 'wide' && Number(readerArticle()?.clientWidth || drawer()?.clientWidth || 0) >= 900) return 'spread';
    return 'page';
  };

  const defaultFitForLayout = (layout = 'page') => {
    if (layout === 'scroll') return 'width';
    if (layout === 'spread') return 'spread';
    return 'page';
  };

  const loadPdfJs = async () => {
    if (!pdfJsPromise) {
      pdfJsPromise = import(/* webpackIgnore: true */ PDFJS_MODULE_URL)
        .then((pdfjs) => {
          if (!pdfjs?.getDocument) throw new Error('AspireNest PDF rendering engine is unavailable.');
          if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
          return pdfjs;
        });
    }
    return pdfJsPromise;
  };

  const destroyBook = async ({ preserveMode = true } = {}) => {
    const book = activeBook;
    activeBook = null;
    if (!book) return;
    book.destroyed = true;
    book.pageObserver?.disconnect?.();
    book.visibilityObserver?.disconnect?.();
    book.thumbnailObserver?.disconnect?.();
    book.resizeObserver?.disconnect?.();
    book.visualViewportHandler && window.visualViewport?.removeEventListener?.('resize', book.visualViewportHandler);
    book.renderTasks?.forEach?.((task) => {
      try { task?.cancel?.(); } catch (_) {}
    });
    book.renderTasks?.clear?.();
    try { await book.pdfDocument?.destroy?.(); } catch (_) {}
    if (book.objectUrl) URL.revokeObjectURL(book.objectUrl);
    const host = drawer();
    if (host) {
      ['intellibookActive','intellibookLoading','intellibookLayout','intellibookSize','intellibookPagesOpen','intellibookStudyOpen','intellibookSearchOpen'].forEach((name) => delete host.dataset[name]);
      host.querySelector('.reader-toolbar')?.classList.remove('intelliBookStudyToolbar');
    }
    if (!preserveMode) localStore.setItem(BOOK_MODE_KEY, 'study');
  };

  const activePageSection = (book = activeBook) => ({
    sectionId: `pdf-page-${book?.pageNumber || 1}`,
    blockId: `pdf-page-${book?.pageNumber || 1}-text`,
    title: `Page ${book?.pageNumber || 1}`,
  });

  const getTextContentCompat = async (page, options = {}) => {
    try {
      return await page.getTextContent(options);
    } catch (_) {
      const reader = page.streamTextContent(options).getReader();
      const content = { items: [], styles: {}, lang: null };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        content.lang = content.lang || value.lang || null;
        Object.assign(content.styles, value.styles || {});
        content.items.push(...(value.items || []));
      }
      return content;
    }
  };

  const manualTextLayer = async ({ pdfjs, page, viewport, container }) => {
    const content = await getTextContentCompat(page, { includeMarkedContent: true });
    container.replaceChildren();
    const styles = content.styles || {};

    content.items.forEach((item) => {
      if (!item || typeof item.str !== 'string') return;
      const span = document.createElement('span');
      span.textContent = item.str;
      const transform = pdfjs.Util.transform(viewport.transform, item.transform);
      const angle = Math.atan2(transform[1], transform[0]);
      const fontHeight = Math.hypot(transform[2], transform[3]);
      const style = styles[item.fontName] || {};
      const ascent = Number.isFinite(style.ascent)
        ? style.ascent
        : Number.isFinite(style.descent)
          ? 1 + style.descent
          : 0.8;
      const left = transform[4];
      const top = transform[5] - fontHeight * ascent;
      span.style.left = `${left}px`;
      span.style.top = `${top}px`;
      span.style.fontSize = `${fontHeight}px`;
      span.style.fontFamily = style.fontFamily || 'sans-serif';
      span.style.transform = `rotate(${angle}rad)`;
      span.style.transformOrigin = '0 0';
      container.appendChild(span);
      if (item.hasEOL) container.appendChild(document.createElement('br'));
    });
  };

  const updateResponsiveState = (book = activeBook) => {
    if (!book || book.destroyed) return;
    const host = drawer();
    const shell = host?.querySelector('.reader-shell');
    const viewport = host?.querySelector('[data-intellibook-viewport]');
    if (!host || !shell || !viewport) return;

    const size = responsiveSize();
    host.dataset.intellibookSize = size;
    if (size !== 'wide' && book.layout === 'spread') {
      book.layout = 'page';
      book.fitMode = 'page';
    }

    const visualHeight = Number(window.visualViewport?.height || window.innerHeight || 800);
    const shellTop = Math.max(0, shell.getBoundingClientRect().top);
    const bottomReserve = size === 'compact' ? 72 : 14;
    const height = Math.max(size === 'compact' ? 300 : 420, visualHeight - shellTop - bottomReserve);
    viewport.style.setProperty('--intellibook-viewport-height', `${Math.floor(height)}px`);
  };

  const scaleForPage = ({ book, baseViewport }) => {
    const viewport = document.querySelector('[data-intellibook-viewport]');
    const width = Math.max(280, Number(viewport?.clientWidth || readerArticle()?.clientWidth || 760));
    const height = Math.max(300, Number(viewport?.clientHeight || window.innerHeight * 0.72));
    const compact = responsiveSize() === 'compact';
    const horizontalReserve = compact ? 18 : 108;
    const verticalReserve = compact ? 18 : 28;
    const spread = book.layout === 'spread';
    const pageWidth = spread
      ? Math.max(220, (width - horizontalReserve - 22) / 2)
      : Math.max(250, width - horizontalReserve);
    const pageHeight = Math.max(260, height - verticalReserve);
    const fitWidth = pageWidth / baseViewport.width;
    const fitHeight = pageHeight / baseViewport.height;
    let fitted = fitWidth;
    if (book.fitMode === 'page' || book.fitMode === 'spread') fitted = Math.min(fitWidth, fitHeight);
    if (book.layout === 'scroll') fitted = fitWidth;
    return clamp(fitted * book.zoom, 0.3, MAX_ZOOM);
  };

  const updateZoomLabel = (book = activeBook) => {
    if (!book) return;
    document.querySelectorAll('[data-intellibook-zoom-label]').forEach((label) => {
      const computed = Number(book.lastComputedScale || book.zoom || 1);
      label.textContent = `${Math.round(computed * 100)}%`;
    });
    document.querySelectorAll('[data-intellibook-fit-label]').forEach((label) => {
      label.textContent = book.fitMode === 'width' ? 'Fit width' : book.fitMode === 'spread' ? 'Fit spread' : 'Fit page';
    });
  };

  const renderPdfPage = async (book, pageNumber, { force = false } = {}) => {
    if (!book || book.destroyed || activeBook !== book) return;
    const surface = document.querySelector(`[data-intellibook-surface="${pageNumber}"]`);
    if (!surface || (surface.dataset.rendered === 'true' && !force)) return;
    if (surface.dataset.rendering === 'true') return;
    surface.dataset.rendering = 'true';

    try {
      const page = await book.pdfDocument.getPage(pageNumber);
      if (book.destroyed || activeBook !== book || !surface.isConnected) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const scale = scaleForPage({ book, baseViewport });
      const viewport = page.getViewport({ scale });
      book.lastComputedScale = scale;
      const outputScale = clamp(window.devicePixelRatio || 1, 1, 2);
      const canvas = surface.querySelector('canvas');
      const textLayer = surface.querySelector('.intelliBookTextLayer');
      const context = canvas.getContext('2d', { alpha: false });

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      surface.style.width = `${Math.floor(viewport.width)}px`;
      surface.style.height = `${Math.floor(viewport.height)}px`;
      textLayer.style.width = `${Math.floor(viewport.width)}px`;
      textLayer.style.height = `${Math.floor(viewport.height)}px`;
      textLayer.replaceChildren();

      const renderTask = page.render({
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
        background: '#ffffff',
      });
      book.renderTasks.set(pageNumber, renderTask);
      await renderTask.promise;
      book.renderTasks.delete(pageNumber);

      try {
        if (book.pdfjs.TextLayer) {
          const layer = new book.pdfjs.TextLayer({
            textContentSource: page.streamTextContent({ includeMarkedContent: true }),
            container: textLayer,
            viewport,
          });
          await layer.render();
        } else {
          await manualTextLayer({ pdfjs: book.pdfjs, page, viewport, container: textLayer });
        }
      } catch (_) {
        await manualTextLayer({ pdfjs: book.pdfjs, page, viewport, container: textLayer });
      }

      if (book.destroyed || activeBook !== book) return;
      surface.dataset.rendered = 'true';
      surface.dataset.rendering = 'false';
      surface.closest('.intelliBookPage')?.classList.add('isRendered');
      updateZoomLabel(book);
      window.setTimeout(() => applyBookAnnotations(book), 30);
    } catch (error) {
      surface.dataset.rendering = 'false';
      surface.dataset.renderError = 'true';
      const state = surface.querySelector('.intelliBookPageState');
      if (state) state.textContent = error?.message || `Page ${pageNumber} could not render.`;
    }
  };

  const renderPdfThumbnail = async (book, pageNumber) => {
    if (!book || book.destroyed || activeBook !== book) return;
    const canvas = document.querySelector(`[data-intellibook-thumbnail="${pageNumber}"]`);
    if (!canvas || canvas.dataset.rendered === 'true' || canvas.dataset.rendering === 'true') return;
    canvas.dataset.rendering = 'true';
    try {
      const page = await book.pdfDocument.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = 112 / base.width;
      const viewport = page.getViewport({ scale });
      const outputScale = clamp(window.devicePixelRatio || 1, 1, 1.5);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const task = page.render({
        canvasContext: canvas.getContext('2d', { alpha: false }),
        viewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
        background: '#ffffff',
      });
      await task.promise;
      canvas.dataset.rendered = 'true';
    } catch (_) {
      canvas.dataset.error = 'true';
    } finally {
      canvas.dataset.rendering = 'false';
    }
  };

  const pageShellHtml = (book, pageNumber) => {
    const sectionId = `pdf-page-${pageNumber}`;
    const blockId = `pdf-page-${pageNumber}-text`;
    return `<section class="intelliBookPage" data-intellibook-page-shell="${pageNumber}" aria-label="Page ${pageNumber} of ${book.pageCount}">
      <div class="intelliBookPageSurface"
        id="block-${blockId}"
        data-intellibook-surface="${pageNumber}"
        data-intellitext-block="true"
        data-textbook-id="${escapeHtml(book.textbookId)}"
        data-section-id="${sectionId}"
        data-block-id="${blockId}"
        data-content-version="${book.contentVersion}">
        <canvas aria-label="Page ${pageNumber}"></canvas>
        <div class="intelliBookTextLayer" aria-label="Selectable text on page ${pageNumber}"></div>
        <div class="intelliBookPageState">Preparing page ${pageNumber}…</div>
      </div>
      <footer>Page ${pageNumber} of ${book.pageCount}</footer>
    </section>`;
  };

  const pageNumbersFor = (book) => {
    if (book.layout === 'scroll') return Array.from({ length: book.pageCount }, (_, index) => index + 1);
    if (book.layout === 'spread') {
      const start = book.pageNumber <= 1 ? 1 : (book.pageNumber % 2 === 0 ? book.pageNumber : book.pageNumber - 1);
      return [start, start + 1].filter((page) => page >= 1 && page <= book.pageCount);
    }
    return [book.pageNumber];
  };

  const bookTocHtml = (book) => {
    const pages = Array.from({ length: book.pageCount }, (_, index) => index + 1);
    return `<div class="intelliBookPanelHeader"><strong>Pages</strong><button type="button" data-intellibook-action="toggle-pages" aria-label="Close pages panel">×</button></div>
      <div class="intelliBookPageList" aria-label="Book pages">
        ${pages.map((page) => `<button type="button" class="${page === book.pageNumber ? 'active' : ''}" data-intellibook-page="${page}" aria-label="Open page ${page}"><span class="intelliBookThumbnail"><canvas data-intellibook-thumbnail="${page}" aria-hidden="true"></canvas></span><span>Page ${page}</span><span class="intelliBookBookmarkStar" data-intellibook-bookmark-star="${page}" aria-label="Bookmarked">★</span></button>`).join('')}
      </div>`;
  };

  const bookToolsHtml = (book) => `<section class="intelliBookTools" aria-label="Book controls">
    <button type="button" class="intelliBookPanelToggle" data-intellibook-action="toggle-pages" aria-pressed="false"><span aria-hidden="true">☰</span><span>Pages</span></button>
    <div class="intelliBookLayoutSwitch" aria-label="Reading layout">
      <button type="button" class="${book.layout === 'scroll' ? 'active' : ''}" data-intellibook-layout="scroll"><span class="intelliBookLongLabel">Continuous scroll</span><span class="intelliBookShortLabel">Scroll</span></button>
      <button type="button" class="${book.layout === 'page' ? 'active' : ''}" data-intellibook-layout="page"><span class="intelliBookLongLabel">Single page</span><span class="intelliBookShortLabel">Page</span></button>
      <button type="button" class="${book.layout === 'spread' ? 'active' : ''}" data-intellibook-layout="spread"><span class="intelliBookLongLabel">Book spread</span><span class="intelliBookShortLabel">Spread</span></button>
    </div>
    <div class="intelliBookPageControls">
      <button type="button" data-intellibook-action="previous" aria-label="Previous page">←</button>
      <label><span>Page</span><input type="number" min="1" max="${book.pageCount}" value="${book.pageNumber}" inputmode="numeric" data-intellibook-page-input /></label>
      <span>of ${book.pageCount}</span>
      <button type="button" data-intellibook-action="next" aria-label="Next page">→</button>
    </div>
    <div class="intelliBookFitControls">
      <button type="button" data-intellibook-action="fit-page" class="${book.fitMode === 'page' ? 'active' : ''}">Fit page</button>
      <button type="button" data-intellibook-action="fit-width" class="${book.fitMode === 'width' ? 'active' : ''}">Fit width</button>
    </div>
    <div class="intelliBookZoomControls">
      <button type="button" data-intellibook-action="zoom-out" aria-label="Zoom out">−</button>
      <span data-intellibook-zoom-label>${Math.round((book.lastComputedScale || book.zoom) * 100)}%</span>
      <button type="button" data-intellibook-action="zoom-in" aria-label="Zoom in">+</button>
    </div>
    <button type="button" class="intelliBookSearchToggle" data-intellibook-action="toggle-search" aria-expanded="false">⌕ <span>Search</span></button>
    <button type="button" class="intelliBookStudyToggle" data-intellibook-action="toggle-study" aria-pressed="false">✦ <span>Study tools</span></button>
    <button type="button" class="intelliBookDownload" data-intellibook-action="download">Download PDF</button>
    <span class="intelliBookProgressLabel" data-intellibook-progress-label>${Math.round((book.pageNumber / book.pageCount) * 100)}% • ${pageRangeLabel(book)} of ${book.pageCount}</span>
    <div class="intelliBookSearch" data-intellibook-search-panel hidden>
      <input type="search" placeholder="Search this book" aria-label="Search this book" value="${escapeHtml(book.searchQuery || '')}" data-intellibook-search-input />
      <button type="button" data-intellibook-action="search">Search</button>
      <span data-intellibook-search-status>${book.searchMatches?.length ? `${book.searchIndex + 1}/${book.searchMatches.length}` : ''}</span>
    </div>
  </section>`;

  const edgeNavigationHtml = (book) => `<button type="button" class="intelliBookEdgeNav intelliBookEdgeNav--previous" data-intellibook-action="previous" aria-label="Previous page"><span aria-hidden="true">‹</span></button>
    <button type="button" class="intelliBookEdgeNav intelliBookEdgeNav--next" data-intellibook-action="next" aria-label="Next page"><span aria-hidden="true">›</span></button>
    <nav class="intelliBookMobileNav" aria-label="Page navigation">
      <button type="button" data-intellibook-action="previous" aria-label="Previous page">‹</button>
      <span><strong data-intellibook-current-page>${book.pageNumber}</strong> / ${book.pageCount}</span>
      <button type="button" data-intellibook-action="next" aria-label="Next page">›</button>
      <button type="button" data-intellibook-action="fit-page" data-intellibook-fit-label>Fit page</button>
      <button type="button" data-intellibook-action="toggle-study">Study</button>
    </nav>`;

  const syncNavigationState = (book = activeBook) => {
    if (!book) return;
    const step = book.layout === 'spread' ? 2 : 1;
    const previousDisabled = book.pageNumber <= 1;
    const nextDisabled = book.pageNumber >= book.pageCount || (book.layout === 'spread' && Math.max(...pageNumbersFor(book)) >= book.pageCount);
    document.querySelectorAll('[data-intellibook-action="previous"]').forEach((button) => {
      button.disabled = previousDisabled;
      button.setAttribute('aria-disabled', String(previousDisabled));
    });
    document.querySelectorAll('[data-intellibook-action="next"]').forEach((button) => {
      button.disabled = nextDisabled;
      button.setAttribute('aria-disabled', String(nextDisabled));
    });
    document.querySelectorAll('[data-intellibook-page]').forEach((button) => {
      button.classList.toggle('active', Number(button.dataset.intellibookPage) === book.pageNumber);
    });
    const active = document.querySelector(`[data-intellibook-page="${book.pageNumber}"]`);
    if (active && book.pagesOpen) active.scrollIntoView?.({ block: 'center', behavior: 'auto' });
    const input = document.querySelector('[data-intellibook-page-input]');
    if (input) input.value = String(book.pageNumber);
    writeProgress(book);
  };

  const setBookPage = (pageNumber, { smooth = true, render = true } = {}) => {
    const book = activeBook;
    if (!book) return;
    const next = clamp(Math.round(Number(pageNumber) || 1), 1, book.pageCount);
    book.pageNumber = next;
    syncNavigationState(book);

    if (book.layout === 'scroll') {
      const target = document.querySelector(`[data-intellibook-page-shell="${next}"]`);
      target?.scrollIntoView?.({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      return;
    }

    if (render) renderBookSurface(book);
  };

  const setupThumbnailObservers = (book) => {
    book.thumbnailObserver?.disconnect?.();
    const list = document.querySelector('.intelliBookPageList');
    if (!list || !book.pagesOpen) return;
    const canvases = Array.from(list.querySelectorAll('[data-intellibook-thumbnail]'));
    if (typeof window.IntersectionObserver !== 'function') {
      canvases.slice(0, 12).forEach((canvas) => renderPdfThumbnail(book, Number(canvas.dataset.intellibookThumbnail)));
      return;
    }
    book.thumbnailObserver = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) renderPdfThumbnail(book, Number(entry.target.dataset.intellibookThumbnail));
      });
    }, { root: list, rootMargin: '500px 0px', threshold: 0.01 });
    canvases.forEach((canvas) => book.thumbnailObserver.observe(canvas));
  };

  const setupPageObservers = (book) => {
    book.pageObserver?.disconnect?.();
    book.visibilityObserver?.disconnect?.();

    if (book.layout !== 'scroll') {
      pageNumbersFor(book).forEach((page) => renderPdfPage(book, page));
      return;
    }

    const viewport = document.querySelector('[data-intellibook-viewport]');
    const surfaces = Array.from(document.querySelectorAll('[data-intellibook-surface]'));
    if (typeof window.IntersectionObserver !== 'function') {
      surfaces.slice(0, 4).forEach((surface) => renderPdfPage(book, Number(surface.dataset.intellibookSurface)));
      return;
    }
    book.pageObserver = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) renderPdfPage(book, Number(entry.target.dataset.intellibookSurface));
      });
    }, { root: viewport, rootMargin: '1200px 0px', threshold: 0.01 });
    surfaces.forEach((surface) => book.pageObserver.observe(surface));

    book.visibilityObserver = new window.IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (!visible || activeBook !== book) return;
      const page = Number(visible.target.dataset.intellibookPageShell);
      if (Number.isFinite(page) && page !== book.pageNumber) {
        book.pageNumber = page;
        syncNavigationState(book);
      }
    }, { root: viewport, threshold: [0.25, 0.5, 0.75] });
    document.querySelectorAll('[data-intellibook-page-shell]').forEach((node) => book.visibilityObserver.observe(node));
  };

  const applyPanelState = (book = activeBook) => {
    const host = drawer();
    if (!host || !book) return;
    host.dataset.intellibookPagesOpen = String(Boolean(book.pagesOpen));
    host.dataset.intellibookStudyOpen = String(Boolean(book.studyOpen));
    host.dataset.intellibookSearchOpen = String(Boolean(book.searchOpen));
    const toc = host.querySelector('.reader-toc');
    const studyPanel = host.querySelector('.intelliBookStudyPanel');
    if (toc) toc.setAttribute('aria-hidden', String(!book.pagesOpen));
    if (studyPanel) studyPanel.setAttribute('aria-hidden', String(!book.studyOpen));
    document.querySelectorAll('[data-intellibook-action="toggle-pages"]').forEach((button) => button.setAttribute('aria-pressed', String(Boolean(book.pagesOpen))));
    document.querySelectorAll('[data-intellibook-action="toggle-study"]').forEach((button) => button.setAttribute('aria-pressed', String(Boolean(book.studyOpen))));
    const search = host.querySelector('[data-intellibook-search-panel]');
    if (search) search.hidden = !book.searchOpen;
    const searchToggle = host.querySelector('[data-intellibook-action="toggle-search"]');
    searchToggle?.setAttribute('aria-expanded', String(Boolean(book.searchOpen)));
  };

  const renderBookSurface = (book = activeBook) => {
    if (!book || book.destroyed || activeBook !== book) return;
    const host = drawer();
    const article = readerArticle();
    const toc = host?.querySelector('.reader-toc');
    const shell = host?.querySelector('.reader-shell');
    const studyToolbar = host?.querySelector('.reader-toolbar');
    if (!article || !toc || !shell || !studyToolbar) return;

    book.layout = normalizeLayout(book.layout);
    if (book.layout !== 'scroll' && book.fitMode === 'width' && book.zoom === 1) {
      book.fitMode = defaultFitForLayout(book.layout);
    }
    host.dataset.intellibookActive = 'true';
    host.dataset.intellibookLayout = book.layout;
    const title = host.querySelector('.drawer-header > strong');
    if (title) {
      title.textContent = `AspireNest IntelliBook · ${book.title}`;
      title.title = book.title;
    }

    toc.innerHTML = bookTocHtml(book);
    studyToolbar.classList.add('intelliBookStudyToolbar');
    let studyPanel = shell.querySelector('.intelliBookStudyPanel');
    if (!studyPanel) {
      studyPanel = document.createElement('aside');
      studyPanel.className = 'intelliBookStudyPanel';
      studyPanel.innerHTML = '<div class="intelliBookPanelHeader"><strong>Study tools</strong><button type="button" data-intellibook-action="toggle-study" aria-label="Close study tools">×</button></div><p class="intelliBookStudyHint">Select text on the PDF page, then choose a study action. Everything is saved privately to this student account.</p>';
      shell.appendChild(studyPanel);
    }
    studyPanel.appendChild(studyToolbar);

    article.classList.add('intelliBookArticle');
    article.innerHTML = `<div class="intelliBookViewport" data-intellibook-viewport tabindex="0" aria-label="PDF book reading area">${edgeNavigationHtml(book)}<div class="intelliBookPages is-${book.layout}">${pageNumbersFor(book).map((page) => pageShellHtml(book, page)).join('')}</div></div>`;

    const existingTools = host.querySelector('.intelliBookTools');
    existingTools?.remove();
    const hero = host.querySelector('.drawer-hero');
    if (hero) hero.insertAdjacentHTML('afterend', bookToolsHtml(book));

    syncContentSwitchState('book');
    updateResponsiveState(book);
    applyPanelState(book);
    setupPageObservers(book);
    setupThumbnailObservers(book);
    syncNavigationState(book);
    updateZoomLabel(book);
    window.setTimeout(() => applyBookAnnotations(book), 80);
    window.requestAnimationFrame(() => {
      updateResponsiveState(book);
      if (book.layout !== 'scroll') pageNumbersFor(book).forEach((page) => renderPdfPage(book, page, { force: true }));
    });
  };

  const applyBookAnnotations = async (book = activeBook) => {
    if (!book || book.destroyed || activeBook !== book) return;
    const api = runtime();
    const rootElement = readerArticle();
    if (!api?.loadWorkspace || !api?.applyAnnotations || !rootElement) return;
    try {
      const workspace = await api.loadWorkspace(book.textbookId);
      if (book.destroyed || activeBook !== book) return;
      book.workspace = workspace;
      const annotations = (workspace?.annotations || []).filter((item) => clean(item.sectionId).startsWith('pdf-page-'));
      api.applyAnnotations({ rootElement, annotations, contentVersion: book.contentVersion });
      const bookmarkedPages = new Set((workspace?.bookmarks || []).map((item) => Number(clean(item.sectionId).replace('pdf-page-', ''))).filter(Number.isFinite));
      book.bookmarkedPages = bookmarkedPages;
      document.querySelectorAll('[data-intellibook-bookmark-star]').forEach((star) => {
        const page = Number(star.dataset.intellibookBookmarkStar);
        star.classList.toggle('active', bookmarkedPages.has(page));
      });
    } catch (_) {}
  };

  const handleBookStudyAction = async (action, button = null, book = activeBook) => {
    if (!book || book.destroyed || !STUDY_ACTIONS.has(action)) return;
    const api = runtime();
    if (!api?.create) return toast('UID-private study workspace is still connecting.', '!');
    button?.setAttribute('aria-busy', 'true');
    try {
      const section = activePageSection(book);
      let captured = null;
      if (action !== 'bookmark') {
        captured = api.capture({ selection: window.getSelection?.(), rootElement: readerArticle() });
        if (clean(captured?.textbookId) !== book.textbookId) throw new Error('Select text on the active PDF page first.');
      }
      let body = '';
      let prompt = '';
      const answer = captured?.selectionAnchor?.exactText || '';
      if (action === 'note') body = window.prompt('Write your personal note:', '') || '';
      if (action === 'doubt') body = window.prompt('Write your doubt or question:', '') || '';
      if (action === 'flashcard') prompt = window.prompt('Write the flashcard question:', 'Recall this concept.') || '';
      if (['note', 'doubt'].includes(action) && !clean(body)) return;
      if (action === 'flashcard' && !clean(prompt)) return;

      await api.create(action, {
        ...(captured || {}),
        textbookId: book.textbookId,
        resourceId: book.textbookId,
        sectionId: captured?.sectionId || section.sectionId,
        blockId: captured?.blockId || section.blockId,
        contentVersion: book.contentVersion,
        selectionAnchor: captured?.selectionAnchor,
        body: clean(body),
        noteTitle: book.title,
        sectionTitle: section.title,
        label: section.title,
        prompt: clean(prompt || 'Recall this saved concept.'),
        answer,
      });
      const labels = {
        highlight: 'Highlight saved privately.',
        underline: 'Underline saved privately.',
        note: 'Personal note saved privately.',
        doubt: 'Doubt saved privately.',
        bookmark: `Page ${book.pageNumber} bookmarked.`,
        flashcard: 'Flashcard created.',
        revision: 'Added to Revision.',
      };
      window.getSelection?.()?.removeAllRanges?.();
      await applyBookAnnotations(book);
      toast(labels[action] || 'Study action saved.', action === 'bookmark' ? '★' : '✦');
    } catch (error) {
      toast(error?.message || 'This study action could not be saved.', '!');
    } finally {
      button?.removeAttribute('aria-busy');
    }
  };

  const searchBook = async (book = activeBook) => {
    if (!book || book.destroyed) return;
    const input = document.querySelector('[data-intellibook-search-input]');
    const query = clean(input?.value || book.searchQuery).toLowerCase();
    if (!query) return toast('Type a word or concept to search this book.', '!');

    if (query === book.searchQuery && book.searchMatches.length) {
      book.searchIndex = (book.searchIndex + 1) % book.searchMatches.length;
      setBookPage(book.searchMatches[book.searchIndex], { smooth: true });
      const status = document.querySelector('[data-intellibook-search-status]');
      if (status) status.textContent = `${book.searchIndex + 1}/${book.searchMatches.length}`;
      return;
    }

    book.searchQuery = query;
    toast('Searching the complete book…', '⌕');
    const matches = [];
    for (let pageNumber = 1; pageNumber <= book.pageCount; pageNumber += 1) {
      let text = book.textCache.get(pageNumber);
      if (text == null) {
        const page = await book.pdfDocument.getPage(pageNumber);
        const content = await getTextContentCompat(page);
        text = content.items.map((item) => item?.str || '').join(' ');
        book.textCache.set(pageNumber, text);
      }
      if (text.toLowerCase().includes(query)) matches.push(pageNumber);
    }

    book.searchMatches = matches;
    book.searchIndex = 0;
    const status = document.querySelector('[data-intellibook-search-status]');
    if (status) status.textContent = matches.length ? `1/${matches.length}` : '0';
    if (!matches.length) return toast(`No match for “${query}”.`, '!');
    setBookPage(matches[0], { smooth: true });
    toast(`${matches.length} page${matches.length === 1 ? '' : 's'} found. Search again for the next match.`, '⌕');
  };

  const downloadBook = async (book = activeBook) => {
    if (!book?.textbookId || !runtime()?.loadIntelliBook) return;
    toast('Authorising your PDF download…', '↧');
    try {
      const downloadAsset = await runtime().loadIntelliBook(book.textbookId, { action: 'DOWNLOAD' });
      if (!downloadAsset?.blob) throw new Error('The authorised PDF download is unavailable.');
      const objectUrl = URL.createObjectURL(downloadAsset.blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${safeFileName(downloadAsset.title || book.title || 'AspireNest-Note')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      toast('PDF download started.', '↧');
    } catch (error) {
      toast(error?.message || 'PDF download is not available for this access.', '!');
    }
  };

  const syncContentSwitchState = (mode = 'book') => {
    document.querySelectorAll('[data-intellibook-content]').forEach((button) => {
      const active = button.dataset.intellibookContent === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const activateStudy = async () => {
    const textbookId = activeBook?.textbookId || currentTextbookId();
    localStore.setItem(BOOK_MODE_KEY, 'study');
    syncContentSwitchState('study');
    await destroyBook({ preserveMode: true });
    const api = studentApi();
    if (textbookId && typeof api?.openIntelliTextResource === 'function') {
      api.openIntelliTextResource(textbookId, {
        replace: true,
        mode: api.state?.readerMode || 'side',
      });
    }
  };

  const activateBook = async ({ force = false } = {}) => {
    const host = drawer();
    const textbookId = currentTextbookId();
    const api = runtime();
    if (!host || !textbookId || !api?.loadIntelliBook) return;
    if (!force && activeBook?.textbookId === textbookId && host.dataset.intellibookActive === 'true') return;

    await destroyBook({ preserveMode: true });
    host.dataset.intellibookLoading = 'true';
    localStore.setItem(BOOK_MODE_KEY, 'book');
    syncContentSwitchState('book');

    try {
      const [pdfjs, asset] = await Promise.all([
        loadPdfJs(),
        api.loadIntelliBook(textbookId, { action: 'OPEN' }),
      ]);
      if (!asset?.blob || asset.blob.type && !String(asset.blob.type).includes('pdf')) {
        throw new Error('The exact PDF book asset is unavailable.');
      }
      const bytes = new Uint8Array(await asset.blob.arrayBuffer());
      const loadingTask = pdfjs.getDocument({
        data: bytes,
        cMapUrl: '/vendor/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/vendor/pdfjs/standard_fonts/',
        wasmUrl: '/vendor/pdfjs/wasm/',
        useWorkerFetch: true,
      });
      const pdfDocument = await loadingTask.promise;
      const saved = readProgress(textbookId);
      const pageNumber = clamp(Number(saved.pageNumber || 1), 1, pdfDocument.numPages);
      const layout = normalizeLayout(saved.layout || localStore.getItem(BOOK_LAYOUT_KEY) || 'page');
      const fitMode = clean(saved.fitMode || localStore.getItem(BOOK_FIT_KEY) || defaultFitForLayout(layout));
      const zoom = clamp(Number(saved.zoom || localStore.getItem(BOOK_ZOOM_KEY) || 1), MIN_ZOOM, MAX_ZOOM);

      activeBook = {
        textbookId,
        title: clean(asset.title || host.querySelector('.drawer-hero h2')?.textContent || 'AspireNest Note'),
        contentVersion: currentContentVersion(),
        asset,
        pdfjs,
        pdfDocument,
        pageCount: pdfDocument.numPages,
        pageNumber,
        layout,
        fitMode: ['page', 'width', 'spread'].includes(fitMode) ? fitMode : defaultFitForLayout(layout),
        zoom,
        lastComputedScale: 1,
        pagesOpen: localStore.getItem(BOOK_PAGES_PANEL_KEY) === 'true',
        studyOpen: localStore.getItem(BOOK_STUDY_PANEL_KEY) === 'true',
        searchOpen: false,
        destroyed: false,
        renderTasks: new Map(),
        textCache: new Map(),
        searchMatches: [],
        searchIndex: 0,
        searchQuery: '',
        bookmarkedPages: new Set(),
      };
      if (typeof window.ResizeObserver === 'function') {
        activeBook.resizeObserver = new window.ResizeObserver(() => {
          if (!activeBook || activeBook.destroyed) return;
          const rect = host.getBoundingClientRect();
          const resizeKey = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
          if (resizeKey === activeBook.lastResizeKey) return;
          activeBook.lastResizeKey = resizeKey;
          window.clearTimeout(activeBook.resizeTimer);
          activeBook.resizeTimer = window.setTimeout(() => renderBookSurface(activeBook), 140);
        });
        activeBook.resizeObserver.observe(host);
      }
      activeBook.visualViewportHandler = () => {
        if (!activeBook || activeBook.destroyed) return;
        window.clearTimeout(activeBook.resizeTimer);
        activeBook.resizeTimer = window.setTimeout(() => renderBookSurface(activeBook), 140);
      };
      window.visualViewport?.addEventListener?.('resize', activeBook.visualViewportHandler);
      delete host.dataset.intellibookLoading;
      renderBookSurface(activeBook);
    } catch (error) {
      delete host.dataset.intellibookLoading;
      localStore.setItem(BOOK_MODE_KEY, 'study');
      toast(error?.message || 'The PDF Book View could not open. IntelliText Study View remains available.', '!');
      await destroyBook({ preserveMode: true });
    }
  };

  const injectContentSwitch = () => {
    const host = drawer();
    if (!host || host.dataset.intellitextDrawer !== 'true') return;
    const actions = host.querySelector('.reader-header-actions');
    if (!actions || actions.querySelector('[data-intellibook-content-switch]')) return;
    const controls = document.createElement('div');
    controls.className = 'intelliBookContentSwitch';
    controls.dataset.intellibookContentSwitch = 'true';
    const selected = localStore.getItem(BOOK_MODE_KEY) === 'study' ? 'study' : 'book';
    controls.innerHTML = `<button type="button" class="${selected === 'book' ? 'active' : ''}" data-intellibook-content="book">Book View</button><button type="button" class="${selected === 'study' ? 'active' : ''}" data-intellibook-content="study">Study View</button>`;
    actions.insertBefore(controls, actions.firstChild);
  };

  const syncReader = () => {
    const host = drawer();
    if (!host || host.dataset.intellitextDrawer !== 'true' || !currentTextbookId()) {
      if (activeBook) destroyBook({ preserveMode: true });
      return;
    }
    injectContentSwitch();
    const preferred = localStore.getItem(BOOK_MODE_KEY) === 'study' ? 'study' : 'book';
    if (preferred === 'book' && !activeBook && host.dataset.intellibookLoading !== 'true') {
      activateBook();
    }
  };

  const scheduleSync = () => {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(syncReader, 20);
  };

  document.addEventListener('click', (event) => {
    const content = event.target.closest?.('[data-intellibook-content]');
    if (content) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (content.dataset.intellibookContent === 'study') activateStudy();
      else activateBook({ force: true });
      return;
    }

    const layout = event.target.closest?.('[data-intellibook-layout]');
    if (layout && activeBook) {
      event.preventDefault();
      event.stopImmediatePropagation();
      activeBook.layout = normalizeLayout(layout.dataset.intellibookLayout);
      activeBook.fitMode = defaultFitForLayout(activeBook.layout);
      activeBook.zoom = 1;
      localStore.setItem(BOOK_LAYOUT_KEY, activeBook.layout);
      localStore.setItem(BOOK_FIT_KEY, activeBook.fitMode);
      localStore.setItem(BOOK_ZOOM_KEY, activeBook.zoom);
      renderBookSurface(activeBook);
      return;
    }

    const page = event.target.closest?.('[data-intellibook-page]');
    if (page && activeBook) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setBookPage(Number(page.dataset.intellibookPage));
      return;
    }

    const action = event.target.closest?.('[data-intellibook-action]');
    if (action && activeBook) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const name = action.dataset.intellibookAction;
      if (name === 'previous') setBookPage(activeBook.pageNumber - (activeBook.layout === 'spread' ? 2 : 1));
      if (name === 'next') setBookPage(activeBook.pageNumber + (activeBook.layout === 'spread' ? 2 : 1));
      if (name === 'zoom-in' || name === 'zoom-out') {
        activeBook.zoom = clamp(activeBook.zoom + (name === 'zoom-in' ? ZOOM_STEP : -ZOOM_STEP), MIN_ZOOM, MAX_ZOOM);
        localStore.setItem(BOOK_ZOOM_KEY, activeBook.zoom);
        renderBookSurface(activeBook);
      }
      if (name === 'fit-page' || name === 'fit-width') {
        activeBook.fitMode = name === 'fit-width' ? 'width' : (activeBook.layout === 'spread' ? 'spread' : 'page');
        activeBook.zoom = 1;
        localStore.setItem(BOOK_FIT_KEY, activeBook.fitMode);
        localStore.setItem(BOOK_ZOOM_KEY, activeBook.zoom);
        renderBookSurface(activeBook);
      }
      if (name === 'toggle-pages') {
        activeBook.pagesOpen = !activeBook.pagesOpen;
        if (responsiveSize() !== 'wide' && activeBook.pagesOpen) activeBook.studyOpen = false;
        localStore.setItem(BOOK_PAGES_PANEL_KEY, activeBook.pagesOpen);
        localStore.setItem(BOOK_STUDY_PANEL_KEY, activeBook.studyOpen);
        applyPanelState(activeBook);
        setupThumbnailObservers(activeBook);
        window.setTimeout(() => renderBookSurface(activeBook), 40);
      }
      if (name === 'toggle-study') {
        activeBook.studyOpen = !activeBook.studyOpen;
        if (responsiveSize() !== 'wide' && activeBook.studyOpen) activeBook.pagesOpen = false;
        localStore.setItem(BOOK_STUDY_PANEL_KEY, activeBook.studyOpen);
        localStore.setItem(BOOK_PAGES_PANEL_KEY, activeBook.pagesOpen);
        applyPanelState(activeBook);
        window.setTimeout(() => renderBookSurface(activeBook), 40);
      }
      if (name === 'toggle-search') {
        activeBook.searchOpen = !activeBook.searchOpen;
        applyPanelState(activeBook);
        if (activeBook.searchOpen) window.setTimeout(() => document.querySelector('[data-intellibook-search-input]')?.focus(), 20);
      }
      if (name === 'search') searchBook(activeBook);
      if (name === 'download') downloadBook(activeBook);
      return;
    }

    const readerAction = event.target.closest?.('[data-reader-action]');
    if (readerAction && activeBook) {
      const name = clean(readerAction.dataset.readerAction).toLowerCase();
      if (STUDY_ACTIONS.has(name)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        handleBookStudyAction(name, readerAction, activeBook);
        return;
      }
      if (name === 'progress') {
        event.preventDefault();
        event.stopImmediatePropagation();
        writeProgress(activeBook);
        toast(`Reading progress saved at page ${activeBook.pageNumber}.`, '✓');
        return;
      }
    }
  }, true);

  document.addEventListener('change', (event) => {
    const input = event.target.closest?.('[data-intellibook-page-input]');
    if (input && activeBook) setBookPage(Number(input.value));
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!activeBook) return;
    const tag = document.activeElement?.tagName;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      activeBook.searchOpen = true;
      applyPanelState(activeBook);
      window.setTimeout(() => document.querySelector('[data-intellibook-search-input]')?.focus(), 20);
      return;
    }
    if (typing) {
      if (event.key === 'Enter' && document.activeElement?.matches?.('[data-intellibook-search-input]')) {
        event.preventDefault();
        searchBook(activeBook);
      }
      return;
    }
    const step = activeBook.layout === 'spread' ? 2 : 1;
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      setBookPage(activeBook.pageNumber - step);
    }
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      event.preventDefault();
      setBookPage(activeBook.pageNumber + step);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setBookPage(1);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setBookPage(activeBook.pageCount);
    }
    if (event.key === 'Escape' && (activeBook.pagesOpen || activeBook.studyOpen || activeBook.searchOpen)) {
      event.preventDefault();
      activeBook.pagesOpen = false;
      activeBook.studyOpen = false;
      activeBook.searchOpen = false;
      applyPanelState(activeBook);
    }
  });

  let touchStartX = null;
  let touchStartY = null;
  document.addEventListener('touchstart', (event) => {
    if (!activeBook || activeBook.layout === 'scroll') return;
    touchStartX = event.touches?.[0]?.clientX ?? null;
    touchStartY = event.touches?.[0]?.clientY ?? null;
  }, { passive: true });
  document.addEventListener('touchend', (event) => {
    if (!activeBook || activeBook.layout === 'scroll' || touchStartX == null) return;
    const endX = event.changedTouches?.[0]?.clientX ?? touchStartX;
    const endY = event.changedTouches?.[0]?.clientY ?? touchStartY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(deltaX) < 52 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    setBookPage(activeBook.pageNumber + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  const responsiveRender = () => {
    if (!activeBook) return;
    const nextLayout = normalizeLayout(activeBook.layout);
    if (nextLayout !== activeBook.layout) {
      activeBook.layout = nextLayout;
      activeBook.fitMode = defaultFitForLayout(nextLayout);
      activeBook.zoom = 1;
    }
    window.clearTimeout(activeBook.resizeTimer);
    activeBook.resizeTimer = window.setTimeout(() => renderBookSurface(activeBook), 160);
  };
  window.addEventListener('resize', responsiveRender);
  window.addEventListener('orientationchange', responsiveRender);

  mutationObserver = new MutationObserver(scheduleSync);
  mutationObserver.observe(document.body || document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'data-intellitext-drawer', 'data-intellitext-content-version'],
  });

  window.__ASPIRENEST_INTELLIBOOK_DIAGNOSTICS__ = Object.freeze({
    runtime: ASPIRENEST_INTELLIBOOK_RUNTIME,
    fitPage: true,
    fitWidth: true,
    edgeNavigation: true,
    responsivePanels: true,
    directStudyActions: Array.from(STUDY_ACTIONS),
    download: true,
    search: true,
    keyboardNavigation: true,
    touchNavigation: true,
  });

  window.addEventListener('aspirenest:student-runtime-ready', scheduleSync);
  window.setTimeout(scheduleSync, 40);
})();

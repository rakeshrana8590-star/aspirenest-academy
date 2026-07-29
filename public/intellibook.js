(() => {
  'use strict';

  const ASPIRENEST_INTELLIBOOK_RUNTIME = 'P14_G19_M1_INTELLIBOOK_V1';
  const PDFJS_MODULE_URL = '/vendor/pdfjs/pdf.mjs';
  const PDFJS_WORKER_URL = '/vendor/pdfjs/pdf.worker.mjs';
  const BOOK_MODE_KEY = 'aspirenest:intellibook:content-mode:v1';
  const BOOK_LAYOUT_KEY = 'aspirenest:intellibook:layout:v1';
  const BOOK_ZOOM_KEY = 'aspirenest:intellibook:zoom:v1';
  const BOOK_PROGRESS_PREFIX = 'aspirenest:intellibook:progress:v1';
  const MIN_ZOOM = 0.7;
  const MAX_ZOOM = 1.8;
  const ZOOM_STEP = 0.1;

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
      updatedAt: new Date().toISOString(),
    }));
    const progress = document.getElementById('readerProgressBar');
    if (progress) progress.style.width = `${progressPercent}%`;
    const label = document.querySelector('[data-intellibook-progress-label]');
    if (label) label.textContent = `${progressPercent}% • Page ${book.pageNumber} of ${book.pageCount}`;
  };

  const normalizeLayout = (value = '') => {
    const requested = clean(value).toLowerCase();
    if (requested === 'scroll') return 'scroll';
    if (requested === 'spread' && window.innerWidth >= 900) return 'spread';
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
    book.resizeObserver?.disconnect?.();
    book.renderTasks?.forEach?.((task) => {
      try { task?.cancel?.(); } catch (_) {}
    });
    book.renderTasks?.clear?.();
    try { await book.pdfDocument?.destroy?.(); } catch (_) {}
    if (book.objectUrl) URL.revokeObjectURL(book.objectUrl);
    const host = drawer();
    if (host) {
      delete host.dataset.intellibookActive;
      delete host.dataset.intellibookLoading;
      delete host.dataset.intellibookLayout;
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
      const article = readerArticle();
      const articleWidth = Math.max(280, Number(article?.clientWidth || 760));
      const spread = book.layout === 'spread';
      const available = spread
        ? Math.max(260, (articleWidth - 42) / 2)
        : Math.min(940, Math.max(280, articleWidth - 34));
      const fitScale = available / baseViewport.width;
      const viewport = page.getViewport({ scale: Math.max(0.35, fitScale * book.zoom) });
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
      window.setTimeout(() => applyBookAnnotations(book), 30);
    } catch (error) {
      surface.dataset.rendering = 'false';
      surface.dataset.renderError = 'true';
      const state = surface.querySelector('.intelliBookPageState');
      if (state) state.textContent = error?.message || `Page ${pageNumber} could not render.`;
    }
  };

  const pageShellHtml = (book, pageNumber) => {
    const sectionId = `pdf-page-${pageNumber}`;
    const blockId = `pdf-page-${pageNumber}-text`;
    return `<section class="intelliBookPage" data-intellibook-page-shell="${pageNumber}">
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
      const start = book.pageNumber % 2 === 0 ? book.pageNumber - 1 : book.pageNumber;
      return [start, start + 1].filter((page) => page >= 1 && page <= book.pageCount);
    }
    return [book.pageNumber];
  };

  const bookTocHtml = (book) => {
    const pages = Array.from({ length: book.pageCount }, (_, index) => index + 1);
    return `<strong>Book pages</strong>
      <div class="intelliBookPageList" aria-label="Book pages">
        ${pages.map((page) => `<button type="button" class="${page === book.pageNumber ? 'active' : ''}" data-intellibook-page="${page}">Page ${page}</button>`).join('')}
      </div>`;
  };

  const bookToolsHtml = (book) => `<section class="intelliBookTools" aria-label="Book controls">
    <div class="intelliBookLayoutSwitch" aria-label="Reading layout">
      <button type="button" class="${book.layout === 'scroll' ? 'active' : ''}" data-intellibook-layout="scroll">Continuous Scroll</button>
      <button type="button" class="${book.layout === 'page' ? 'active' : ''}" data-intellibook-layout="page">Single page</button>
      <button type="button" class="${book.layout === 'spread' ? 'active' : ''}" data-intellibook-layout="spread">Book spread</button>
    </div>
    <div class="intelliBookPageControls">
      <button type="button" data-intellibook-action="previous" aria-label="Previous page">←</button>
      <label><span>Page</span><input type="number" min="1" max="${book.pageCount}" value="${book.pageNumber}" data-intellibook-page-input /></label>
      <span>of ${book.pageCount}</span>
      <button type="button" data-intellibook-action="next" aria-label="Next page">→</button>
    </div>
    <div class="intelliBookZoomControls">
      <button type="button" data-intellibook-action="zoom-out" aria-label="Zoom out">−</button>
      <span>${Math.round(book.zoom * 100)}%</span>
      <button type="button" data-intellibook-action="zoom-in" aria-label="Zoom in">+</button>
    </div>
    <div class="intelliBookSearch">
      <input type="search" placeholder="Search this book" aria-label="Search this book" value="${escapeHtml(book.searchQuery || '')}" data-intellibook-search-input />
      <button type="button" data-intellibook-action="search">Search</button>
    </div>
    <button type="button" class="intelliBookDownload" data-intellibook-action="download">Download PDF</button>
    <span class="intelliBookProgressLabel" data-intellibook-progress-label>${Math.round((book.pageNumber / book.pageCount) * 100)}% • Page ${book.pageNumber} of ${book.pageCount}</span>
  </section>`;

  const setBookPage = (pageNumber, { smooth = true, render = true } = {}) => {
    const book = activeBook;
    if (!book) return;
    const next = clamp(Math.round(Number(pageNumber) || 1), 1, book.pageCount);
    book.pageNumber = next;
    writeProgress(book);

    if (book.layout === 'scroll') {
      const target = document.querySelector(`[data-intellibook-page-shell="${next}"]`);
      target?.scrollIntoView?.({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      document.querySelectorAll('[data-intellibook-page]').forEach((button) => {
        button.classList.toggle('active', Number(button.dataset.intellibookPage) === next);
      });
      const pageInput = document.querySelector('[data-intellibook-page-input]');
      if (pageInput) pageInput.value = String(next);
      return;
    }

    if (render) renderBookSurface(book);
  };

  const setupPageObservers = (book) => {
    book.pageObserver?.disconnect?.();
    book.visibilityObserver?.disconnect?.();

    if (book.layout !== 'scroll') {
      pageNumbersFor(book).forEach((page) => renderPdfPage(book, page));
      return;
    }

    const surfaces = Array.from(document.querySelectorAll('[data-intellibook-surface]'));
    book.pageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) renderPdfPage(book, Number(entry.target.dataset.intellibookSurface));
      });
    }, { root: null, rootMargin: '1200px 0px', threshold: 0.01 });
    surfaces.forEach((surface) => book.pageObserver.observe(surface));

    book.visibilityObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (!visible || activeBook !== book) return;
      const page = Number(visible.target.dataset.intellibookPageShell);
      if (Number.isFinite(page) && page !== book.pageNumber) {
        book.pageNumber = page;
        writeProgress(book);
        document.querySelectorAll('[data-intellibook-page]').forEach((button) => {
          button.classList.toggle('active', Number(button.dataset.intellibookPage) === page);
        });
        const input = document.querySelector('[data-intellibook-page-input]');
        if (input) input.value = String(page);
      }
    }, { root: null, threshold: [0.25, 0.5, 0.75] });
    document.querySelectorAll('[data-intellibook-page-shell]').forEach((node) => book.visibilityObserver.observe(node));
  };

  const renderBookSurface = (book = activeBook) => {
    if (!book || book.destroyed || activeBook !== book) return;
    const host = drawer();
    const article = readerArticle();
    const toc = host?.querySelector('.reader-toc');
    if (!article || !toc) return;

    host.dataset.intellibookActive = 'true';
    host.dataset.intellibookLayout = book.layout;
    const title = host.querySelector('.drawer-header > strong');
    if (title) title.textContent = 'AspireNest IntelliBook Reader';

    toc.innerHTML = bookTocHtml(book);
    article.classList.add('intelliBookArticle');
    article.innerHTML = `<div class="intelliBookPages is-${book.layout}">${pageNumbersFor(book).map((page) => pageShellHtml(book, page)).join('')}</div>`;

    const existingTools = host.querySelector('.intelliBookTools');
    existingTools?.remove();
    const hero = host.querySelector('.drawer-hero');
    if (hero) hero.insertAdjacentHTML('afterend', bookToolsHtml(book));

    setupPageObservers(book);
    writeProgress(book);
    window.setTimeout(() => applyBookAnnotations(book), 80);
  };

  const applyBookAnnotations = async (book = activeBook) => {
    if (!book || book.destroyed || activeBook !== book) return;
    const api = runtime();
    const rootElement = readerArticle();
    if (!api?.loadWorkspace || !api?.applyAnnotations || !rootElement) return;
    try {
      const workspace = await api.loadWorkspace(book.textbookId);
      if (book.destroyed || activeBook !== book) return;
      const annotations = (workspace?.annotations || []).filter((item) => clean(item.sectionId).startsWith('pdf-page-'));
      api.applyAnnotations({ rootElement, annotations, contentVersion: book.contentVersion });
    } catch (_) {}
  };

  const searchBook = async (book = activeBook) => {
    if (!book || book.destroyed) return;
    const input = document.querySelector('[data-intellibook-search-input]');
    const query = clean(input?.value || book.searchQuery).toLowerCase();
    if (!query) return toast('Type a word or concept to search this book.', '!');
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
    if (!matches.length) return toast(`No match for “${query}”.`, '!');
    setBookPage(matches[0], { smooth: true });
    toast(`${matches.length} page${matches.length === 1 ? '' : 's'} found. Opened the first match.`, '⌕');
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

  const activateStudy = async () => {
    const textbookId = activeBook?.textbookId || currentTextbookId();
    localStore.setItem(BOOK_MODE_KEY, 'study');
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
        zoom,
        destroyed: false,
        renderTasks: new Map(),
        textCache: new Map(),
        searchMatches: [],
        searchIndex: 0,
        searchQuery: '',
      };
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
      localStore.setItem(BOOK_LAYOUT_KEY, activeBook.layout);
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
      if (name === 'search') searchBook(activeBook);
      if (name === 'download') downloadBook(activeBook);
      return;
    }

    const readerAction = event.target.closest?.('[data-reader-action]');
    if (readerAction && activeBook) {
      const name = clean(readerAction.dataset.readerAction).toLowerCase();
      if (name === 'bookmark') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const section = activePageSection(activeBook);
        runtime()?.create?.('bookmark', {
          textbookId: activeBook.textbookId,
          resourceId: activeBook.textbookId,
          sectionId: section.sectionId,
          blockId: section.blockId,
          contentVersion: activeBook.contentVersion,
          label: `Page ${activeBook.pageNumber}`,
          sectionTitle: `Page ${activeBook.pageNumber}`,
        }).then(() => {
          toast(`Page ${activeBook.pageNumber} bookmarked.`, '★');
          applyBookAnnotations(activeBook);
        }).catch((error) => toast(error?.message || 'Bookmark could not be saved.', '!'));
        return;
      }
      if (name === 'progress') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setBookPage(activeBook.pageNumber + (activeBook.layout === 'spread' ? 2 : 1));
        toast(`Reading progress saved at page ${activeBook.pageNumber}.`, '✓');
        return;
      }
      if (['highlight', 'underline', 'note', 'doubt', 'flashcard', 'revision'].includes(name)) {
        window.setTimeout(() => applyBookAnnotations(activeBook), 900);
        window.setTimeout(() => applyBookAnnotations(activeBook), 1800);
      }
    }
  }, true);

  document.addEventListener('change', (event) => {
    const input = event.target.closest?.('[data-intellibook-page-input]');
    if (input && activeBook) setBookPage(Number(input.value));
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!activeBook || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setBookPage(activeBook.pageNumber - (activeBook.layout === 'spread' ? 2 : 1));
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setBookPage(activeBook.pageNumber + (activeBook.layout === 'spread' ? 2 : 1));
    }
  });

  let touchStartX = null;
  document.addEventListener('touchstart', (event) => {
    if (!activeBook || activeBook.layout === 'scroll') return;
    touchStartX = event.touches?.[0]?.clientX ?? null;
  }, { passive: true });
  document.addEventListener('touchend', (event) => {
    if (!activeBook || activeBook.layout === 'scroll' || touchStartX == null) return;
    const endX = event.changedTouches?.[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 48) return;
    setBookPage(activeBook.pageNumber + (delta < 0 ? 1 : -1));
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!activeBook) return;
    const nextLayout = normalizeLayout(activeBook.layout);
    if (nextLayout !== activeBook.layout) activeBook.layout = nextLayout;
    window.clearTimeout(activeBook.resizeTimer);
    activeBook.resizeTimer = window.setTimeout(() => renderBookSurface(activeBook), 180);
  });

  mutationObserver = new MutationObserver(scheduleSync);
  mutationObserver.observe(document.body || document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'data-intellitext-drawer', 'data-intellitext-content-version'],
  });

  window.addEventListener('aspirenest:student-runtime-ready', scheduleSync);
  window.setTimeout(scheduleSync, 40);
})();

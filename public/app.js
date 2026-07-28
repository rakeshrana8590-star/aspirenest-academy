(() => {
  'use strict';

  const ASPIRENEST_LAUNCH_SCOPE_ROUTE_BRIDGE='P14_G18_M5_A2';

  const FOUNDER_APPROVED_INTELLITEXT_DRAWER = true;
  const FOUNDER_APPROVED_INTELLITEXT_DUAL_MODE = true;

  window.__aspirenestRole = window.__aspirenestRole || 'student';

  const activeExperience = () => String(window.__aspirenestActiveExperience || window.__aspirenestRequestedExperience || 'student').toLowerCase();
  const isStudentExperienceActive = () => activeExperience() === 'student' && !window.__aspirenestExperienceRole && window.__aspirenestRole !== 'admin';

  const memoryStorage = Object.create(null);
  const storage = {
    getItem(key) { try { return window.localStorage.getItem(key); } catch (_) { return Object.prototype.hasOwnProperty.call(memoryStorage,key) ? memoryStorage[key] : null; } },
    setItem(key,value) { try { window.localStorage.setItem(key,String(value)); } catch (_) { memoryStorage[key]=String(value); } },
    removeItem(key) { try { window.localStorage.removeItem(key); } catch (_) { delete memoryStorage[key]; } }
  };
  window.__aspirenestStorage = storage;

  const STORAGE = {
    saved: 'aspirenest_student_saved_v8',
    revision: 'aspirenest_student_revision_v8',
    progress: 'aspirenest_student_progress_v8',
    view: 'aspirenest_student_view_v8',
    theme: 'aspirenest_student_theme_v8'
  };

  const parentAreas = [
    { id:'home', label:'Home', icon:'⌂' },
    { id:'learning', label:'Learning', icon:'▦' },
    { id:'mentor', label:'Mentor', icon:'◉' },
    { id:'live', label:'Live', icon:'◉' },
    { id:'success', label:'Success', icon:'↗' },
    { id:'help', label:'Help', icon:'?' }
  ];

  const contextMap = {
    home: [
      ['overview','Overview','⌂'],['continue','Continue Learning','▶'],['today','Today’s Learning','☀'],['my-access','My Access','✓',7],['recent','Recent','↻',5],['recommended','Recommended','✦']
    ],
    learning: [
      ['library','All Learning','▦',15],['my-access','My Access','✓',7],['subjects','Subjects','▣',7],['notes','Notes','▤',6],['videos','Videos','▶',3],['practice','Practice','◇',3],['current-affairs','Current Affairs','◎',2],['roadmaps','Roadmaps','⇢',1],['assigned','Assigned','☑',4],['recent','Recent','↻',5],['saved','Saved','★']
    ],
    mentor: [
      ['overview','Mentor Home','◉'],['assignments','Assignments','☑',3],['ask','Ask a Question','?'],['guidance','Guidance History','↻'],['access','Access Discussion','⊙']
    ],
    live: [
      ['upcoming','Upcoming','◷',2],['join','Join Live','●'],['calendar','Calendar','▦'],['replays','Replays','▶',3],['attendance','Attendance','✓']
    ],
    success: [
      ['overview','Progress','↗'],['results','Results','✓',4],['history','History','↻'],['leaderboard','Leaderboard','♛'],['achievements','Achievements','★'],['wall','Success Wall','✦']
    ],
    help: [
      ['support','Support','?'],['faqs','FAQs','▤'],['access-help','Access & Plan Help','⊙'],['contact','Contact','✉'],['privacy','Privacy','◉'],['account-help','Account Help','⚙']
    ]
  };

  let subjects = [];
  let resources = [];
  let studentLive = {
    ready:false,loading:true,profile:{},grants:[],assignments:[],questions:[],liveSessions:[],results:[],sourceErrors:{},sourceStatus:{},sourceCounts:{}
  };

  const state = {
    parent:'home',
    context:'overview',
    query:'',
    accessFilter:'all',
    subjectFilter:'all',
    typeFilter:'all',
    view:storage.getItem(STORAGE.view) || 'grid',
    saved:new Set(JSON.parse(storage.getItem(STORAGE.saved) || '[]')),
    revision:new Set(JSON.parse(storage.getItem(STORAGE.revision) || '[]')),
    openMenu:null,
    workspaceTab:'overview',
    selectedSubject:'cdp',
    readerProgress:Number(storage.getItem(STORAGE.progress) || 68),
    readerResourceId:'',
    readerReturnHash:'#learning/notes',
    readerMode:String(storage.getItem('aspirenest:intellitext:reader-mode:v1') || 'side').toLowerCase()==='full'?'full':'side'
  };

  let intelliTextDrawerContext = null;


  const els = {
    app:document.getElementById('app'),
    parentNav:document.getElementById('parentNav'),
    contextNav:document.getElementById('contextNav'),
    contextTitle:document.getElementById('contextTitle'),
    contextEyebrow:document.getElementById('contextEyebrow'),
    page:document.getElementById('pageContent'),
    search:document.getElementById('globalSearch'),
    drawer:document.getElementById('detailDrawer'),
    sheet:document.getElementById('sheet'),
    overlay:document.getElementById('overlay'),
    toast:document.getElementById('toastRegion'),
    mobileDock:document.getElementById('mobileDock'),
    mobileContext:document.getElementById('mobileContextStrip'),
    contextRail:document.querySelector('.context-rail')
  };

  const typeIcon = {note:'▤',video:'▶',test:'◇','current-affairs':'◎',roadmap:'⇢',live:'●',replay:'↺'};
  const typeLabel = {note:'Note',video:'Video',test:'Mock Test','current-affairs':'Current Affairs',roadmap:'Roadmap',live:'Live Class',replay:'Replay'};
  const stateLabel = {open:'Open',partial:'My Access',locked:'Locked',expired:'Expired'};
  const isAdminReviewSession = () => String(window.__aspirenestAuthSession?.role || '').toLowerCase() === 'admin';
  const subjectName = id => (subjects.find(s => s.id === id) || {}).name || id;
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function persist() {
    storage.setItem(STORAGE.saved, JSON.stringify([...state.saved]));
    storage.setItem(STORAGE.revision, JSON.stringify([...state.revision]));
    storage.setItem(STORAGE.view, state.view);
    storage.setItem(STORAGE.progress, String(state.readerProgress));
  }

  function liveCount(parent,id) {
    if (parent==='home'&&id==='my-access') return resources.filter(r=>['open','partial'].includes(r.state)).length;
    if (parent==='home'&&id==='recent') return resources.filter(r=>r.recent).length;
    if (parent==='learning') {
      if (id==='library') return resources.length;if (id==='my-access') return resources.filter(r=>['open','partial'].includes(r.state)).length;
      if (id==='subjects') return subjects.length;if (id==='notes') return resources.filter(r=>r.type==='note').length;
      if (id==='videos') return resources.filter(r=>['video','replay','live'].includes(r.type)).length;if (id==='practice') return resources.filter(r=>r.type==='test').length;
      if (id==='current-affairs') return resources.filter(r=>r.type==='current-affairs').length;if (id==='roadmaps') return resources.filter(r=>r.type==='roadmap').length;
      if (id==='assigned') return studentLive.assignments.length;if (id==='recent') return resources.filter(r=>r.recent).length;
      if (id==='saved') return resources.filter(r=>state.saved.has(r.id)).length;
    }
    if (parent==='mentor'&&id==='assignments') return studentLive.assignments.length;
    if (parent==='mentor'&&id==='guidance') return studentLive.questions.filter(q=>String(q.status).toLowerCase()==='answered').length;
    if (parent==='live'&&id==='upcoming') return studentLive.liveSessions.filter(x=>String(x.status).toLowerCase()==='scheduled').length;
    if (parent==='live'&&id==='replays') return studentLive.liveSessions.filter(x=>x.replayUrl||String(x.status).toLowerCase()==='replay').length;
    if (parent==='success'&&id==='results') return studentLive.results.length;
    return null;
  }
  function applyStudentLiveData(next={}) {
    studentLive={...studentLive,...next};
    if(next.ready===true){resources=Array.isArray(next.resources)?next.resources:[];subjects=Array.isArray(next.subjects)?next.subjects:[];}
    else if(next.loading===true&&!studentLive.ready){resources=[];subjects=[];}
    if(isStudentExperienceActive()){renderNav();renderPage();if(state.readerResourceId&&studentLive.ready)queueMicrotask(()=>renderIntelliTextReader(state.readerResourceId));}
  }
  window.addEventListener('aspirenest:student-live-data',event=>applyStudentLiveData(event.detail||{}));
  queueMicrotask(()=>{if(window.__aspirenestStudentLiveData)applyStudentLiveData(window.__aspirenestStudentLiveData);});
  function studentDisplayName(){const session=window.__aspirenestAuthSession||{};return String(session.displayName||studentLive.profile?.name||session.email||'Learner').trim();}
  function studentGreetingName(){const parts=studentDisplayName().split(/\s+/).filter(Boolean);if(!parts.length)return 'Learner';if(/^(dr\.?|mr\.?|mrs\.?|ms\.?)$/i.test(parts[0])&&parts[1])return `${parts[0]} ${parts[1]}`;return parts[0];}
  function liveEmpty(title,copy){return `<div class="empty-state"><div class="empty-icon">⌕</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></div>`;}
  const launchScopeRouteMap = Object.freeze({
    '/ctet-tet/notes':['learning','notes'],
    '/ctet-tet/videos':['learning','videos'],
    '/ctet-tet/mock-tests':['learning','practice'],
    '/ctet-tet/mock-tests/history':['success','history'],
    '/ctet-tet/current-affairs':['learning','current-affairs'],
    '/ctet-tet/roadmaps':['learning','roadmaps'],
    '/my-aspirepath':['learning','roadmaps'],
    '/ctet-tet/my-access':['learning','my-access'],
    '/my-access':['learning','my-access'],
    '/leaderboard':['success','leaderboard'],
    '/student-dashboard':['success','progress'],
    '/assignments':['mentor','assignments']
  });
  const deferredModulePrefixes = Object.freeze([
    '/ctet-tet/videos/',
    '/ctet-tet/mock-tests/',
    '/ctet-tet/current-affairs/',
    '/ctet-tet/roadmaps/'
  ]);
  function handleLaunchScopeRoute(route){
    const target=String(route||'').replace(/\/+$/,'')||'/';
    const mapped=launchScopeRouteMap[target];
    if(mapped){navigate(mapped[0],mapped[1]);return true;}
    if(target.startsWith('/ctet-tet/notes/read/'))return false;
    if(deferredModulePrefixes.some(prefix=>target.startsWith(prefix))){
      toast('This full workspace is being connected to the new Learning Drive. Existing data and routes remain preserved.','↗');
      return true;
    }
    return false;
  }
  function goCanonical(route){
    const target=String(route||'');
    if(!target.startsWith('/'))return;
    if(handleLaunchScopeRoute(target))return;
    window.location.assign(target);
  }
  function platformRequest(action,payload={},successMessage='Live operation completed.'){
    const requestId=`platform-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.dispatchEvent(new CustomEvent('aspirenest:platform-live-action',{detail:{requestId,action,payload,successMessage}}));return requestId;
  }
  window.addEventListener('aspirenest:platform-live-action-result',event=>{const detail=event.detail||{};if(!String(detail.action||'').startsWith('student-'))return;if(detail.ok){closeTransient();toast(detail.message||'Live operation completed.','✓');}else toast(detail.error||'Live operation failed.','!');});

  function navigate(parent, context) {
    const canonicalReader = ensureCanonicalIntelliTextReaderHash();

    if (
      canonicalReader &&
      parent === 'home' &&
      (context || 'overview') === 'overview'
    ) {
      state.readerResourceId = canonicalReader.textbookId;
      state.readerMode = canonicalReader.mode;
      routeFromHash();
      return;
    }

    state.readerResourceId='';
    intelliTextDrawerContext=null;
    delete els.drawer.dataset.intellitextDrawer;
    delete els.drawer.dataset.intellitextMode;
    delete els.drawer.dataset.intellitextSectionCount;
    delete els.drawer.dataset.intellitextBlockCount;
    delete els.drawer.dataset.intellitextContentVersion;
    window.__aspirenestActiveExperience='student';
    window.__aspirenestExperienceRole=null;
    state.parent = parent;
    state.context = context || contextMap[parent][0][0];
    state.openMenu = null;
    closeTransient();
    renderNav();
    renderPage();
    history.replaceState(null,'',`#${parent}/${state.context}`);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderNav() {
    els.parentNav.innerHTML = parentAreas.map(item => `
      <button class="rail-link ${state.parent===item.id?'active':''}" data-parent="${item.id}" aria-current="${state.parent===item.id?'page':'false'}">
        <span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-label">${item.label}</span>
      </button>`).join('');
    els.mobileDock.innerHTML = parentAreas.map(item => `
      <button class="${state.parent===item.id?'active':''}" data-parent="${item.id}" aria-current="${state.parent===item.id?'page':'false'}">
        <span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span>
      </button>`).join('');
    const area = parentAreas.find(x => x.id === state.parent);
    els.contextTitle.textContent = area.label;
    els.contextEyebrow.textContent = state.parent === 'learning' ? 'Learning Library' : 'Learning OS';
    const items = contextMap[state.parent];
    els.contextNav.innerHTML = items.map(([id,label,icon]) => { const count=liveCount(state.parent,id); return `
      <button class="context-link ${state.context===id?'active':''}" data-context="${id}" aria-current="${state.context===id?'page':'false'}">
        <span class="context-icon" aria-hidden="true">${icon}</span><span>${label}</span>${count!==null&&count!==undefined?`<span class="count">${count}</span>`:''}
      </button>`; }).join('');
    els.mobileContext.innerHTML = items.slice(0,8).map(([id,label]) => `<button class="${state.context===id?'active':''}" data-context="${id}">${label}</button>`).join('');
    els.app.dataset.view = state.view;
  }

  function heading(title, description, actions='') {
    return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;
  }

  function renderPage() {
    if (state.parent === 'home') renderHome();
    else if (state.parent === 'learning') renderLearning();
    else if (state.parent === 'mentor') renderMentor();
    else if (state.parent === 'live') renderLive();
    else if (state.parent === 'success') renderSuccess();
    else renderHelp();
  }

  function renderHome() {
    if(studentLive.loading&&!studentLive.ready){els.page.innerHTML=`<div class="page-shell">${heading('Connecting your Learning Drive','Loading real resources, access, assignments, results and mentor guidance.')}${liveEmpty('Loading live learning data','Your verified workspace will appear as soon as Firebase sources respond.')}</div>`;return;}
    const continueItem=resources.find(r=>r.progress>0&&r.state==='open')||resources.find(r=>r.assigned&&r.state==='open')||resources.find(r=>r.state==='open');
    const recent=resources.filter(r=>r.recent||r.assigned).slice(0,6);const assignments=studentLive.assignments.filter(a=>!['reviewed','completed'].includes(String(a.status).toLowerCase()));
    const sessions=studentLive.liveSessions.filter(x=>['scheduled','live'].includes(String(x.status).toLowerCase())).slice(0,2);
    const continueCard=continueItem?`<article class="continue-card"><div class="continue-copy"><span class="eyebrow">Continue Learning</span><h2>${escapeHtml(continueItem.title)}</h2><p>${escapeHtml(continueItem.description||continueItem.subtitle)}</p><div class="progress-line" aria-label="${continueItem.progress} percent complete"><span style="width:${continueItem.progress}%"></span></div><div class="continue-meta"><span>${typeIcon[continueItem.type]||'▤'} ${typeLabel[continueItem.type]||'Resource'}</span><span>${escapeHtml(continueItem.subjectName||subjectName(continueItem.subject))}</span><span>${continueItem.progress}% complete</span><span>${escapeHtml(continueItem.duration)}</span></div><div class="continue-actions"><button class="primary-button" data-open="${continueItem.id}">Continue</button><button class="secondary-button" data-action="details" data-id="${continueItem.id}">View details</button></div></div><div class="book-visual" aria-hidden="true"><div class="book-cover"><small>AspireNest Learning Drive</small><strong>${escapeHtml(continueItem.chapter||continueItem.subjectName||'Learning')}</strong><span>${escapeHtml(continueItem.plan)} resource</span></div></div></article>`:`<article class="continue-card"><div class="continue-copy"><span class="eyebrow">Learning Drive</span><h2>No accessible resource yet</h2><p>Published resources will appear here according to your real entitlement state.</p><div class="continue-actions"><button class="primary-button" data-go="learning/library">Browse Learning</button><button class="secondary-button" data-go="learning/my-access">Open My Access</button></div></div></article>`;
    const sessionRows=sessions.map(x=>`<div class="upcoming-item"><span class="date-badge">${new Date(x.startsAt||Date.now()).getDate()}</span><div><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.when)} • ${escapeHtml(x.status)}</small></div></div>`).join('')||'<p>No scheduled live session.</p>';
    els.page.innerHTML=`<div class="page-shell">${heading(`Welcome back, ${escapeHtml(studentGreetingName())}`,'Resume real learning, assignments and access from one connected workspace.',`<button class="secondary-button" data-go="learning/library">Browse Learning</button><button class="primary-button" data-go="learning/my-access">Open My Access</button>`)}<section class="hero-grid" aria-label="Learning overview">${continueCard}<div class="info-stack"><article class="info-card"><h3>Today’s learning</h3><p>${assignments.length?'Complete your active mentor assignments.':'No active mentor assignment is pending.'}</p><div class="metric">${assignments.length} <small>priority task${assignments.length===1?'':'s'}</small></div></article><article class="info-card"><h3>Upcoming</h3><div class="upcoming-list">${sessionRows}</div></article></div></section>${subjectSection()}<section class="section"><div class="section-header"><div><h2>Suggested resources</h2><p>Real assigned, recent and accessible learning items.</p></div><button class="text-button" data-go="learning/library">View all</button></div>${recent.length?resourceGrid(recent):liveEmpty('No suggested resources','Published resources matching this account will appear here.')}</section></div>`;
  }

  function subjectSection() {
    return `<section class="section"><div class="section-header"><div><h2>Suggested subjects</h2><p>Open a subject workspace containing learn, practice, revision and roadmap.</p></div><button class="text-button" data-go="learning/subjects">All subjects</button></div>${subjects.length?`<div class="subject-grid">${subjects.slice(0,5).map(subjectCard).join('')}</div>`:liveEmpty('No live subjects yet','Published content will create subject workspaces automatically.')}</section>`;
  }

  function subjectCard(s) {
    return `<button class="subject-card" data-subject="${s.id}" style="--subject-tint:${s.tint};--subject-accent:${s.accent}"><span class="subject-icon" aria-hidden="true">${s.icon}</span><strong>${s.name}</strong><small>${s.items} resources • ${s.progress}% progress</small><span class="mini-progress" aria-hidden="true"><span style="width:${s.progress}%"></span></span></button>`;
  }

  function renderLearning() {
    if (state.context === 'my-access') return renderMyAccess();
    if (state.context === 'subjects') return renderSubjects();
    if (['notes','videos','practice','current-affairs','roadmaps','assigned','recent','saved'].includes(state.context)) {
      const mapType = {notes:'note',videos:'video',practice:'test','current-affairs':'current-affairs',roadmaps:'roadmap'};
      state.typeFilter = mapType[state.context] || 'all';
      if (state.context === 'assigned') state.accessFilter = 'assigned';
      else if (state.context === 'recent') state.accessFilter = 'recent';
      else if (state.context === 'saved') state.accessFilter = 'saved';
    } else {
      if (!['assigned','recent','saved'].includes(state.accessFilter)) state.accessFilter = state.accessFilter || 'all';
    }
    const filtered = getFilteredResources();
    const label = contextMap.learning.find(x => x[0] === state.context)?.[1] || 'All Learning';
    els.page.innerHTML = `<div class="page-shell">
      ${heading(label,'Search and filter the unified library. Plan badges are informational; exact access decides what opens.',`<button class="secondary-button" data-go="learning/my-access">My Access</button><button class="primary-button" data-action="open-search">Search Library</button>`)}
      ${libraryToolbar()}
      <div id="resourceResults" aria-live="polite">${filtered.length ? resourceGrid(filtered) : emptyState()}</div>
    </div>`;
  }

  function libraryToolbar() {
    const accessChips = [['all','All Content'],['access','My Access'],['free','Free'],['assigned','Assigned'],['saved','Saved']];
    const typeChips = [['all','All'],['note','Notes'],['video','Videos'],['test','Practice'],['current-affairs','Current Affairs'],['roadmap','Roadmaps']];
    return `<section class="library-toolbar" aria-label="Learning filters">
      <div class="toolbar-top"><div class="chip-row" aria-label="Access filters">${accessChips.map(([id,label])=>`<button class="filter-chip ${state.accessFilter===id?'active':''}" data-access-filter="${id}">${label}</button>`).join('')}</div><div class="view-toggle" aria-label="View options"><button data-view="list" class="${state.view==='list'?'active':''}" aria-label="List view">☷</button><button data-view="grid" class="${state.view==='grid'?'active':''}" aria-label="Grid view">▦</button></div></div>
      <div class="chip-row" aria-label="Content type filters">${typeChips.map(([id,label])=>`<button class="filter-chip ${state.typeFilter===id?'active':''}" data-type-filter="${id}">${label}</button>`).join('')}</div>
      <div class="chip-row" aria-label="Subject filters"><button class="filter-chip ${state.subjectFilter==='all'?'active':''}" data-subject-filter="all">All Subjects</button>${subjects.map(s=>`<button class="filter-chip ${state.subjectFilter===s.id?'active':''}" data-subject-filter="${s.id}">${s.short}</button>`).join('')}</div>
    </section>`;
  }

  function getFilteredResources() {
    let list = [...resources];
    const q = state.query.trim().toLowerCase();
    if (q) list = list.filter(r => [r.title,r.subtitle,r.chapter,r.description,subjectName(r.subject),r.type].join(' ').toLowerCase().includes(q));
    if (state.typeFilter !== 'all') list = list.filter(r => r.type === state.typeFilter || (state.typeFilter==='video' && ['live','replay'].includes(r.type)));
    if (state.subjectFilter !== 'all') list = list.filter(r => r.subject === state.subjectFilter);
    if (state.accessFilter === 'access') list = list.filter(r => ['open','partial'].includes(r.state));
    if (state.accessFilter === 'free') list = list.filter(r => r.plan === 'Free');
    if (state.accessFilter === 'assigned') list = list.filter(r => r.assigned);
    if (state.accessFilter === 'recent') list = list.filter(r => r.recent);
    if (state.accessFilter === 'saved') list = list.filter(r => state.saved.has(r.id));
    return list;
  }

  function resourceGrid(list) {
    return `<div class="resource-grid">${list.map(resourceCard).join('')}</div>`;
  }

  function resourceCard(r) {
    const saved = state.saved.has(r.id);
    const menu = state.openMenu === r.id ? `<div class="card-menu" role="menu"><button data-open="${r.id}">↗ Open</button><button data-action="save" data-id="${r.id}">${saved?'★ Remove saved':'☆ Save'}</button><button data-action="revision" data-id="${r.id}">↻ Add to Revision</button><button data-action="mentor" data-id="${r.id}">? Ask Mentor</button><button data-action="details" data-id="${r.id}">ⓘ View details</button></div>` : '';
    return `<article class="resource-card" data-resource-card="${r.id}">
      <div class="resource-thumb" style="--thumb-start:${thumbStart(r.type)};--thumb-end:${thumbEnd(r.type)}">
        <span class="resource-type-icon" aria-hidden="true">${typeIcon[r.type]||'▤'}</span>
        <span class="state-badge ${r.state}">${stateLabel[r.state]}</span>
      </div>
      <div class="resource-body">
        <div class="resource-meta"><small>${typeLabel[r.type]} • ${escapeHtml(subjectName(r.subject))}</small><span class="plan-badge">${escapeHtml(r.plan)}</span></div>
        <h3 class="resource-title"><button class="resource-title-button" data-open="${r.id}" aria-label="Open ${escapeHtml(r.title)}">${highlight(r.title)}</button></h3><p class="resource-subtitle">${highlight(r.subtitle)}</p>
        <div class="resource-progress" aria-label="${r.progress} percent complete"><span style="width:${r.progress}%"></span></div>
      </div>
      <footer class="resource-footer"><small>${escapeHtml(r.duration)}</small><div class="card-actions"><button class="card-icon-button ${saved?'saved':''}" data-action="save" data-id="${r.id}" aria-label="${saved?'Remove from saved':'Save resource'}">${saved?'★':'☆'}</button><button class="card-icon-button" data-menu="${r.id}" aria-label="More actions" aria-expanded="${state.openMenu===r.id}">⋮</button></div></footer>
      ${menu}
    </article>`;
  }

  function thumbStart(type){ return ({note:'#dce8ff',video:'#e7f7f1',test:'#fff0e4','current-affairs':'fff3dc',roadmap:'#ece8ff',replay:'#e4f4ff'})[type] || '#e7edf5'; }
  function thumbEnd(type){ return ({note:'#fff6e8',video:'#edf6ff',test:'#ffe9ef','current-affairs':'#fff8e8',roadmap:'#fff0ea',replay:'#f6efff'})[type] || '#f8fafc'; }
  function highlight(text){
    const q = state.query.trim();
    if (!q) return escapeHtml(text);
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return escapeHtml(text).replace(new RegExp(`(${safe})`,'ig'),'<mark class="search-highlight">$1</mark>');
  }
  function emptyState(){ return `<div class="empty-state"><div class="empty-icon">⌕</div><h3>No matching resources</h3><p>Try a different search, subject or access filter. Protected resources are never hidden by an authorization error.</p><button class="secondary-button" data-action="clear-filters">Clear filters</button></div>`; }

  function renderMyAccess() {
    const open = resources.filter(r => r.state === 'open').slice(0,5);
    const special = resources.filter(r => r.state === 'partial');
    const assigned = resources.filter(r => r.assigned).slice(0,4);
    const expiring = resources.filter(r => r.state === 'expired');
    els.page.innerHTML = `<div class="page-shell">
      ${heading('My Access','Exactly what this account can open — whether access came from a plan, module, bundle or one exact item.',`<button class="secondary-button" data-go="learning/library">Browse all</button><button class="primary-button" data-action="access-help">Access help</button>`)}
      <div class="access-groups">
        ${accessGroup('Active plans & modules','Mapped resources currently available',open,'✓')}
        ${accessGroup('Special access','Exact item or curated bundle grants',special,'✦')}
        ${accessGroup('Assigned resources','Mentor or roadmap tasks visible now',assigned,'☑')}
        ${accessGroup('Expiring or expired','Renewal and history remain clear',expiring,'◷')}
      </div>
    </div>`;
  }

  function accessGroup(title,subtitle,list,icon) {
    return `<section class="access-group"><div class="access-group-header"><div><h2>${title}</h2><span>${subtitle}</span></div><span>${list.length} item${list.length===1?'':'s'}</span></div><div class="access-strip">${list.map(r=>`<button class="access-card" data-open="${r.id}"><span class="access-card-icon">${icon}</span><span><strong>${escapeHtml(r.title)}</strong><p>${escapeHtml(r.plan)} • ${escapeHtml(r.duration)}</p><small>${r.state==='expired'?'Access expired — renewal available':r.state==='partial'?'Exact-item access':'Active access'}</small></span></button>`).join('') || '<div class="empty-state"><p>No items in this group.</p></div>'}</div></section>`;
  }

  function renderSubjects() {
    els.page.innerHTML = `<div class="page-shell">${heading('Subjects','Each subject is one workspace — notes, videos, practice, revision and roadmap stay together.',`<button class="secondary-button" data-go="learning/library">All resources</button>`)}<div class="subject-grid">${subjects.map(subjectCard).join('')}</div></div>`;
  }

  function renderSubjectWorkspace(subjectId) {
    state.selectedSubject = subjectId;
    const s = subjects.find(x => x.id === subjectId) || subjects[0];
    const list = resources.filter(r => r.subject === subjectId);
    els.page.innerHTML = `<div class="page-shell">
      <section class="workspace-hero"><div><span class="eyebrow">Subject Workspace</span><h1>${escapeHtml(s.name)}</h1><p>Continue, learn, practise, revise and follow the roadmap without repeatedly passing through plan screens.</p><div class="page-actions" style="margin-top:18px"><button class="primary-button" data-open="${list[0]?.id || ''}">Continue subject</button><button class="secondary-button" data-go="learning/my-access">Check access</button></div></div><div class="workspace-stats"><div class="stat-tile"><strong>${s.progress}%</strong><small>Overall progress</small></div><div class="stat-tile"><strong>${list.length}</strong><small>Visible resources</small></div><div class="stat-tile"><strong>${list.filter(r=>r.assigned).length}</strong><small>Assignments</small></div><div class="stat-tile"><strong>${list.filter(r=>r.state==='open').length}</strong><small>Open now</small></div></div></section>
      <div class="tab-bar" role="tablist">${['overview','learn','practice','revision','roadmap'].map(tab=>`<button class="${state.workspaceTab===tab?'active':''}" data-workspace-tab="${tab}">${tab[0].toUpperCase()+tab.slice(1)}</button>`).join('')}</div>
      <div id="workspaceBody">${workspaceBody(s,list)}</div>
    </div>`;
  }

  function workspaceBody(subject,list) {
    if (state.workspaceTab === 'overview') return `<div class="dashboard-grid"><article class="dashboard-card"><h3>Continue</h3><p>Resume the latest real resource in this subject.</p>${list.length?resourceGrid(list.slice(0,1)):liveEmpty('No resource','No published item in this subject.')}</article><article class="dashboard-card"><h3>Mentor assignments</h3><div class="dashboard-list">${list.filter(r=>r.assigned).slice(0,3).map(r=>`<button class="dashboard-list-item" data-open="${r.id}"><span><strong>${escapeHtml(r.title)}</strong><small>${escapeHtml(r.assignmentDue||r.duration)}</small></span><span>→</span></button>`).join('') || '<p>No current assignment.</p>'}</div></article><article class="dashboard-card"><h3>Practice</h3><p>${list.filter(r=>r.type==='test').length} published test${list.filter(r=>r.type==='test').length===1?'':'s'} in this workspace.</p>${list.find(r=>r.type==='test')?`<button class="secondary-button" data-open="${list.find(r=>r.type==='test').id}">Open test</button>`:''}</article></div>`;
    if (state.workspaceTab === 'learn') return list.filter(r=>['note','video','replay','live'].includes(r.type)).length?resourceGrid(list.filter(r=>['note','video','replay','live'].includes(r.type))):liveEmpty('No learning resources','No note or video is published for this subject.');
    if (state.workspaceTab === 'practice') return list.filter(r=>r.type==='test').length?resourceGrid(list.filter(r=>r.type==='test')):liveEmpty('No practice resource','No mock test is published for this subject.');
    if (state.workspaceTab === 'revision') return list.filter(r=>state.saved.has(r.id) || state.revision.has(r.id)).length?resourceGrid(list.filter(r=>state.saved.has(r.id) || state.revision.has(r.id))):liveEmpty('Revision queue is empty','Save a real resource for revision.');
    const roadmaps=list.filter(r=>r.type==='roadmap');return roadmaps.length?resourceGrid(roadmaps):liveEmpty('No roadmap published','A published roadmap will appear here automatically.');
  }

  function renderMentor() {
    const assignments=studentLive.assignments||[];const questions=studentLive.questions||[];const active=assignments.filter(x=>!['completed','reviewed'].includes(String(x.status).toLowerCase()));const openQuestions=questions.filter(x=>String(x.status).toLowerCase()==='open');
    els.page.innerHTML=`<div class="page-shell">${heading('Mentor guidance','Real assignments, learner questions and access discussion connected to Dr. Varsha Maru.',`<button class="primary-button" data-action="mentor-question">Ask a Question</button>`)}<div class="dashboard-grid"><article class="dashboard-card"><h3>Active assignments</h3><div class="dashboard-list">${active.map(a=>`<div class="dashboard-list-item"><span><strong>${escapeHtml(a.title)}</strong><small>${escapeHtml(a.due)} • ${escapeHtml(a.status)}</small></span>${String(a.status).toLowerCase()==='assigned'?`<button class="secondary-button" data-action="complete-assignment" data-id="${a.id}">Mark complete</button>`:`<span class="state-badge open">${escapeHtml(a.status)}</span>`}</div>`).join('')||'<p>No active assignment.</p>'}</div></article><article class="dashboard-card"><h3>Questions</h3><p>${openQuestions.length?`${openQuestions.length} question${openQuestions.length===1?'':'s'} awaiting guidance.`:'No question is awaiting guidance.'}</p><div class="dashboard-list">${questions.slice(0,3).map(q=>`<div class="dashboard-list-item"><span><strong>${escapeHtml(q.title)}</strong><small>${escapeHtml(q.time)} • ${escapeHtml(q.status)}</small></span></div>`).join('')}</div><button class="secondary-button" data-action="mentor-question">Ask Mentor</button></article><article class="dashboard-card"><h3>Access discussion</h3><p>Locked resources keep the exact resource identity when you ask your mentor for guidance.</p><button class="secondary-button" data-go="learning/library">Browse resources</button></article></div></div>`;
  }

  function renderLive() {
    const sessions=studentLive.liveSessions||[];const upcoming=sessions.filter(x=>['scheduled','live'].includes(String(x.status).toLowerCase()));const replays=sessions.filter(x=>x.replayUrl||String(x.status).toLowerCase()==='replay');
    els.page.innerHTML=`<div class="page-shell">${heading('Live learning','Real scheduled sessions, join links and permitted replays.',upcoming[0]?.joinUrl?`<button class="primary-button" data-action="join-live" data-id="${upcoming[0].id}">Join next session</button>`:'')}<div class="dashboard-grid"><article class="dashboard-card"><h3>Upcoming sessions</h3><div class="dashboard-list">${upcoming.map(x=>`<div class="dashboard-list-item"><span><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.when)} • ${escapeHtml(x.status)}</small></span>${x.joinUrl?`<button class="secondary-button" data-action="join-live" data-id="${x.id}">Join</button>`:''}</div>`).join('')||'<p>No live session is currently scheduled.</p>'}</div></article><article class="dashboard-card"><h3>Permitted replays</h3><div class="dashboard-list">${replays.map(x=>`<button class="dashboard-list-item" data-action="open-session" data-id="${x.id}"><span><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.when)}</small></span><span>▶</span></button>`).join('')||'<p>No replay is available.</p>'}</div></article><article class="dashboard-card"><h3>Session access</h3><p>Join and replay availability are read from real Mentor session records.</p><div class="metric">${sessions.length}</div></article></div></div>`;
  }

  function renderSuccess() {
    const results=studentLive.results||[];const latest=results[0];const completed=resources.filter(r=>Number(r.progress)>=100).length;const avg=resources.length?Math.round(resources.reduce((sum,r)=>sum+Number(r.progress||0),0)/resources.length):0;
    els.page.innerHTML=`<div class="page-shell">${heading('Success & progress','Real owned results, learning progress and protected review routes.',`<button class="secondary-button" data-go="learning/practice">Practice now</button>`)}<div class="dashboard-grid"><article class="dashboard-card"><h3>Learning progress</h3><div class="metric">${avg}%</div><p>${completed} resource${completed===1?'':'s'} completed.</p></article><article class="dashboard-card"><h3>Latest result</h3>${latest?`<div class="metric">${Math.round(latest.percentage||0)}%</div><p>${escapeHtml(latest.title)}</p><button class="secondary-button" data-action="result" data-id="${latest.id}">View result</button>`:'<p>No owned mock-test result is available yet.</p>'}</article><article class="dashboard-card"><h3>Result history</h3><p>${results.length} owned result${results.length===1?'':'s'} connected to this account.</p><button class="secondary-button" data-action="result-history">Open history</button></article></div></div>`;
  }

  function renderHelp() {
    els.page.innerHTML=`<div class="page-shell">${heading('Help & support','Resolve access, technical and account issues without raw permission errors or dead ends.',`<button class="primary-button" data-action="contact-support">Contact support</button>`)}<div class="dashboard-grid"><article class="dashboard-card"><h3>Access & plan help</h3><p>Understand Open, My Access, Locked and Expired states.</p><button class="secondary-button" data-action="access-help">Open My Access</button></article><article class="dashboard-card"><h3>Frequently asked questions</h3><div class="dashboard-list"><div class="dashboard-list-item"><strong>Why is a resource locked?</strong><span>›</span></div><div class="dashboard-list-item"><strong>How does exact-item access work?</strong><span>›</span></div><div class="dashboard-list-item"><strong>How are private study records protected?</strong><span>›</span></div></div></article><article class="dashboard-card"><h3>Privacy</h3><p>Personal study records remain tied to the authenticated Firebase UID and protected by Firestore rules.</p></article></div></div>`;
  }

  function intelliTextDrawerRuntime() {
    return window.__aspirenestIntelliTextDrawerRuntime || null;
  }

  function waitForIntelliTextDrawerRuntime(timeoutMs = 8000) {
    const ready = intelliTextDrawerRuntime();
    if (ready?.load) return Promise.resolve(ready);

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (value, error = null) => {
        if (settled) return;
        settled = true;
        window.removeEventListener('aspirenest:intellitext-drawer-runtime-ready', onReady);
        window.clearTimeout(timer);
        if (error) reject(error); else resolve(value);
      };
      const onReady = () => {
        const api = intelliTextDrawerRuntime();
        if (api?.load) finish(api);
      };
      const timer = window.setTimeout(
        () => finish(null, new Error('Published IntelliText runtime did not become ready.')),
        timeoutMs
      );
      window.addEventListener('aspirenest:intellitext-drawer-runtime-ready', onReady);
      onReady();
    });
  }

  function normalizeReaderMode(value) {
    return String(value || '').toLowerCase() === 'full' ? 'full' : 'side';
  }

  function setReaderMode(mode, {syncRoute = true} = {}) {
    const normalized = normalizeReaderMode(mode);
    state.readerMode = normalized;
    storage.setItem('aspirenest:intellitext:reader-mode:v1', normalized);
    if (intelliTextDrawerContext) {
      intelliTextDrawerContext.mode = normalized;
      paintIntelliTextDrawer(intelliTextDrawerContext);
    }
    if (syncRoute && state.readerResourceId) {
      const encoded = encodeURIComponent(state.readerResourceId);
      history.replaceState(
        {...(history.state || {}), aspirenestReader:true, resourceId:state.readerResourceId, readerMode:normalized},
        '',
        `/ctet-tet/notes/read/${encoded}#learning/reader/${encoded}/${normalized}`
      );
    }
  }


  const CANONICAL_INTELLITEXT_READER_PREFIX =
    '/ctet-tet/notes/read/';

  function canonicalIntelliTextReaderRoute() {
    const path = String(window.location.pathname || '/')
      .replace(/\/+$/, '') || '/';

    if (!path.startsWith(CANONICAL_INTELLITEXT_READER_PREFIX)) {
      return null;
    }

    const encodedId = path.slice(
      CANONICAL_INTELLITEXT_READER_PREFIX.length
    );

    if (!encodedId || encodedId.includes('/')) {
      return null;
    }

    let textbookId = '';

    try {
      textbookId = decodeURIComponent(encodedId);
    } catch (_) {
      textbookId = encodedId;
    }

    if (!textbookId) {
      return null;
    }

    const parts = String(window.location.hash || '')
      .replace(/^#/, '')
      .split('/')
      .filter(Boolean);
    const hashMode =
      parts[0] === 'learning' &&
      parts[1] === 'reader' &&
      parts[2] === textbookId
        ? parts[3]
        : '';

    return {
      textbookId,
      encodedId: encodeURIComponent(textbookId),
      mode: normalizeReaderMode(hashMode || state.readerMode),
    };
  }

  function ensureCanonicalIntelliTextReaderHash() {
    const route = canonicalIntelliTextReaderRoute();

    if (!route) {
      return null;
    }

    const expectedHash =
      `#learning/reader/${route.encodedId}/${route.mode}`;

    if (window.location.hash !== expectedHash) {
      window.history.replaceState(
        {
          ...(window.history.state || {}),
          aspirenestReader: true,
          resourceId: route.textbookId,
          readerMode: route.mode,
        },
        '',
        `${window.location.pathname}${window.location.search}${expectedHash}`
      );
    }

    return route;
  }

  function readerPayloadText(payload = {}) {
    return String(payload.text || payload.body || payload.content || payload.description || payload.explanation || '').trim();
  }

  function readerPayloadItems(payload = {}) {
    const value = payload.items || payload.points || payload.options || payload.steps || [];
    return Array.isArray(value) ? value : [];
  }

  function readerItemText(item) {
    if (item && typeof item === 'object') {
      return String(item.text || item.label || item.description || item.question || item.date || '').trim();
    }
    return String(item ?? '').trim();
  }

  function readerBlockHtml(block = {}, ctx = {}, section = {}) {
    const type = String(block.type || block.blockType || 'PARAGRAPH').toUpperCase();
    const payload = block.payload || block.content || {};
    const displayMode = String(payload.displayMode || '').toUpperCase();
    if (displayMode.startsWith('SOURCE_METADATA')) return '';
    const text = readerPayloadText(payload);
    const items = readerPayloadItems(payload);
    const title = String(payload.title || payload.term || '').trim();
    const blockId = String(block.blockId || block.id || '').trim();
    const sectionId = readerSectionId(section);
    const attrs = `data-reader-block-id="${escapeHtml(blockId)}" data-intellitext-block="true" data-textbook-id="${escapeHtml(ctx.resource.id)}" data-section-id="${escapeHtml(sectionId)}" data-block-id="${escapeHtml(blockId)}" data-content-version="${ctx.contentVersion}"`;
    const wrap = (html) => html ? `<div class="reader-block" ${attrs}>${html}</div>` : '';
    const list = items.map((item) => `<li>${escapeHtml(readerItemText(item))}</li>`).join('');

    if (displayMode === 'ADAPTIVE_SEQUENCE') {
      const entries = Array.isArray(payload.entries) ? payload.entries : [];
      const sequence = entries.map((entry) => {
        const entryMode = String(entry?.displayMode || '').toUpperCase();

        if (entryMode.startsWith('SOURCE_METADATA')) return '';

        if (entryMode === 'SEMANTIC_GROUP') {
          const semanticItems = Array.isArray(entry?.items) ? entry.items : [];
          return semanticItems.map((item) => {
            const kind = String(item?.kind || 'PARAGRAPH').toUpperCase();
            const fragments = Array.isArray(item?.fragments)
              ? item.fragments.map((value) => String(value || '').trim()).filter(Boolean)
              : [readerItemText(item)].filter(Boolean);
            const body = fragments.join(' ');
            const itemTitle = String(item?.title || '').trim();

            if (kind === 'HEADING') return `<h3 class="reader-block-heading">${escapeHtml(body)}</h3>`;
            if (kind === 'PARAGRAPH') return fragments.map((fragment) => `<p class="reader-block-paragraph">${escapeHtml(fragment)}</p>`).join('');
            if (kind === 'BULLET_LIST') return `<ul class="reader-block-list">${fragments.map((fragment) => `<li>${escapeHtml(fragment)}</li>`).join('')}</ul>`;
            if (['DEFINITION','EXAMPLE','EXAM_POINT','MENTOR_TIP','COMMON_MISTAKE','REVISION_BOX','SUMMARY'].includes(kind)) {
              const label = itemTitle || kind.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' ');
              return `<div class="reader-callout"><strong>${escapeHtml(label)}:</strong><p>${escapeHtml(body)}</p></div>`;
            }
            if (['MCQ','PRACTICE_SET'].includes(kind)) return `<section class="reader-practice"><strong>${escapeHtml(body)}</strong></section>`;
            return body ? `<p class="reader-block-paragraph">${escapeHtml(body)}</p>` : '';
          }).join('');
        }

        if (entryMode === 'TABLE_GALLERY') {
          const tables = Array.isArray(entry?.tables) ? entry.tables : [];
          return tables.map((table, tableIndex) => {
            const headers = Array.isArray(table?.headers) ? table.headers : [];
            const rows = Array.isArray(table?.rows) ? table.rows : [];
            const tableTitle = String(table?.title || `Table ${tableIndex + 1}`).trim();
            return `<section class="reader-table-group">${tableTitle ? `<h4>${escapeHtml(tableTitle)}</h4>` : ''}<div class="reader-table-scroll"><table>${headers.length ? `<thead><tr>${headers.map((cell) => `<th>${escapeHtml(readerItemText(cell))}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map((row) => { const cells = Array.isArray(row) ? row : Object.values(row || {}); return `<tr>${cells.map((cell) => `<td>${escapeHtml(readerItemText(cell))}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div></section>`;
          }).join('');
        }

        if (entryMode === 'SOURCE_REFERENCE_GALLERY') {
          const visuals = Array.isArray(entry?.visuals) ? entry.visuals : [];
          const gallery = visuals.map((visual) => {
            const src = String(visual?.src || '').trim();
            const safe = src.startsWith('https://') || /^data:image\/(jpeg|png|webp);base64,/.test(src);
            return `<figure class="reader-visual">${safe ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(String(visual?.alt || 'Original PDF visual'))}" loading="lazy" />` : `<div class="reader-visual-placeholder">${escapeHtml(String(visual?.type || 'VISUAL'))}</div>`}${visual?.caption || visual?.description ? `<figcaption>${escapeHtml(String(visual.caption || visual.description))}</figcaption>` : ''}</figure>`;
          }).join('');
          return `<details class="reader-source-reference"><summary>View original PDF visual references (${visuals.length})</summary>${gallery}</details>`;
        }

        return '';
      }).join('');

      return wrap(`<div class="reader-adaptive-sequence">${sequence}</div>`);
    }

    if (displayMode === 'SEMANTIC_GROUP') {
      const semantic = items.map((item) => {
        const kind = String(item?.kind || 'PARAGRAPH').toUpperCase();
        const fragments = Array.isArray(item?.fragments)
          ? item.fragments.map((value) => String(value || '').trim()).filter(Boolean)
          : [readerItemText(item)].filter(Boolean);
        const body = fragments.join(' ');
        const itemTitle = String(item?.title || '').trim();

        if (kind === 'HEADING') return `<h3 class="reader-block-heading">${escapeHtml(body)}</h3>`;
        if (kind === 'PARAGRAPH') return fragments.map((fragment) => `<p class="reader-block-paragraph">${escapeHtml(fragment)}</p>`).join('');
        if (kind === 'BULLET_LIST') return `<ul class="reader-block-list">${fragments.map((fragment) => `<li>${escapeHtml(fragment)}</li>`).join('')}</ul>`;
        if (['DEFINITION','EXAMPLE','EXAM_POINT','MENTOR_TIP','COMMON_MISTAKE','REVISION_BOX','SUMMARY'].includes(kind)) {
          const label = itemTitle || kind.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' ');
          return `<div class="reader-callout"><strong>${escapeHtml(label)}:</strong><p>${escapeHtml(body)}</p></div>`;
        }
        if (['MCQ','PRACTICE_SET'].includes(kind)) return `<section class="reader-practice"><strong>${escapeHtml(body)}</strong></section>`;
        return `<p class="reader-block-paragraph">${escapeHtml(body)}</p>`;
      }).join('');
      return wrap(`<div class="reader-semantic-group">${semantic}</div>`);
    }

    if (displayMode === 'TABLE_GALLERY') {
      const tables = Array.isArray(payload.tables) ? payload.tables : [];
      const html = tables.map((table, tableIndex) => {
        const headers = Array.isArray(table?.headers) ? table.headers : [];
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const tableTitle = String(table?.title || `Table ${tableIndex + 1}`).trim();
        return `<section class="reader-table-group">${tableTitle ? `<h4>${escapeHtml(tableTitle)}</h4>` : ''}<div class="reader-table-scroll"><table>${headers.length ? `<thead><tr>${headers.map((cell) => `<th>${escapeHtml(readerItemText(cell))}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map((row) => { const cells = Array.isArray(row) ? row : Object.values(row || {}); return `<tr>${cells.map((cell) => `<td>${escapeHtml(readerItemText(cell))}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div></section>`;
      }).join('');
      return wrap(html);
    }

    if (displayMode === 'SOURCE_REFERENCE_GALLERY') {
      const visuals = Array.isArray(payload.visuals) ? payload.visuals : [];
      const gallery = visuals.map((visual) => {
        const src = String(visual?.src || '').trim();
        const safe = src.startsWith('https://') || /^data:image\/(jpeg|png|webp);base64,/.test(src);
        return `<figure class="reader-visual">${safe ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(String(visual?.alt || 'Original PDF visual'))}" loading="lazy" />` : `<div class="reader-visual-placeholder">${escapeHtml(String(visual?.type || 'VISUAL'))}</div>`}${visual?.caption || visual?.description ? `<figcaption>${escapeHtml(String(visual.caption || visual.description))}</figcaption>` : ''}</figure>`;
      }).join('');
      return wrap(`<details class="reader-source-reference"><summary>View original PDF visual references (${visuals.length})</summary>${gallery}</details>`);
    }

    if (type === 'HEADING') return wrap(`<h3 class="reader-block-heading">${escapeHtml(title || text)}</h3>`);
    if (type === 'PARAGRAPH') return wrap(`<p class="reader-block-paragraph">${escapeHtml(text)}</p>`);
    if (type === 'BULLET_LIST') return wrap(`<ul class="reader-block-list">${list}</ul>`);
    if (type === 'DEFINITION') return wrap(`<div class="reader-callout"><strong>${escapeHtml(title || 'Definition')}:</strong> ${escapeHtml(String(payload.definition || text))}</div>`);
    if (['EXAMPLE','EXAM_POINT','MENTOR_TIP','COMMON_MISTAKE','REVISION_BOX','SUMMARY'].includes(type)) {
      const label = title || type.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' ');
      return wrap(`<div class="reader-callout"><strong>${escapeHtml(label)}:</strong>${list ? `<ul>${list}</ul>` : `<p>${escapeHtml(text)}</p>`}</div>`);
    }
    if (['TABLE','COMPARISON'].includes(type)) {
      const headers = Array.isArray(payload.headers) ? payload.headers : [];
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      if (!rows.length) return wrap(`<p>${escapeHtml(text || 'Table content is unavailable.')}</p>`);
      return wrap(`<div class="reader-table-scroll"><table>${headers.length ? `<thead><tr>${headers.map((cell) => `<th>${escapeHtml(readerItemText(cell))}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map((row) => { const cells = Array.isArray(row) ? row : Object.values(row || {}); return `<tr>${cells.map((cell) => `<td>${escapeHtml(readerItemText(cell))}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>`);
    }
    if (type === 'FORMULA') return wrap(`<div class="reader-formula"><code>${escapeHtml(String(payload.formula || text))}</code>${payload.explanation ? `<p>${escapeHtml(String(payload.explanation))}</p>` : ''}</div>`);
    if (['IMAGE','DIAGRAM','FLOWCHART'].includes(type)) {
      const src = String(payload.src || payload.url || payload.imageUrl || '').trim();
      const safe = src.startsWith('https://') || /^data:image\/(jpeg|png|webp);base64,/.test(src);
      const visual = `<figure class="reader-visual">${safe ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(String(payload.alt || `${type.toLowerCase()} visual`))}" loading="lazy" />` : `<div class="reader-visual-placeholder">${escapeHtml(type)}</div>`}${payload.caption || payload.description ? `<figcaption>${escapeHtml(String(payload.caption || payload.description))}</figcaption>` : ''}</figure>`;
      if (String(payload.displayMode || '').toUpperCase() === 'SOURCE_REFERENCE') {
        return wrap(`<details class="reader-source-reference"><summary>View original PDF visual reference</summary>${visual}</details>`);
      }
      return wrap(visual);
    }
    if (type === 'TIMELINE') return wrap(`<ol class="reader-timeline">${items.map((item, index) => `<li><strong>${escapeHtml(String(item?.label || item?.date || `Step ${index + 1}`))}</strong><span>${escapeHtml(readerItemText(item))}</span></li>`).join('')}</ol>`);
    if (['MCQ','PRACTICE_SET'].includes(type)) return wrap(`<section class="reader-practice"><strong>${escapeHtml(String(payload.question || title || 'Check your understanding'))}</strong><ol>${list}</ol></section>`);
    return wrap(text ? `<p>${escapeHtml(text)}</p>` : '<div class="reader-block-fallback">This approved learning block is not available in this reader version.</div>');
  }

  function readerProgressKey(resourceId) {
    const session = window.__aspirenestAuthSession || {};
    const uid = String(session.uid || session.user?.uid || session.email || 'anonymous').replace(/[^a-zA-Z0-9_.@-]+/g, '_');
    return `aspirenest:intellitext:drawer-progress:v1:${uid}:${String(resourceId).replace(/[^a-zA-Z0-9_.-]+/g, '_')}`;
  }

  function readReaderProgress(resourceId) {
    try { return JSON.parse(storage.getItem(readerProgressKey(resourceId)) || 'null'); }
    catch (_) { return null; }
  }

  function writeReaderProgress(ctx) {
    if (!ctx?.resource?.id || !ctx?.activeSectionId) return;
    const index = Math.max(0, ctx.sections.findIndex((section, i) => readerSectionId(section, i) === String(ctx.activeSectionId)));
    const percent = ctx.sections.length ? Math.round(((index + 1) / ctx.sections.length) * 100) : 0;
    storage.setItem(readerProgressKey(ctx.resource.id), JSON.stringify({
      textbookId:ctx.resource.id,
      sectionId:ctx.activeSectionId,
      contentVersion:ctx.contentVersion,
      progressPercent:percent,
      updatedAt:new Date().toISOString(),
    }));
    state.readerProgress = percent;
    persist();
  }

  function readerSectionId(section = {}, index = 0) {
    return String(section.sectionId || section.id || `section_${index + 1}`);
  }

  function activeReaderSection(ctx = intelliTextDrawerContext) {
    if (!ctx?.sections?.length) return null;
    return ctx.sections.find((section, index) => readerSectionId(section, index) === String(ctx.activeSectionId)) || ctx.sections[0];
  }

  function readerDrawerHtml(ctx, {loading = false, error = ''} = {}) {
    const resource = ctx.resource;
    const published = ctx.published || {};
    const sections = ctx.sections || [];
    const active = activeReaderSection(ctx);
    const title = String(published.title || resource.title || 'AspireNest IntelliText');
    const description = String(published.description || resource.description || resource.subtitle || 'Premium published learning note.');
    const index = Math.max(0, sections.indexOf(active));
    const percent = sections.length ? Math.round(((index + 1) / sections.length) * 100) : Number(resource.progress || 0);
    const toc = sections.map((section, sectionIndex) => {
      const id = readerSectionId(section, sectionIndex);
      return `<button class="${id === ctx.activeSectionId ? 'active' : ''}" data-reader-section="${escapeHtml(id)}">${escapeHtml(String(section.title || `Section ${sectionIndex + 1}`))}</button>`;
    }).join('');
    const blocks = active?.blocks || [];
    const content = loading
      ? '<div class="reader-drawer-state"><div class="reader-drawer-spinner"></div><strong>Loading published IntelliText…</strong><p>The exact approved sections and learning blocks are being connected.</p></div>'
      : error
        ? `<div class="reader-drawer-state is-error"><strong>IntelliText could not load.</strong><p>${escapeHtml(error)}</p><button type="button" class="secondary-button" data-reader-action="retry">Retry</button></div>`
        : `<h2>${escapeHtml(String(active?.title || 'Overview'))}</h2>${active?.summary ? `<p class="reader-section-summary">${escapeHtml(String(active.summary))}</p>` : ''}${blocks.map((block) => readerBlockHtml(block, ctx, active)).join('') || '<p>No learning blocks are available in this section.</p>'}`;

    return `<div class="drawer-header"><strong>AspireNest IntelliText Reader</strong><div class="reader-header-actions"><div class="reader-mode-switch" aria-label="Reader view"><button type="button" class="${ctx.mode === 'side' ? 'active' : ''}" data-reader-mode="side">Side panel</button><button type="button" class="${ctx.mode === 'full' ? 'active' : ''}" data-reader-mode="full">Full screen</button></div><button class="icon-button" data-action="close-drawer" aria-label="Close reader">×</button></div></div><div class="drawer-content"><div class="drawer-hero"><span class="state-badge open">Open • UID-private workspace</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><div class="reader-progress" aria-label="${percent} percent complete"><span id="readerProgressBar" style="width:${percent}%"></span></div></div><div class="reader-toolbar" aria-label="Study tools"><button data-reader-action="highlight">Highlight</button><button data-reader-action="underline">Underline</button><button data-reader-action="note">Personal Note</button><button data-reader-action="doubt">Mark as Doubt</button><button data-reader-action="bookmark">Bookmark</button><button data-reader-action="flashcard">Create Flashcard</button><button data-reader-action="revision">Add to Revision</button></div><div class="reader-shell"><aside class="reader-toc"><strong>Contents</strong>${toc || '<button class="active">Loading…</button>'}</aside><article class="reader-content" id="readerArticle">${content}</article></div><div class="page-actions" style="margin-top:18px"><button class="secondary-button" data-reader-action="progress">Mark section complete</button><button class="primary-button" data-action="close-drawer">Save & close</button></div></div>`;
  }

  function activeReaderAnnotations(ctx = intelliTextDrawerContext) {
    const section = activeReaderSection(ctx);
    const sectionId = readerSectionId(section);
    const annotations = Array.isArray(ctx?.workspace?.annotations)
      ? ctx.workspace.annotations
      : [];
    return annotations.filter((item) => String(item.sectionId || '') === sectionId);
  }

  function applyCurrentReaderAnnotations(ctx = intelliTextDrawerContext) {
    if (!ctx || intelliTextDrawerContext?.token !== ctx.token) return [];
    const runtime = intelliTextDrawerRuntime();
    const rootElement = document.getElementById('readerArticle');
    if (!runtime?.applyAnnotations || !rootElement || !ctx.workspace) return [];
    return runtime.applyAnnotations({
      rootElement,
      annotations:activeReaderAnnotations(ctx),
      contentVersion:ctx.contentVersion,
    });
  }

  async function hydrateIntelliTextWorkspace(ctx = intelliTextDrawerContext) {
    if (!ctx || intelliTextDrawerContext?.token !== ctx.token) return;
    const runtime = intelliTextDrawerRuntime();
    if (!runtime?.loadWorkspace) return;
    try {
      const workspace = await runtime.loadWorkspace(ctx.resource.id);
      if (intelliTextDrawerContext?.token !== ctx.token) return;
      ctx.workspace = workspace;
      applyCurrentReaderAnnotations(ctx);
    } catch (error) {
      ctx.workspaceError = error?.message || 'Private study workspace could not be loaded.';
    }
  }

  function paintIntelliTextDrawer(ctx, options = {}) {
    if (!ctx || intelliTextDrawerContext?.token !== ctx.token) return;
    ctx.mode = normalizeReaderMode(ctx.mode || state.readerMode);
    els.drawer.dataset.intellitextDrawer = 'true';
    els.drawer.dataset.intellitextMode = ctx.mode;
    els.drawer.dataset.intellitextSectionCount = String(ctx.sections?.length || 0);
    els.drawer.dataset.intellitextBlockCount = String((ctx.sections || []).reduce((total, section) => total + (Array.isArray(section.blocks) ? section.blocks.length : 0), 0));
    els.drawer.dataset.intellitextContentVersion = String(ctx.contentVersion || 1);
    els.drawer.dataset.intellitextPresentationProfile = String(ctx.published?.presentationProfile || 'CANONICAL');
    els.drawer.innerHTML = readerDrawerHtml(ctx, options);
    showOverlay();
    els.drawer.classList.add('open');
    els.drawer.setAttribute('aria-hidden', 'false');
    if (!options.loading && !options.error) queueMicrotask(() => applyCurrentReaderAnnotations(ctx));
  }

  function selectIntelliTextDrawerSection(sectionId) {
    const ctx = intelliTextDrawerContext;
    if (!ctx) return;
    const match = ctx.sections.find((section, index) => readerSectionId(section, index) === String(sectionId));
    if (!match) return;
    ctx.activeSectionId = readerSectionId(match);
    writeReaderProgress(ctx);
    paintIntelliTextDrawer(ctx);
    els.drawer.scrollTo({top:0, behavior:'smooth'});
  }

  function openIntelliTextResource(resourceOrId, {replace = false, mode = ''} = {}) {
    const r = typeof resourceOrId === 'object' ? resourceOrId : resources.find((item) => String(item.id) === String(resourceOrId));
    if (!r) return toast('The exact Note is not available in this account.', '!');
    if (r.type !== 'note') return r.route ? goCanonical(r.route) : openDetailDrawer(r);
    state.openMenu = null;
    if (!isAdminReviewSession() && r.state === 'locked') return showLockedSheet(r);
    if (!isAdminReviewSession() && r.state === 'expired') return showExpiredSheet(r);
    if (!isAdminReviewSession() && !['open','partial'].includes(r.state)) return toast('Secure Note access could not be verified.', '!');

    const currentHash = location.hash || '#learning/notes';
    if (!currentHash.startsWith('#learning/reader/')) state.readerReturnHash = currentHash;
    state.parent = 'learning';
    state.context = 'notes';
    state.readerResourceId = String(r.id);
    state.readerMode = normalizeReaderMode(mode || state.readerMode);
    storage.setItem('aspirenest:intellitext:reader-mode:v1', state.readerMode);
    closeTransient();
    renderNav();
    renderLearning();
    renderIntelliTextReader(r.id);

    const encoded = encodeURIComponent(r.id);
    const target = `/ctet-tet/notes/read/${encoded}#learning/reader/${encoded}/${state.readerMode}`;
    const historyState = {aspirenestReader:true, resourceId:r.id, readerMode:state.readerMode};
    if (replace) history.replaceState(historyState, '', target);
    else history.pushState(historyState, '', target);
  }

  function closeIntelliTextReader() {
    const fallback = state.readerReturnHash && state.readerReturnHash.startsWith('#') ? state.readerReturnHash : '#learning/notes';
    intelliTextDrawerContext = null;
    state.readerResourceId = '';
    delete els.drawer.dataset.intellitextDrawer;
    delete els.drawer.dataset.intellitextMode;
    delete els.drawer.dataset.intellitextSectionCount;
    delete els.drawer.dataset.intellitextBlockCount;
    delete els.drawer.dataset.intellitextContentVersion;
    delete els.drawer.dataset.intellitextPresentationProfile;
    closeTransient();
    history.replaceState(null, '', `/student${fallback}`);
    routeFromHash();
  }

  async function renderIntelliTextReader(resourceId) {
    const id = String(resourceId || '');
    let r = resources.find((item) => String(item.id) === id);
    if (!r) r = {id, resourceId:id, type:'note', title:'AspireNest IntelliText', description:'Connecting the published Note.', state:studentLive.ready?'missing':'open', progress:0};

    const token = `intellitext-drawer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const progress = readReaderProgress(id);
    const ctx = {
      token,
      resource:r,
      published:null,
      sections:[],
      activeSectionId:String(progress?.sectionId || ''),
      contentVersion:Math.max(1, Number(progress?.contentVersion || 1) || 1),
      mode:normalizeReaderMode(state.readerMode),
      workspace:null,
      workspaceError:'',
    };
    intelliTextDrawerContext = ctx;
    paintIntelliTextDrawer(ctx, {loading:true});

    if (!studentLive.ready) return;
    if (r.state === 'missing') return paintIntelliTextDrawer(ctx, {error:'The published Note is not present in the live Student catalog.'});
    if (!isAdminReviewSession() && (r.state === 'locked' || r.state === 'expired')) {
      closeTransient();
      return r.state === 'locked' ? showLockedSheet(r) : showExpiredSheet(r);
    }

    try {
      const runtime = await waitForIntelliTextDrawerRuntime();
      const published = await runtime.load(id);
      if (intelliTextDrawerContext?.token !== token) return;
      const sections = Array.isArray(published.sections) ? published.sections : Array.isArray(published.intelliText?.sections) ? published.intelliText.sections : [];
      if (!sections.length) throw new Error('Published IntelliText contains no approved sections.');
      ctx.published = published;
      ctx.sections = sections;
      ctx.contentVersion = Math.max(1, Number(published.contentVersion || published.intelliText?.contentVersion || 1) || 1);
      if (!ctx.activeSectionId || !sections.some((section, index) => readerSectionId(section, index) === ctx.activeSectionId)) ctx.activeSectionId = readerSectionId(sections[0], 0);
      writeReaderProgress(ctx);
      paintIntelliTextDrawer(ctx);
      await hydrateIntelliTextWorkspace(ctx);
    } catch (error) {
      if (intelliTextDrawerContext?.token !== token) return;
      paintIntelliTextDrawer(ctx, {error:error?.message || 'Published IntelliText could not be loaded.'});
    }
  }

  function openResource(id) {
    const r=resources.find(x=>x.id===id);if(!r)return;state.openMenu=null;if(r.type==='note'&&r.route)return openIntelliTextResource(r);if(r.state==='locked')return showLockedSheet(r);if(r.state==='expired')return showExpiredSheet(r);if(r.route)return goCanonical(r.route);openDetailDrawer(r);
  }
  function openDetailDrawer(r) {
    els.drawer.innerHTML=`<div class="drawer-header"><strong>${typeLabel[r.type]||'Learning'} workspace</strong><button class="icon-button" data-action="close-drawer" aria-label="Close">×</button></div><div class="drawer-content"><div class="drawer-hero"><span class="state-badge ${r.state}">${stateLabel[r.state]}</span><h2>${escapeHtml(r.title)}</h2><p>${escapeHtml(r.description||r.subtitle)}</p></div><div class="drawer-meta-grid"><div class="drawer-meta"><strong>${escapeHtml(r.subjectName||subjectName(r.subject))}</strong><small>Subject</small></div><div class="drawer-meta"><strong>${escapeHtml(r.duration)}</strong><small>Resource</small></div><div class="drawer-meta"><strong>${escapeHtml(r.plan)}</strong><small>Required access</small></div></div><div class="page-actions" style="margin-top:18px"><button class="secondary-button" data-action="close-drawer">Close</button>${r.route?`<button class="primary-button" data-action="open-canonical" data-id="${r.id}">Open canonical workspace</button>`:''}</div></div>`;showOverlay();els.drawer.classList.add('open');els.drawer.setAttribute('aria-hidden','false');
  }

  function showLockedSheet(r) {
    els.sheet.innerHTML = `<span class="state-badge locked">Locked • Discuss with Mentor</span><h2>${escapeHtml(r.title)}</h2><p>This resource is visible for discovery, but protected content has not been opened. The mentor guidance flow keeps the exact resource and required access context.</p><div class="sheet-actions"><button class="secondary-button" data-action="close-sheet">Not now</button><button class="primary-button" data-action="mentor" data-id="${r.id}">Discuss with Mentor</button></div>`;
    showOverlay(); els.sheet.classList.add('open'); els.sheet.setAttribute('aria-hidden','false');
  }

  function showExpiredSheet(r) {
    els.sheet.innerHTML = `<span class="state-badge expired">Access expired • Renew</span><h2>${escapeHtml(r.title)}</h2><p>Your previous resource context is preserved, but protected content is not available. Renewal or support can restore access only through an audited entitlement change.</p><div class="sheet-actions"><button class="secondary-button" data-action="close-sheet">Close</button><button class="primary-button" data-action="access-help">Renew access</button></div>`;
    showOverlay(); els.sheet.classList.add('open'); els.sheet.setAttribute('aria-hidden','false');
  }

  function showOverlay(){ els.overlay.hidden = false; }
  function closeTransient(){
    els.overlay.hidden = true;
    els.drawer.classList.remove('open'); els.drawer.setAttribute('aria-hidden','true');
    els.sheet.classList.remove('open'); els.sheet.setAttribute('aria-hidden','true');
    document.querySelectorAll('.search-filter-popover,.account-menu,.notification-panel').forEach(x=>x.remove());
    els.contextRail.classList.remove('mobile-open');
  }

  function toast(message, icon='✓') {
    const node = document.createElement('div'); node.className='toast'; node.innerHTML=`<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`; els.toast.appendChild(node); setTimeout(()=>node.remove(),2800);
  }

  function toggleSaved(id) {
    if (state.saved.has(id)) { state.saved.delete(id); toast('Removed from Saved','☆'); }
    else { state.saved.add(id); toast('Saved for quick access','★'); }
    persist(); renderPage();
  }

  function addRevision(id) {
    state.revision.add(id); persist(); toast('Added to Revision Queue','↻');
  }

  function showSearchFilters() {
    closePopovers();
    const pop=document.createElement('div'); pop.className='search-filter-popover'; pop.innerHTML=`<div class="popover-heading">Quick search filters</div><button class="popover-item" data-quick-filter="access">✓ My Access only</button><button class="popover-item" data-quick-filter="assigned">☑ Assigned resources</button><button class="popover-item" data-quick-filter="saved">★ Saved resources</button><button class="popover-item" data-quick-filter="all">▦ All content</button>`; document.body.appendChild(pop);
  }
  function authSession(){return window.__aspirenestAuthSession||{};}
  function accountInitials(value){const parts=String(value||'AN').replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i,'').trim().split(/\s+/).filter(Boolean);return (parts.length>1?`${parts[0][0]}${parts[parts.length-1][0]}`:String(value||'AN').slice(0,2)).toUpperCase();}
  function showAccountMenu(){
    closePopovers();
    const session=authSession();
    const p=document.createElement('div');p.className='account-menu';
    if(!session.user){
      p.innerHTML=`<div class="popover-heading">Student access</div><button class="popover-item" data-aspirenest-login="/student">↗ Login</button><button class="popover-item" data-go="help/support">? Support</button>`;
    }else{
      const name=escapeHtml(session.displayName||session.email||'AspireNest Student');
      const identity=escapeHtml(session.username?`@${session.username}`:(session.email||''));
      const plan=escapeHtml(session.planType||'FREE');
      p.innerHTML=`<div class="account-profile"><span class="avatar">${accountInitials(session.displayName||session.email)}</span><div><strong>${name}</strong><small>${plan} Student${identity?` • ${identity}`:''}</small></div></div><button class="popover-item" data-go="help/account-help">⚙ Account settings</button><button class="popover-item" data-go="learning/my-access">✓ My Access</button><button class="popover-item" data-aspirenest-signout>↗ Sign out</button>`;
    }
    document.body.appendChild(p);
  }
  function showNotifications(){closePopovers();const p=document.createElement('div');p.className='notification-panel';const assignments=(studentLive.assignments||[]).filter(x=>!['completed','reviewed'].includes(String(x.status).toLowerCase())).slice(0,3);const sessions=(studentLive.liveSessions||[]).filter(x=>['scheduled','live'].includes(String(x.status).toLowerCase())).slice(0,2);p.innerHTML=`<div class="popover-heading">Notifications</div>${assignments.map(x=>`<div class="notice"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.due)} • ${escapeHtml(x.status)}</small></div>`).join('')}${sessions.map(x=>`<div class="notice"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.when)} • ${escapeHtml(x.status)}</small></div>`).join('')||(!assignments.length?'<div class="notice"><strong>No pending notification</strong><small>Your live assignments and sessions are up to date.</small></div>':'')}`;document.body.appendChild(p);}
  function closePopovers(){document.querySelectorAll('.search-filter-popover,.account-menu,.notification-panel').forEach(x=>x.remove());}

  function handleClick(event) {
    const login=event.target.closest('[data-aspirenest-login]');if(login){const target=login.dataset.aspirenestLogin||'/student';window.location.assign(`/login?returnTo=${encodeURIComponent(target)}`);return;}
    const signout=event.target.closest('[data-aspirenest-signout]');if(signout){closePopovers();window.dispatchEvent(new CustomEvent('aspirenest:signout'));return;}
    if (window.__aspirenestRole === 'admin') return;
    const parent = event.target.closest('[data-parent]'); if (parent) return navigate(parent.dataset.parent);
    const context = event.target.closest('[data-context]'); if (context) return navigate(state.parent,context.dataset.context);
    const go = event.target.closest('[data-go]'); if (go) { const [p,c]=go.dataset.go.split('/'); return navigate(p,c); }
    const subject = event.target.closest('[data-subject]'); if (subject) { state.parent='learning';state.context='subjects';renderNav();renderSubjectWorkspace(subject.dataset.subject);history.replaceState(null,'',`#learning/subject/${subject.dataset.subject}`);return; }
    const open = event.target.closest('[data-open]'); if (open) return openResource(open.dataset.open);
    const menu = event.target.closest('[data-menu]'); if (menu) { state.openMenu = state.openMenu===menu.dataset.menu?null:menu.dataset.menu; return renderPage(); }
    const directCard = event.target.closest('[data-resource-card]');
    if (directCard && !event.target.closest('button,a,input,select,textarea,[role="menu"]')) return openResource(directCard.dataset.resourceCard);
    const access = event.target.closest('[data-access-filter]'); if (access) { state.accessFilter=access.dataset.accessFilter; return renderLearning(); }
    const type = event.target.closest('[data-type-filter]'); if (type) { state.typeFilter=type.dataset.typeFilter; return renderLearning(); }
    const subFilter = event.target.closest('[data-subject-filter]'); if (subFilter) { state.subjectFilter=subFilter.dataset.subjectFilter; return renderLearning(); }
    const view = event.target.closest('button[data-view]'); if (view) { state.view=view.dataset.view;persist();renderNav();renderPage();return; }
    const tab = event.target.closest('[data-workspace-tab]'); if (tab) { state.workspaceTab=tab.dataset.workspaceTab;return renderSubjectWorkspace(state.selectedSubject); }
    const quick = event.target.closest('[data-quick-filter]'); if (quick) { state.parent='learning';state.context='library';state.accessFilter=quick.dataset.quickFilter;closePopovers();renderNav();renderLearning();return; }
    const readerMode = event.target.closest('[data-reader-mode]'); if (readerMode) return setReaderMode(readerMode.dataset.readerMode);
    const readerSection = event.target.closest('[data-reader-section]'); if (readerSection) return selectIntelliTextDrawerSection(readerSection.dataset.readerSection);
    const reader = event.target.closest('[data-reader-action]'); if (reader) return handleReaderAction(reader.dataset.readerAction);
    const action = event.target.closest('[data-action]'); if (action) { if(action.dataset.action==='submit-question'){const form=document.getElementById('studentQuestionForm');if(!form||!form.reportValidity())return;const resource=resources.find(x=>x.id===action.dataset.id);platformRequest('student-ask-question',{resourceId:resource?.id||'',resourceTitle:resource?.title||'',question:form.elements.question.value},'Question sent to Dr. Varsha Maru.');return;} return handleAction(action.dataset.action,action.dataset.id); }
    if (!event.target.closest('.card-menu')) { state.openMenu=null; }
  }

  function handleAction(action,id) {
    const r=resources.find(x=>x.id===id);
    if(action==='save')return toggleSaved(id);if(action==='revision')return addRevision(id);if(action==='details'){if(r)openDetailDrawer(r);return;}
    if(action==='open-canonical'){closeTransient();if(r?.route)goCanonical(r.route);return;}
    if(action==='mentor'||action==='mentor-question'){showQuestionDialog(r||null);return;}
    if(action==='complete-assignment'){const assignment=(studentLive.assignments||[]).find(x=>x.id===id);if(assignment)platformRequest('student-complete-assignment',{assignmentId:assignment.id},'Assignment marked complete.');return;}
    if(action==='close-drawer'){if(state.readerResourceId)return closeIntelliTextReader();return closeTransient();}if(action==='close-sheet')return closeTransient();if(action==='clear-filters'){state.query='';state.accessFilter='all';state.subjectFilter='all';state.typeFilter='all';els.search.value='';return renderLearning();}
    if(action==='open-search'){els.search.focus();els.search.select();return;}if(action==='access-help'){closeTransient();goCanonical('/my-access');return;}
    if(action==='play-video'||action==='start-test'){if(r?.route)goCanonical(r.route);return;}
    if(action==='join-live'||action==='open-session'){const session=(studentLive.liveSessions||[]).find(x=>x.id===id)||studentLive.liveSessions?.[0];const url=action==='open-session'?(session?.replayUrl||session?.joinUrl):session?.joinUrl;if(url)window.location.assign(url);else toast('No active session link is available.','◷');return;}
    if(action==='result'){const result=(studentLive.results||[]).find(x=>x.id===id)||studentLive.results?.[0];if(result?.route)goCanonical(result.route);return;}if(action==='result-history'){goCanonical('/ctet-tet/mock-tests/history');return;}
    if(action==='contact-support'){goCanonical('/contact');return;}if(action==='install')return toast('Use the browser Install App option when available.','↧');
  }
  function showQuestionDialog(resource=null){els.sheet.innerHTML=`<span class="state-badge open">Mentor guidance</span><h2>Ask Dr. Varsha Maru</h2><p>${resource?`Question about ${escapeHtml(resource.title)}.`:'Share a clear learning question.'}</p><form id="studentQuestionForm" class="admin-form"><label class="full">Question<textarea name="question" required minlength="8" placeholder="Write your question with enough context"></textarea></label></form><div class="sheet-actions"><button class="secondary-button" data-action="close-sheet">Cancel</button><button class="primary-button" data-action="submit-question" data-id="${resource?.id||''}">Send question</button></div>`;showOverlay();els.sheet.classList.add('open');els.sheet.setAttribute('aria-hidden','false');}
  async function handleReaderAction(action) {
    const ctx = intelliTextDrawerContext;
    if (!ctx) return;
    if (action === 'retry') return renderIntelliTextReader(ctx.resource.id);
    if (action === 'progress') {
      const current = activeReaderSection(ctx);
      const index = Math.max(0, ctx.sections.indexOf(current));
      const next = ctx.sections[Math.min(ctx.sections.length - 1, index + 1)];
      ctx.activeSectionId = readerSectionId(next, Math.min(ctx.sections.length - 1, index + 1));
      writeReaderProgress(ctx);
      paintIntelliTextDrawer(ctx);
      toast(`Section ${Math.min(ctx.sections.length, index + 1)} complete.`, '✓');
      return;
    }

    const section = activeReaderSection(ctx);
    const firstBlock = Array.isArray(section?.blocks) ? section.blocks[0] : null;
    const runtime = intelliTextDrawerRuntime();
    if (!runtime?.create) return toast('UID-private study workspace is still connecting.', '!');

    let captured = null;
    if (action !== 'bookmark') {
      try {
        captured = runtime.capture({selection:window.getSelection?.(), rootElement:document.getElementById('readerArticle')});
      } catch (error) {
        return toast(error?.message || 'Select text inside one learning block first.', '!');
      }
    }

    let body = '';
    let prompt = '';
    let answer = captured?.selectionAnchor?.exactText || '';
    if (action === 'note') body = window.prompt('Write your personal note:', '') || '';
    if (action === 'doubt') body = window.prompt('Write your doubt or question:', '') || '';
    if (action === 'flashcard') prompt = window.prompt('Write the flashcard question:', 'Recall this concept.') || '';
    if (['note','doubt'].includes(action) && !String(body).trim()) return;
    if (action === 'flashcard' && !String(prompt).trim()) return;

    const input = {
      ...(captured || {}),
      textbookId:ctx.resource.id,
      resourceId:ctx.resource.id,
      sectionId:captured?.sectionId || readerSectionId(section),
      blockId:captured?.blockId || String(firstBlock?.blockId || firstBlock?.id || readerSectionId(section)),
      contentVersion:ctx.contentVersion,
      selectionAnchor:captured?.selectionAnchor,
      body:String(body).trim(),
      noteTitle:String(ctx.published?.title || ctx.resource.title || ''),
      sectionTitle:String(section?.title || ''),
      label:String(section?.title || 'Saved section'),
      prompt:String(prompt || 'Recall this saved concept.').trim(),
      answer,
    };

    try {
      await runtime.create(action, input);
      const labels = {highlight:'Highlight saved privately',underline:'Underline saved privately',note:'Personal note saved privately',doubt:'Doubt saved privately',bookmark:'Section bookmarked',flashcard:'Flashcard created',revision:'Added to Revision'};
      window.getSelection?.()?.removeAllRanges?.();
      await hydrateIntelliTextWorkspace(ctx);
      toast(labels[action] || 'Study action saved', '✦');
    } catch (error) {
      toast(error?.message || 'This study action could not be saved.', '!');
    }
  }

  function bindEvents() {
    document.addEventListener('click',handleClick);
    els.overlay.addEventListener('click',()=>state.readerResourceId?closeIntelliTextReader():closeTransient());
    els.search.addEventListener('input',e=>{if(window.__aspirenestRole==='admin') return; state.query=e.target.value; if(state.parent!=='learning'){state.parent='learning';state.context='library';renderNav();} renderLearning();});
    document.getElementById('brandHome').addEventListener('click',()=>{if(window.__aspirenestRole==='admin') return; navigate('home','overview');});
    document.getElementById('quickContinue').addEventListener('click',()=>{if(window.__aspirenestRole==='admin') return; openResource((resources.find(r=>r.state==='open')||{}).id);});
    document.getElementById('searchFiltersButton').addEventListener('click',()=>{if(window.__aspirenestRole==='admin') return; showSearchFilters();});
    document.getElementById('accountButton').addEventListener('click',()=>{if(window.__aspirenestRole==='admin') return; showAccountMenu();});
    document.getElementById('notificationsButton').addEventListener('click',()=>{if(window.__aspirenestRole==='admin') return; showNotifications();});
    document.getElementById('collapseContext').addEventListener('click',()=>{
      if (window.innerWidth<=960) {els.contextRail.classList.toggle('mobile-open');showOverlay();}
      else document.querySelector('.app-shell').classList.toggle('context-collapsed');
    });
    document.addEventListener('keydown',e=>{
      const resourceOpenButton=e.target.closest?.('.resource-title-button[data-open]');
      if(resourceOpenButton&&['Enter',' '].includes(e.key)){e.preventDefault();openResource(resourceOpenButton.dataset.open);return;}
      if (e.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {e.preventDefault();els.search.focus();}
      if (e.key==='Escape') state.readerResourceId?closeIntelliTextReader():closeTransient();
    });
    window.addEventListener('hashchange',routeFromHash);
    window.addEventListener('popstate',routeFromHash);
  }

  function routeFromHash() {
    if (!isStudentExperienceActive()) return;
    const canonicalReader = ensureCanonicalIntelliTextReaderHash();

    if (canonicalReader) {
      state.readerResourceId = canonicalReader.textbookId;
      state.readerMode = canonicalReader.mode;
    }

    const parts=location.hash.replace(/^#/,'').split('/').filter(Boolean);
    if (!parts.length) return;
    if (parts[0]==='learning' && parts[1]==='reader' && parts[2]) {
      state.parent='learning';
      state.context='notes';
      state.readerResourceId=decodeURIComponent(parts[2]);
      state.readerMode=normalizeReaderMode(parts[3] || state.readerMode);
      renderNav();
      renderLearning();
      queueMicrotask(()=>renderIntelliTextReader(state.readerResourceId));
      return;
    }
    intelliTextDrawerContext=null;
    state.readerResourceId='';
    delete els.drawer.dataset.intellitextDrawer;
    delete els.drawer.dataset.intellitextMode;
    delete els.drawer.dataset.intellitextSectionCount;
    delete els.drawer.dataset.intellitextBlockCount;
    delete els.drawer.dataset.intellitextContentVersion;
    closeTransient();
    if (parts[0]==='learning' && parts[1]==='subject' && parts[2]) {state.parent='learning';state.context='subjects';renderNav();renderSubjectWorkspace(parts[2]);return;}
    if (parentAreas.some(x=>x.id===parts[0])) navigate(parts[0],parts[1]);
  }


  function syncAdminSignals(){return 0;}
  window.__aspirenestStudentAPI={navigate,renderNav,renderPage,renderHome,routeFromHash,closeTransient,toast,syncAdminSignals,state,applyStudentLiveData,openIntelliTextResource,setReaderMode,ensureCanonicalIntelliTextReaderHash};

  function init() {
    bindEvents();
    if(isStudentExperienceActive()){
      renderNav();
      ensureCanonicalIntelliTextReaderHash();
      const hash=location.hash.replace(/^#/,'');
      if (hash) routeFromHash(); else renderHome();
    }
    window.addEventListener('aspirenest:experience-active',event=>{if(String(event.detail?.experience||'').toLowerCase()==='student'){renderNav();ensureCanonicalIntelliTextReaderHash();const hash=location.hash.replace(/^#/,'');if(hash)routeFromHash();else renderHome();}});
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js?v=aspirenest-academy-pwa-identity-v2',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
  }

  window.dispatchEvent(new CustomEvent('aspirenest:student-runtime-ready'));
  init();
})();

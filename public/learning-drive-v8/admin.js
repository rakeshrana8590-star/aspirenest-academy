(() => {
  'use strict';

  const STORAGE_KEY = 'aspirenest_admin_drive_integrated_v8';
  const memoryStorage = Object.create(null);
  const store = {
    getItem(key){ try{return window.localStorage.getItem(key);}catch(_){return Object.prototype.hasOwnProperty.call(memoryStorage,key)?memoryStorage[key]:null;} },
    setItem(key,value){ try{window.localStorage.setItem(key,String(value));}catch(_){memoryStorage[key]=String(value);} }
  };
  const seed = {
    version: 8,
    resources: [],
    learners: [],
    mentors: [],
    grants: [],
    payments: [],
    audit: [],
    scenarioComplete: false,
    pendingClaims: [],
    products: []
  };

  const adminParents = [
    {id:'home',label:'Home',icon:'⌂'},
    {id:'content',label:'Content',icon:'▤'},
    {id:'access',label:'Access',icon:'◉'},
    {id:'people',label:'People',icon:'♙'},
    {id:'commerce',label:'Commerce',icon:'₹'},
    {id:'system',label:'System',icon:'⚙'}
  ];
  const adminContext = {
    home:[['overview','Overview','⌂'],['needs-attention','Needs attention','!',2],['recent-activity','Recent activity','↻',4]],
    content:[['all-content','All Content','▤',8],['notes','Notes / IntelliText','N',3],['videos','Videos','▶',1],['mock-tests','Mock Tests','◇',1],['current-affairs','Current Affairs','◎',1],['roadmaps','Roadmaps','⇢',1],['live-replays','Live & Replays','●',1],['drafts','Drafts & Staged','◷',1]],
    access:[['manager','Access Manager','◉'],['active-grants','Active Grants','✓',3],['expiring','Expiring Soon','◷',1],['bulk','Bulk Access','⇄'],['pending-claims','Pending Claims','@',1]],
    people:[['learners','Learners','♙',5],['mentors','Mentors','◎',2],['migration','Accounts & Migration','⇄']],
    commerce:[['payments','Payments','₹',3],['plans','Plans & Products','◇',4]],
    system:[['audit','Audit & Safety','✓',4],['settings','Settings','⚙']]
  };

  const els = {
    app:document.getElementById('app'), parentNav:document.getElementById('parentNav'), contextNav:document.getElementById('contextNav'),
    contextTitle:document.getElementById('contextTitle'), contextEyebrow:document.getElementById('contextEyebrow'), page:document.getElementById('pageContent'),
    search:document.getElementById('globalSearch'), mobileDock:document.getElementById('mobileDock'), mobileContext:document.getElementById('mobileContextStrip'),
    roleButton:document.getElementById('roleSwitchButton'), roleLabel:document.getElementById('roleSwitchLabel'), quick:document.getElementById('quickContinue'),
    account:document.getElementById('accountButton'), notifications:document.getElementById('notificationsButton'), searchFilters:document.getElementById('searchFiltersButton'),
    brand:document.getElementById('brandHome'), overlay:document.getElementById('overlay')
  };

  let data = load();window.__aspirenestAdminData=data;if(window.__aspirenestRole==='student'){queueMicrotask(()=>{const api=window.__aspirenestStudentAPI;const added=api?.syncAdminSignals?.()||0;if(added){api.renderNav();api.renderPage();}});}
  let realLearnerDirectoryActive=false;
  let realAdminDataActive=false;
  let realAdminDataLoading=false;
  let realAdminSourceErrors={};
  let realAdminSourceStatus={};
  let realAdminSourceCounts={};
  let liveDefaultMentor=null;
  const liveArrayKeys=['resources','learners','mentors','grants','payments','audit','pendingClaims'];
  function liveArray(value){return Array.isArray(value)?value:[];}
  function normalizedEmail(value){return String(value||'').trim().toLowerCase();}
  function isStaffLearnerRecord(learner={}){
    const emails=[learner.email,...liveArray(learner.emailAliases)].map(normalizedEmail);
    const roles=[learner.role,learner.userRole,learner.accountRole,learner.type,...liveArray(learner.roles)].map(x=>String(x||'').trim().toLowerCase());
    return emails.includes('aspirenestplatform@gmail.com')||emails.includes('dr.varshamaru@gmail.com')||roles.some(role=>['admin','super_admin','owner','mentor'].includes(role));
  }
  function normalizeLiveLearners(learners=[]){
    return liveArray(learners)
      .filter(learner=>!isStaffLearnerRecord(learner))
      .map((learner,index)=>({
        id:String(learner.id||learner.uid||learner.email||`learner-${index}`),
        uid:String(learner.uid||learner.id||''),
        uidAliases:liveArray(learner.uidAliases).map(String),
        emailAliases:liveArray(learner.emailAliases).map(String),
        role:String(learner.role||learner.userRole||'student'),
        name:String(learner.name||learner.fullName||learner.email||'Learner'),
        email:String(learner.email||''),
        username:String(learner.username||''),
        plan:String(learner.plan||'FREE').toUpperCase(),
        status:String(learner.status||'Active'),
        progress:Math.max(0,Math.min(100,Number(learner.progress)||0)),
        accessCount:Math.max(0,Number(learner.accessCount)||0),
        mentor:String(learner.mentor||learner.mentorName||'Dr. Varsha Maru'),
        mentorUid:String(learner.mentorUid||''),
        mentorEmail:String(learner.mentorEmail||'dr.varshamaru@gmail.com'),
        lastActive:String(learner.lastActive||'Not recorded')
      }))
      .filter(learner=>!isStaffLearnerRecord(learner));
  }
  function updateLiveEnvironmentBadge(){
    const summary=document.querySelector('.plan-summary');
    if(!summary||!isAdmin())return;
    if(realAdminDataLoading&&!realAdminDataActive){summary.innerHTML='<span class="status-dot"></span><div><strong>Connecting live Admin data</strong><small>Reading authorized Firebase sources</small></div>';return;}
    if(realAdminDataActive){
      const errorCount=Object.keys(realAdminSourceErrors||{}).length;
      summary.innerHTML=`<span class="status-dot"></span><div><strong>Live Admin data</strong><small>${errorCount?`${errorCount} source warning${errorCount===1?'':'s'}`:'Firebase reads connected'}</small></div>`;
    }
  }
  function applyRealAdminData(state={}){
    realAdminDataLoading=state.loading===true;
    realAdminSourceErrors=state.sourceErrors&&typeof state.sourceErrors==='object'?state.sourceErrors:{};
    realAdminSourceStatus=state.sourceStatus&&typeof state.sourceStatus==='object'?state.sourceStatus:{};
    realAdminSourceCounts=state.sourceCounts&&typeof state.sourceCounts==='object'?state.sourceCounts:{};
    liveDefaultMentor=state.defaultMentor||null;
    if(realAdminDataLoading&&!realAdminDataActive){
      liveArrayKeys.forEach(key=>{data[key]=[];});
    }else if(state.ready===true){
      realAdminDataActive=true;
      realLearnerDirectoryActive=true;
      data.resources=liveArray(state.resources);
      data.learners=normalizeLiveLearners(state.learners);
      data.mentors=liveArray(state.mentors);
      data.grants=liveArray(state.grants);
      data.payments=liveArray(state.payments);
      data.audit=liveArray(state.audit);
      data.pendingClaims=liveArray(state.pendingClaims);
      data.products=liveArray(state.products);
    }
    window.__aspirenestAdminData=data;
    updateLiveEnvironmentBadge();
    if(isAdmin()){renderNav();renderPage();}
    if(state.error&&isAdmin())toast(String(state.error),'!');
  }
  function applyRealLearnerDirectory(state={}){
    const learners=Array.isArray(state.learners)?state.learners:[];
    if(state.loading===true&&!realLearnerDirectoryActive){data.learners=[];}
    else if(state.ready===true&&!realAdminDataActive){realLearnerDirectoryActive=true;data.learners=normalizeLiveLearners(learners);}
    window.__aspirenestAdminData=data;
    if(isAdmin()){renderNav();renderPage();}
    if(state.error&&isAdmin())toast(String(state.error),'!');
  }
  window.addEventListener('aspirenest:real-admin-data',event=>applyRealAdminData(event.detail||{}));
  window.addEventListener('aspirenest:real-learner-directory',event=>applyRealLearnerDirectory(event.detail||{}));
  if(window.__aspirenestRealAdminData){queueMicrotask(()=>applyRealAdminData(window.__aspirenestRealAdminData));}
  else if(window.__aspirenestRealLearnerDirectory){queueMicrotask(()=>applyRealLearnerDirectory(window.__aspirenestRealLearnerDirectory));}
  const state = {parent:'home',context:'overview',query:'',view:'grid',contentFilter:'all',collectionFilter:'all',sort:'default'};
  let dialog = null;
  let pendingLiveRequestId='';

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function load(){return clone(seed);}
  function save(){store.setItem(STORAGE_KEY,JSON.stringify(data));window.__aspirenestAdminData=data;}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
  function now(){return new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
  function dateInputValue(value){const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function learner(id){return data.learners.find(x=>x.id===id);}
  function resource(id){return data.resources.find(x=>x.id===id);}
  function statusClass(s){const v=String(s).toLowerCase(); if(['active','published','verified','success','allow'].includes(v))return 'active'; if(['pending','staged','expiring','pending uid claim'].includes(v))return 'pending'; if(['expired','revoked','deny'].includes(v))return 'expired'; return 'draft';}
  function typeIcon(type){return ({'Native Note':'▤','PDF Note':'▤','Video':'▶','Mock Test':'◇','Current Affairs':'◎','Roadmap':'⇢','Replay':'↺'})[type]||'▤';}
  function thumb(type){return ({'Native Note':['#dfe9ff','#fff4e4'],'PDF Note':['#e8eff8','#f7f9fc'],'Video':['#dfe9ff','#e8f8f2'],'Mock Test':['#fff0e8','#fff7df'],'Current Affairs':['#ffeaf2','#fff0f1'],'Roadmap':['#e8f8f2','#eaf8e3'],'Replay':['#ede9ff','#dfe9ff']})[type]||['#e8eff8','#f7f9fc'];}

  const activeExperience=()=>String(window.__aspirenestActiveExperience||window.__aspirenestRequestedExperience||'student').toLowerCase();
  function isAdmin(){return activeExperience()==='admin'&&window.__aspirenestRole==='admin'&&!window.__aspirenestExperienceRole;}
  function setBrand(admin){
    const small=els.brand.querySelector('small');
    if(small) small.textContent='Academy';
    els.roleLabel.textContent=admin?'Admin':'Student';
    els.quick.innerHTML=admin?'+ New':'<span class="pulse-dot" aria-hidden="true"></span>Continue';
    els.quick.title=admin?'Create a new resource':'Continue last learning item';
    els.search.placeholder=admin?'Search learners, resources, grants or audit logs':'Search notes, videos, tests, chapters or topics';
    els.search.setAttribute('aria-label',admin?'Search Admin Drive':'Search all learning content');
    const summary=document.querySelector('.plan-summary');
    if(summary) summary.innerHTML=admin?'<span class="status-dot"></span><div><strong>Connecting Admin data</strong><small>Authorized Firebase reads</small></div>':'<span class="status-dot"></span><div><strong>Premium access</strong><small>Valid until 7 Sep 2026</small></div>';
    if(admin) updateLiveEnvironmentBadge();
  }

  function enterAdmin(){
    closeRoleMenu(); closeAdminPopovers(); closeDialog();
    window.__aspirenestActiveExperience='admin';
    window.__aspirenestExperienceRole=null;
    window.__aspirenestRole='admin';
    els.app.classList.add('admin-mode');
    setBrand(true);
    state.parent='home';state.context='overview';state.query='';els.search.value='';
    renderNav();renderPage();
    history.replaceState(null,'','#admin/home/overview');
  }
  function exitAdmin(){
    closeRoleMenu();closeAdminPopovers();closeDialog();
    window.__aspirenestActiveExperience='student';
    window.__aspirenestExperienceRole=null;
    window.__aspirenestRole='student';
    els.app.classList.remove('admin-mode');
    setBrand(false);
    state.query='';els.search.value='';
    const api=window.__aspirenestStudentAPI;
    if(api){api.syncAdminSignals?.();api.navigate('home','overview');} else location.reload();
  }

  function showRoleMenu(){
    closeAdminPopovers();closeRoleMenu();
    const menu=document.createElement('div');menu.className='role-choice-menu';menu.id='roleChoiceMenu';
    menu.innerHTML=`<div class="role-choice-head">Preview experience</div>
      <button data-role-choice="student" class="${isAdmin()?'':'active'}"><span class="role-choice-icon">S</span><span><strong>Student Learning Drive</strong><small>Exact approved learner experience</small></span></button>
      <button data-role-choice="admin" class="${isAdmin()?'active':''}"><span class="role-choice-icon">A</span><span><strong>Admin Learning Drive</strong><small>Same shell, navigation and collapse behaviour</small></span></button>`;
    document.body.appendChild(menu);els.roleButton.setAttribute('aria-expanded','true');
  }
  function closeRoleMenu(){document.getElementById('roleChoiceMenu')?.remove();els.roleButton.setAttribute('aria-expanded','false');}

  function navigate(parent,context){
    state.parent=parent;state.context=context||adminContext[parent][0][0];state.query='';state.collectionFilter='all';state.sort='default';els.search.value='';
    closeAdminPopovers();closeDialog();renderNav();renderPage();history.replaceState(null,'',`#admin/${parent}/${state.context}`);window.scrollTo({top:0,behavior:'smooth'});
  }
  function parseGrantDate(value){
    const text=String(value||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(`${text}T00:00:00Z`);
    const m=text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if(!m)return null;
    const months={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
    return Object.prototype.hasOwnProperty.call(months,m[2])?new Date(Date.UTC(Number(m[3]),months[m[2]],Number(m[1]))):null;
  }
  function contextCount(parent,id){
    if(parent==='home'&&id==='needs-attention')return data.payments.filter(x=>x.status==='Pending'||(x.status==='Verified'&&!x.accessProvisioned)).length+data.resources.filter(x=>x.status!=='Published').length;
    if(parent==='home'&&id==='recent-activity')return data.audit.length;
    if(parent==='content'){
      if(id==='all-content')return data.resources.length;
      if(id==='notes')return data.resources.filter(x=>['Native Note','PDF Note'].includes(x.type)).length;
      if(id==='videos')return data.resources.filter(x=>x.type==='Video').length;
      if(id==='mock-tests')return data.resources.filter(x=>x.type==='Mock Test').length;
      if(id==='current-affairs')return data.resources.filter(x=>x.type==='Current Affairs').length;
      if(id==='roadmaps')return data.resources.filter(x=>x.type==='Roadmap').length;
      if(id==='live-replays')return data.resources.filter(x=>x.type==='Replay').length;
      if(id==='drafts')return data.resources.filter(x=>x.status!=='Published').length;
    }
    if(parent==='access'){
      if(id==='active-grants')return data.grants.filter(x=>x.status==='Active').length;
      if(id==='expiring'){
        const from=Date.now(),to=from+(30*24*60*60*1000);
        return data.grants.filter(x=>{const d=parseGrantDate(x.expires);return x.status==='Active'&&d&&d.getTime()>=from&&d.getTime()<=to;}).length;
      }
      if(id==='pending-claims')return data.pendingClaims.length;
    }
    if(parent==='people'&&id==='learners')return data.learners.length;
    if(parent==='people'&&id==='mentors')return data.mentors.length;
    if(parent==='commerce'&&id==='payments')return data.payments.length;
    if(parent==='commerce'&&id==='plans')return liveArray(data.products).length;
    if(parent==='system'&&id==='audit')return data.audit.length;
    return null;
  }
  function refreshAdminView(){renderNav();renderPage();}
  function renderNav(){
    els.parentNav.innerHTML=adminParents.map(item=>`<button class="rail-link ${state.parent===item.id?'active':''}" data-admin-parent="${item.id}" aria-current="${state.parent===item.id?'page':'false'}"><span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-label">${item.label}</span></button>`).join('');
    els.mobileDock.innerHTML=adminParents.map(item=>`<button class="${state.parent===item.id?'active':''}" data-admin-parent="${item.id}" aria-current="${state.parent===item.id?'page':'false'}"><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`).join('');
    const area=adminParents.find(x=>x.id===state.parent)||adminParents[0];
    els.contextTitle.textContent=area.label;els.contextEyebrow.textContent=({home:'Admin OS',content:'Resource Graph',access:'Entitlements',people:'Identity & Roles',commerce:'Commercial',system:'Platform Safety'})[area.id];
    const items=adminContext[state.parent];
    els.contextNav.innerHTML=items.map(([id,label,icon])=>{const count=contextCount(state.parent,id);return `<button class="context-link ${state.context===id?'active':''}" data-admin-context="${id}" aria-current="${state.context===id?'page':'false'}"><span class="context-icon" aria-hidden="true">${icon}</span><span>${label}</span>${count!==null&&count!==undefined?`<span class="count">${count}</span>`:''}</button>`;}).join('');
    els.mobileContext.innerHTML=items.slice(0,8).map(([id,label])=>`<button class="${state.context===id?'active':''}" data-admin-context="${id}">${label}</button>`).join('');
    els.app.dataset.view=state.view;
  }
  function heading(title,description,actions=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;}
  function renderGlobalSearch(){
    const q=state.query.trim().toLowerCase();
    const resources=data.resources.filter(r=>Object.values(r).join(' ').toLowerCase().includes(q));
    const learners=data.learners.filter(l=>Object.values(l).join(' ').toLowerCase().includes(q));
    const grants=data.grants.filter(g=>{const l=learner(g.learnerId);return `${Object.values(g).join(' ')} ${l?.name||''}`.toLowerCase().includes(q);});
    const payments=data.payments.filter(x=>Object.values(x).join(' ').toLowerCase().includes(q));
    const audits=data.audit.filter(x=>Object.values(x).filter(v=>typeof v!=='object').join(' ').toLowerCase().includes(q));
    const total=resources.length+learners.length+grants.length+payments.length+audits.length;
    const section=(title,rows)=>rows.length?`<section class="admin-panel"><div class="admin-panel-head"><div><h2>${title}</h2><p>${rows.length} match${rows.length===1?'':'es'}</p></div></div><div class="admin-list">${rows.join('')}</div></section>`:'';
    els.page.innerHTML=`<div class="page-shell">${heading('Search results',`One global search across resources, learners, grants, payments and audit evidence. ${total} result${total===1?'':'s'} for “${esc(state.query)}”.`,`<button class="secondary-button" data-admin-action="clear-search">Clear search</button>`)}<div class="admin-stack">${section('Resources',resources.map(r=>`<button class="admin-list-row admin-search-result" data-admin-action="resource-detail" data-id="${r.id}"><span class="admin-list-icon">${typeIcon(r.type)}</span><span class="admin-list-main"><strong>${esc(r.title)}</strong><small>${esc(r.type)} · ${esc(r.subject)} · ${esc(r.status)}</small></span></button>`))}${section('Learners',learners.map(l=>`<button class="admin-list-row admin-search-result" data-admin-action="learner-detail" data-id="${l.id}"><span class="admin-list-icon">${esc(l.name[0])}</span><span class="admin-list-main"><strong>${esc(l.name)}</strong><small>${esc(l.email)} · ${esc(l.plan)} · ${esc(l.status)}</small></span></button>`))}${section('Grants',grants.map(g=>`<button class="admin-list-row admin-search-result" data-admin-action="grant-detail" data-id="${g.id}"><span class="admin-list-icon">◉</span><span class="admin-list-main"><strong>${esc(g.title)}</strong><small>${esc(learner(g.learnerId)?.name||g.learnerId)} · ${esc(g.scope)} · ${esc(g.status)}</small></span></button>`))}${section('Payments',payments.map(x=>`<button class="admin-list-row admin-search-result" data-admin-go="commerce/payments"><span class="admin-list-icon">₹</span><span class="admin-list-main"><strong>${esc(x.learner)} · ${esc(x.plan)}</strong><small>${esc(x.reference)} · ${esc(x.status)}${x.accessProvisioned?' · access provisioned':''}</small></span></button>`))}${section('Audit evidence',audits.map(a=>`<button class="admin-list-row admin-search-result" ${a.evidence?`data-admin-action="audit-detail" data-id="${a.id}"`:`data-admin-go="system/audit"`}><span class="admin-list-icon">✓</span><span class="admin-list-main"><strong>${esc(a.action)} · ${esc(a.target)}</strong><small>${esc(a.time)} · ${esc(a.reason)}</small></span></button>`))}${total?'':'<div class="empty-state"><div class="empty-icon">⌕</div><h3>No matches</h3><p>Try a learner, resource, grant, payment reference or audit reason.</p></div>'}</div></div>`;
  }
  function renderPage(){
    if(state.query.trim())return renderGlobalSearch();
    if(state.parent==='home')return renderHome();
    if(state.parent==='content')return renderContent();
    if(state.parent==='access')return renderAccess();
    if(state.parent==='people')return renderPeople();
    if(state.parent==='commerce')return renderCommerce();
    return renderSystem();
  }

  function renderHome(){
    if(state.context==='needs-attention')return renderNeedsAttention();
    if(state.context==='recent-activity')return renderRecentActivity();
    const pending=data.payments.filter(x=>x.status==='Pending').length;
    const active=data.grants.filter(x=>x.status==='Active').length;
    els.page.innerHTML=`<div class="page-shell">
      ${heading('Admin Command Centre','Operate content, access, people, payments and launch safety through the exact same AspireNest Drive experience.',`<button class="secondary-button" data-admin-action="live-source-status">Live source status</button><button class="primary-button" data-admin-action="create-resource">Create resource</button>`)}
      <section class="continue-card admin-hero"><div class="continue-copy"><span class="eyebrow">One connected operational view</span><h2>No scattered admin work. No separate design system.</h2><p>Every real resource, grant, learner, payment and audit signal stays inside the same collapsible two-level Drive shell used by the Student experience.</p><div class="continue-actions"><button class="primary-button" data-admin-go="access/manager">Grant access</button><button class="secondary-button" data-admin-go="commerce/payments">Review payments</button><button class="secondary-button" data-admin-go="system/audit">Open audit</button></div></div><aside class="admin-safety"><h3>Live platform controls</h3><p>Authenticated operational workspace</p><div class="admin-safety-grid"><span>✓ Identity-linked data</span><span>✓ Role-protected writes</span><span>✓ Audit evidence active</span><span>✓ Source health visible</span></div></aside></section>
      <div class="admin-kpis"><article class="admin-kpi"><span>Active learners</span><strong>${data.learners.filter(x=>x.status==='Active').length}</strong><small>Identity-linked profiles</small></article><article class="admin-kpi"><span>Published resources</span><strong>${data.resources.filter(x=>x.status==='Published').length}</strong><small>Across module types</small></article><article class="admin-kpi"><span>Active grants</span><strong>${active}</strong><small>PLAN · MODULE · BUNDLE · ITEM</small></article><article class="admin-kpi warn"><span>Pending payments</span><strong>${pending}</strong><small>Require manual verification</small></article></div>
      <section class="section"><div class="section-header"><div><h2>Admin workspaces</h2><p>Open one focused workspace; the contextual rail and main screen adjust together.</p></div></div><div class="admin-folder-grid">${adminFolders()}</div></section>
      <div class="admin-two-col"><section class="admin-panel"><div class="admin-panel-head"><div><h2>Recent controlled operations</h2><p>Latest access, publishing and assignment evidence</p></div><button class="admin-mini" data-admin-go="system/audit">View all</button></div><div class="admin-list">${data.audit.length?data.audit.slice(0,4).map(a=>auditList(a)).join(''):'<div class="empty-state"><h3>No live operations yet</h3><p>Authorized audit events will appear here.</p></div>'}</div></section><section class="admin-panel"><div class="admin-panel-head"><div><h2>Needs attention</h2><p>Items that may block a learner</p></div></div><div class="admin-list">${attentionRows()}</div></section></div>
    </div>`;
  }
  function adminFolders(){
    const items=[['content','all-content','▤','Content Studio',`${data.resources.length} canonical resources`],['access','manager','◉','Access Manager',`${data.grants.length} grants and claims`],['people','learners','♙','Learners',`${data.learners.length} learner profiles`],['people','mentors','◎','Mentors',`${data.mentors.length} active mentors`],['commerce','payments','₹','Payments',`${data.payments.filter(x=>x.status==='Pending').length} pending verification`],['system','audit','✓','Audit & Safety',`${data.audit.length} evidence records`]];
    return items.map(([p,c,i,t,s])=>`<button class="admin-folder" data-admin-go="${p}/${c}"><span class="admin-folder-icon">${i}</span><span><strong>${t}</strong><small>${s}</small></span></button>`).join('');
  }
  function attentionRows(){
    const rows=[];
    data.payments.filter(x=>x.status==='Pending').forEach(p=>rows.push(`<div class="admin-list-row"><span class="admin-list-icon">₹</span><div class="admin-list-main"><strong>${esc(p.learner)} payment pending</strong><small>${esc(p.amount)} • ${esc(p.reference)}</small></div><button class="admin-mini" data-admin-action="verify-payment" data-id="${p.id}">Review</button></div>`));
    data.payments.filter(x=>x.status==='Verified'&&!x.accessProvisioned).forEach(p=>rows.push(`<div class="admin-list-row"><span class="admin-list-icon">◉</span><div class="admin-list-main"><strong>${esc(p.learner)} access provisioning pending</strong><small>Payment verified · ${esc(p.plan)} grant still requires Access Engine action</small></div><button class="admin-mini" data-admin-action="provision-payment" data-id="${p.id}">Provision</button></div>`));
    data.resources.filter(x=>x.status==='Staged').forEach(r=>rows.push(`<div class="admin-list-row"><span class="admin-list-icon">◷</span><div class="admin-list-main"><strong>${esc(r.title)}</strong><small>Staged resource needs publishing review</small></div><button class="admin-mini" data-admin-action="publish-resource" data-id="${r.id}">Review</button></div>`));
    return rows.join('')||'<div class="empty-state"><h3>Nothing urgent</h3><p>All controlled workflows are clear.</p></div>';
  }
  function auditList(a){return `<div class="admin-list-row"><span class="admin-list-icon">${a.result==='SUCCESS'||a.result==='ALLOW'?'✓':'!'}</span><div class="admin-list-main"><strong>${esc(a.action)} · ${esc(a.target)}</strong><small>${esc(a.time)} • ${esc(a.reason)}</small></div><span class="admin-status ${statusClass(a.result)}">${esc(a.result)}</span></div>`;}
  function renderNeedsAttention(){els.page.innerHTML=`<div class="page-shell">${heading('Needs attention','Resolve pending payments, staged resources, expiring access and identity concerns before they block learners.')}<div class="admin-stack">${attentionRows()}</div></div>`;}
  function renderRecentActivity(){els.page.innerHTML=`<div class="page-shell">${heading('Recent activity','Every controlled mutation creates readable audit evidence.')}<div class="admin-list">${data.audit.length?data.audit.map(a=>auditList(a)).join(''):'<div class="empty-state"><h3>No live activity found</h3><p>Audit records will appear when authorized operations are recorded.</p></div>'}</div></div>`;}

  function filteredResources(){
    let list=[...data.resources];const q=state.query.trim().toLowerCase();if(q)list=list.filter(r=>Object.values(r).join(' ').toLowerCase().includes(q));
    const map={notes:['Native Note','PDF Note'],videos:['Video'],'mock-tests':['Mock Test'],'current-affairs':['Current Affairs'],roadmaps:['Roadmap'],'live-replays':['Replay'],drafts:['Draft','Staged']};
    if(map[state.context]) list=state.context==='drafts'?list.filter(r=>map.drafts.includes(r.status)):list.filter(r=>map[state.context].includes(r.type));
    if(state.contentFilter!=='all')list=list.filter(r=>r.status.toLowerCase()===state.contentFilter);
    return list;
  }
  function renderContent(){
    const list=filteredResources();const label=(adminContext.content.find(x=>x[0]===state.context)||[])[1]||'All Content';
    els.page.innerHTML=`<div class="page-shell">${heading(label,'Create, structure, preview, map access and publish canonical resources without duplicating plan-owned content.',`<button class="secondary-button" data-admin-action="preview-student">Preview Student</button><button class="primary-button" data-admin-action="create-resource">Create resource</button>`)}
      <section class="admin-toolbar"><div class="admin-chip-row"><button class="admin-chip ${state.contentFilter==='all'?'active':''}" data-admin-filter="all">All</button><button class="admin-chip ${state.contentFilter==='published'?'active':''}" data-admin-filter="published">Published</button><button class="admin-chip ${state.contentFilter==='staged'?'active':''}" data-admin-filter="staged">Staged</button><button class="admin-chip ${state.contentFilter==='draft'?'active':''}" data-admin-filter="draft">Draft</button></div><div class="view-toggle"><button data-admin-view="list" class="${state.view==='list'?'active':''}" aria-label="Admin list view">☷</button><button data-admin-view="grid" class="${state.view==='grid'?'active':''}" aria-label="Admin grid view">▦</button></div></section>
      ${list.length?`<div class="resource-grid">${list.map(resourceCard).join('')}</div>`:'<div class="empty-state"><div class="empty-icon">⌕</div><h3>No matching resources</h3><p>Adjust the search or status filter.</p></div>'}</div>`;
  }
  function resourceCard(r){const colors=thumb(r.type);const stateClass=r.status==='Published'?'open':r.status==='Staged'?'partial':'expired';return `<article class="resource-card" data-admin-resource-card="${r.id}"><div class="resource-thumb" style="--thumb-start:${colors[0]};--thumb-end:${colors[1]}"><span class="resource-type-icon">${typeIcon(r.type)}</span><span class="state-badge ${stateClass}">${esc(r.status)}</span></div><div class="resource-body"><div class="resource-meta"><small>${esc(r.type)} · ${esc(r.subject)}</small><span class="plan-badge">${esc(r.access)}</span></div><h3 class="resource-title">${esc(r.title)}</h3><p class="resource-subtitle">${esc(r.delivery)} • ${esc(r.count)}</p><div class="resource-progress"><span style="width:${r.status==='Published'?100:r.status==='Staged'?70:25}%"></span></div></div><div class="resource-footer"><small>Updated ${esc(r.updated)}</small><div class="card-actions"><button class="card-icon-button" data-admin-action="resource-detail" data-id="${r.id}" aria-label="Open resource details">ⓘ</button>${r.status!=='Published'?`<button class="card-icon-button" data-admin-action="publish-resource" data-id="${r.id}" aria-label="Publish resource">✓</button>`:''}</div></div></article>`;}

  function filteredGrants(source=data.grants){
    let list=filteredPeople(source);
    if(state.collectionFilter==='active')list=list.filter(x=>String(x.status).toLowerCase()==='active');
    if(state.collectionFilter==='expiring'){const from=Date.now(),to=from+30*86400000;list=list.filter(x=>{const time=parseGrantDate(x.expires)?.getTime();return String(x.status).toLowerCase()==='active'&&time>=from&&time<=to;});}
    if(state.collectionFilter==='plan')list=list.filter(x=>String(x.scope).toUpperCase()==='PLAN');
    if(state.collectionFilter==='item')list=list.filter(x=>String(x.scope).toUpperCase()==='ITEM');
    if(state.collectionFilter==='module-bundle')list=list.filter(x=>['MODULE','BUNDLE'].includes(String(x.scope).toUpperCase()));
    return sortCollection(list,state.sort);
  }
  function accessToolbar(grants){return collectionToolbar({chips:[['all','All'],['active','Active'],['expiring','Expiring ≤30 days'],['plan','Plan'],['item','Item'],['module-bundle','Module / Bundle']],allowView:true,sorts:[['default','Default'],['expiry','Expiry'],['name','Learner / resource']],summary:`${grants.length} records`});}
  function renderAccess(){
    if(state.context==='manager')return renderAccessManager();
    if(state.context==='bulk')return renderBulk();
    if(state.context==='pending-claims')return renderClaims();
    let base=[...data.grants];
    if(state.context==='active-grants')base=base.filter(x=>String(x.status).toLowerCase()==='active');
    if(state.context==='expiring'){const from=Date.now(),to=from+30*86400000;base=base.filter(x=>{const time=parseGrantDate(x.expires)?.getTime();return String(x.status).toLowerCase()==='active'&&time>=from&&time<=to;});}
    const grants=filteredGrants(base);
    els.page.innerHTML=`<div class="page-shell">${heading((adminContext.access.find(x=>x[0]===state.context)||[])[1]||'Access','Review the exact scope, source and validity of every real entitlement.',`<button class="primary-button" data-admin-action="grant-access">Grant access</button>`)}${accessToolbar(grants)}${grants.length?`<div class="admin-access-grid">${grants.map(grantCard).join('')}</div>`:'<div class="empty-state"><h3>No matching grants</h3><p>No real entitlement records match the selected filters.</p></div>'}</div>`;
  }
  function renderAccessManager(){
    const grants=filteredGrants(data.grants);
    els.page.innerHTML=`<div class="page-shell">${heading('Access Manager','Grant PLAN, MODULE, BUNDLE or one exact ITEM with preview, duplicate detection, validity and audit evidence.',`<button class="secondary-button" data-admin-action="bulk-access">Bulk preview</button><button class="primary-button" data-admin-action="grant-access">Grant access</button>`)}
      <section class="continue-card admin-hero"><div class="continue-copy"><span class="eyebrow">One access decision — used everywhere</span><h2>Exact scope first. Broad unlock never implied.</h2><p>Role, plan, entitlement and assignment remain separate. ITEM access opens only the selected resource.</p><div class="continue-actions"><button class="primary-button" data-admin-action="grant-access">Create controlled grant</button><button class="secondary-button" data-admin-go="access/active-grants">Review active grants</button></div></div><aside class="admin-safety"><h3>Supported scopes</h3><p>Deterministic deny-by-default policy</p><div class="admin-safety-grid"><span>PLAN</span><span>MODULE</span><span>BUNDLE</span><span>ITEM</span></div></aside></section>
      <section class="section"><div class="section-header"><div><h2>Current access</h2><p>Each card shows learner, scope, source, validity and exact effect.</p></div></div>${accessToolbar(grants)}${grants.length?`<div class="admin-access-grid">${grants.map(grantCard).join('')}</div>`:'<div class="empty-state"><h3>No access records</h3><p>Real grants will appear after the Access Engine creates them.</p></div>'}</section></div>`;
  }
  function grantCard(g){const l=learner(g.learnerId);return `<article class="admin-access-card"><span class="admin-status ${statusClass(g.status)}">${esc(g.status)}</span><h3>${esc(g.title)}</h3><p><strong>${esc(l?l.name:g.learnerId)}</strong><br>${esc(g.scope)} → ${esc(g.target)}<br>Source: ${esc(g.source)}</p><div class="admin-access-meta"><span class="plan-badge">${esc(g.scope)}</span><span class="plan-badge">Until ${esc(g.expires)}</span></div><div class="admin-row-actions" style="margin-top:13px;justify-content:flex-start"><button class="admin-mini" data-admin-action="grant-detail" data-id="${g.id}">Details</button>${g.status==='Active'?`<button class="admin-mini" data-admin-action="extend-grant" data-id="${g.id}">Extend</button><button class="admin-mini" data-admin-action="revoke-grant" data-id="${g.id}">Revoke</button>`:''}</div></article>`;}
  function renderBulk(){els.page.innerHTML=`<div class="page-shell">${heading('Bulk Access','Preview duplicates and conflicts before any controlled batch operation.',`<button class="primary-button" data-admin-action="bulk-access">Start dry run</button>`)}<div class="admin-panel"><div class="admin-panel-head"><div><h2>Dry-run boundary</h2><p>No operation applies until preview and exact scope verification pass.</p></div></div><div class="admin-list"><div class="admin-list-row"><span class="admin-list-icon">1</span><div class="admin-list-main"><strong>Upload exact learner identifiers</strong><small>Normalized email may support pending claim; UID remains authoritative.</small></div></div><div class="admin-list-row"><span class="admin-list-icon">2</span><div class="admin-list-main"><strong>Select one scope and target</strong><small>PLAN, MODULE, BUNDLE or ITEM.</small></div></div><div class="admin-list-row"><span class="admin-list-icon">3</span><div class="admin-list-main"><strong>Review duplicates and conflicts</strong><small>Apply only after final verification report.</small></div></div></div></div></div>`;}
  function renderClaims(){
    let list=filteredPeople(data.pendingClaims);
    if(state.collectionFilter!=='all')list=list.filter(c=>String(c.status||'pending').toLowerCase().includes(state.collectionFilter));
    list=sortCollection(list,state.sort);
    const toolbar=collectionToolbar({chips:[['all','All'],['pending','Pending'],['claimed','Claimed'],['expired','Expired']],sorts:[['default','Default'],['recent','Recent'],['name','Email']],summary:`${list.length} claims`});
    els.page.innerHTML=`<div class="page-shell">${heading('Pending Claims','Email invitations remain pending until safely claimed by an authenticated UID.',`<button class="primary-button" data-admin-action="new-claim">Create pending access</button>`)}${toolbar}<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Email</th><th>Scope</th><th>Target</th><th>Status</th><th>Created</th></tr></thead><tbody>${list.length?list.map(c=>`<tr><td>${esc(c.email)}</td><td>${esc(c.scope)}</td><td>${esc(c.target)}</td><td><span class="admin-status ${statusClass(c.status)}">${esc(c.status)}</span></td><td>${esc(c.created)}</td></tr>`).join(''):'<tr><td colspan="5"><div class="empty-state"><h3>No matching claims</h3><p>No real access invitations match the selected filters.</p></div></td></tr>'}</tbody></table></div></div>`;
  }



  function collectionToolbar({chips=[['all','All']],allowView=false,sorts=[['default','Default']],summary=''}={}){
    const chipHtml=chips.map(([id,label])=>`<button class="admin-chip ${state.collectionFilter===id?'active':''}" data-admin-collection-filter="${esc(id)}">${esc(label)}</button>`).join('');
    const sortHtml=sorts.length>1?`<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)"><span>Sort</span><select data-admin-sort aria-label="Sort current Admin collection">${sorts.map(([id,label])=>`<option value="${esc(id)}" ${state.sort===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`:'';
    const viewHtml=allowView?`<div class="view-toggle"><button data-admin-view="list" class="${state.view==='list'?'active':''}" aria-label="Admin list view">☷</button><button data-admin-view="grid" class="${state.view==='grid'?'active':''}" aria-label="Admin grid view">▦</button></div>`:'';
    return `<section class="admin-toolbar"><div class="admin-chip-row">${chipHtml}</div><div style="display:flex;align-items:center;gap:10px">${summary?`<small>${esc(summary)}</small>`:''}${sortHtml}${viewHtml}</div></section>`;
  }
  function valueTime(value){const time=new Date(value||0).getTime();return Number.isFinite(time)?time:0;}
  function sortCollection(list=[],kind='default'){
    const copy=[...list];
    const label=item=>String(item.name||item.learner||item.title||item.email||item.action||'');
    if(kind==='name')return copy.sort((a,b)=>label(a).localeCompare(label(b)));
    if(kind==='name-desc')return copy.sort((a,b)=>label(b).localeCompare(label(a)));
    if(kind==='expiry')return copy.sort((a,b)=>(parseGrantDate(a.expires)?.getTime()||Infinity)-(parseGrantDate(b.expires)?.getTime()||Infinity));
    if(kind==='recent')return copy.sort((a,b)=>valueTime(b.updatedAt||b.createdAt||b.dateMillis||b.timeMillis||b.lastActive)-valueTime(a.updatedAt||a.createdAt||a.dateMillis||a.timeMillis||a.lastActive));
    if(kind==='plan')return copy.sort((a,b)=>String(a.plan||a.target||'').localeCompare(String(b.plan||b.target||'')));
    return copy;
  }
  function filteredPeople(list){const q=state.query.trim().toLowerCase();return q?list.filter(x=>Object.values(x).join(' ').toLowerCase().includes(q)):list;}
  function renderPeople(){
    if(state.context==='mentors')return renderMentors();
    if(state.context==='migration')return renderMigration();
    let list=filteredPeople(data.learners).filter(l=>!isStaffLearnerRecord(l));
    if(state.collectionFilter==='premium')list=list.filter(l=>String(l.plan).toUpperCase()==='PREMIUM');
    if(state.collectionFilter==='free')list=list.filter(l=>String(l.plan).toUpperCase()==='FREE');
    if(state.collectionFilter==='active')list=list.filter(l=>String(l.status).toLowerCase()==='active');
    if(state.collectionFilter==='mentor')list=list.filter(l=>normalizedEmail(l.mentorEmail)==='dr.varshamaru@gmail.com'||String(l.mentor).toLowerCase().includes('varsha'));
    list=sortCollection(list,state.sort);
    const toolbar=collectionToolbar({chips:[['all','All'],['active','Active'],['premium','Premium'],['free','Free'],['mentor','Dr. Varsha']],sorts:[['default','Default'],['name','Name A–Z'],['name-desc','Name Z–A'],['plan','Plan'],['recent','Last active']],summary:`${list.length} learners`});
    els.page.innerHTML=`<div class="page-shell">${heading('Learners','Identity-linked profiles, exact access, progress, results and mentor assignment in one Drive workspace.',`<button class="secondary-button" data-admin-action="migration">Account migration</button><button class="primary-button" data-admin-action="add-learner">Invite learner</button>`)}${toolbar}<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Learner</th><th>Plan</th><th>Status</th><th>Progress</th><th>Access</th><th>Mentor</th><th>Last active</th><th></th></tr></thead><tbody>${list.length?list.map(l=>`<tr><td><strong>${esc(l.name)}</strong><small>${esc(l.email)}</small></td><td>${esc(l.plan)}</td><td><span class="admin-status ${statusClass(l.status)}">${esc(l.status)}</span></td><td>${l.progress}%</td><td>${l.accessCount}</td><td>${esc(l.mentor||'Dr. Varsha Maru')}</td><td>${esc(l.lastActive)}</td><td><button class="admin-mini" data-admin-action="learner-detail" data-id="${l.id}">Open</button></td></tr>`).join(''):'<tr><td colspan="8"><div class="empty-state"><h3>No matching learners</h3><p>Verified Student accounts appear automatically and receive the default mentor relationship.</p></div></td></tr>'}</tbody></table></div></div>`;
  }
  function renderMentors(){
    let list=filteredPeople(data.mentors);
    if(state.collectionFilter==='active')list=list.filter(m=>String(m.status).toLowerCase()==='active');
    list=sortCollection(list,state.sort);
    const toolbar=collectionToolbar({chips:[['all','All'],['active','Active']],sorts:[['default','Default'],['name','Name A–Z']],summary:`${list.length} mentors`});
    els.page.innerHTML=`<div class="page-shell">${heading('Mentors','Manage mentor roles, assigned learners and access-aware assignment responsibility.',`<button class="primary-button" data-admin-action="add-mentor">Activate mentor</button>`)}${toolbar}${list.length?`<div class="admin-folder-grid">${list.map(m=>`<article class="admin-panel"><div class="admin-list-row" style="border:0;padding:0"><span class="admin-list-icon">${esc(String(m.name||'M')[0])}</span><div class="admin-list-main"><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small></div><span class="admin-status ${statusClass(m.status)}">${esc(m.status)}</span></div><div class="workspace-stats" style="margin-top:14px"><div class="stat-tile"><strong>${Number(m.learners)||0}</strong><small>Learners</small></div><div class="stat-tile"><strong>${Number(m.assignments)||0}</strong><small>Assignments</small></div></div><button class="secondary-button" style="width:100%;margin-top:13px" data-admin-action="mentor-detail" data-id="${m.id}">Open mentor workspace</button></article>`).join('')}</div>`:'<div class="empty-state"><h3>No mentor profile found</h3><p>The designated Dr. Varsha Maru account can be activated after its first secure sign-in.</p></div>'}</div>`;
  }
  function renderMigration(){els.page.innerHTML=`<div class="page-shell">${heading('Accounts & Migration','Move ownership and access between verified identities with backup, dry run, rollback and duplicate prevention.',`<button class="primary-button" data-admin-action="migration">Start controlled migration</button>`)}<div class="admin-two-col"><section class="admin-panel"><div class="admin-panel-head"><div><h2>Migration sequence</h2><p>No blind merge between accounts.</p></div></div><div class="timeline"><div class="timeline-item"><span class="timeline-number">1</span><div><strong>Audit source and target UID</strong><small>Detect duplicate ownership and active grants.</small></div><span class="timeline-state">Required</span></div><div class="timeline-item"><span class="timeline-number">2</span><div><strong>Create backups and dry run</strong><small>Preview entitlements, results and activity movement.</small></div><span class="timeline-state">Required</span></div><div class="timeline-item"><span class="timeline-number">3</span><div><strong>Apply, verify and preserve rollback</strong><small>No lost outcomes or duplicate active access.</small></div><span class="timeline-state">Required</span></div></div></section><section class="admin-panel"><h3>Identity lock</h3><p>Firebase UID is authoritative. Email supports pending claims only and blank UIDs never match.</p><div class="admin-preview-box"><strong>Controlled dry-run boundary</strong><p>The audit report reads real identities and entitlements; no ownership mutation occurs until a separately verified migration apply step.</p></div></section></div></div>`;}

  function renderCommerce(){
    if(state.context==='plans')return renderPlans();
    let list=filteredPeople(data.payments);
    if(state.collectionFilter==='pending')list=list.filter(p=>String(p.status).toLowerCase()==='pending');
    if(state.collectionFilter==='verified')list=list.filter(p=>String(p.status).toLowerCase()==='verified');
    if(state.collectionFilter==='provisioned')list=list.filter(p=>p.accessProvisioned===true);
    if(state.collectionFilter==='not-provisioned')list=list.filter(p=>p.accessProvisioned!==true);
    list=sortCollection(list,state.sort);
    const toolbar=collectionToolbar({chips:[['all','All'],['pending','Pending'],['verified','Verified'],['not-provisioned','Access pending'],['provisioned','Provisioned']],sorts:[['default','Default'],['recent','Recent'],['name','Learner']],summary:`${list.length} payments`});
    els.page.innerHTML=`<div class="page-shell">${heading('Payments','Verify the commercial transaction first; provision access only through a separate audited Access Engine action.')}${toolbar}<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Learner</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th><th>Payment</th><th>Access</th><th></th></tr></thead><tbody>${list.length?list.map(p=>`<tr><td><strong>${esc(p.learner)}</strong><small>${esc(p.email||'')}</small></td><td>${esc(p.plan)}</td><td>${esc(p.amount)}</td><td>${esc(p.method)}</td><td>${esc(p.reference)}</td><td>${esc(p.date)}</td><td><span class="admin-status ${statusClass(p.status)}">${esc(p.status)}</span></td><td><span class="admin-status ${p.accessProvisioned?'active':'pending'}">${p.accessProvisioned?'Provisioned':'Not provisioned'}</span></td><td>${String(p.status).toLowerCase()==='pending'?`<button class="admin-mini" data-admin-action="verify-payment" data-id="${p.id}">Verify payment</button>`:!p.accessProvisioned?`<button class="admin-mini" data-admin-action="provision-payment" data-id="${p.id}">Provision access</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="9"><div class="empty-state"><h3>No matching payments</h3><p>Real payment records will appear from the payments collection.</p></div></td></tr>'}</tbody></table></div></div>`;
  }
  function renderPlans(){const plans=liveArray(data.products);els.page.innerHTML=`<div class="page-shell">${heading('Plans & Products','Commercial plans define mapped bundles; they are not compulsory navigation parents.')} ${plans.length?`<div class="admin-folder-grid">${plans.map(plan=>`<article class="admin-panel"><span class="eyebrow">${esc(plan.status||'Access product')}</span><h2 style="margin-top:8px">${esc(plan.planCode||plan.title||'PRODUCT')}</h2><div class="metric">${esc(plan.price||'₹0')}</div><p>${esc(plan.description||plan.title||'Mapped access product')}</p><button class="secondary-button" style="width:100%" data-admin-action="plan-detail" data-id="${esc(plan.id||plan.planCode)}">View product mapping</button></article>`).join('')}</div>`:'<div class="empty-state"><h3>No real access products found</h3><p>Active accessProducts will appear here from the live access product catalogue.</p></div>'}</div>`;}

  function renderSystem(){
    if(state.context==='settings')return renderSettings();
    let list=filteredPeople(data.audit);
    if(state.collectionFilter==='success')list=list.filter(a=>['success','allow','active'].includes(String(a.result).toLowerCase()));
    if(state.collectionFilter==='denied')list=list.filter(a=>['deny','denied','failed','error'].includes(String(a.result).toLowerCase()));
    if(state.collectionFilter==='access')list=list.filter(a=>/grant|access|extend|revoke|claim/i.test(String(a.action)));
    if(state.collectionFilter==='content')list=list.filter(a=>/content|resource|publish/i.test(String(a.action)));
    list=sortCollection(list,state.sort);
    const toolbar=collectionToolbar({chips:[['all','All'],['success','Success'],['denied','Denied / Failed'],['access','Access'],['content','Content']],sorts:[['recent','Recent'],['name','Action']],summary:`${list.length} records`});
    els.page.innerHTML=`<div class="page-shell">${heading('Audit & Safety','Structured evidence for publish, grant, extend, revoke, verify, assign and authorization decisions.',`<button class="secondary-button" data-admin-action="export-audit">Export evidence</button><button class="primary-button" data-admin-action="live-source-status">Live source status</button>`)}${toolbar}<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Result</th><th>Reason</th><th>Evidence</th></tr></thead><tbody>${list.length?list.map(a=>`<tr><td>${esc(a.time)}</td><td>${esc(a.actor)}</td><td><strong>${esc(a.action)}</strong></td><td>${esc(a.target)}</td><td><span class="admin-status ${statusClass(a.result)}">${esc(a.result)}</span></td><td><code>${esc(a.reason)}</code></td><td>${a.evidence?`<button class="admin-mini" data-admin-action="audit-detail" data-id="${a.id}">Details</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7"><div class="empty-state"><h3>No matching audit records</h3><p>Authorized real operations create evidence here.</p></div></td></tr>'}</tbody></table></div></div>`;
  }
  function renderSettings(){els.page.innerHTML=`<div class="page-shell">${heading('Platform Settings','Safety rules are shared platform contracts, not page-level UI flags.')}<div class="admin-two-col"><section class="admin-panel"><div class="admin-panel-head"><div><h2>Authorization settings</h2><p>Shared production contracts</p></div></div><div class="admin-list"><div class="admin-list-row"><span class="admin-list-icon">✓</span><div class="admin-list-main"><strong>Deny by default</strong><small>Unknown or failed decisions never open content.</small></div><input type="checkbox" checked disabled></div><div class="admin-list-row"><span class="admin-list-icon">↻</span><div class="admin-list-main"><strong>Direct route revalidation</strong><small>Card, copied URL and refresh reach the same decision.</small></div><input type="checkbox" checked disabled></div><div class="admin-list-row"><span class="admin-list-icon">UID</span><div class="admin-list-main"><strong>UID-authoritative identity</strong><small>Normalized email consolidates historical duplicate projections.</small></div><input type="checkbox" checked disabled></div><div class="admin-list-row"><span class="admin-list-icon">M</span><div class="admin-list-main"><strong>Default mentor policy</strong><small>Current and future learners are linked to Dr. Varsha Maru through one canonical relation.</small></div><input type="checkbox" checked disabled></div></div></section><section class="admin-panel"><div class="admin-panel-head"><div><h2>Live platform boundary</h2><p>Learning Drive integration branch</p></div></div><div class="admin-list"><div class="admin-list-row"><span class="admin-list-icon">✓</span><div class="admin-list-main"><strong>Firebase reads active</strong><small>Authenticated Admin screens use authorized real collections.</small></div></div><div class="admin-list-row"><span class="admin-list-icon">✓</span><div class="admin-list-main"><strong>Controlled writes active</strong><small>Create, grant, extend, revoke, verify, provision, invite and assignment actions use real verified services.</small></div></div><div class="admin-list-row"><span class="admin-list-icon">✓</span><div class="admin-list-main"><strong>Exact V8 visual system preserved</strong><small>The same approved shell, typography, cards and interaction language remain in place.</small></div></div><div class="admin-list-row"><span class="admin-list-icon">✓</span><div class="admin-list-main"><strong>Deployment still controlled</strong><small>Runtime verification must pass before Firebase or Vercel deployment.</small></div></div></div></section></div></div>`;}



  function addAudit(){throw new Error('Local Admin business mutations are disabled.');}
  function showDialog(title,subtitle,body,footer=''){
    closeDialog();els.overlay.hidden=false;dialog=document.createElement('section');dialog.className='admin-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',String(title));
    dialog.innerHTML=`<div class="admin-dialog-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><button class="icon-button" data-admin-action="close-dialog" aria-label="Close dialog">×</button></div><div class="admin-dialog-body">${body}</div>${footer?`<div class="admin-dialog-foot">${footer}</div>`:''}`;document.body.appendChild(dialog);
    requestAnimationFrame(()=>dialog.querySelector('input:not([type="hidden"]),select,textarea,button')?.focus());
  }
  function closeDialog(){dialog?.remove();dialog=null;if(isAdmin())els.overlay.hidden=true;}
  function toast(message,icon='✓'){const n=document.createElement('div');n.className='admin-toast';n.innerHTML=`<span>${icon}</span><span>${esc(message)}</span>`;document.body.appendChild(n);setTimeout(()=>n.remove(),2800);}

  function bulkAccessDialog(){
    showDialog('Bulk Access dry run','Parse exact learner identifiers and preview duplicate/conflict decisions without mutation.',`<form id="bulkAccessForm" class="admin-form"><label class="full">Learner emails<textarea name="emails" required></textarea></label><label>Scope<select name="scope"><option>ITEM</option><option>MODULE</option><option>BUNDLE</option><option>PLAN</option></select></label><label>Target<input name="target" required placeholder="Enter exact resource or product ID"></label><label class="full">Reason<input name="reason" required minlength="12" placeholder="Enter reason for controlled dry run"></label><div class="admin-preview-box full"><strong>Dry-run only</strong><p>Known learners receive duplicate/overlap evaluation. Unknown emails are reported as pending UID claims. No grant or claim is created.</p></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="run-bulk-preview">Run dry preview</button>`);
  }
  function runBulkPreview(){return requestLiveAction('run-bulk-preview');}
  function addLearnerDialog(){showDialog('Invite learner','Create a real onboarding invitation. The learner keeps one Firebase UID after secure sign-in and is automatically linked to Dr. Varsha Maru.',`<form id="addLearnerForm" class="admin-form"><label class="full">Name<input name="name" required minlength="2"></label><label class="full">Email<input name="email" type="email" required></label><label>Commercial plan<select name="plan"><option>FREE</option><option>BASIC</option><option>PREMIUM</option><option>MENTOR-GUIDED</option></select></label><label>Default mentor<input name="mentor" value="Dr. Varsha Maru" readonly></label><div class="admin-preview-box full"><strong>Real account lifecycle</strong><p>No duplicate Auth account is created here. The invitation is claimed by the learner's authenticated UID and then appears once in the live directory.</p></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="submit-learner">Create onboarding invite</button>`);}
  function submitLearner(){return requestLiveAction('submit-learner');}
  function addMentorDialog(){showDialog('Activate designated mentor','Activate the existing secure Mentor account and make it the canonical default mentor for current and future learners.',`<form id="addMentorForm" class="admin-form"><label class="full">Name<input name="name" required minlength="2" value="Dr. Varsha Maru"></label><label class="full">Email<input name="email" type="email" required value="dr.varshamaru@gmail.com" readonly></label><div class="admin-preview-box full"><strong>Existing account only</strong><p>The Mentor must first sign in with this designated Google account. No second or placeholder Mentor identity is created.</p></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="submit-mentor">Activate mentor</button>`);}
  function submitMentor(){return requestLiveAction('submit-mentor');}
  function learnerDetail(id){const l=learner(id);if(!l)return;const grants=data.grants.filter(g=>g.learnerId===id);showDialog(l.name,'Identity-linked learner workspace',`<div class="admin-identity-summary"><span class="admin-status ${statusClass(l.status)}">${esc(l.status)}</span><div><strong>${esc(l.name)} · ${esc(l.plan)}</strong><small>${esc(l.email)} · Mentor: ${esc(l.mentor)}</small></div></div><div class="workspace-stats"><div class="stat-tile"><strong>${l.progress}%</strong><small>Progress</small></div><div class="stat-tile"><strong>${l.accessCount}</strong><small>Access signals</small></div><div class="stat-tile"><strong>${grants.filter(g=>g.status==='Active').length}</strong><small>Active grants</small></div></div><div class="admin-list">${grants.map(g=>`<div class="admin-list-row"><span class="admin-list-icon">◉</span><div class="admin-list-main"><strong>${esc(g.title)}</strong><small>${esc(g.scope)} · ${esc(g.status)} · ${esc(g.source)}</small></div></div>`).join('')||'<div class="empty-state"><p>No entitlement records.</p></div>'}</div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);} 
  function mentorDetail(id){const m=data.mentors.find(x=>x.id===id);if(!m)return;const assigned=data.learners.filter(l=>l.mentor===m.name);showDialog(m.name,'Mentor role and assigned learner workspace',`<div class="admin-identity-summary"><span class="admin-status active">${esc(m.status)}</span><div><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small></div></div><div class="workspace-stats"><div class="stat-tile"><strong>${assigned.length}</strong><small>Assigned learners</small></div><div class="stat-tile"><strong>${m.assignments}</strong><small>Assignments</small></div><div class="stat-tile"><strong>${m.questions}</strong><small>Questions</small></div></div><div class="admin-list">${assigned.map(l=>`<div class="admin-list-row"><span class="admin-list-icon">${esc(l.name[0])}</span><div class="admin-list-main"><strong>${esc(l.name)}</strong><small>${esc(l.plan)} · ${l.progress}% progress · ${l.accessCount} access</small></div></div>`).join('')||'<div class="empty-state"><p>No assigned learners.</p></div>'}</div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);} 
  function newClaimDialog(){showDialog('Create pending access claim','Email is only a pending invitation key; authenticated UID remains authoritative.',`<form id="newClaimForm" class="admin-form"><label class="full">Normalized email<input name="email" type="email" required></label><label>Scope<select name="scope"><option>ITEM</option><option>MODULE</option><option>BUNDLE</option><option>PLAN</option></select></label><label>Target<input name="target" required placeholder="Enter exact resource or product ID"></label><label class="full">Reason<input name="reason" required minlength="12" placeholder="Enter reason for pending access"></label></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="submit-claim">Create pending claim</button>`);} 
  function submitClaim(){return requestLiveAction('submit-claim');}
  function planDetail(id){const product=liveArray(data.products).find(item=>String(item.id||item.planCode)===String(id));if(!product)return genericDialog('Product unavailable','The selected live access product is no longer available.');const modules=liveArray(product.moduleKeys);showDialog(`${product.planCode||product.title} product mapping`,'Commercial product mapping is separate from navigation and authorization.',`<div class="admin-preview-box"><strong>${esc(product.title||'Access product')} · ${esc(product.price||'₹0')}</strong><p>${esc(product.description||'Real access product')}</p></div><div class="admin-preview-box"><strong>Mapped modules</strong><p>${modules.length?modules.map(esc).join(' · '):'No module mapping published in this product record.'}</p></div><div class="admin-grant-check clear"><strong>Authorization lock</strong><p>Plan membership opens only mapped Published resources and never bypasses action-level checks.</p><code>PLAN_MAPPING_EXPLICIT</code></div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);}
  function migrationDialog(){showDialog('Controlled account migration','Inspect real source and target identities, conflicts and rollback boundaries before any separately approved apply step.',`<form id="migrationForm" class="admin-form"><label>Source learner<select name="source">${data.learners.map(l=>`<option value="${l.id}">${esc(l.name)} · ${esc(l.email)}</option>`).join('')}</select></label><label>Target learner<select name="target">${data.learners.map(l=>`<option value="${l.id}">${esc(l.name)} · ${esc(l.email)}</option>`).join('')}</select></label><label class="full">Migration reason<textarea name="detail" required minlength="12"></textarea></label><div class="admin-preview-box full"><strong>Dry-run boundary</strong><p>No identity, ownership or entitlement mutation will occur. The report checks self-merge and exact active-grant conflicts.</p></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="run-migration-dry">Run dry run</button>`);} 
  function runMigrationDry(){return requestLiveAction('run-migration-dry');}
  function createResourceDialog(){showDialog('Create canonical resource','Save a Draft or Stage for review. Publication remains a separate audited decision.',`<form id="adminCreateResourceForm" class="admin-form"><label class="full">Title<input name="title" required minlength="4" value="New IntelliText Learning Note"></label><label>Resource type<select name="type"><option>Native Note</option><option>PDF Note</option><option>Video</option><option>Mock Test</option><option>Current Affairs</option><option>Roadmap</option><option>Replay</option></select></label><label>Subject<select name="subject"><option>CDP</option><option>English</option><option>Hindi</option><option>Mathematics</option><option>EVS</option><option>Social Science</option></select></label><label class="full">Chapter / collection<input name="chapter" required value="Learning Theories"></label><label>Access mapping<select name="access"><option>PREMIUM</option><option>BASIC</option><option>FREE</option><option>ITEM</option><option>BUNDLE</option><option>MENTOR-GUIDED</option></select></label><label>Initial workflow state<select name="status"><option>Draft</option><option>Staged</option></select></label><label class="full">Summary<textarea name="summary" required minlength="12">Structured learning blocks, examples, exam points and revision checkpoint.</textarea></label><div class="admin-preview-box full"><strong>Canonical identity preview</strong><p>One stable resource ID will be created. Plans, modules and bundles map to it; Published is unavailable until a separate student-preview confirmation.</p></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="submit-resource">Save canonical resource</button>`);}
  function submitResource(){return requestLiveAction('submit-resource');}
  const PLAN_ORDER={FREE:0,BASIC:1,PREMIUM:2,'MENTOR-GUIDED':3,MENTORSHIP:3};
  const PLAN_MODULES={
    FREE:[],
    BASIC:['NOTES','MOCK_TESTS'],
    PREMIUM:['NOTES','VIDEOS','MOCK_TESTS','CURRENT_AFFAIRS','ROADMAPS'],
    'MENTOR-GUIDED':['NOTES','VIDEOS','MOCK_TESTS','CURRENT_AFFAIRS','ROADMAPS','LIVE_REPLAYS'],
    MENTORSHIP:['NOTES','VIDEOS','MOCK_TESTS','CURRENT_AFFAIRS','ROADMAPS','LIVE_REPLAYS']
  };
  const MODULE_TARGETS=[
    ['NOTES','Notes / IntelliText'],['VIDEOS','Videos'],['MOCK_TESTS','Mock Tests'],
    ['CURRENT_AFFAIRS','Current Affairs'],['ROADMAPS','Roadmaps'],['LIVE_REPLAYS','Live & Replays']
  ];
  function bundleTargets(){
    return liveArray(data.products)
      .filter(product=>String(product.scopeType||'').toLowerCase()==='bundle')
      .filter(product=>String(product.status||'Active').toLowerCase()==='active')
      .map(product=>({
        id:String(product.bundleId||product.id||''),
        label:String(product.title||product.bundleId||product.id||'Bundle'),
        members:liveArray(product.itemIds).map(String).filter(Boolean)
      }))
      .filter(bundle=>bundle.id);
  }
  function resourceModule(r){return ({'Native Note':'NOTES','PDF Note':'NOTES','Video':'VIDEOS','Mock Test':'MOCK_TESTS','Current Affairs':'CURRENT_AFFAIRS','Roadmap':'ROADMAPS','Replay':'LIVE_REPLAYS'})[r?.type]||'';}
  function activeGrants(learnerId){return data.grants.filter(g=>g.learnerId===learnerId&&g.status==='Active');}
  function planCoversResource(plan,r){
    if(!r)return false;
    if(r.access==='FREE')return true;
    if(!(plan in PLAN_ORDER)||!(r.access in PLAN_ORDER))return false;
    return PLAN_ORDER[plan]>=PLAN_ORDER[r.access];
  }
  function bundleById(id){return bundleTargets().find(b=>b.id===id);}
  function resourceCoveredByGrant(r,g){
    if(!r||!g)return false;
    if(g.scope==='ITEM')return g.target===r.id;
    if(g.scope==='PLAN')return planCoversResource(g.target,r);
    if(g.scope==='MODULE')return g.target===resourceModule(r);
    if(g.scope==='BUNDLE')return !!bundleById(g.target)?.members.includes(r.id);
    return false;
  }
  function targetOptions(scope){
    if(scope==='PLAN')return [['FREE','FREE plan'],['BASIC','BASIC plan'],['PREMIUM','PREMIUM plan'],['MENTOR-GUIDED','MENTOR-GUIDED plan']];
    if(scope==='MODULE')return MODULE_TARGETS;
    if(scope==='BUNDLE')return bundleTargets().map(b=>[b.id,b.label]);
    return data.resources.map(r=>[r.id,`${r.title} · ${r.type} · ${r.access}`]);
  }
  function evaluateGrantSelection(learnerId,scope,target){
    const l=learner(learnerId),grants=activeGrants(learnerId),exact=grants.find(g=>g.scope===scope&&g.target===target);
    if(exact)return {blocked:true,level:'blocked',code:'EXACT_DUPLICATE_ACTIVE_GRANT',message:`Exact ${scope} grant is already active for ${l.name}. No second grant will be created.`};
    if(scope==='PLAN'){
      const existing=grants.find(g=>g.scope==='PLAN');
      if(existing){
        const sameOrHigher=(PLAN_ORDER[existing.target]??-1)>=(PLAN_ORDER[target]??-1);
        return {blocked:true,level:'blocked',code:sameOrHigher?'REDUNDANT_BY_ACTIVE_PLAN':'ACTIVE_PLAN_CHANGE_REQUIRED',message:sameOrHigher?`${existing.target} plan already provides the same or broader access. Use Extend/Change instead of creating an overlapping plan grant.`:`${existing.target} plan is already active. Use the controlled Change Plan workflow so two active plans are not created.`};
      }
    }
    if(scope==='ITEM'){
      const r=resource(target);
      if(!r)return {blocked:true,level:'blocked',code:'INVALID_ITEM_TARGET',message:'The selected resource no longer exists. Refresh and select a valid canonical resource.'};
      if(r.access==='FREE')return {blocked:true,level:'blocked',code:'REDUNDANT_PUBLIC_FREE_RESOURCE',message:`${r.title} is already FREE. An ITEM grant would add no access.`};
      const covering=grants.find(g=>resourceCoveredByGrant(r,g));
      if(covering){
        const source=covering.scope==='PLAN'?`${covering.target} plan`:covering.scope==='MODULE'?`${covering.target} module`:covering.scope==='BUNDLE'?`${bundleById(covering.target)?.label||covering.target} bundle`:'an active ITEM grant';
        return {blocked:true,level:'blocked',code:`REDUNDANT_BY_ACTIVE_${covering.scope}`,message:`Already covered by active ${source}. The redundant ITEM grant is blocked.`};
      }
    }
    if(scope==='MODULE'){
      const plan=grants.find(g=>g.scope==='PLAN'&&(PLAN_MODULES[g.target]||[]).includes(target));
      if(plan)return {blocked:true,level:'blocked',code:'REDUNDANT_MODULE_BY_ACTIVE_PLAN',message:`${target} is already included in the active ${plan.target} plan. The redundant MODULE grant is blocked.`};
    }
    if(scope==='BUNDLE'){
      const b=bundleById(target);if(!b)return {blocked:true,level:'blocked',code:'INVALID_BUNDLE_TARGET',message:'The selected bundle definition is unavailable.'};
      const covered=b.members.filter(id=>{const r=resource(id);return r?.access==='FREE'||grants.some(g=>resourceCoveredByGrant(r,g));});
      if(covered.length===b.members.length)return {blocked:true,level:'blocked',code:'REDUNDANT_BUNDLE_FULLY_COVERED',message:`All ${b.members.length} bundle resources are already accessible. The redundant BUNDLE grant is blocked.`};
      if(covered.length)return {blocked:false,level:'warning',code:'PARTIAL_BUNDLE_OVERLAP',message:`${covered.length} of ${b.members.length} bundle resources are already accessible. This grant adds only the remaining ${b.members.length-covered.length}.`};
    }
    return {blocked:false,level:'clear',code:'EXACT_SCOPE_AVAILABLE',message:'No active duplicate or broader entitlement covers this selection. The exact scoped grant may be created.'};
  }
  function grantEffect(scope,target){
    if(scope==='ITEM'){const r=resource(target);return `ITEM opens only “${r?.title||target}”. It never changes the learner’s commercial plan.`;}
    if(scope==='PLAN')return `PLAN opens only resources explicitly mapped to ${target}, subject to publication and action-level authorization.`;
    if(scope==='MODULE')return `MODULE opens only the ${target} boundary. Other modules and the commercial plan remain unchanged.`;
    const b=bundleById(target);return `BUNDLE opens exactly ${b?.members.length||0} listed resources in “${b?.label||target}”; future non-members remain locked.`;
  }
  function refreshGrantTarget(reset=true){
    const f=document.getElementById('adminGrantForm');if(!f)return;const scope=f.elements.scope.value,target=f.elements.target,previous=target.value;
    target.innerHTML=targetOptions(scope).map(([v,label])=>`<option value="${esc(v)}">${esc(label)}</option>`).join('');
    if(!reset&&[...target.options].some(o=>o.value===previous))target.value=previous;
    validateGrantForm();
  }
  function validateGrantForm(){
    const f=document.getElementById('adminGrantForm');if(!f)return null;
    const learnerId=f.elements.learner.value,scope=f.elements.scope.value,target=f.elements.target.value,result=evaluateGrantSelection(learnerId,scope,target);
    const starts=String(f.elements.starts.value||''),expires=String(f.elements.expires.value||''),reason=String(f.elements.reason.value||'').trim(),confirmed=!!f.elements.confirm.checked;
    const dateValid=!!starts&&!!expires&&new Date(expires+'T00:00:00Z')>new Date(starts+'T00:00:00Z');
    const evidenceValid=reason.length>=12&&confirmed&&dateValid;
    const box=document.getElementById('grantValidationBox'),effect=document.getElementById('grantEffectText'),submit=document.getElementById('grantSubmitButton');
    if(effect)effect.textContent=grantEffect(scope,target);
    const blocked=result.blocked||!evidenceValid;
    if(box){
      const extra=!dateValid?' Start must be earlier than expiry.':reason.length<12?' A meaningful reason is required.':!confirmed?' Confirm the exact effect before granting.':'';
      box.className=`admin-grant-check full ${result.blocked?'blocked':evidenceValid?(result.level==='warning'?'warning':'clear'):'warning'}`;
      box.innerHTML=`<strong>${result.blocked?'Grant blocked':evidenceValid?(result.level==='warning'?'Overlap reviewed':'Ready for audited grant'):'Confirmation required'}</strong><p>${esc(result.message+extra)}</p><code>${esc(result.blocked?result.code:evidenceValid?result.code:'GRANT_EVIDENCE_INCOMPLETE')}</code>`;
    }
    if(submit){submit.disabled=blocked;submit.setAttribute('aria-disabled',String(blocked));}
    return {...result,evidenceValid,dateValid,blocked,code:result.blocked?result.code:evidenceValid?result.code:'GRANT_EVIDENCE_INCOMPLETE'};
  }
  function grantDialog(){
    showDialog('Grant exact access','Preview duplicate, overlap, validity and exact effect before creating an audited entitlement',`<form id="adminGrantForm" class="admin-form"><label>Learner<select name="learner" id="grantLearner">${data.learners.map(l=>`<option value="${l.id}">${esc(l.name)} · ${esc(l.plan)}</option>`).join('')}</select></label><label>Scope<select name="scope" id="grantScope"><option>ITEM</option><option>PLAN</option><option>MODULE</option><option>BUNDLE</option></select></label><label class="full">Target<select name="target" id="grantTarget"></select></label><label>Start<input name="starts" type="date" required value="${dateInputValue(new Date())}"></label><label>Expiry<input name="expires" type="date" required value="${dateInputValue(new Date(Date.now()+365*86400000))}"></label><label class="full">Reason<input name="reason" required minlength="12" value="Controlled access verification"></label><div class="admin-preview-box full"><strong>Exact effect preview</strong><p id="grantEffectText"></p></div><label class="admin-confirm-check full"><input type="checkbox" name="confirm"><span>I confirm the learner, exact target, validity and access effect shown above.</span></label><div id="grantValidationBox" class="admin-grant-check full" role="status" aria-live="polite"></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" id="grantSubmitButton" data-admin-action="submit-grant">Create audited grant</button>`);
    const f=document.getElementById('adminGrantForm');f.elements.scope.addEventListener('change',()=>refreshGrantTarget(true));['learner','target','starts','expires','reason','confirm'].forEach(n=>f.elements[n].addEventListener(n==='confirm'?'change':'input',validateGrantForm));f.elements.target.addEventListener('change',validateGrantForm);f.elements.learner.addEventListener('change',validateGrantForm);refreshGrantTarget(true);
  }
  function submitGrant(){return requestLiveAction('submit-grant');}
  function verifyPaymentDialog(id){
    const p=data.payments.find(x=>x.id===id);if(!p)return;
    showDialog('Verify payment only','Validate the real commercial record. This does not create access.',`<form id="adminPaymentVerifyForm" class="admin-form"><input type="hidden" name="paymentId" value="${esc(id)}"><div class="admin-list full"><div class="admin-list-row"><span class="admin-list-icon">₹</span><div class="admin-list-main"><strong>${esc(p.learner)} · ${esc(p.plan)}</strong><small>${esc(p.amount)} • ${esc(p.reference)} • ${esc(p.date)}</small></div></div></div><label>Admin UTR<input name="adminUtr" required minlength="4" placeholder="Verified bank/UPI reference"></label><label>Evidence note<input name="adminProof" required minlength="4" placeholder="Statement or verification reference"></label><label class="admin-confirm-check"><input type="checkbox" name="utrMatch" required><span>UTR/reference matches</span></label><label class="admin-confirm-check"><input type="checkbox" name="amountMatch" required><span>Amount matches</span></label><label class="admin-confirm-check full"><input type="checkbox" name="confirm" required><span>I confirm that this payment evidence was checked against the real transaction.</span></label><div class="admin-change-grid full"><section class="admin-change-box before"><span>Before</span><strong>${esc(p.status)}</strong><p>Commercial record awaits verification.</p></section><section class="admin-change-box after"><span>After</span><strong>Verified</strong><p>Access remains unchanged until a separate Access Engine provision action.</p></section></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="confirm-payment" data-id="${id}">Verify real payment</button>`);
  }
  function confirmPayment(id){return requestLiveAction('confirm-payment',id);}
  function provisionPaymentDialog(id){
    const p=data.payments.find(x=>x.id===id),l=p&&learner(p.learnerId);if(!p)return;
    const existing=l?activeGrants(l.id).find(g=>g.scope==='PLAN'):null;
    const blocked=!!existing;const message=existing?`${existing.target} PLAN is already active. A second active PLAN is blocked; use controlled plan change instead.`:`No overlapping active PLAN was found. Provisioning will use the real product mapping and Access Engine.`;
    showDialog('Provision verified payment','A separate real Access Engine action creates mapped access only after payment verification.',`<form id="adminPaymentProvisionForm" class="admin-form"><input type="hidden" name="paymentId" value="${esc(id)}"><div class="admin-identity-summary full"><span class="admin-status ${statusClass(p.status)}">${esc(p.status)}</span><div><strong>${esc(p.learner)} · ${esc(p.plan)}</strong><small>${esc(p.reference)} · Payment ${esc(p.id)}</small></div></div><label>Access start<input name="starts" type="date" required value="${dateInputValue(new Date())}"></label><label>Access expiry<input name="expires" type="date" required value="${dateInputValue(new Date(Date.now()+365*86400000))}"></label><label class="admin-confirm-check full"><input type="checkbox" name="confirm" required ${blocked?'disabled':''}><span>I confirm the product mapping, validity and separate entitlement creation.</span></label><div class="admin-preview-box full"><strong>Access Engine decision</strong><p>${esc(message)}</p></div><div class="admin-grant-check full ${blocked?'blocked':'clear'}"><strong>${blocked?'Provision blocked':'Ready to provision'}</strong><p>${blocked?'No overlapping plan grant will be created.':'Commercial payment and entitlement remain separate audit records.'}</p><code>${blocked?'ACTIVE_PLAN_CHANGE_REQUIRED':'PAYMENT_VERIFIED_PLAN_AVAILABLE'}</code></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" data-admin-action="confirm-provision" data-id="${id}" ${blocked?'disabled':''}>Create real PLAN grant</button>`);
  }
  function confirmProvision(id){return requestLiveAction('confirm-provision',id);}
  function publishResource(id){
    const r=resource(id);if(!r)return;
    if(r.status==='Published')return genericDialog('Already published','This canonical resource is already Published. No second publication mutation was applied.');
    showDialog('Publish canonical resource','Review the learner-facing identity, access mapping and publication effect before mutation.',`<form id="adminPublishForm" class="admin-form"><input type="hidden" name="resourceId" value="${esc(r.id)}"><div class="admin-identity-summary full"><span class="admin-status ${statusClass(r.status)}">${esc(r.status)}</span><div><strong>${esc(r.title)}</strong><small>${esc(r.type)} · ${esc(r.subject)}${r.chapter?` · ${esc(r.chapter)}`:''}</small><h3>Access mapping: ${esc(r.access)}</h3></div></div><div class="admin-change-grid full"><section class="admin-change-box before"><span>Before</span><strong>${esc(r.status)}</strong><p>Not available through Published discovery paths.</p></section><section class="admin-change-box after"><span>After</span><strong>Published</strong><p>Visible in discovery; protected opening still uses central authorization and the mapped ${esc(r.access)} boundary.</p></section></div><label class="full">Publication reason<textarea name="detail" required minlength="12" placeholder="Explain why this resource is ready for learners."></textarea></label><label class="admin-confirm-check full"><input type="checkbox" name="confirm"><span>I reviewed canonical identity, learner-facing preview, access mapping and the publication effect.</span></label><div id="publishValidationBox" class="admin-grant-check full warning"><strong>Confirmation required</strong><p>Enter a meaningful publication reason and confirm the preview.</p><code>PUBLISH_CONFIRMATION_INCOMPLETE</code></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" id="publishSubmitButton" data-admin-action="confirm-publish" data-id="${id}" disabled>Publish with audit</button>`);
    const f=document.getElementById('adminPublishForm');const validate=()=>{const ready=String(f.elements.detail.value||'').trim().length>=12&&f.elements.confirm.checked;const b=document.getElementById('publishSubmitButton');b.disabled=!ready;const box=document.getElementById('publishValidationBox');box.className=`admin-grant-check full ${ready?'clear':'warning'}`;box.innerHTML=ready?'<strong>Ready to publish</strong><p>Preview and access mapping confirmed.</p><code>PUBLISH_READY</code>':'<strong>Confirmation required</strong><p>Enter a meaningful publication reason and confirm the preview.</p><code>PUBLISH_CONFIRMATION_INCOMPLETE</code>';};f.elements.detail.addEventListener('input',validate);f.elements.confirm.addEventListener('change',validate);
  }
  function confirmPublish(id){return requestLiveAction('confirm-publish',id);}
  function grantDetail(id){const g=data.grants.find(x=>x.id===id),l=g&&learner(g.learnerId);if(!g)return;showDialog(g.title,'Access decision evidence',`<div class="admin-access-card"><span class="admin-status ${statusClass(g.status)}">${esc(g.status)}</span><h3>${esc(l?l.name:g.learnerId)}</h3><p>Scope: <strong>${esc(g.scope)}</strong><br>Target: ${esc(g.target)}<br>Source: ${esc(g.source)}<br>Valid: ${esc(g.starts)} → ${esc(g.expires)}</p><div class="admin-preview-box"><strong>Authorization conclusion</strong><p>${g.scope==='ITEM'?'Only this exact resource is opened; no broad plan access.':'Only the mapped scope and allowed actions are opened.'}</p></div></div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);}
  function extendGrant(id){
    const g=data.grants.find(x=>x.id===id),l=g&&learner(g.learnerId);if(!g)return;
    if(g.status!=='Active')return genericDialog('Extend unavailable','Only an Active entitlement can be extended. No mutation was applied.');
    showDialog('Extend exact access','Review current validity, choose a later expiry and create before/after audit evidence.',`<form id="adminExtendForm" class="admin-form"><div class="admin-identity-summary full"><span class="admin-status active">Active</span><div><strong>${esc(l?.name||g.learnerId)} · ${esc(l?.plan||'Unknown')}</strong><small>Grant ${esc(g.id)} · ${esc(g.scope)} · ${esc(g.source)}</small><h3>${esc(g.title)}</h3></div></div><label>Current expiry<input name="current" value="${esc(g.expires)}" readonly></label><label>New expiry<input name="next" type="date" required value="${dateInputValue(new Date(Date.now()+365*86400000))}"></label><label class="full">Extension reason<textarea name="detail" required minlength="12">Controlled access verification: extend this exact entitlement after reviewing validity.</textarea></label><div class="admin-change-grid full"><section class="admin-change-box before"><span>Before</span><strong>${esc(g.expires)}</strong><p>Current grant remains active until this date.</p></section><section class="admin-change-box after"><span>After</span><strong id="extendAfterDate">31 Dec 2027</strong><p>Only validity changes. Scope, target, source and commercial plan remain unchanged.</p></section></div><label class="admin-confirm-check full"><input type="checkbox" name="confirm"><span>I confirm the exact grant, new expiry and unchanged scope/commercial plan.</span></label><div id="extendValidationBox" class="admin-grant-check full warning"><strong>Confirmation required</strong><p>Choose a later expiry, provide a reason and confirm the effect.</p><code>EXTEND_CONFIRMATION_INCOMPLETE</code></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" id="extendSubmitButton" data-admin-action="confirm-extend" data-id="${id}" disabled>Create audited extension</button>`);
    const f=document.getElementById('adminExtendForm');const validate=()=>{const current=parseGrantDate(g.expires),next=new Date(f.elements.next.value+'T00:00:00Z'),reason=String(f.elements.detail.value||'').trim(),ready=current&&next>current&&reason.length>=12&&f.elements.confirm.checked;document.getElementById('extendAfterDate').textContent=f.elements.next.value||'—';const b=document.getElementById('extendSubmitButton');b.disabled=!ready;const box=document.getElementById('extendValidationBox');box.className=`admin-grant-check full ${ready?'clear':'warning'}`;box.innerHTML=ready?'<strong>Ready for audited extension</strong><p>Later expiry and unchanged scope confirmed.</p><code>EXTEND_READY</code>':'<strong>Confirmation required</strong><p>New expiry must be later than current expiry; reason and confirmation are required.</p><code>EXTEND_CONFIRMATION_INCOMPLETE</code>';};['next','detail'].forEach(n=>f.elements[n].addEventListener('input',validate));f.elements.confirm.addEventListener('change',validate);validate();
  }
  function confirmExtend(id){return requestLiveAction('confirm-extend',id);}
  function revokeSnapshot(g,l){
    const targetResource=g.scope==='ITEM'?resource(g.target):null;
    const targetLabel=targetResource?.title||g.title||g.target;
    const beforeCount=l?.accessCount??0;
    const afterCount=Math.max(0,beforeCount-1);
    const plan=l?.plan||'UNKNOWN';
    return {
      targetLabel,
      before:`${l?.name||g.learnerId} has an ACTIVE ${g.scope} grant for “${targetLabel}” from ${g.source}. Access count: ${beforeCount}. Commercial plan: ${plan}.`,
      after:`This ${g.scope} grant becomes REVOKED and no longer authorizes “${targetLabel}”. Access count becomes ${afterCount}. Commercial plan remains ${plan}; other grants and historical evidence remain unchanged.`,
      beforeCount,afterCount,plan
    };
  }
  function validateRevokeForm(){
    const f=document.getElementById('adminRevokeForm'),submit=document.getElementById('revokeSubmitButton');if(!f||!submit)return;
    const detail=String(f.elements.detail.value||'').trim(),confirmed=!!f.elements.confirm.checked;
    const ready=detail.length>=12&&confirmed;
    submit.disabled=!ready;submit.setAttribute('aria-disabled',String(!ready));
    const stateBox=document.getElementById('revokeValidationBox');if(stateBox){stateBox.className=`admin-grant-check full ${ready?'clear':'warning'}`;stateBox.innerHTML=ready?'<strong>Ready for audited revoke</strong><p>Reason captured, exact effect confirmed and before/after evidence prepared.</p><code>REVOKE_READY</code>':'<strong>Confirmation required</strong><p>Enter a meaningful reason and confirm the exact before/after effect before revoking.</p><code>REVOKE_CONFIRMATION_INCOMPLETE</code>';}
  }
  function revokeGrant(id){
    const g=data.grants.find(x=>x.id===id);if(!g)return;
    const l=learner(g.learnerId);
    if(g.status!=='Active')return showDialog('Revoke unavailable','The entitlement is already inactive.',`<div class="admin-grant-check blocked"><strong>No mutation applied</strong><p>${esc(g.title)} is already ${esc(g.status)}. A second revoke is blocked.</p><code>REVOKE_IDEMPOTENT_NOOP</code></div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);
    const snap=revokeSnapshot(g,l);
    showDialog('Revoke exact access','Capture the reason, review the exact before/after effect and create auditable evidence before mutation.',`<form id="adminRevokeForm" class="admin-form"><input type="hidden" name="grantId" value="${esc(g.id)}"><div class="admin-identity-summary full"><span class="admin-status active">Active</span><div><strong>${esc(l?.name||g.learnerId)} · ${esc(l?.plan||'Unknown plan')}</strong><small>Grant ${esc(g.id)} · ${esc(g.scope)} · ${esc(g.source)}</small><h3>${esc(snap.targetLabel)}</h3></div></div><label>Reason category<select name="category" required><option value="CONTROLLED_ACCESS_VERIFICATION">Controlled access verification</option><option value="LEARNER_REQUEST">Learner request</option><option value="PAYMENT_REVERSAL">Payment reversal</option><option value="ACCESS_CORRECTION">Access correction</option><option value="POLICY_OR_SECURITY">Policy or security</option></select></label><label>Effective date<input name="effective" value="Immediately after entitlement refresh" readonly></label><label class="full">Detailed revoke reason<textarea name="detail" id="revokeReasonDetail" required minlength="12" placeholder="Explain why this exact entitlement must be revoked."></textarea></label><div class="admin-change-grid full"><section class="admin-change-box before"><span>Before</span><strong>Access active</strong><p>${esc(snap.before)}</p></section><section class="admin-change-box after"><span>After</span><strong>Exact grant revoked</strong><p>${esc(snap.after)}</p></section></div><div class="admin-audit-preview full"><strong>Audit evidence preview</strong><p>Action: REVOKE_${esc(g.scope)} · Target: ${esc(l?.name||g.learnerId)} → ${esc(snap.targetLabel)}</p><code>${esc(g.scope)}_ACCESS_REVOKED_PLAN_UNCHANGED</code></div><label class="admin-confirm-check full"><input type="checkbox" name="confirm" id="revokeConfirm"><span>I confirm the learner, exact grant, access source, before/after effect and unchanged commercial plan shown above.</span></label><div id="revokeValidationBox" class="admin-grant-check full warning" role="status" aria-live="polite"><strong>Confirmation required</strong><p>Enter a meaningful reason and confirm the exact before/after effect before revoking.</p><code>REVOKE_CONFIRMATION_INCOMPLETE</code></div></form>`,`<button class="secondary-button" data-admin-action="close-dialog">Cancel</button><button class="primary-button" id="revokeSubmitButton" data-admin-action="confirm-revoke" data-id="${id}" disabled aria-disabled="true">Create audited revoke</button>`);
    const f=document.getElementById('adminRevokeForm');f.elements.detail.addEventListener('input',validateRevokeForm);f.elements.confirm.addEventListener('change',validateRevokeForm);validateRevokeForm();
  }
  function confirmRevoke(id){return requestLiveAction('confirm-revoke',id);}
  function auditDetail(id){
    const a=data.audit.find(x=>x.id===id);if(!a||!a.evidence)return;
    const e=a.evidence;
    showDialog('Audit evidence','Structured evidence for the selected controlled operation.',`<div class="admin-identity-summary"><span class="admin-status ${statusClass(a.result)}">${esc(a.result)}</span><div><strong>${esc(a.action)} · ${esc(a.target)}</strong><small>${esc(a.time)} · ${esc(a.actor)}</small></div></div><div class="admin-audit-preview"><strong>Reason captured</strong><p>${esc(e.reasonCategory||'—')} — ${esc(e.reasonDetail||'—')}</p><code>${esc(a.reason)}</code></div><div class="admin-change-grid"><section class="admin-change-box before"><span>Before snapshot</span><p>${esc(e.before||'—')}</p></section><section class="admin-change-box after"><span>After snapshot</span><p>${esc(e.after||'—')}</p></section></div><div class="admin-preview-box"><strong>Identity and scope</strong><p>Grant: ${esc(e.grantId||'—')} · Scope: ${esc(e.scope||'—')} · Source: ${esc(e.source||'—')}<br>Commercial plan: ${esc(e.commercialPlanBefore||'—')} → ${esc(e.commercialPlanAfter||'—')}</p></div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);
  }
  function scenarioDialog(){return liveSourceStatusDialog();}
  function runScenario(){return liveSourceStatusDialog();}
  function resourceDetail(id){const r=resource(id);if(!r)return;showDialog(r.title,'Canonical Resource Graph record',`<div class="admin-access-card"><span class="admin-status ${statusClass(r.status)}">${esc(r.status)}</span><h3>${esc(r.type)} · ${esc(r.subject)}</h3><p>Resource ID: ${esc(r.id)}<br>Access mapping: ${esc(r.access)}<br>Delivery: ${esc(r.delivery)}<br>Updated: ${esc(r.updated)}</p><div class="admin-preview-box"><strong>Student opening path</strong><p>Home / Search / My Access / Subject → central authorization → canonical resource or shared locked guidance.</p></div></div>`,`<button class="secondary-button" data-admin-action="preview-student">Preview Student</button><button class="primary-button" data-admin-action="close-dialog">Close</button>`);}
  function genericDialog(title,copy){showDialog(title,'Controlled platform guidance',`<div class="admin-preview-box"><strong>Safety boundary</strong><p>${copy}</p></div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);}
  function liveSourceStatusDialog(){
    const expected=['users','students','learnerProfiles','studentAccess','contentItems','payments','mentorProfiles','mentorAssignments','mentorStudentLinks','accessAuditLogs','accessActionLogs','experienceEvents','accessInvites','accessProducts'];
    const rows=expected.map(key=>{const stateValue=realAdminSourceStatus[key]||((realAdminDataLoading&&!realAdminDataActive)?'loading':'not reported');const count=Number(realAdminSourceCounts[key]||0);const error=realAdminSourceErrors[key];const cls=stateValue==='ready'?'active':stateValue==='error'?'expired':stateValue==='empty'?'draft':'pending';return `<div class="admin-list-row"><span class="admin-list-icon">${stateValue==='ready'?'✓':stateValue==='empty'?'0':stateValue==='error'?'!':'↻'}</span><div class="admin-list-main"><strong>${esc(key)}</strong><small>${error?esc(error):stateValue==='empty'?'Connected · no records':`Connected · ${count} record${count===1?'':'s'}`}</small></div><span class="admin-status ${cls}">${esc(stateValue)}</span></div>`;}).join('');
    const missing=liveArray(window.__aspirenestRealAdminData?.missingRelationshipLearners).length;
    showDialog('Live Admin source status','Exact read/write health across the complete V8 Admin workspace.',`<div class="admin-list">${rows}</div><div class="admin-preview-box"><strong>Canonical mentor relationship</strong><p>Default mentor: ${esc(liveDefaultMentor?.name||'Dr. Varsha Maru')} · Learners awaiting persisted sync: ${missing}. The Admin runtime performs an idempotent real relationship sync when authorized.</p></div><div class="admin-preview-box"><strong>Controlled write boundary</strong><p>Admin actions use authenticated Firebase services, exact UID ownership and audit records. Empty sources stay empty; fake records are never substituted.</p></div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);
  }
  const LIVE_WRITE_ACTIONS=new Set(['submit-resource','confirm-publish','submit-grant','confirm-extend','confirm-revoke','confirm-payment','confirm-provision','submit-learner','submit-mentor','submit-claim','run-migration-dry','run-bulk-preview']);
  function formDataObject(formId){
    const form=document.getElementById(formId);if(!form||!form.reportValidity())return null;
    const payload={};new FormData(form).forEach((value,key)=>{payload[key]=value;});
    form.querySelectorAll('input[type="checkbox"]').forEach(input=>{payload[input.name]=input.checked;});
    return payload;
  }
  function livePayload(action,id){
    let payload=null;
    if(action==='submit-resource')payload=formDataObject('adminCreateResourceForm');
    if(action==='confirm-publish'){payload=formDataObject('adminPublishForm');if(payload){payload.id=id;payload.reason=payload.detail;}}
    if(action==='submit-grant'){const decision=validateGrantForm();if(!decision||decision.blocked)return null;payload=formDataObject('adminGrantForm');if(payload)payload.learnerId=payload.learner;}
    if(action==='confirm-extend'){payload=formDataObject('adminExtendForm');if(payload){payload.id=id;payload.reason=payload.detail;}}
    if(action==='confirm-revoke'){payload=formDataObject('adminRevokeForm');if(payload){payload.id=id;payload.reason=payload.detail;}}
    if(action==='confirm-payment'){payload=formDataObject('adminPaymentVerifyForm');if(payload)payload.id=id;}
    if(action==='confirm-provision'){payload=formDataObject('adminPaymentProvisionForm');if(payload)payload.id=id;}
    if(action==='submit-learner')payload=formDataObject('addLearnerForm');
    if(action==='submit-mentor')payload=formDataObject('addMentorForm');
    if(action==='submit-claim')payload=formDataObject('newClaimForm');
    if(action==='run-migration-dry'){payload=formDataObject('migrationForm');if(payload){payload.reason=payload.detail;payload.summary=`${payload.source} → ${payload.target}`;}}
    if(action==='run-bulk-preview'){payload=formDataObject('bulkAccessForm');if(payload)payload.summary=`${payload.scope}:${payload.target}`;}
    return payload;
  }
  function requestLiveAction(action,id){
    if(!realAdminDataActive){toast('Live Admin data is not ready yet. Open source status for exact details.','!');return liveSourceStatusDialog();}
    const payload=livePayload(action,id);if(!payload)return;
    pendingLiveRequestId=`g15-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    dialog?.querySelectorAll('button').forEach(button=>{if(button.dataset.adminAction!=='close-dialog')button.disabled=true;});
    window.dispatchEvent(new CustomEvent('aspirenest:admin-live-action',{detail:{action,requestId:pendingLiveRequestId,payload}}));
    toast('Applying verified live Admin operation…','↻');
  }
  window.addEventListener('aspirenest:admin-live-action-result',event=>{
    const detail=event.detail||{};if(detail.requestId&&pendingLiveRequestId&&detail.requestId!==pendingLiveRequestId)return;
    pendingLiveRequestId='';
    if(!detail.ok){dialog?.querySelectorAll('button').forEach(button=>{button.disabled=false;});const body=dialog?.querySelector('.admin-dialog-body');if(body){body.querySelector('[data-live-action-error]')?.remove();body.insertAdjacentHTML('beforeend',`<div class="admin-grant-check blocked full" data-live-action-error><strong>Operation not applied</strong><p>${esc(detail.error||'Live operation failed.')}</p><code>NO_PARTIAL_BROWSER_MUTATION</code></div>`);}toast(detail.error||'Live operation failed.','!');return;}
    const result=detail.result||{};closeDialog();refreshAdminView();
    if(result.inviteLink||result.inviteUrl){const link=result.inviteLink||result.inviteUrl;showDialog('Real onboarding invitation created','Share this secure invitation with the learner.',`<div class="admin-preview-box"><strong>Invitation</strong><p style="word-break:break-all">${esc(link)}</p></div>`,`<button class="primary-button" data-admin-action="close-dialog">Close</button>`);}
    toast(detail.message||'Live Admin operation completed.');
  });


  function closeAdminPopovers(){document.querySelectorAll('.admin-account-menu,.admin-notification-panel,.admin-search-popover').forEach(x=>x.remove());}
  function accountInitials(value){const parts=String(value||'AN').replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i,'').trim().split(/\s+/).filter(Boolean);return (parts.length>1?`${parts[0][0]}${parts[parts.length-1][0]}`:String(value||'AN').slice(0,2)).toUpperCase();}
  function showAccount(){
    closeAdminPopovers();
    const session=window.__aspirenestAuthSession||{};
    const name=esc(session.displayName||session.email||'AspireNest Admin');
    const identity=esc(session.username?`@${session.username}`:(session.email||''));
    const p=document.createElement('div');p.className='admin-account-menu';
    p.innerHTML=`<div class="admin-account-profile"><span class="avatar">${accountInitials(session.displayName||session.email)}</span><div><strong>${name}</strong><small>Administrator${identity?` • ${identity}`:''}</small></div></div><button class="admin-popover-item" data-admin-go="system/settings">⚙ Platform settings</button><button class="admin-popover-item" data-admin-go="system/audit">✓ Audit & safety</button><button class="admin-popover-item" data-role-choice="student">↗ Open Student Drive</button><button class="admin-popover-item" data-aspirenest-signout>↗ Sign out</button>`;
    document.body.appendChild(p);
  }
  function showNotifications(){closeAdminPopovers();const p=document.createElement('div');p.className='admin-notification-panel';const rows=[];data.payments.filter(x=>x.status==='Pending').forEach(x=>rows.push(`<button class="admin-popover-item" data-admin-action="verify-payment" data-id="${x.id}"><strong>${esc(x.learner)} payment pending</strong><small style="display:block;color:var(--muted);margin-top:3px">${esc(x.amount)} · ${esc(x.reference)}</small></button>`));data.payments.filter(x=>x.status==='Verified'&&!x.accessProvisioned).forEach(x=>rows.push(`<button class="admin-popover-item" data-admin-action="provision-payment" data-id="${x.id}"><strong>${esc(x.learner)} access pending</strong><small style="display:block;color:var(--muted);margin-top:3px">Payment verified · provision ${esc(x.plan)}</small></button>`));data.resources.filter(x=>x.status==='Staged').forEach(x=>rows.push(`<button class="admin-popover-item" data-admin-action="publish-resource" data-id="${x.id}"><strong>${esc(x.title)}</strong><small style="display:block;color:var(--muted);margin-top:3px">Staged publishing review</small></button>`));p.innerHTML=`<div class="role-choice-head">Needs attention</div>${rows.join('')||'<div class="admin-popover-item">Nothing urgent</div>'}`;document.body.appendChild(p);}
  function showSearchFilters(){closeAdminPopovers();const p=document.createElement('div');p.className='admin-notification-panel admin-search-popover';p.innerHTML=`<div class="role-choice-head">Admin search shortcuts</div><button class="admin-popover-item" data-admin-go="content/all-content">▤ Search resources</button><button class="admin-popover-item" data-admin-go="people/learners">♙ Search learners</button><button class="admin-popover-item" data-admin-go="access/active-grants">◉ Search grants</button><button class="admin-popover-item" data-admin-go="system/audit">✓ Search audit logs</button>`;document.body.appendChild(p);}

  function handleAdminClick(e){
    const signout=e.target.closest('[data-aspirenest-signout]');if(signout){closeAdminPopovers();window.dispatchEvent(new CustomEvent('aspirenest:signout'));return;}
    const role=e.target.closest('[data-role-choice]');if(role){role.dataset.roleChoice==='admin'?enterAdmin():exitAdmin();return;}
    if(!isAdmin())return;
    const parent=e.target.closest('[data-admin-parent]');if(parent){navigate(parent.dataset.adminParent);return;}
    const context=e.target.closest('[data-admin-context]');if(context){navigate(state.parent,context.dataset.adminContext);return;}
    const go=e.target.closest('[data-admin-go]');if(go){const [p,c]=go.dataset.adminGo.split('/');navigate(p,c);return;}
    const filter=e.target.closest('[data-admin-filter]');if(filter){state.contentFilter=filter.dataset.adminFilter;renderPage();return;}
    const collectionFilter=e.target.closest('[data-admin-collection-filter]');if(collectionFilter){state.collectionFilter=collectionFilter.dataset.adminCollectionFilter;renderPage();return;}
    const view=e.target.closest('[data-admin-view]');if(view){state.view=view.dataset.adminView;els.app.dataset.view=state.view;renderPage();return;}
    const action=e.target.closest('[data-admin-action]');if(action){handleAction(action.dataset.adminAction,action.dataset.id);return;}
    if(!e.target.closest('#roleChoiceMenu')&&!e.target.closest('#roleSwitchButton'))closeRoleMenu();
    if(!e.target.closest('.admin-account-menu,.admin-notification-panel')&&!e.target.closest('#accountButton,#notificationsButton,#searchFiltersButton'))closeAdminPopovers();
  }
  function handleAction(action,id){
    if(LIVE_WRITE_ACTIONS.has(action))return requestLiveAction(action,id);
    if(action==='live-source-status')return liveSourceStatusDialog();
    if(action==='close-dialog')return closeDialog();if(action==='clear-search'){state.query='';els.search.value='';return renderPage();}
    if(action==='create-resource')return createResourceDialog();if(action==='submit-resource')return submitResource();if(action==='publish-resource')return publishResource(id);if(action==='confirm-publish')return confirmPublish(id);if(action==='resource-detail')return resourceDetail(id);
    if(action==='grant-access')return grantDialog();if(action==='submit-grant')return submitGrant();if(action==='grant-detail')return grantDetail(id);if(action==='extend-grant')return extendGrant(id);if(action==='confirm-extend')return confirmExtend(id);if(action==='revoke-grant')return revokeGrant(id);if(action==='confirm-revoke')return confirmRevoke(id);
    if(action==='verify-payment')return verifyPaymentDialog(id);if(action==='confirm-payment')return confirmPayment(id);if(action==='provision-payment')return provisionPaymentDialog(id);if(action==='confirm-provision')return confirmProvision(id);
    if(action==='audit-detail')return auditDetail(id);if(action==='scenario')return scenarioDialog();if(action==='run-scenario')return runScenario();
    if(action==='add-learner')return addLearnerDialog();if(action==='submit-learner')return submitLearner();if(action==='learner-detail')return learnerDetail(id);if(action==='add-mentor')return addMentorDialog();if(action==='submit-mentor')return submitMentor();if(action==='mentor-detail')return mentorDetail(id);
    if(action==='new-claim')return newClaimDialog();if(action==='submit-claim')return submitClaim();if(action==='migration')return migrationDialog();if(action==='run-migration-dry')return runMigrationDry();if(action==='plan-detail')return planDetail(id);
    if(action==='preview-student'){closeDialog();toast('Switching to exact Student Learning Drive');setTimeout(exitAdmin,300);return;}
    if(action==='export-audit'){const blob=new Blob([JSON.stringify(data.audit,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='aspirenest-admin-audit-v8.json';a.click();URL.revokeObjectURL(a.href);toast('Audit evidence exported');return;}
    if(action==='bulk-access')return bulkAccessDialog();if(action==='run-bulk-preview')return runBulkPreview();
  }

  els.roleButton.addEventListener('click',e=>{e.stopPropagation();document.getElementById('roleChoiceMenu')?closeRoleMenu():showRoleMenu();});
  els.quick.addEventListener('click',()=>{if(isAdmin())createResourceDialog();});
  els.brand.addEventListener('click',()=>{if(isAdmin())navigate('home','overview');});
  els.search.addEventListener('input',e=>{if(!isAdmin())return;state.query=e.target.value;renderPage();});
  els.searchFilters.addEventListener('click',()=>{if(isAdmin())showSearchFilters();});
  els.account.addEventListener('click',()=>{if(isAdmin())showAccount();});
  els.notifications.addEventListener('click',()=>{if(isAdmin())showNotifications();});
  els.overlay.addEventListener('click',()=>{if(isAdmin()){closeDialog();closeAdminPopovers();closeRoleMenu();}});
  document.addEventListener('click',handleAdminClick);
  document.addEventListener('change',event=>{const sort=event.target.closest?.('[data-admin-sort]');if(sort&&isAdmin()){state.sort=sort.value;renderPage();}});
  document.addEventListener('keydown',e=>{if(!isAdmin())return;if(e.key==='Escape'){closeDialog();closeAdminPopovers();closeRoleMenu();}if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();els.search.focus();}});
  window.addEventListener('hashchange',()=>{if(!isAdmin())return;const p=location.hash.replace(/^#admin\/?/,'').split('/').filter(Boolean);if(p.length&&adminParents.some(x=>x.id===p[0])){state.parent=p[0];state.context=p[1]||adminContext[p[0]][0][0];state.collectionFilter='all';state.sort='default';renderNav();renderPage();}});

  window.__aspirenestAdminAPI = Object.freeze({
    enterAdmin,
    exitAdmin,
    navigate,
    isAdmin,
    setRealLearners: learners => applyRealLearnerDirectory({ready:true,loading:false,learners}),
    setRealAdminData: nextState => applyRealAdminData({ready:true,loading:false,...nextState}),
  });
  window.dispatchEvent(new CustomEvent('aspirenest:admin-runtime-ready'));
})();

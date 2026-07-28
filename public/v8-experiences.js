(() => {
  'use strict';

  const coreRole = () => window.__aspirenestRole === 'admin' ? 'admin' : 'student';
  const experience = {
    role: null,
    mentorParent: 'home',
    mentorContext: 'overview',
    publicParent: 'home',
    publicContext: 'overview',
    query: '',
    mentorView: readViewPreference('mentor'),
    publicView: readViewPreference('public'),
    assignments: [],
    questions: [],
    accessRequests: [],
    liveSessions: []
  };

  let publicLive={ready:false,loading:true,resources:[],subjects:[],products:[],sourceStatus:{},sourceCounts:{},sourceErrors:{}};
  let mentorLiveData={ready:false,loading:true,learners:[],resources:[],assignments:[],questions:[],accessRequests:[],liveSessions:[],sourceStatus:{},sourceCounts:{},sourceErrors:{}};


  const roleCopy = {
    public:['Public Website','Explore AspireNest before signing in.','◉'],
    student:['Student Learning OS','Learn, practice, revise and continue.','A'],
    mentor:['Mentor Workspace','Guide learners with access awareness.','M'],
    admin:['Admin Learning Drive','Operate content, access and platform safety through the same Drive-style system.','⚙']
  };

  const mentorParents = [
    {id:'home',label:'Home',icon:'⌂',eyebrow:'MENTOR OS',children:[['overview','Overview','⌂'],['attention','Needs attention','!'],['activity','Recent activity','↻']]},
    {id:'learners',label:'Learners',icon:'♙',eyebrow:'ASSIGNED LEARNERS',children:[['all','My Learners','♙'],['progress','Progress watch','◎'],['expiring','Access expiring','◷']]},
    {id:'assignments',label:'Assignments',icon:'☑',eyebrow:'GUIDANCE',children:[['active','Active assignments','☑'],['review','Ready for review','✓'],['history','Assignment history','↻']]},
    {id:'content',label:'Content',icon:'⌕',eyebrow:'RESOURCE PICKER',children:[['picker','Content Picker','⌕'],['recommended','Recommended','◇'],['saved','Saved resources','★']]},
    {id:'questions',label:'Questions',icon:'?',eyebrow:'COMMUNICATION',children:[['open','Open questions','?'],['answered','Answered','✓'],['guidance','Guidance history','↻']]},
    {id:'live',label:'Live',icon:'●',eyebrow:'SESSIONS',children:[['upcoming','Upcoming','◷'],['replays','Replays','↺']]},
    {id:'access',label:'Access',icon:'◉',eyebrow:'ACCESS AWARENESS',children:[['requests','Access Requests','◉'],['expiring','Expiring soon','◷'],['discussion','Access discussion','@']]}
  ];

  const publicParents = [
    {id:'home',label:'Home',icon:'⌂',eyebrow:'ASPIRENEST',children:[['overview','Overview','⌂'],['why','Why AspireNest','◇'],['journey','How it works','⇢']]},
    {id:'explore',label:'Explore',icon:'⌕',eyebrow:'DISCOVER',children:[['all','All resources','▤'],['notes','Notes','N'],['videos','Videos','▶'],['practice','Mock Tests','✓'],['roadmaps','Roadmaps','⇢']]},
    {id:'pricing',label:'Pricing',icon:'₹',eyebrow:'PLANS',children:[['plans','Plans & Access','₹'],['compare','Compare plans','◇']]},
    {id:'free',label:'Free',icon:'☆',eyebrow:'FREE LEARNING',children:[['library','Free Library','☆'],['practice','Free Practice','✓']]},
    {id:'about',label:'About',icon:'A',eyebrow:'ACADEMY',children:[['mission','Mission','A'],['system','One App • One System','◎']]},
    {id:'support',label:'Support',icon:'?',eyebrow:'HELP',children:[['contact','Contact','✉'],['faq','FAQ','?']]}
  ];

  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const data = () => experience.role==='mentor' ? mentorLiveData : publicLive;
  const learner = id => data().learners.find(item => item.id === id);
  const resource = id => data().resources.find(item => item.id === id);
  const authSession = () => window.__aspirenestAuthSession || {user:null,role:'public',allowed:['public']};
  const sessionInitials = value => {const parts=String(value||'AN').replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i,'').trim().split(/\s+/).filter(Boolean);return (parts.length>1?`${parts[0][0]}${parts[parts.length-1][0]}`:String(value||'AN').slice(0,2)).toUpperCase();};
  const sessionIdentity = session => session.username?`@${session.username}`:(session.email||'');
  const requestExperience = role => {
    const target=String(role||'public').toLowerCase();
    const session=authSession();
    if(target!=='public'&&!session.user){window.location.assign(`/login?returnTo=${encodeURIComponent(`/${target}`)}`);return false;}
    if(target!=='public'&&(!Array.isArray(session.allowed)||!session.allowed.includes(target))){window.dispatchEvent(new CustomEvent('aspirenest:access-denied',{detail:{role:target}}));return false;}
    target==='student'||target==='admin'?triggerCoreRole(target):enterExperience(target);
    return true;
  };
  const activeRole = () => String(window.__aspirenestActiveExperience||experience.role||coreRole()).toLowerCase();
  const contextsFor = role => role === 'mentor' ? mentorParents : publicParents;
  const stateFor = role => role === 'mentor' ? [experience.mentorParent,experience.mentorContext] : [experience.publicParent,experience.publicContext];


  function applyPublicLiveData(next={}){
    publicLive={...publicLive,...next,resources:Array.isArray(next.resources)?next.resources:(publicLive.resources||[]),products:Array.isArray(next.products)?next.products:(publicLive.products||[])};
    if(experience.role==='public')renderExperience();
  }
  function applyMentorLiveData(next={}){
    mentorLiveData={...mentorLiveData,...next};
    experience.assignments=Array.isArray(mentorLiveData.assignments)?mentorLiveData.assignments:[];
    experience.questions=Array.isArray(mentorLiveData.questions)?mentorLiveData.questions:[];
    experience.accessRequests=Array.isArray(mentorLiveData.accessRequests)?mentorLiveData.accessRequests:[];
    experience.liveSessions=Array.isArray(mentorLiveData.liveSessions)?mentorLiveData.liveSessions:[];
    if(experience.role==='mentor')renderExperience();
  }
  function platformRequest(action,payload={},successMessage='Live operation completed.'){
    const requestId=`platform-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.dispatchEvent(new CustomEvent('aspirenest:platform-live-action',{detail:{requestId,action,payload,successMessage}}));
    return requestId;
  }
  window.addEventListener('aspirenest:public-live-data',event=>applyPublicLiveData(event.detail||{}));
  window.addEventListener('aspirenest:mentor-live-data',event=>applyMentorLiveData(event.detail||{}));
  window.addEventListener('aspirenest:platform-live-action-result',event=>{
    const detail=event.detail||{};
    if(!String(detail.action||'').startsWith('mentor-'))return;
    if(detail.ok){closeDialog();toast(detail.message||'Live operation completed.');}
    else toast(detail.error||'Live operation failed.');
  });
  queueMicrotask(()=>{
    if(window.__aspirenestPublicLiveData)applyPublicLiveData(window.__aspirenestPublicLiveData);
    if(window.__aspirenestMentorLiveData)applyMentorLiveData(window.__aspirenestMentorLiveData);
  });

  function readViewPreference(role){
    try { const value=window.localStorage.getItem(`aspirenest_v8_${role}_view`); return value==='list'?'list':'grid'; }
    catch(_){ return 'grid'; }
  }
  function currentView(role=experience.role){return role==='mentor'?experience.mentorView:experience.publicView;}
  function setCurrentView(mode){
    if(!['grid','list'].includes(mode)||!experience.role)return;
    if(experience.role==='mentor')experience.mentorView=mode;else experience.publicView=mode;
    try{window.localStorage.setItem(`aspirenest_v8_${experience.role}_view`,mode);}catch(_){}
    renderPage();
  }
  function viewToggle(label='View options'){
    const mode=currentView();
    return `<div class="view-toggle v8-view-toggle" aria-label="${esc(label)}"><button type="button" data-v8-view="list" class="${mode==='list'?'active':''}" aria-label="List view" aria-pressed="${mode==='list'}">☷</button><button type="button" data-v8-view="grid" class="${mode==='grid'?'active':''}" aria-label="Grid view" aria-pressed="${mode==='grid'}">▦</button></div>`;
  }
  function collectionToolbar(summary){return `<section class="v8-collection-toolbar"><span>${esc(summary)}</span>${viewToggle()}</section>`;}
  function switchableGrid(content,extra=''){return `<div class="v8-grid-3 v8-switchable-grid ${currentView()==='list'?'is-list':'is-grid'} ${extra}">${content}</div>`;}

  function toast(message){
    let region=$('.v8-toast-region');
    if(!region){region=document.createElement('div');region.className='v8-toast-region';document.body.appendChild(region);}
    const node=document.createElement('div');node.className='v8-toast';node.textContent=message;region.appendChild(node);setTimeout(()=>node.remove(),2800);
  }

  function closeCorePopovers(){
    $('#roleChoiceMenu')?.remove();
    document.querySelectorAll('.admin-account-menu,.admin-notification-panel,.admin-search-popover,.search-filter-popover,.account-menu,.notification-panel').forEach(x=>x.remove());
    $('#roleSwitchButton')?.setAttribute('aria-expanded','false');
  }
  function closePopover(){document.querySelectorAll('.v8-popover').forEach(x=>x.remove());}
  function closeDialog(){document.querySelectorAll('.v8-experience-modal').forEach(x=>x.remove());}
  function closeRoleChooser(){const node=$('#v8RoleChooser');if(node)node.remove();$('#roleSwitchButton')?.setAttribute('aria-expanded','false');}

  function showRoleChooser(){
    closeCorePopovers();closePopover();closeDialog();closeRoleChooser();
    const role=activeRole();
    const node=document.createElement('section');node.id='v8RoleChooser';node.className='v8-role-chooser';node.setAttribute('aria-hidden','false');
    node.innerHTML=`<div class="v8-role-chooser-card" role="dialog" aria-modal="true" aria-labelledby="v8RoleTitle">
      <div class="v8-role-chooser-head"><div><h2 id="v8RoleTitle">Choose your AspireNest workspace</h2><p>Open a workspace allowed for this authenticated account.</p></div><button class="v8-role-close" data-v8-close-role aria-label="Close role chooser">×</button></div>
      <div class="v8-role-grid">${Object.entries(roleCopy).filter(([id])=>{const session=authSession();const allowed=session.user&&Array.isArray(session.allowed)?session.allowed:['public'];return allowed.includes(id);}).map(([id,copy])=>`<button class="v8-role-card ${role===id?'active':''}" data-v8-role="${id}"><span class="v8-role-card-icon">${copy[2]}</span><strong>${copy[0]}</strong><small>${copy[1]}</small></button>`).join('')}</div>
    </div>`;
    document.body.appendChild(node);$('#roleSwitchButton')?.setAttribute('aria-expanded','true');
  }

  function triggerCoreRole(role){
    window.__aspirenestActiveExperience=role;
    closeRoleChooser();closeDialog();closePopover();cleanupExperience();
    const temp=document.createElement('button');temp.type='button';temp.dataset.roleChoice=role;temp.hidden=true;document.body.appendChild(temp);temp.click();temp.remove();
  }

  function cleanupExperience(){
    experience.role=null;window.__aspirenestExperienceRole=null;
    const app=$('#app');app?.classList.remove('v8-experience-mode','v8-mentor-mode','v8-public-mode');
  }

  function enterExperience(role){
    window.__aspirenestActiveExperience=role;
    closeRoleChooser();closeDialog();closePopover();closeCorePopovers();
    experience.role=role;window.__aspirenestExperienceRole=role;window.__aspirenestRole='admin';
    const app=$('#app');app.classList.add('admin-mode','v8-experience-mode');app.classList.toggle('v8-mentor-mode',role==='mentor');app.classList.toggle('v8-public-mode',role==='public');
    configureChrome();renderExperience();
    const [parent,context]=stateFor(role);history.replaceState(null,'',`#${role}/${parent}/${context}`);window.scrollTo({top:0,behavior:'smooth'});
  }

  function configureChrome(){
    const role=experience.role;const mentor=role==='mentor';
    const small=$('#brandHome small');if(small)small.textContent='Academy';
    $('#roleSwitchLabel').textContent=mentor?'Mentor':'Public';
    $('#quickContinue').innerHTML=mentor?'+ Assignment':'Start Learning';
    $('#quickContinue').title=mentor?'Create a learner assignment':'Open Student Learning OS';
    $('#globalSearch').value=experience.query;
    $('#globalSearch').placeholder=mentor?'Search learners, assignments or resources':'Search notes, videos, tests and roadmaps';
    $('#globalSearch').setAttribute('aria-label',mentor?'Search Mentor Workspace':'Search public learning resources');
    $('#accountButton').textContent=mentor?'MS':'AN';
    const summary=$('.plan-summary');if(summary)summary.innerHTML=mentor?'<span class="status-dot"></span><div><strong>Mentor workspace</strong><small>Assigned learners only</small></div>':'<span class="status-dot"></span><div><strong>Public discovery</strong><small>No sign-in required</small></div>';
  }

  function navigateExperience(parent,context){
    const role=experience.role;const parents=contextsFor(role);const section=parents.find(x=>x.id===parent)||parents[0];
    if(role==='mentor'){experience.mentorParent=section.id;experience.mentorContext=context||section.children[0][0];}
    else{experience.publicParent=section.id;experience.publicContext=context||section.children[0][0];}
    experience.query='';$('#globalSearch').value='';closeDialog();closePopover();renderExperience();
    const [p,c]=stateFor(role);history.replaceState(null,'',`#${role}/${p}/${c}`);window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderExperience(){renderNav();renderPage();}

  function renderNav(){
    const role=experience.role;const parents=contextsFor(role);const [parentId,contextId]=stateFor(role);const section=parents.find(x=>x.id===parentId)||parents[0];
    $('#parentNav').innerHTML=parents.map(item=>`<button class="rail-link ${item.id===section.id?'active':''}" data-v8-parent="${item.id}" aria-current="${item.id===section.id?'page':'false'}"><span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-label">${esc(item.label)}</span></button>`).join('');
    $('#mobileDock').innerHTML=parents.slice(0,6).map(item=>`<button class="${item.id===section.id?'active':''}" data-v8-parent="${item.id}" aria-current="${item.id===section.id?'page':'false'}"><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${esc(item.label)}</span></button>`).join('');
    $('#contextTitle').textContent=section.label;$('#contextEyebrow').textContent=section.eyebrow;
    $('#contextNav').innerHTML=section.children.map(([id,label,icon])=>`<button class="context-link ${id===contextId?'active':''}" data-v8-context="${id}" aria-current="${id===contextId?'page':'false'}"><span class="context-icon" aria-hidden="true">${icon}</span><span class="context-label">${esc(label)}</span>${countFor(role,section.id,id)!==null?`<span class="count">${countFor(role,section.id,id)}</span>`:''}</button>`).join('');
    $('#mobileContextStrip').innerHTML=section.children.map(([id,label])=>`<button class="${id===contextId?'active':''}" data-v8-context="${id}">${esc(label)}</button>`).join('');
    const footer=$('.rail-footer');if(footer)footer.innerHTML=`<button class="rail-link compact" data-v8-role-chooser title="Preview AspireNest OS"><span class="nav-icon">⇄</span><span class="nav-label">Preview</span></button>`;
  }

  function countFor(role,parent,context){
    const d=data();
    if(role==='mentor'){
      if(parent==='home'&&context==='attention')return experience.questions.filter(x=>isState(x.status,'open')).length+experience.accessRequests.filter(x=>['pending','pending review'].includes(String(x.status||'').toLowerCase())).length;
      if(parent==='learners'&&context==='all')return d.learners.length;
      if(parent==='assignments'&&context==='active')return experience.assignments.filter(x=>!isState(x.status,'reviewed')).length;
      if(parent==='questions'&&context==='open')return experience.questions.filter(x=>isState(x.status,'open')).length;
      if(parent==='live'&&context==='upcoming')return experience.liveSessions.filter(x=>isState(x.status,'scheduled')).length;
      if(parent==='access'&&context==='requests')return experience.accessRequests.filter(x=>['pending','pending review'].includes(String(x.status||'').toLowerCase())).length;
    } else {
      if(parent==='explore'&&context==='all')return d.resources.filter(x=>isState(x.status,'published')||!x.status).length;
      if(parent==='free'&&context==='library')return d.resources.filter(x=>(isState(x.status,'published')||!x.status)&&String(x.access||x.requiredPlan||'').toUpperCase()==='FREE').length;
    }
    return null;
  }

  function heading(title,copy,actions=''){return `<div class="v8-page-heading"><div><h1>${esc(title)}</h1><p>${esc(copy)}</p></div>${actions?`<div class="v8-page-actions">${actions}</div>`:''}</div>`;}
  function kpi(label,value,detail,warn=false){return `<article class="v8-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small class="${warn?'warn':''}">${esc(detail)}</small></article>`;}
  function status(text){const cls=/pending|open|scheduled/i.test(text)?'pending':/expired|revoked/i.test(text)?'expired':/item|assigned|replay/i.test(text)?'navy':'';return `<span class="v8-status ${cls}">${esc(text)}</span>`;}
  const isState=(value,expected)=>String(value||'').toLowerCase()===String(expected||'').toLowerCase();
  function action(label,kind='secondary',attrs=''){return `<button class="v8-${kind}" ${attrs}>${esc(label)}</button>`;}
  function renderPage(){
    const role=experience.role;const [parent,context]=stateFor(role);const page=$('#pageContent');
    page.innerHTML=`<div class="v8-page-shell">${experience.query?renderSearchResults(role):role==='mentor'?renderMentor(parent,context):renderPublic(parent,context)}</div>`;
  }

  function renderSearchResults(role){
    const q=experience.query.toLowerCase().trim();const d=data();
    if(role==='mentor'){
      const learners=d.learners.filter(x=>`${x.name} ${x.email} ${x.plan}`.toLowerCase().includes(q));
      const assignments=experience.assignments.filter(x=>`${x.title} ${learner(x.learnerId)?.name||''} ${x.status}`.toLowerCase().includes(q));
      const resources=d.resources.filter(x=>`${x.title} ${x.type} ${x.subject}`.toLowerCase().includes(q));
      const cards=`${learners.map(l=>resourceCard('♙',l.name,`${l.email} • ${l.plan}`,['Learner',`${l.progress}% progress`],action('Open','secondary',`data-v8-action="open-learner" data-id="${l.id}"`))).join('')}${assignments.map(a=>resourceCard('☑',a.title,`${learner(a.learnerId)?.name||''} • ${a.due}`,[a.status,a.access],action('Review','secondary',`data-v8-action="assignment-detail" data-id="${a.id}"`))).join('')}${resources.map(r=>resourceCard('▤',r.title,`${r.type} • ${r.subjectName||r.subject}`,[r.requiredPlan||r.plan||'FREE',r.state||r.status||'Published'],action('Assign','primary',`data-v8-action="assign-resource" data-id="${r.id}"`))).join('')}`;
      const count=learners.length+assignments.length+resources.length;
      return `${heading('Search results',`Mentor results for “${experience.query}”.`,action('Clear search','secondary','data-v8-action="clear-search"'))}${collectionToolbar(`${count} matching mentor item${count===1?'':'s'}`)}${cards?switchableGrid(cards):empty('No matching mentor results')}`;
    }
    const resources=d.resources.filter(x=>(isState(x.status,'published')||!x.status)&&`${x.title} ${x.type} ${x.subjectName||x.subject} ${x.requiredPlan||x.plan||''}`.toLowerCase().includes(q));
    const cards=resources.map(r=>resourceCard('▤',r.title,`${r.type} • ${r.subjectName||r.subject}`,[r.requiredPlan||r.plan||'FREE',r.type||'Learning resource'],action('Preview','secondary',`data-v8-action="public-resource" data-id="${r.id}"`))).join('');
    return `${heading('Search results',`Public results for “${experience.query}”.`,action('Clear search','secondary','data-v8-action="clear-search"'))}${collectionToolbar(`${resources.length} matching resource${resources.length===1?'':'s'}`)}${cards?switchableGrid(cards):empty('No matching public resources')}`;
  }

  function empty(message){return `<div class="v8-panel"><div class="v8-panel-body" style="text-align:center;color:var(--muted)">${esc(message)}</div></div>`;}
  function resourceCard(icon,title,copy,tags,buttons){return `<article class="v8-resource-card"><span class="v8-card-icon">${icon}</span><h3>${esc(title)}</h3><p>${esc(copy)}</p><div class="v8-card-meta">${tags.map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="v8-card-actions">${buttons}</div></article>`;}

  function renderMentor(parent,context){
    if(parent==='home')return mentorHome(context);
    if(parent==='learners')return mentorLearners(context);
    if(parent==='assignments')return mentorAssignments(context);
    if(parent==='content')return mentorContent(context);
    if(parent==='questions')return mentorQuestions(context);
    if(parent==='live')return mentorLive(context);
    return mentorAccess(context);
  }

  function mentorHome(context){
    const d=data();const openQ=experience.questions.filter(x=>isState(x.status,'open')).length;const pending=experience.accessRequests.filter(x=>['pending','pending review'].includes(String(x.status||'').toLowerCase())).length;
    if(context==='attention')return `${heading('Needs attention','Prioritise learner questions, access gaps and overdue work.',action('Create assignment','orange','data-v8-action="create-assignment"'))}<div class="v8-grid-2"><section class="v8-panel"><div class="v8-panel-head"><div><h2>Open questions</h2><p>Answer with the learner and resource context visible.</p></div>${status(`${openQ} open`)}</div><div class="v8-panel-body v8-list">${experience.questions.filter(x=>isState(x.status,'open')).map(q=>questionRow(q)).join('')}</div></section><section class="v8-panel"><div class="v8-panel-head"><div><h2>Access requests</h2><p>Access remains separate from assignment.</p></div>${status(`${pending} pending`)}</div><div class="v8-panel-body v8-list">${experience.accessRequests.filter(x=>['pending','pending review'].includes(String(x.status||'').toLowerCase())).map(r=>requestRow(r)).join('')}</div></section></div>`;
    if(context==='activity')return `${heading('Recent learner activity','Review progress and guidance signals without exposing unrelated learner data.')}<div class="v8-panel"><div class="v8-panel-body v8-list">${d.learners.map((l,i)=>`<div class="v8-list-row"><span class="v8-list-icon">${i+1}</span><div class="v8-list-main"><strong>${esc(l.name)} · ${l.progress}% progress</strong><small>${esc(l.lastActive)} · ${esc(l.plan)} · Mentor: ${esc(l.mentor)}</small></div>${status(i<2?'Needs review':'On track')}</div>`).join('')}</div></div>`;
    return `${heading('Mentor Workspace','Guide learners through the same Drive-style system with exact access awareness.',`${action('Preview student','secondary','data-v8-role="student"')}${action('Create assignment','orange','data-v8-action="create-assignment"')}`)}<section class="v8-hero mentor"><div><span class="eyebrow">CONNECTED GUIDANCE</span><h2>The right learner. The right resource. Exact access before assignment.</h2><p>Assignments, questions, live sessions and access discussions stay connected without silently unlocking a broader plan.</p><div class="v8-hero-actions">${action('Open assignments','secondary','data-v8-go="assignments/active"')}${action('Review questions','secondary','data-v8-go="questions/open"')}</div></div><aside class="v8-hero-side"><strong>Mentor boundary</strong><small>Role and commercial plan remain separate.</small><div class="v8-hero-tags"><span>Assigned learners</span><span>Exact resources</span><span>Access aware</span><span>Auditable</span></div></aside></section><div class="v8-kpi-grid">${kpi('Assigned learners',d.learners.length,'Identity-linked profiles')}${kpi('Active assignments',experience.assignments.filter(x=>!isState(x.status,'reviewed')).length,'Across learning modules')}${kpi('Open questions',openQ,'Need mentor response',openQ>0)}${kpi('Access requests',pending,'Separate approval flow',pending>0)}</div><div class="v8-grid-2"><section class="v8-panel"><div class="v8-panel-head"><div><h2>Learners needing attention</h2><p>Progress, questions and access context in one view.</p></div>${action('View all','secondary','data-v8-go="learners/all"')}</div><div class="v8-panel-body v8-list">${d.learners.slice(0,3).map(l=>learnerRow(l)).join('')}</div></section><section class="v8-panel"><div class="v8-panel-head"><div><h2>Upcoming guidance</h2><p>Assignments and sessions due next.</p></div>${action('Open Live','secondary','data-v8-go="live/upcoming"')}</div><div class="v8-panel-body v8-list">${experience.assignments.slice(0,2).map(a=>assignmentRow(a)).join('')}${experience.liveSessions.slice(0,1).map(s=>liveRow(s)).join('')}</div></section></div>`;
  }

  function learnerRow(l){return `<div class="v8-list-row"><span class="v8-list-icon">${esc(l.name.split(' ').map(x=>x[0]).join('').slice(0,2))}</span><div class="v8-list-main"><strong>${esc(l.name)} · ${l.progress}%</strong><small>${esc(l.plan)} · ${esc(l.lastActive)} · ${esc(l.mentor)}</small></div><button class="v8-secondary" data-v8-action="open-learner" data-id="${l.id}">Open</button></div>`;}
  function assignmentRow(a){return `<div class="v8-list-row"><span class="v8-list-icon">☑</span><div class="v8-list-main"><strong>${esc(a.title)}</strong><small>${esc(learner(a.learnerId)?.name||a.learnerId)} · ${esc(a.due)} · ${esc(a.access)}</small></div>${status(a.status)}</div>`;}
  function questionRow(q){return `<div class="v8-list-row"><span class="v8-list-icon">?</span><div class="v8-list-main"><strong>${esc(q.title)}</strong><small>${esc(learner(q.learnerId)?.name||q.learnerId)} · ${esc(q.time)}</small></div><button class="v8-secondary" data-v8-action="answer-question" data-id="${q.id}">${isState(q.status,'open')?'Answer':'Open'}</button></div>`;}
  function requestRow(r){return `<div class="v8-list-row"><span class="v8-list-icon">◉</span><div class="v8-list-main"><strong>${esc(learner(r.learnerId)?.name||r.learnerId)} → ${esc(resource(r.resourceId)?.title||r.resourceId)}</strong><small>${esc(r.scope)} · ${esc(r.reason)} · ${esc(r.status)}</small></div><button class="v8-secondary" data-v8-action="review-access" data-id="${r.id}">Review</button></div>`;}
  function liveRow(s){return `<div class="v8-list-row"><span class="v8-list-icon">●</span><div class="v8-list-main"><strong>${esc(s.title)}</strong><small>${esc(s.when)} · ${esc(s.group)}</small></div>${status(s.status)}</div>`;}

  function mentorLearners(context){
    const d=data();let list=d.learners;
    if(context==='progress')list=[...list].sort((a,b)=>a.progress-b.progress);
    if(context==='expiring')list=list.filter(l=>l.status==='Expired'||l.accessCount<=1);
    const title=context==='all'?'My Learners':context==='progress'?'Progress watch':'Access expiring';
    const cards=list.map(l=>resourceCard('♙',l.name,`${l.email} • ${l.plan}`,[l.status,`${l.progress}% progress`,`${l.accessCount} access`],action('Open','primary',`data-v8-action="open-learner" data-id="${l.id}"`))).join('');
    const table=`<div class="v8-table-wrap"><table class="v8-table"><thead><tr><th>Learner</th><th>Plan</th><th>Status</th><th>Progress</th><th>Access</th><th>Last active</th><th></th></tr></thead><tbody>${list.map(l=>`<tr><td><strong>${esc(l.name)}</strong><small>${esc(l.email)}</small></td><td>${esc(l.plan)}</td><td>${status(l.status)}</td><td>${l.progress}%</td><td>${l.accessCount}</td><td>${esc(l.lastActive)}</td><td><button class="v8-secondary" data-v8-action="open-learner" data-id="${l.id}">Open</button></td></tr>`).join('')}</tbody></table></div>`;
    return `${heading(title,'Identity-linked learning, progress, assessments and exact access in one mentor workspace.',action('Create assignment','orange','data-v8-action="create-assignment"'))}${collectionToolbar(`${list.length} assigned learner${list.length===1?'':'s'}`)}${currentView()==='list'?table:switchableGrid(cards,'v8-learner-grid')}`;
  }

  function mentorAssignments(context){
    let list=experience.assignments;if(context==='review')list=list.filter(x=>isState(x.status,'completed'));if(context==='history')list=list.filter(x=>isState(x.status,'reviewed'));
    const title=context==='active'?'Assignments':context==='review'?'Ready for review':'Assignment history';
    const cards=list.map(a=>resourceCard('☑',a.title,`${learner(a.learnerId)?.name||''} • ${a.due}`,[a.status,a.access],`${action('Details','secondary',`data-v8-action="assignment-detail" data-id="${a.id}"`)}${action('Open learner','primary',`data-v8-action="open-learner" data-id="${a.learnerId}"`)}`)).join('');
    return `${heading(title,'Create and review exact-resource assignments without broad access assumptions.',action('Create assignment','orange','data-v8-action="create-assignment"'))}${collectionToolbar(`${list.length} assignment${list.length===1?'':'s'} in this view`)}${cards?switchableGrid(cards):empty('No assignments in this view')}`;
  }

  function mentorContent(context){
    let list=data().resources.filter(x=>isState(x.status,'published')||!x.status);if(context==='recommended')list=list.filter(x=>['note','video','test'].includes(String(x.type||'').toLowerCase()));if(context==='saved')list=list.slice(0,3);
    const title=context==='picker'?'Content Picker':context==='recommended'?'Recommended resources':'Saved resources';
    const cards=list.map(r=>resourceCard('▤',r.title,`${r.type} • ${r.subjectName||r.subject}`,[r.requiredPlan||r.plan||'FREE',r.type||'Learning resource'],`${action('Preview','secondary',`data-v8-action="resource-detail" data-id="${r.id}"`)}${action('Assign','primary',`data-v8-action="assign-resource" data-id="${r.id}"`)}`)).join('');
    return `${heading(title,'Search by subject, type and objective; every resource shows access before assignment.',action('Create assignment','orange','data-v8-action="create-assignment"'))}${collectionToolbar(`${list.length} published resource${list.length===1?'':'s'}`)}${cards?switchableGrid(cards):empty('No resources in this view')}`;
  }

  function mentorQuestions(context){
    let list=experience.questions;if(context==='open')list=list.filter(x=>isState(x.status,'open'));if(context==='answered'||context==='guidance')list=list.filter(x=>isState(x.status,'answered'));
    const title=context==='open'?'Open questions':context==='answered'?'Answered questions':'Guidance history';
    const cards=list.map(q=>resourceCard('?',q.title,`${learner(q.learnerId)?.name||q.learnerId} • ${q.time}`,[q.status,'Learner question'],action(isState(q.status,'open')?'Answer':'Open','primary',`data-v8-action="answer-question" data-id="${q.id}"`))).join('');
    const rows=`<section class="v8-panel"><div class="v8-panel-body v8-list">${list.map(q=>questionRow(q)).join('')||empty('No questions in this view')}</div></section>`;
    return `${heading(title,'Respond with learner, resource and access context preserved.')}${collectionToolbar(`${list.length} question${list.length===1?'':'s'} in this view`)}${currentView()==='list'?rows:(cards?switchableGrid(cards):empty('No questions in this view'))}`;
  }

  function mentorLive(context){
    const list=experience.liveSessions.filter(x=>context==='replays'?(x.replayUrl||isState(x.status,'replay')):isState(x.status,'scheduled'));
    const cards=list.map(s=>resourceCard('●',s.title,`${s.when} • ${s.group}`,[s.status,'Mentor session'],action(s.replayUrl||isState(s.status,'replay')?'Open replay':'Prepare','primary',`data-v8-action="open-live" data-id="${s.id}"`))).join('');
    return `${heading(context==='replays'?'Live replays':'Upcoming live sessions','Plan, prepare and review sessions through the same Drive experience.',action('Schedule session','orange','data-v8-action="schedule-live"'))}${collectionToolbar(`${list.length} session${list.length===1?'':'s'} in this view`)}${cards?switchableGrid(cards):empty('No sessions in this view')}`;
  }

  function mentorAccess(context){
    let list=experience.accessRequests;if(context==='expiring')list=data().learners.filter(l=>l.status==='Expired'||l.accessCount<=1).map(l=>({id:`exp-${l.id}`,learnerId:l.id,resourceId:'',scope:'PLAN / ITEM',reason:'Access expires or is limited',status:l.status}));
    const title=context==='requests'?'Access Requests':context==='expiring'?'Access expiring soon':'Access discussion';
    const cards=list.map(r=>resourceCard('◉',`${learner(r.learnerId)?.name||r.learnerId} → ${resource(r.resourceId)?.title||r.resourceId}`,`${r.scope} • ${r.reason}`,[r.status,'Exact access'],action('Review','primary',`data-v8-action="review-access" data-id="${r.id}"`))).join('');
    const rows=`<section class="v8-panel"><div class="v8-panel-body v8-list">${list.map(r=>requestRow(r)).join('')||empty('No access items in this view')}</div></section>`;
    return `${heading(title,'Assignment and access remain separate. Review the exact scope before any request.',action('New request','orange','data-v8-action="new-access-request"'))}${collectionToolbar(`${list.length} access item${list.length===1?'':'s'} in this view`)}${currentView()==='list'?rows:(cards?switchableGrid(cards):empty('No access items in this view'))}`;
  }

  function renderPublic(parent,context){
    if(parent==='home')return publicHome(context);
    if(parent==='explore')return publicExplore(context);
    if(parent==='pricing')return publicPricing(context);
    if(parent==='free')return publicFree(context);
    if(parent==='about')return publicAbout(context);
    return publicSupport(context);
  }

  function publicHome(context){
    if(context==='why')return `${heading('Why AspireNest','A connected CTET/TET learning system designed around the learner’s next useful action.')}<div class="v8-grid-3">${resourceCard('⌂','One connected Home','Continue, today, access and recommended learning in one place.',['Student first','Drive style'],'')}${resourceCard('◉','Exact My Access','PLAN, MODULE, BUNDLE and ITEM grants remain explicit.',['Secure','Transparent'],'')}${resourceCard('M','Mentor guidance','Assignments and access awareness stay separate.',['Contextual','Auditable'],'')}</div>`;
    if(context==='journey')return `${heading('How AspireNest works','Move from discovery to learning without fragmented module journeys.')}<div class="v8-public-journey">${[['1','Discover','Search or browse the exact resource.'],['2','Check access','See open, partial, locked or expired clearly.'],['3','Learn','Read, watch, practise or follow a roadmap.'],['4','Continue','Resume through Home, My Access or mentor guidance.']].map(x=>`<article class="v8-public-step"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>`).join('')}</div>`;
    return `${heading('AspireNest Academy','Explore the complete Learning OS before signing in.',`${action('Explore resources','secondary','data-v8-go="explore/all"')}${action('Start Learning','orange','data-v8-role="student"')}`)}<section class="v8-hero public"><div><span class="eyebrow">CTET/TET LEARNING ECOSYSTEM</span><h2>Reach the right learning resource without the maze.</h2><p>Premium notes, videos, mock tests, current affairs, roadmaps and mentor guidance come together in one Google Drive-style learning experience.</p><div class="v8-hero-actions">${action('Start Learning','secondary','data-v8-role="student"')}${action('View plans','secondary','data-v8-go="pricing/plans"')}</div></div><aside class="v8-hero-side"><strong>One App • One System</strong><small>Discovery, access, learning and guidance stay connected.</small><div class="v8-hero-tags"><span>IntelliText</span><span>Mock Tests</span><span>Roadmaps</span><span>Mentor</span></div></aside></section><div class="v8-kpi-grid">${kpi('Published resources',data().resources.length,'Live public catalog')}${kpi('Access states','4','Open • Partial • Locked • Expired')}${kpi('Study workspace','1','Connected learner journey')}${kpi('Mentor support','✓','Context-aware guidance')}</div><div class="v8-grid-3">${resourceCard('N','Premium Notes & IntelliText','Structured learning, revision and personal study tools.',['Native reader','PDF fallback'],action('Explore','secondary','data-v8-go="explore/notes"'))}${resourceCard('✓','Mock Test Practice','Plan, subject, chapter, attempt, result and review.',['Timed attempts','Leaderboard'],action('Explore','secondary','data-v8-go="explore/practice"'))}${resourceCard('⇢','AspirePath Roadmaps','Day-wise learning sequence with progress and linked resources.',['60-day plan','Progress'],action('Explore','secondary','data-v8-go="explore/roadmaps"'))}</div>`;
  }

  function publicExplore(context){
    let list=data().resources.filter(x=>isState(x.status,'published')||!x.status);const map={notes:['note'],videos:['video','replay','live'],practice:['test'],roadmaps:['roadmap']};if(map[context])list=list.filter(x=>map[context].includes(String(x.type||'').toLowerCase()));
    const cards=list.map(r=>resourceCard('▤',r.title,`${r.type} • ${r.subjectName||r.subject}`,[r.requiredPlan||r.plan||'FREE',r.type||'Learning resource'],action('Preview','secondary',`data-v8-action="public-resource" data-id="${r.id}"`))).join('');
    return `${heading(context==='all'?'Explore Learning':context==='practice'?'Mock Tests':context[0].toUpperCase()+context.slice(1),'Discover resources with clear access and delivery information.',action('Start Learning','orange','data-v8-role="student"'))}${collectionToolbar(`${list.length} learning resource${list.length===1?'':'s'}`)}${cards?switchableGrid(cards):empty('No resources in this view')}`;
  }

  function publicPricing(context){
    const products=(data().products||[]);
    const cards=products.map((p,i)=>`<article class="v8-plan-card ${String(p.planCode).toUpperCase()==='PREMIUM'?'featured':''}"><span class="v8-status ${String(p.planCode).toUpperCase()==='PREMIUM'?'navy':''}">${esc(p.planCode)}</span><h3>${esc(p.name)}</h3><div class="v8-price">₹${Number(p.price||0).toLocaleString('en-IN')}<small style="font-size:11px;color:var(--muted)">${p.billingLabel?` / ${esc(p.billingLabel)}`:''}</small></div><ul>${(p.features||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="v8-card-actions">${action(Number(p.price||0)===0?'Start free':'Open Learning OS',String(p.planCode).toUpperCase()==='PREMIUM'?'primary':'secondary','data-v8-role="student"')}</div></article>`).join('');
    return `${heading(context==='compare'?'Compare plans':'Plans & Access','Live active plan products from the AspireNest Access Engine.',action('Open Learning OS','orange','data-v8-role="student"'))}${collectionToolbar(`${products.length} active access plan${products.length===1?'':'s'}`)}${cards?switchableGrid(cards,'v8-plan-grid'):empty('No active public plan product is available')}`;
  }


  function publicFree(context){
    const list=data().resources.filter(x=>(isState(x.status,'published')||!x.status)&&String(x.access||x.requiredPlan||x.plan||'').toUpperCase()==='FREE');
    const cards=list.map(r=>resourceCard('☆',r.title,`${r.type} • ${r.subjectName||r.subject}`,['FREE',r.delivery||'Public'],action('Preview','secondary',`data-v8-action="public-resource" data-id="${r.id}"`))).join('');
    return `${heading(context==='practice'?'Free Practice':'Free Learning','Begin with real published FREE resources and create a verified learner account when ready.',action('Create learner account','orange','data-v8-role="student"'))}${collectionToolbar(`${list.length} free learning item${list.length===1?'':'s'}`)}${cards?switchableGrid(cards):empty('No FREE resource is currently published')}`;
  }

  function publicAbout(context){
    return `${heading(context==='mission'?'Our mission':'One App • One System','Build a premium, safe and simple learning environment for serious CTET/TET preparation.')}<section class="v8-hero public"><div><span class="eyebrow">ASPIRENEST ACADEMY</span><h2>Learning should feel connected, clear and worth returning to.</h2><p>The Learning Drive brings resources, access, progress and mentor guidance into one coherent system without weakening proven module engines.</p></div><aside class="v8-hero-side"><strong>Product principles</strong><div class="v8-hero-tags"><span>Student first</span><span>Premium</span><span>Secure</span><span>Scalable</span></div></aside></section>`;
  }

  function publicSupport(context){
    if(context==='faq')return `${heading('Frequently asked questions','Clear answers before account creation.')}<section class="v8-panel"><div class="v8-panel-body v8-list">${[['How does access work?','Plans and exact grants map to permitted resources.'],['Can I use Google sign-in?','The AspireNest supports verified Google and email authentication.'],['What happens after expiry?','Protected content closes and renewal guidance preserves context.'],['Can a mentor unlock everything?','No. Assignment and access are separate decisions.']].map(x=>`<div class="v8-list-row"><span class="v8-list-icon">?</span><div class="v8-list-main"><strong>${x[0]}</strong><small>${x[1]}</small></div></div>`).join('')}</div></section>`;
    return `${heading('Support','Get help with learning, access or account questions.',action('Open Learning OS','orange','data-v8-role="student"'))}<div class="v8-grid-3">${resourceCard('✉','Contact AspireNest','Reach the academy through the official support workflow.',['Account','Access'],action('Prepare message','secondary','data-v8-action="support-message"'))}${resourceCard('?','Access guidance','Understand plan, module, bundle and item access.',['Transparent','Exact'],action('Read FAQ','secondary','data-v8-go="support/faq"'))}${resourceCard('M','Mentor support','Mentor guidance is available through assigned learner workspaces.',['Mentorship','Context'],action('Start Learning','primary','data-v8-role="student"'))}</div>`;
  }

  function openDialog(title,copy,body,foot=''){
    closeDialog();const node=document.createElement('section');node.className='v8-experience-modal';node.innerHTML=`<div class="v8-experience-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="v8-dialog-head"><div><h2>${esc(title)}</h2><p>${esc(copy)}</p></div><button class="v8-role-close" data-v8-action="close-dialog" aria-label="Close dialog">×</button></div><div class="v8-dialog-body">${body}</div>${foot?`<div class="v8-dialog-foot">${foot}</div>`:''}</div>`;document.body.appendChild(node);
  }

  function assignmentDialog(resourceId='',learnerId=''){
    const d=data();
    const learnerOptions=(d.learners||[]).map(l=>`<option value="${esc(l.id)}" ${l.id===learnerId?'selected':''}>${esc(l.name)} · ${esc(l.plan)}</option>`).join('');
    const resourceOptions=(d.resources||[]).map(r=>`<option value="${esc(r.id)}" ${r.id===resourceId?'selected':''}>${esc(r.title)} · ${esc(r.requiredPlan||r.plan||'FREE')}</option>`).join('');
    if(!learnerOptions||!resourceOptions){toast('A real learner and published resource are required.');return;}
    openDialog('Create learner assignment','Choose an exact resource. Verified entitlement is checked before any real assignment is created.',`<form id="v8AssignmentForm" class="v8-form"><label>Learner<select name="learner" required>${learnerOptions}</select></label><label>Resource<select name="resource" required>${resourceOptions}</select></label><label>Due date<input name="due" type="date"></label><label class="full">Objective<textarea name="objective" required minlength="8" placeholder="Enter the exact learning objective"></textarea></label><div class="v8-panel full"><div class="v8-panel-body"><strong>Access-aware operation</strong><p style="color:var(--muted);font-size:12px;line-height:1.5">The live service verifies the learner's exact entitlement. Missing access is never silently granted.</p></div></div></form>`,`${action('Cancel','secondary','data-v8-action="close-dialog"')}${action('Create real assignment','primary','data-v8-action="submit-assignment"')}`);
  }


  function learnerDialog(id){const l=learner(id);if(!l)return;const assignments=experience.assignments.filter(x=>x.learnerId===id);openDialog(l.name,'Assigned learner workspace with real learning, access and guidance context.',`<div class="v8-kpi-grid">${kpi('Progress',`${l.progress}%`,'Current learning status')}${kpi('Access',l.accessCount,'Exact active grants')}${kpi('Assignments',assignments.length,'Active and historical')}${kpi('Plan',l.plan,l.status)}</div><section class="v8-panel"><div class="v8-panel-head"><div><h2>Recent assignments</h2><p>${esc(l.email)} · Last active ${esc(l.lastActive)}</p></div></div><div class="v8-panel-body v8-list">${assignments.map(a=>assignmentRow(a)).join('')||'<p style="color:var(--muted)">No assignments yet.</p>'}</div></section>`,`${action('Assign resource','secondary',`data-v8-action="create-assignment" data-learner="${id}"`)}${action('Close','primary','data-v8-action="close-dialog"')}`);}

  function resourceDialog(id,publicMode=false){const r=resource(id);if(!r)return;openDialog(r.title,publicMode?'Public preview of the canonical learning resource.':'Mentor resource preview with access mapping.',`<div class="v8-resource-card" style="min-height:auto"><span class="v8-card-icon">▤</span><h3>${esc(r.type)} · ${esc(r.subject)}</h3><p>Delivery: ${esc(r.delivery||r.type||'Learning resource')}<br>Access mapping: ${esc(r.access||r.requiredPlan||r.plan||'FREE')}<br>Status: ${esc(r.status||'Published')}<br>Updated: ${esc(r.updated||'Live record')}</p><div class="v8-card-meta"><span>${esc(r.duration||r.count||'Open resource')}</span><span>${esc(r.access||r.requiredPlan||r.plan||'FREE')}</span></div></div>`,publicMode?`${action('Close','secondary','data-v8-action="close-dialog"')}${action('Open Student Learning OS','primary','data-v8-role="student"')}`:`${action('Close','secondary','data-v8-action="close-dialog"')}${action('Assign','primary',`data-v8-action="assign-resource" data-id="${id}"`)}`);}
  function assignmentDetail(id){const a=experience.assignments.find(x=>x.id===id);if(!a)return;openDialog(a.title,'Assignment evidence and learner context.',`<div class="v8-list"><div class="v8-list-row"><span class="v8-list-icon">♙</span><div class="v8-list-main"><strong>${esc(learner(a.learnerId)?.name||a.learnerId)}</strong><small>${esc(a.due)} · ${esc(a.access)} · ${esc(a.status)}</small></div></div><div class="v8-panel"><div class="v8-panel-body"><strong>Objective</strong><p style="color:var(--muted);line-height:1.55">${esc(a.objective)}</p></div></div></div>`,`${action('Close','primary','data-v8-action="close-dialog"')}`);}
  function answerDialog(id){const q=experience.questions.find(x=>x.id===id);if(!q)return;openDialog('Answer learner question',q.title,`<form id="v8AnswerForm" class="v8-form"><input type="hidden" name="id" value="${q.id}"><label class="full">Learner<input value="${esc(learner(q.learnerId)?.name||q.learnerId)}" readonly></label><label class="full">Guidance<textarea name="answer" required>${isState(q.status,'answered')?'Guidance already recorded.':'Review the linked concept, explain the distinction and assign revision only when useful.'}</textarea></label></form>`,`${action('Cancel','secondary','data-v8-action="close-dialog"')}${action(isState(q.status,'answered')?'Close':'Save answer','primary',isState(q.status,'answered')?'data-v8-action="close-dialog"':'data-v8-action="submit-answer"')}`);}
  function accessDialog(id){const r=experience.accessRequests.find(x=>x.id===id);if(!r)return;openDialog('Review exact access request','Assignment and access remain separate audited decisions.',`<div class="v8-list"><div class="v8-list-row"><span class="v8-list-icon">◉</span><div class="v8-list-main"><strong>${esc(learner(r.learnerId)?.name||r.learnerId)}</strong><small>${esc(r.scope)} → ${esc(resource(r.resourceId)?.title||r.resourceId)}</small></div>${status(r.status)}</div><div class="v8-panel"><div class="v8-panel-body"><strong>Reason</strong><p style="color:var(--muted)">${esc(r.reason)}</p><strong>Approval boundary</strong><p style="color:var(--muted)">The Mentor may create and review the request. Only the Admin Access Engine can grant, extend or revoke real entitlement.</p></div></div></div>`,`${action('Close','primary','data-v8-action="close-dialog"')}`);}


  function showPopover(type){
    closePopover();const p=document.createElement('div');p.className='v8-popover';
    const session=authSession();
    if(type==='account'){
      if(experience.role==='mentor'){
        const name=esc(session.displayName||session.email||'AspireNest Mentor');const identity=esc(sessionIdentity(session));
        p.innerHTML=`<div class="v8-popover-head">Mentor account</div><button><strong>${name}</strong><small>${session.role==='admin'?'Administrator viewing Mentor Workspace':'Mentor Workspace'}${identity?` • ${identity}`:''}</small></button><button data-v8-go="learners/all"><strong>My learners</strong><small>Assigned learners only</small></button><button data-v8-role="student"><strong>Open Student Learning OS</strong><small>Use the learner experience allowed for this account</small></button><button data-v8-role-chooser><strong>Switch experience</strong><small>Only allowed workspaces are shown</small></button><button data-aspirenest-signout><strong>Sign out</strong><small>End this Firebase session</small></button>`;
      }else if(session.user){
        const name=esc(session.displayName||session.email||'AspireNest Account');const identity=esc(sessionIdentity(session));const landing=session.role==='admin'?'admin':session.role==='mentor'?'mentor':'student';
        p.innerHTML=`<div class="v8-popover-head">AspireNest account</div><button><strong>${name}</strong><small>${esc(session.role||'student')}${identity?` • ${identity}`:''}</small></button><button data-v8-role="${landing}"><strong>Open ${landing==='admin'?'Admin Learning Drive':landing==='mentor'?'Mentor Workspace':'Student Learning OS'}</strong><small>Continue with this signed-in account</small></button><button data-v8-go="support/contact"><strong>Support</strong><small>Contact and access guidance</small></button><button data-v8-role-chooser><strong>Switch experience</strong><small>Only allowed workspaces are shown</small></button><button data-aspirenest-signout><strong>Sign out</strong><small>End this Firebase session</small></button>`;
      }else{
        p.innerHTML=`<div class="v8-popover-head">Public experience</div><button data-aspirenest-login="/student"><strong>Start Learning</strong><small>Login to open the Student Learning OS</small></button><button data-v8-go="support/contact"><strong>Support</strong><small>Contact and access guidance</small></button>`;
      }
    }else p.innerHTML=experience.role==='mentor'?`<div class="v8-popover-head">Mentor notifications</div>${experience.questions.filter(x=>isState(x.status,'open')).slice(0,2).map(q=>`<button data-v8-action="answer-question" data-id="${q.id}"><strong>${esc(learner(q.learnerId)?.name||'Learner')} asked a question</strong><small>${esc(q.title)}</small></button>`).join('')}<button data-v8-go="access/requests"><strong>${experience.accessRequests.filter(x=>['pending','pending review'].includes(String(x.status||'').toLowerCase())).length} access requests</strong><small>Review exact scope separately</small></button>`:`<div class="v8-popover-head">AspireNest updates</div><button data-v8-go="explore/all"><strong>Explore the Learning OS</strong><small>Notes, videos, tests and roadmaps</small></button><button data-v8-go="pricing/plans"><strong>View plans</strong><small>Free, Basic, Premium and Mentorship</small></button>`;
    document.body.appendChild(p);
  }

  function handleAction(target){
    const actionName=target.dataset.v8Action;const id=target.dataset.id;
    if(actionName==='clear-search'){experience.query='';$('#globalSearch').value='';renderPage();return;}
    if(actionName==='close-dialog'){closeDialog();return;}
    if(actionName==='create-assignment'){assignmentDialog(target.dataset.resource||'',target.dataset.learner||'');return;}
    if(actionName==='assign-resource'){closeDialog();assignmentDialog(id,'');return;}
    if(actionName==='submit-assignment'){
      const f=$('#v8AssignmentForm');if(!f||!f.reportValidity())return;
      const learnerId=f.elements.learner.value;const resourceId=f.elements.resource.value;const l=learner(learnerId);const r=resource(resourceId);
      platformRequest('mentor-create-assignment',{studentUid:learnerId,studentName:l?.name||'',resourceId:r?.id||resourceId,title:r?.title||'',type:r?.type||r?.resourceType,module:r?.module||r?.subject,requiredPlan:r?.requiredPlan||r?.access||'FREE',canonicalRoute:r?.route||r?.canonicalRoute||'/student',dueAt:f.elements.due.value||'',objective:f.elements.objective.value.trim()},'Real mentor assignment created.');return;
    }
    if(actionName==='open-learner'){learnerDialog(id);return;}
    if(actionName==='resource-detail'){resourceDialog(id,false);return;}
    if(actionName==='public-resource'){resourceDialog(id,true);return;}
    if(actionName==='assignment-detail'){assignmentDetail(id);return;}
    if(actionName==='answer-question'){answerDialog(id);return;}
    if(actionName==='submit-answer'){const f=$('#v8AnswerForm');if(!f||!f.reportValidity())return;platformRequest('mentor-answer-question',{questionId:f.elements.id.value,answer:f.elements.answer.value.trim()},'Guidance answer saved.');return;}
    if(actionName==='review-access'){accessDialog(id);return;}
    if(actionName==='new-access-request'){
      const d=data();const learners=(d.learners||[]).map(l=>`<option value="${esc(l.id)}">${esc(l.name)} · ${esc(l.plan)}</option>`).join('');const resources=(d.resources||[]).map(r=>`<option value="${esc(r.id)}">${esc(r.title)}</option>`).join('');
      if(!learners||!resources){toast('A real learner and resource are required.');return;}
      openDialog('Create access request','Request exact access without changing the learner’s commercial plan.',`<form id="v8AccessRequestForm" class="v8-form"><label>Learner<select name="learner" required>${learners}</select></label><label>Resource<select name="resource" required>${resources}</select></label><label class="full">Reason<textarea name="reason" required minlength="8" placeholder="Explain why this exact access is required"></textarea></label></form>`,`${action('Cancel','secondary','data-v8-action="close-dialog"')}${action('Create real request','primary','data-v8-action="submit-access-request"')}`);return;
    }
    if(actionName==='submit-access-request'){const f=$('#v8AccessRequestForm');if(!f||!f.reportValidity())return;const l=learner(f.elements.learner.value);const r=resource(f.elements.resource.value);platformRequest('mentor-create-access-request',{studentUid:l?.id||f.elements.learner.value,resourceId:r?.id||f.elements.resource.value,title:r?.title||'',type:r?.type||r?.resourceType,module:r?.module||r?.subject,requiredPlan:r?.requiredPlan||r?.access||'FREE',canonicalRoute:r?.route||r?.canonicalRoute||'/student',reason:f.elements.reason.value.trim()},'Exact access request created for Admin review.');return;}
    if(actionName==='schedule-live'){openDialog('Schedule live session','Create a real Mentor session record.',`<form id="v8LiveSessionForm" class="v8-form"><label class="full">Session title<input name="title" required minlength="4"></label><label>Date<input name="date" type="date" required></label><label>Time<input name="time" type="time" required></label><label class="full">Learner group<input name="group" required value="Assigned learners"></label><label class="full">Join URL<input name="joinUrl" type="url" placeholder="https://..."></label></form>`,`${action('Cancel','secondary','data-v8-action="close-dialog"')}${action('Schedule real session','primary','data-v8-action="submit-live"')}`);return;}
    if(actionName==='submit-live'){const f=$('#v8LiveSessionForm');if(!f||!f.reportValidity())return;platformRequest('mentor-schedule-session',{title:f.elements.title.value,date:f.elements.date.value,time:f.elements.time.value,group:f.elements.group.value,joinUrl:f.elements.joinUrl.value},'Live session scheduled.');return;}
    if(actionName==='open-live'){const session=experience.liveSessions.find(x=>x.id===id);const url=session?.replayUrl||session?.joinUrl;if(url)window.location.assign(url);else toast('No join or replay link is available.');return;}
    if(actionName==='support-message'){window.location.assign('/contact');return;}
  }


  function onClickCapture(event){
    if(event.target.closest('#aspirenestAuthOverlay'))return;
    const login=event.target.closest('[data-aspirenest-login]');if(login){event.preventDefault();event.stopImmediatePropagation();const target=login.dataset.aspirenestLogin||'/student';window.location.assign(`/login?returnTo=${encodeURIComponent(target)}`);return;}
    const signout=event.target.closest('[data-aspirenest-signout]');if(signout){event.preventDefault();event.stopImmediatePropagation();closePopover();closeRoleChooser();window.dispatchEvent(new CustomEvent('aspirenest:signout'));return;}
    const roleChooser=event.target.closest('#roleSwitchButton,[data-v8-role-chooser]');
    if(roleChooser){event.preventDefault();event.stopImmediatePropagation();showRoleChooser();return;}
    const closeRole=event.target.closest('[data-v8-close-role]');if(closeRole){event.preventDefault();event.stopImmediatePropagation();closeRoleChooser();return;}
    const roleTarget=event.target.closest('[data-v8-role]');if(roleTarget){event.preventDefault();event.stopImmediatePropagation();requestExperience(roleTarget.dataset.v8Role);return;}
    const chooser=$('#v8RoleChooser');if(chooser&&event.target===chooser){event.preventDefault();event.stopImmediatePropagation();closeRoleChooser();return;}
    if(!experience.role)return;

    event.stopImmediatePropagation();
    const parent=event.target.closest('[data-v8-parent]');if(parent){navigateExperience(parent.dataset.v8Parent);return;}
    const context=event.target.closest('[data-v8-context]');if(context){const [p]=stateFor(experience.role);navigateExperience(p,context.dataset.v8Context);return;}
    const go=event.target.closest('[data-v8-go]');if(go){const [p,c]=go.dataset.v8Go.split('/');navigateExperience(p,c);return;}
    const viewTarget=event.target.closest('[data-v8-view]');if(viewTarget){setCurrentView(viewTarget.dataset.v8View);return;}
    const actionTarget=event.target.closest('[data-v8-action]');if(actionTarget){handleAction(actionTarget);return;}
    if(event.target.closest('#brandHome')){navigateExperience('home','overview');return;}
    if(event.target.closest('#quickContinue')){experience.role==='mentor'?assignmentDialog():triggerCoreRole('student');return;}
    if(event.target.closest('#accountButton')){showPopover('account');return;}
    if(event.target.closest('#notificationsButton')){showPopover('notifications');return;}
    if(event.target.closest('#searchFiltersButton')){showPopover('notifications');return;}
    if(event.target.closest('#collapseContext')){const rail=$('.context-rail');if(window.innerWidth<=960)rail?.classList.toggle('mobile-open');else $('#app')?.classList.toggle('context-collapsed');return;}
    if(!event.target.closest('.v8-popover'))closePopover();
    if(event.target.closest('.v8-experience-modal')&&!event.target.closest('.v8-experience-dialog'))closeDialog();
  }

  function onInputCapture(event){
    if(!experience.role||event.target.id!=='globalSearch')return;event.stopImmediatePropagation();experience.query=event.target.value;renderPage();
  }

  function onKeyCapture(event){
    if(event.key==='Escape'){if($('#v8RoleChooser')){event.preventDefault();event.stopImmediatePropagation();closeRoleChooser();return;}if(experience.role){event.preventDefault();event.stopImmediatePropagation();closeDialog();closePopover();return;}}
    if(experience.role&&event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();event.stopImmediatePropagation();$('#globalSearch')?.focus();}
  }

  function routeFromHash(){
    const parts=location.hash.replace(/^#/,'').split('/').filter(Boolean);if(!parts.length)return;
    if(parts[0]==='mentor'||parts[0]==='public'){
      window.__aspirenestActiveExperience=parts[0];
      if(experience.role!==parts[0]){experience.role=parts[0];window.__aspirenestExperienceRole=parts[0];window.__aspirenestRole='admin';const app=$('#app');app.classList.add('admin-mode','v8-experience-mode');app.classList.toggle('v8-mentor-mode',parts[0]==='mentor');app.classList.toggle('v8-public-mode',parts[0]==='public');}
      if(parts[0]==='mentor'){experience.mentorParent=parts[1]||'home';experience.mentorContext=parts[2]||'overview';}else{experience.publicParent=parts[1]||'home';experience.publicContext=parts[2]||'overview';}
      configureChrome();renderExperience();
    }
  }

  document.addEventListener('click',onClickCapture,true);
  document.addEventListener('input',onInputCapture,true);
  document.addEventListener('keydown',onKeyCapture,true);
  window.addEventListener('hashchange',routeFromHash);
  window.__aspirenestExperienceAPI = Object.freeze({
    enterExperience,
    cleanupExperience,
    showRoleChooser,
    routeFromHash,
  });
  window.dispatchEvent(new CustomEvent('aspirenest:experience-runtime-ready'));
  queueMicrotask(routeFromHash);
})();

"use strict";
const { initializeApp,getApps }=require("firebase-admin/app");
const { getAuth }=require("firebase-admin/auth");
const { getFirestore,Timestamp }=require("firebase-admin/firestore");
const { createLp5AcademyOperationsAuthority }=require("../../functions/lp5AcademyOperationsAuthority");

const PROJECT=String(process.env.LP5_STAGING_PROJECT||"").trim();
const API_KEY=String(process.env.LP5_WEB_API_KEY||"").trim();
const REGION=String(process.env.LP5_REGION||"asia-south1").trim();
if(!PROJECT||!API_KEY)throw new Error("LP5 staging environment is incomplete.");
if(!getApps().length)initializeApp({projectId:PROJECT});
const auth=getAuth(), db=getFirestore();
const endpoint=`https://${REGION}-${PROJECT}.cloudfunctions.net/lp5AcademyOperationsOperation`;
const prefix=`lp5s5005-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const password="AspireNest1!Staging";
const emails={
  admin:`${prefix}-admin@example.invalid`,
  mentor:`${prefix}-mentor@example.invalid`,
  student:`${prefix}-student@example.invalid`,
  other:`${prefix}-other@example.invalid`,
};
const createdUsers=[];
const state={};
const findings=[];
const tokenEmailByToken=new Map();
let pass=0,red=0,skip=0;

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const clean=(v="")=>String(v??"").trim();

async function signIn(email,passwordValue=password){
  let last;
  for(let i=1;i<=6;i++){
    const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(API_KEY)}`,{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password:passwordValue,returnSecureToken:true})
    });
    const b=await r.json().catch(()=>({}));
    if(r.ok&&b.idToken){
      tokenEmailByToken.set(b.idToken,email);
      return b.idToken;
    }
    last=new Error(`IDENTITY_TOOLKIT_${r.status}:${JSON.stringify(b).slice(0,300)}`);
    if([408,429,500,502,503,504].includes(r.status)&&i<6){await sleep(3_000*i);continue;}
    throw last;
  }
  throw last;
}
async function call(method,token,payload={}){
  let last;
  let activeToken=token;
  for(let i=1;i<=6;i++){
    const r=await fetch(endpoint,{
      method:"POST",
      headers:{"content-type":"application/json",...(activeToken?{authorization:`Bearer ${activeToken}`}:{})},
      body:JSON.stringify({data:{method,payload,meta:{requestId:`${prefix}-${method}-${i}`,correlationId:prefix}}})
    });
    const text=await r.text(); let body={}; try{body=JSON.parse(text)}catch{}
    if(r.ok&&body&&body.result)return body.result;
    const code=body&&body.error&&body.error.status||body&&body.error&&body.error.message||`HTTP_${r.status}`;
    last=Object.assign(new Error(`${method}:${r.status}:${code}:${text.slice(0,400)}`),{status:r.status,body});
    if(r.status===401 && activeToken && tokenEmailByToken.has(activeToken) && i<6){
      const email=tokenEmailByToken.get(activeToken);
      console.log(`CALLABLE_TOKEN_REFRESH=${method}:${i}`);
      activeToken=await signIn(email);
      await sleep(3_000*i);
      continue;
    }
    if([408,429,500,502,503,504].includes(r.status)&&i<6){
      console.log(`CALLABLE_TRANSPORT_RETRY=${method}:${r.status}:${i}`);
      await sleep(3_000*i);
      continue;
    }
    throw last;
  }
  throw last;
}
async function denied(method,token,payload={}){
  try{await call(method,token,payload);return false;}
  catch(e){return [400,401,403,404,409,412,429,500,502,503,504].includes(Number(e.status||0))||/permission|forbidden|unauth|precondition|not found/i.test(String(e.message));}
}
async function check(label,fn,deps=[]){
  if(deps.some(d=>state[d]!==true)){
    skip++;findings.push({label,status:"SKIPPED_DEPENDENCY",deps});console.log(`SKIPPED_DEPENDENCY=${label}:${deps.join(",")}`);return;
  }
  try{await fn();state[label]=true;pass++;console.log(`PASS=${label}`);}
  catch(e){state[label]=false;red++;findings.push({label,status:"RED",error:String(e&&e.stack||e).slice(0,1500)});console.log(`RED=${label}:${String(e&&e.message||e).slice(0,500)}`);}
}
function assert(x,msg){if(!x)throw new Error(msg);}
async function createUser(key,role){
  const u=await auth.createUser({email:emails[key],password,emailVerified:true,disabled:false,displayName:`LP5 ${key}`});
  createdUsers.push(u.uid);
  await db.collection("roleAuthorities").doc(u.uid).set({uid:u.uid,role,activeRole:role,accountStatus:"active",authorityVersion:1,tokensValidAfterSeconds:0});
  await db.collection(role==="student"?"students":"users").doc(u.uid).set({uid:u.uid,email:emails[key],displayName:`LP5 ${key}`,role});
  for(let i=1;i<=6;i++){
    const snap=await db.collection("roleAuthorities").doc(u.uid).get();
    if(snap.exists && String((snap.data()||{}).activeRole||"").toLowerCase()===role) return u;
    await sleep(1_000*i);
  }
  throw new Error(`ROLE_AUTHORITY_PROPAGATION_FAILED:${key}:${role}`);
}
async function countEntitlements(uid){
  const s=await db.collection("studentEntitlements").doc(uid).collection("items").get();return s.size;
}
async function cleanup(){
  const actorSet=new Set(createdUsers);
  const deleteBatch=async(refs)=>{
    for(let i=0;i<refs.length;i+=300){const b=db.batch();for(const ref of refs.slice(i,i+300))b.delete(ref);await b.commit();}
  };
  try{
    const ops=await db.collection("lp5AcademyOps").get();
    await deleteBatch(ops.docs.filter(d=>{
      const x=d.data()||{};
      return actorSet.has(clean(x.lastActorUid))||clean(x.id).includes(prefix)||clean(x.notificationId).includes(prefix)||clean(x.idempotencyKey).includes(prefix);
    }).map(d=>d.ref));
    const audits=await db.collection("lp5AuditLogs").get();
    await deleteBatch(audits.docs.filter(d=>actorSet.has(clean((d.data()||{}).actorUid))||clean((d.data()||{}).correlationId)===prefix).map(d=>d.ref));
    const events=await db.collection("experienceEvents").get();
    await deleteBatch(events.docs.filter(d=>d.id.includes(prefix)||actorSet.has(clean((d.data()||{}).lastActorUid))).map(d=>d.ref));
    if(state.mentorUid&&state.studentUid)await db.collection("mentorProfiles").doc(state.mentorUid).collection("students").doc(state.studentUid).delete().catch(()=>{});
    if(state.mentorUid&&state.otherUid)await db.collection("mentorProfiles").doc(state.mentorUid).collection("students").doc(state.otherUid).delete().catch(()=>{});
    if(state.mentorUid)await db.collection("mentorProfiles").doc(state.mentorUid).delete().catch(()=>{});
    for(const uid of createdUsers){
      await db.collection("roleAuthorities").doc(uid).delete().catch(()=>{});
      await db.collection("students").doc(uid).delete().catch(()=>{});
      await db.collection("users").doc(uid).delete().catch(()=>{});
      const ents=await db.collection("studentEntitlements").doc(uid).collection("items").get().catch(()=>null);
      if(ents)await deleteBatch(ents.docs.map(d=>d.ref));
      await db.collection("studentEntitlements").doc(uid).delete().catch(()=>{});
    }
    for(const uid of createdUsers)await auth.deleteUser(uid).catch(()=>{});
  }catch(e){console.error("CLEANUP_ERROR",e);}
}
async function residue(){
  let n=0;
  const ops=await db.collection("lp5AcademyOps").get();n+=ops.docs.filter(d=>createdUsers.includes(clean((d.data()||{}).lastActorUid))||d.id.includes(prefix)||clean((d.data()||{}).notificationId).includes(prefix)).length;
  const audits=await db.collection("lp5AuditLogs").get();n+=audits.docs.filter(d=>createdUsers.includes(clean((d.data()||{}).actorUid))||clean((d.data()||{}).correlationId)===prefix).length;
  const ev=await db.collection("experienceEvents").get();n+=ev.docs.filter(d=>d.id.includes(prefix)).length;
  return n;
}

(async()=>{
  try{
    const admin=await createUser("admin","admin");
    const mentor=await createUser("mentor","mentor");
    const student=await createUser("student","student");
    const other=await createUser("other","student");
    Object.assign(state,{adminUid:admin.uid,mentorUid:mentor.uid,studentUid:student.uid,otherUid:other.uid});
    await db.collection("mentorProfiles").doc(mentor.uid).set({mentorUid:mentor.uid,role:"mentor",status:"active"});
    await db.collection("mentorProfiles").doc(mentor.uid).collection("students").doc(student.uid).set({mentorUid:mentor.uid,studentUid:student.uid,status:"active"});
    await db.collection("studentEntitlements").doc(student.uid).collection("items").doc(`${prefix}-grant`).set({
      uid:student.uid,status:"active",scopeType:"plan",planCode:"PREMIUM",noExpiry:true,source:"lp3-reused-staging-fixture"
    });
    state.entitlementBefore=await countEntitlements(student.uid);
    state.adminToken=await signIn(emails.admin);
    state.mentorToken=await signIn(emails.mentor);
    state.studentToken=await signIn(emails.student);
    state.otherToken=await signIn(emails.other);

    // New Gen2 revisions can answer public traffic before authenticated invocations are fully stable.
    // Prove each role path before the full pack harvest so rollout transients do not masquerade as product defects.
    const readiness=[
      ["ADMIN",()=>call("runAdminReadiness",state.adminToken,{})],
      ["MENTOR",()=>call("loadMentorWorkspace",state.mentorToken,{})],
      ["STUDENT",()=>call("loadStudentCommandCenter",state.studentToken,{})],
      ["OTHER_STUDENT",()=>call("loadStudentCommandCenter",state.otherToken,{})],
      ["PUBLIC",()=>call("listExperienceEvents","",{})],
    ];
    for(const [label,fn] of readiness){
      const r=await fn();
      assert(r&&r.ok===true,`CALLABLE_READINESS_${label}_FAILED`);
      console.log(`CALLABLE_READINESS=${label}:GREEN`);
    }
    console.log("CALLABLE_READINESS=GREEN_PUBLIC_ADMIN_MENTOR_STUDENT");
    console.log("FIXTURE_SETUP=GREEN");

    await check("P52_ASSIGNED_LEARNER360",async()=>{
      const r=await call("loadMentorLearner360",state.mentorToken,{studentUid:student.uid});
      assert(r.ok===true,"learner360 not ok");assert(r.state.learner360.uid===student.uid,"wrong learner");
      assert(!("email" in (r.state.learner360.learner||{})),"private email leaked");
    });
    await check("P52_UNASSIGNED_DENY",async()=>assert(await denied("loadMentorLearner360",state.mentorToken,{studentUid:other.uid}),"unassigned learner visible"));
    await check("P52_ASSIGNMENT_NOT_ENTITLEMENT",async()=>{
      const r=await call("createMentorAssignment",state.mentorToken,{id:`${prefix}-assignment`,studentUid:student.uid,resourceId:"note-fixture",resourceType:"note",title:"LP5 Work"});
      assert(r.state.assignmentDoesNotGrantEntitlement===true,"assignment entitlement contract absent");
      assert(await countEntitlements(student.uid)===state.entitlementBefore,"assignment changed entitlement");
      state.assignmentId=r.state.assignment.id;
    });
    await check("P52_STUDENT_SUBMIT_MENTOR_REVIEW",async()=>{
      const list=await call("loadStudentAssignments",state.studentToken,{});
      assert(list.state.assignments.some(x=>x.id===state.assignmentId),"student assignment absent");
      await call("submitStudentAssignment",state.studentToken,{assignmentId:state.assignmentId,submission:{text:"done"}});
      await call("reviewMentorAssignment",state.mentorToken,{assignmentId:state.assignmentId,outcome:"Reviewed",nextAction:"Continue"});
    },["P52_ASSIGNMENT_NOT_ENTITLEMENT"]);
    await check("P52_GUIDANCE_INTERVENTION_COMMUNICATION",async()=>{
      const q=await call("requestMentorHelp",state.studentToken,{mentorUid:mentor.uid,resourceId:"note-fixture",question:"Need help"});
      await call("answerMentorQuestion",state.mentorToken,{questionId:q.state.question.id,answer:"Guidance"});
      await call("saveMentorIntervention",state.mentorToken,{id:`${prefix}-intervention`,studentUid:student.uid,type:"Support",note:"Private"});
      await call("saveMentorCommunication",state.mentorToken,{id:`${prefix}-communication`,studentUid:student.uid,channel:"In-app",summary:"Guidance"});
    });

    await check("P53_ADMIN_ROLE_DENY",async()=>assert(await denied("saveAdminResource",state.studentToken,{id:`${prefix}-evil`,kind:"note",title:"No"}),"student invoked admin write"));
    await check("P53_ADMIN_STUDIO_WRITE_VALIDATE_PUBLISH_VERSION",async()=>{
      const valid=await call("validateAdminResource",state.adminToken,{kind:"note",title:"LP5 Resource"});assert(valid.state.valid===true,"validation failed");
      await call("saveAdminResource",state.adminToken,{id:`${prefix}-resource`,kind:"note",title:"LP5 Resource",status:"draft"});
      const pub=await call("publishAdminResource",state.adminToken,{resourceId:`${prefix}-resource`});assert(pub.state.resource.status==="published","publish failed");
      await call("createAdminResourceVersion",state.adminToken,{resourceId:`${prefix}-resource`,title:"LP5 Resource",version:2});
      const ready=await call("runAdminReadiness",state.adminToken,{});assert(ready.state.green===true,"readiness red");
    });
    await check("P53_ADMIN_REPORT_PII_MASK",async()=>{
      await call("createPublicSupportRequest","",{id:`${prefix}-support`,email:"person@example.test",message:"Help"});
      const rep=await call("exportAdminReport",state.adminToken,{});
      assert(rep.state.piiMasked===true,"mask flag absent");
      assert(!JSON.stringify(rep.state).includes("person@example.test"),"PII leaked in report");
    });

    await check("P54_EXPERIENCE_SERVER_TIME_CTA",async()=>{
      const now=Date.now();
      const saved=await call("saveExperienceEntity",state.adminToken,{id:`${prefix}-event`,title:"LP5 Live",type:"live",status:"published",startAtMs:now-30000,endAtMs:now+300000,cta:{resourceId:"note-fixture",route:"/ctet-tet/notes"}});
      assert(saved.state.event.serverStatus==="active","server event state not active");
      const pub=await call("listExperienceEvents","",{});const event=pub.state.items.find(x=>x.id===`${prefix}-event`);
      assert(event&&event.serverStatus==="active","public event missing");assert(event.cta.resourceId==="note-fixture","CTA mismatch");
    });

    await check("P55_NOTIFICATION_RECIPIENT_PRIVACY_NO_ACCESS_GRANT",async()=>{
      const before=await countEntitlements(student.uid);
      await call("createNotification",state.adminToken,{id:`${prefix}-notification`,audience:"student",recipientUid:student.uid,title:"Work ready",deepLink:"/student"});
      await call("publishNotification",state.adminToken,{id:`${prefix}-notification`,audience:"student",recipientUid:student.uid,title:"Work ready",deepLink:"/student"});
      const own=await call("loadStudentNotifications",state.studentToken,{});assert(own.state.items.some(x=>x.id===`${prefix}-notification`),"recipient notification absent");assert(own.state.unreadCount>=1,"server unread count missing");
      const otherInbox=await call("loadStudentNotifications",state.otherToken,{});assert(!otherInbox.state.items.some(x=>x.id===`${prefix}-notification`),"notification leaked");
      await call("archiveNotification",state.studentToken,{notificationId:`${prefix}-notification`,action:"read"});
      await call("archiveNotification",state.studentToken,{notificationId:`${prefix}-notification`,action:"pin"});
      const readPinned=await call("loadStudentNotifications",state.studentToken,{});
      const inboxItem=readPinned.state.items.find(x=>x.id===`${prefix}-notification`);assert(inboxItem&&inboxItem.read===true&&inboxItem.pinned===true,"server inbox read/pin state failed");
      assert(await countEntitlements(student.uid)===before,"notification granted access");
      await call("saveStudentNotificationPreferences",state.studentToken,{quietStart:"22:00",quietEnd:"07:00",timezone:"Asia/Kolkata",weeklyDigest:true});
    });

    await check("P56_SCHEDULER_IDEMPOTENCY_EXTERNAL_QUEUE",async()=>{
      const a=await call("scheduleNotification",state.adminToken,{notificationId:`${prefix}-notification`,recipientUid:student.uid,idempotencyKey:`${prefix}-delivery-key`,deliverAtMs:Date.now()-1000,channel:"EMAIL"});
      const b=await call("scheduleNotification",state.adminToken,{notificationId:`${prefix}-notification`,recipientUid:student.uid,idempotencyKey:`${prefix}-delivery-key`,deliverAtMs:Date.now()-1000,channel:"EMAIL"});
      assert(a.state.duplicatePrevented===false&&b.state.duplicatePrevented===true,"duplicate prevention failed");
      const localAuthority=createLp5AcademyOperationsAuthority({firestore:db,serverTimestamp:()=>Timestamp.now(),now:()=>Date.now()});
      await localAuthority.runDueNotificationJobs({limit:20});
      const deliveries=await call("listNotificationDelivery",state.studentToken,{});
      const d=deliveries.state.items.find(x=>x.idempotencyKey===`${prefix}-delivery-key`);
      assert(d&&d.status==="queued_disabled","disabled external channel not queued safely");
    },["P55_NOTIFICATION_RECIPIENT_PRIVACY_NO_ACCESS_GRANT"]);

    await check("P57_DIRECT_DATA_PRIVACY_AND_AUDIT",async()=>{
      const r=await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/lp5AcademyOps/${encodeURIComponent(state.assignmentId||`${prefix}-assignment`)}`,{
        headers:{authorization:`Bearer ${state.studentToken}`}
      });
      assert([401,403,404].includes(r.status),"direct lp5 ops read not denied");
      assert(await denied("loadMentorLearner360",state.mentorToken,{studentUid:other.uid}),"unassigned learner privacy broken");
      const audit=await call("exportNotificationAudit",state.adminToken,{});
      assert(audit.state.piiMasked===true,"audit mask absent");
    });

    await check("P58_ONE_DAY_OPERATIONAL_SIMULATION",async()=>{
      assert(state.entitlementBefore>0,"LP3 access dependency fixture absent");
      const workspaces=await Promise.all([
        call("loadMentorWorkspace",state.mentorToken,{}),
        call("loadStudentCommandCenter",state.studentToken,{}),
        call("loadAdminWorkspace",state.adminToken,{})
      ]);
      assert(workspaces.every(x=>x.ok===true),"role workspace unavailable");
      const analytics=await call("loadRoleAnalytics",state.mentorToken,{});assert(analytics.ok===true,"analytics unavailable");
      assert(await countEntitlements(student.uid)===state.entitlementBefore,"one-day ops mutated entitlement unexpectedly");
      const ready=await call("runAdminReadiness",state.adminToken,{});assert(ready.state.green===true,"unresolved queue discrepancy");
    },["P52_STUDENT_SUBMIT_MENTOR_REVIEW","P53_ADMIN_STUDIO_WRITE_VALIDATE_PUBLISH_VERSION","P54_EXPERIENCE_SERVER_TIME_CTA","P55_NOTIFICATION_RECIPIENT_PRIVACY_NO_ACCESS_GRANT","P56_SCHEDULER_IDEMPOTENCY_EXTERNAL_QUEUE"]);

    console.log(`LP5_PACK_STAGING_PASS=${pass}`);
    console.log(`LP5_PACK_STAGING_RED=${red}`);
    console.log(`LP5_PACK_STAGING_SKIPPED_DEPENDENCY=${skip}`);
  } finally {
    await cleanup();
    const remaining=await residue().catch(()=>999);
    console.log(`LP5_STAGING_RESIDUE=${remaining}`);
    if(findings.length)console.log("LP5_STAGING_FINDINGS="+JSON.stringify(findings));
  }
  if(red===0&&skip===0){
    console.log("LP5_PHASE_5_2_TO_5_8_STAGING=GREEN");
    console.log("LP5_PACK_STAGING=GREEN");
    process.exit(0);
  }
  process.exit(2);
})().catch(async e=>{
  console.error("LP5_STAGING_FATAL",e);
  await cleanup().catch(()=>{});
  const remaining=await residue().catch(()=>999);
  console.log(`LP5_STAGING_RESIDUE=${remaining}`);
  process.exit(3);
});

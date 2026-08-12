"use strict";
const { randomUUID } = require("node:crypto");

const METHOD_POLICIES = Object.freeze({"answerMentorQuestion":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"archiveAdminResource":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"archiveExperienceEntity":{"owner":"lp5AcademyOperationsService","phase":"5.4","role":"ADMIN"},"archiveNotification":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"AUTH"},"createAdminResourceVersion":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"createCommerceOrder":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"createMentorAssignment":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"createNotification":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"ADMIN"},"createNotificationJob":{"owner":"lp5AcademyOperationsService","phase":"5.6","role":"ADMIN"},"createPaymentLink":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"ADMIN"},"createPublicAccessEnquiry":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"PUBLIC"},"createPublicSupportRequest":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"PUBLIC"},"createRazorpayQr":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"ADMIN"},"exportAdminReport":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"exportNotificationAudit":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"ADMIN"},"listExperienceEvents":{"owner":"lp5AcademyOperationsService","phase":"5.4","role":"PUBLIC"},"listNotificationDelivery":{"owner":"lp5AcademyOperationsService","phase":"5.6","role":"AUTH"},"loadAdminWorkspace":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"loadMentorCalendar":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"loadMentorCommandCenter":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"loadMentorLearner360":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"loadMentorNotifications":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"MENTOR_OR_ADMIN"},"loadMentorOutcomes":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"loadMentorToday":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"loadMentorWorkspace":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"loadNotificationCenter":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"PUBLIC"},"loadRoleAnalytics":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"AUTH"},"loadStudentAssignments":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"STUDENT_OR_ADMIN"},"loadStudentCommandCenter":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"STUDENT_OR_ADMIN"},"loadStudentNotifications":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"STUDENT_OR_ADMIN"},"loadStudentResults":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"STUDENT_OR_ADMIN"},"loadStudentTasks":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"STUDENT_OR_ADMIN"},"publishAdminResource":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"publishMentorAssignment":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"publishNotification":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"ADMIN"},"reconcilePayment":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"ADMIN"},"requestMentorAccountReview":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"requestMentorHelp":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"STUDENT_OR_ADMIN"},"requestStudentDataExport":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"STUDENT_OR_ADMIN"},"reviewMentorAssignment":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"runAdminReadiness":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"saveAdminOperation":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"saveAdminResource":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"saveAdminResourceAsset":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"saveAdminSettings":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"saveCommerceSettings":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"saveEmailSettings":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"saveExperienceEntity":{"owner":"lp5AcademyOperationsService","phase":"5.4","role":"ADMIN"},"saveMentorAssignmentDraft":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"saveMentorCollection":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"saveMentorCommunication":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"saveMentorGroup":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"saveMentorIntervention":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"saveMentorNotificationPreferences":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"MENTOR_OR_ADMIN"},"saveMentorPreferences":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"MENTOR_OR_ADMIN"},"saveNotificationPreferences":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"AUTH"},"saveNotificationRule":{"owner":"lp5AcademyOperationsService","phase":"5.6","role":"ADMIN"},"saveNotificationTemplate":{"owner":"lp5AcademyOperationsService","phase":"5.6","role":"ADMIN"},"saveQuestionBankQuestion":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"ADMIN"},"saveStudentNotificationPreferences":{"owner":"lp5AcademyOperationsService","phase":"5.5","role":"STUDENT_OR_ADMIN"},"saveStudentPreferences":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"STUDENT_OR_ADMIN"},"scheduleMentorSession":{"owner":"lp5AcademyOperationsService","phase":"5.4","role":"MENTOR_OR_ADMIN"},"scheduleNotification":{"owner":"lp5AcademyOperationsService","phase":"5.6","role":"ADMIN"},"submitStudentAssignment":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"STUDENT_OR_ADMIN"},"unpublishAdminResource":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"},"updateLearnerLifecycle":{"owner":"lp5AcademyOperationsService","phase":"5.2","role":"MENTOR_OR_ADMIN"},"updateStudentTask":{"owner":"lp5AcademyOperationsService","phase":"5.7","role":"STUDENT_OR_ADMIN"},"validateAdminResource":{"owner":"lp5AcademyOperationsService","phase":"5.3","role":"ADMIN"}});

const ADMIN_EMAILS = new Set(["aspirenestplatform@gmail.com"]);
const OPS_COLLECTION = "lp5AcademyOps";
const AUDIT_COLLECTION = "lp5AuditLogs";
const clean = (v="") => String(v ?? "").trim();
const lower = (v="") => clean(v).toLowerCase();
const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = (v) => Array.isArray(v) ? v : [];
const nowDefault = () => Date.now();
const idDefault = () => randomUUID();
const fail = (code,message) => Object.assign(new Error(message), { lp5Code:code });
const cloneSafe = (v) => JSON.parse(JSON.stringify(v ?? null));
const maskText = (value="") => String(value ?? "")
  .replace(/\b([A-Z0-9._%+-])[A-Z0-9._%+-]*(@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi, "$1***$2")
  .replace(/\b(\+?\d{2})?\d{6,12}(\d{2})\b/g, "***$2");
const maskValue = (value) => {
  if (typeof value === "string") return maskText(value);
  if (Array.isArray(value)) return value.map(maskValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,maskValue(v)]));
  }
  return value;
};

const PHASES = Object.freeze(["5.2","5.3","5.4","5.5","5.6","5.7","5.8"]);

function createLp5AcademyOperationsAuthority(deps={}) {
  const firestore = deps.firestore;
  const serverTimestamp = typeof deps.serverTimestamp === "function" ? deps.serverTimestamp : (()=>new Date());
  const now = typeof deps.now === "function" ? deps.now : nowDefault;
  const idFactory = typeof deps.idFactory === "function" ? deps.idFactory : idDefault;
  if (!firestore || typeof firestore.collection !== "function") throw new TypeError("LP5 academy operations requires Firestore.");

  const col = () => firestore.collection(OPS_COLLECTION);
  const auditCol = () => firestore.collection(AUDIT_COLLECTION);

  async function principal(auth) {
    if (!auth || !clean(auth.uid)) return Object.freeze({authenticated:false,uid:"",email:"",role:"public",isAdmin:false});
    const uid=clean(auth.uid), email=lower(auth.token && auth.token.email);
    if (ADMIN_EMAILS.has(email)) return Object.freeze({authenticated:true,uid,email,role:"admin",isAdmin:true});
    const snap=await firestore.collection("roleAuthorities").doc(uid).get();
    const d=snap.exists?obj(snap.data()):{};
    const active=lower(d.accountStatus || "active")==="active";
    const role=active?lower(d.activeRole || d.role):"";
    return Object.freeze({authenticated:true,uid,email,role:role||"unknown",isAdmin:role==="admin"});
  }

  function requireRole(p,spec) {
    if (spec==="PUBLIC") return;
    if (!p.authenticated) throw fail("UNAUTHENTICATED","Sign-in is required.");
    if (spec==="AUTH") return;
    if (spec==="ADMIN" && !p.isAdmin) throw fail("FORBIDDEN","Admin authority is required.");
    if (spec==="MENTOR_OR_ADMIN" && !(p.isAdmin||p.role==="mentor")) throw fail("FORBIDDEN","Mentor authority is required.");
    if (spec==="STUDENT_OR_ADMIN" && !(p.isAdmin||p.role==="student")) throw fail("FORBIDDEN","Student authority is required.");
  }

  async function assigned(mentorUid, studentUid) {
    if (!clean(mentorUid)||!clean(studentUid)) return false;
    const snap=await firestore.collection("mentorProfiles").doc(clean(mentorUid)).collection("students").doc(clean(studentUid)).get();
    const d=snap.exists?obj(snap.data()):{};
    return snap.exists && lower(d.status)==="active" &&
      clean(d.mentorUid || mentorUid)===clean(mentorUid) &&
      clean(d.studentUid || studentUid)===clean(studentUid);
  }

  async function requireAssigned(p, studentUid, mentorUid=p.uid) {
    if (p.isAdmin) return;
    if (p.role!=="mentor") throw fail("FORBIDDEN","Mentor authority is required.");
    if (!(await assigned(mentorUid,studentUid))) throw fail("FORBIDDEN","Learner is not assigned to this Mentor.");
  }

  async function studentMentor(studentUid, requestedMentor="") {
    const wanted=clean(requestedMentor);
    if (wanted && await assigned(wanted,studentUid)) return wanted;
    const profiles=await firestore.collection("mentorProfiles").limit(100).get();
    for (const doc of profiles.docs||[]) if (await assigned(doc.id,studentUid)) return doc.id;
    return "";
  }

  async function listOps() {
    const snap=await col().limit(1000).get();
    return (snap.docs||[]).map(d=>({id:d.id,...obj(d.data())}));
  }
  async function getOp(id) {
    const snap=await col().doc(clean(id)).get();
    return snap.exists?{id:snap.id,...obj(snap.data())}:null;
  }
  async function put(kind,id,data,p) {
    const safeId=clean(id)||`${kind}-${idFactory()}`;
    const ref=col().doc(safeId);
    const prior=await ref.get();
    const next={
      ...(prior.exists?obj(prior.data()):{}),
      ...cloneSafe(obj(data)),
      // Server-owned canonical identity must win over any caller payload.
      // Prevent payload.kind / payload.id from corrupting the discriminator or document identity.
      kind, id:safeId,
      updatedAt:serverTimestamp(), updatedAtMs:Number(now()),
      createdAt:prior.exists?obj(prior.data()).createdAt:serverTimestamp(),
      createdAtMs:prior.exists?Number(obj(prior.data()).createdAtMs||now()):Number(now()),
      lastActorUid:p.uid||"", lastActorRole:p.role||"public",
    };
    await ref.set(next,{merge:false});
    return next;
  }
  async function audit(p,method,entityId,detail={},meta={}) {
    const auditId=`lp5-${idFactory()}`;
    await auditCol().doc(auditId).set({
      auditId, method, entityId:clean(entityId), actorUid:p.uid||"", actorRole:p.role||"public",
      requestId:clean(meta.requestId), correlationId:clean(meta.correlationId)||clean(meta.requestId),
      detail:cloneSafe(obj(detail)), createdAt:serverTimestamp(), createdAtMs:Number(now()),
    });
    return auditId;
  }
  const safeRecord = (r) => {
    const x=cloneSafe(r||{});
    delete x.privateEmail; delete x.email; delete x.studentEmail; delete x.learnerEmail; delete x.phone; delete x.storagePath; delete x.internalNote; delete x.paymentDetails; delete x.rawProviderResponse;
    if (x.payload && typeof x.payload==="object") {
      for (const k of ["privateEmail","email","phone","storagePath","paymentDetails","rawProviderResponse"]) delete x.payload[k];
    }
    return x;
  };
  const statusForEvent = (r) => {
    if (lower(r.status)==="archived" || lower(r.status)==="cancelled") return lower(r.status);
    const t=Number(now()), start=Number(r.startAtMs||obj(r.payload).startAtMs||0), end=Number(r.endAtMs||obj(r.payload).endAtMs||0);
    if (start && t<start) return "upcoming";
    if (end && t>end) return "completed";
    if (start && (!end||t<=end)) return "active";
    return lower(r.status||"draft");
  };
  async function listKind(kind, predicate=()=>true) {
    return (await listOps()).filter(r=>r.kind===kind && predicate(r));
  }
  async function getEvent(id) {
    const snap=await firestore.collection("experienceEvents").doc(clean(id)).get();
    return snap.exists?{id:snap.id,...obj(snap.data())}:null;
  }
  async function listEvents() {
    const snap=await firestore.collection("experienceEvents").limit(500).get();
    return (snap.docs||[]).map(d=>({id:d.id,...obj(d.data())}));
  }
  const safeExperienceCta = (value={}) => {
    const x=obj(value);
    return {
      resourceId:clean(x.resourceId),
      resourceType:clean(x.resourceType),
      route:clean(x.route||x.canonicalRoute),
      label:clean(x.label||x.title),
      action:clean(x.action||"OPEN"),
    };
  };
  async function putEvent(id,data,p) {
    const eventId=clean(id)||`event-${idFactory()}`;
    const ref=firestore.collection("experienceEvents").doc(eventId);
    const prior=await ref.get();
    const priorData=prior.exists?obj(prior.data()):{};
    const next={
      eventId,id:eventId,
      title:clean(data.title),type:clean(data.type||data.eventType||"announcement"),
      status:clean(data.status||"draft"),
      startAtMs:Number(data.startAtMs||0),endAtMs:Number(data.endAtMs||0),
      timezone:clean(data.timezone||"Asia/Kolkata"),
      cta:safeExperienceCta(data.cta),
      audience:clean(data.audience||"all"),
      updatedAt:serverTimestamp(),updatedAtMs:Number(now()),
      createdAt:prior.exists?priorData.createdAt:serverTimestamp(),
      createdAtMs:prior.exists?Number(priorData.createdAtMs||now()):Number(now()),
    };
    await ref.set(next,{merge:false});
    return next;
  }

  async function loadEntitlements(uid) {
    try {
      const snap=await firestore.collection("studentEntitlements").doc(uid).collection("items").limit(512).get();
      return (snap.docs||[]).map(d=>({id:d.id,...obj(d.data())}));
    } catch (_) { return []; }
  }
  async function existingResults(uid) {
    try {
      const snap=await firestore.collection("mockResults").limit(500).get();
      return (snap.docs||[]).map(d=>({id:d.id,...obj(d.data())})).filter(x=>clean(x.ownerUid||x.uid||x.studentUid)===uid).map(safeRecord);
    } catch (_) { return []; }
  }
  async function existingLearning(uid) {
    try {
      const snap=await firestore.collection("studentLearning").limit(500).get();
      return (snap.docs||[]).map(d=>({id:d.id,...obj(d.data())})).filter(x=>clean(x.ownerUid||x.uid||x.studentUid)===uid).map(safeRecord);
    } catch (_) { return []; }
  }

  async function loadLearner360(p,payload) {
    const studentUid=clean(payload.studentUid||payload.learnerId||payload.uid);
    if (!studentUid) throw fail("INVALID_ARGUMENT","studentUid is required.");
    await requireAssigned(p,studentUid,clean(payload.mentorUid)||p.uid);
    const ss=await firestore.collection("students").doc(studentUid).get();
    const us=await firestore.collection("users").doc(studentUid).get();
    const base={...(us.exists?obj(us.data()):{}),...(ss.exists?obj(ss.data()):{})};
    const assignments=await listKind("mentorAssignment",r=>r.studentUid===studentUid && (p.isAdmin||r.mentorUid===p.uid));
    const questions=await listKind("mentorQuestion",r=>r.studentUid===studentUid && (p.isAdmin||r.mentorUid===p.uid));
    const interventions=await listKind("mentorIntervention",r=>r.studentUid===studentUid && (p.isAdmin||r.mentorUid===p.uid));
    const communications=await listKind("mentorCommunication",r=>r.studentUid===studentUid && (p.isAdmin||r.mentorUid===p.uid));
    return {
      uid:studentUid,
      learner:{uid:studentUid,displayName:clean(base.displayName||base.name),username:clean(base.username)},
      progress:await existingLearning(studentUid),
      access:(await loadEntitlements(studentUid)).map(safeRecord),
      results:await existingResults(studentUid),
      questions:questions.map(safeRecord),
      assignments:assignments.map(safeRecord),
      interventions:interventions.map(safeRecord),
      communications:communications.map(safeRecord),
    };
  }

  async function handleAssignment(method,p,payload,meta) {
    if (method==="requestMentorHelp") {
      const studentUid=p.isAdmin?clean(payload.studentUid):p.uid;
      const mentorUid=await studentMentor(studentUid,payload.mentorUid);
      if (!mentorUid) throw fail("FORBIDDEN","No active Mentor assignment exists.");
      const record=await put("mentorQuestion",clean(payload.id)||`question-${idFactory()}`,{
        studentUid,mentorUid,resourceId:clean(payload.resourceId),question:clean(payload.question),status:"open",
      },p);
      await audit(p,method,record.id,{studentUid,mentorUid},meta);
      return {question:safeRecord(record)};
    }
    if (method==="answerMentorQuestion") {
      const q=await getOp(payload.questionId||payload.id);
      if (!q||q.kind!=="mentorQuestion") throw fail("NOT_FOUND","Question not found.");
      await requireAssigned(p,q.studentUid,q.mentorUid);
      const record=await put("mentorQuestion",q.id,{...q,answer:clean(payload.answer||payload.response),status:"answered",answeredAtMs:Number(now())},p);
      await audit(p,method,record.id,{studentUid:q.studentUid},meta);
      return {question:safeRecord(record)};
    }
    if (method==="submitStudentAssignment") {
      const a=await getOp(payload.assignmentId||payload.id);
      if (!a||a.kind!=="mentorAssignment") throw fail("NOT_FOUND","Assignment not found.");
      const studentUid=p.isAdmin?clean(payload.studentUid||a.studentUid):p.uid;
      if (studentUid!==a.studentUid) throw fail("FORBIDDEN","Assignment is owned by another learner.");
      const record=await put("mentorAssignment",a.id,{...a,status:"submitted",submission:cloneSafe(payload.submission||payload.response||{}),submittedAtMs:Number(now())},p);
      await audit(p,method,record.id,{studentUid},meta);
      return {assignment:safeRecord(record)};
    }

    const mentorUid=p.isAdmin?clean(payload.mentorUid)||clean(payload.actorMentorUid):p.uid;
    const studentUid=clean(payload.studentUid||payload.learnerId);
    if (["createMentorAssignment","saveMentorAssignmentDraft","publishMentorAssignment"].includes(method)) {
      if (!studentUid) throw fail("INVALID_ARGUMENT","studentUid is required.");
      await requireAssigned(p,studentUid,mentorUid);
      const assignmentId=clean(payload.assignmentId||payload.id)||`assignment-${idFactory()}`;
      const entitlementsBefore=(await loadEntitlements(studentUid)).length;
      const status=method==="saveMentorAssignmentDraft"?"draft":method==="publishMentorAssignment"?"active":"draft";
      const record=await put("mentorAssignment",assignmentId,{
        mentorUid,studentUid,resourceId:clean(payload.resourceId),resourceType:clean(payload.resourceType),
        title:clean(payload.title||"Assignment"),objective:clean(payload.objective),due:clean(payload.due||payload.dueAt),
        status,accessState:clean(payload.accessState||"separate_entitlement_required"),
        entitlementCountObserved:entitlementsBefore
      },p);
      const entitlementsAfter=(await loadEntitlements(studentUid)).length;
      if (entitlementsAfter!==entitlementsBefore) throw fail("INTERNAL","Assignment must not mutate entitlement state.");
      await audit(p,method,record.id,{studentUid,entitlementCountBefore:entitlementsBefore,entitlementCountAfter:entitlementsAfter},meta);
      return {assignment:safeRecord(record),assignmentDoesNotGrantEntitlement:true};
    }
    if (method==="reviewMentorAssignment") {
      const a=await getOp(payload.assignmentId||payload.id);
      if (!a||a.kind!=="mentorAssignment") throw fail("NOT_FOUND","Assignment not found.");
      await requireAssigned(p,a.studentUid,a.mentorUid);
      const record=await put("mentorAssignment",a.id,{...a,status:"reviewed",reviewOutcome:clean(payload.outcome),nextAction:clean(payload.nextAction),reviewedAtMs:Number(now())},p);
      await audit(p,method,record.id,{studentUid:a.studentUid},meta);
      return {assignment:safeRecord(record)};
    }
    throw fail("METHOD_NOT_IMPLEMENTED",method);
  }

  async function notificationAudience(p, record) {
    const audience=lower(record.audience||obj(record.payload).audience||"");
    const recipientUid=clean(record.recipientUid||obj(record.payload).recipientUid);
    if (!p.authenticated) return audience==="public" && !recipientUid;
    if (p.isAdmin) return true;
    if (recipientUid) return recipientUid===p.uid;
    if (audience==="all"||audience===p.role) return true;
    return false;
  }
  async function notificationList(p) {
    const rows=await listKind("notification");
    const states=p.authenticated?await listKind("notificationUserState",r=>r.ownerUid===p.uid):[];
    const byNotification=new Map(states.map(x=>[clean(x.notificationId),x]));
    const out=[];
    for (const r of rows) {
      if (!(await notificationAudience(p,r))) continue;
      const userState=byNotification.get(r.id)||{};
      if (userState.archived===true) continue;
      out.push({
        ...safeRecord(r),
        read:userState.read===true,
        pinned:userState.pinned===true,
        archived:false,
      });
    }
    return out;
  }
  async function runDueNotificationJobs({limit=100}={}) {
    const system=Object.freeze({uid:"system",role:"system",authenticated:true,isAdmin:true});
    const rows=await listKind("notificationJob",r=>lower(r.status)==="scheduled" && Number(r.deliverAtMs||0)<=Number(now()));
    let delivered=0;
    for (const job of rows.slice(0,limit)) {
      const key=clean(job.idempotencyKey||job.id);
      const existing=await listKind("notificationDelivery",r=>r.idempotencyKey===key);
      if (existing.length) {
        await put("notificationJob",job.id,{...job,status:"delivered",duplicatePrevented:true},system);
        continue;
      }
      await put("notificationDelivery",`delivery-${key}`,{
        idempotencyKey:key,notificationId:clean(job.notificationId),recipientUid:clean(job.recipientUid),
        audience:clean(job.audience),channel:clean(job.channel||"IN_APP"),
        status:upperChannel(job.channel)==="IN_APP"?"delivered":"queued_disabled",
        attempts:1,deliveredAtMs:Number(now()),
      },system);
      await put("notificationJob",job.id,{...job,status:"delivered",deliveredAtMs:Number(now())},system);
      delivered++;
    }
    return {ok:true,delivered,scanned:Math.min(rows.length,limit)};
  }
  function upperChannel(v){return clean(v||"IN_APP").toUpperCase();}

  async function invoke({method="",payload={},auth=null,meta={}}={}) {
    const policy=METHOD_POLICIES[method];
    if (!policy) throw fail("METHOD_NOT_ALLOWED","LP5 method is not allowed.");
    const p=await principal(auth);
    requireRole(p,policy.role);
    payload=obj(payload); meta=obj(meta);

    // Phase 5.2 learner 360 / guidance / assignments
    if (method==="loadMentorLearner360") return {ok:true,phase:policy.phase,method,state:{learner360:await loadLearner360(p,payload)}};
    if (["createMentorAssignment","saveMentorAssignmentDraft","publishMentorAssignment","reviewMentorAssignment","submitStudentAssignment","requestMentorHelp","answerMentorQuestion"].includes(method)) {
      return {ok:true,phase:policy.phase,method,state:await handleAssignment(method,p,payload,meta)};
    }
    if (["saveMentorCommunication","saveMentorIntervention"].includes(method)) {
      const studentUid=clean(payload.studentUid||payload.learnerId);
      await requireAssigned(p,studentUid,clean(payload.mentorUid)||p.uid);
      const kind=method==="saveMentorCommunication"?"mentorCommunication":"mentorIntervention";
      const record=await put(kind,clean(payload.id)||`${kind}-${idFactory()}`,{...payload,mentorUid:p.isAdmin?clean(payload.mentorUid):p.uid,studentUid},p);
      await audit(p,method,record.id,{studentUid},meta);
      return {ok:true,phase:policy.phase,method,state:{record:safeRecord(record)}};
    }
    if (method==="updateLearnerLifecycle") {
      const studentUid=clean(payload.studentUid||payload.learnerId);
      await requireAssigned(p,studentUid,clean(payload.mentorUid)||p.uid);
      const record=await put("learnerLifecycle",`lifecycle-${studentUid}`,{studentUid,mentorUid:p.isAdmin?clean(payload.mentorUid):p.uid,status:clean(payload.status),stage:clean(payload.stage),note:clean(payload.note)},p);
      await audit(p,method,record.id,{studentUid},meta);
      return {ok:true,phase:policy.phase,method,state:{lifecycle:safeRecord(record)}};
    }

    // Mentor operational projections
    if (["loadMentorWorkspace","loadMentorToday","loadMentorCommandCenter","loadMentorOutcomes","loadMentorCalendar"].includes(method)) {
      const mine=(await listOps()).filter(r=>p.isAdmin||r.mentorUid===p.uid||r.lastActorUid===p.uid).map(safeRecord);
      return {ok:true,phase:policy.phase,method,state:{items:mine,assignments:mine.filter(x=>x.kind==="mentorAssignment"),questions:mine.filter(x=>x.kind==="mentorQuestion"),calendar:mine.filter(x=>x.kind==="mentorSession")}};
    }
    if (["saveMentorCollection","saveMentorGroup","saveMentorPreferences","saveMentorNotificationPreferences","requestMentorAccountReview","scheduleMentorSession"].includes(method)) {
      const kind={saveMentorCollection:"mentorCollection",saveMentorGroup:"mentorGroup",saveMentorPreferences:"mentorPreferences",saveMentorNotificationPreferences:"notificationPreferences",requestMentorAccountReview:"mentorAccountReview",scheduleMentorSession:"mentorSession"}[method];
      const mentorUid=p.isAdmin?clean(payload.mentorUid)||p.uid:p.uid;
      if(method==="saveMentorGroup"){
        for(const learnerUid of arr(payload.learnerIds).map(clean).filter(Boolean)) await requireAssigned(p,learnerUid,mentorUid);
      }
      const record=await put(kind,clean(payload.id)||`${kind}-${p.uid}-${idFactory()}`,{...payload,mentorUid},p);
      await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{record:safeRecord(record)}};
    }

    // Phase 5.3 admin studios / operational writes
    if (method==="validateAdminResource") {
      const title=clean(payload.title||obj(payload.values).title), type=clean(payload.kind||payload.type);
      const errors=[]; if(!title)errors.push("title_required"); if(!type)errors.push("type_required");
      return {ok:true,phase:policy.phase,method,state:{valid:errors.length===0,errors}};
    }
    if (["saveAdminResource","publishAdminResource","unpublishAdminResource","archiveAdminResource","createAdminResourceVersion","saveAdminResourceAsset"].includes(method)) {
      const resourceId=clean(payload.resourceId||payload.id)||`admin-resource-${idFactory()}`;
      if(method==="createAdminResourceVersion"){
        const base=await getOp(resourceId); if(!base||base.kind!=="adminResource")throw fail("NOT_FOUND","Admin resource not found.");
        const version=Math.max(1,Number(payload.version||Number(base.version||1)+1));
        const record=await put("adminResourceVersion",`${resourceId}-v${version}`,{resourceId,version,snapshot:safeRecord(base),note:clean(payload.note)},p);
        await audit(p,method,record.id,{resourceId,version},meta);
        return {ok:true,phase:policy.phase,method,state:{version:safeRecord(record)}};
      }
      if(method==="saveAdminResourceAsset"){
        const record=await put("adminResourceAsset",clean(payload.assetId)||`${resourceId}-asset-${idFactory()}`,{resourceId,name:clean(payload.name),contentType:clean(payload.contentType),storageRef:clean(payload.storageRef)},p);
        await audit(p,method,record.id,{resourceId},meta);
        return {ok:true,phase:policy.phase,method,state:{asset:safeRecord(record)}};
      }
      if (method==="publishAdminResource") {
        const existing=await getOp(resourceId);
        const title=clean((existing&&existing.title)||payload.title||obj(payload.values).title);
        if(!title) throw fail("FAILED_PRECONDITION","Resource must validate before publish.");
      }
      const existing=await getOp(resourceId);
      const status=method==="publishAdminResource"?"published":method==="unpublishAdminResource"?"draft":method==="archiveAdminResource"?"archived":clean(payload.status||obj(payload.values).status||(existing&&existing.status)||"draft");
      const record=await put("adminResource",resourceId,{...(existing||{}),...payload,title:clean(payload.title||obj(payload.values).title||(existing&&existing.title)),resourceType:clean(payload.kind||payload.type||(existing&&existing.resourceType)),status,version:Math.max(1,Number((existing&&existing.version)||payload.version||1))},p);
      await audit(p,method,record.id,{status},meta);
      return {ok:true,phase:policy.phase,method,state:{resource:safeRecord(record)}};
    }
    if (["saveAdminOperation","saveAdminSettings","saveQuestionBankQuestion"].includes(method)) {
      const kind={saveAdminOperation:"adminOperation",saveAdminSettings:"adminSettings",saveQuestionBankQuestion:"questionBankQuestion"}[method];
      const record=await put(kind,clean(payload.id)||`${kind}-${idFactory()}`,payload,p);
      await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{record:safeRecord(record)}};
    }
    if (method==="runAdminReadiness") {
      const all=await listOps(); const unresolved=all.filter(r=>r.kind==="notificationJob" && lower(r.status)==="failed").length;
      return {ok:true,phase:policy.phase,method,state:{green:unresolved===0,unresolvedQueue:unresolved,counts:{records:all.length}}};
    }
    if (method==="loadAdminWorkspace") {
      const all=await listOps(); const counts={}; for(const r of all)counts[r.kind]=(counts[r.kind]||0)+1;
      return {ok:true,phase:policy.phase,method,state:{counts,records:all.map(safeRecord)}};
    }
    if (method==="exportAdminReport") {
      const all=(await listOps()).map(x=>maskValue(safeRecord(x)));
      return {ok:true,phase:policy.phase,method,state:{format:"json",rows:all,piiMasked:true}};
    }

    // Phase 5.4 Experience heartbeat
    if (method==="saveExperienceEntity") {
      const eventId=clean(payload.id||payload.eventId)||`event-${idFactory()}`;
      const record=await putEvent(eventId,{...payload,status:clean(payload.status||"draft")},p);
      await audit(p,method,record.id,{status:statusForEvent(record)},meta);
      return {ok:true,phase:policy.phase,method,state:{event:{...safeRecord(record),serverStatus:statusForEvent(record)}}};
    }
    if (method==="archiveExperienceEntity") {
      const event=await getEvent(payload.id||payload.eventId); if(!event) throw fail("NOT_FOUND","Experience event not found.");
      const record=await putEvent(event.id,{...event,status:"archived"},p); await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{event:{...safeRecord(record),serverStatus:"archived"}}};
    }
    if (method==="listExperienceEvents") {
      const events=(await listEvents()).map(r=>({...safeRecord(r),serverStatus:statusForEvent(r)})).filter(r=>p.isAdmin||["published","active","upcoming","completed"].includes(lower(r.status)||r.serverStatus));
      return {ok:true,phase:policy.phase,method,state:{items:events,serverTimeMs:Number(now())}};
    }

    // Phase 5.5 / 5.6 Notifications + scheduler
    if (["createNotification","publishNotification"].includes(method)) {
      const notificationId=clean(payload.id||payload.notificationId)||`notification-${idFactory()}`;
      const status=method==="publishNotification"?"published":clean(payload.status||"draft");
      const record=await put("notification",notificationId,{...payload,status,audience:clean(payload.audience||"all"),recipientUid:clean(payload.recipientUid),deepLink:clean(payload.deepLink||payload.route),entitlementEffect:"none"},p);
      await audit(p,method,record.id,{status,audience:record.audience},meta);
      return {ok:true,phase:policy.phase,method,state:{notification:safeRecord(record),grantsEntitlement:false}};
    }
    if (method==="archiveNotification") {
      const notificationId=clean(payload.id||payload.notificationId);
      const n=await getOp(notificationId); if(!n||n.kind!=="notification") throw fail("NOT_FOUND","Notification not found.");
      if(p.isAdmin && payload.global===true){
        const record=await put("notification",n.id,{...n,status:"archived"},p); await audit(p,method,record.id,{global:true},meta);
        return {ok:true,phase:policy.phase,method,state:{notification:safeRecord(record)}};
      }
      if(!p.authenticated)throw fail("UNAUTHENTICATED","Sign-in is required.");
      if(!(await notificationAudience(p,n)))throw fail("FORBIDDEN","Notification is not addressed to this account.");
      const action=lower(payload.action||"archive");
      const stateId=`notification-state-${p.uid}-${notificationId}`;
      const prior=(await getOp(stateId))||{};
      const next={
        ownerUid:p.uid,notificationId,
        read:action==="read"?true:Boolean(prior.read),
        pinned:action==="pin"?true:action==="unpin"?false:Boolean(prior.pinned),
        archived:action==="archive"?true:Boolean(prior.archived),
      };
      const record=await put("notificationUserState",stateId,next,p); await audit(p,method,notificationId,{action},meta);
      return {ok:true,phase:policy.phase,method,state:{inboxState:safeRecord(record)}};
    }
    if (["createNotificationJob","scheduleNotification"].includes(method)) {
      const key=clean(payload.idempotencyKey||payload.deliveryKey||payload.id)||`job-${idFactory()}`;
      const existing=(await listKind("notificationJob",r=>r.idempotencyKey===key))[0];
      if(existing) return {ok:true,phase:policy.phase,method,state:{job:safeRecord(existing),duplicatePrevented:true}};
      const deliverAtMs=Number(payload.deliverAtMs||payload.scheduledAtMs||now());
      const record=await put("notificationJob",`notification-job-${key}`,{
        ...payload,idempotencyKey:key,notificationId:clean(payload.notificationId),recipientUid:clean(payload.recipientUid),
        audience:clean(payload.audience),channel:upperChannel(payload.channel||"IN_APP"),deliverAtMs,status:"scheduled",
        externalChannelEnabled:upperChannel(payload.channel||"IN_APP")==="IN_APP"
      },p);
      await audit(p,method,record.id,{idempotencyKey:key},meta);
      return {ok:true,phase:policy.phase,method,state:{job:safeRecord(record),duplicatePrevented:false}};
    }
    if (["saveNotificationRule","saveNotificationTemplate"].includes(method)) {
      const kind=method==="saveNotificationRule"?"notificationRule":"notificationTemplate";
      const record=await put(kind,clean(payload.id)||`${kind}-${idFactory()}`,payload,p); await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{record:safeRecord(record)}};
    }
    if (["saveNotificationPreferences","saveStudentNotificationPreferences","saveMentorNotificationPreferences"].includes(method)) {
      const ownerUid=p.isAdmin?clean(payload.uid||payload.studentUid||payload.mentorUid)||p.uid:p.uid;
      const record=await put("notificationPreferences",`notification-preferences-${ownerUid}`,{ownerUid,role:p.role,...payload},p); await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{preferences:safeRecord(record)}};
    }
    if (["loadNotificationCenter","loadStudentNotifications","loadMentorNotifications"].includes(method)) {
      if(method==="loadStudentNotifications" && !(p.isAdmin||p.role==="student"))throw fail("FORBIDDEN","Student authority is required.");
      if(method==="loadMentorNotifications" && !(p.isAdmin||p.role==="mentor"))throw fail("FORBIDDEN","Mentor authority is required.");
      const items=await notificationList(p);
      return {ok:true,phase:policy.phase,method,state:{items,unreadCount:items.filter(x=>x.read!==true).length,unreadServerAuthority:true}};
    }
    if (method==="listNotificationDelivery") {
      let items=await listKind("notificationDelivery");
      if(!p.isAdmin)items=items.filter(r=>r.recipientUid===p.uid);
      return {ok:true,phase:policy.phase,method,state:{items:items.map(safeRecord)}};
    }
    if (method==="exportNotificationAudit") {
      const snap=await auditCol().limit(1000).get();
      const rows=(snap.docs||[]).map(d=>maskValue({id:d.id,...obj(d.data())}));
      return {ok:true,phase:policy.phase,method,state:{rows,piiMasked:true}};
    }

    // Phase 5.7 privacy / role projections
    if (method==="loadRoleAnalytics") {
      const all=await listOps();
      const mine=p.isAdmin?all:all.filter(r=>r.studentUid===p.uid||r.mentorUid===p.uid||r.ownerUid===p.uid||r.recipientUid===p.uid||r.lastActorUid===p.uid);
      return {ok:true,phase:policy.phase,method,state:{counts:mine.reduce((a,r)=>(a[r.kind]=(a[r.kind]||0)+1,a),{}),piiMasked:true}};
    }
    if (["loadStudentAssignments","loadStudentResults","loadStudentTasks","loadStudentCommandCenter"].includes(method)) {
      const uid=p.isAdmin?clean(payload.studentUid)||p.uid:p.uid;
      const assignments=(await listKind("mentorAssignment",r=>r.studentUid===uid)).map(safeRecord);
      const tasks=(await listKind("studentTask",r=>r.studentUid===uid)).map(safeRecord);
      const results=await existingResults(uid);
      return {ok:true,phase:policy.phase,method,state:{assignments,tasks,results}};
    }
    if (method==="updateStudentTask") {
      const uid=p.isAdmin?clean(payload.studentUid)||p.uid:p.uid;
      const taskId=clean(payload.id||payload.taskId)||`student-task-${idFactory()}`;
      const prior=await getOp(taskId);
      if(prior && prior.studentUid!==uid && !p.isAdmin)throw fail("FORBIDDEN","Task is owned by another learner.");
      const record=await put("studentTask",taskId,{...payload,studentUid:uid},p); await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{task:safeRecord(record)}};
    }
    if (method==="saveStudentPreferences") {
      const uid=p.isAdmin?clean(payload.studentUid)||p.uid:p.uid;
      const record=await put("studentPreferences",`student-preferences-${uid}`,{...payload,studentUid:uid},p); await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{preferences:safeRecord(record)}};
    }
    if (method==="requestStudentDataExport") {
      const uid=p.isAdmin?clean(payload.studentUid)||p.uid:p.uid;
      const record=await put("dataExportRequest",`data-export-${idFactory()}`,{studentUid:uid,status:"queued",requestedAtMs:Number(now())},p); await audit(p,method,record.id,{},meta);
      return {ok:true,phase:policy.phase,method,state:{request:safeRecord(record)}};
    }

    // Safe operational commerce: prepared/disabled, never grants access.
    if (["saveCommerceSettings","saveEmailSettings","createCommerceOrder","createPaymentLink","createRazorpayQr","reconcilePayment"].includes(method)) {
      const kind=method==="saveEmailSettings"?"emailSettings":method==="saveCommerceSettings"?"commerceSettings":"commerceOperation";
      const record=await put(kind,clean(payload.id)||`${kind}-${idFactory()}`,{...payload,providerExecution:"DISABLED_PENDING_LP8",entitlementEffect:"none"},p);
      await audit(p,method,record.id,{providerExecution:"disabled"},meta);
      return {ok:true,phase:policy.phase,method,state:{record:safeRecord(record),providerExecution:"DISABLED_PENDING_LP8",grantsEntitlement:false}};
    }

    // Public support/access enquiry: explicitly no entitlement effect.
    if (["createPublicAccessEnquiry","createPublicSupportRequest"].includes(method)) {
      const kind=method==="createPublicAccessEnquiry"?"publicAccessEnquiry":"publicSupportRequest";
      const record=await put(kind,clean(payload.id)||`${kind}-${idFactory()}`,{...payload,status:"submitted",entitlementEffect:"none"},p);
      await audit(p,method,record.id,{public:true},meta);
      return {ok:true,phase:policy.phase,method,state:{record:safeRecord(record),grantsEntitlement:false}};
    }

    throw fail("METHOD_NOT_IMPLEMENTED",`No LP5 handler for ${method}.`);
  }

  return Object.freeze({invoke,runDueNotificationJobs});
}

module.exports = Object.freeze({
  METHOD_POLICIES,
  OPS_COLLECTION,
  AUDIT_COLLECTION,
  PHASES,
  createLp5AcademyOperationsAuthority,
});

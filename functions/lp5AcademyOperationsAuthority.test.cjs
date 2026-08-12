"use strict";
const assert=require("node:assert/strict");
const {
  METHOD_POLICIES,OPS_COLLECTION,createLp5AcademyOperationsAuthority
}=require("./lp5AcademyOperationsAuthority");

class Snap {
  constructor(id,data){this.id=id;this._data=data;this.exists=data!==undefined&&data!==null;}
  data(){return this._data;}
}
function createMemoryFirestore(seed={}) {
  const stores=new Map();
  const key=(parts)=>parts.join("/");
  for(const [path,data] of Object.entries(seed))stores.set(path,JSON.parse(JSON.stringify(data)));
  function collection(parts){
    return {
      doc(id){return doc([...parts,id]);},
      limit(){return this;},
      async get(){
        const prefix=key(parts)+"/";
        const depth=parts.length+1;
        const docs=[];
        for(const [k,v] of stores){
          const seg=k.split("/");
          if(k.startsWith(prefix)&&seg.length===depth)docs.push(new Snap(seg[seg.length-1],JSON.parse(JSON.stringify(v))));
        }
        return {docs};
      }
    };
  }
  function doc(parts){
    return {
      collection(name){return collection([...parts,name]);},
      async get(){const k=key(parts);return new Snap(parts[parts.length-1],stores.has(k)?JSON.parse(JSON.stringify(stores.get(k))):undefined);},
      async set(data,opts={}){
        const k=key(parts);
        const next=opts.merge&&stores.has(k)?{...stores.get(k),...data}:data;
        stores.set(k,JSON.parse(JSON.stringify(next,(a,v)=>v instanceof Date?v.toISOString():v)));
      }
    };
  }
  return {collection:(name)=>collection([name]),__stores:stores};
}
const auth=(uid,role,email=`${uid}@example.test`)=>({uid,token:{email}});
(async()=>{
  assert.equal(Object.keys(METHOD_POLICIES).length,68);
  assert.equal(new Set(Object.values(METHOD_POLICIES).map(x=>x.owner)).size,1);
  assert.equal(METHOD_POLICIES.loadMentorLearner360.phase,"5.2");
  assert.equal(METHOD_POLICIES.saveAdminResource.phase,"5.3");
  assert.equal(METHOD_POLICIES.listExperienceEvents.phase,"5.4");
  assert.equal(METHOD_POLICIES.createNotification.phase,"5.5");
  assert.equal(METHOD_POLICIES.createPaymentLink.phase,"5.7");

  const fs=createMemoryFirestore({
    "roleAuthorities/mentor-1":{uid:"mentor-1",role:"mentor",activeRole:"mentor",accountStatus:"active"},
    "roleAuthorities/student-1":{uid:"student-1",role:"student",activeRole:"student",accountStatus:"active"},
    "roleAuthorities/student-2":{uid:"student-2",role:"student",activeRole:"student",accountStatus:"active"},
    "mentorProfiles/mentor-1":{mentorUid:"mentor-1",role:"mentor",status:"active"},
    "mentorProfiles/mentor-1/students/student-1":{mentorUid:"mentor-1",studentUid:"student-1",status:"active"},
    "students/student-1":{displayName:"Assigned Aspirant",email:"private@example.test"},
    "studentEntitlements/student-1/items/grant-1":{uid:"student-1",status:"active",scopeType:"plan",planCode:"PREMIUM"},
  });
  let tick=1700000000000,seq=0;
  const svc=createLp5AcademyOperationsAuthority({
    firestore:fs,serverTimestamp:()=>new Date(tick),now:()=>tick,idFactory:()=>`id-${++seq}`
  });

  const mentorAuth=auth("mentor-1","mentor");
  const studentAuth=auth("student-1","student");
  const student2Auth=auth("student-2","student");
  const adminAuth={uid:"admin-1",token:{email:"aspirenestplatform@gmail.com"}};

  const before=[...fs.__stores.keys()].filter(k=>k.startsWith("studentEntitlements/student-1/items/")).length;
  const a=await svc.invoke({method:"createMentorAssignment",auth:mentorAuth,payload:{studentUid:"student-1",resourceId:"note-1",title:"Read Note"}});
  assert.equal(a.ok,true);
  assert.equal(a.state.assignmentDoesNotGrantEntitlement,true);
  const after=[...fs.__stores.keys()].filter(k=>k.startsWith("studentEntitlements/student-1/items/")).length;
  assert.equal(after,before);

  await assert.rejects(
    ()=>svc.invoke({method:"createMentorAssignment",auth:mentorAuth,payload:{studentUid:"student-2",resourceId:"note-1",title:"No"}}),
    e=>e.lp5Code==="FORBIDDEN"
  );

  const l360=await svc.invoke({method:"loadMentorLearner360",auth:mentorAuth,payload:{studentUid:"student-1"}});
  assert.equal(l360.state.learner360.learner.displayName,"Assigned Aspirant");
  assert.equal(Object.prototype.hasOwnProperty.call(l360.state.learner360.learner,"email"),false);

  const req=await svc.invoke({method:"requestMentorHelp",auth:studentAuth,payload:{mentorUid:"mentor-1",resourceId:"note-1",question:"Help?"}});
  assert.equal(req.state.question.status,"open");
  await assert.rejects(()=>svc.invoke({method:"requestMentorHelp",auth:student2Auth,payload:{mentorUid:"mentor-1",question:"No"}}),e=>e.lp5Code==="FORBIDDEN");

  const resource=await svc.invoke({method:"saveAdminResource",auth:adminAuth,payload:{id:"res-1",kind:"note",title:"Resource"}});
  assert.equal(resource.ok,true);
  const publish=await svc.invoke({method:"publishAdminResource",auth:adminAuth,payload:{resourceId:"res-1"}});
  assert.equal(publish.state.resource.status,"published");
  assert.equal(publish.state.resource.kind,"adminResource");
  assert.equal(publish.state.resource.id,"res-1");
  assert.equal(publish.state.resource.resourceType,"note");
  const versioned=await svc.invoke({method:"createAdminResourceVersion",auth:adminAuth,payload:{resourceId:"res-1",version:2,note:"Regression: canonical discriminator must survive caller kind"}});
  assert.equal(versioned.state.version.kind,"adminResourceVersion");
  assert.equal(versioned.state.version.resourceId,"res-1");
  assert.equal(versioned.state.version.version,2);
  await assert.rejects(()=>svc.invoke({method:"saveAdminResource",auth:studentAuth,payload:{id:"evil",title:"No"}}),e=>e.lp5Code==="FORBIDDEN");

  const ev=await svc.invoke({method:"saveExperienceEntity",auth:adminAuth,payload:{id:"event-1",status:"published",startAtMs:tick-10,endAtMs:tick+1000,cta:{resourceId:"note-1"}}});
  assert.equal(ev.state.event.serverStatus,"active");
  const evs=await svc.invoke({method:"listExperienceEvents",auth:null,payload:{}});
  assert.equal(evs.state.items.length,1);

  const n=await svc.invoke({method:"createNotification",auth:adminAuth,payload:{id:"n-1",audience:"student",recipientUid:"student-1",title:"Assigned",email:"private@example.test"}});
  assert.equal(n.state.grantsEntitlement,false);
  await svc.invoke({method:"publishNotification",auth:adminAuth,payload:{id:"n-1",audience:"student",recipientUid:"student-1",title:"Assigned"}});
  const inbox=await svc.invoke({method:"loadStudentNotifications",auth:studentAuth,payload:{}});
  assert.equal(inbox.state.items.length,1);
  const otherInbox=await svc.invoke({method:"loadStudentNotifications",auth:student2Auth,payload:{}});
  assert.equal(otherInbox.state.items.length,0);
  assert.equal(inbox.state.unreadCount,1);
  await svc.invoke({method:"archiveNotification",auth:studentAuth,payload:{notificationId:"n-1",action:"read"}});
  const readInbox=await svc.invoke({method:"loadStudentNotifications",auth:studentAuth,payload:{}});
  assert.equal(readInbox.state.unreadCount,0);
  await svc.invoke({method:"archiveNotification",auth:studentAuth,payload:{notificationId:"n-1",action:"pin"}});
  const pinnedInbox=await svc.invoke({method:"loadStudentNotifications",auth:studentAuth,payload:{}});
  assert.equal(pinnedInbox.state.items[0].pinned,true);

  const job1=await svc.invoke({method:"scheduleNotification",auth:adminAuth,payload:{notificationId:"n-1",recipientUid:"student-1",idempotencyKey:"same",deliverAtMs:tick,channel:"EMAIL"}});
  const job2=await svc.invoke({method:"scheduleNotification",auth:adminAuth,payload:{notificationId:"n-1",recipientUid:"student-1",idempotencyKey:"same",deliverAtMs:tick,channel:"EMAIL"}});
  assert.equal(job1.state.duplicatePrevented,false);
  assert.equal(job2.state.duplicatePrevented,true);
  const due=await svc.runDueNotificationJobs();
  assert.equal(due.delivered,1);
  const delivery=await svc.invoke({method:"listNotificationDelivery",auth:studentAuth,payload:{}});
  assert.equal(delivery.state.items[0].status,"queued_disabled");

  const commerce=await svc.invoke({method:"createPaymentLink",auth:adminAuth,payload:{id:"pay-1",amount:500}});
  assert.equal(commerce.state.providerExecution,"DISABLED_PENDING_LP8");
  assert.equal(commerce.state.grantsEntitlement,false);

  const pub=await svc.invoke({method:"createPublicSupportRequest",auth:null,payload:{id:"support-1",email:"person@example.test",message:"Help"}});
  assert.equal(pub.state.grantsEntitlement,false);

  const report=await svc.invoke({method:"exportAdminReport",auth:adminAuth,payload:{}});
  assert.equal(report.state.piiMasked,true);

  const auditRows=[...fs.__stores.keys()].filter(k=>k.startsWith("lp5AuditLogs/"));
  assert.ok(auditRows.length>=8);
  const opsRows=[...fs.__stores.keys()].filter(k=>k.startsWith(`${OPS_COLLECTION}/`));
  assert.ok(opsRows.length>=8);

  console.log("LP5_ACADEMY_OPERATIONS_AUTHORITY_TEST=PASS");
  console.log("METHODS=68");
  console.log("ASSIGNMENT_NOT_ENTITLEMENT=PASS");
  console.log("PRIVACY_ROLE_GATES=PASS");
  console.log("SCHEDULER_IDEMPOTENCY=PASS");
  console.log("COMMERCE_PROVIDER_DISABLED=PASS");
})();

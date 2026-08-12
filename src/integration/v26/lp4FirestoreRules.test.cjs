#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const {doc,getDoc,setDoc}=require("firebase/firestore");
(async()=>{
 const projectId=process.env.GCLOUD_PROJECT||"demo-aspirenest-lp4";
 const rules=fs.readFileSync(path.resolve(__dirname,"../../../firestore.rules"),"utf8");
 const env=await initializeTestEnvironment({projectId,firestore:{rules}});
 try{
  await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();
   await setDoc(doc(db,"studentLearning","u1_note1"),{ownerUid:"u1",resourceId:"note1",progress:40,saved:true});
   await setDoc(doc(db,"studentLearningActions","a1"),{ownerUid:"u1",resourceId:"note1"});
   await setDoc(doc(db,"mockAttempts","attempt1"),{ownerUid:"u1",testId:"test1",status:"active"});
   await setDoc(doc(db,"mockResults","attempt1"),{ownerUid:"u1",testId:"test1",result:{score:1}});
   await setDoc(doc(db,"studyRoadmapProgress","u1_r1"),{ownerUid:"u1",resourceId:"r1"});
   await setDoc(doc(db,"liveAttendance","u1_live1"),{ownerUid:"u1",sessionId:"live1"});
   await setDoc(doc(db,"lp4AuditLogs","audit1"),{actorUid:"u1"});
   await setDoc(doc(db,"lp4Idempotency","idem1"),{ownerUid:"u1"});
   await setDoc(doc(db,"lp4ResourceRecords","note1"),{resourceId:"note1",pages:[{secret:true}]});
   await setDoc(doc(db,"currentAffairs","ca1"),{resourceId:"ca1",resourceType:"current-affairs",status:"Published"});
   await setDoc(doc(db,"mentorLiveSessions","live1"),{resourceId:"live1",resourceType:"live",title:"Safe Live",status:"Published"});
   await setDoc(doc(db,"mentorLiveSessions","liveLeak"),{resourceId:"liveLeak",resourceType:"live",status:"Published",joinUrl:"https://secret.invalid"});
   await setDoc(doc(db,"studyRoadmaps","r1"),{resourceId:"r1",resourceType:"roadmap",title:"Safe Roadmap",status:"Published"});
   await setDoc(doc(db,"studyRoadmaps","roadLeak"),{resourceId:"roadLeak",resourceType:"roadmap",status:"Published",pages:[{secret:true}]});
   await setDoc(doc(db,"contentItems","safe1"),{resourceId:"safe1",resourceType:"note",section:"notes",title:"Safe",status:"Published",requiredPlan:"FREE"});
   await setDoc(doc(db,"contentItems","leak1"),{resourceId:"leak1",resourceType:"test",title:"Leak",status:"Published",inlineQuestions:[{answer:1}]});
   await setDoc(doc(db,"currentAffairsCorrections","c1"),{resourceId:"ca1",appendOnly:true});
  });
  const own=env.authenticatedContext("u1",{email:"u1@example.com",role:"student"}).firestore();
  const other=env.authenticatedContext("u2",{email:"u2@example.com",role:"student"}).firestore();
  const admin=env.authenticatedContext("admin1",{email:"aspirenestplatform@gmail.com",role:"admin"}).firestore();
  const anon=env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(own,"studentLearning","u1_note1")));
  await assertFails(getDoc(doc(other,"studentLearning","u1_note1")));
  await assertFails(setDoc(doc(own,"studentLearning","u1_note2"),{ownerUid:"u1",resourceId:"note2"}));
  await assertSucceeds(getDoc(doc(own,"mockAttempts","attempt1")));
  await assertFails(getDoc(doc(other,"mockAttempts","attempt1")));
  await assertSucceeds(getDoc(doc(own,"mockResults","attempt1")));
  await assertFails(getDoc(doc(other,"mockResults","attempt1")));
  await assertFails(setDoc(doc(own,"mockResults","forged"),{ownerUid:"u1",result:{score:999}}));
  await assertSucceeds(getDoc(doc(own,"studyRoadmapProgress","u1_r1")));
  await assertSucceeds(getDoc(doc(own,"liveAttendance","u1_live1")));
  await assertFails(getDoc(doc(own,"lp4Idempotency","idem1")));
  await assertFails(getDoc(doc(own,"lp4ResourceRecords","note1")));
  await assertFails(getDoc(doc(own,"currentAffairs","ca1")));
  await assertSucceeds(getDoc(doc(own,"mentorLiveSessions","live1")));
  await assertFails(getDoc(doc(own,"mentorLiveSessions","liveLeak")));
  await assertSucceeds(getDoc(doc(own,"studyRoadmaps","r1")));
  await assertFails(getDoc(doc(own,"studyRoadmaps","roadLeak")));
  // LP3 canonical resolver probes all source collections by exact id, so missing
  // source docs must be readable as NOT_FOUND rather than permission-denied.
  await assertSucceeds(getDoc(doc(own,"mentorLiveSessions","missing-live")));
  await assertSucceeds(getDoc(doc(own,"studyRoadmaps","missing-road")));
  await assertSucceeds(getDoc(doc(anon,"contentItems","safe1")));
  await assertFails(getDoc(doc(anon,"contentItems","leak1")));
  await assertSucceeds(getDoc(doc(admin,"lp4AuditLogs","audit1")));
  await assertFails(getDoc(doc(own,"lp4AuditLogs","audit1")));
  await assertFails(getDoc(doc(own,"currentAffairsCorrections","c1")));
  await assertFails(setDoc(doc(own,"currentAffairsCorrections","c2"),{resourceId:"ca1"}));
  console.log("LP4_FIRESTORE_RULES=PASS");
 }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exit(1);});

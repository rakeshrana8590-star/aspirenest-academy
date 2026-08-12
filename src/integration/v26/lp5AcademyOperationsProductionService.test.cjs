"use strict";
const assert=require("node:assert/strict");
const {METHOD_POLICIES,createLp5AcademyOperationsProductionService}=require("./lp5AcademyOperationsProductionService");
(async()=>{
  assert.equal(Object.keys(METHOD_POLICIES).length,68);
  const calls=[];
  const svc=createLp5AcademyOperationsProductionService({async invokeAcademyOperation(x){calls.push(x);return {ok:true,method:x.method,state:{}};}});
  const r=await svc.invoke("loadMentorLearner360",{studentUid:"s1"},{requestId:"r1",correlationId:"c1"});
  assert.equal(r.ok,true); assert.equal(calls[0].meta.requestId,"r1"); assert.equal(calls[0].meta.clientPhase,"5.2");
  const p=await svc.invoke("createNotification",{title:"x"});
  assert.equal(p.ok,true); assert.equal(calls[1].meta.owner,"lp5AcademyOperationsService");
  const bad=await svc.invoke("notAllowed",{});
  assert.equal(bad.ok,false); assert.equal(bad.code,"LP5_METHOD_NOT_ALLOWED");
  console.log("LP5_ACADEMY_OPERATIONS_BROWSER_SERVICE_TEST=PASS");
  console.log("METHODS=68");
})();

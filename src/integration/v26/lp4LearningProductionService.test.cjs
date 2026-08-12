#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {METHOD_POLICIES,resourceIdFrom,preAuthorizeAction,createLp4LearningProductionService}=require("./lp4LearningProductionService.js");
assert.equal(Object.keys(METHOD_POLICIES).length,68);
assert.equal(resourceIdFrom({test:{config:{testId:"t1"}}}),"t1");
assert.equal(preAuthorizeAction("resolveProtectedVideo",{}),"WATCH");
assert.equal(preAuthorizeAction("loadProtectedVideo",{resourceId:"v1",resourceType:"video"}),"WATCH");
assert.equal(preAuthorizeAction("loadCurrentAffairsReader",{resourceId:"ca1",resourceType:"current-affairs"}),"READ");
assert.equal(preAuthorizeAction("loadStudentRevisionHub",{resourceId:"n1",resourceType:"note"}),"READ");
assert.equal(preAuthorizeAction("saveNote",{}),"");
(async()=>{
 let authorized=0, invoked=0;
 const svc=createLp4LearningProductionService({authorize:async()=>{authorized++;return {allowed:true};},invokeLearningOperation:async(req)=>{invoked++;return {ok:true,req};}});
 const out=await svc.invoke("loadMockTest",{resourceId:"test-1"},{requestId:"r1",correlationId:"c1"});
 assert.equal(out.ok,true);assert.equal(authorized,1);assert.equal(invoked,1);assert.equal(out.req.meta.correlationId,"c1");
 const denied=createLp4LearningProductionService({authorize:async()=>({allowed:false,code:"DENY"}),invokeLearningOperation:async()=>{throw new Error("must not invoke");}});
 const no=await denied.invoke("resolveLiveJoin",{sessionId:"live-1"});assert.equal(no.ok,false);assert.equal(no.code,"DENY");
 console.log("LP4_LEARNING_PRODUCTION_SERVICE=PASS");
 console.log("LP4_RUNTIME_METHODS=68");
})().catch(e=>{console.error(e);process.exit(1);});

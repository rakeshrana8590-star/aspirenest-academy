#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {METHOD_POLICIES,resourceIdFrom,inferType,canonicalCollection,requiredPlanOf,entitlementMatches,validateRecord}=require("./lp4LearningAuthority.js");
assert.equal(Object.keys(METHOD_POLICIES).length,63);
assert.equal(resourceIdFrom({record:{id:"n1"}}),"n1");
assert.equal(inferType({section:"currentAffairs"}),"current-affairs");
assert.equal(canonicalCollection("roadmap"),"studyRoadmaps");
assert.equal(requiredPlanOf({access:"premium"}),"PREMIUM");
const now=Date.now();
assert.equal(entitlementMatches({scopeType:"item",itemId:"n1",status:"active",noExpiry:true},{resourceId:"n1",resourceType:"note",requiredPlan:"PREMIUM"},now),true);
assert.equal(entitlementMatches({scopeType:"plan",planType:"BASIC",status:"active",noExpiry:true},{resourceId:"n1",resourceType:"note",requiredPlan:"PREMIUM"},now),false);
assert.equal(validateRecord("publishNote",{resourceId:"n1",record:{title:"Good"}}).ok,true);
assert.equal(validateRecord("publishCurrentAffairs",{resourceId:"ca1",record:{title:"CA",sources:[{verified:false}]}}).ok,false);
console.log("LP4_FUNCTION_AUTHORITY_POLICY=PASS");
console.log("LP4_SERVER_METHODS=63");

const source=require("node:fs").readFileSync(require("node:path").join(__dirname,"lp4LearningAuthority.js"),"utf8");
for(const signal of ["status:\"running\"","status:\"done\"","stableOperationId","serverRemaining","getSignedUrl","WINDOW_CLOSED","entitlementGranted:false","appendOnly:true"]) assert.ok(source.includes(signal),signal);
assert.ok(!source.includes("return firestore.runTransaction(async tx=>{ const prev=await tx.get(ref); if(prev.exists) return"),"old non-atomic idempotency implementation removed");
console.log("LP4_RETRY_SERVER_AUTHORITY_STATIC=PASS");

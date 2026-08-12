#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const repoRoot=path.resolve(__dirname,"../../../..");
const entry=fs.readFileSync(path.join(__dirname,"productionProviderEntry.js"),"utf8");
const raw=JSON.parse(fs.readFileSync(path.join(repoRoot,"src/integration/v26/productionBridgeMethodRegistry.json"),"utf8"));
const rows=Array.isArray(raw)?raw:(raw.methods||[]);
assert.equal(rows.length,182);
const active=rows.filter(r=>r.runtimeActivation===true&&r.owner);
assert.equal(active.length,114);
for(const f of ["../lp4LearningProductionService.js","createLp4LearningProductionService","lp4LearningOperation","lp4LearningProductionService.invoke","lp4LearningMethodPolicies","../lp5MentorProfileProductionService.js","createLp5MentorProfileProductionService","lp5MentorProfileOperation","lp5MentorProfileProductionService.invoke","lp5MentorProfileMethodPolicies","registryRows","window.__aspirenestExactResourceAdapter = provider;"]) assert.ok(entry.includes(f),f);
for(const forbidden of ["setDoc","addDoc","updateDoc","deleteDoc","writeBatch","runTransaction"]) assert.ok(!entry.includes(forbidden),forbidden);
assert.equal((entry.match(/window\.__aspirenestExactResourceAdapter\s*=(?!=)/g)||[]).length,1);
const lp4=rows.filter(r=>String(r.ownerDecisionEvidence||"").startsWith("LP4-P4.1-4.7-S400"));
assert.equal(lp4.length,70);
for(const r of lp4){{assert.equal(r.ownerState,"RUNTIME_OWNER_ASSIGNED");assert.equal(r.runtimeActivation,true);assert.equal(r.auditClassification,"OWNER_RESOLVED");}}
const lp5=rows.filter(r=>String(r.ownerDecisionEvidence||"")==="LP5-PHASE-5.1-S5002");
assert.equal(lp5.length,11);
for(const r of lp5){{assert.equal(r.ownerState,"RUNTIME_OWNER_ASSIGNED");assert.equal(r.runtimeActivation,true);assert.equal(r.auditClassification,"OWNER_RESOLVED");assert.equal(r.owner,"lp5MentorProfileService");}}
console.log("PROVIDER_ENTRY_STATIC_CONTRACT=PASS");
console.log("RUNTIME_OWNER_COUNT=114");
console.log("LP4_OWNER_ROWS=70");
console.log("LP5_PHASE_5_1_OWNER_ROWS=11");
console.log("SAFE_DISABLED_METHODS_AFTER_PROVIDER_INIT=68");

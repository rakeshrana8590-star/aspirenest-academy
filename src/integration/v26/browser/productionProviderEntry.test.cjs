#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const repoRoot=path.resolve(__dirname,"../../../..");
const entry=fs.readFileSync(path.join(__dirname,"productionProviderEntry.js"),"utf8");
const raw=JSON.parse(fs.readFileSync(path.join(repoRoot,"src/integration/v26/productionBridgeMethodRegistry.json"),"utf8"));
const rows=Array.isArray(raw)?raw:(raw.methods||[]);
assert.equal(rows.length,182);
const active=rows.filter(r=>r.runtimeActivation===true&&r.owner);
assert.equal(active.length,98);
for(const f of ["../lp4LearningProductionService.js","createLp4LearningProductionService","lp4LearningOperation","lp4LearningProductionService.invoke","lp4LearningMethodPolicies","registryRows","window.__aspirenestExactResourceAdapter = provider;"]) assert.ok(entry.includes(f),f);
for(const forbidden of ["setDoc","addDoc","updateDoc","deleteDoc","writeBatch","runTransaction"]) assert.ok(!entry.includes(forbidden),forbidden);
assert.equal((entry.match(/window\.__aspirenestExactResourceAdapter\s*=(?!=)/g)||[]).length,1);
const lp4=rows.filter(r=>r.ownerDecisionEvidence==="LP4-P4.1-4.7-S4003");
assert.equal(lp4.length,65);
for(const r of lp4){{assert.equal(r.ownerState,"RUNTIME_OWNER_ASSIGNED");assert.equal(r.runtimeActivation,true);assert.equal(r.auditClassification,"OWNER_RESOLVED");}}
console.log("PROVIDER_ENTRY_STATIC_CONTRACT=PASS");
console.log("RUNTIME_OWNER_COUNT=98");
console.log("LP4_OWNER_ROWS=65");
console.log("SAFE_DISABLED_METHODS_AFTER_PROVIDER_INIT=84");

#!/usr/bin/env node
'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'../..');
const text=fs.readFileSync(path.join(root,'runtime/v26-shell/app.js'),'utf8');
for(const fragment of [
  "productionAccess:{loading:false,loaded:false,error:'',grants:[]}",
  'adapter.loadStudentWorkspace?.({})',
  "if(scope==='item')return [resourceById(grant.itemId)].filter(Boolean);",
  "if(scope==='bundle')return (Array.isArray(grant.itemIds)?grant.itemIds:[]).map(resourceById).filter(Boolean);",
  "if(scope==='module')return resources.filter(resource=>productionAccessModule(resource)===String(grant.module||''));",
  "if(scope==='plan')return resources.filter(resource=>productionPlanRank(resource.requiredPlan)<=productionPlanRank(grant.planType));",
  "const assignedIds=new Set(resources.filter(resource=>resource.assigned&&allowedIds.has(resource.id))",
  "async function authorizeAndOpen(resource, route)",
  "return authorizeAndOpen(resource,location.hash);",
  "data-open=\"${resource.id}\"",
  "const isInvite=code.toUpperCase().startsWith('AN-INV-');",
  "const result=adapter.mode==='production'?{ok:true,grant:productionApproval.grant}:createCanonicalGrant",
  "if(adapter.mode==='production'){const mentorProduction=await adapter.createMentorAccessRequest",
  "id:mentorProduction.requestId||mentorProduction.request?.id||mentorProduction.request?.requestId||request.id"
]) assert.ok(text.includes(fragment),`missing: ${fragment}`);
assert.ok(/function renderMyAccess\(\)[\s\S]{0,1600}adapter\.mode==='production'/.test(text));
assert.ok(/function accessSection[\s\S]{0,1800}data-open/.test(text));
assert.ok(!/productionResourcesForGrant[\s\S]{0,1800}resource\.assigned\s*\?\s*['"]open/.test(text),'assignment must not independently create access');
assert.ok(!/Refresh access/.test(text),'LP3 must not add a new persistent My Access button');
const r=text.slice(text.indexOf("if (action === 'redeem-student-access')"),text.indexOf("if (action === 'open-student-access-request')"));
assert.ok(r.indexOf("if(adapter.mode==='production')") < r.indexOf("const key=state.adminKeys.find"),'production redemption must reach server authority before local demo-key resolution');
const m=text.slice(text.indexOf("if (action === 'mentor-save-access-request')"),text.indexOf("if (action === 'mentor-open-access-detail')"));
assert.ok(m.indexOf("adapter.createMentorAccessRequest") < m.indexOf("state.mentorAccessRequests.unshift"),'production mentor request must be acknowledged before local UI mirror');
console.log('MY_ACCESS_REAL_GRANTS=PASS');
console.log('MY_ACCESS_ITEM_MODULE_BUNDLE_PLAN=PASS');
console.log('MY_ACCESS_ASSIGNMENT_NOT_ENTITLEMENT=PASS');
console.log('MY_ACCESS_CARD_DIRECT_URL_REAUTHORIZE=PASS');
console.log('PRODUCTION_REDEEM_SERVER_FIRST=PASS');
console.log('PRODUCTION_REQUEST_NO_OPTIMISTIC_LOCAL_GRANT=PASS');
console.log('MENTOR_REQUEST_PROVIDER_ID_PROPAGATION=PASS');
console.log('MY_ACCESS_PRODUCTION_PARITY_TEST_STATUS=GREEN');

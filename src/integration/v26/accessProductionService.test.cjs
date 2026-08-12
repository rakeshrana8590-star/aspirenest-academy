#!/usr/bin/env node
'use strict';
const assert=require('assert');
const {createAccessProductionService}=require('./accessProductionService.js');

const calls=[];
let currentSession={authenticated:true,uid:'admin-1',email:'admin@example.com',role:'admin',displayName:'Admin'};
const canonical={ok:true,state:'canonical_record',resource:{resourceId:'test-1',resourceType:'test',title:'Exact Test',canonicalRoute:'/ctet-tet/mock-tests/start/test-1',requiredPlan:'PREMIUM',moduleKey:'mockTest',itemType:'mockTest'}};
const fn=(name,result={id:`${name}-1`})=>async(...args)=>{calls.push([name,...args]);return typeof result==='function'?result(...args):result;};
const deps={
 getAuthoritativeSession:async()=>currentSession,
 getCanonicalResource:async()=>canonical,
 resolveVerifiedAccessUserByEmail:async(email)=>({uid:'student-1',email,displayName:'Student'}),
 createManualAccess:fn('createManualAccess',{id:'grant-1',accessWriteMode:'created'}),
 createBulkAccessImportPlan:fn('createBulkAccessImportPlan',{id:'bulk-1'}),
 executeBulkAccessImport:fn('executeBulkAccessImport',{status:'completed'}),
 rollbackBulkAccessImport:fn('rollbackBulkAccessImport',{status:'rolled_back'}),
 createAccessProduct:fn('createAccessProduct',{id:'product-1'}),
 updateAccessProduct:fn('updateAccessProduct',{id:'product-1'}),
 listAccessProducts:fn('listAccessProducts',[{id:'bundle-1',bundleId:'bundle-1',scopeType:'bundle',itemIds:['test-1']}]),
 createAccessKey:fn('createAccessKey',{id:'KEY1'}),
 regenerateAccessKey:fn('regenerateAccessKey',{success:true,code:'KEY2'}),
 redeemAccessKeyFoundation:fn('redeemAccessKeyFoundation',{id:'grant-key'}),
 createAccessInvite:fn('createAccessInvite',{id:'INV1'}),
 regenerateAccessInviteLink:fn('regenerateAccessInviteLink',{success:true,inviteCode:'INV2'}),
 redeemAccessInvite:fn('redeemAccessInvite',{success:true,accessId:'grant-invite'}),
 createStudentAccessRequest:fn('createStudentAccessRequest',{id:'request-student'}),
 createMentorAccessRequest:fn('createMentorAccessRequest','request-mentor'),
 listAccessRequests:fn('listAccessRequests',[]),
 updateAccessRequest:fn('updateAccessRequest',{id:'request-1'}),
 approveAccessRequest:fn('approveAccessRequest',{requestId:'request-1',accessId:'grant-approved',grant:{id:'grant-approved'}}),
 extendAccess:fn('extendAccess',{id:'grant-1'}),
 revokeAccess:fn('revokeAccess',{id:'grant-1'}),
 restoreAccess:fn('restoreAccess',{id:'grant-1'}),
 loadStudentAccessWorkspace:fn('loadStudentAccessWorkspace',[{id:'grant-1',scopeType:'item',itemId:'test-1',status:'active'}]),
};
const service=createAccessProductionService(deps);
(async()=>{
 let r=await service.saveAccessGrant({learnerEmail:'student@example.com',scope:'ITEM',target:'test-1',reason:'exact'});
 assert.strictEqual(r.ok,true);assert.strictEqual(r.accessId,'grant-1');
 let grantCall=calls.find(x=>x[0]==='createManualAccess');
 assert.strictEqual(grantCall[1].uid,'student-1');assert.strictEqual(grantCall[1].scopeType,'item');assert.strictEqual(grantCall[1].itemId,'test-1');
 r=await service.saveAccessGrant({learnerUid:'attacker-uid',learnerEmail:'student@example.com',scope:'ITEM',target:'test-1',reason:'mismatch'});assert.strictEqual(r.ok,false);assert.strictEqual(r.code,'ACCESS_WRITE_FAILED');

 r=await service.previewBulkAccess({batchId:'bulk-1',rows:[{email:'a@example.com',decision:'VALID'}],values:{scope:'ITEM',target:'test-1'}});assert.strictEqual(r.ok,true);
 r=await service.applyBulkAccess({batchId:'bulk-1'});assert.strictEqual(r.ok,true);
 r=await service.rollbackBulkAccessBatch({batchId:'bulk-1',reason:'undo exact batch'});assert.strictEqual(r.ok,true);

 r=await service.saveAccessInvite({email:'student@example.com',scope:'ITEM',target:'test-1',inviteCode:'INV1'});assert.strictEqual(r.ok,true);assert.strictEqual(r.pendingGrantId,'grant-1');

 currentSession={authenticated:true,uid:'student-1',email:'student@example.com',role:'student',displayName:'Student'};
 r=await service.redeemAccessKey({code:'KEY1',email:'attacker@example.com',grant:{uid:'attacker'}});assert.strictEqual(r.ok,true);
 const keyCall=calls.find(x=>x[0]==='redeemAccessKeyFoundation');assert.strictEqual(keyCall[1].uid,'student-1');assert.strictEqual(keyCall[1].email,'student@example.com');
 r=await service.redeemAccessInvite({inviteCode:'INV1',email:'attacker@example.com'});assert.strictEqual(r.ok,true);
 const inviteCall=calls.find(x=>x[0]==='redeemAccessInvite');assert.strictEqual(inviteCall[2].uid,'student-1');assert.strictEqual(inviteCall[2].email,'student@example.com');
 r=await service.createStudentAccessRequest({resourceId:'test-1',scope:'ITEM',target:'evil',reason:'Need exact item access'});assert.strictEqual(r.ok,true);
 const reqCall=calls.find(x=>x[0]==='createStudentAccessRequest');assert.strictEqual(reqCall[1].target,'test-1');
 r=await service.loadStudentWorkspace();assert.strictEqual(r.ok,true);assert.strictEqual(r.grants.length,1);

 currentSession={authenticated:true,uid:'mentor-1',email:'mentor@example.com',role:'mentor'};
 r=await service.createMentorAccessRequest({learnerEmail:'student@example.com',resourceId:'test-1',scope:'ITEM',reason:'Need exact resource'});assert.strictEqual(r.ok,true);

 currentSession={authenticated:true,uid:'admin-1',email:'admin@example.com',role:'admin'};
 r=await service.approveAccessRequest({requestId:'request-1',grant:{uid:'attacker',scope:'PLAN'}});assert.strictEqual(r.ok,true);assert.strictEqual(r.accessId,'grant-approved');
 const approveCall=calls.find(x=>x[0]==='approveAccessRequest');assert.strictEqual(approveCall[1].requestId,'request-1');assert.strictEqual(Object.prototype.hasOwnProperty.call(approveCall[1],'grant'),false);

 currentSession={authenticated:true,uid:'student-1',email:'student@example.com',role:'student'};
 r=await service.saveAccessGrant({learnerEmail:'student@example.com',scope:'ITEM',target:'test-1'});assert.strictEqual(r.ok,false);assert.strictEqual(r.code,'ACCESS_ADMIN_REQUIRED');
 console.log('ACCESS_PRODUCTION_SERVICE_TEST_STATUS=GREEN');
})().catch(e=>{console.error(e);process.exit(1)});

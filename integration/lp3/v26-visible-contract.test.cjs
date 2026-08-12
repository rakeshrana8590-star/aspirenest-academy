#!/usr/bin/env node
'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const locked={
  'runtime/v26-shell/index.html':'bf1fa06c2fd0ef4dc41e0c7a812039e66c2adc62bcadf6dd21bfca8acb50b974',
  'runtime/v26-shell/styles.css':'15647310c5e594936c4b2edd89161f7891487c9552b2dc6d560853f6039f1324',
  'runtime/v26-shell/manifest.webmanifest':'b65180cd43a84738db6ba9f4faaeed849f045be3950200ff5427cebba4c50463',
  'runtime/v26-shell/sw.js':'9093c1f0862c26841a07953c79615b773c384b15c93c1e525ea33fdb42c21d50'
};
for(const [p,h] of Object.entries(locked))assert.strictEqual(sha(p),h,`locked current V26 runtime asset changed: ${p}`);
const text=fs.readFileSync(path.join(root,'runtime/v26-shell/app.js'),'utf8');
for(const visible of [
  "'My Access'",
  "'Exactly what this account can open — whether access came from a plan, module, bundle or one exact item.'",
  "button('Browse all','secondary','data-go=\"learning/library\"')",
  "button('Redeem code','secondary','data-go=\"home/redeem-access\"')",
  "button('My requests','secondary','data-go=\"home/access-requests\"')",
  "button('Request access','primary','data-action=\"open-student-access-request\"')",
  "accessSection('Active plans & modules','Mapped resources currently available'",
  "accessSection('Special access','Exact item or curated bundle grants'",
  "accessSection('Assigned resources','Mentor or roadmap tasks visible now'",
  "accessSection('Expiring or expired','Renewal and history remain clear'"
]) assert.ok(text.includes(visible),`locked visible My Access contract changed: ${visible}`);
assert.ok(!text.includes("button('Refresh access'"),'new visible My Access control is not allowed');
console.log('LOCKED_CURRENT_V26_IMMUTABLE_ASSETS=4/4_PASS');
console.log('LOCKED_V26_MY_ACCESS_VISIBLE_COPY=PASS');
console.log('LP3_V26_VISIBLE_CONTRACT_STATUS=GREEN');

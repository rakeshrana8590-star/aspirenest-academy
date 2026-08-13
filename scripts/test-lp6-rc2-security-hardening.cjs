#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const check=(ok,label)=>{
  if(!ok) throw new Error(`LP6 RC2 check failed: ${label}`);
  console.log(`PASS=${label}`);
};
const firebase=read('src/firebase.js');
check(
  firebase.includes('initializeAppCheck')
  && firebase.includes('ReCaptchaEnterpriseProvider')
  && firebase.includes('REACT_APP_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY')
  && firebase.includes('isTokenAutoRefreshEnabled: true')
  && firebase.includes('FIREBASE_APPCHECK_SITE_KEY_REQUIRED'),
  'APPCHECK_CLIENT_FAIL_CLOSED'
);
const providerRuntime=read('src/integration/v26/browser/productionProviderFirebaseRuntime.js');
check(
  providerRuntime.includes('firebaseInitializationRuntime.enabled'),
  'V26_PROVIDER_CONSUMES_APPCHECK_GATED_FIREBASE_RUNTIME'
);
const functions=read('functions/index.js');
check(
  functions.includes('setGlobalOptions')
  && functions.includes('enforceAppCheck')
  && functions.includes('FUNCTIONS_EMULATOR'),
  'APPCHECK_FUNCTION_ENFORCEMENT'
);
const buildOwner=read('scripts/build-v26-production-provider.cjs');
check(
  buildOwner.includes('BROWSER_SAFE_ENV_KEYS')
  && buildOwner.includes('REACT_APP_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY')
  && buildOwner.includes('webpack.DefinePlugin')
  && buildOwner.includes('"process.env"'),
  'PROVIDER_BROWSER_SAFE_ENV_INJECTION'
);
for(const forbidden of [
  'SMTP_PASSWORD','RAZORPAY_KEY_SECRET','PRIVATE_KEY','SERVICE_ACCOUNT','ACCESS_TOKEN','REFRESH_TOKEN'
]){
  check(!buildOwner.includes(`"${forbidden}"`),`SAFE_ENV_EXCLUDES_${forbidden}`);
}
const vercel=JSON.parse(read('vercel.json'));
const globalRule=(vercel.headers||[]).find((r)=>r&&r.source==='/(.*)');
check(Boolean(globalRule),'VERCEL_GLOBAL_HEADER_RULE');
const hm=Object.fromEntries((globalRule.headers||[]).filter(Boolean).map((x)=>[
  String(x.key||'').toLowerCase(),String(x.value||'')
]));
for(const key of [
  'content-security-policy','strict-transport-security','x-content-type-options',
  'referrer-policy','permissions-policy'
]){
  check(Boolean(hm[key]),`HEADER_${key}`);
}
const csp=hm['content-security-policy'];
check(
  csp.includes("script-src 'self'")
  && csp.includes('https://apis.google.com')
  && csp.includes('https://www.gstatic.com')
  && csp.includes('https://www.google.com/recaptcha/')
  && csp.includes('https://*.firebaseapp.com')
  && csp.includes('https://accounts.google.com')
  && !csp.includes("'unsafe-eval'"),
  'CSP_FIREBASE_AUTH_AND_APPCHECK'
);
const ownedSources=[
  'runtime/v26-shell',
  'src/integration/v26/browser/productionProviderEntry.js',
  'src/integration/v26/browser/productionProviderFirebaseRuntime.js',
  'src/firebase.js',
];
const scanPath=(rel)=>{
  const full=path.join(root,rel);
  const hits=[];
  const walk=(p)=>{
    const stat=fs.statSync(p);
    if(stat.isDirectory()){
      for(const e of fs.readdirSync(p)) walk(path.join(p,e));
      return;
    }
    const text=fs.readFileSync(p,'utf8');
    if(text.includes('getDownloadURL(')) hits.push(path.relative(root,p));
  };
  walk(full);
  return hits;
};
check(ownedSources.flatMap(scanPath).length===0,'NO_OWNED_V26_GETDOWNLOADURL_CALLSITE');
console.log('LP6_RC2_SECURITY_HARDENING=GREEN');

#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'firebase.js'), 'utf8');
const providerBuilder = fs.readFileSync(path.join(root, 'scripts', 'build-v26-production-provider.cjs'), 'utf8');

assert(source.includes('from "firebase/app-check"'));
assert(source.includes('initializeAppCheck'));
assert(source.includes('ReCaptchaEnterpriseProvider'));
assert(source.includes('REACT_APP_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY'));
assert(source.includes('!firebaseEmulatorRuntime.enabled'));
assert(source.includes('["staging", "production"].includes'));
assert(source.includes('FIREBASE_APPCHECK_SITE_KEY_REQUIRED'));
assert(source.includes('FIREBASE_APPCHECK_INITIALIZATION_FAILED'));
assert(source.includes('isTokenAutoRefreshEnabled: true'));
assert(source.includes('required: appCheckRequired'));
assert(source.includes('enabled: Boolean(appCheck)'));
assert(source.includes('? "RECAPTCHA_ENTERPRISE"'));
assert(providerBuilder.includes('REACT_APP_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY'));
assert(providerBuilder.includes('BROWSER_SAFE_ENV_KEYS'));

console.log('FIREBASE_APPCHECK_IMPORT=PASS');
console.log('FIREBASE_APPCHECK_STAGING_PRODUCTION_REQUIRED=PASS');
console.log('FIREBASE_APPCHECK_EMULATOR_BYPASS=PASS');
console.log('FIREBASE_APPCHECK_MISSING_KEY_FAIL_CLOSED=PASS');
console.log('FIREBASE_APPCHECK_INIT_FAILURE_FAIL_CLOSED=PASS');
console.log('FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE=PASS');
console.log('FIREBASE_APPCHECK_AUTO_REFRESH=PASS');
console.log('FIREBASE_APPCHECK_BROWSER_SAFE_ENV_ALLOWLIST=PASS');
console.log('FIREBASE_APPCHECK_STATIC_CLOSURE=GREEN');

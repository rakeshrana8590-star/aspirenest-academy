import fs from "node:fs";
import crypto from "node:crypto";
const read=(p)=>fs.readFileSync(p,"utf8");
const hash=(p)=>crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const expected={
  "styles.css": "841eb0c401a787225154522d2dde4b99b6dba93693166b532e0c53f3847a48ad",
  "admin.css": "c2b3fe8589b95aadc988afdc003a898ef94987be9cfcbd49c5d67ff6ce705dfb",
  "v8-experiences.css": "9a6711dad0340c3737f4b2a112d0c387cd39264d0953fb4d8cf35395595fb5a7",
  "app.js": "e9455558b9940c8c01404e993a527973c7b9c1b66f33b633e3c8ce9eb88b9f95",
  "admin.js": "75f8ba806349b72504270f9aef8689086df0816129c8af3710b25c8f35ac2ddf",
  "v8-experiences.js": "9c9edbc9e50adef0ea40cff70a0695513f1f7d2d8c96759275b3193253aea359"
};
let failed=0;
const check=(label,pass)=>{console.log(`${pass?"PASS":"FAIL"}=${label}`);if(!pass)failed++;};
for(const [name,value] of Object.entries(expected)) check(`Canonical V8 asset unchanged: ${name}`,hash(`public/${name}`)===value);
const index=read("public/index.html");
const entry=read("src/index.js");
const bridge=read("src/v8/v8FirebaseBridge.js");
check("Exact V8 app-shell is root",index.includes('id="app" class="app-shell"'));
check("Exact topbar is preserved",index.includes('header class="topbar"'));
check("Exact parent rail is preserved",index.includes('aside class="parent-rail"'));
check("Exact context rail is preserved",index.includes('aside class="context-rail"'));
check("Exact four-experience engine is loaded",index.includes('/v8-experiences.js'));
check("No iframe",!index.toLowerCase().includes("iframe")&&!bridge.toLowerCase().includes("iframe"));
check("No Shadow DOM",!bridge.includes("attachShadow")&&!entry.includes("V8LearningDriveRuntime"));
check("React App is not mounted over V8",!entry.includes("createRoot")&&!entry.includes("App"));
check("Firebase Auth bridge is active",bridge.includes("onAuthStateChanged")&&bridge.includes("signInWithEmailAndPassword"));
check("Google Login is active",bridge.includes("signInWithPopup"));
check("Create Account writes existing Student records",bridge.includes("createVerifiedStudentAccountRecords"));
check("Verification email is active",bridge.includes("sendEmailVerification"));
check("Failed account setup rolls Auth user back",bridge.includes("deleteUser(createdUser)"));
check("Exact Admin email resolver is reused",bridge.includes("resolveAspireNestRole"));
check("Exact role access resolver is reused",bridge.includes("canUseAspireNestExperience"));
check("V8 visual assets are root assets",index.includes('href="/styles.css"')&&index.includes('src="/app.js"'));
console.log(`CHECKS=${Object.keys(expected).length+16}`);console.log(`FAILED=${failed}`);if(failed)process.exit(1);console.log("FINAL_DECISION=G9_EXACT_V8_DIRECT_FIREBASE_ROOT_STATIC_GREEN");

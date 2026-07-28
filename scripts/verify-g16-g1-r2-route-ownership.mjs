import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('public/app.js');
const admin = read('public/admin.js');
const exp = read('public/v8-experiences.js');
const bootstrap = read('public/v8-route-bootstrap.js');
const roleRuntime = read('src/v8/v8RoleRuntime.js');
const shadowApp = read('public/learning-drive-v8/app.js');
const shadowAdmin = read('public/learning-drive-v8/admin.js');
const shadowExp = read('public/learning-drive-v8/v8-experiences.js');

let failed = 0;
const check = (label, condition) => {
  if (condition) console.log(`PASS=${label}`);
  else { console.log(`FAIL=${label}`); failed += 1; }
};

check('Route bootstrap owns initial active experience', bootstrap.includes('window.__aspirenestActiveExperience = experience;'));
check('Role runtime publishes active experience before renderer transition', roleRuntime.indexOf('runtime.__aspirenestActiveExperience = target;') < roleRuntime.indexOf('if (target === "admin")'));
check('Student runtime has explicit experience ownership guard', app.includes("const isStudentExperienceActive = () => activeExperience() === 'student'"));
check('Student live data cannot repaint another experience', app.includes('if(isStudentExperienceActive()){renderNav();renderPage();}'));
check('Student initial render is experience-gated', app.includes('if(isStudentExperienceActive()){\n      renderNav();'));
check('Student hash router is experience-gated', app.includes('function routeFromHash() {\n    if (!isStudentExperienceActive()) return;'));
check('Admin runtime requires active Admin experience', admin.includes("function isAdmin(){return activeExperience()==='admin'"));
check('Admin enter publishes active Admin experience', admin.includes("window.__aspirenestActiveExperience='admin';"));
check('Admin exit publishes active Student experience', admin.includes("window.__aspirenestActiveExperience='student';"));
check('Public and Mentor entry publish active experience', exp.includes('function enterExperience(role){\n    window.__aspirenestActiveExperience=role;'));
check('Public and Mentor hash routes publish active experience', exp.includes('window.__aspirenestActiveExperience=parts[0];'));
check('Core role switch publishes active experience first', exp.includes('function triggerCoreRole(role){\n    window.__aspirenestActiveExperience=role;'));
check('Honorific-aware greeting avoids Welcome back Dr only', app.includes('function studentGreetingName()'));
check('Direct and shadow Student engines are identical', app === shadowApp);
check('Direct and shadow Admin engines are identical', admin === shadowAdmin);
check('Direct and shadow Public/Mentor engines are identical', exp === shadowExp);
check('No iframe introduced', ![app,admin,exp].some((text) => /<iframe|createElement\(['"]iframe/i.test(text)));
check('No Shadow DOM introduced', ![app,admin,exp].some((text) => /attachShadow\s*\(/.test(text)));

console.log(`CHECKS=18`);
console.log(`FAILED=${failed}`);
console.log(`FINAL_DECISION=${failed === 0 ? 'G16_G1_R2_ROUTE_OWNERSHIP_STATIC_GREEN' : 'G16_G1_R2_ROUTE_OWNERSHIP_STATIC_RED'}`);
process.exit(failed === 0 ? 0 : 1);

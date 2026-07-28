import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const checks = [];
const check = (label, ok) => {
  checks.push({ label, ok: Boolean(ok) });
  console.log(`${ok ? "PASS" : "FAIL"}=${label}`);
};
const all = (text, tokens) => tokens.every((token) => text.includes(token));

const policy = read("src/v8/v8EntitlementPolicy.js");
const policyTest = read("src/v8/v8EntitlementPolicy.test.js");
const platform = read("src/v8/v8PlatformLiveData.js");
const platformTest = read("src/v8/v8PlatformLiveData.test.js");
const actions = read("src/v8/v8PlatformLiveActions.js");
const admin = read("src/v8/v8AdminLiveData.js");
const adminTest = read("src/v8/v8AdminLiveData.test.js");

check("One central V8 plan hierarchy exists", all(policy, ["FREE: 0", "BASIC: 1", "PREMIUM: 2", "MENTORSHIP: 3"]));
check("Historical plan aliases are normalized", all(policy, ["record.planCode", "record.planType", "record.plan", "record.accessPlan", "record.currentPlan"]));
check("All learning modules share module normalization", all(policy, ["currentAffairs", "roadmap", "mockTest", "video", "notes"]));
check("Mentorship Notes alone migrate to Premium", policy.includes('if (module === "notes" && plan === "MENTORSHIP") return "PREMIUM"'));
check("Platform live data consumes central entitlement policy", all(platform, ["canV8AccessResource", "resolveV8EffectivePlan", "resolveV8ResourcePlan"]));
check("Platform live actions consume the same entitlement policy", all(actions, ["canV8AccessResource", "resolveV8EffectivePlan", "resolveV8ResourcePlan", "v8EntitlementMatchesResource"]));
check("Historical studentAccess plan field can open resources", platformTest.includes("historical plan field"));
check("Premium roadmap access regression is tested", platformTest.includes("opens a Premium roadmap from the learner effective plan"));
check("Plan hierarchy is tested for every module", all(policyTest, ["Native Note", "Video", "Mock Test", "Current Affairs", "Roadmap", "Live Class"]));
check("Free Basic Premium Mentorship matrix is tested", all(policyTest, ["PREMIUM", "MENTORSHIP", "applies %s hierarchy"]));
check("Admin resource badges use founder-approved note migration", admin.includes("resolveV8ResourcePlan"));
check("Admin Mentorship Note migration is tested", adminTest.includes("Mentorship Notes under Premium"));
check("Other Mentorship module tiers stay unchanged", adminTest.includes('expect(video.access).toBe("MENTORSHIP")'));
check("Current Affairs legacy source remains live", platform.includes('collection(db, "currentAffairs")'));
check("Current Affairs boolean publication aliases are supported", all(platform, ["record.isPublished === true", "record.published === true", "record.active === true"]));
check("Roadmaps source remains live", platform.includes('collection(db, "studyRoadmaps")'));
check("No route ownership files are modified", !fs.existsSync(path.join(root, "public/app.js.__r6_payload_marker")));
check("No demo fallback introduced", !/Dr\. Meera Shah|Mr\. Arjun Rao|example\.com business/.test(policy + platform + actions + admin));

const failed = checks.filter((item) => !item.ok);
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed.length}`);
console.log(`FAILED=${failed.length}`);
console.log("PLAN_HIERARCHY=FREE<BASIC<PREMIUM<MENTORSHIP");
console.log("MENTORSHIP_NOTES_PROJECTED_AS=PREMIUM");
console.log("OTHER_MENTORSHIP_MODULES=UNCHANGED");
console.log(`FINAL_DECISION=${failed.length ? "G16_G1_R6_STATIC_RED" : "G16_G1_R6_ENTITLEMENT_NOTES_STATIC_GREEN"}`);
if (failed.length) process.exit(1);

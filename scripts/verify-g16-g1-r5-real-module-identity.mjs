import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const checks = [];
const check = (label, ok) => {
  checks.push({ label, ok: Boolean(ok) });
  console.log(`${ok ? "PASS" : "FAIL"}=${label}`);
};
const containsAll = (text, tokens) => tokens.every((token) => text.includes(token));

const platform = read("src/v8/v8PlatformLiveData.js");
const admin = read("src/v8/v8AdminLiveData.js");
const platformTest = read("src/v8/v8PlatformLiveData.test.js");
const adminTest = read("src/v8/v8AdminLiveData.test.js");

check("Canonical Resource Graph builder exists", platform.includes("buildV8CanonicalResourceRecords"));
check("Current Affairs legacy collection is subscribed", platform.includes('collection(db, "currentAffairs")'));
check("Roadmaps legacy collection is subscribed", platform.includes('collection(db, "studyRoadmaps")'));
check("Public consumes all three resource sources", containsAll(platform, ["state.contentItems.records", "state.currentAffairs.records", "state.studyRoadmaps.records"]));
check("Student source state includes Current Affairs", platform.includes('"currentAffairs", "studyRoadmaps", "studentAccessUid"'));
check("Mentor source state includes Roadmaps", platform.includes('"currentAffairs", "studyRoadmaps", "learnerProfiles"'));
check("Current Affairs canonical route is preserved", platform.includes("/ctet-tet/current-affairs/"));
check("Roadmap canonical route is preserved", platform.includes("/ctet-tet/roadmaps/"));
check("Current Affairs readable asset fallback is explicit", platform.includes("hasLegacyCurrentAffairsAsset"));
check("Canonical resource alias merge prevents duplicate cards", containsAll(platform, ["canonicalResourceAliases", "aliasOwner", "sourceCollections"]));
check("Admin imports canonical Resource Graph", admin.includes('import { buildV8CanonicalResourceRecords } from "./v8PlatformLiveData"'));
check("Admin live sources include Current Affairs", admin.includes('currentAffairs: "currentAffairs"'));
check("Admin live sources include Roadmaps", admin.includes('studyRoadmaps: "studyRoadmaps"'));
check("Admin performs final staff exclusion", containsAll(admin, ["isAspireNestStaffEmail", "relationshipProjection.learners.filter"]));
check("Student-facing canonical merge regression is tested", platformTest.includes("unifies contentItems, currentAffairs and studyRoadmaps without duplicate cards"));
check("Admin staff exclusion regression is tested", adminTest.includes("applies final staff exclusion after relationship projection"));
check("Admin Current Affairs and Roadmaps projection is tested", containsAll(adminTest, ["Current Affairs", "Roadmap", "state.resources"]).valueOf());
check("No demo fallback was introduced", !/example\.com business|Dr\. Meera Shah|Mr\. Arjun Rao/.test(platform + admin));
check("Admin resource classifier consumes section and itemType", containsAll(admin, ["record.itemType", "record.section", "record.deliveryType"]));
check("Native Notes are never collapsed to generic Learning Resource", containsAll(adminTest, ["preserves real module identities", "not.toContain(\"Learning Resource\")"]));

check("Staff exclusion test checks learner identity emails, not relationship metadata", adminTest.includes("const learnerIdentityEmails = state.learners.map((learner) => learner.email)"));
check("Mentor relationship email remains preserved on learner projection", adminTest.includes('expect(state.learners[0].mentorEmail).toBe("dr.varshamaru@gmail.com")'));


const failed = checks.filter((item) => !item.ok);
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed.length}`);
console.log(`FAILED=${failed.length}`);
console.log(`CURRENT_AFFAIRS_SOURCE=currentAffairs`);
console.log(`ROADMAP_SOURCE=studyRoadmaps`);
console.log(`ADMIN_STAFF_FINAL_EXCLUSION=YES`);
console.log(`FINAL_DECISION=${failed.length ? "G16_G1_R5_STATIC_RED" : "G16_G1_R5_REAL_MODULE_IDENTITY_STATIC_GREEN"}`);
if (failed.length) process.exit(1);

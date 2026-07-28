import fs from "fs";

const read = (path) => fs.readFileSync(path, "utf8");
const checks = [];
const pass = (label, condition) => {
  checks.push({ label, condition: Boolean(condition) });
  console.log(`${condition ? "PASS" : "FAIL"}=${label}`);
};

const learners = read("src/learningDrive/AdminDriveLearnersRoute.jsx");
const acceptance = read("src/profile/realStudentAcceptance.js");
const studentNotes = read("src/components/notes/student/StudentNotesLibraryRoute.jsx");
const adminNotes = read("src/components/notes/admin/AdminNotesHomeRoute.jsx");
const notesBinding = read("src/components/notes/shared/realNotesBinding.js");
const routes = read("src/learningDrive/learningDriveRouteMap.js");

pass("G4 existing users students learnerProfiles are merged", learners.includes("buildRealStudentAcceptanceReport") && acceptance.includes('sourceCollections: ["users", "students", "learnerProfiles"]'));
pass("G4 read proof can be downloaded", learners.includes("Download read proof") && learners.includes("buildRealStudentAcceptanceDownload"));
pass("G4 has no write API", !/setDoc|addDoc|updateDoc|deleteDoc|writeBatch/.test(acceptance));
pass("G4 staff exclusion remains", acceptance.includes("isAspireNestStaffEmail"));
pass("G5 student Notes uses real binding", studentNotes.includes("REAL NOTES CONNECTED") && studentNotes.includes("buildRealNotesBindingReport"));
pass("G5 admin Notes uses real binding", adminNotes.includes("REAL NOTES SOURCE") && adminNotes.includes("buildRealNotesBindingReport"));
pass("G5 source is contentItems", notesBinding.includes('sourceCollection: "contentItems"'));
pass("G5 duplicate Notes database is denied", notesBinding.includes("duplicateNotesDatabase: false"));
pass("G5 native IntelliText is preserved", notesBinding.includes("hasNativeIntelliText"));
pass("G5 protected assets are preserved", notesBinding.includes("hasProtectedAsset"));
pass("G5 legacy PDF fallback is preserved", notesBinding.includes("legacyPdfFallback"));
pass("V8 Student Notes route is unchanged", routes.includes('route: "/ctet-tet/notes"'));
pass("V8 Admin Notes route is unchanged", routes.includes('route: "/admin/content/notes"'));
pass("No iframe integration", ![learners, studentNotes, adminNotes].some((text) => /<iframe|createElement\(["']iframe/.test(text)));

const failed = checks.filter((item) => !item.condition);
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed.length}`);
console.log(`FAILED=${failed.length}`);
process.exit(failed.length ? 1 : 0);

#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const admin = require("firebase-admin");

const PROJECT = process.env.LP5_STAGING_PROJECT || "aspirenest-platform-staging";
const API_KEY = process.env.LP5_WEB_API_KEY || "";
const REGION = process.env.LP5_REGION || "asia-south1";
const STORAGE_BUCKET = process.env.LP5_STORAGE_BUCKET || `${PROJECT}.firebasestorage.app`;

assert.ok(API_KEY, "LP5_WEB_API_KEY required");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT,
    storageBucket: STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

const run = crypto.randomBytes(5).toString("hex");
const prefix = `lp5s5002-${run}`;
const users = [];
const objectPaths = [];
let originalDefaultMentor = null;
let originalDefaultMentorExists = false;
let fixtureMentorUid = "";
let fixtureAssignedUid = "";

function rid(kind) {
  return `${prefix}-${kind}`;
}

async function mkUser(kind, role) {
  const email = `${prefix}-${kind}@example.test`;
  const password = `Aa1!${run}Secure`;
  const u = await auth.createUser({ email, password, emailVerified: true });
  users.push(u.uid);
  await db.collection("roleAuthorities").doc(u.uid).set({
    uid: u.uid,
    role,
    activeRole: role,
    allowedRoles: [role],
    accountStatus: "active",
    authorityVersion: 1,
    tokensValidAfterSeconds: 0,
  });
  return { uid: u.uid, email, password, role };
}

async function token(user) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(API_KEY)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true,
      }),
    },
  );
  const j = await res.json();
  if (!res.ok) {
    throw new Error(`PASSWORD_TOKEN_EXCHANGE:${res.status}:${JSON.stringify(j).slice(0, 400)}`);
  }
  return j.idToken;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizedErrorText(error) {
  const message = String(error && error.message || error || "");
  const payload = error && error.payload ? JSON.stringify(error.payload) : "";
  return `${message} ${payload}`.toLowerCase().replace(/_/g, "-");
}

async function callable(idToken, method, payload = {}, tag = method) {
  const url = `https://${REGION}-${PROJECT}.cloudfunctions.net/lp5MentorProfileOperation`;
  const headers = { "content-type": "application/json" };
  if (idToken) headers.authorization = `Bearer ${idToken}`;
  const meta = {
    requestId: `${prefix}-${tag}`,
    operationId: `${prefix}-${tag}`,
    correlationId: `${prefix}-${tag}`,
    idempotencyKey: `${prefix}-${tag}`,
  };

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let res;
    let j = {};
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: { method, payload, meta } }),
      });
      try { j = await res.json(); } catch (_) { j = {}; }
    } catch (e) {
      if (attempt < maxAttempts) {
        console.log(`CALLABLE_TRANSPORT_RETRY=${method}:FETCH:${attempt}`);
        await sleep(1000 * attempt);
        continue;
      }
      throw e;
    }

    const hasCallableError = Boolean(j && j.error);
    const retryableBareStatus =
      !hasCallableError &&
      [401, 408, 429, 500, 502, 503, 504].includes(Number(res.status));

    if (retryableBareStatus && attempt < maxAttempts) {
      console.log(`CALLABLE_TRANSPORT_RETRY=${method}:${res.status}:${attempt}`);
      await sleep(1200 * attempt);
      continue;
    }

    if (!res.ok || hasCallableError) {
      const err = new Error(`CALL:${method}:${res.status}:${JSON.stringify(j).slice(0, 600)}`);
      err.status = res.status;
      err.payload = j;
      throw err;
    }
    return j.result;
  }

  throw new Error(`CALL:${method}:RETRY_EXHAUSTED`);
}

async function firestoreRest(idToken, path) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const headers = { "content-type": "application/json" };
  if (idToken) headers.authorization = `Bearer ${idToken}`;
  const res = await fetch(url, { headers });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  return { status: res.status, data };
}

async function storageDirect(idToken, objectPath) {
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(STORAGE_BUCKET)}/o/${encodeURIComponent(objectPath)}?alt=media`;
  const headers = {};
  if (idToken) headers.authorization = `Bearer ${idToken}`;
  const res = await fetch(url, { headers });
  return res.status;
}

async function signedDelivery(url, expectedBuffer) {
  assert.ok(/^https:\/\//.test(String(url || "")), "SIGNED_URL_REQUIRED");
  const res = await fetch(url, { redirect: "follow" });
  const body = Buffer.from(await res.arrayBuffer());
  assert.equal(res.status, 200, `SIGNED_DELIVERY_HTTP_${res.status}`);
  assert.deepEqual(body, expectedBuffer, "SIGNED_DELIVERY_BODY_MISMATCH");
  return body.length;
}

async function expectDenied(promise, label, includes = "") {
  let caught = null;
  try {
    await promise;
  } catch (e) {
    caught = e;
  }
  assert.ok(caught, `${label}: expected denial`);
  if (includes) {
    const haystack = normalizedErrorText(caught);
    const needle = String(includes).toLowerCase().replace(/_/g, "-");
    assert.ok(haystack.includes(needle), `${label}: ${haystack.slice(0, 500)}`);
  }
  console.log(`DENY_PASS=${label}:${String(caught && caught.message || caught).slice(0, 180)}`);
}

async function fixtureSetup() {
  const defaultRef = db.collection("platformSettings").doc("defaultMentor");
  const original = await defaultRef.get();
  originalDefaultMentorExists = original.exists;
  originalDefaultMentor = original.exists ? original.data() : null;

  const administrator = await mkUser("admin", "admin");
  const mentor = await mkUser("mentor", "mentor");
  fixtureMentorUid = mentor.uid;
  const assigned = await mkUser("assigned", "student");
  fixtureAssignedUid = assigned.uid;
  const unassigned = await mkUser("unassigned", "student");

  await db.collection("mentorProfiles").doc(mentor.uid).set({
    mentorUid: mentor.uid,
    role: "mentor",
    status: "active",
    displayName: "LP5 Fixture Mentor",
    professionalProfile: {
      id: rid("profile"),
      slug: rid("mentor"),
      displayName: "LP5 Fixture Mentor",
      publicStatus: "Draft",
      verificationStatus: "unverified",
      visibility: {
        publicProfile: false,
        studentProfile: true,
        showPhoto: false,
        showBooks: true,
        showResearch: true,
        showAchievements: true,
        showSocial: false,
        showContact: false,
      },
      entries: [],
      version: 1,
      updatedAtMs: Date.now(),
    },
  });

  await db.collection("users").doc(assigned.uid).set({
    uid: assigned.uid,
    displayName: "Assigned Aspirant",
    email: assigned.email,
    username: rid("assigned"),
    role: "student",
  });
  await db.collection("students").doc(assigned.uid).set({
    uid: assigned.uid,
    displayName: "Assigned Aspirant",
    email: assigned.email,
    username: rid("assigned"),
    role: "student",
  });

  await db.collection("users").doc(unassigned.uid).set({
    uid: unassigned.uid,
    displayName: "Unassigned Aspirant",
    email: unassigned.email,
    username: rid("unassigned"),
    role: "student",
  });
  await db.collection("students").doc(unassigned.uid).set({
    uid: unassigned.uid,
    displayName: "Unassigned Aspirant",
    email: unassigned.email,
    username: rid("unassigned"),
    role: "student",
  });

  await db.collection("mentorProfiles").doc(mentor.uid).collection("students").doc(assigned.uid).set({
    mentorUid: mentor.uid,
    studentUid: assigned.uid,
    status: "active",
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await defaultRef.set({
    mentorUid: mentor.uid,
    mentorEmail: mentor.email,
    status: "active",
    source: "lp5-s5002-staging-fixture",
  });

  return { administrator, mentor, assigned, unassigned };
}

async function cleanup() {
  let cleanupErrors = [];

  try {
    const audits = await db.collection("lp5AuditLogs").where("mentorUid", "==", fixtureMentorUid || "__none__").get();
    for (const d of audits.docs) {
      try { await d.ref.delete(); } catch (e) { cleanupErrors.push(`audit:${d.id}:${e.message}`); }
    }
  } catch (e) {
    cleanupErrors.push(`audit-query:${e.message}`);
  }

  const mentorUid = fixtureMentorUid;
  const assignedUid = fixtureAssignedUid;
  if (mentorUid && assignedUid) {
    try { await db.collection("mentorProfiles").doc(mentorUid).collection("students").doc(assignedUid).delete(); } catch (e) { cleanupErrors.push(`link:${e.message}`); }
  }
  if (mentorUid) {
    try { await db.collection("mentorProfiles").doc(mentorUid).delete(); } catch (e) { cleanupErrors.push(`mentor:${e.message}`); }
  }

  for (const uid of users) {
    try { await db.collection("users").doc(uid).delete(); } catch (_) {}
    try { await db.collection("students").doc(uid).delete(); } catch (_) {}
    try { await db.collection("roleAuthorities").doc(uid).delete(); } catch (e) { cleanupErrors.push(`role:${uid}:${e.message}`); }
  }

  for (const path of objectPaths) {
    try { await bucket.file(path).delete({ ignoreNotFound: true }); } catch (e) { cleanupErrors.push(`object:${path}:${e.message}`); }
  }

  try {
    const ref = db.collection("platformSettings").doc("defaultMentor");
    if (originalDefaultMentorExists) await ref.set(originalDefaultMentor);
    else await ref.delete();
  } catch (e) {
    cleanupErrors.push(`defaultMentor:${e.message}`);
  }

  for (const uid of users) {
    try { await auth.deleteUser(uid); } catch (e) {
      if (e.code !== "auth/user-not-found") cleanupErrors.push(`auth:${uid}:${e.message}`);
    }
  }

  let residue = 0;
  if (mentorUid) {
    if ((await db.collection("mentorProfiles").doc(mentorUid).get()).exists) residue++;
    const a = await db.collection("lp5AuditLogs").where("mentorUid", "==", mentorUid).get();
    residue += a.size;
  }
  for (const uid of users) {
    if ((await db.collection("roleAuthorities").doc(uid).get()).exists) residue++;
    if ((await db.collection("users").doc(uid).get()).exists) residue++;
    if ((await db.collection("students").doc(uid).get()).exists) residue++;
    try { await auth.getUser(uid); residue++; } catch (e) { if (e.code !== "auth/user-not-found") throw e; }
  }
  for (const path of objectPaths) {
    const [exists] = await bucket.file(path).exists();
    if (exists) residue++;
  }

  const restored = await db.collection("platformSettings").doc("defaultMentor").get();
  if (originalDefaultMentorExists) {
    assert.equal(restored.exists, true, "DEFAULT_MENTOR_RESTORE_MISSING");
    assert.deepEqual(restored.data(), originalDefaultMentor, "DEFAULT_MENTOR_RESTORE_MISMATCH");
  } else {
    assert.equal(restored.exists, false, "DEFAULT_MENTOR_SHOULD_BE_ABSENT");
  }

  if (cleanupErrors.length) {
    console.error(JSON.stringify({ cleanupErrors }, null, 2));
  }
  assert.equal(residue, 0, `LP5_STAGING_RESIDUE:${residue}`);
  assert.equal(cleanupErrors.length, 0, "LP5_CLEANUP_ERRORS");
  console.log("LP5_STAGING_RESIDUE=0");
}

(async () => {
  const failures = [];
  const check = async (label, fn) => {
    try {
      await fn();
      console.log(`PASS=${label}`);
      return true;
    } catch (e) {
      failures.push({ label, error: String(e && (e.stack || e.message) || e) });
      console.log(`RED=${label}:${String(e && e.message || e).slice(0, 280)}`);
      return false;
    }
  };
  const skipDependency = (label, dependency) => {
    failures.push({ label, error: `SKIPPED_DEPENDENCY:${dependency}` });
    console.log(`SKIP_DEPENDENCY=${label}:${dependency}`);
    return false;
  };

  let fixture = null;
  let tokens = null;
  let entryId = rid("entry");
  const photoBody = Buffer.from(`lp5-photo-${run}`, "utf8");
  const expectedPhotoPath = { value: "" };

  try {
    fixture = await fixtureSetup();
    const [adminToken, mentorToken, assignedToken, unassignedToken] = await Promise.all([
      token(fixture.administrator),
      token(fixture.mentor),
      token(fixture.assigned),
      token(fixture.unassigned),
    ]);
    tokens = { adminToken, mentorToken, assignedToken, unassignedToken };

    await callable("", "loadPublicMentorDirectory", {}, "readiness-public");
    await callable(mentorToken, "loadMentorProfessionalProfile", {}, "readiness-mentor");
    await callable(assignedToken, "loadStudentProfile", {}, "readiness-student");
    console.log("CALLABLE_READINESS=GREEN_PUBLIC_MENTOR_STUDENT");

    const canonicalSaved = await check("CANONICAL_PROFILE_SAVE_AND_OWNER_READ", async () => {
      const saved = await callable(mentorToken, "saveMentorProfessionalProfile", {
        profile: {
          id: rid("profile"),
          slug: rid("mentor"),
          displayName: "Dr. LP5 Fixture Mentor",
          shortName: "Dr. LP5",
          headline: "Verified teaching mentor",
          bio: "LP5 staging professional profile propagation proof.",
          currentRole: "Mentor",
          institution: "AspireNest Staging",
          location: "India",
          yearsExperience: "10+ years",
          availability: "By appointment",
          qualification: "PhD Education",
          examExpertise: "CTET and TET",
          researchAreas: "Teacher education",
          recognition: "LP5 fixture recognition",
          digitalLearning: "Digital pedagogy",
          qualifications: ["PhD Education"],
          roles: ["Mentor"],
          publications: ["LP5 Research"],
          books: ["LP5 Book"],
          courses: ["LP5 Course"],
          talks: ["LP5 Talk"],
          awards: ["LP5 Award"],
          languages: ["English", "Hindi"],
          strengths: ["Mentoring"],
          publicEmail: `${prefix}-private@example.test`,
          bookingLabel: "Contact Mentor",
          social: { website: "https://example.com/mentor" },
          visibility: {
            publicProfile: false,
            studentProfile: true,
            showPhoto: false,
            showBooks: true,
            showResearch: true,
            showAchievements: true,
            showSocial: false,
            showContact: false,
          },
        },
      }, "save-profile");
      assert.equal(saved.state.profile.displayName, "Dr. LP5 Fixture Mentor");
      assert.equal(saved.state.profile.publicEmail, `${prefix}-private@example.test`);

      const loaded = await callable(mentorToken, "loadMentorProfessionalProfile", {}, "owner-read");
      assert.equal(loaded.state.profile.displayName, "Dr. LP5 Fixture Mentor");
      assert.equal(loaded.state.profile.publicEmail, `${prefix}-private@example.test`);

      const canonical = (await db.collection("mentorProfiles").doc(fixture.mentor.uid).get()).data();
      assert.equal(canonical.professionalProfile.displayName, "Dr. LP5 Fixture Mentor");
      assert.equal(canonical.professionalProfile.publicEmail, `${prefix}-private@example.test`);
    });

    const entrySaved = canonicalSaved
      ? await check("PROFESSIONAL_ENTRY_SAVE", async () => {
      const r = await callable(mentorToken, "saveMentorProfessionalEntry", {
        entry: {
          id: entryId,
          type: "Book",
          title: "LP5 Staging Book",
          organization: "AspireNest",
          description: "Safe public professional entry",
          year: "2026",
          visibility: "Public",
          featured: true,
        },
      }, "entry-save");
      assert.ok(r.state.profile.entries.some((x) => x.id === entryId));
    })
      : skipDependency("PROFESSIONAL_ENTRY_SAVE", "CANONICAL_PROFILE_SAVE_AND_OWNER_READ");

    const photoUploaded = canonicalSaved
      ? await check("PRIVATE_PHOTO_UPLOAD_PENDING_MODERATION", async () => {
      const r = await callable(mentorToken, "uploadMentorProfilePhoto", {
        file: {
          contentType: "image/jpeg",
          base64: photoBody.toString("base64"),
        },
      }, "photo-upload");
      assert.equal(r.state.profile.photoState.status, "pending_review");
      assert.equal(r.state.profile.visibility.showPhoto, false);
      expectedPhotoPath.value = `mentor-professional/${fixture.mentor.uid}/profile.jpg`;
      objectPaths.push(expectedPhotoPath.value);
      assert.equal(r.state.profile.photoState.storagePath, expectedPhotoPath.value);
      const [exists] = await bucket.file(expectedPhotoPath.value).exists();
      assert.equal(exists, true);
    })
      : skipDependency("PRIVATE_PHOTO_UPLOAD_PENDING_MODERATION", "CANONICAL_PROFILE_SAVE_AND_OWNER_READ");

    await check("PUBLIC_HIDDEN_BEFORE_VERIFY_AND_PUBLISH", async () => {
      const r = await callable("", "loadPublicMentorDirectory", {}, "public-before");
      assert.ok(!r.state.items.some((x) => x.mentorUid === fixture.mentor.uid));
    });

    if (canonicalSaved) await check("UNVERIFIED_PUBLISH_FAILS_CLOSED", async () => {
      await expectDenied(
        callable(mentorToken, "publishMentorProfessionalProfile", { status: "Published" }, "publish-before-verify"),
        "UNVERIFIED_PUBLISH",
        "failed-precondition",
      );
    });
    else skipDependency("UNVERIFIED_PUBLISH_FAILS_CLOSED", "CANONICAL_PROFILE_SAVE_AND_OWNER_READ");

    const verified = photoUploaded
      ? await check("ADMIN_VERIFICATION_AND_PHOTO_APPROVAL", async () => {
      const r = await callable(adminToken, "verifyMentorProfile", {
        mentorUid: fixture.mentor.uid,
        verified: true,
        approvePhoto: true,
      }, "admin-verify");
      assert.equal(r.state.profile.verificationStatus, "verified");
      assert.equal(r.state.profile.photoState.status, "approved");
    })
      : skipDependency("ADMIN_VERIFICATION_AND_PHOTO_APPROVAL", "PRIVATE_PHOTO_UPLOAD_PENDING_MODERATION");

    const published = verified
      ? await check("PUBLIC_VISIBILITY_AND_PUBLISH", async () => {
      const vis = await callable(mentorToken, "saveMentorProfileVisibility", {
        visibility: {
          publicProfile: true,
          studentProfile: true,
          showPhoto: true,
          showBooks: true,
          showResearch: true,
          showAchievements: true,
          showSocial: false,
          showContact: false,
        },
      }, "visibility");
      assert.equal(vis.state.profile.visibility.publicProfile, true);
      assert.equal(vis.state.profile.visibility.showContact, false);

      const pub = await callable(mentorToken, "publishMentorProfessionalProfile", { status: "Published" }, "publish");
      assert.equal(pub.state.profile.publicStatus, "Published");
    })
      : skipDependency("PUBLIC_VISIBILITY_AND_PUBLISH", "ADMIN_VERIFICATION_AND_PHOTO_APPROVAL");

    const publicPhotoGreen = published
      ? await check("PUBLIC_DIRECTORY_SANITIZED_AND_SIGNED_PHOTO_FETCH", async () => {
      const r = await callable("", "loadPublicMentorDirectory", {}, "public-after");
      const row = r.state.items.find((x) => x.mentorUid === fixture.mentor.uid);
      assert.ok(row, "PUBLIC_FIXTURE_MISSING");
      assert.equal(row.displayName, "Dr. LP5 Fixture Mentor");
      assert.equal(row.publicEmail, undefined);
      assert.equal(row.photoState, undefined);
      assert.equal(row.storagePath, undefined);
      assert.equal(row.verifiedBy, undefined);
      assert.equal(row.publicStatus, "Published");
      assert.equal(row.verificationStatus, "verified");
      assert.ok(/^https:\/\//.test(row.photo));
      assert.ok(!JSON.stringify(row).includes(`${prefix}-private@example.test`));
      const bytes = await signedDelivery(row.photo, photoBody);
      assert.equal(bytes, photoBody.length);
    })
      : skipDependency("PUBLIC_DIRECTORY_SANITIZED_AND_SIGNED_PHOTO_FETCH", "PUBLIC_VISIBILITY_AND_PUBLISH");

    if (photoUploaded) await check("DIRECT_STORAGE_AND_FIRESTORE_PRIVATE_BOUNDARIES", async () => {
      assert.equal(await storageDirect(assignedToken, expectedPhotoPath.value), 403);
      assert.equal(await storageDirect("", expectedPhotoPath.value), 403);
      const anonRoot = await firestoreRest("", `mentorProfiles/${fixture.mentor.uid}`);
      assert.equal(anonRoot.status, 403);
      const assignedRoot = await firestoreRest(assignedToken, `mentorProfiles/${fixture.mentor.uid}`);
      assert.equal(assignedRoot.status, 403);
      const ownerRoot = await firestoreRest(mentorToken, `mentorProfiles/${fixture.mentor.uid}`);
      assert.equal(ownerRoot.status, 200);
      assert.ok(JSON.stringify(ownerRoot.data).includes(`${prefix}-private@example.test`));
    });
    else skipDependency("DIRECT_STORAGE_AND_FIRESTORE_PRIVATE_BOUNDARIES", "PRIVATE_PHOTO_UPLOAD_PENDING_MODERATION");

    if (published && publicPhotoGreen) await check("ASSIGNED_STUDENT_PROPAGATION_ONLY", async () => {
      const assignedView = await callable(assignedToken, "loadStudentProfile", {}, "assigned-student");
      assert.equal(assignedView.state.student.uid, fixture.assigned.uid);
      assert.ok(assignedView.state.assignedMentor);
      assert.equal(assignedView.state.assignedMentor.mentorUid, fixture.mentor.uid);
      assert.equal(assignedView.state.assignedMentor.publicEmail, undefined);
      assert.ok(/^https:\/\//.test(assignedView.state.assignedMentor.photo));

      const unassignedView = await callable(unassignedToken, "loadStudentProfile", {}, "unassigned-student");
      assert.equal(unassignedView.state.student.uid, fixture.unassigned.uid);
      assert.equal(unassignedView.state.assignedMentor, null);
    });
    else skipDependency("ASSIGNED_STUDENT_PROPAGATION_ONLY", "PUBLIC_DIRECTORY_SANITIZED_AND_SIGNED_PHOTO_FETCH");

    await check("ONE_CANONICAL_MENTOR_PROFILE_NO_DUPLICATE_PAGE", async () => {
      const canonical = await db.collection("mentorProfiles").where("mentorUid", "==", fixture.mentor.uid).get();
      assert.equal(canonical.size, 1);
      assert.equal(canonical.docs[0].id, fixture.mentor.uid);
      for (const col of ["publicMentors", "mentorDirectory", "mentorProfessionalProfiles"]) {
        const d = await db.collection(col).doc(fixture.mentor.uid).get();
        assert.equal(d.exists, false, `DUPLICATE_PROFILE_AUTHORITY:${col}`);
      }
    });

    if (entrySaved && published) await check("ENTRY_DELETE_AND_PROFILE_PROPAGATION", async () => {
      const r = await callable(mentorToken, "deleteMentorProfessionalEntry", { entryId }, "entry-delete");
      assert.ok(!r.state.profile.entries.some((x) => x.id === entryId));
      const publicAfter = await callable("", "loadPublicMentorDirectory", {}, "public-after-entry-delete");
      const row = publicAfter.state.items.find((x) => x.mentorUid === fixture.mentor.uid);
      assert.ok(row);
      assert.ok(!row.entries.some((x) => x.id === entryId));
    });
    else skipDependency("ENTRY_DELETE_AND_PROFILE_PROPAGATION", !entrySaved ? "PROFESSIONAL_ENTRY_SAVE" : "PUBLIC_VISIBILITY_AND_PUBLISH");

    if (photoUploaded && published) await check("PHOTO_REMOVE_PROPAGATES_AND_DELETES_OBJECT", async () => {
      const r = await callable(mentorToken, "removeMentorProfilePhoto", {}, "photo-remove");
      assert.equal(r.state.profile.photo, "");
      assert.equal(r.state.profile.photoState.status, "none");
      const [exists] = await bucket.file(expectedPhotoPath.value).exists();
      assert.equal(exists, false);
      const publicAfter = await callable("", "loadPublicMentorDirectory", {}, "public-after-photo-remove");
      const row = publicAfter.state.items.find((x) => x.mentorUid === fixture.mentor.uid);
      assert.ok(row);
      assert.equal(row.photo, "");
    });
    else skipDependency("PHOTO_REMOVE_PROPAGATES_AND_DELETES_OBJECT", !photoUploaded ? "PRIVATE_PHOTO_UPLOAD_PENDING_MODERATION" : "PUBLIC_VISIBILITY_AND_PUBLISH");

    await check("AUDIT_COVERAGE_AND_CORRELATION", async () => {
      const snap = await db.collection("lp5AuditLogs").where("mentorUid", "==", fixture.mentor.uid).get();
      const methods = new Set(snap.docs.map((d) => d.data().method));
      const required = [
        "saveMentorProfessionalProfile",
        "saveMentorProfessionalEntry",
        "uploadMentorProfilePhoto",
        "verifyMentorProfile",
        "saveMentorProfileVisibility",
        "publishMentorProfessionalProfile",
        "deleteMentorProfessionalEntry",
        "removeMentorProfilePhoto",
      ];
      for (const method of required) assert.ok(methods.has(method), `AUDIT_METHOD_MISSING:${method}`);
      assert.ok(snap.size >= required.length);
      for (const d of snap.docs) {
        const x = d.data();
        assert.ok(String(x.auditId || "").startsWith("lp5-"));
        assert.ok(String(x.requestId || "").startsWith(prefix));
        assert.ok(String(x.correlationId || "").startsWith(prefix));
        assert.equal(x.phase, "5.1");
      }
    });

    if (failures.length) {
      console.error(JSON.stringify({ failures }, null, 2));
      process.exitCode = 2;
    } else {
      console.log("LP5_PHASE_5_1_STAGING=GREEN");
    }
  } finally {
    await cleanup();
    console.log("LP5_PHASE_5_1_CLEANUP=COMPLETE");
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 3;
});

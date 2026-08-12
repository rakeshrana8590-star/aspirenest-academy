"use strict";

const { randomUUID } = require("node:crypto");

const METHODS = Object.freeze({
  loadMentorProfessionalProfile: { role: "MENTOR_OR_ADMIN", action: "PROFILE_READ" },
  saveMentorProfessionalProfile: { role: "MENTOR_OR_ADMIN", action: "PROFILE_SAVE" },
  saveMentorProfessionalEntry: { role: "MENTOR_OR_ADMIN", action: "ENTRY_SAVE" },
  deleteMentorProfessionalEntry: { role: "MENTOR_OR_ADMIN", action: "ENTRY_DELETE" },
  saveMentorProfileVisibility: { role: "MENTOR_OR_ADMIN", action: "VISIBILITY_SAVE" },
  publishMentorProfessionalProfile: { role: "MENTOR_OR_ADMIN", action: "PROFILE_PUBLISH" },
  uploadMentorProfilePhoto: { role: "MENTOR_OR_ADMIN", action: "PHOTO_UPLOAD" },
  removeMentorProfilePhoto: { role: "MENTOR_OR_ADMIN", action: "PHOTO_REMOVE" },
  loadPublicMentorDirectory: { role: "PUBLIC", action: "PUBLIC_DIRECTORY" },
  verifyMentorProfile: { role: "ADMIN", action: "PROFILE_VERIFY" },
  loadStudentProfile: { role: "STUDENT_OR_ADMIN", action: "STUDENT_PROFILE_READ" },
});

const OWNER = "lp5MentorProfileService";
const PHASE = "5.1";
const ADMIN_EMAILS = new Set(["aspirenestplatform@gmail.com"]);

const clean = (value = "") => String(value ?? "").trim();
const cleanLower = (value = "") => clean(value).toLowerCase();
const cleanText = (value = "", max = 500) =>
  clean(value).replace(/\s+/g, " ").slice(0, max);
const asObject = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const asArray = (v) => Array.isArray(v) ? v : [];
const bool = (v) => v === true;
const nowMs = () => Date.now();

const makeError = (code, message, details = undefined) => {
  const err = new Error(message);
  err.lp5Code = code;
  if (details !== undefined) err.details = details;
  return err;
};

const sanitizeStringArray = (value, maxItems = 20, maxLen = 160) =>
  asArray(value).slice(0, maxItems).map((x) => cleanText(x, maxLen)).filter(Boolean);

const sanitizeSocial = (value = {}) => {
  const x = asObject(value);
  const out = {};
  for (const key of ["instagram","facebook","linkedin","youtube","website"]) {
    const v = cleanText(x[key], 500);
    if (v) out[key] = v;
  }
  return out;
};

const sanitizeVisibility = (value = {}) => {
  const x = asObject(value);
  return Object.freeze({
    publicProfile: bool(x.publicProfile),
    studentProfile: x.studentProfile !== false,
    showPhoto: bool(x.showPhoto),
    showBooks: x.showBooks !== false,
    showResearch: x.showResearch !== false,
    showAchievements: x.showAchievements !== false,
    showSocial: bool(x.showSocial),
    showContact: bool(x.showContact),
  });
};

const sanitizeEntry = (value = {}) => {
  const x = asObject(value);
  const id = cleanText(x.id, 160) || `mentor-entry-${randomUUID()}`;
  const type = cleanText(x.type || x.category || "Milestone", 80);
  const visibility = ["Public","Students","Private"].includes(clean(x.visibility))
    ? clean(x.visibility)
    : "Public";
  return Object.freeze({
    id,
    type,
    title: cleanText(x.title, 300),
    organization: cleanText(x.organization, 240),
    description: cleanText(x.description || x.copy, 1200),
    year: cleanText(x.year, 40),
    url: cleanText(x.url, 700),
    featured: bool(x.featured),
    visibility,
  });
};

const sanitizeProfessionalProfileInput = (value = {}) => {
  const x = asObject(value);
  return Object.freeze({
    id: cleanText(x.id, 160),
    slug: cleanText(x.slug, 180),
    displayName: cleanText(x.displayName || x.name, 200),
    shortName: cleanText(x.shortName, 120),
    headline: cleanText(x.headline || x.title, 300),
    bio: cleanText(x.bio || x.about, 3000),
    currentRole: cleanText(x.currentRole, 240),
    institution: cleanText(x.institution, 240),
    location: cleanText(x.location, 200),
    yearsExperience: cleanText(x.yearsExperience, 120),
    availability: cleanText(x.availability, 240),
    qualification: cleanText(x.qualification, 600),
    examExpertise: cleanText(x.examExpertise, 600),
    researchAreas: cleanText(x.researchAreas, 1200),
    recognition: cleanText(x.recognition, 800),
    digitalLearning: cleanText(x.digitalLearning, 800),
    qualifications: sanitizeStringArray(x.qualifications, 30, 240),
    roles: sanitizeStringArray(x.roles, 30, 240),
    publications: sanitizeStringArray(x.publications, 40, 300),
    books: sanitizeStringArray(x.books, 40, 300),
    courses: sanitizeStringArray(x.courses, 40, 300),
    talks: sanitizeStringArray(x.talks, 40, 300),
    awards: sanitizeStringArray(x.awards, 40, 300),
    languages: sanitizeStringArray(x.languages, 20, 120),
    strengths: sanitizeStringArray(x.strengths, 20, 160),
    publicEmail: cleanText(x.publicEmail, 320),
    bookingLabel: cleanText(x.bookingLabel || "Contact Mentor", 120),
    social: sanitizeSocial(x.social),
    visibility: sanitizeVisibility(x.visibility),
  });
};

const photoMetaForClient = (photo = {}, includePrivate = false) => {
  const x = asObject(photo);
  const out = {
    status: clean(x.status || "none"),
    contentType: clean(x.contentType),
    updatedAtMs: Number(x.updatedAtMs || 0),
  };
  if (includePrivate) out.storagePath = clean(x.storagePath);
  return out;
};

const baseProfileShape = (canonical = {}, mentorUid = "") => {
  const p = asObject(canonical.professionalProfile);
  return {
    mentorUid,
    id: clean(p.id || mentorUid),
    slug: cleanText(p.slug, 180),
    displayName: cleanText(p.displayName || p.name || canonical.displayName || canonical.name, 200),
    shortName: cleanText(p.shortName, 120),
    headline: cleanText(p.headline, 300),
    bio: cleanText(p.bio, 3000),
    currentRole: cleanText(p.currentRole, 240),
    institution: cleanText(p.institution, 240),
    location: cleanText(p.location, 200),
    yearsExperience: cleanText(p.yearsExperience, 120),
    availability: cleanText(p.availability, 240),
    qualification: cleanText(p.qualification, 600),
    examExpertise: cleanText(p.examExpertise, 600),
    researchAreas: cleanText(p.researchAreas, 1200),
    recognition: cleanText(p.recognition, 800),
    digitalLearning: cleanText(p.digitalLearning, 800),
    qualifications: sanitizeStringArray(p.qualifications, 30, 240),
    roles: sanitizeStringArray(p.roles, 30, 240),
    publications: sanitizeStringArray(p.publications, 40, 300),
    books: sanitizeStringArray(p.books, 40, 300),
    courses: sanitizeStringArray(p.courses, 40, 300),
    talks: sanitizeStringArray(p.talks, 40, 300),
    awards: sanitizeStringArray(p.awards, 40, 300),
    languages: sanitizeStringArray(p.languages, 20, 120),
    strengths: sanitizeStringArray(p.strengths, 20, 160),
    publicEmail: cleanText(p.publicEmail, 320),
    bookingLabel: cleanText(p.bookingLabel || "Contact Mentor", 120),
    social: sanitizeSocial(p.social),
    visibility: sanitizeVisibility(p.visibility),
    entries: asArray(p.entries).map(sanitizeEntry).filter((e) => e.title),
    publicStatus: clean(p.publicStatus || "Draft"),
    verificationStatus: clean(p.verificationStatus || "unverified"),
    verifiedAtMs: Number(p.verifiedAtMs || 0),
    version: Math.max(1, Number(p.version || 1)),
    updatedAtMs: Number(p.updatedAtMs || 0),
  };
};

const signedPhotoUrl = async ({ professional = {}, storage = null, now = nowMs } = {}) => {
  const photo = asObject(professional.photo);
  if (!storage || !clean(photo.storagePath)) return "";
  try {
    const [url] = await storage.bucket().file(clean(photo.storagePath)).getSignedUrl({
      action: "read",
      expires: Number(now()) + 10 * 60 * 1000,
    });
    return clean(url);
  } catch (_) {
    return "";
  }
};

const publicProjection = async ({
  mentorUid,
  canonical = {},
  storage = null,
  now = nowMs,
  audience = "public",
} = {}) => {
  const professional = asObject(canonical.professionalProfile);
  const visibility = sanitizeVisibility(professional.visibility);
  const isPublished = clean(professional.publicStatus) === "Published";
  const isVerified = clean(professional.verificationStatus) === "verified";
  const isVisible =
    isPublished &&
    isVerified &&
    (audience === "student" ? visibility.studentProfile : visibility.publicProfile);

  if (!isVisible) return null;

  const full = baseProfileShape(canonical, mentorUid);
  const out = {
    mentorUid,
    id: full.id,
    slug: full.slug,
    displayName: full.displayName,
    shortName: full.shortName,
    headline: full.headline,
    bio: full.bio,
    currentRole: full.currentRole,
    institution: full.institution,
    location: full.location,
    yearsExperience: full.yearsExperience,
    availability: full.availability,
    qualification: full.qualification,
    examExpertise: full.examExpertise,
    researchAreas: visibility.showResearch ? full.researchAreas : "",
    recognition: visibility.showAchievements ? full.recognition : "",
    digitalLearning: full.digitalLearning,
    qualifications: full.qualifications,
    roles: full.roles,
    languages: full.languages,
    strengths: full.strengths,
    publicStatus: "Published",
    verificationStatus: "verified",
    visibility,
    entries: full.entries.filter((entry) => {
      if (entry.visibility === "Private") return false;
      if (audience === "public" && entry.visibility === "Students") return false;
      if (entry.type === "Book" && !visibility.showBooks) return false;
      if (["Research","Publication"].includes(entry.type) && !visibility.showResearch) return false;
      if (["Achievement","Certification"].includes(entry.type) && !visibility.showAchievements) return false;
      return true;
    }),
  };

  if (visibility.showBooks) out.books = full.books;
  if (visibility.showResearch) out.publications = full.publications;
  if (visibility.showAchievements) {
    out.awards = full.awards;
    out.talks = full.talks;
    out.courses = full.courses;
  }
  if (visibility.showSocial) out.social = full.social;
  if (visibility.showContact) {
    out.publicEmail = full.publicEmail;
    out.bookingLabel = full.bookingLabel;
  }

  const photo = asObject(professional.photo);
  if (visibility.showPhoto && clean(photo.status) === "approved") {
    const url = await signedPhotoUrl({ professional, storage, now });
    if (url) out.photo = url;
  } else {
    out.photo = "";
  }

  return Object.freeze(out);
};

const fullProfileProjection = async ({
  canonical = {},
  mentorUid = "",
  storage = null,
  now = nowMs,
} = {}) => {
  const full = baseProfileShape(canonical, mentorUid);
  const professional = asObject(canonical.professionalProfile);
  const url = await signedPhotoUrl({ professional, storage, now });
  return Object.freeze({
    ...full,
    photo: url,
    photoState: photoMetaForClient(professional.photo, true),
  });
};

const resolveRole = async ({ firestore, auth }) => {
  if (!auth || !clean(auth.uid)) return Object.freeze({ authenticated:false, uid:"", email:"", role:"public" });
  const uid = clean(auth.uid);
  const email = cleanLower(auth.token && auth.token.email);
  if (ADMIN_EMAILS.has(email)) return Object.freeze({ authenticated:true, uid, email, role:"admin" });
  const snap = await firestore.collection("roleAuthorities").doc(uid).get();
  const data = snap.exists ? asObject(snap.data()) : {};
  const status = clean(data.accountStatus || "active");
  const role = status === "active" ? cleanLower(data.activeRole || data.role) : "";
  return Object.freeze({ authenticated:true, uid, email, role: role || "unknown" });
};

const requireRole = (principal, roleSpec) => {
  if (roleSpec === "PUBLIC") return;
  if (!principal.authenticated) throw makeError("UNAUTHENTICATED", "Sign-in is required.");
  if (roleSpec === "ADMIN" && principal.role !== "admin") throw makeError("FORBIDDEN", "Admin authority is required.");
  if (roleSpec === "MENTOR_OR_ADMIN" && !["mentor","admin"].includes(principal.role)) throw makeError("FORBIDDEN", "Mentor authority is required.");
  if (roleSpec === "STUDENT_OR_ADMIN" && !["student","admin"].includes(principal.role)) throw makeError("FORBIDDEN", "Student authority is required.");
};

const targetMentorUid = (principal, payload = {}) =>
  principal.role === "admin" && clean(payload.mentorUid)
    ? clean(payload.mentorUid)
    : principal.uid;

const audit = async ({
  firestore, serverTimestamp, principal, method, mentorUid = "", subjectUid = "",
  details = {}, meta = {},
}) => {
  const requestId = clean(meta.requestId || meta.operationId) || randomUUID();
  const correlationId = clean(meta.correlationId) || requestId;
  const id = `lp5-${randomUUID()}`;
  await firestore.collection("lp5AuditLogs").doc(id).set({
    auditId: id,
    phase: PHASE,
    method,
    action: METHODS[method] && METHODS[method].action || method,
    actorUid: principal.uid || null,
    actorRole: principal.role || "public",
    mentorUid: mentorUid || null,
    subjectUid: subjectUid || null,
    requestId,
    correlationId,
    details: asObject(details),
    createdAt: serverTimestamp(),
  });
  return Object.freeze({ auditId:id, requestId, correlationId });
};

const loadCanonicalMentor = async (firestore, mentorUid) => {
  const snap = await firestore.collection("mentorProfiles").doc(mentorUid).get();
  return snap.exists ? { id:snap.id, ...(snap.data() || {}) } : null;
};

const assertMentorCanonical = (canonical, mentorUid) => {
  if (!canonical) throw makeError("NOT_FOUND", "Mentor profile is unavailable.");
  if (clean(canonical.mentorUid) && clean(canonical.mentorUid) !== mentorUid) {
    throw makeError("FAILED_PRECONDITION", "Mentor canonical identity is invalid.");
  }
  if (cleanLower(canonical.role || "mentor") !== "mentor") {
    throw makeError("FAILED_PRECONDITION", "Mentor canonical role is invalid.");
  }
};

const writeProfessional = async ({
  firestore, serverTimestamp, mentorUid, canonical, nextProfessional,
}) => {
  const version = Math.max(1, Number(asObject(canonical.professionalProfile).version || 0) + 1);
  const updatedAtMs = nowMs();
  const profile = {
    ...asObject(canonical.professionalProfile),
    ...nextProfessional,
    id: clean(asObject(nextProfessional).id || asObject(canonical.professionalProfile).id || mentorUid),
    version,
    updatedAtMs,
  };
  await firestore.collection("mentorProfiles").doc(mentorUid).set({
    mentorUid,
    role: "mentor",
    professionalProfile: profile,
    professionalProfileUpdatedAt: serverTimestamp(),
  }, { merge:true });
  return profile;
};

const createLp5MentorProfileAuthority = ({
  firestore,
  storage,
  serverTimestamp,
  now = nowMs,
} = {}) => {
  if (!firestore || !storage || typeof serverTimestamp !== "function") {
    throw new TypeError("LP5 mentor profile authority dependencies are incomplete.");
  }

  async function operation(auth, data = {}) {
    const request = asObject(data);
    const method = clean(request.method);
    const payload = asObject(request.payload);
    const meta = asObject(request.meta);
    const policy = METHODS[method];
    if (!policy) throw makeError("INVALID_REQUEST", "LP5 method is not allowed.");

    const principal = await resolveRole({ firestore, auth });
    requireRole(principal, policy.role);

    if (method === "loadPublicMentorDirectory") {
      const snap = await firestore.collection("mentorProfiles").get();
      const items = [];
      for (const doc of snap.docs) {
        const canonical = { id:doc.id, ...(doc.data() || {}) };
        const projection = await publicProjection({
          mentorUid: doc.id, canonical, storage, now, audience:"public",
        });
        if (projection) items.push(projection);
      }
      items.sort((a,b) => String(a.name).localeCompare(String(b.name)));
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ items } });
    }

    if (method === "loadStudentProfile") {
      const studentUid = principal.role === "admin" && clean(payload.studentUid)
        ? clean(payload.studentUid)
        : principal.uid;
      const studentSnap = await firestore.collection("students").doc(studentUid).get();
      const userSnap = await firestore.collection("users").doc(studentUid).get();
      const student = {
        uid: studentUid,
        ...(userSnap.exists ? userSnap.data() || {} : {}),
        ...(studentSnap.exists ? studentSnap.data() || {} : {}),
      };
      const safeStudent = {
        uid: studentUid,
        displayName: cleanText(student.displayName || student.name, 200),
        email: cleanLower(student.email),
        username: cleanText(student.username, 80),
      };

      let mentorProjection = null;
      const defaultSnap = await firestore.collection("platformSettings").doc("defaultMentor").get();
      if (defaultSnap.exists) {
        const defaultData = asObject(defaultSnap.data());
        const mentorUid = clean(defaultData.mentorUid);
        if (mentorUid) {
          const link = await firestore.collection("mentorProfiles").doc(mentorUid).collection("students").doc(studentUid).get();
          if (link.exists && cleanLower(asObject(link.data()).status) === "active") {
            const canonical = await loadCanonicalMentor(firestore, mentorUid);
            mentorProjection = canonical ? await publicProjection({
              mentorUid, canonical, storage, now, audience:"student",
            }) : null;
          }
        }
      }

      return Object.freeze({
        ok:true, phase:PHASE, method,
        state:{ student:safeStudent, assignedMentor:mentorProjection },
      });
    }

    const mentorUid = targetMentorUid(principal, payload);
    let canonical = await loadCanonicalMentor(firestore, mentorUid);
    assertMentorCanonical(canonical, mentorUid);

    if (method === "loadMentorProfessionalProfile") {
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical, mentorUid, storage, now }) } });
    }

    if (method === "verifyMentorProfile") {
      const current = asObject(canonical.professionalProfile);
      const verify = payload.verified !== false;
      const photo = asObject(current.photo);
      const nextPhoto = payload.approvePhoto === true && clean(photo.storagePath)
        ? { ...photo, status:"approved", moderatedBy:principal.uid, moderatedAtMs:Number(now()) }
        : photo;
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{
          verificationStatus: verify ? "verified" : "rejected",
          verifiedAtMs: Number(now()),
          verifiedBy: principal.uid,
          photo: nextPhoto,
        },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid,
        details:{ verified:verify, photoStatus:clean(nextPhoto.status) }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    if (principal.role !== "admin" && principal.uid !== mentorUid) {
      throw makeError("FORBIDDEN", "Mentor can only change the own canonical profile.");
    }

    const current = asObject(canonical.professionalProfile);

    if (method === "saveMentorProfessionalProfile") {
      const input = sanitizeProfessionalProfileInput(payload.profile || payload);
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{
          ...input,
          publicStatus: clean(current.publicStatus || "Draft"),
          verificationStatus: clean(current.verificationStatus || "unverified"),
          verifiedAtMs: Number(current.verifiedAtMs || 0),
          verifiedBy: clean(current.verifiedBy),
          entries: asArray(current.entries).map(sanitizeEntry),
          photo: asObject(current.photo),
        },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid,
        details:{ fields:Object.keys(input).sort() }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    if (method === "saveMentorProfessionalEntry") {
      const entry = sanitizeEntry(payload.entry || payload);
      if (!entry.title) throw makeError("INVALID_REQUEST", "Professional entry title is required.");
      const entries = asArray(current.entries).map(sanitizeEntry);
      const index = entries.findIndex((x) => x.id === entry.id);
      if (index >= 0) entries[index] = entry;
      else entries.unshift(entry);
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{ entries: entries.slice(0,100) },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid, details:{ entryId:entry.id }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    if (method === "deleteMentorProfessionalEntry") {
      const entryId = clean(payload.entryId);
      if (!entryId) throw makeError("INVALID_REQUEST", "Professional entry id is required.");
      const entries = asArray(current.entries).map(sanitizeEntry).filter((x) => x.id !== entryId);
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{ entries },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid, details:{ entryId }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    if (method === "saveMentorProfileVisibility") {
      const visibility = sanitizeVisibility(payload.visibility);
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{ visibility },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid, details:{ visibility }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    if (method === "publishMentorProfessionalProfile") {
      const requested = clean(payload.status || "Published");
      if (!["Published","Draft"].includes(requested)) throw makeError("INVALID_REQUEST", "Profile publication state is invalid.");
      if (requested === "Published" && clean(current.verificationStatus) !== "verified") {
        throw makeError("FAILED_PRECONDITION", "Mentor profile must be verified before publication.");
      }
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{ publicStatus:requested },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid, details:{ status:requested }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    if (method === "uploadMentorProfilePhoto") {
      const file = asObject(payload.file);
      const contentType = cleanLower(file.contentType || file.type);
      if (!["image/jpeg","image/png","image/webp"].includes(contentType)) {
        throw makeError("INVALID_REQUEST", "Mentor profile photo must be JPEG, PNG or WebP.");
      }
      const b64 = clean(file.base64);
      let bytes;
      try { bytes = Buffer.from(b64, "base64"); } catch (_) { bytes = Buffer.alloc(0); }
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
        throw makeError("INVALID_REQUEST", "Mentor profile photo is empty or too large.");
      }
      const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      const storagePath = `mentor-professional/${mentorUid}/profile.${ext}`;
      await storage.bucket().file(storagePath).save(bytes, {
        resumable:false,
        metadata:{
          contentType,
          metadata:{
            aspirenestOwnerUid: mentorUid,
            moderationState:"pending_review",
          },
        },
      });
      const photo = {
        storagePath,
        status:"pending_review",
        contentType,
        size:bytes.length,
        updatedAtMs:Number(now()),
      };
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{ photo, visibility:{ ...sanitizeVisibility(current.visibility), showPhoto:false } },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid,
        details:{ contentType, size:bytes.length, status:"pending_review" }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    if (method === "removeMentorProfilePhoto") {
      const photo = asObject(current.photo);
      if (clean(photo.storagePath)) {
        try { await storage.bucket().file(clean(photo.storagePath)).delete({ ignoreNotFound:true }); } catch (_) {}
      }
      const next = await writeProfessional({
        firestore, serverTimestamp, mentorUid, canonical,
        nextProfessional:{ photo:{ status:"none", updatedAtMs:Number(now()) }, visibility:{ ...sanitizeVisibility(current.visibility), showPhoto:false } },
      });
      await audit({ firestore, serverTimestamp, principal, method, mentorUid, details:{ removed:true }, meta });
      return Object.freeze({ ok:true, phase:PHASE, method, state:{ profile:await fullProfileProjection({ canonical:{ ...canonical, professionalProfile:next }, mentorUid, storage, now }) } });
    }

    throw makeError("INVALID_REQUEST", "LP5 mentor profile method is not implemented.");
  }

  return Object.freeze({ operation });
};

module.exports = Object.freeze({
  METHODS,
  OWNER,
  PHASE,
  sanitizeVisibility,
  sanitizeEntry,
  sanitizeProfessionalProfileInput,
  publicProjection,
  baseProfileShape,
  fullProfileProjection,
  createLp5MentorProfileAuthority,
});

"use strict";

const METHOD_POLICIES = Object.freeze({
  loadMentorProfessionalProfile: { owner:"lp5MentorProfileService", phase:"5.1", action:"PROFILE_READ" },
  saveMentorProfessionalProfile: { owner:"lp5MentorProfileService", phase:"5.1", action:"PROFILE_SAVE" },
  saveMentorProfessionalEntry: { owner:"lp5MentorProfileService", phase:"5.1", action:"ENTRY_SAVE" },
  deleteMentorProfessionalEntry: { owner:"lp5MentorProfileService", phase:"5.1", action:"ENTRY_DELETE" },
  saveMentorProfileVisibility: { owner:"lp5MentorProfileService", phase:"5.1", action:"VISIBILITY_SAVE" },
  publishMentorProfessionalProfile: { owner:"lp5MentorProfileService", phase:"5.1", action:"PROFILE_PUBLISH" },
  uploadMentorProfilePhoto: { owner:"lp5MentorProfileService", phase:"5.1", action:"PHOTO_UPLOAD" },
  removeMentorProfilePhoto: { owner:"lp5MentorProfileService", phase:"5.1", action:"PHOTO_REMOVE" },
  loadPublicMentorDirectory: { owner:"lp5MentorProfileService", phase:"5.1", action:"PUBLIC_DIRECTORY" },
  verifyMentorProfile: { owner:"lp5MentorProfileService", phase:"5.1", action:"PROFILE_VERIFY" },
  loadStudentProfile: { owner:"lp5MentorProfileService", phase:"5.1", action:"STUDENT_PROFILE_READ" },
});

const clean = (v = "") => String(v ?? "").trim();
const asObject = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const randomId = () => {
  if (typeof crypto !== "undefined" && crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `lp5-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const fileToPayload = async (file) => {
  if (!file || typeof file !== "object") {
    return null;
  }

  if (
    typeof file.arrayBuffer === "function"
  ) {
    const bytes = new Uint8Array(
      await file.arrayBuffer()
    );
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(
        ...bytes.subarray(i, i + chunk)
      );
    }
    return Object.freeze({
      name: clean(file.name),
      contentType: clean(file.type),
      size: bytes.length,
      base64: btoa(binary),
    });
  }

  const x = asObject(file);
  if (clean(x.base64)) {
    return Object.freeze({
      name: clean(x.name),
      contentType: clean(x.contentType || x.type),
      size: Number(x.size || 0),
      base64: clean(x.base64),
    });
  }

  return null;
};

function createLp5MentorProfileProductionService(deps = {}) {
  if (typeof deps.invokeAcademyOperation !== "function") {
    throw new TypeError("LP5 mentor profile dependency missing: invokeAcademyOperation");
  }

  async function invoke(method, payload = {}, context = {}) {
    const policy = METHOD_POLICIES[method];
    if (!policy) {
      return Object.freeze({
        ok:false,
        code:"LP5_METHOD_NOT_ALLOWED",
        method,
      });
    }

    const input = { ...asObject(payload) };

    if (method === "uploadMentorProfilePhoto") {
      const prepared = await fileToPayload(input.file);
      if (!prepared) {
        return Object.freeze({
          ok:false,
          code:"LP5_PHOTO_FILE_INVALID",
          method,
        });
      }
      input.file = prepared;
    }

    const requestId =
      clean(asObject(context).requestId) ||
      randomId();
    const correlationId =
      clean(asObject(context).correlationId) ||
      requestId;

    return deps.invokeAcademyOperation({
      method,
      payload: input,
      meta: {
        requestId,
        correlationId,
        owner: policy.owner,
        clientPhase: policy.phase,
      },
    });
  }

  return Object.freeze({ invoke });
}

module.exports = Object.freeze({
  METHOD_POLICIES,
  fileToPayload,
  createLp5MentorProfileProductionService,
});

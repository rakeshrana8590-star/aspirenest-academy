"use strict";

const CODES = Object.freeze({
  INVALID_REQUEST: "ACCESS_INVALID_REQUEST",
  LOGIN_REQUIRED: "ACCESS_LOGIN_REQUIRED",
  ADMIN_REQUIRED: "ACCESS_ADMIN_REQUIRED",
  STUDENT_REQUIRED: "ACCESS_STUDENT_REQUIRED",
  MENTOR_REQUIRED: "ACCESS_MENTOR_REQUIRED",
  RESOURCE_REQUIRED: "ACCESS_RESOURCE_REQUIRED",
  WRITE_FAILED: "ACCESS_WRITE_FAILED",
  READ_FAILED: "ACCESS_READ_FAILED",
  OK: "ACCESS_OK",
});

const ADMIN_ROLES = new Set(["admin", "super_admin", "owner"]);
const SCOPES = new Set(["plan", "module", "bundle", "item"]);

const clean = (value = "") => String(value ?? "").trim();
const email = (value = "") => clean(value).toLowerCase();
const asObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const scope = (value = "item") => {
  const normalized = clean(value || "item").toLowerCase();
  if (!SCOPES.has(normalized)) throw new Error("Invalid access scope.");
  return normalized;
};

const RESOURCE_BINDINGS = Object.freeze({
  note: Object.freeze({ module: "notes", itemType: "notesPdf" }),
  video: Object.freeze({ module: "video", itemType: "video" }),
  test: Object.freeze({ module: "mockTest", itemType: "mockTest" }),
  "current-affairs": Object.freeze({ module: "currentAffairs", itemType: "currentAffairsPdf" }),
  roadmap: Object.freeze({ module: "roadmap", itemType: "roadmap" }),
  live: Object.freeze({ module: "video", itemType: "video" }),
  replay: Object.freeze({ module: "video", itemType: "video" }),
});

const ok = (fields = {}) => Object.freeze({ ok: true, state: "success", code: CODES.OK, ...fields });
const failure = (code, message) => Object.freeze({ ok: false, state: "error", code, message });

function createAccessProductionService(deps = {}) {
  const required = [
    "getAuthoritativeSession",
    "getCanonicalResource",
    "resolveVerifiedAccessUserByEmail",
    "createManualAccess",
    "createBulkAccessImportPlan",
    "executeBulkAccessImport",
    "rollbackBulkAccessImport",
    "createAccessProduct",
    "updateAccessProduct",
    "listAccessProducts",
    "createAccessKey",
    "regenerateAccessKey",
    "redeemAccessKeyFoundation",
    "createAccessInvite",
    "regenerateAccessInviteLink",
    "redeemAccessInvite",
    "createStudentAccessRequest",
    "createMentorAccessRequest",
    "listAccessRequests",
    "updateAccessRequest",
    "approveAccessRequest",
    "extendAccess",
    "revokeAccess",
    "restoreAccess",
    "loadStudentAccessWorkspace",
  ];
  for (const name of required) {
    if (typeof deps[name] !== "function") throw new TypeError(`Access production dependency is missing: ${name}`);
  }

  const session = async () => {
    const value = asObject(await deps.getAuthoritativeSession());
    if (value.authenticated !== true || !clean(value.uid)) throw Object.assign(new Error("Sign in is required."), { accessCode: CODES.LOGIN_REQUIRED });
    return value;
  };
  const admin = async () => {
    const value = await session();
    if (!ADMIN_ROLES.has(clean(value.role).toLowerCase())) throw Object.assign(new Error("Admin access is required."), { accessCode: CODES.ADMIN_REQUIRED });
    return value;
  };
  const student = async () => {
    const value = await session();
    if (clean(value.role).toLowerCase() !== "student") throw Object.assign(new Error("Student access is required."), { accessCode: CODES.STUDENT_REQUIRED });
    return value;
  };
  const mentor = async () => {
    const value = await session();
    if (clean(value.role).toLowerCase() !== "mentor") throw Object.assign(new Error("Mentor access is required."), { accessCode: CODES.MENTOR_REQUIRED });
    return value;
  };
  const actor = (value) => ({ uid: clean(value.uid), email: email(value.email), role: clean(value.role).toLowerCase(), isAdmin: ADMIN_ROLES.has(clean(value.role).toLowerCase()) });

  const canonical = async (resourceId, resourceTypeHint = "") => {
    const result = asObject(await deps.getCanonicalResource({ resourceId: clean(resourceId), resourceTypeHint: clean(resourceTypeHint) }));
    if (result.ok !== true || result.state !== "canonical_record" || !result.resource) throw Object.assign(new Error("Exact canonical resource is required."), { accessCode: CODES.RESOURCE_REQUIRED });
    return result.resource;
  };

  const grantTarget = async (payload = {}) => {
    const request = asObject(payload);
    const requestedScope = scope(request.scopeType || request.scope || "item");
    const target = clean(request.target || request.itemId || request.bundleId || request.module || request.planType || "");
    const result = { scopeType: requestedScope, course: "CTET_TET" };
    if (requestedScope === "item") {
      const resource = await canonical(target, request.resourceType || "");
      const binding = RESOURCE_BINDINGS[clean(resource.resourceType || resource.type).toLowerCase()] || {};
      Object.assign(result, {
        itemId: clean(resource.resourceId || target),
        itemType: clean(resource.itemType || binding.itemType),
        module: clean(resource.moduleKey || resource.module || binding.module),
        itemTitle: clean(resource.title),
        planType: clean(resource.requiredPlan || "FREE").toUpperCase(),
      });
    } else if (requestedScope === "module") {
      result.module = target;
      result.planType = clean(request.planType || "FREE").toUpperCase();
    } else if (requestedScope === "bundle") {
      result.bundleId = target;
      result.itemIds = Array.isArray(request.itemIds) ? request.itemIds.map(clean).filter(Boolean) : [];
      result.planType = clean(request.planType || "FREE").toUpperCase();
    } else {
      result.planType = clean(target || request.planType || "FREE").toUpperCase();
    }
    return result;
  };

  const safeCall = async (fn) => {
    try { return await fn(); }
    catch (error) { return failure(error && error.accessCode ? error.accessCode : CODES.WRITE_FAILED, String(error && error.message || "Access operation failed.")); }
  };

  const saveAccessGrant = (payload) => safeCall(async () => {
    const adminSession = await admin();
    const request = asObject(payload);
    const learnerEmail = email(request.learnerEmail || request.email);
    const learnerUid = clean(request.learnerUid || request.uid);
    if (!learnerEmail) throw new Error("Verified learner email is required.");
    const resolvedIdentity = await deps.resolveVerifiedAccessUserByEmail(learnerEmail);
    if (learnerUid && learnerUid !== clean(resolvedIdentity.uid)) {
      throw new Error("Learner UID and verified email resolve to different identities.");
    }
    const identity = {
      uid: clean(resolvedIdentity.uid),
      email: email(resolvedIdentity.email || learnerEmail),
      displayName: clean(resolvedIdentity.displayName || request.learnerName),
    };
    if (!identity.uid || !identity.email) throw new Error("Verified learner UID and email are required.");
    const target = await grantTarget(request);
    const record = await deps.createManualAccess({
      ...target,
      uid: identity.uid,
      email: identity.email,
      learnerName: identity.displayName || clean(request.learnerName),
      source: clean(request.source || "admin_manual").toLowerCase(),
      status: "active",
      accessFrom: request.accessFrom || null,
      accessUntil: request.expiresAt || request.accessUntil || null,
      noExpiry: !(request.expiresAt || request.accessUntil),
      validityMode: (request.expiresAt || request.accessUntil) ? "CUSTOM_WINDOW" : "NO_EXPIRY",
      adminNote: clean(request.reason || request.adminNote),
      actor: actor(adminSession),
    });
    return ok({ grant: record, accessId: record.id });
  });

  const saveAccessProduct = (payload) => safeCall(async () => {
    const adminSession = await admin();
    const request = asObject(payload);
    const requestedScope = scope(request.scopeType || request.productType || request.scope || "plan");
    const target = clean(request.target || request.code || "");
    const common = {
      id: clean(request.id),
      title: clean(request.name || request.title || "Access Product"),
      scopeType: requestedScope,
      course: "CTET_TET",
      price: Number(request.price || 0),
      salePrice: Number(request.discountPrice || request.salePrice || request.price || 0),
      validityDays: Number(request.validity || request.validityDays || 0),
      status: clean(request.productStatus || request.status || "draft").toLowerCase(),
      actor: actor(adminSession),
    };
    if (requestedScope === "plan") common.planType = clean(target || request.planType || "FREE").toUpperCase();
    if (requestedScope === "module") common.module = target;
    if (requestedScope === "bundle") { common.bundleId = target; common.itemIds = Array.isArray(request.resourceIds) ? request.resourceIds : []; }
    if (requestedScope === "item") Object.assign(common, await grantTarget({ scopeType: "item", target }));
    const result = clean(request.id) ? await deps.updateAccessProduct(clean(request.id), common) : await deps.createAccessProduct(common);
    return ok({ product: result });
  });

  return Object.freeze({
    saveAccessGrant,
    extendAccessGrant: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); return ok({ grant: await deps.extendAccess(clean(p.grantId), p.until || p.accessUntil, actor(s), { reason: clean(p.reason) }) }); }),
    revokeAccessGrant: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); return ok({ grant: await deps.revokeAccess(clean(p.grantId), actor(s), { reason: clean(p.reason) }) }); }),
    restoreAccessGrant: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); return ok({ grant: await deps.restoreAccess(clean(p.grantId), actor(s), { reason: clean(p.reason) }) }); }),
    previewBulkAccess: (payload) => safeCall(async () => {
      const s = await admin(); const p = asObject(payload); const rows = Array.isArray(p.rows) ? p.rows : [];
      const target = await grantTarget(asObject(p.values));
      const planned = rows.map((row, index) => ({ rowId: `${clean(p.batchId || "bulk") || "bulk"}__${index + 1}`, rowNumber: index + 1, original: clean(row.learner || row.email), email: email(row.email || row.learner), status: clean(row.decision).toUpperCase() === "VALID" ? "valid" : clean(row.decision).toLowerCase(), reason: clean(row.detail), processable: clean(row.decision).toUpperCase() === "VALID" }));
      const importId = clean(p.batchId || `bulk_${Date.now()}`);
      const plan = await deps.createBulkAccessImportPlan({ importId, rows: planned, grantData: { ...target, source: "bulk_import", accessUntil: p.values && p.values.expiresAt || null, noExpiry: !(p.values && p.values.expiresAt), validityMode: p.values && p.values.expiresAt ? "CUSTOM_WINDOW" : "NO_EXPIRY" }, actor: actor(s), sendInvite: false, metadata: { source: "v26_access_manager" } });
      return ok({ batchId: importId, preview: plan });
    }),
    applyBulkAccess: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); const result = await deps.executeBulkAccessImport({ importId: clean(p.batchId), actor: actor(s) }); return ok({ batchId: clean(p.batchId), result }); }),
    rollbackBulkAccessBatch: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); const result = await deps.rollbackBulkAccessImport({ importId: clean(p.batchId), reason: clean(p.reason), actor: actor(s) }); return ok({ batchId: clean(p.batchId), result }); }),
    saveAccessProduct,
    saveAccessBundle: (payload) => saveAccessProduct({ ...asObject(payload), id: clean(payload && payload.bundleId), name: clean(payload && payload.bundleId) || "Access Bundle", scopeType: "bundle", target: clean(payload && payload.bundleId), resourceIds: Array.isArray(payload && payload.resourceIds) ? payload.resourceIds : [] }),
    saveAccessKey: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); const target = await grantTarget({ ...p, scopeType: p.scope }); const key = await deps.createAccessKey({ ...target, code: clean(p.code), assignedEmail: email(p.assignedEmail), maxUses: Number(p.redemptions || p.maxUses || 1), expiresAt: p.expiry || null, actor: actor(s) }); return ok({ key }); }),
    regenerateAccessKey: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); return ok(await deps.regenerateAccessKey({ keyId: clean(p.keyId), code: clean(p.code), actor: actor(s) })); }),
    redeemAccessKey: (payload) => safeCall(async () => { const s = await student(); const p = asObject(payload); const grant = await deps.redeemAccessKeyFoundation({ code: clean(p.code), uid: clean(s.uid), email: email(s.email), learnerName: clean(s.displayName) }); return ok({ grant }); }),
    saveAccessInvite: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); const identity = await deps.resolveVerifiedAccessUserByEmail(email(p.email)); const target = await grantTarget({ ...p, scopeType: p.scope }); const pendingGrant = await deps.createManualAccess({ ...target, uid: identity.uid, email: identity.email, learnerName: identity.displayName, source: "invite", status: "pending", accessFrom: null, accessUntil: p.expiry || null, noExpiry: !(p.expiry), validityMode: p.expiry ? "CUSTOM_WINDOW" : "NO_EXPIRY", adminNote: `Pending invite ${clean(p.inviteCode)}`, actor: actor(s) }); const invite = await deps.createAccessInvite({ ...target, email: identity.email, uid: identity.uid, name: identity.displayName, accessId: pendingGrant.id, inviteCode: clean(p.inviteCode), inviteLink: clean(p.inviteLink), expiresAt: p.expiry || null, actor: actor(s) }); return ok({ invite, pendingGrantId: pendingGrant.id }); }),
    regenerateAccessInvite: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); return ok(await deps.regenerateAccessInviteLink(clean(p.inviteId), actor(s), { source: "v26_access_manager" })); }),
    redeemAccessInvite: (payload) => safeCall(async () => { const s = await student(); const p = asObject(payload); const result = await deps.redeemAccessInvite(clean(p.inviteCode || p.code), { uid: clean(s.uid), email: email(s.email), learnerName: clean(s.displayName) }); return ok({ grant: result, accessId: result.accessId }); }),
    createStudentAccessRequest: (payload) => safeCall(async () => { const s = await student(); const p = asObject(payload); const resource = await canonical(p.resourceId); const requestedScope = scope(p.scope); const binding = RESOURCE_BINDINGS[clean(resource.resourceType || resource.type).toLowerCase()] || {}; let target = requestedScope === "item" ? clean(resource.resourceId) : requestedScope === "module" ? clean(resource.moduleKey || binding.module) : requestedScope === "plan" ? clean(resource.requiredPlan || "FREE").toUpperCase() : clean(p.target); let itemIds = []; if (requestedScope === "bundle") { const products = await deps.listAccessProducts({ maxCount: 500 }); const bundle = products.find((item) => clean(item.bundleId || item.id) === target && clean(item.scopeType).toLowerCase() === "bundle" && Array.isArray(item.itemIds) && item.itemIds.map(clean).includes(clean(resource.resourceId))); if (!bundle) throw new Error("Requested bundle does not contain the selected resource."); itemIds = bundle.itemIds.map(clean).filter(Boolean); target = clean(bundle.bundleId || bundle.id); } if (!target) throw new Error("Requested scope target could not be resolved."); const request = await deps.createStudentAccessRequest({ uid: clean(s.uid), email: email(s.email), resource: { ...resource, moduleKey: resource.moduleKey || binding.module, itemType: resource.itemType || binding.itemType }, scopeType: requestedScope, target, itemIds, reason: clean(p.reason), message: clean(p.message), targetExam: clean(p.targetExam) }); return ok({ request }); }),
    createMentorAccessRequest: (payload) => safeCall(async () => { const s = await mentor(); const p = asObject(payload); const resource = await canonical(p.resourceId); const binding = RESOURCE_BINDINGS[clean(resource.resourceType || resource.type).toLowerCase()] || {}; let studentUid = clean(p.studentUid); if (!studentUid && p.learnerEmail) studentUid = clean((await deps.resolveVerifiedAccessUserByEmail(email(p.learnerEmail))).uid); if (!studentUid) throw new Error("Verified learner UID is required."); const requestId = await deps.createMentorAccessRequest({ mentorUid: clean(s.uid), studentUid, resource: { resourceId: clean(resource.resourceId), resourceType: clean(resource.resourceType || resource.type), module: clean(resource.moduleKey || binding.module), itemType: clean(resource.itemType || binding.itemType), title: clean(resource.title), canonicalRoute: clean(resource.canonicalRoute) }, reason: clean(p.reason), requestedScope: clean(p.scope || "ITEM").toUpperCase(), requestTarget: clean(resource.resourceId) }); return ok({ requestId }); }),
    listAccessRequests: () => safeCall(async () => { const s = await admin(); return ok({ requests: await deps.listAccessRequests({ actor: actor(s) }) }); }),
    updateAccessRequest: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); return ok({ request: await deps.updateAccessRequest({ requestId: clean(p.requestId), status: clean(p.status), note: clean(p.note), actor: actor(s) }) }); }),
    approveAccessRequest: (payload) => safeCall(async () => { const s = await admin(); const p = asObject(payload); const result = await deps.approveAccessRequest({ requestId: clean(p.requestId), accessUntil: p.accessUntil || p.until || null, adminNote: clean(p.adminNote || p.note), actor: actor(s) }); return ok(result); }),
    loadStudentWorkspace: () => safeCall(async () => { const s = await student(); return ok({ grants: await deps.loadStudentAccessWorkspace({ uid: clean(s.uid), email: email(s.email) }) }); }),
  });
}

module.exports = Object.freeze({ CODES, RESOURCE_BINDINGS, createAccessProductionService });

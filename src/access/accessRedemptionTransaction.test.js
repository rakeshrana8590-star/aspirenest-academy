import {
  buildAccessKeyRedemptionAccessId,
  buildAccessKeyRedemptionAuditId,
  buildInviteOpenAuditId,
  buildInviteRedemptionAuditId,
  buildNextAccessKeyUsage,
  requireAtomicAccessUntil,
  validateAccessKeyRedemptionTransaction,
  validateInviteOpenTransaction,
  validateInviteRedemptionTransaction,
} from "./accessRedemptionTransaction";

const activeKey = {
  id: "KEY-ONE",
  status: "active",
  maxUses: 2,
  usedCount: 0,
  accessFrom: "2026-01-01",
  accessUntil: "2027-01-01",
};

const pendingInvite = {
  id: "invite-1",
  inviteStatus: "pending",
  email: "student@example.com",
  normalizedEmail: "student@example.com",
  accessId: "access-1",
  expiresAt: "2027-01-01T00:00:00.000Z",
};

const pendingAccess = {
  id: "access-1",
  email: "student@example.com",
  normalizedEmail: "student@example.com",
  uid: null,
};

describe("AspireNest atomic redemption transaction contract", () => {
  test("key access id is deterministic for the same learner", () => {
    const first = buildAccessKeyRedemptionAccessId({
      accessKeyId: "KEY-ONE",
      uid: "uid-1",
      email: "student@example.com",
    });
    const second = buildAccessKeyRedemptionAccessId({
      accessKeyId: "KEY-ONE",
      uid: "uid-1",
      email: "OTHER@example.com",
    });

    expect(first).toBe(second);
    expect(first.startsWith("key_grant_")).toBe(true);
  });

  test("different learners receive different key access ids", () => {
    const first = buildAccessKeyRedemptionAccessId({
      accessKeyId: "KEY-ONE",
      uid: "uid-1",
      email: "one@example.com",
    });
    const second = buildAccessKeyRedemptionAccessId({
      accessKeyId: "KEY-ONE",
      uid: "uid-2",
      email: "two@example.com",
    });

    expect(first).not.toBe(second);
  });

  test("different keys receive different access ids", () => {
    const first = buildAccessKeyRedemptionAccessId({
      accessKeyId: "KEY-ONE",
      uid: "uid-1",
    });
    const second = buildAccessKeyRedemptionAccessId({
      accessKeyId: "KEY-TWO",
      uid: "uid-1",
    });

    expect(first).not.toBe(second);
  });

  test("blank redemption identity fails closed", () => {
    expect(() =>
      buildAccessKeyRedemptionAccessId({
        accessKeyId: "KEY-ONE",
      })
    ).toThrow(
      "Redemption document identity is incomplete."
    );
  });

  test("invite open audit id is deterministic", () => {
    expect(
      buildInviteOpenAuditId({
        inviteId: "invite-1",
        uid: "uid-1",
      })
    ).toBe(
      buildInviteOpenAuditId({
        inviteId: "invite-1",
        uid: "uid-1",
      })
    );
  });

  test("invite redeem and open audits use different ids", () => {
    const opened = buildInviteOpenAuditId({
      inviteId: "invite-1",
      uid: "uid-1",
    });
    const redeemed = buildInviteRedemptionAuditId({
      inviteId: "invite-1",
      uid: "uid-1",
    });

    expect(opened).not.toBe(redeemed);
  });

  test("key access and audit ids are different", () => {
    const accessId = buildAccessKeyRedemptionAccessId({
      accessKeyId: "KEY-ONE",
      uid: "uid-1",
    });
    const auditId = buildAccessKeyRedemptionAuditId({
      accessKeyId: "KEY-ONE",
      uid: "uid-1",
    });

    expect(accessId).not.toBe(auditId);
  });

  test("pending invite can be opened by matching learner", () => {
    const result = validateInviteOpenTransaction({
      invite: pendingInvite,
      uid: "uid-1",
      email: "student@example.com",
      now: new Date("2026-07-15").getTime(),
    });

    expect(result.isValid).toBe(true);
    expect(result.shouldWrite).toBe(true);
  });

  test("already opened invite is an idempotent no-write", () => {
    const result = validateInviteOpenTransaction({
      invite: {
        ...pendingInvite,
        inviteStatus: "opened",
        openedByUid: "uid-1",
        openedByEmail: "student@example.com",
      },
      uid: "uid-1",
      email: "student@example.com",
      now: new Date("2026-07-15").getTime(),
    });

    expect(result.isValid).toBe(true);
    expect(result.shouldWrite).toBe(false);
  });

  test("invite open rejects another email", () => {
    const result = validateInviteOpenTransaction({
      invite: pendingInvite,
      uid: "uid-2",
      email: "other@example.com",
      now: new Date("2026-07-15").getTime(),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "This invite belongs to another email."
    );
  });

  test("matching pending invite and access can redeem", () => {
    const result = validateInviteRedemptionTransaction({
      invite: pendingInvite,
      access: pendingAccess,
      uid: "uid-1",
      email: "student@example.com",
      now: new Date("2026-07-15").getTime(),
    });

    expect(result.isValid).toBe(true);
  });

  test("used invite replay fails closed", () => {
    const result = validateInviteRedemptionTransaction({
      invite: {
        ...pendingInvite,
        inviteStatus: "used",
      },
      access: pendingAccess,
      uid: "uid-1",
      email: "student@example.com",
      now: new Date("2026-07-15").getTime(),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Invite already used."
    );
  });

  test("expired invite fails closed", () => {
    const result = validateInviteRedemptionTransaction({
      invite: {
        ...pendingInvite,
        expiresAt: "2026-01-01T00:00:00.000Z",
      },
      access: pendingAccess,
      uid: "uid-1",
      email: "student@example.com",
      now: new Date("2026-07-15").getTime(),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Invite has expired."
    );
  });

  test("invite cannot claim access owned by another uid", () => {
    const result = validateInviteRedemptionTransaction({
      invite: pendingInvite,
      access: {
        ...pendingAccess,
        uid: "uid-other",
      },
      uid: "uid-1",
      email: "student@example.com",
      now: new Date("2026-07-15").getTime(),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "This access is already linked to another account."
    );
  });

  test("active key with capacity validates", () => {
    const result = validateAccessKeyRedemptionTransaction({
      keyRecord: activeKey,
      uid: "uid-1",
      email: "student@example.com",
      today: new Date("2026-07-15"),
    });

    expect(result.isValid).toBe(true);
    expect(result.usedCount).toBe(0);
    expect(result.maxUses).toBe(2);
  });

  test("existing deterministic access blocks key replay", () => {
    const result = validateAccessKeyRedemptionTransaction({
      keyRecord: activeKey,
      existingAccess: {
        id: "key-grant-existing",
      },
      uid: "uid-1",
      email: "student@example.com",
      today: new Date("2026-07-15"),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "This access key is already redeemed for this learner account."
    );
  });

  test("used key fails closed", () => {
    const result = validateAccessKeyRedemptionTransaction({
      keyRecord: {
        ...activeKey,
        status: "used",
        usedCount: 2,
      },
      uid: "uid-1",
      email: "student@example.com",
      today: new Date("2026-07-15"),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Access key is not active."
    );
    expect(result.errors).toContain(
      "Access key usage limit is already reached."
    );
  });

  test("assigned key rejects another email", () => {
    const result = validateAccessKeyRedemptionTransaction({
      keyRecord: {
        ...activeKey,
        assignedEmail: "owner@example.com",
      },
      uid: "uid-1",
      email: "other@example.com",
      today: new Date("2026-07-15"),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Access key is assigned to another learner email."
    );
  });

  test("future and expired key windows fail closed", () => {
    const future = validateAccessKeyRedemptionTransaction({
      keyRecord: {
        ...activeKey,
        accessFrom: "2027-01-01",
      },
      uid: "uid-1",
      email: "student@example.com",
      today: new Date("2026-07-15"),
    });
    const expired = validateAccessKeyRedemptionTransaction({
      keyRecord: {
        ...activeKey,
        accessUntil: "2026-01-01",
      },
      uid: "uid-1",
      email: "student@example.com",
      today: new Date("2026-07-15"),
    });

    expect(future.errors).toContain(
      "Access key is not active yet."
    );
    expect(expired.errors).toContain(
      "Access key has expired."
    );
  });

  test("key usage advances and closes at max uses", () => {
    expect(
      buildNextAccessKeyUsage({
        status: "active",
        maxUses: 2,
        usedCount: 0,
      })
    ).toMatchObject({
      nextUsedCount: 1,
      nextStatus: "active",
    });

    expect(
      buildNextAccessKeyUsage({
        status: "active",
        maxUses: 2,
        usedCount: 1,
      })
    ).toMatchObject({
      nextUsedCount: 2,
      nextStatus: "used",
    });
  });

  test("key usage cannot advance after exhaustion", () => {
    expect(() =>
      buildNextAccessKeyUsage({
        status: "used",
        maxUses: 1,
        usedCount: 1,
      })
    ).toThrow(
      "Access key cannot consume another use."
    );
  });

  test("atomic key redemption requires fixed access-until", () => {
    expect(
      requireAtomicAccessUntil({
        accessUntil: "2027-01-01",
      })
    ).toBe("2027-01-01");

    expect(() =>
      requireAtomicAccessUntil({
        accessUntil: null,
      })
    ).toThrow(
      "Access key requires a fixed access-until date before student redemption."
    );

    expect(() =>
      requireAtomicAccessUntil({
        accessUntil: "",
        productId: "product-1",
      })
    ).toThrow(
      "Linked access product requires a fixed access-until date before student redemption."
    );
  });
});

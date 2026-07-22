const cleanString = (value = "") =>
  String(value ?? "").trim();

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeMentorSetupEmail = (
  value = ""
) => cleanString(value).toLowerCase();

export const isValidMentorSetupEmail = (
  value = ""
) =>
  EMAIL_PATTERN.test(
    normalizeMentorSetupEmail(value)
  );

export const normalizeMentorSetupAccount = (
  record = {}
) => {
  const documentUid = cleanString(record.id);
  const declaredUid = cleanString(record.uid);

  if (
    documentUid &&
    declaredUid &&
    documentUid !== declaredUid
  ) {
    throw new Error(
      "Account identity is inconsistent. Ask the administrator to repair the user record."
    );
  }

  const uid = declaredUid || documentUid;
  const email = normalizeMentorSetupEmail(
    record.normalizedEmail || record.email
  );

  if (!uid) {
    throw new Error(
      "The matching account does not have a Firebase UID."
    );
  }

  if (!isValidMentorSetupEmail(email)) {
    throw new Error(
      "The matching account does not have a valid email."
    );
  }

  const displayName =
    cleanString(
      record.displayName ||
        record.fullName ||
        record.name
    ) || email.split("@")[0];

  return Object.freeze({
    uid,
    email,
    displayName,
    role: cleanString(record.role).toLowerCase(),
    accountStatus: cleanString(
      record.accountStatus
    ).toLowerCase(),
  });
};

export const selectExactMentorSetupAccount = ({
  records = [],
  email = "",
} = {}) => {
  const requestedEmail =
    normalizeMentorSetupEmail(email);

  if (!isValidMentorSetupEmail(requestedEmail)) {
    throw new Error(
      "Enter a valid AspireNest account email."
    );
  }

  const exactAccounts = new Map();

  records.forEach((record) => {
    const account =
      normalizeMentorSetupAccount(record);

    if (account.email === requestedEmail) {
      exactAccounts.set(account.uid, account);
    }
  });

  const matches = [...exactAccounts.values()];

  if (matches.length === 0) {
    throw new Error(
      "No AspireNest account was found for this email."
    );
  }

  if (matches.length > 1) {
    throw new Error(
      "Multiple user records use this email. Resolve the duplicate before mentor setup."
    );
  }

  return matches[0];
};

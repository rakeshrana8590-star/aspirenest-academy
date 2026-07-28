export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

export const RESERVED_USERNAMES = Object.freeze(new Set([
  "admin",
  "administrator",
  "aspirenest",
  "aspirenestacademy",
  "aspirenest_admin",
  "founder",
  "mentor",
  "moderator",
  "owner",
  "root",
  "student",
  "support",
  "system",
]));

export const normalizeUsername = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

export const validateUsername = (value = "") => {
  const normalizedUsername = normalizeUsername(value);

  if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    return {
      ok: false,
      normalizedUsername,
      reason: "USERNAME_TOO_SHORT",
      message: `Username must contain at least ${USERNAME_MIN_LENGTH} characters.`,
    };
  }

  if (normalizedUsername.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      normalizedUsername,
      reason: "USERNAME_TOO_LONG",
      message: `Username cannot exceed ${USERNAME_MAX_LENGTH} characters.`,
    };
  }

  if (!/^[a-z][a-z0-9_]*$/.test(normalizedUsername)) {
    return {
      ok: false,
      normalizedUsername,
      reason: "USERNAME_INVALID_FORMAT",
      message: "Username must start with a letter and use only lowercase letters, numbers, or underscore.",
    };
  }

  if (RESERVED_USERNAMES.has(normalizedUsername)) {
    return {
      ok: false,
      normalizedUsername,
      reason: "USERNAME_RESERVED",
      message: "This username is reserved by AspireNest Academy.",
    };
  }

  return {
    ok: true,
    normalizedUsername,
    reason: "USERNAME_AVAILABLE_FOR_CHECK",
    message: "Username format is valid.",
  };
};

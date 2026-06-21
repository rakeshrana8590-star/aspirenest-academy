export const ACCESS_PLAN_TYPES = Object.freeze({
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  MENTORSHIP: "MENTORSHIP",
});

export const ACCESS_PLAN_RANK = Object.freeze({
  [ACCESS_PLAN_TYPES.FREE]: 0,
  [ACCESS_PLAN_TYPES.BASIC]: 1,
  [ACCESS_PLAN_TYPES.PREMIUM]: 2,
  [ACCESS_PLAN_TYPES.MENTORSHIP]: 3,
});

export const ACCESS_ACTIVE_STATUSES = new Set([
  "active",
  "approved",
  "paid",
  "success",
  "verified",
  "live",
]);

export const normalizeAccessPlan = (planType = ACCESS_PLAN_TYPES.FREE) => {
  const value = String(planType || ACCESS_PLAN_TYPES.FREE).trim().toUpperCase();

  if (value === "MENTOR") return ACCESS_PLAN_TYPES.MENTORSHIP;
  if (value === "MENTORSHIP") return ACCESS_PLAN_TYPES.MENTORSHIP;
  if (value === "PREMIUM") return ACCESS_PLAN_TYPES.PREMIUM;
  if (value === "PRO") return ACCESS_PLAN_TYPES.PREMIUM;
  if (value === "PAID") return ACCESS_PLAN_TYPES.PREMIUM;
  if (value === "BASIC") return ACCESS_PLAN_TYPES.BASIC;
  if (value === "FREE") return ACCESS_PLAN_TYPES.FREE;

  return ACCESS_PLAN_TYPES.FREE;
};

export const getAccessPlanRank = (planType = ACCESS_PLAN_TYPES.FREE) =>
  ACCESS_PLAN_RANK[normalizeAccessPlan(planType)] ?? ACCESS_PLAN_RANK.FREE;

export const canAccessPlan = (userPlanType = ACCESS_PLAN_TYPES.FREE, requiredPlanType = ACCESS_PLAN_TYPES.FREE) =>
  getAccessPlanRank(userPlanType) >= getAccessPlanRank(requiredPlanType);

export const isAccessDateActive = (expiryDate) => {
  if (!expiryDate) return true;

  const rawDate = typeof expiryDate?.toDate === "function" ? expiryDate.toDate() : expiryDate;
  const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) return false;

  return parsedDate.getTime() >= Date.now();
};

export const isAccessStatusActive = (status = "") => {
  if (!status) return true;
  return ACCESS_ACTIVE_STATUSES.has(String(status).trim().toLowerCase());
};

export const resolveAccessPlanFromProfile = (profile = {}) => {
  const directPlan = profile.planType || profile.subscriptionType || profile.accessPlan || profile.currentPlan;
  const normalizedDirectPlan = normalizeAccessPlan(directPlan);

  if (normalizedDirectPlan !== ACCESS_PLAN_TYPES.FREE) {
    return normalizedDirectPlan;
  }

  if (profile.isPremium === true || profile.isPremiumUser === true) {
    return ACCESS_PLAN_TYPES.PREMIUM;
  }

  return ACCESS_PLAN_TYPES.FREE;
};

export const buildAccessSnapshot = ({
  user = null,
  profile = {},
  fallbackPlanType = ACCESS_PLAN_TYPES.FREE,
  emergencyPremiumEmails = [],
} = {}) => {
  const email = String(user?.email || profile?.email || "").trim().toLowerCase();
  const emergencySet = new Set(emergencyPremiumEmails.map((item) => String(item || "").trim().toLowerCase()));
  const isEmergencyPremium = email ? emergencySet.has(email) : false;
  const profilePlan = resolveAccessPlanFromProfile(profile);
  const fallbackPlan = normalizeAccessPlan(fallbackPlanType);
  const resolvedPlan = isEmergencyPremium
    ? ACCESS_PLAN_TYPES.PREMIUM
    : getAccessPlanRank(profilePlan) >= getAccessPlanRank(fallbackPlan)
      ? profilePlan
      : fallbackPlan;

  return {
    email,
    planType: resolvedPlan,
    rank: getAccessPlanRank(resolvedPlan),
    isEmergencyPremium,
  };
};

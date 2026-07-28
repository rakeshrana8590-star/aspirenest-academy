const clean = (value = "") => String(value ?? "").trim();
const lower = (value = "") => clean(value).toLowerCase();

export const ASPIRENEST_PRODUCTION_HOSTS = Object.freeze([
  "aspirenestacademy.in",
  "www.aspirenestacademy.in",
]);

export const resolveAspireNestReleaseWriteGate = ({
  requested = false,
  hostname = "",
} = {}) => {
  const host = lower(hostname);
  const productionHost = ASPIRENEST_PRODUCTION_HOSTS.includes(host);
  const enabled = requested === true && productionHost;
  return {
    enabled,
    requested: requested === true,
    productionHost,
    hostname: host,
    reason: enabled
      ? "Production writes are enabled for the approved AspireNest production host."
      : !requested
        ? "Production writes remain locked until the controlled G16 activation gate is approved."
        : "Production writes are only allowed on the approved AspireNest production host.",
  };
};

export const getAspireNestReleaseWriteGate = () =>
  resolveAspireNestReleaseWriteGate({
    requested: process.env.REACT_APP_ASPIRENEST_PRODUCTION_WRITES_ENABLED === "true",
    hostname: typeof window === "undefined" ? "" : window.location.hostname,
  });

export const assertAspireNestProductionWriteEnabled = (action = "write") => {
  const gate = getAspireNestReleaseWriteGate();
  if (!gate.enabled) {
    const error = new Error(`${gate.reason} Blocked action: ${clean(action) || "write"}.`);
    error.code = "aspirenest/release-write-gate-locked";
    error.gate = gate;
    throw error;
  }
  return gate;
};

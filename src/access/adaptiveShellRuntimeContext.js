import {
  normalizeAdaptiveShellRoute,
} from "./adaptiveShellNavigation";

const DEFAULT_SHELL_HOME_ROUTE = "/";
const DEFAULT_SHELL_RESUME_ROUTE = "/ctet-tet";

const cleanString = (value = "") =>
  String(value ?? "").trim();

export const buildAdaptiveShellRuntimeContext = ({
  user = null,
  isAdminUser = false,
  currentPath = DEFAULT_SHELL_HOME_ROUTE,
  resumeRoute = DEFAULT_SHELL_RESUME_ROUTE,
} = {}) => {
  const isAuthenticated = Boolean(
    cleanString(user?.uid) ||
      cleanString(user?.email)
  );

  return Object.freeze({
    enabled: isAuthenticated,
    isAdminUser:
      isAuthenticated &&
      isAdminUser === true,
    currentPath:
      normalizeAdaptiveShellRoute(
        currentPath,
        DEFAULT_SHELL_HOME_ROUTE
      ),
    resumeRoute:
      normalizeAdaptiveShellRoute(
        resumeRoute,
        DEFAULT_SHELL_RESUME_ROUTE
      ),
  });
};

import React from "react";

import "./v8RuntimeHost.css";
import {
  EXPERIENCE_COPY,
  EXPERIENCE_HASH,
  EXPERIENCE_ICON,
  EXPERIENCE_LABELS,
  EXPERIENCE_ROUTE,
  V8_SCRIPT_ASSETS,
  V8_SHADOW_FOUNDATION_CSS,
  V8_STYLE_ASSETS,
  allowedV8Experiences,
  buildV8ShellMarkup,
  cleanV8Value,
  createV8ShadowEnvironment,
  escapeV8Html,
  executeV8Script,
  initialsForV8,
  transformV8CssForShadow,
} from "./v8ShadowRuntimeModel";
import { buildV8RealNotesRuntime } from "./v8RealNotesRuntimeModel";
import { buildV8RealMockTestsRuntime } from "./v8RealMockTestsRuntimeModel";

const roleLabelFor = (experience) => ({
  public: "Public",
  student: "Student",
  mentor: "Mentor",
  admin: "Admin",
})[experience] || "Public";

const fetchAssetText = async (url) => {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error(`Unable to load ${url} (${response.status})`);
  return response.text();
};

const removeLegacyGlobalV8Assets = () => {
  document
    .querySelectorAll("link[data-aspirenest-v8-style],script[data-aspirenest-v8-script]")
    .forEach((node) => node.remove());
};

const syncText = (node, value) => {
  if (!node) return false;
  const next = String(value ?? "");
  if (node.textContent === next) return false;
  node.textContent = next;
  return true;
};

const removeScopedOverlays = (shadowRoot) => {
  shadowRoot
    ?.querySelectorAll(
      ".aspirenestRuntimeChooser,.aspirenestRuntimeAccount,.v8-experience-modal,.v8-popover"
    )
    .forEach((node) => node.remove());
};

export default function V8LearningDriveRuntime({
  experience = "public",
  user = null,
  isAdminUser = false,
  isMentorUser = false,
  onLogout = null,
  universalContent = [],
  buildNoteAccessDecision = null,
  onOpenLegacyNote = null,
  accessProfile = {},
  mockResults = [],
  mockLeaderboardEntries = [],
}) {
  const hostRef = React.useRef(null);
  const logoutRef = React.useRef(onLogout);
  const legacyNoteOpenRef = React.useRef(onOpenLegacyNote);
  const [runtimeReady, setRuntimeReady] = React.useState(false);
  const [runtimeError, setRuntimeError] = React.useState("");

  React.useEffect(() => {
    logoutRef.current = onLogout;
  }, [onLogout]);

  React.useEffect(() => {
    legacyNoteOpenRef.current = onOpenLegacyNote;
  }, [onOpenLegacyNote]);

  const authenticated = Boolean(user);
  const displayName =
    cleanV8Value(user?.displayName) ||
    cleanV8Value(user?.name) ||
    cleanV8Value(user?.email).split("@")[0] ||
    "AspireNest User";
  const email = cleanV8Value(user?.email);
  const initials = initialsForV8(displayName);

  const allowedRoles = React.useMemo(
    () => allowedV8Experiences({ authenticated, isMentorUser, isAdminUser }),
    [authenticated, isAdminUser, isMentorUser]
  );

  const realNotesRuntime = React.useMemo(
    () =>
      buildV8RealNotesRuntime({
        contentItems: universalContent,
        buildNoteAccessDecision,
      }),
    [universalContent, buildNoteAccessDecision]
  );

  const realMockTestsRuntime = React.useMemo(
    () =>
      buildV8RealMockTestsRuntime({
        universalContent,
        user,
        isAdminUser,
        accessProfile,
        mockResults,
        mockLeaderboardEntries,
      }),
    [
      accessProfile,
      isAdminUser,
      mockLeaderboardEntries,
      mockResults,
      universalContent,
      user,
    ]
  );

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let active = true;
    let observer = null;
    let environment = null;
    let shadowRoot = host.shadowRoot;

    if (!shadowRoot) shadowRoot = host.attachShadow({ mode: "open" });
    shadowRoot.replaceChildren();

    const styleFoundation = document.createElement("style");
    styleFoundation.dataset.v8ShadowStyle = "foundation";
    styleFoundation.textContent = V8_SHADOW_FOUNDATION_CSS;
    shadowRoot.appendChild(styleFoundation);

    const shellTemplate = document.createElement("template");
    shellTemplate.innerHTML = buildV8ShellMarkup({ initials, email, authenticated });
    shadowRoot.appendChild(shellTemplate.content.cloneNode(true));

    const shadowBody = shadowRoot.querySelector(".v8-shadow-body");
    if (!shadowBody) {
      setRuntimeError("Unable to create the AspireNest Learning Drive shell.");
      return undefined;
    }

    const fullNavigate = (target) => {
      if (target) window.location.assign(target);
    };

    const openIntegratedNote = async (resource = {}) => {
      const resourceId = cleanV8Value(
        resource.resourceId || resource.id
      );
      const entry = realNotesRuntime.byId.get(resourceId);

      if (!entry) return false;

      const refreshed =
        typeof buildNoteAccessDecision === "function"
          ? buildNoteAccessDecision(entry.note, entry.action)
          : entry.decision;

      if (refreshed?.allowed !== true) return false;

      if (entry.resource.nativeReady) {
        if (refreshed?.canReadAsset !== true) return false;
        fullNavigate(entry.resource.canonicalRoute);
        return true;
      }

      if (refreshed?.canResolveAsset !== true) return false;

      if (typeof legacyNoteOpenRef.current === "function") {
        await legacyNoteOpenRef.current(entry.note);
        return true;
      }

      return false;
    };

    const routeForRole = (role) => {
      if (role === "public") return "/";
      if (!authenticated) return `/login?returnTo=${encodeURIComponent(EXPERIENCE_ROUTE[role])}`;
      if (!allowedRoles.includes(role)) return EXPERIENCE_ROUTE.student;
      return EXPERIENCE_ROUTE[role];
    };

    const openRoleChooser = () => {
      removeScopedOverlays(shadowRoot);
      const overlay = document.createElement("section");
      overlay.className = "v8-experience-modal aspirenestRuntimeChooser";
      overlay.innerHTML = `
        <div class="v8-experience-dialog" role="dialog" aria-modal="true" aria-label="Open AspireNest experience">
          <div class="v8-dialog-head">
            <div><h2>Open AspireNest experience</h2><p>Use every workspace allowed for this account.</p></div>
            <button type="button" class="v8-role-close" data-runtime-close aria-label="Close dialog">×</button>
          </div>
          <div class="v8-role-grid">
            ${allowedRoles.map((role) => `
              <button type="button" class="v8-role-card ${role === experience ? "active" : ""}" data-runtime-role="${role}">
                <span class="v8-role-card-icon">${EXPERIENCE_ICON[role]}</span>
                <strong>${EXPERIENCE_LABELS[role]}</strong>
                <small>${EXPERIENCE_COPY[role]}</small>
              </button>`).join("")}
          </div>
        </div>`;
      shadowBody.appendChild(overlay);
    };

    const openAccountMenu = () => {
      removeScopedOverlays(shadowRoot);
      const popover = document.createElement("div");
      popover.className = "v8-popover aspirenestRuntimeAccount";
      popover.setAttribute("role", "menu");

      if (authenticated) {
        popover.innerHTML = `
          <div class="v8-popover-head">AspireNest account</div>
          <button type="button" disabled><strong>${escapeV8Html(displayName)}</strong><small>${escapeV8Html(email || EXPERIENCE_LABELS[experience])}</small></button>
          <button type="button" data-runtime-role="public"><strong>Public Website</strong><small>Open the public AspireNest experience</small></button>
          <button type="button" data-runtime-chooser><strong>Switch experience</strong><small>Only allowed workspaces are shown</small></button>
          <button type="button" data-runtime-logout><strong>Logout</strong><small>Sign out of AspireNest</small></button>`;
      } else {
        popover.innerHTML = `
          <div class="v8-popover-head">AspireNest Academy</div>
          <button type="button" data-runtime-login><strong>Login</strong><small>Open your AspireNest account</small></button>
          <button type="button" data-runtime-create-account><strong>Create Student Account</strong><small>Start with a verified student profile</small></button>`;
      }
      shadowBody.appendChild(popover);
    };

    const synchronizeRuntimeChrome = () => {
      syncText(shadowRoot.querySelector("#brandHome .brand-copy strong"), "AspireNest");
      syncText(shadowRoot.querySelector("#brandHome .brand-copy small"), "Academy");
      syncText(shadowRoot.getElementById("accountButton"), initials);
      syncText(shadowRoot.getElementById("roleSwitchLabel"), roleLabelFor(experience));

      const quick = shadowRoot.getElementById("quickContinue");
      if (quick) {
        const quickLabel = experience === "public"
          ? authenticated ? "Open Workspace" : "Login"
          : experience === "mentor" ? "+ Assignment"
          : experience === "admin" ? "+ New"
          : "Continue";
        syncText(quick.querySelector("[data-v8-quick-label]") || quick, quickLabel);
      }

      const summary = shadowRoot.querySelector(".plan-summary");
      if (summary) {
        const strong = summary.querySelector("strong");
        const small = summary.querySelector("small");
        syncText(strong, authenticated ? EXPERIENCE_LABELS[experience] : "Public discovery");
        syncText(small, authenticated ? email || "Connected account" : "No sign-in required");
      }
    };

    const bridgeClick = async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const close = target.closest("[data-runtime-close]");
      if (close) {
        event.preventDefault();
        event.stopImmediatePropagation();
        removeScopedOverlays(shadowRoot);
        return;
      }

      const chooser = target.closest("#roleSwitchButton,[data-v8-role-chooser],[data-runtime-chooser]");
      if (chooser) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openRoleChooser();
        return;
      }

      const roleTarget = target.closest("[data-runtime-role],[data-v8-role]");
      if (roleTarget) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const role = roleTarget.dataset.runtimeRole || roleTarget.dataset.v8Role;
        fullNavigate(routeForRole(role));
        return;
      }

      if (target.closest("#accountButton")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openAccountMenu();
        return;
      }

      if (target.closest("#brandHome")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        fullNavigate("/");
        return;
      }

      if (target.closest("[data-runtime-login]")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        fullNavigate("/login");
        return;
      }

      if (target.closest("[data-runtime-create-account]")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        fullNavigate("/create-account");
        return;
      }

      if (target.closest("[data-runtime-logout]")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        removeScopedOverlays(shadowRoot);
        try {
          await logoutRef.current?.();
        } finally {
          fullNavigate("/");
        }
        return;
      }

      const modal = shadowRoot.querySelector(".aspirenestRuntimeChooser");
      if (modal && target === modal) {
        event.preventDefault();
        event.stopImmediatePropagation();
        removeScopedOverlays(shadowRoot);
        return;
      }

      const accountPopover = shadowRoot.querySelector(".aspirenestRuntimeAccount");
      if (accountPopover && !target.closest(".aspirenestRuntimeAccount")) accountPopover.remove();

      if (target.closest("#quickContinue") && experience === "public") {
        event.preventDefault();
        event.stopImmediatePropagation();
        fullNavigate(authenticated ? routeForRole(isAdminUser ? "admin" : isMentorUser ? "mentor" : "student") : "/login");
      }
    };

    const bridgeKeydown = (event) => {
      if (event.key === "Escape") removeScopedOverlays(shadowRoot);
    };

    const start = async () => {
      try {
        setRuntimeReady(false);
        setRuntimeError("");
        removeLegacyGlobalV8Assets();

        shadowRoot.addEventListener("click", bridgeClick, true);
        shadowRoot.addEventListener("keydown", bridgeKeydown, true);

        environment = createV8ShadowEnvironment({ shadowRoot, bodyElement: shadowBody });
        environment.window.__aspirenestRuntimeContext = Object.freeze({
          experience,
          authenticated,
          displayName,
          email,
          initials,
          allowedRoles: [...allowedRoles],
          realNotes: realNotesRuntime.resources,
          notesIntegration: Object.freeze({
            enabled: true,
            total: realNotesRuntime.total,
            nativeReady: realNotesRuntime.nativeReady,
            conversionRequired: realNotesRuntime.conversionRequired,
          }),
          realMockTests: realMockTestsRuntime.resources,
          mockTestResults: realMockTestsRuntime.results,
          mockTestLeaderboard: realMockTestsRuntime.leaderboard,
          mockTestsIntegration: Object.freeze({
            enabled: true,
            state: realMockTestsRuntime.state,
            total: realMockTestsRuntime.total,
            unlocked: realMockTestsRuntime.unlocked,
            locked: realMockTestsRuntime.locked,
            exactItem: realMockTestsRuntime.exactItem,
          }),
        });
        environment.window.__aspirenestOpenCanonicalResource = openIntegratedNote;
        environment.window.__aspirenestAllowedRoles = [...allowedRoles];
        environment.window.__aspirenestRole = experience === "student" ? "student" : "admin";
        environment.window.__aspirenestExperienceRole =
          experience === "public" || experience === "mentor" ? experience : null;

        const nextHash = EXPERIENCE_HASH[experience] || EXPERIENCE_HASH.public;
        if (window.location.hash !== nextHash) {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
        }

        const [styleTexts, scriptTexts] = await Promise.all([
          Promise.all(V8_STYLE_ASSETS.map(fetchAssetText)),
          Promise.all(V8_SCRIPT_ASSETS.map(fetchAssetText)),
        ]);

        if (!active) return;

        styleTexts.forEach((cssText, index) => {
          const style = document.createElement("style");
          style.dataset.v8ShadowStyle = V8_STYLE_ASSETS[index];
          style.textContent = transformV8CssForShadow(cssText);
          shadowRoot.insertBefore(style, shadowBody);
        });

        scriptTexts.forEach((source, index) => {
          executeV8Script({ source, sourceUrl: V8_SCRIPT_ASSETS[index], environment });
        });

        synchronizeRuntimeChrome();
        observer = new MutationObserver(synchronizeRuntimeChrome);
        observer.observe(shadowBody, { subtree: true, childList: true, characterData: true });

        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (active) setRuntimeReady(true);
      } catch (error) {
        if (active) setRuntimeError(error?.message || "Unable to open AspireNest Learning Drive.");
      }
    };

    start();

    return () => {
      active = false;
      observer?.disconnect();
      try {
        delete environment?.window?.__aspirenestOpenCanonicalResource;
      } catch (_) {}
      environment?.cleanup();
      shadowRoot.removeEventListener("click", bridgeClick, true);
      shadowRoot.removeEventListener("keydown", bridgeKeydown, true);
      removeScopedOverlays(shadowRoot);
      shadowRoot.replaceChildren();
    };
  }, [
    allowedRoles,
    authenticated,
    buildNoteAccessDecision,
    displayName,
    email,
    experience,
    initials,
    isAdminUser,
    isMentorUser,
    realMockTestsRuntime,
    realNotesRuntime,
  ]);

  return (
    <div className="aspirenestV8RuntimeBoundary">
      <div ref={hostRef} className="aspirenestV8ShadowHost" data-experience={experience} />
      {!runtimeReady ? (
        <div className="aspirenestV8RuntimeLoading" role="status">
          <strong>AspireNest</strong><span>ACADEMY</span><small>{runtimeError || "Opening Learning Drive…"}</small>
        </div>
      ) : null}
    </div>
  );
}

export const V8_ASSET_BASE = "/learning-drive-v8";

export const V8_STYLE_ASSETS = Object.freeze([
  `${V8_ASSET_BASE}/styles.css`,
  `${V8_ASSET_BASE}/intellibook.css`,
  `${V8_ASSET_BASE}/admin.css`,
  `${V8_ASSET_BASE}/v8-experiences.css`,
]);

export const V8_SCRIPT_ASSETS = Object.freeze([
  `${V8_ASSET_BASE}/app.js`,
  `${V8_ASSET_BASE}/intellibook.js`,
  `${V8_ASSET_BASE}/admin.js`,
  `${V8_ASSET_BASE}/v8-experiences.js`,
]);

export const EXPERIENCE_LABELS = Object.freeze({
  public: "Public Website",
  student: "Student Learning Drive",
  mentor: "Mentor Workspace",
  admin: "Admin Learning Drive",
});

export const EXPERIENCE_COPY = Object.freeze({
  public: "Explore AspireNest before signing in.",
  student: "Learn, practice, revise and continue.",
  mentor: "Guide learners with access awareness.",
  admin: "Operate content, access and platform safety.",
});

export const EXPERIENCE_ICON = Object.freeze({
  public: "◎",
  student: "S",
  mentor: "M",
  admin: "⚙",
});

export const EXPERIENCE_ROUTE = Object.freeze({
  public: "/",
  student: "/student",
  mentor: "/mentor",
  admin: "/admin",
});

export const EXPERIENCE_HASH = Object.freeze({
  public: "#public/home/overview",
  student: "#home/overview",
  mentor: "#mentor/home/overview",
  admin: "#admin/home/overview",
});

export const cleanV8Value = (value = "") => String(value ?? "").trim();

export const escapeV8Html = (value = "") =>
  cleanV8Value(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);

export const initialsForV8 = (value = "") => {
  const parts = cleanV8Value(value).split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]).join("").toUpperCase() || "AN";
};

export const allowedV8Experiences = ({ authenticated, isMentorUser, isAdminUser }) => {
  const roles = ["public"];
  if (authenticated) roles.push("student");
  if (authenticated && (isMentorUser || isAdminUser)) roles.push("mentor");
  if (authenticated && isAdminUser) roles.push("admin");
  return roles;
};

const transformSelector = (selector) => {
  const trimmed = selector.trim();
  if (!trimmed || trimmed.startsWith("@")) return selector;

  return selector
    .split(",")
    .map((part) => {
      const leading = part.match(/^\s*/)?.[0] || "";
      let value = part.trim();
      value = value.replace(/^:root\b/, ":host");
      value = value.replace(/^html\b/, ":host");
      value = value.replace(/^body\b/, ".v8-shadow-body");
      return `${leading}${value}`;
    })
    .join(",");
};

export const transformV8CssForShadow = (cssText = "") =>
  String(cssText).replace(/([^{}]+)\{/g, (full, selector) => {
    if (selector.trim().startsWith("@")) return full;
    return `${transformSelector(selector)}{`;
  });

export const V8_SHADOW_FOUNDATION_CSS = `
:host {
  all: initial;
  display: block;
  min-height: 100vh;
  color-scheme: light;
  isolation: isolate;
}
.v8-shadow-body {
  min-height: 100vh;
  margin: 0;
  overflow-x: hidden;
  background: #f5f7fb;
  color: #172033;
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
.v8-shadow-body button,
.v8-shadow-body input,
.v8-shadow-body select,
.v8-shadow-body textarea {
  font: inherit;
}
`;

export const buildV8ShellMarkup = ({ initials = "AN", email = "", authenticated = false } = {}) => `
  <div class="v8-shadow-body">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div id="app" class="app-shell" data-view="grid">
      <header class="topbar">
        <button class="brand" id="brandHome" type="button" aria-label="Open AspireNest Home">
          <span class="brand-copy"><strong>AspireNest</strong><small>Academy</small></span>
        </button>

        <div class="global-search" role="search">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path></svg>
          <input id="globalSearch" type="search" autocomplete="off" placeholder="Search notes, videos, tests, chapters or topics" aria-label="Search all learning content">
          <kbd>/</kbd>
          <button id="searchFiltersButton" class="icon-button" type="button" aria-label="Open search filters" aria-expanded="false">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"></path></svg>
          </button>
        </div>

        <div class="top-actions">
          <button id="quickContinue" class="continue-pill" type="button" title="Continue last learning item">
            <span class="pulse-dot" aria-hidden="true"></span><span data-v8-quick-label>Continue</span>
          </button>
          <button class="icon-button" id="notificationsButton" type="button" aria-label="Notifications">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8M10 20h4"></path></svg>
            <span class="notification-dot" aria-hidden="true"></span>
          </button>
          <button class="role-switch-pill" id="roleSwitchButton" type="button" aria-label="Open AspireNest experiences" aria-expanded="false">
            <span class="role-switch-dot"></span><span id="roleSwitchLabel">Public</span><span aria-hidden="true">⌄</span>
          </button>
          <button class="avatar" id="accountButton" type="button" aria-label="Open account menu" aria-expanded="false">${escapeV8Html(initials)}</button>
        </div>
      </header>

      <aside class="parent-rail" aria-label="Primary navigation">
        <nav id="parentNav"></nav>
        <div class="rail-footer">
          <button class="rail-link compact" type="button" data-action="install" title="Install app">
            <span class="nav-icon">↧</span><span class="nav-label">Install</span>
          </button>
        </div>
      </aside>

      <aside class="context-rail" aria-label="Context navigation">
        <div class="context-header">
          <div><span class="eyebrow" id="contextEyebrow">Learning OS</span><h2 id="contextTitle">Home</h2></div>
          <button class="icon-button" id="collapseContext" type="button" aria-label="Collapse contextual navigation" aria-expanded="true">‹</button>
        </div>
        <nav id="contextNav"></nav>
        <div class="plan-summary">
          <span class="status-dot"></span>
          <div><strong>${authenticated ? "Connected account" : "Public access"}</strong><small>${escapeV8Html(authenticated ? email : "No sign-in required")}</small></div>
        </div>
      </aside>

      <main id="main-content" tabindex="-1">
        <div class="mobile-context-strip" id="mobileContextStrip" aria-label="Section shortcuts"></div>
        <div id="pageContent"></div>
      </main>

      <nav class="mobile-dock" id="mobileDock" aria-label="Mobile primary navigation"></nav>
    </div>

    <div id="overlay" class="overlay" hidden></div>
    <aside id="detailDrawer" class="detail-drawer" aria-hidden="true" aria-label="Resource details"></aside>
    <section id="sheet" class="bottom-sheet" aria-hidden="true" aria-label="Guidance"></section>
    <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>
  </div>
`;

const mapBodySelector = (selector) => {
  const trimmed = String(selector || "").trim();
  if (trimmed === "body") return ".v8-shadow-body";
  if (trimmed.startsWith("body")) return trimmed.replace(/^body/, ".v8-shadow-body");
  if (trimmed === "html") return ":host";
  return selector;
};

export const createV8ShadowEnvironment = ({ shadowRoot, bodyElement, browserWindow = window }) => {
  const windowListeners = [];

  const shadowDocument = new Proxy(document, {
    get(target, property) {
      if (property === "body") return bodyElement;
      if (property === "documentElement") return shadowRoot.host;
      if (property === "head") return shadowRoot;
      if (property === "activeElement") return shadowRoot.activeElement || target.activeElement;
      if (property === "readyState") return "complete";
      if (property === "defaultView") return browserWindow;
      if (property === "getElementById") return (id) => shadowRoot.getElementById(id);
      if (property === "querySelector") return (selector) => shadowRoot.querySelector(mapBodySelector(selector));
      if (property === "querySelectorAll") return (selector) => shadowRoot.querySelectorAll(mapBodySelector(selector));
      if (property === "addEventListener") {
        return (type, listener, options) => {
          if (type === "DOMContentLoaded") {
            queueMicrotask(() => listener.call(shadowDocument, new Event("DOMContentLoaded")));
            return;
          }
          shadowRoot.addEventListener(type, listener, options);
        };
      }
      if (property === "removeEventListener") return shadowRoot.removeEventListener.bind(shadowRoot);
      if (property === "dispatchEvent") return shadowRoot.dispatchEvent.bind(shadowRoot);
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  const scopedWindow = new Proxy(browserWindow, {
    get(target, property) {
      if (property === "document") return shadowDocument;
      if (property === "addEventListener") {
        return (type, listener, options) => {
          windowListeners.push({ type, listener, options });
          target.addEventListener(type, listener, options);
        };
      }
      if (property === "removeEventListener") {
        return (type, listener, options) => {
          target.removeEventListener(type, listener, options);
          const index = windowListeners.findIndex((item) => item.type === type && item.listener === listener);
          if (index >= 0) windowListeners.splice(index, 1);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set(target, property, value) {
      return Reflect.set(target, property, value, target);
    },
  });

  return {
    document: shadowDocument,
    window: scopedWindow,
    cleanup() {
      windowListeners.splice(0).forEach(({ type, listener, options }) => {
        browserWindow.removeEventListener(type, listener, options);
      });
    },
  };
};

export const executeV8Script = ({ source, sourceUrl, environment }) => {
  const executor = new Function(
    "document",
    "window",
    "history",
    "location",
    "localStorage",
    "sessionStorage",
    "navigator",
    `${source}\n//# sourceURL=${sourceUrl}`
  );

  return executor(
    environment.document,
    environment.window,
    environment.window.history,
    environment.window.location,
    environment.window.localStorage,
    environment.window.sessionStorage,
    environment.window.navigator
  );
};

import React from "react";
import { createRoot } from "react-dom/client";

import IntelliTextAuthoringStudio from "./components/notes/admin/IntelliTextAuthoringStudio";
import {
  isIntelliTextAuthoringPath,
  resolveAuthoringAdminState,
} from "./intelliTextAuthoringEntryModel";
import "./styles/notes/adminNotes.css";
import "./styles/notes/adminIntelliTextAuthoringHost.css";

const ROOT_ID = "aspirenestIntelliTextAuthoringRoot";
const CONTENT_ID = "pageContent";
const MOBILE_STRIP_ID = "mobileContextStrip";

const readSession = () => window.__aspirenestAuthSession || null;
const readAdminData = () => window.__aspirenestRealAdminData || null;

function AuthoringGate() {
  const [session, setSession] = React.useState(readSession);
  const [adminData, setAdminData] = React.useState(readAdminData);

  React.useEffect(() => {
    const onSession = (event) => setSession(event.detail || readSession());
    const onAdminData = (event) => setAdminData(event.detail || readAdminData());
    window.addEventListener("aspirenest:session-ready", onSession);
    window.addEventListener("aspirenest:real-admin-data", onAdminData);
    return () => {
      window.removeEventListener("aspirenest:session-ready", onSession);
      window.removeEventListener("aspirenest:real-admin-data", onAdminData);
    };
  }, []);

  const state = resolveAuthoringAdminState({
    pathname: window.location.pathname,
    session,
    adminData,
  });

  if (state.state === "AUTH_LOADING" || state.state === "DATA_LOADING") {
    return (
      <section className="intelliTextAuthoringHostState" role="status">
        <strong>AspireNest IntelliText Studio</strong>
        <p>
          {state.state === "AUTH_LOADING"
            ? "Verifying Admin session…"
            : "Loading the canonical Note…"}
        </p>
      </section>
    );
  }

  if (state.state === "ADMIN_REQUIRED") {
    const returnTo = `${window.location.pathname}${window.location.search || ""}`;
    return (
      <section className="intelliTextAuthoringHostState isError" role="alert">
        <strong>Admin access required</strong>
        <p>Use the verified AspireNest Admin account to open IntelliText Studio.</p>
        <button
          type="button"
          onClick={() =>
            window.location.assign(
              `${window.location.origin}/login?returnTo=${encodeURIComponent(
                returnTo
              )}`
            )
          }
        >
          Open Admin Login
        </button>
      </section>
    );
  }

  if (state.state !== "READY") {
    return (
      <section className="intelliTextAuthoringHostState isError" role="alert">
        <strong>Canonical Note unavailable</strong>
        <p>
          The requested Note ID was not found in the live Admin catalog. No duplicate Note was created.
        </p>
        <button
          type="button"
          onClick={() =>
            window.location.assign(
              `${window.location.origin}/admin/content/notes/migration`
            )
          }
        >
          Back to migration
        </button>
      </section>
    );
  }

  return (
    <section className="coursePages intelliTextAuthoringRoute">
      <IntelliTextAuthoringStudio
        canonicalNote={state.resource}
        onBack={() =>
          window.location.assign(
            `${window.location.origin}/admin/content/notes/migration`
          )
        }
      />
    </section>
  );
}

const mountAuthoringRoute = () => {
  if (!isIntelliTextAuthoringPath(window.location.pathname)) return;
  if (document.getElementById(ROOT_ID)) return;

  const mount = () => {
    const main = document.getElementById("main-content");
    if (!main) {
      window.setTimeout(mount, 25);
      return;
    }

    const pageContent = document.getElementById(CONTENT_ID);
    const mobileStrip = document.getElementById(MOBILE_STRIP_ID);
    if (pageContent) pageContent.hidden = true;
    if (mobileStrip) mobileStrip.hidden = true;

    const rootNode = document.createElement("div");
    rootNode.id = ROOT_ID;
    rootNode.className = "aspirenestIntelliTextAuthoringHost";
    main.appendChild(rootNode);

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search || ""}`
    );

    createRoot(rootNode).render(
      <React.StrictMode>
        <AuthoringGate />
      </React.StrictMode>
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
};

mountAuthoringRoute();

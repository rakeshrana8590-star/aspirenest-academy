import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AdminIntelliTextMigrationRoute from "./components/notes/admin/AdminIntelliTextMigrationRoute";
import {
  INTELLITEXT_MIGRATION_PATH,
  isIntelliTextMigrationPath,
  resolveMigrationAdminState,
} from "./intelliTextMigrationEntryModel";
import "./styles/notes/adminIntelliTextMigration.css";
import "./styles/notes/adminIntelliTextMigrationHost.css";

const ROOT_ID = "aspirenestIntelliTextMigrationRoot";
const CONTENT_ID = "pageContent";
const MOBILE_STRIP_ID = "mobileContextStrip";

const readSession = () => window.__aspirenestAuthSession || null;
const readAdminData = () => window.__aspirenestRealAdminData || null;

function MigrationGate() {
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

  const state = resolveMigrationAdminState({ session, adminData });

  if (state.state === "AUTH_LOADING" || state.state === "DATA_LOADING") {
    return (
      <section className="intelliTextMigrationHostState" role="status">
        <strong>AspireNest IntelliText Migration</strong>
        <p>{state.state === "AUTH_LOADING" ? "Verifying Admin session…" : "Loading the live Notes catalog…"}</p>
      </section>
    );
  }

  if (state.state === "ADMIN_REQUIRED") {
    return (
      <section className="intelliTextMigrationHostState isError" role="alert">
        <strong>Admin access required</strong>
        <p>Sign in with the verified AspireNest Admin account to prepare or import IntelliText drafts.</p>
        <button type="button" onClick={() => window.location.assign(`/login?returnTo=${encodeURIComponent(INTELLITEXT_MIGRATION_PATH)}`)}>
          Open Admin Login
        </button>
      </section>
    );
  }

  return (
    <AdminIntelliTextMigrationRoute
      universalContent={state.resources}
      onBack={() => window.location.assign("/admin#admin/content/notes")}
    />
  );
}

const mountMigrationRoute = () => {
  if (!isIntelliTextMigrationPath(window.location.pathname)) return;
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
    rootNode.className = "aspirenestIntelliTextMigrationHost";
    main.appendChild(rootNode);

    window.history.replaceState(
      null,
      "",
      `${INTELLITEXT_MIGRATION_PATH}${window.location.search || ""}`
    );

    createRoot(rootNode).render(
      <React.StrictMode>
        <BrowserRouter>
          <MigrationGate />
        </BrowserRouter>
      </React.StrictMode>
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
};

mountMigrationRoute();

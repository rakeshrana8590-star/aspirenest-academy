import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import StudentNativeReaderRoute from "./components/notes/student/StudentNativeReaderRoute";
import {
  isIntelliTextStudentReaderPath,
  resolveIntelliTextStudentReaderState,
} from "./intelliTextStudentReaderEntryModel";
import "./styles/notes/studentNotes.css";

const ROOT_ID = "aspirenestIntelliTextStudentReaderRoot";

const readSession = () => window.__aspirenestAuthSession || null;
const readStudentData = () => window.__aspirenestStudentLiveData || null;

function ReaderHostState({
  badge,
  title,
  text,
  primaryLabel = "",
  onPrimary = null,
}) {
  return (
    <main className="intelliTextReaderPage">
      <section className="intelliTextReaderState">
        <span>{badge}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        <div>
          {primaryLabel && onPrimary ? (
            <button type="button" onClick={onPrimary}>
              {primaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="isSecondary"
            onClick={() =>
              window.location.assign(
                `${window.location.origin}/student#learning/notes`
              )
            }
          >
            Back to Notes
          </button>
        </div>
      </section>
    </main>
  );
}

function StudentReaderGate() {
  const [session, setSession] = React.useState(readSession);
  const [studentData, setStudentData] = React.useState(readStudentData);

  React.useEffect(() => {
    const onSession = (event) =>
      setSession(event.detail || readSession());
    const onStudentData = (event) =>
      setStudentData(event.detail || readStudentData());

    window.addEventListener("aspirenest:session-ready", onSession);
    window.addEventListener(
      "aspirenest:student-live-data",
      onStudentData
    );

    return () => {
      window.removeEventListener(
        "aspirenest:session-ready",
        onSession
      );
      window.removeEventListener(
        "aspirenest:student-live-data",
        onStudentData
      );
    };
  }, []);

  const state = resolveIntelliTextStudentReaderState({
    pathname: window.location.pathname,
    session,
    studentData,
  });

  if (state.state === "AUTH_LOADING") {
    return (
      <ReaderHostState
        badge="SECURE READER"
        title="Verifying your AspireNest account…"
        text="The premium IntelliText Reader opens only inside the authenticated Student experience."
      />
    );
  }

  if (state.state === "LOGIN_REQUIRED") {
    const returnTo = `${window.location.pathname}${window.location.search || ""}`;
    return (
      <ReaderHostState
        badge="LOGIN REQUIRED"
        title="Sign in to open this Note."
        text="The exact published Note route will remain preserved."
        primaryLabel="Open Login"
        onPrimary={() =>
          window.location.assign(
            `${window.location.origin}/login?returnTo=${encodeURIComponent(
              returnTo
            )}`
          )
        }
      />
    );
  }

  if (state.state === "DATA_LOADING") {
    return (
      <ReaderHostState
        badge="LOADING NOTE"
        title="Connecting the published IntelliText graph…"
        text="AspireNest is loading the exact Note identity and current access."
      />
    );
  }

  if (state.state === "ACCESS_REQUIRED") {
    return (
      <ReaderHostState
        badge="ACCESS REQUIRED"
        title="This Note is not included in the current access."
        text="The published content remains protected. No Public-page or PDF fallback was used."
        primaryLabel="Open My Access"
        onPrimary={() =>
          window.location.assign(
            `${window.location.origin}/student#learning/my-access`
          )
        }
      />
    );
  }

  if (state.state !== "READY") {
    return (
      <ReaderHostState
        badge="NOTE UNAVAILABLE"
        title="The published Note could not be found."
        text="The canonical Note identity is missing from the live Student catalog."
      />
    );
  }

  return (
    <StudentNativeReaderRoute
      universalContent={[state.canonicalNote]}
      user={session.user}
      buildNoteAccessDecision={() => state.decision}
    />
  );
}

const mountStudentReaderRoute = () => {
  if (!isIntelliTextStudentReaderPath(window.location.pathname)) {
    return;
  }

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const mount = () => {
    const main = document.getElementById("main-content");

    if (!main) {
      window.setTimeout(mount, 25);
      return;
    }

    const pageContent = document.getElementById("pageContent");
    const mobileStrip = document.getElementById("mobileContextStrip");

    if (pageContent) pageContent.hidden = true;
    if (mobileStrip) mobileStrip.hidden = true;

    const rootNode = document.createElement("div");
    rootNode.id = ROOT_ID;
    rootNode.className = "aspirenestIntelliTextStudentReaderHost";
    main.appendChild(rootNode);

    createRoot(rootNode).render(
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route
              path="/ctet-tet/notes/read/:textbookId"
              element={<StudentReaderGate />}
            />
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, {
      once: true,
    });
  } else {
    mount();
  }
};

mountStudentReaderRoute();

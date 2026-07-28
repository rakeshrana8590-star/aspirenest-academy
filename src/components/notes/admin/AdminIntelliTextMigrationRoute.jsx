import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  importIntelliTextMigrationBatch,
  loadIntelliTextMigrationBundle,
} from "../../../access/intelliTextPdfMigrationClient";
import {
  getCanonicalMigrationNoteId,
  getCanonicalMigrationPlanCode,
  normalizeIntelliTextMigrationBundle,
  selectCanonicalPublishedMigrationNotes,
} from "../../../access/intelliTextPdfMigrationContract";
import {
  getProtectedContentUrl,
  readProtectedContentAsset,
} from "../../../protectedContentAssetsService";

const LOCAL_BUNDLE_URL =
  "http://127.0.0.1:4191/intellitext-migration-bundle.json";

const clean = (value = "") => String(value ?? "").trim();

const resultLabel = (result = {}) => {
  if (result.action === "DRAFT_IMPORTED") return "Draft imported";
  if (result.action === "SKIPPED_EXISTING_DRAFT") return "Existing draft preserved";
  if (result.action === "FAILED") return "Failed";
  if (result.action === "BLOCKED_AFTER_SYSTEMIC_FAILURE") return "Blocked";
  return "Waiting";
};

export default function AdminIntelliTextMigrationRoute({
  universalContent = [],
  onBack = null,
}) {
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [bundleState, setBundleState] = useState("IDLE");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [overwriteExistingDraft, setOverwriteExistingDraft] = useState(false);
  const [buildState, setBuildState] = useState("IDLE");
  const [buildReport, setBuildReport] = useState(null);

  const publishedNotes = useMemo(
    () => selectCanonicalPublishedMigrationNotes(universalContent),
    [universalContent]
  );
  const canonicalById = useMemo(
    () =>
      new Map(
        publishedNotes.map((note) => [getCanonicalMigrationNoteId(note), note])
      ),
    [publishedNotes]
  );
  const resultById = useMemo(
    () =>
      new Map(
        (result?.results || []).map((item) => [item.textbookId, item])
      ),
    [result]
  );

  const sleep = (milliseconds) =>
    new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  const buildVerifiedBundle = async () => {
    if (publishedNotes.length !== 48) {
      setError(
        `Migration stopped. Live catalog contains ${publishedNotes.length} published Notes; expected 48.`
      );
      return;
    }

    const confirmed = window.confirm(
      "Prepare a structured IntelliText migration bundle from all 48 protected Note sources?\n\n" +
        "This step reads the existing PDF sources and creates a local review bundle. It does not write to Firebase."
    );
    if (!confirmed) return;

    setBuildState("READING_SOURCES");
    setBundleState("LOADING");
    setBuildReport(null);
    setBundle(null);
    setError("");
    setResult(null);

    try {
      const notes = [];
      for (let index = 0; index < publishedNotes.length; index += 1) {
        const note = publishedNotes[index];
        const textbookId = getCanonicalMigrationNoteId(note);
        setProgress({
          index,
          total: publishedNotes.length,
          state: "READING_PROTECTED_SOURCE",
          textbookId,
          title: note.title,
        });
        const asset = await readProtectedContentAsset(textbookId);
        const sourceUrl = getProtectedContentUrl(asset || {}, [
          "pdfUrl",
          "fileUrl",
          "sourceUrl",
          "downloadUrl",
          "assetUrl",
        ]);
        if (!sourceUrl) {
          throw new Error(`Protected PDF source missing for ${note.title || textbookId}.`);
        }
        notes.push({
          textbookId,
          title: clean(note.title) || textbookId,
          subjectId: clean(note.subjectId || note.subject || note.subjectName) || "general",
          chapterId: clean(note.chapterId || note.chapter || note.chapterName) || "general",
          planCode: getCanonicalMigrationPlanCode(note, "FREE"),
          sourceUrl,
        });
      }

      setBuildState("EXTRACTING");
      const startResponse = await fetch("http://127.0.0.1:4191/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const startPayload = await startResponse.json();
      if (!startResponse.ok || startPayload?.accepted !== true) {
        throw new Error(startPayload?.error || "Local IntelliText extraction could not start.");
      }

      const deadline = Date.now() + 45 * 60 * 1000;
      while (Date.now() < deadline) {
        await sleep(2000);
        const statusResponse = await fetch("http://127.0.0.1:4191/status", {
          cache: "no-store",
        });
        const statusPayload = await statusResponse.json();
        setBuildReport(statusPayload);
        setProgress({
          index: Number(statusPayload.completed || 0),
          total: Number(statusPayload.total || 48),
          state: statusPayload.state || "EXTRACTING",
          title: statusPayload.currentTitle || "",
          textbookId: statusPayload.currentTextbookId || "",
        });
        if (statusPayload.state === "READY") {
          const loaded = await loadIntelliTextMigrationBundle({
            url: LOCAL_BUNDLE_URL,
          });
          setBundle(loaded);
          setBundleState("READY");
          setBuildState("READY");
          return;
        }
        if (statusPayload.state === "FAILED") {
          throw new Error(statusPayload.error || "Structured extraction failed safely.");
        }
      }
      throw new Error("Structured extraction timed out before completion.");
    } catch (buildError) {
      setBundleState("ERROR");
      setBuildState("ERROR");
      setError(buildError?.message || "Structured extraction failed safely.");
    }
  };

  const loadLocalBundle = async () => {
    setBundleState("LOADING");
    setError("");
    setResult(null);
    try {
      const loaded = await loadIntelliTextMigrationBundle({
        url: LOCAL_BUNDLE_URL,
      });
      setBundle(loaded);
      setBundleState("READY");
    } catch (loadError) {
      setBundle(null);
      setBundleState("ERROR");
      setError(loadError?.message || "Migration bundle could not be loaded.");
    }
  };

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBundleState("LOADING");
    setError("");
    setResult(null);
    try {
      const parsed = JSON.parse(await file.text());
      const normalized = normalizeIntelliTextMigrationBundle(parsed);
      setBundle(normalized);
      setBundleState("READY");
    } catch (fileError) {
      setBundle(null);
      setBundleState("ERROR");
      setError(fileError?.message || "Selected migration bundle is invalid.");
    }
  };

  const startImport = async () => {
    if (!bundle) return;

    const blockedNotes = bundle.notes.filter(
      (note) => (note.quality?.blockingIssues || []).length > 0
    );
    if (blockedNotes.length > 0) {
      setError(
        `Import stopped. ${blockedNotes.length} Notes still have blocking extraction issues. Rebuild the complete-visual bundle before any Firebase write.`
      );
      return;
    }

    const missingIds = bundle.notes
      .map((note) => note.textbookId)
      .filter((id) => !canonicalById.has(id));

    if (missingIds.length > 0) {
      setError(
        `Migration stopped. ${missingIds.length} canonical Notes are missing from the live catalog.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Import ${bundle.notes.length} existing Notes as structured IntelliText drafts?\n\n` +
        "This writes learningTexts authoring drafts only. It does not delete PDFs, change learner data, or publish before review."
    );
    if (!confirmed) return;

    setBundleState("IMPORTING");
    setError("");
    setResult(null);
    setProgress({ index: 0, total: bundle.notes.length, state: "STARTING" });

    try {
      const nextResult = await importIntelliTextMigrationBatch({
        bundle,
        universalContent,
        overwriteExistingDraft,
        onProgress: setProgress,
      });
      setResult(nextResult);
      if (nextResult.failed.length > 0) {
        const firstFailure = nextResult.failed[0];
        setError(
          `${firstFailure.errorCode || "IMPORT_FAILED"}: ${
            firstFailure.error || "Structured draft import failed."
          }`
        );
        setBundleState("PARTIAL");
      } else {
        setBundleState("IMPORTED");
      }
    } catch (importError) {
      setBundleState("ERROR");
      setError(importError?.message || "Structured Notes migration failed safely.");
    }
  };

  const readyCount = bundle?.notes.filter(
    (note) => note.quality.blockingIssues.length === 0
  ).length || 0;
  const visualReviewCount = bundle?.notes.filter(
    (note) => note.quality.visualReviewRequired
  ).length || 0;

  return (
    <section className="coursePages intelliTextMigrationRoute">
      <header className="intelliTextMigrationHero">
        <div>
          <button
            type="button"
            className="intelliTextMigrationBack"
            onClick={() => {
              if (typeof onBack === "function") onBack();
              else navigate("/admin/content/notes/manage");
            }}
          >
            ← Notes Manager
          </button>
          <span>EXISTING NOTES MIGRATION</span>
          <h1>Convert all real PDF Notes into AspireNest IntelliText</h1>
          <p>
            Existing contentItems identities, plans, learner access, progress, and hidden PDF rollback sources remain preserved. Future Notes stay Native IntelliText-only.
          </p>
        </div>
        <div className="intelliTextMigrationLock">
          <strong>Future Notes</strong>
          <span>Native IntelliText only</span>
          <small>No new student-facing PDF-only Note</small>
        </div>
      </header>

      <div className="intelliTextMigrationStats">
        <article>
          <span>Published canonical Notes</span>
          <strong>{publishedNotes.length}</strong>
          <small>Expected: 48</small>
        </article>
        <article>
          <span>Migration bundle</span>
          <strong>{bundle?.notes.length || 0}</strong>
          <small>{bundleState}</small>
        </article>
        <article>
          <span>Text-fidelity ready</span>
          <strong>{readyCount}</strong>
          <small>Source hash = block hash</small>
        </article>
        <article>
          <span>Visual review</span>
          <strong>{visualReviewCount}</strong>
          <small>Exact page visuals embedded in blocks</small>
        </article>
      </div>

      <section className="intelliTextMigrationControls" aria-label="Migration controls">
        <div>
          <button
            type="button"
            className="intelliTextMigrationPrimary"
            onClick={buildVerifiedBundle}
            disabled={["READING_SOURCES", "EXTRACTING"].includes(buildState) || bundleState === "IMPORTING"}
          >
            {["READING_SOURCES", "EXTRACTING"].includes(buildState)
              ? `Preparing ${progress?.index || 0}/${progress?.total || 48}…`
              : "Prepare verified 48-Note IntelliText bundle"}
          </button>
          <button
            type="button"
            onClick={loadLocalBundle}
            disabled={["LOADING", "IMPORTING"].includes(bundleState)}
          >
            {bundleState === "LOADING"
              ? "Loading verified bundle…"
              : "Load verified 48-Note bundle"}
          </button>
          <label className="intelliTextMigrationFileButton">
            Select bundle file
            <input
              type="file"
              accept="application/json,.json"
              onChange={loadFile}
              disabled={bundleState === "IMPORTING"}
            />
          </label>
        </div>

        <label className="intelliTextMigrationOverwrite">
          <input
            type="checkbox"
            checked={overwriteExistingDraft}
            onChange={(event) => setOverwriteExistingDraft(event.target.checked)}
            disabled={bundleState === "IMPORTING"}
          />
          Replace an existing unpublished migration draft only when I explicitly approve it
        </label>

        <button
          type="button"
          className="intelliTextMigrationPrimary"
          onClick={startImport}
          disabled={!bundle || bundleState === "IMPORTING"}
        >
          {bundleState === "IMPORTING"
            ? ["UPLOADING_VISUAL", "VISUAL_UPLOADED"].includes(progress?.state)
              ? `Note ${(progress?.index || 0) + 1}/${progress?.total || 48} • Visuals ${progress?.visualCompleted || 0}/${progress?.visualTotal || 0}…`
              : `Importing ${progress?.index || 0}/${progress?.total || 48}…`
            : "Import all 48 as structured IntelliText drafts"}
        </button>
      </section>

      {buildReport && buildState !== "ERROR" ? (
        <div className="intelliTextMigrationMessage" role="status">
          <strong>{buildReport.state || buildState}</strong>
          <p>
            Extracted: {buildReport.completed || 0}/{buildReport.total || 48}
            {buildReport.currentTitle ? ` • ${buildReport.currentTitle}` : ""}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="intelliTextMigrationMessage isError" role="alert">
          <strong>Migration stopped safely</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {result ? (
        <div
          className={`intelliTextMigrationMessage ${
            result.failed.length > 0 ? "isError" : "isSuccess"
          }`}
          role={result.failed.length > 0 ? "alert" : "status"}
        >
          <strong>
            {result.failed.length > 0
              ? "Structured draft import stopped"
              : "Structured draft import complete"}
          </strong>
          <p>
            Imported: {result.imported.length} • Preserved existing drafts: {result.skipped.length} • Failed: {result.failed.length}
          </p>
          <p>
            {result.failed.length > 0
              ? "No retry should start until the first exact error below is corrected."
              : "Open each GREEN Note in IntelliText Studio, verify desktop/mobile/student preview, then publish the same canonical Note ID."}
          </p>
        </div>
      ) : null}

      {bundle ? (
        <div className="intelliTextMigrationTableWrap">
          <table className="intelliTextMigrationTable">
            <thead>
              <tr>
                <th>Note</th>
                <th>Pages</th>
                <th>Sections / Blocks</th>
                <th>Fidelity</th>
                <th>Visuals</th>
                <th>Migration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bundle.notes.map((note) => {
                const canonical = canonicalById.get(note.textbookId);
                const noteResult = resultById.get(note.textbookId);
                return (
                  <tr key={note.textbookId}>
                    <td>
                      <strong>{note.title}</strong>
                      <small>{note.textbookId}</small>
                      {!canonical ? <em>Canonical Note missing</em> : null}
                    </td>
                    <td>{note.pageCount}</td>
                    <td>
                      {note.sections.length} / {note.blockCount}
                    </td>
                    <td>
                      <span className="isGreen">{note.quality.textFidelity}</span>
                    </td>
                    <td>
                      {note.quality.visualPages.length > 0
                        ? `${note.quality.visualPages.length} page(s)`
                        : "None"}
                    </td>
                    <td>
                      <span
                        className={
                          ["FAILED", "BLOCKED_AFTER_SYSTEMIC_FAILURE"].includes(
                            noteResult?.action
                          )
                            ? "isRed"
                            : "isNeutral"
                        }
                      >
                        {resultLabel(noteResult)}
                      </span>
                      {noteResult?.error ? (
                        <small className="intelliTextMigrationRowError">
                          {noteResult.errorCode
                            ? `${noteResult.errorCode}: `
                            : ""}
                          {noteResult.error}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          window.location.assign(
                            `${window.location.origin}/admin/content/notes/intellitext/${encodeURIComponent(
                              note.textbookId
                            )}`
                          )
                        }
                        disabled={!canonical}
                      >
                        Open Studio
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="intelliTextMigrationEmpty">
          <span>NO VERIFIED BUNDLE LOADED</span>
          <h2>The runner must first extract all 48 real Notes.</h2>
          <p>
            Extraction is read-only. Firestore writes begin only after this Admin screen validates the complete bundle and you confirm the import.
          </p>
        </div>
      )}
    </section>
  );
}

import React, { useEffect, useMemo, useState } from "react";

import {
  INTELLITEXT_AUTHORING_VERSION_STATES,
  validateIntelliTextAuthoringDraft,
} from "../../../access/intelliTextAuthoringContract";
import {
  intelliTextAuthoringClient,
} from "../../../access/intelliTextAuthoringClient";
import IntelliTextBlockEditor, {
  createSection,
} from "./IntelliTextBlockEditor";
import IntelliTextPreviewPane from "./IntelliTextPreviewPane";

const slugifyId = (value, fallback) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);

  return normalized || fallback;
};

const getPlan = (note = {}) =>
  String(note.planType || note.plan || note.requiredPlan || "FREE")
    .trim()
    .toUpperCase();

const defaultEntitlementIds = (note = {}, textbookId = "") => {
  const plan = getPlan(note);
  const ids = [`item_${textbookId}`, "module_NOTES"];

  if (plan === "BASIC") {
    ids.push("plan_BASIC", "plan_PREMIUM", "plan_MENTORSHIP");
  } else if (plan === "PREMIUM") {
    ids.push("plan_PREMIUM", "plan_MENTORSHIP");
  } else if (plan === "MENTORSHIP") {
    ids.push("plan_MENTORSHIP");
  }

  return ids.slice(0, 6);
};

const initialStateFromNote = (note = {}) => {
  const textbookId = String(note.id || note.textbookId || "").trim();
  const plan = getPlan(note);

  return {
    access: {
      publicRead: plan === "FREE",
      readEntitlementIds:
        plan === "FREE" ? [] : defaultEntitlementIds(note, textbookId),
      requiredPlanCode: plan,
    },
    chapterId: slugifyId(
      note.chapterId || note.chapter || "chapter",
      "chapter"
    ),
    sections: [createSection()],
    subjectId: slugifyId(
      note.subjectId || note.subject || "subject",
      "subject"
    ),
    textbookId,
    title: note.title || "Untitled IntelliText note",
  };
};

export default function IntelliTextAuthoringStudio({
  canonicalNote,
  onBack = () => {},
}) {
  const initial = useMemo(
    () => initialStateFromNote(canonicalNote),
    [canonicalNote]
  );
  const [title, setTitle] = useState(initial.title);
  const [subjectId, setSubjectId] = useState(initial.subjectId);
  const [chapterId, setChapterId] = useState(initial.chapterId);
  const [sections, setSections] = useState(initial.sections);
  const [publicRead, setPublicRead] = useState(initial.access.publicRead);
  const [entitlementText, setEntitlementText] = useState(
    initial.access.readEntitlementIds.join("\n")
  );
  const [requiredPlanCode, setRequiredPlanCode] = useState(
    initial.access.requiredPlanCode
  );
  const [previewMode, setPreviewMode] = useState("DESKTOP");
  const [previewAudit, setPreviewAudit] = useState({
    desktop: false,
    mobile: false,
    studentExperience: false,
  });
  const [root, setRoot] = useState(null);
  const [versionId, setVersionId] = useState("");
  const [contentVersion, setContentVersion] = useState(1);
  const [baseContentVersion, setBaseContentVersion] = useState(0);
  const [versionState, setVersionState] = useState(
    INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT
  );
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const textbookId = initial.textbookId;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const workspace = await intelliTextAuthoringClient.loadAuthoringWorkspace(
          textbookId
        );

        if (cancelled) return;

        setRoot(workspace.root);

        if (workspace.editableVersion && workspace.graph) {
          const version = workspace.editableVersion;
          setVersionId(version.versionId || version.id);
          setContentVersion(Number(version.contentVersion || 1));
          setBaseContentVersion(Number(version.baseContentVersion || 0));
          setVersionState(
            version.versionState || INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT
          );
          setTitle(version.title || initial.title);
          setSubjectId(version.subjectId || initial.subjectId);
          setChapterId(version.chapterId || initial.chapterId);
          setSections(
            workspace.graph.sections.map((section) => ({
              blocks: section.blocks.map((block) => ({
                blockId: block.blockId || block.id,
                payload: block.payload || {},
                type: block.type,
              })),
              sectionId: section.sectionId || section.id,
              summary: section.summary || "",
              title: section.title || "Untitled section",
            }))
          );
          setPublicRead(version.access?.publicRead === true);
          setEntitlementText(
            (version.access?.readEntitlementIds || []).join("\n")
          );
          setRequiredPlanCode(
            version.access?.requiredPlanCode || initial.access.requiredPlanCode
          );
          setPreviewAudit({
            desktop: version.previewAudit?.desktop === true,
            mobile: version.previewAudit?.mobile === true,
            studentExperience:
              version.previewAudit?.studentExperience === true,
          });
        } else {
          const nextBase = Number(workspace.root?.contentVersion || 0);
          const nextVersion = nextBase + 1;
          setBaseContentVersion(nextBase);
          setContentVersion(nextVersion);
          setVersionId(`v${nextVersion}_${textbookId}`.slice(0, 128));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || "Authoring workspace could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (textbookId) load();

    return () => {
      cancelled = true;
    };
  }, [initial, textbookId]);

  useEffect(() => {
    setPreviewAudit((current) => ({
      ...current,
      [previewMode.toLowerCase()]: true,
    }));
  }, [previewMode]);

  const access = useMemo(
    () => ({
      publicRead,
      readEntitlementIds: entitlementText
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
      requiredPlanCode,
    }),
    [entitlementText, publicRead, requiredPlanCode]
  );

  const draftInput = useMemo(
    () => ({
      access,
      baseContentVersion,
      chapterId,
      contentVersion,
      previewAudit,
      sections,
      subjectId,
      textbookId,
      title,
      versionId,
    }),
    [
      access,
      baseContentVersion,
      chapterId,
      contentVersion,
      previewAudit,
      sections,
      subjectId,
      textbookId,
      title,
      versionId,
    ]
  );

  const validation = useMemo(() => {
    try {
      const graph = validateIntelliTextAuthoringDraft(draftInput);
      return { error: "", graph };
    } catch (validationError) {
      return {
        error: validationError?.message || "Draft is invalid.",
        graph: null,
      };
    }
  }, [draftInput]);

  const runAction = async (action, callback) => {
    setBusyAction(action);
    setMessage("");
    setError("");

    try {
      const result = await callback();

      if (result !== null) {
        setMessage(
          action === "publish"
            ? `Version ${contentVersion} published. Legacy PDF metadata was preserved.`
            : action === "review"
              ? "Version is ready for controlled review and publish."
              : "Draft saved safely."
        );
      }

      return result;
    } catch (actionError) {
      setError(actionError?.message || "The authoring action failed safely.");
      return null;
    } finally {
      setBusyAction("");
    }
  };

  const saveDraft = () =>
    runAction("save", async () => {
      const saved = await intelliTextAuthoringClient.saveDraftVersion({
        ...draftInput,
        versionState: INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT,
      });
      setVersionState(INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT);
      return saved;
    });

  const markReady = () =>
    runAction("review", async () => {
      await intelliTextAuthoringClient.saveDraftVersion({
        ...draftInput,
        versionState: INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT,
      });
      const ready = await intelliTextAuthoringClient.markVersionReadyForReview({
        previewAudit,
        textbookId,
        versionId,
      });
      setVersionState(INTELLITEXT_AUTHORING_VERSION_STATES.READY_FOR_REVIEW);
      return ready;
    });

  const publish = () =>
    runAction("publish", async () => {
      if (!window.confirm(
        `Publish version ${contentVersion} for "${title}"?\n\n` +
          "The canonical note will switch to Native Reader only after the complete publish transaction succeeds. The legacy PDF URL will not be removed."
      )) {
        return null;
      }

      await intelliTextAuthoringClient.saveDraftVersion({
        ...draftInput,
        versionState: INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT,
      });
      await intelliTextAuthoringClient.markVersionReadyForReview({
        previewAudit,
        textbookId,
        versionId,
      });
      const published = await intelliTextAuthoringClient.publishVersion({
        textbookId,
        versionId,
      });
      setVersionState(INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED);
      setRoot((current) => ({
        ...(current || {}),
        contentVersion,
        publicationState: "PUBLISHED",
        publishedVersionId: versionId,
      }));
      return published;
    });

  if (loading) {
    return (
      <section className="intelliTextAuthoringState">
        <span>SECURE LOADING</span>
        <h1>Opening the authoring workspace…</h1>
        <p>No content is written until the canonical note and current version are verified.</p>
      </section>
    );
  }

  return (
    <section className="intelliTextAuthoringStudio">
      <header className="intelliTextAuthoringHero">
        <div>
          <button type="button" onClick={onBack}>← Notes Manager</button>
          <span>ASPIRENEST INTELLITEXT AUTHORING</span>
          <h1>{title}</h1>
          <p>
            Canonical note <code>{textbookId}</code> • Version {contentVersion} • {versionState}
          </p>
        </div>
        <div className="intelliTextAuthoringHeroStatus">
          <strong>{validation.graph ? "Contract ready" : "Needs attention"}</strong>
          <span>{validation.graph?.sections.length || 0} sections</span>
          <span>{validation.graph?.blockCount || 0} blocks</span>
          <span>{validation.graph?.publishWriteCount || 0}/450 publish writes</span>
        </div>
      </header>

      <section className="intelliTextAuthoringMetadata">
        <div className="intelliTextAuthoringMetadataGrid">
          <label>
            <span>Canonical title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            <span>Subject ID</span>
            <input value={subjectId} onChange={(event) => setSubjectId(event.target.value)} />
          </label>
          <label>
            <span>Chapter ID</span>
            <input value={chapterId} onChange={(event) => setChapterId(event.target.value)} />
          </label>
          <label>
            <span>Required plan label</span>
            <input
              value={requiredPlanCode}
              onChange={(event) => setRequiredPlanCode(event.target.value.toUpperCase())}
            />
          </label>
        </div>

        <div className="intelliTextAccessMappingPanel">
          <div>
            <span>RESOURCE / ACCESS MAPPING</span>
            <h2>Fail-closed student read mapping</h2>
            <p>
              Use deterministic entitlement document IDs. Maximum six. Client access remains required, while Firestore Rules independently verify the published graph.
            </p>
          </div>
          <label className="intelliTextPublicReadToggle">
            <input
              type="checkbox"
              checked={publicRead}
              onChange={(event) => setPublicRead(event.target.checked)}
            />
            <span>Explicit public read</span>
          </label>
          <label>
            <span>Accepted entitlement IDs — one per line</span>
            <textarea
              value={entitlementText}
              onChange={(event) => setEntitlementText(event.target.value)}
              rows={6}
              disabled={publicRead}
              placeholder={"item_noteId\nmodule_NOTES\nplan_PREMIUM"}
            />
          </label>
        </div>
      </section>

      <div className="intelliTextAuthoringWorkspaceGrid">
        <IntelliTextBlockEditor sections={sections} onChange={setSections} />
        <IntelliTextPreviewPane
          mode={previewMode}
          onModeChange={setPreviewMode}
          sections={sections}
          title={title}
        />
      </div>

      <section className="intelliTextPreviewAuditPanel">
        <div>
          <span>PUBLISH GATE</span>
          <h2>Preview and student-experience audit</h2>
          <p>All three checks are mandatory before READY_FOR_REVIEW or publish.</p>
        </div>
        {[
          ["mobile", "Mobile preview audited"],
          ["desktop", "Desktop preview audited"],
          ["studentExperience", "Student route/access experience audited"],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={previewAudit[key]}
              onChange={(event) =>
                setPreviewAudit((current) => ({
                  ...current,
                  [key]: event.target.checked,
                }))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </section>

      {validation.error ? (
        <div className="intelliTextAuthoringNotice isError" role="alert">
          {validation.error}
        </div>
      ) : null}
      {error ? (
        <div className="intelliTextAuthoringNotice isError" role="alert">{error}</div>
      ) : null}
      {message ? (
        <div className="intelliTextAuthoringNotice isSuccess" role="status">{message}</div>
      ) : null}

      <footer className="intelliTextAuthoringActions">
        <div>
          <strong>Legacy PDF fallback preserved</strong>
          <span>
            Publishing changes delivery metadata only after success. It never removes the existing PDF URL.
          </span>
        </div>
        <button
          type="button"
          onClick={saveDraft}
          disabled={
            !validation.graph ||
            versionState === INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED ||
            Boolean(busyAction)
          }
        >
          {busyAction === "save" ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={markReady}
          disabled={
            !validation.graph ||
            versionState === INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED ||
            Boolean(busyAction)
          }
        >
          {busyAction === "review" ? "Checking…" : "Ready for review"}
        </button>
        <button
          type="button"
          className="isPublish"
          onClick={publish}
          disabled={
            !validation.graph ||
            !Object.values(previewAudit).every(Boolean) ||
            versionState === INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED ||
            Boolean(busyAction)
          }
        >
          {busyAction === "publish" ? "Publishing…" : "Publish version"}
        </button>
      </footer>
    </section>
  );
}

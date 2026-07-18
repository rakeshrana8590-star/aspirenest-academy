import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  INTELLITEXT_ANNOTATION_STATES,
  INTELLITEXT_ANNOTATION_TYPES,
} from "../../../access/intelliTextStudyWorkspaceContract";
import {
  createIntelliTextStudyWorkspaceClient,
} from "../../../access/intelliTextStudyWorkspaceClient";
import {
  INTELLITEXT_ANCHOR_RESOLUTION,
  applyIntelliTextAnnotationDecorations,
  captureIntelliTextSelection,
  clearIntelliTextAnnotationDecorations,
} from "../../../access/intelliTextSelectionAnchor";

const READER_ROOT_ID = "intelliTextReadingCanvas";

const actionLabel = (type) => ({
  HIGHLIGHT: "Highlight",
  UNDERLINE: "Underline",
  NOTE: "Add Note",
  DOUBT: "Mark as Doubt",
}[type] || type);

const displayDate = (value) => {
  const raw = typeof value?.toDate === "function"
    ? value.toDate()
    : value instanceof Date
      ? value
      : null;

  return raw
    ? raw.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : "Private";
};

export default function IntelliTextStudyWorkspace({
  model,
  activeSection,
  isOpen,
  onClose,
  onOpenSection,
}) {
  const client = useMemo(
    () => createIntelliTextStudyWorkspaceClient(),
    []
  );
  const [annotations, setAnnotations] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectionCandidate, setSelectionCandidate] = useState(null);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [composer, setComposer] = useState(null);
  const [resolutionById, setResolutionById] = useState({});
  const [activeTab, setActiveTab] = useState("ALL");

  const loadWorkspace = useCallback(async () => {
    if (!model?.ready) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const workspace = await client.loadTextbookWorkspace(
        model.textbookId
      );
      setAnnotations(workspace.annotations);
      setBookmarks(workspace.bookmarks);
    } catch (loadError) {
      setError(
        loadError?.message ||
          "Private study workspace could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [client, model]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    const root = document.getElementById(READER_ROOT_ID);

    if (!root || !model?.ready) {
      return undefined;
    }

    const results = applyIntelliTextAnnotationDecorations({
      rootElement: root,
      annotations: annotations.filter(
        (item) => item.sectionId === activeSection?.sectionId
      ),
      contentVersion: model.contentVersion,
    });
    const next = {};

    results.forEach((result) => {
      next[result.annotationId] = result.status;
    });

    setResolutionById(next);

    return () => {
      clearIntelliTextAnnotationDecorations(root);
    };
  }, [annotations, activeSection?.sectionId, model]);

  useEffect(() => {
    const root = document.getElementById(READER_ROOT_ID);

    if (!root) {
      return undefined;
    }

    const capture = () => {
      window.requestAnimationFrame(() => {
        try {
          const selection = window.getSelection();
          const captured = captureIntelliTextSelection({
            selection,
            rootElement: root,
          });
          const rect = selection.getRangeAt(0).getBoundingClientRect();

          setSelectionCandidate(captured);
          setToolbarPosition({
            left: Math.max(12, rect.left + rect.width / 2),
            top: Math.max(12, rect.top - 12),
          });
          setError("");
        } catch (selectionError) {
          if (
            selectionError?.code === "CROSS_BLOCK_SELECTION_DENIED"
          ) {
            setError(selectionError.message);
          }
          setSelectionCandidate(null);
          setToolbarPosition(null);
        }
      });
    };

    root.addEventListener("mouseup", capture);
    root.addEventListener("keyup", capture);

    return () => {
      root.removeEventListener("mouseup", capture);
      root.removeEventListener("keyup", capture);
    };
  }, [activeSection?.sectionId]);

  const clearSelection = () => {
    window.getSelection?.()?.removeAllRanges?.();
    setSelectionCandidate(null);
    setToolbarPosition(null);
  };

  const createAnnotation = async (type, body = "") => {
    if (!selectionCandidate) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await client.createAnnotation({
        ...selectionCandidate,
        body,
        type,
      });
      clearSelection();
      setComposer(null);
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError?.message || "Annotation could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectionAction = (type) => {
    if (
      type === INTELLITEXT_ANNOTATION_TYPES.NOTE ||
      type === INTELLITEXT_ANNOTATION_TYPES.DOUBT
    ) {
      setComposer({
        annotationId: null,
        body: "",
        exactText: selectionCandidate?.selectionAnchor?.exactText || "",
        mode: "CREATE",
        type,
      });
      return;
    }

    createAnnotation(type);
  };

  const editAnnotation = (annotation) => {
    setComposer({
      annotationId: annotation.annotationId,
      body: annotation.body || "",
      exactText: annotation.selectionAnchor?.exactText || "",
      mode: "EDIT",
      type: annotation.type,
    });
  };

  const saveComposer = async () => {
    if (!composer?.body?.trim()) {
      return;
    }

    if (composer.mode === "EDIT") {
      setSaving(true);
      setError("");

      try {
        await client.updateAnnotation(composer.annotationId, {
          body: composer.body,
        });
        setComposer(null);
        await loadWorkspace();
      } catch (saveError) {
        setError(saveError?.message || "Private note could not be updated.");
      } finally {
        setSaving(false);
      }

      return;
    }

    await createAnnotation(composer.type, composer.body);
  };

  const createBookmark = async () => {
    const block = activeSection?.blocks?.[0];

    if (!block || !model?.ready) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await client.createBookmark({
        textbookId: model.textbookId,
        sectionId: activeSection.sectionId,
        blockId: block.blockId,
        contentVersion: model.contentVersion,
        label: activeSection.title,
      });
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError?.message || "Bookmark could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const scrollToBlock = (sectionId, blockId) => {
    onOpenSection?.(sectionId);

    window.setTimeout(() => {
      document.getElementById(`block-${blockId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  };

  const removeAnnotation = async (annotationId) => {
    if (!window.confirm("Delete this private annotation?")) {
      return;
    }

    setSaving(true);
    try {
      await client.deleteAnnotation(annotationId);
      await loadWorkspace();
    } catch (deleteError) {
      setError(deleteError?.message || "Annotation could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDoubtState = async (annotation) => {
    setSaving(true);
    try {
      await client.updateAnnotation(annotation.annotationId, {
        state:
          annotation.state === INTELLITEXT_ANNOTATION_STATES.RESOLVED
            ? INTELLITEXT_ANNOTATION_STATES.ACTIVE
            : INTELLITEXT_ANNOTATION_STATES.RESOLVED,
      });
      await loadWorkspace();
    } catch (updateError) {
      setError(updateError?.message || "Doubt state could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const removeBookmark = async (bookmarkId) => {
    setSaving(true);
    try {
      await client.deleteBookmark(bookmarkId);
      await loadWorkspace();
    } catch (deleteError) {
      setError(deleteError?.message || "Bookmark could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  const visibleAnnotations = annotations.filter((annotation) => {
    if (activeTab === "MARKS") {
      return ["HIGHLIGHT", "UNDERLINE"].includes(annotation.type);
    }

    if (activeTab === "NOTES") {
      return ["NOTE", "DOUBT"].includes(annotation.type);
    }

    return true;
  });

  const unresolvedCount = Object.values(resolutionById).filter(
    (status) => status === INTELLITEXT_ANCHOR_RESOLUTION.UNRESOLVED
  ).length;

  return (
    <>
      {selectionCandidate && toolbarPosition ? (
        <div
          className="intelliTextSelectionToolbar"
          style={{
            left: toolbarPosition.left,
            top: toolbarPosition.top,
          }}
          role="toolbar"
          aria-label="Private study actions"
        >
          {Object.values(INTELLITEXT_ANNOTATION_TYPES).map((type) => (
            <button
              type="button"
              key={type}
              disabled={saving}
              onClick={() => handleSelectionAction(type)}
            >
              {actionLabel(type)}
            </button>
          ))}
        </div>
      ) : null}

      {composer ? (
        <div className="intelliTextStudyComposer" role="dialog" aria-modal="true">
          <div>
            <span>PRIVATE {actionLabel(composer.type).toUpperCase()}</span>
            <h3>{actionLabel(composer.type)}</h3>
            <p>{composer.exactText}</p>
            <textarea
              autoFocus
              maxLength={4000}
              value={composer.body}
              onChange={(event) =>
                setComposer((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
              placeholder={
                composer.type === "DOUBT"
                  ? "Write your doubt clearly…"
                  : "Write your private note…"
              }
            />
            <div>
              <button
                type="button"
                className="isSecondary"
                onClick={() => setComposer(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !composer.body.trim()}
                onClick={saveComposer}
              >
                Save privately
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <aside
        className={
          isOpen
            ? "intelliTextStudyWorkspace isOpen"
            : "intelliTextStudyWorkspace"
        }
        aria-hidden={!isOpen}
        data-intellitext-workspace="true"
      >
        <header>
          <div>
            <span>PRIVATE STUDY SPACE</span>
            <h2>My Workspace</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close workspace">
            ×
          </button>
        </header>

        <div className="intelliTextWorkspacePrivacy">
          Only your authenticated account can read or change these records.
        </div>

        <button
          type="button"
          className="intelliTextBookmarkCurrent"
          disabled={saving || !activeSection?.blocks?.[0]}
          onClick={createBookmark}
        >
          + Bookmark this section
        </button>

        <nav className="intelliTextWorkspaceTabs" aria-label="Workspace filters">
          {[
            ["ALL", "All"],
            ["MARKS", "Marks"],
            ["NOTES", "Notes"],
            ["BOOKMARKS", "Bookmarks"],
          ].map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={activeTab === id ? "isActive" : ""}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {error ? <p className="intelliTextWorkspaceError">{error}</p> : null}
        {loading ? <p className="intelliTextWorkspaceEmpty">Loading private workspace…</p> : null}

        {!loading && activeTab !== "BOOKMARKS" ? (
          <section className="intelliTextWorkspaceList">
            <div className="intelliTextWorkspaceListTitle">
              <strong>Annotations</strong>
              <span>{visibleAnnotations.length}</span>
            </div>

            {visibleAnnotations.length === 0 ? (
              <p className="intelliTextWorkspaceEmpty">
                Select text in one learning block to add your first private mark.
              </p>
            ) : (
              visibleAnnotations.map((annotation) => {
                const resolution = resolutionById[annotation.annotationId];
                const unresolved =
                  resolution === INTELLITEXT_ANCHOR_RESOLUTION.UNRESOLVED;

                return (
                  <article
                    key={annotation.annotationId}
                    className={
                      unresolved
                        ? "intelliTextWorkspaceCard isUnresolved"
                        : "intelliTextWorkspaceCard"
                    }
                  >
                    <button
                      type="button"
                      className="intelliTextWorkspaceCardMain"
                      onClick={() =>
                        scrollToBlock(annotation.sectionId, annotation.blockId)
                      }
                    >
                      <span>{actionLabel(annotation.type)}</span>
                      <strong>{annotation.selectionAnchor?.exactText}</strong>
                      {annotation.body ? <p>{annotation.body}</p> : null}
                      <small>
                        {unresolved ? "Unresolved anchor" : displayDate(annotation.updatedAt)}
                      </small>
                    </button>
                    <div>
                      {["NOTE", "DOUBT"].includes(annotation.type) ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => editAnnotation(annotation)}
                        >
                          Edit
                        </button>
                      ) : null}
                      {annotation.type === "DOUBT" ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => toggleDoubtState(annotation)}
                        >
                          {annotation.state === "RESOLVED" ? "Reopen" : "Resolve"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removeAnnotation(annotation.annotationId)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            )}

            {unresolvedCount > 0 ? (
              <div className="intelliTextUnresolvedSummary">
                <strong>Unresolved anchors</strong>
                <span>
                  {unresolvedCount} saved mark{unresolvedCount === 1 ? "" : "s"} remain visible but were not moved silently.
                </span>
              </div>
            ) : null}
          </section>
        ) : null}

        {!loading && ["ALL", "BOOKMARKS"].includes(activeTab) ? (
          <section className="intelliTextWorkspaceList">
            <div className="intelliTextWorkspaceListTitle">
              <strong>Bookmarks</strong>
              <span>{bookmarks.length}</span>
            </div>

            {bookmarks.length === 0 ? (
              <p className="intelliTextWorkspaceEmpty">No private bookmarks yet.</p>
            ) : (
              bookmarks.map((bookmark) => (
                <article className="intelliTextWorkspaceCard" key={bookmark.bookmarkId}>
                  <button
                    type="button"
                    className="intelliTextWorkspaceCardMain"
                    onClick={() =>
                      scrollToBlock(bookmark.sectionId, bookmark.blockId)
                    }
                  >
                    <span>Bookmark</span>
                    <strong>{bookmark.label || bookmark.sectionId}</strong>
                    <small>Return to exact section and block</small>
                  </button>
                  <div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeBookmark(bookmark.bookmarkId)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : null}
      </aside>
    </>
  );
}

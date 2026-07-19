import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
} from "react-router-dom";

import {
  createIntelliTextRevisionClient,
} from "../../../access/intelliTextRevisionClient";
import IntelliTextFlashcardReview from "./IntelliTextFlashcardReview";
import IntelliTextRevisionQueue from "./IntelliTextRevisionQueue";

const EMPTY_WORKSPACE = Object.freeze({
  due: Object.freeze([]),
  flashcards: Object.freeze([]),
  inactive: Object.freeze([]),
  revisionItems: Object.freeze([]),
  upcoming: Object.freeze([]),
});

const MANUAL_SOURCE = Object.freeze({
  blockId: "manual_block",
  contentVersion: 1,
  noteTitle: "My Study Workspace",
  sectionId: "manual_section",
  sectionTitle: "Manual flashcard",
  textbookId: "manual_workspace",
});

export default function MyStudyWorkspaceRoute({
  user = null,
}) {
  const navigate = useNavigate();
  const client = useMemo(
    () => createIntelliTextRevisionClient(),
    []
  );
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
  const [activeTab, setActiveTab] = useState("DUE");
  const [loading, setLoading] = useState(Boolean(user));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [manualComposerOpen, setManualComposerOpen] = useState(false);
  const [manualPrompt, setManualPrompt] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [now, setNow] = useState(() => new Date());

  const loadWorkspace = useCallback(async () => {
    if (!user?.uid) {
      setWorkspace(EMPTY_WORKSPACE);
      setLoading(false);
      return;
    }

    const loadNow = new Date();
    setNow(loadNow);
    setLoading(true);
    setError("");

    try {
      setWorkspace(
        await client.loadWorkspace({
          now: loadNow,
        })
      );
    } catch (loadError) {
      setError(
        loadError?.message ||
          "My Study Workspace could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [client, user?.uid]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const runMutation = async (action, successMessage) => {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
      await loadWorkspace();
      return true;
    } catch (mutationError) {
      setError(
        mutationError?.message ||
          "Private study record could not be updated."
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const createManualFlashcard = async () => {
    if (!manualPrompt.trim() || !manualAnswer.trim()) {
      return;
    }

    const created = await runMutation(
      () =>
        client.createManualFlashcard(
          {
            ...MANUAL_SOURCE,
            answer: manualAnswer,
            prompt: manualPrompt,
          },
          { now: new Date() }
        ),
      "Manual flashcard added to your due queue."
    );

    if (created) {
      setManualPrompt("");
      setManualAnswer("");
      setManualComposerOpen(false);
    }
  };

  const reviewItem = (item, rating) =>
    runMutation(
      () =>
        client.reviewRevisionItem(item.revisionId, rating, {
          now: new Date(),
        }),
      `Recall saved as ${rating.toLowerCase()}.`
    );

  const openSource = (item) => {
    navigate(
      `/ctet-tet/notes/read/${encodeURIComponent(item.textbookId)}`
    );
  };

  if (!user?.uid) {
    return (
      <main className="intelliTextRevisionWorkspacePage">
        <section className="intelliTextRevisionGate">
          <span>PRIVATE STUDY WORKSPACE</span>
          <h1>Login to open your revision system.</h1>
          <p>
            Flashcards, recall ratings, and due dates are private to your
            verified AspireNest account.
          </p>
          <div>
            <button type="button" onClick={() => navigate("/login")}>
              Login
            </button>
            <button
              type="button"
              className="isSecondary"
              onClick={() => navigate("/ctet-tet/notes")}
            >
              Back to Notes
            </button>
          </div>
        </section>
      </main>
    );
  }

  const allRevisionItems = [
    ...workspace.due,
    ...workspace.upcoming,
    ...workspace.inactive,
  ];

  return (
    <main className="intelliTextRevisionWorkspacePage">
      <header className="intelliTextRevisionWorkspaceHero">
        <div>
          <button
            type="button"
            className="intelliTextRevisionBack"
            onClick={() => navigate("/ctet-tet/notes")}
          >
            ← Notes Library
          </button>
          <span>ASPIRENEST PREPARATION ENGINE</span>
          <h1>My Study Workspace</h1>
          <p>
            Turn important concepts into private flashcards, recall them before
            revealing answers, and follow a calm due-date revision queue.
          </p>
        </div>

        <div className="intelliTextRevisionWorkspaceStats">
          <article>
            <strong>{workspace.due.length}</strong>
            <span>Due now</span>
          </article>
          <article>
            <strong>{workspace.flashcards.length}</strong>
            <span>Flashcards</span>
          </article>
          <article>
            <strong>{workspace.upcoming.length}</strong>
            <span>Upcoming</span>
          </article>
          <article>
            <strong>Private</strong>
            <span>Owner-only</span>
          </article>
        </div>
      </header>

      <section className="intelliTextRevisionWorkspaceCommand">
        <div>
          <span>READ → HIGHLIGHT → ACTIVE RECALL → SPACED REVISION</span>
          <h2>One private preparation loop</h2>
        </div>
        <button
          type="button"
          onClick={() => setManualComposerOpen(true)}
        >
          + New manual flashcard
        </button>
      </section>

      {notice ? (
        <p className="intelliTextRevisionNotice" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="intelliTextRevisionError" role="alert">
          {error}
        </p>
      ) : null}

      <nav
        className="intelliTextRevisionWorkspaceTabs"
        aria-label="My Study Workspace sections"
      >
        {[
          ["DUE", `Due (${workspace.due.length})`],
          ["FLASHCARDS", `Flashcards (${workspace.flashcards.length})`],
          ["REVISION", `Revision (${allRevisionItems.length})`],
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

      {loading ? (
        <section className="intelliTextRevisionLoading">
          Loading your private preparation workspace…
        </section>
      ) : null}

      {!loading && activeTab === "DUE" ? (
        <IntelliTextFlashcardReview
          item={workspace.due[0] || null}
          busy={busy}
          onRate={reviewItem}
          onOpenSource={openSource}
        />
      ) : null}

      {!loading && activeTab === "FLASHCARDS" ? (
        <section className="intelliTextFlashcardLibrary">
          {workspace.flashcards.length === 0 ? (
            <div className="intelliTextRevisionEmpty">
              <span>FLASHCARDS</span>
              <h3>No private flashcards yet.</h3>
              <p>
                Select text inside an IntelliText note or create a manual card.
              </p>
            </div>
          ) : (
            workspace.flashcards.map((flashcard) => (
              <article key={flashcard.flashcardId}>
                <span>{flashcard.sourceKind}</span>
                <h3>{flashcard.prompt}</h3>
                <p>{flashcard.answer}</p>
                <footer>
                  <small>
                    {flashcard.noteTitle || "My Study Workspace"}
                  </small>
                  <div>
                    {flashcard.textbookId !== "manual_workspace" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openSource(flashcard)}
                      >
                        Source
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        runMutation(
                          () =>
                            client.updateFlashcard(
                              flashcard.flashcardId,
                              {
                                state:
                                  flashcard.state === "ARCHIVED"
                                    ? "ACTIVE"
                                    : "ARCHIVED",
                              }
                            ),
                          "Flashcard state updated."
                        )
                      }
                    >
                      {flashcard.state === "ARCHIVED"
                        ? "Restore"
                        : "Archive"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Delete this flashcard and its queue item?"
                          )
                        ) {
                          runMutation(
                            () =>
                              client.deleteFlashcard(
                                flashcard.flashcardId
                              ),
                            "Flashcard deleted."
                          );
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </footer>
              </article>
            ))
          )}
        </section>
      ) : null}

      {!loading && activeTab === "REVISION" ? (
        <IntelliTextRevisionQueue
          items={allRevisionItems}
          now={now}
          busy={busy}
          onOpenSource={openSource}
          onStateChange={(item, state) =>
            runMutation(
              () =>
                client.updateRevisionState(item.revisionId, state),
              "Revision state updated."
            )
          }
          onDelete={(item) => {
            const flashcardBacked = item.sourceKind === "FLASHCARD";
            const confirmed = window.confirm(
              flashcardBacked
                ? "Delete this flashcard and its revision queue item?"
                : "Delete this revision item?"
            );

            if (confirmed) {
              runMutation(
                () =>
                  flashcardBacked
                    ? client.deleteFlashcard(item.sourceId)
                    : client.deleteRevisionItem(item.revisionId),
                flashcardBacked
                  ? "Flashcard and revision item deleted."
                  : "Revision item deleted."
              );
            }
          }}
        />
      ) : null}

      {manualComposerOpen ? (
        <div
          className="intelliTextManualFlashcardComposer"
          role="dialog"
          aria-modal="true"
          aria-label="Create manual flashcard"
        >
          <div>
            <span>PRIVATE FLASHCARD</span>
            <h2>Create a recall card</h2>
            <label>
              Prompt
              <textarea
                autoFocus
                maxLength={1000}
                value={manualPrompt}
                onChange={(event) => setManualPrompt(event.target.value)}
                placeholder="Write a question or recall cue…"
              />
            </label>
            <label>
              Answer
              <textarea
                maxLength={3000}
                value={manualAnswer}
                onChange={(event) => setManualAnswer(event.target.value)}
                placeholder="Write the answer you will reveal after recall…"
              />
            </label>
            <footer>
              <button
                type="button"
                className="isSecondary"
                onClick={() => setManualComposerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  !manualPrompt.trim() ||
                  !manualAnswer.trim()
                }
                onClick={createManualFlashcard}
              >
                Create + add to due queue
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </main>
  );
}

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  NOTES_ACTIONS,
} from "../../../access/notesActionPolicy";
import {
  getStudentNotesAccessPresentation,
} from "../../../access/notesStudentAssetRuntime";
import {
  buildIntelliTextReaderModel,
  calculateReaderSectionProgress,
  findIntelliTextNoteById,
  getAdjacentReaderSection,
} from "../../../access/intelliTextReaderModel";
import {
  createIntelliTextProgressRecord,
  readIntelliTextProgress,
  resolveContinueReadingSection,
  writeIntelliTextProgress,
} from "../../../access/intelliTextReaderProgress";
import {
  intelliTextPublishedContentClient,
} from "../../../access/intelliTextPublishedContentClient";
import IntelliTextBlockRenderer from "./IntelliTextBlockRenderer";
import IntelliTextStudyWorkspace from "./IntelliTextStudyWorkspace";

const FONT_SCALES = Object.freeze([
  {
    id: "compact",
    label: "A−",
    value: 0.94,
  },
  {
    id: "comfortable",
    label: "A",
    value: 1,
  },
  {
    id: "large",
    label: "A+",
    value: 1.08,
  },
]);

function ReaderState({
  badge,
  title,
  text,
  primaryLabel,
  onPrimary,
  secondaryLabel = "Back to Notes",
  onSecondary,
}) {
  return (
    <section className="intelliTextReaderState">
      <span>{badge}</span>
      <h1>{title}</h1>
      <p>{text}</p>

      <div>
        {primaryLabel && onPrimary ? (
          <button
            type="button"
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        ) : null}

        <button
          type="button"
          className="isSecondary"
          onClick={onSecondary}
        >
          {secondaryLabel}
        </button>
      </div>
    </section>
  );
}

export default function StudentNativeReaderRoute({
  universalContent = [],
  user = null,
  buildNoteAccessDecision,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { textbookId = "" } = useParams();

  const decodedTextbookId = decodeURIComponent(
    textbookId || ""
  );


  const exactSectionRequest = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const sectionId = params.get("sectionId") || "";
    const blockId = params.get("blockId") || "";
    const contentVersion = Number(params.get("contentVersion") || 0);
    const source = params.get("source") || "";

    return Object.freeze({
      blockId,
      contentVersion,
      sectionId,
      source,
    });
  }, [location.search]);

  const note = useMemo(
    () =>
      findIntelliTextNoteById(
        universalContent,
        decodedTextbookId
      ),
    [
      universalContent,
      decodedTextbookId,
    ]
  );

  const accessDecision = useMemo(
    () =>
      note &&
      typeof buildNoteAccessDecision ===
        "function"
        ? buildNoteAccessDecision(
            note,
            NOTES_ACTIONS.READ
          )
        : null,
    [
      note,
      buildNoteAccessDecision,
    ]
  );

  const accessPresentation = useMemo(
    () =>
      accessDecision
        ? getStudentNotesAccessPresentation(
            accessDecision
          )
        : {
            canOpen: false,
            disabled: true,
            busy: false,
            statusLabel:
              "Access verification unavailable",
          },
    [accessDecision]
  );

  const inlineModel = useMemo(
    () =>
      note
        ? buildIntelliTextReaderModel(note)
        : null,
    [note]
  );

  const [publishedModel, setPublishedModel] =
    useState(null);
  const [publishedContentState, setPublishedContentState] =
    useState("IDLE");
  const [publishedContentError, setPublishedContentError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    setPublishedModel(null);
    setPublishedContentError("");

    if (
      !note ||
      accessPresentation.canOpen !== true
    ) {
      setPublishedContentState("IDLE");
      return () => {
        cancelled = true;
      };
    }

    setPublishedContentState("LOADING");

    intelliTextPublishedContentClient
      .loadPublishedTextbook(decodedTextbookId)
      .then((publishedNote) => {
        if (cancelled) return;

        const nextModel =
          buildIntelliTextReaderModel(
            publishedNote
          );

        if (!nextModel?.ready) {
          throw new Error(
            "The published IntelliText graph is incomplete."
          );
        }

        setPublishedModel(nextModel);
        setPublishedContentState("READY");
      })
      .catch((error) => {
        if (cancelled) return;

        setPublishedContentError(
          error?.message ||
            "Published IntelliText content could not be loaded."
        );
        setPublishedContentState("ERROR");
      });

    return () => {
      cancelled = true;
    };
  }, [
    note,
    decodedTextbookId,
    accessPresentation.canOpen,
  ]);

  const model = useMemo(
    () =>
      publishedModel || inlineModel,
    [publishedModel, inlineModel]
  );

  const [activeSectionId, setActiveSectionId] =
    useState("");
  const [tocOpen, setTocOpen] =
    useState(false);
  const [focusMode, setFocusMode] =
    useState(false);
  const [fontScale, setFontScale] =
    useState(1);
  const [workspaceOpen, setWorkspaceOpen] =
    useState(false);
  const [focusedBlockId, setFocusedBlockId] =
    useState("");

  useEffect(() => {
    if (
      !model?.ready ||
      accessPresentation.canOpen !== true
    ) {
      setActiveSectionId("");
      return;
    }

    const storage =
      typeof window !== "undefined"
        ? window.localStorage
        : null;
    const progress =
      readIntelliTextProgress({
        storage,
        uid: user?.uid || "",
        textbookId: model.textbookId,
        contentVersion:
          model.contentVersion,
      });
    const exactSection =
      exactSectionRequest.source === "mistake-book" &&
      exactSectionRequest.sectionId &&
      exactSectionRequest.contentVersion === model.contentVersion
        ? model.sections.find(
            (section) =>
              section.sectionId === exactSectionRequest.sectionId
          )
        : null;
    const initialSection =
      exactSection ||
      resolveContinueReadingSection({
        sections: model.sections,
        progress,
      });

    setActiveSectionId(
      initialSection?.sectionId || ""
    );
  }, [
    model,
    accessPresentation.canOpen,
    user?.uid,
    exactSectionRequest,
  ]);

  useEffect(() => {
    if (
      accessPresentation.canOpen !== true ||
      exactSectionRequest.source !== "mistake-book" ||
      !exactSectionRequest.blockId ||
      exactSectionRequest.contentVersion !== model?.contentVersion ||
      activeSectionId !== exactSectionRequest.sectionId
    ) {
      setFocusedBlockId("");
      return undefined;
    }

    const targetId = `block-${exactSectionRequest.blockId}`;
    const timer = window.setTimeout(() => {
      const target = document.getElementById(targetId);

      if (target) {
        setFocusedBlockId(exactSectionRequest.blockId);
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [
    accessPresentation.canOpen,
    activeSectionId,
    exactSectionRequest,
    model?.contentVersion,
  ]);

  const activeSection = useMemo(
    () =>
      model?.sections?.find(
        (section) =>
          section.sectionId ===
          activeSectionId
      ) ||
      model?.sections?.[0] ||
      null,
    [
      model,
      activeSectionId,
    ]
  );

  const navigation = useMemo(
    () =>
      getAdjacentReaderSection(
        model?.sections || [],
        activeSection?.sectionId || ""
      ),
    [
      model,
      activeSection?.sectionId,
    ]
  );

  const progressPercent =
    calculateReaderSectionProgress(
      navigation.index,
      model?.sections?.length || 0
    );

  const openSection = (sectionId) => {
    const target =
      model?.sections?.find(
        (section) =>
          section.sectionId === sectionId
      );

    if (!target) {
      return;
    }

    setActiveSectionId(target.sectionId);
    setTocOpen(false);

    if (user?.uid) {
      const storage =
        typeof window !== "undefined"
          ? window.localStorage
          : null;
      const index =
        model.sections.findIndex(
          (section) =>
            section.sectionId ===
            target.sectionId
        );

      writeIntelliTextProgress({
        storage,
        record:
          createIntelliTextProgressRecord({
            uid: user.uid,
            textbookId:
              model.textbookId,
            contentVersion:
              model.contentVersion,
            sectionId:
              target.sectionId,
            blockId:
              target.blocks[0]?.blockId ||
              null,
            progressPercent:
              calculateReaderSectionProgress(
                index,
                model.sections.length
              ),
          }),
      });
    }

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const returnToNotes = () => {
    navigate(
      model?.returnRoute ||
        "/ctet-tet/notes"
    );
  };

  if (!note) {
    return (
      <main className="intelliTextReaderPage">
        <ReaderState
          badge="NOTE NOT FOUND"
          title="This native note is unavailable."
          text="The note identity is missing, unpublished, or no longer part of the public Notes catalog."
          onSecondary={() =>
            navigate("/ctet-tet/notes")
          }
        />
      </main>
    );
  }

  if (
    accessPresentation.canOpen !== true
  ) {
    const requiresLogin = !user;

    return (
      <main className="intelliTextReaderPage">
        <ReaderState
          badge={
            accessPresentation.busy
              ? "CHECKING ACCESS"
              : "ACCESS REQUIRED"
          }
          title={
            accessPresentation.busy
              ? "Verifying your Notes access…"
              : "This IntelliText note is locked."
          }
          text={
            accessPresentation.statusLabel ||
            "Access must be verified before the Native Reader can load."
          }
          primaryLabel={
            requiresLogin
              ? "Login"
              : accessPresentation.busy
                ? ""
                : "View Access"
          }
          onPrimary={
            accessPresentation.busy
              ? null
              : () =>
                  navigate(
                    requiresLogin
                      ? "/login"
                      : "/my-access"
                  )
          }
          onSecondary={() =>
            navigate("/ctet-tet/notes")
          }
        />
      </main>
    );
  }

  if (
    !inlineModel?.ready &&
    publishedContentState === "LOADING"
  ) {
    return (
      <main className="intelliTextReaderPage">
        <ReaderState
          badge="SECURE CONTENT LOADING"
          title="Loading the published IntelliText graph…"
          text="Your existing Notes access was verified before any native section or learning block was requested."
          onSecondary={returnToNotes}
        />
      </main>
    );
  }

  if (!model?.ready) {
    return (
      <main className="intelliTextReaderPage">
        <ReaderState
          badge="READER NOT READY"
          title="This native note is not ready for student delivery."
          text={
            publishedContentError ||
            "Its canonical sections or approved learning blocks are incomplete. The existing PDF inventory remains unchanged."
          }
          onSecondary={returnToNotes}
        />
      </main>
    );
  }

  return (
    <main
      className={
        focusMode
          ? "intelliTextReaderPage isFocusMode"
          : "intelliTextReaderPage"
      }
      style={{
        "--intelliText-font-scale":
          fontScale,
      }}
    >
      <header className="intelliTextReaderHeader">
        <button
          type="button"
          className="intelliTextBackButton"
          onClick={returnToNotes}
        >
          ← Back to Chapter
        </button>

        <div className="intelliTextReaderTitle">
          <span>ASPIRENEST INTELLITEXT</span>
          <h1>{model.title}</h1>
          <p>
            {model.estimatedReadingMinutes} min read
            {" • "}
            Version {model.contentVersion}
          </p>
        </div>

        <div className="intelliTextReaderTools">
          <button
            type="button"
            className="intelliTextTocToggle"
            onClick={() =>
              setTocOpen((current) => !current)
            }
            aria-expanded={tocOpen}
          >
            Contents
          </button>

          <div
            className="intelliTextFontControls"
            aria-label="Reader font size"
          >
            {FONT_SCALES.map((scale) => (
              <button
                type="button"
                key={scale.id}
                className={
                  fontScale === scale.value
                    ? "isActive"
                    : ""
                }
                onClick={() =>
                  setFontScale(scale.value)
                }
                aria-label={`Use ${scale.id} text size`}
              >
                {scale.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={
              workspaceOpen
                ? "intelliTextWorkspaceButton isActive"
                : "intelliTextWorkspaceButton"
            }
            onClick={() =>
              setWorkspaceOpen(
                (current) => !current
              )
            }
            aria-expanded={workspaceOpen}
          >
            Study
          </button>

          <button
            type="button"
            className={
              focusMode
                ? "intelliTextFocusButton isActive"
                : "intelliTextFocusButton"
            }
            onClick={() =>
              setFocusMode(
                (current) => !current
              )
            }
            aria-pressed={focusMode}
          >
            Focus
          </button>
        </div>
      </header>

      <div className="intelliTextProgressTrack">
        <span
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>

      <div
        className={
          workspaceOpen
            ? "intelliTextReaderShell isWorkspaceOpen"
            : "intelliTextReaderShell"
        }
      >
        <aside
          className={
            tocOpen
              ? "intelliTextToc isOpen"
              : "intelliTextToc"
          }
          aria-label="Table of contents"
        >
          <div className="intelliTextTocHeader">
            <div>
              <span>CONTENTS</span>
              <strong>
                {model.sections.length} sections
              </strong>
            </div>

            <button
              type="button"
              onClick={() =>
                setTocOpen(false)
              }
              aria-label="Close table of contents"
            >
              ×
            </button>
          </div>

          <nav>
            {model.toc.map((item) => (
              <button
                type="button"
                key={item.sectionId}
                className={
                  item.sectionId ===
                  activeSection?.sectionId
                    ? "isActive"
                    : ""
                }
                onClick={() =>
                  openSection(
                    item.sectionId
                  )
                }
                aria-current={
                  item.sectionId ===
                  activeSection?.sectionId
                    ? "location"
                    : undefined
                }
              >
                <span>
                  {String(
                    item.index + 1
                  ).padStart(2, "0")}
                </span>
                <span>
                  <strong>
                    {item.title}
                  </strong>
                  <small>
                    {item.blockCount} blocks
                  </small>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <article
          id="intelliTextReadingCanvas"
          className="intelliTextReadingCanvas"
        >
          <div className="intelliTextSectionKicker">
            Section {navigation.index + 1} of{" "}
            {model.sections.length}
          </div>

          <h2>{activeSection?.title}</h2>

          {activeSection?.summary ? (
            <p className="intelliTextSectionSummary">
              {activeSection.summary}
            </p>
          ) : null}

          <div className="intelliTextBlocks">
            {activeSection?.blocks.map(
              (block) => (
                <section
                  key={block.blockId}
                  id={`block-${block.blockId}`}
                  className={
                    focusedBlockId === block.blockId
                      ? "intelliTextBlock isMistakeBookFocus"
                      : "intelliTextBlock"
                  }
                  data-block-type={block.type}
                  data-intellitext-block="true"
                  data-textbook-id={model.textbookId}
                  data-section-id={activeSection.sectionId}
                  data-block-id={block.blockId}
                  data-content-version={model.contentVersion}
                >
                  <IntelliTextBlockRenderer
                    block={block}
                  />
                </section>
              )
            )}
          </div>

          <footer className="intelliTextSectionNavigation">
            <button
              type="button"
              disabled={!navigation.previous}
              onClick={() =>
                navigation.previous &&
                openSection(
                  navigation.previous.sectionId
                )
              }
            >
              <span>Previous</span>
              <strong>
                {navigation.previous?.title ||
                  "Start"}
              </strong>
            </button>

            <div>
              <strong>{progressPercent}%</strong>
              <span>Reading progress</span>
            </div>

            <button
              type="button"
              disabled={!navigation.next}
              onClick={() =>
                navigation.next &&
                openSection(
                  navigation.next.sectionId
                )
              }
            >
              <span>Next</span>
              <strong>
                {navigation.next?.title ||
                  "Completed"}
              </strong>
            </button>
          </footer>
        </article>

        <IntelliTextStudyWorkspace
          model={model}
          activeSection={activeSection}
          isOpen={workspaceOpen}
          onClose={() => setWorkspaceOpen(false)}
          onOpenSection={openSection}
        />
      </div>
    </main>
  );
}

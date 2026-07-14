import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";

import {
  LIVE_CLASS_STATUS,
  LIVE_PLATFORMS,
  VIDEO_CLASS_MODES,
  VIDEO_SOURCE_TYPES,
  VIDEO_STATUS,
} from "./videoConstants.js";

import { isVideoContentItem } from "./videoUtils.js";

import {
  buildVideoFormFromItem,
  buildVideoSavePayload,
  createDefaultVideoForm,
  findDuplicateVideoClass,
  getUniqueVideoLabels,
  validateVideoClassForm,
} from "./videoFormUtils.js";

const builderChecklist = [
  "Plan access selected",
  "Subject + chapter connected",
  "Student classroom source ready",
  "Publish state controlled",
];

export default function VideoClassFormRoute({
  db,
  universalContent = [],
  notesSubjectsList = [],
  notesChaptersList = [],
  reloadSubjects,
  reloadChapters,
  reloadContent,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("editId");

  const editItem = React.useMemo(
    () => universalContent.find((item) => item.id === editId) || null,
    [editId, universalContent]
  );

  const [videoForm, setVideoForm] = React.useState(() =>
    createDefaultVideoForm()
  );
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (editId && editItem) {
      setVideoForm(buildVideoFormFromItem(editItem));
      return;
    }

    if (!editId) {
      setVideoForm(createDefaultVideoForm());
    }
  }, [editId, editItem]);

  const subjectOptions = React.useMemo(() => {
    const videoSubjects = universalContent
      .filter(isVideoContentItem)
      .map((item) => item.subject);

    return getUniqueVideoLabels([...notesSubjectsList, ...videoSubjects]);
  }, [notesSubjectsList, universalContent]);

  const chapterOptions = React.useMemo(() => {
    const videoChapters = universalContent
      .filter(isVideoContentItem)
      .map((item) => item.chapter);

    return getUniqueVideoLabels([...notesChaptersList, ...videoChapters]);
  }, [notesChaptersList, universalContent]);

  const updateField = (field, value) => {
    setFormError("");

    setVideoForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const isRecordedMode = videoForm.classMode === VIDEO_CLASS_MODES.RECORDED;
  const isLiveMode = videoForm.classMode === VIDEO_CLASS_MODES.LIVE;

  const handleSaveVideoClass = async (event) => {
    event.preventDefault();

    const validationMessage = validateVideoClassForm(videoForm);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const duplicateClass = findDuplicateVideoClass({
      universalContent,
      videoForm,
      editId,
    });

    if (duplicateClass) {
      setFormError(
        "Duplicate class found with same title, plan, subject, chapter, class mode, and live schedule."
      );
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const payload = buildVideoSavePayload(videoForm);

      if (editId) {
        await updateDoc(doc(db, "contentItems", editId), payload);
      } else {
        await addDoc(collection(db, "contentItems"), {
          ...payload,
          createdAt: new Date(),
        });
      }

      await reloadContent?.();
      await reloadSubjects?.();
      await reloadChapters?.();

      navigate("/admin/content/videos/manage");
    } catch (error) {
      setFormError(error?.message || "Unable to save class. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="coursePages videoFormPage videoClassBuilderPage">
      <div className="videoClassBuilderShell">
        <section className="videoClassBuilderHero">
          <div className="videoClassBuilderHeroCopy">
            <span className="videoClassBuilderKicker">
              {editId ? "EDIT CLASSROOM ITEM" : "CLASSROOM BUILDER"}
            </span>

            <h1>{editId ? "Edit Class" : "Add Video / Live Class"}</h1>

            <p>
              Build recorded lessons and live classrooms with plan access,
              subject shelves, replay links, schedule state, and student-ready
              publishing from one protected admin system.
            </p>

            <div className="videoClassBuilderHeroActions">
              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos")}
              >
                ← Video Manager
              </button>
            </div>
          </div>

          <aside className="videoClassBuilderStatusPanel">
            <div className="videoClassBuilderPanelHeader">
              <span>Builder Status</span>
              <strong>{isLiveMode ? "Live Mode" : "Recorded Mode"}</strong>
            </div>

            <div className="videoClassBuilderStatusGrid">
              <article>
                <strong>{videoForm.planType || "FREE"}</strong>
                <span>Plan Access</span>
              </article>

              <article>
                <strong>{videoForm.status || "draft"}</strong>
                <span>Publish State</span>
              </article>

              <article>
                <strong>{videoForm.subject || "Subject"}</strong>
                <span>Subject Shelf</span>
              </article>

              <article>
                <strong>{videoForm.chapter || "Chapter"}</strong>
                <span>Chapter Shelf</span>
              </article>
            </div>

            <div className="videoClassBuilderFlowLine">
              <span>Create</span>
              <i />
              <span>Protect</span>
              <i />
              <span>Publish</span>
            </div>
          </aside>
        </section>

        <form
          className="contentStudioForm videoClassBuilderForm"
          onSubmit={handleSaveVideoClass}
        >
          <aside className="videoClassBuilderRail">
            <div className="videoClassBuilderRailHeader">
              <span>Class Type</span>
              <strong>Choose workflow</strong>
            </div>

            <div className="videoFormModeTabs videoClassBuilderModeTabs">
              <button
                type="button"
                className={isRecordedMode ? "backButton active" : "backButton"}
                onClick={() =>
                  updateField("classMode", VIDEO_CLASS_MODES.RECORDED)
                }
              >
                🎬 Recorded Lesson
              </button>

              <button
                type="button"
                className={isLiveMode ? "backButton active" : "backButton"}
                onClick={() => updateField("classMode", VIDEO_CLASS_MODES.LIVE)}
              >
                🔴 Live Class
              </button>
            </div>

            <div className="videoClassBuilderChecklist">
              {builderChecklist.map((item) => (
                <span key={item}>✓ {item}</span>
              ))}
            </div>

            <div className="videoClassBuilderSafetyNote">
              <strong>Secure classroom note</strong>
              <p>
                YouTube/Drive/external links can be embedded and gated by plan,
                but public platform URLs cannot be made impossible to share.
              </p>
            </div>
          </aside>

          <div className="videoClassBuilderWorkspace">
            {formError && (
              <div className="contentStudioItem videoEmptyState videoClassBuilderError">
                <strong>{formError}</strong>
              </div>
            )}

            <section className="videoClassBuilderCard">
              <div className="videoClassBuilderCardHeader">
                <span>Core Details</span>
                <h2>Classroom identity</h2>
                <p>
                  These fields decide where the class appears in student plan,
                  subject, and chapter shelves.
                </p>
              </div>

              <div className="contentStudioGrid">
                <div>
                  <label>Class Title</label>
                  <input
                    type="text"
                    value={videoForm.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="Example: Child Development — Piaget Theory"
                  />
                </div>

                <div>
                  <label>Plan Access</label>
                  <select
                    value={videoForm.planType}
                    onChange={(event) =>
                      updateField("planType", event.target.value)
                    }
                  >
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="MENTORSHIP">MENTORSHIP</option>
                  </select>
                </div>

                <div>
                  <label>Subject</label>
                  <input
                    type="text"
                    value={videoForm.subject}
                    list="video-subject-options"
                    onChange={(event) =>
                      updateField("subject", event.target.value)
                    }
                    placeholder="Example: Child Development"
                  />

                  <datalist id="video-subject-options">
                    {subjectOptions.map((subject) => (
                      <option value={subject} key={subject} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label>Chapter</label>
                  <input
                    type="text"
                    value={videoForm.chapter}
                    list="video-chapter-options"
                    onChange={(event) =>
                      updateField("chapter", event.target.value)
                    }
                    placeholder="Example: Learning Theories"
                  />

                  <datalist id="video-chapter-options">
                    {chapterOptions.map((chapter) => (
                      <option value={chapter} key={chapter} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label>Mentor Name</label>
                  <input
                    type="text"
                    value={videoForm.mentorName}
                    onChange={(event) =>
                      updateField("mentorName", event.target.value)
                    }
                    placeholder="Example: Dr. Varsha D. Maru"
                  />
                </div>

                <div>
                  <label>Duration</label>
                  <input
                    type="text"
                    value={videoForm.duration}
                    onChange={(event) =>
                      updateField("duration", event.target.value)
                    }
                    placeholder="Example: 42 min"
                  />
                </div>

                <div>
                  <label>Thumbnail URL</label>
                  <input
                    type="url"
                    value={videoForm.thumbnailUrl}
                    onChange={(event) =>
                      updateField("thumbnailUrl", event.target.value)
                    }
                    placeholder="Optional thumbnail image URL"
                  />
                </div>

                <div>
                  <label>Status</label>
                  <select
                    value={videoForm.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  >
                    <option value={VIDEO_STATUS.PUBLISHED}>Published</option>
                    <option value={VIDEO_STATUS.DRAFT}>Draft</option>
                    <option value={VIDEO_STATUS.UNPUBLISHED}>
                      Unpublished
                    </option>
                    <option value={VIDEO_STATUS.ARCHIVED}>Archived</option>
                  </select>
                </div>
              </div>
            </section>

            {isRecordedMode && (
              <section className="videoClassBuilderCard videoClassBuilderRecordedCard">
                <div className="videoClassBuilderCardHeader">
                  <span>Recorded Source</span>
                  <h2>Lesson playback</h2>
                  <p>
                    Recorded videos open inside AspireNest classroom with plan
                    access guard and safe embed handling.
                  </p>
                </div>

                <div className="contentStudioGrid">
                  <div>
                    <label>Source Type</label>
                    <select
                      value={videoForm.sourceType}
                      onChange={(event) =>
                        updateField("sourceType", event.target.value)
                      }
                    >
                      <option value={VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC}>
                        YouTube Public
                      </option>
                      <option value={VIDEO_SOURCE_TYPES.YOUTUBE_UNLISTED}>
                        YouTube Unlisted
                      </option>
                      <option value={VIDEO_SOURCE_TYPES.DRIVE}>
                        Google Drive
                      </option>
                      <option value="ASSET">Asset Link</option>
                      <option value="EXTERNAL">External Secure Link</option>
                    </select>
                  </div>

                  <div>
                    <label>Video URL</label>
                    <input
                      type="url"
                      value={videoForm.videoUrl}
                      onChange={(event) =>
                        updateField("videoUrl", event.target.value)
                      }
                      placeholder="Paste YouTube / Drive / secure video URL"
                    />

                    <p className="videoFormHint">
                      Student side will show this inside AspireNest classroom.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {isLiveMode && (
              <section className="videoClassBuilderCard videoClassBuilderLiveCard">
                <div className="videoClassBuilderCardHeader">
                  <span>Live Classroom</span>
                  <h2>Schedule & access</h2>
                  <p>
                    Control upcoming, join-now, ended, replay, and cancelled
                    states from one live classroom setup.
                  </p>
                </div>

                <div className="contentStudioGrid">
                  <div>
                    <label>Live Platform</label>
                    <select
                      value={videoForm.livePlatform}
                      onChange={(event) =>
                        updateField("livePlatform", event.target.value)
                      }
                    >
                      <option value={LIVE_PLATFORMS.YOUTUBE_LIVE}>
                        YouTube Live
                      </option>
                      <option value={LIVE_PLATFORMS.ZOOM}>Zoom</option>
                      <option value={LIVE_PLATFORMS.GOOGLE_MEET}>
                        Google Meet
                      </option>
                      <option value="EXTERNAL_LIVE">External Live Link</option>
                    </select>
                  </div>

                  <div>
                    <label>Live State</label>
                    <select
                      value={videoForm.liveStatus}
                      onChange={(event) =>
                        updateField("liveStatus", event.target.value)
                      }
                    >
                      <option value="SCHEDULED">Scheduled / Auto State</option>
                      <option value={LIVE_CLASS_STATUS.CANCELLED}>
                        Cancelled
                      </option>
                    </select>
                  </div>

                  <div>
                    <label>Join URL</label>
                    <input
                      type="url"
                      value={videoForm.joinUrl}
                      onChange={(event) =>
                        updateField("joinUrl", event.target.value)
                      }
                      placeholder="Paste live class join URL"
                    />
                  </div>

                  <div>
                    <label>Replay URL</label>
                    <input
                      type="url"
                      value={videoForm.replayUrl}
                      onChange={(event) =>
                        updateField("replayUrl", event.target.value)
                      }
                      placeholder="Optional replay URL after live class"
                    />
                  </div>

                  <div>
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={videoForm.liveStartDate}
                      onChange={(event) =>
                        updateField("liveStartDate", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={videoForm.liveStartTime}
                      onChange={(event) =>
                        updateField("liveStartTime", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label>End Date</label>
                    <input
                      type="date"
                      value={videoForm.liveEndDate}
                      onChange={(event) =>
                        updateField("liveEndDate", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label>End Time</label>
                    <input
                      type="time"
                      value={videoForm.liveEndTime}
                      onChange={(event) =>
                        updateField("liveEndTime", event.target.value)
                      }
                    />
                  </div>

                  <div className="videoClassBuilderWideField">
                    <label>Live Instructions</label>
                    <textarea
                      value={videoForm.liveInstructions}
                      onChange={(event) =>
                        updateField("liveInstructions", event.target.value)
                      }
                      placeholder="Example: Join 10 minutes before class. Keep notebook ready."
                    />
                  </div>
                </div>
              </section>
            )}

            <div className="videoFormActions videoClassBuilderActions">
              <button
                className="publishButton"
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : editId
                  ? "Update Class"
                  : "Save Class"}
              </button>

              <button
                type="button"
                className="backButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Cancel
              </button>

              <button
                type="button"
                className="backButton"
                onClick={() => navigate("/admin/content/videos")}
              >
                Back to Video Manager
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
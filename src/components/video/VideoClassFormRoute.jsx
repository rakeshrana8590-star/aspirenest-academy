import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
} from "firebase/firestore";

const DEFAULT_VIDEO_FORM = {
  classMode: "RECORDED",
  title: "",
  planType: "FREE",
  subject: "",
  chapter: "",
  videoUrl: "",
  thumbnailUrl: "",
  duration: "",
  mentorName: "",
  status: "published",
  sourceType: "YOUTUBE_PUBLIC",

  liveStartDate: "",
  liveStartTime: "",
  liveEndDate: "",
  liveEndTime: "",
  livePlatform: "YOUTUBE_LIVE",
  joinUrl: "",
  replayUrl: "",
  liveInstructions: "",
};

const normalizeText = (value = "") =>
  value.toString().trim().toLowerCase().replace(/\s+/g, " ");

const normalizeClassMode = (value = "RECORDED") =>
  value.toString().trim().toUpperCase() === "LIVE" ? "LIVE" : "RECORDED";

const getOptionLabel = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;

  return (
    item.name ||
    item.title ||
    item.subject ||
    item.chapter ||
    item.label ||
    ""
  );
};

const uniqueLabels = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    const label = getOptionLabel(item).trim();

    if (!label) return;

    const key = normalizeText(label);

    if (!map.has(key)) {
      map.set(key, label);
    }
  });

  return [...map.values()];
};

const buildFormFromItem = (item = {}) => {
  const classMode = normalizeClassMode(item.classMode || item.mode);

  return {
    ...DEFAULT_VIDEO_FORM,
    classMode,
    title: item.title || "",
    planType: item.planType || "FREE",
    subject: item.subject || "",
    chapter: item.chapter || "",
    videoUrl: item.videoUrl || item.fileUrl || "",
    thumbnailUrl: item.thumbnailUrl || "",
    duration: item.duration || "",
    mentorName: item.mentorName || "",
    status: item.status || "published",
    sourceType: item.sourceType || "YOUTUBE_PUBLIC",

    liveStartDate: item.liveStartDate || "",
    liveStartTime: item.liveStartTime || "",
    liveEndDate: item.liveEndDate || "",
    liveEndTime: item.liveEndTime || "",
    livePlatform: item.livePlatform || item.sourceType || "YOUTUBE_LIVE",
    joinUrl: item.joinUrl || "",
    replayUrl: item.replayUrl || "",
    liveInstructions: item.liveInstructions || "",
  };
};

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

  const [videoForm, setVideoForm] = React.useState(DEFAULT_VIDEO_FORM);
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (editId && editItem) {
      setVideoForm(buildFormFromItem(editItem));
      return;
    }

    if (!editId) {
      setVideoForm(DEFAULT_VIDEO_FORM);
    }
  }, [editId, editItem]);

  const subjectOptions = React.useMemo(() => {
    const videoSubjects = universalContent
      .filter((item) => item.section === "recordedVideo")
      .map((item) => item.subject);

    return uniqueLabels([...notesSubjectsList, ...videoSubjects]);
  }, [notesSubjectsList, universalContent]);

  const chapterOptions = React.useMemo(() => {
    const videoChapters = universalContent
      .filter((item) => item.section === "recordedVideo")
      .map((item) => item.chapter);

    return uniqueLabels([...notesChaptersList, ...videoChapters]);
  }, [notesChaptersList, universalContent]);

  const updateField = (field, value) => {
    setFormError("");

    setVideoForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!videoForm.title.trim()) {
      return "Class title required.";
    }

    if (!videoForm.planType.trim()) {
      return "Plan type required.";
    }

    if (!videoForm.subject.trim()) {
      return "Subject required.";
    }

    if (!videoForm.chapter.trim()) {
      return "Chapter required.";
    }

    if (videoForm.classMode === "RECORDED" && !videoForm.videoUrl.trim()) {
      return "Recorded lesson video URL required.";
    }

    if (videoForm.classMode === "LIVE") {
      if (!videoForm.liveStartDate.trim()) {
        return "Live class start date required.";
      }

      if (!videoForm.liveStartTime.trim()) {
        return "Live class start time required.";
      }

      if (!videoForm.joinUrl.trim()) {
        return "Live class join URL required.";
      }
    }

    return "";
  };

  const findDuplicateClass = () => {
    return universalContent.find((item) => {
      if (editId && item.id === editId) return false;

      if (item.section !== "recordedVideo" && item.contentType !== "VIDEO") {
        return false;
      }

      const itemMode = normalizeClassMode(item.classMode || item.mode);

      const sameCore =
        normalizeText(item.title) === normalizeText(videoForm.title) &&
        normalizeText(item.planType) === normalizeText(videoForm.planType) &&
        normalizeText(item.subject) === normalizeText(videoForm.subject) &&
        normalizeText(item.chapter) === normalizeText(videoForm.chapter) &&
        itemMode === videoForm.classMode;

      if (!sameCore) return false;

      if (videoForm.classMode === "LIVE") {
        return (
          item.liveStartDate === videoForm.liveStartDate &&
          item.liveStartTime === videoForm.liveStartTime
        );
      }

      return true;
    });
  };

  const buildSavePayload = () => {
    const now = new Date();
    const classMode = normalizeClassMode(videoForm.classMode);

    return {
      section: "recordedVideo",
      contentType: "VIDEO",
      classMode,

      title: videoForm.title.trim(),
      planType: videoForm.planType.trim().toUpperCase(),
      subject: videoForm.subject.trim(),
      chapter: videoForm.chapter.trim(),
      thumbnailUrl: videoForm.thumbnailUrl.trim(),
      duration: videoForm.duration.trim(),
      mentorName: videoForm.mentorName.trim(),
      status: videoForm.status,
      updatedAt: now,

      sourceType:
        classMode === "LIVE"
          ? videoForm.livePlatform
          : videoForm.sourceType,

      videoUrl:
        classMode === "RECORDED"
          ? videoForm.videoUrl.trim()
          : videoForm.replayUrl.trim(),

      fileUrl:
        classMode === "RECORDED"
          ? videoForm.videoUrl.trim()
          : videoForm.replayUrl.trim(),

      liveStartDate: classMode === "LIVE" ? videoForm.liveStartDate : "",
      liveStartTime: classMode === "LIVE" ? videoForm.liveStartTime : "",
      liveEndDate: classMode === "LIVE" ? videoForm.liveEndDate : "",
      liveEndTime: classMode === "LIVE" ? videoForm.liveEndTime : "",
      livePlatform: classMode === "LIVE" ? videoForm.livePlatform : "",
      joinUrl: classMode === "LIVE" ? videoForm.joinUrl.trim() : "",
      replayUrl: classMode === "LIVE" ? videoForm.replayUrl.trim() : "",
      liveInstructions:
        classMode === "LIVE" ? videoForm.liveInstructions.trim() : "",
    };
  };

  const handleSaveVideoClass = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const duplicateClass = findDuplicateClass();

    if (duplicateClass) {
      setFormError(
        "Duplicate class found with same title, plan, subject, chapter, and class mode."
      );
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const payload = buildSavePayload();

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
    <section className="coursePages videoFormPage">
      <div className="sectionHeader">
        <span className="badge">
          {editId ? "EDIT CLASS" : "ADD CLASS"}
        </span>

        <h1>
          {editId
            ? "Edit Video / Live Class"
            : "Add Video / Live Class"}
        </h1>

        <p>
          Save recorded lessons and live classes in one AspireNest classroom
          system using contentItems.
        </p>
      </div>

      <form className="contentStudioForm" onSubmit={handleSaveVideoClass}>
        <div className="videoFormModeTabs">
          <button
            type="button"
            className={
              videoForm.classMode === "RECORDED"
                ? "backButton active"
                : "backButton"
            }
            onClick={() => updateField("classMode", "RECORDED")}
          >
            🎬 Recorded Lesson
          </button>

          <button
            type="button"
            className={
              videoForm.classMode === "LIVE"
                ? "backButton active"
                : "backButton"
            }
            onClick={() => updateField("classMode", "LIVE")}
          >
            🔴 Live Class
          </button>
        </div>

        {formError && (
          <div className="contentStudioItem videoEmptyState">
            <strong>{formError}</strong>
          </div>
        )}

        <div className="contentStudioGrid">
          <div>
            <label>Class Title</label>
            <input
              type="text"
              value={videoForm.title}
              onChange={(event) => updateField("title", event.target.value)}
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
              onChange={(event) => updateField("subject", event.target.value)}
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
              onChange={(event) => updateField("chapter", event.target.value)}
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
              onChange={(event) => updateField("duration", event.target.value)}
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
              onChange={(event) => updateField("status", event.target.value)}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {videoForm.classMode === "RECORDED" && (
          <div className="videoFormSectionCard" style={{ marginTop: "24px" }}>
            <h3>Recorded Lesson Source</h3>

            <div className="contentStudioGrid">
              <div>
                <label>Source Type</label>
                <select
                  value={videoForm.sourceType}
                  onChange={(event) =>
                    updateField("sourceType", event.target.value)
                  }
                >
                  <option value="YOUTUBE_PUBLIC">YouTube Public</option>
                  <option value="YOUTUBE_UNLISTED">YouTube Unlisted</option>
                  <option value="DRIVE">Google Drive</option>
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
          </div>
        )}

        {videoForm.classMode === "LIVE" && (
          <div className="videoLiveFields" style={{ marginTop: "24px" }}>
            <h3>Live Class Schedule & Access</h3>

            <div className="contentStudioGrid">
              <div>
                <label>Live Platform</label>
                <select
                  value={videoForm.livePlatform}
                  onChange={(event) =>
                    updateField("livePlatform", event.target.value)
                  }
                >
                  <option value="YOUTUBE_LIVE">YouTube Live</option>
                  <option value="ZOOM">Zoom</option>
                  <option value="GOOGLE_MEET">Google Meet</option>
                  <option value="EXTERNAL_LIVE">External Live Link</option>
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
          </div>
        )}

        <div className="videoFormActions">
          <button className="publishButton" type="submit" disabled={isSaving}>
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
      </form>
    </section>
  );
}
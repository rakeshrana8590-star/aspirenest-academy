import React from "react";
import { useNavigate } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";

export default function VideoManagerHome({ universalContent = [] }) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const totalClasses = videoLibrary.allVideos.length;
  const publishedClasses = videoLibrary.publishedVideos.length;
  const liveClasses = videoLibrary.liveClasses.length;
  const recordedClasses = videoLibrary.recordedVideos.length;
  const subjects = videoLibrary.getSubjects();

  const quickActions = [
    {
      icon: "➕",
      title: "Add Video / Live Class",
      description:
        "Create recorded lessons, live classes, replay sessions, and classroom items.",
      buttonLabel: "Add Class",
      path: "/admin/content/videos/add",
      primary: true,
    },
    {
      icon: "🎛️",
      title: "Manage Library",
      description:
        "Edit, publish, unpublish, duplicate, delete, and preview all classes.",
      buttonLabel: "Manage Classes",
      path: "/admin/content/videos/manage",
    },
    {
      icon: "📚",
      title: "Subject Library",
      description:
        "Browse classes subject-wise and open chapter-level video shelves.",
      buttonLabel: "Open Subjects",
      path: "/admin/content/videos/subjects",
    },
    {
      icon: "✅",
      title: "Published Classes",
      description:
        "Review what students can currently see inside Classes & Recordings.",
      buttonLabel: "View Published",
      path: "/admin/content/videos/published",
    },
  ];

  return (
    <section className="coursePages videoManagerPage">
      <div className="sectionHeader">
        <span className="badge">VIDEO & LIVE CLASSES</span>

        <h1>Video Classroom Manager</h1>

        <p>
          Manage AspireNest recorded lessons, live classes, replays, subject
          shelves, and student classroom access from one system.
        </p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Total Classes</span>
          <strong>{totalClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Published</span>
          <strong>{publishedClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live Classes</span>
          <strong>{liveClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded</span>
          <strong>{recordedClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Subjects</span>
          <strong>{subjects.length}</strong>
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>Classroom Actions</h2>
          <span>Admin Control Center</span>
        </div>

        <div className="videoSubjectGrid">
          {quickActions.map((action) => (
            <article className="videoLibraryCard" key={action.path}>
              <div className="videoLibraryCardIcon">{action.icon}</div>

              <h3>{action.title}</h3>

              <p>{action.description}</p>

              <div className="videoCardActions">
                <button
                  type="button"
                  className={action.primary ? "publishButton" : "backButton"}
                  onClick={() => navigate(action.path)}
                >
                  {action.buttonLabel} →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>Latest Classroom Items</h2>
          <span>{videoLibrary.allVideos.slice(0, 6).length} Recent</span>
        </div>

        <div className="videoChapterShelf">
          {videoLibrary.allVideos.length === 0 ? (
            <div className="videoChapterEmpty">
              No recorded lessons or live classes found yet. Add your first
              classroom item to start building the video library.
            </div>
          ) : (
            videoLibrary.allVideos.slice(0, 6).map((item) => (
              <button
                type="button"
                className="videoLibraryCard"
                key={item.id}
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                <div className="videoLibraryCardIcon">
                  {videoLibrary.getClassMode(item) === "LIVE" ? "🔴" : "▶️"}
                </div>

                <h3>{item.title || "Untitled Class"}</h3>

                <p>
                  {item.subject || "Subject"} • {item.chapter || "Chapter"}
                </p>

                <span className="videoLibraryCardTag">
                  {item.planType || "FREE"} •{" "}
                  {videoLibrary.getClassMode(item)} •{" "}
                  {item.status || "draft"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
import React from "react";
import { useNavigate } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";

const primaryActions = [
  {
    icon: "✦",
    label: "Builder",
    title: "Add Video / Live Class",
    description:
      "Create recorded lessons, live sessions, replay access, mentor instructions, plan access, and publishing status.",
    route: "/admin/content/videos/add",
    tone: "orange",
  },
  {
    icon: "▣",
    label: "Library",
    title: "Manage Classes",
    description:
      "Edit, publish, unpublish, audit access, and control every recorded lesson and live class.",
    route: "/admin/content/videos/manage",
    tone: "blue",
  },
  {
    icon: "◈",
    label: "Structure",
    title: "Subject Library",
    description:
      "Browse classes subject-wise, open chapter shelves, and keep student navigation clean.",
    route: "/admin/content/videos/subjects",
    tone: "green",
  },
  {
    icon: "✓",
    label: "Student Visible",
    title: "Published Classes",
    description:
      "Review the exact recorded and live classes students can currently access.",
    route: "/admin/content/videos/published",
    tone: "purple",
  },
];

const compactActions = [
  {
    title: "Add Class",
    meta: "Recorded / live builder",
    route: "/admin/content/videos/add",
  },
  {
    title: "Manage Library",
    meta: "Edit and publish",
    route: "/admin/content/videos/manage",
  },
  {
    title: "Subjects",
    meta: "Subject shelves",
    route: "/admin/content/videos/subjects",
  },
  {
    title: "Published",
    meta: "Student-visible audit",
    route: "/admin/content/videos/published",
  },
  {
    title: "Student Hub",
    meta: "Preview student entry",
    route: "/ctet-tet/videos",
  },
  {
    title: "FREE Shelf",
    meta: "Public video access",
    route: "/ctet-tet/videos/plan/FREE",
  },
  {
    title: "BASIC Shelf",
    meta: "Basic plan video shelf",
    route: "/ctet-tet/videos/plan/BASIC",
  },
  {
    title: "PREMIUM Shelf",
    meta: "Premium video shelf",
    route: "/ctet-tet/videos/plan/PREMIUM",
  },
  {
    title: "MENTORSHIP Shelf",
    meta: "Mentor-led video shelf",
    route: "/ctet-tet/videos/plan/MENTORSHIP",
  },
];

export default function VideoManagerHome({ universalContent = [] }) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const totalClasses = videoLibrary.allVideos.length;
  const publishedClasses = videoLibrary.publishedVideos.length;
  const liveClasses = videoLibrary.liveClasses.length;
  const recordedClasses = videoLibrary.recordedVideos.length;
  const subjects = videoLibrary.getSubjects();
  const planShelves = videoLibrary.getPlans();

  const systemStats = [
    {
      value: totalClasses,
      label: "Total classroom items",
    },
    {
      value: publishedClasses,
      label: "Student visible classes",
    },
    {
      value: liveClasses,
      label: "Live class engine",
    },
    {
      value: recordedClasses,
      label: "Recorded lessons",
    },
  ];

  const latestItems = videoLibrary.allVideos.slice(0, 6);

  return (
    <section className="coursePages videoManagerPage videoManagerHomePage">
      <div className="videoManagerHomeShell">
        <section className="videoManagerHomeHero">
          <div className="videoManagerHeroCopy">
            <span className="videoManagerKicker">VIDEO CMS</span>

            <h1>Video Classroom Manager</h1>

            <p>
              A premium command center for recorded lessons, live classes,
              replay access, subject shelves, plan protection, and student
              classroom flow — all inside one AspireNest system.
            </p>

            <div className="videoManagerHeroActions">
              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/add")}
              >
                Add Video / Live Class
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>
            </div>
          </div>

          <aside
            className="videoManagerSystemPanel"
            aria-label="Video system status"
          >
            <div className="videoManagerPanelHeader">
              <span>System Status</span>
              <strong>Admin ON</strong>
            </div>

            <div className="videoManagerSystemStats">
              {systemStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <div className="videoManagerFlowLine">
              <span>Create</span>
              <i />
              <span>Publish</span>
              <i />
              <span>Classroom</span>
            </div>
          </aside>
        </section>

        <section className="videoManagerCommandCenter">
          <div className="videoManagerSectionTitle">
            <span>Admin video system</span>
            <h2>Core classroom workflow</h2>
            <p>
              Most-used video actions stay above the fold. Live class states,
              plan shelves, subject structure, and student preview stay
              connected from the right rail.
            </p>
          </div>

          <div className="videoManagerCommandLayout">
            <div className="videoManagerPrimaryGrid">
              {primaryActions.map((action) => (
                <button
                  type="button"
                  key={action.route}
                  className={`videoManagerActionCard videoManagerTone-${action.tone}`}
                  onClick={() => navigate(action.route)}
                >
                  <span className="videoManagerActionTop">
                    <span className="videoManagerActionIcon" aria-hidden="true">
                      {action.icon}
                    </span>

                    <span className="videoManagerActionArrow" aria-hidden="true">
                      →
                    </span>
                  </span>

                  <span className="videoManagerActionLabel">{action.label}</span>

                  <strong>{action.title}</strong>

                  <small>{action.description}</small>
                </button>
              ))}
            </div>

            <aside
              className="videoManagerQuickRail"
              aria-label="Video manager shortcuts"
            >
              <div className="videoManagerQuickRailHeader">
                <span>Quick Access</span>
                <strong>Build · Shelves · Preview</strong>
              </div>

              <div className="videoManagerQuickList">
                {compactActions.map((action) => (
                  <button
                    type="button"
                    key={action.route}
                    onClick={() => navigate(action.route)}
                  >
                    <span>
                      <strong>{action.title}</strong>
                      <small>{action.meta}</small>
                    </span>

                    <em aria-hidden="true">→</em>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="videoManagerSnapshotCenter">
          <div className="videoManagerSectionTitle">
            <span>Classroom snapshot</span>
            <h2>Library health</h2>
            <p>
              Fast audit for plans, subjects, live classes, and latest uploaded
              classroom items.
            </p>
          </div>

          <div className="videoManagerSnapshotGrid">
            {planShelves.map((plan) => (
              <article className="videoManagerSnapshotCard" key={plan.id}>
                <span>{plan.title}</span>
                <strong>{plan.count}</strong>
                <small>
                  {plan.recordedCount} recorded • {plan.liveCount} live
                </small>
              </article>
            ))}

            <article className="videoManagerSnapshotCard">
              <span>Subjects</span>
              <strong>{subjects.length}</strong>
              <small>Connected subject shelves</small>
            </article>
          </div>

          <div className="videoManagerLatestStrip">
            {latestItems.length === 0 ? (
              <div className="videoManagerEmptyState">
                <strong>No classroom item found yet.</strong>
                <p>
                  Add your first recorded lesson or live class to start the
                  video classroom library.
                </p>
              </div>
            ) : (
              latestItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => navigate("/admin/content/videos/manage")}
                >
                  <span>
                    {videoLibrary.getClassMode(item) === "LIVE" ? "🔴" : "▶️"}
                  </span>

                  <strong>{item.title || "Untitled Class"}</strong>

                  <small>
                    {item.planType || "FREE"} • {item.subject || "Subject"} •{" "}
                    {videoLibrary.getClassMode(item)}
                  </small>
                </button>
              ))
            )}
          </div>
        </section>

        <div className="videoManagerHomeFooter">
          <button
            type="button"
            className="videoManagerBackButton"
            onClick={() => navigate("/admin/content")}
          >
            ← Back to Content Studio
          </button>
        </div>
      </div>
    </section>
  );
}
import React from "react";
import { useNavigate } from "react-router-dom";
import useVideoLibrary from "./useVideoLibrary.js";

const PLAN_META = {
  FREE: {
    icon: "🎓",
    title: "Free Classes",
    subtitle: "Start with free recorded lessons and open classes.",
  },
  BASIC: {
    icon: "🔷",
    title: "Basic Classes",
    subtitle: "Topic-wise classes for structured learning.",
  },
  PREMIUM: {
    icon: "⭐",
    title: "Premium Classroom",
    subtitle: "Premium recordings, live classes, and replay access.",
  },
  MENTORSHIP: {
    icon: "👩‍🏫",
    title: "Mentorship Classroom",
    subtitle: "Mentor-led classes, special sessions, and guided learning.",
  },
};

export default function StudentVideoHub({ universalContent = [] }) {
  const navigate = useNavigate();
  const videoLibrary = useVideoLibrary(universalContent);

  const plans = videoLibrary.getPlans();

  const totalClasses = videoLibrary.publishedVideos.length;
  const liveCount = videoLibrary.liveClasses.length;
  const recordedCount = videoLibrary.recordedVideos.length;

  return (
    <section className="coursePages videoLibraryPage">
      <div className="sectionHeader">
        <span className="badge">CLASSES & RECORDINGS</span>

        <h1>AspireNest Classes & Recordings</h1>

        <p>
          Watch recorded lessons, join live classes, and continue learning
          inside the AspireNest classroom experience.
        </p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Total Classes</span>
          <strong>{totalClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded Lessons</span>
          <strong>{recordedCount}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live Classes</span>
          <strong>{liveCount}</strong>
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>Choose Your Classroom Plan</h2>
          <span>{plans.length} Plans</span>
        </div>

        <div className="videoPlanGrid">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.id] || PLAN_META.FREE;

            return (
              <button
                type="button"
                className="videoLibraryCard"
                key={plan.id}
                onClick={() =>
                  navigate(`/ctet-tet/videos/plan/${plan.id}`)
                }
              >
                <div className="videoLibraryCardIcon">{meta.icon}</div>

                <h3>{meta.title}</h3>

                <p>{meta.subtitle}</p>

                <span className="videoLibraryCardTag">
                  {plan.count} Classes • {plan.liveCount} Live •{" "}
                  {plan.recordedCount} Recorded
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>Latest Published Classes</h2>
          <span>{videoLibrary.publishedVideos.slice(0, 6).length} Items</span>
        </div>

        <div className="videoChapterShelf">
          {videoLibrary.publishedVideos.length === 0 ? (
            <div className="videoChapterEmpty">
              No published video or live classes yet.
            </div>
          ) : (
            videoLibrary.publishedVideos.slice(0, 6).map((item) => (
              <button
                type="button"
                className="videoLibraryCard"
                key={item.id}
                onClick={() =>
                  navigate(`/ctet-tet/videos/watch/${item.id}`)
                }
              >
                <div className="videoLibraryCardIcon">
                  {videoLibrary.getClassMode(item) === "LIVE" ? "🔴" : "▶️"}
                </div>

                <h3>{item.title || "AspireNest Class"}</h3>

                <p>
                  {item.subject || "Subject"} • {item.chapter || "Chapter"}
                </p>

                <span className="videoLibraryCardTag">
                  {item.planType || "FREE"} •{" "}
                  {videoLibrary.getClassMode(item)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
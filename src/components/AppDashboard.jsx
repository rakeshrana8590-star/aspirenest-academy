import React from "react";
import {
  BookOpen,
  Route,
  FileText,
  ClipboardCheck,
  Newspaper,
  Crown,
  BarChart3,
  Megaphone,
  Settings,
} from "lucide-react";

export default function AppDashboard({
  setActiveSection,
  setActiveAdminTab,
  user,
  isAdmin,
}) {
  const rows = [
    {
      title: "Start Learning",
      cards: [
        {
          Icon: BookOpen,
          title: "Courses",
          text: "CTET/TET learning paths and topic-wise preparation.",
          action: () => setActiveSection("courses"),
        },
        {
          Icon: Route,
          title: "Learning Paths",
          text: "Beginner to premium structured learning programs.",
          action: () => setActiveSection("learning-paths"),
        },
        {
          Icon: FileText,
          title: "Notes",
          text: "Premium and free revision notes for quick learning.",
          action: () => setActiveSection("notes"),
        },
      ],
    },
    {
      title: "Practice",
      cards: [
        {
          Icon: ClipboardCheck,
          title: "Mock Tests",
          text: "Practice tests, score tracking and exam preparation.",
          action: () => setActiveSection("mock-tests"),
        },
        {
          Icon: Newspaper,
          title: "Current Affairs",
          text: "Monthly PDF updates and exam-focused current affairs.",
          action: () => setActiveSection("current-affairs"),
        },
        {
          Icon: BarChart3,
          title: "My Progress",
          text: "Student dashboard, analytics and learning progress.",
          action: () => setActiveSection("student-profile"),
        },
      ],
    },
    {
      title: "Premium",
      cards: [
        {
          Icon: Crown,
          title: "Premium",
          text: "Unlock full course, mock tests, notes and mentorship.",
          action: () => setActiveSection("pricing"),
        },
        {
          Icon: Megaphone,
          title: "Announcements",
          text: "Latest updates, exam alerts and platform notifications.",
          action: () => setActiveSection("announcements"),
        },
        ...(isAdmin(user)
          ? [
              {
                Icon: Settings,
                title: "Admin Panel",
                text: "Manage students, notes, mock tests and analytics.",
                action: () => {
                  setActiveAdminTab("Dashboard");
                  setActiveSection("admin-panel");
                },
                admin: true,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <section className="appDashboard appleStoreHub">
      <div className="appDashboardHeader">
        <span className="dashboardBadge">AspireNest Learning Hub</span>

        <h1>Choose what you want to study today.</h1>

        <p>Open any section directly without scrolling the full website.</p>
      </div>

      {rows.map((row) => (
        <div className="appleHubRow" key={row.title}>
          <div className="appleHubRowHeader">
            <h2>{row.title}</h2>
          </div>

          <div className="appleHubScroller">
            {row.cards.map((card) => {
              const Icon = card.Icon;

              return (
                <div
                  className={`dashboardCard appleHubCard ${
                    card.admin ? "adminHubCard" : ""
                  }`}
                  key={card.title}
                >
                  <div className="premiumIconBadge">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>

                  <h3>{card.title}</h3>
                  <p>{card.text}</p>

                  <button onClick={card.action}>Open</button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
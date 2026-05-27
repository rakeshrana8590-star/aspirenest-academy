import React from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowRight,
} from "lucide-react";

export default function AppDashboard({
  setActiveAdminTab,
  user,
  isAdmin,
}) {
  const navigate = useNavigate();

  const rows = [
    {
      title: "Start Learning",
      cards: [
        {
          Icon: BookOpen,
          title: "Courses",
          text: "CTET/TET learning paths and topic-wise preparation.",
          action: () => navigate("/subjects/ctet-tet/courses"),
        },
        {
          Icon: Route,
          title: "Learning Paths",
          text: "Structured CTET/TET ecosystem with courses, notes and tests.",
          action: () => navigate("/subjects/ctet-tet"),
        },
        {
          Icon: FileText,
          title: "Notes",
          text: "Premium and free revision notes for quick learning.",
          action: () => navigate("/subjects/ctet-tet/notes"),
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
          action: () => navigate("/subjects/ctet-tet/mock-tests"),
        },
        {
          Icon: Newspaper,
          title: "Current Affairs",
          text: "Monthly PDF updates and exam-focused current affairs.",
          action: () => navigate("/subjects/ctet-tet/current-affairs"),
        },
        {
          Icon: BarChart3,
          title: "My Progress",
          text: "Student dashboard, analytics and learning progress.",
          action: () => navigate("/student-dashboard"),
        },
      ],
    },
    {
      title: "Premium",
      cards: [
        {
          Icon: Crown,
          title: "Premium Plans",
          text: "Unlock courses, mock tests, notes and mentorship.",
          action: () => navigate("/subjects/ctet-tet/pricing"),
        },
        {
          Icon: Megaphone,
          title: "Announcements",
          text: "Latest updates, exam alerts and platform notifications.",
          action: () => navigate("/announcements"),
        },
        ...(isAdmin(user)
          ? [
              {
                Icon: Settings,
                title: "Admin Panel",
                text: "Manage students, notes, mock tests and analytics.",
                action: () => {
                  setActiveAdminTab("Dashboard");
                  navigate("/admin");
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
        <span className="dashboardBadge">
          AspireNest Learning Hub
        </span>

        <h1>Choose what you want to study today.</h1>

        <p>
          Open courses, notes, tests, current affairs and progress
          from one premium learning hub.
        </p>
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
                  onClick={card.action}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") card.action();
                  }}
                >
                  <div className="premiumIconBadge">
                    <Icon size={25} strokeWidth={2.3} />
                  </div>

                  <h3>{card.title}</h3>

                  <p>{card.text}</p>

                  <span className="learningHubArrow">
                    <ArrowRight size={22} strokeWidth={2.8} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
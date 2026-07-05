import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Crown,
  FileText,
  Flame,
  GraduationCap,
  Map,
  Newspaper,
  PlayCircle,
  Route,
  Sparkles,
  Target,
  Video,
} from "lucide-react";

export default function AppDashboard({ user, isAdmin, learningMomentumCards = [] }) {
  const navigate = useNavigate();
  const isAdminUser = typeof isAdmin === "function" ? isAdmin(user) : false;

  const journey = [
    { Icon: PlayCircle, title: "Start", text: "Begin your journey", active: true },
    { Icon: Target, title: "Practice", text: "Sharpen with mock tests" },
    { Icon: Video, title: "Watch", text: "Learn from expert classes" },
    { Icon: Map, title: "Roadmap", text: "Follow a smart study path" },
    { Icon: BarChart3, title: "Progress", text: "Track and improve" },
    { Icon: Crown, title: "Premium", text: "Unlock the best results" },
  ];

  const modules = [
    { Icon: FileText, title: "Notes", route: "/ctet-tet/notes", status: "Available", cta: "Open notes", tone: "gold" },
    { Icon: ClipboardCheck, title: "Mock Tests", route: "/ctet-tet/mock-tests", status: "Plan-wise access", cta: "Start practice", tone: "blue" },
    { Icon: Video, title: "Videos", route: "/ctet-tet/videos", status: "Live + recorded", cta: "Watch classes", tone: "violet" },
    { Icon: Newspaper, title: "Current Affairs", route: "/ctet-tet/current-affairs", status: "Monthly updates", cta: "Read updates", tone: "cyan" },
    { Icon: Route, title: "AspirePath", route: "/ctet-tet/roadmaps", status: "Guided path", cta: "Open roadmap", tone: "purple" },
    { Icon: GraduationCap, title: "Courses", route: "/ctet-tet/courses", status: "Structured prep", cta: "Explore courses", tone: "amber" },
  ];

  const momentum = learningMomentumCards.length > 0
    ? learningMomentumCards.map((card) => ({
        icon: card.icon,
        title: card.title,
        text: card.text,
        cta: card.action,
        action: () => navigate(card.route),
        tone:
          card.tone === "gold"
            ? "fire"
            : card.tone === "violet"
            ? "target"
            : "crown",
      }))
    : [
        {
          Icon: Flame,
          title: "Daily streak",
          text: "Keep the fire alive. Learn a little every day and stay unstoppable.",
          cta: "Keep learning today",
          action: () => navigate("/ctet-tet/notes"),
          tone: "fire",
        },
        {
          Icon: Target,
          title: "Next recommended action",
          text: "Your smart next step is ready. Stay on track and keep growing.",
          cta: "Resume your journey",
          action: () => navigate("/ctet-tet/roadmaps"),
          tone: "target",
        },
        {
          Icon: Crown,
          title: "Access plan state",
          text: isAdminUser
            ? "Admin premium access is active. Manage the full learning system."
            : user
              ? "You're on Premium. Enjoy full access to everything."
              : "Login to view your access state and unlocked modules.",
          cta: isAdminUser ? "Open admin" : "Manage plan",
          action: () => navigate(isAdminUser ? "/admin" : "/ctet-tet/pricing"),
          tone: "crown",
        },
      ];

  return (
    <section className="ctetS2Screen" aria-label="Student pathway command center">
      <div className="ctetS2Shell">
        <div className="ctetS2Grid">
          <div className="ctetS2Story">
            <span className="ctetS2Badge">
              <Sparkles size={15} />
              Smart Journey Rail
            </span>

            <h2>
              Move step by step <span>toward selection.</span>
            </h2>

            <p>From learning to practice to progress — everything you need inside one premium system.</p>
          </div>

          <div className="ctetS2Rail">
            {journey.map((step, index) => {
              const Icon = step.Icon;
              return (
                <div className={`ctetS2Step ${step.active ? "active" : ""}`} key={step.title}>
                  <div className="ctetS2Node">
                    <Icon size={23} />
                  </div>
                  {index < journey.length - 1 && <i />}
                  <strong>{step.title}</strong>
                  <small>{step.text}</small>
                </div>
              );
            })}
          </div>

          <aside className="ctetS2Momentum">
            <div className="ctetS2MomentumHead">
              <b>↗</b>
              <div>
                <h3>Student Momentum</h3>
                <p>Everything you need to stay consistent and move ahead with confidence.</p>
              </div>
            </div>

            <div className="ctetS2MomentumList">
              {momentum.map((card) => {
                const Icon = card.Icon;
                return (
                  <button
                    type="button"
                    className={`ctetS2MomentumCard ${card.tone}`}
                    key={card.title}
                    onClick={card.action}
                  >
                    <span>
                      {Icon ? <Icon size={22} /> : <b aria-hidden="true">{card.icon || "↗"}</b>}
                    </span>
                    <div>
                      <strong>{card.title}</strong>
                      <small>{card.text}</small>
                      <em>
                        {card.cta}
                        <ArrowRight size={15} />
                      </em>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="ctetS2Modules">
            <div className="ctetS2ModuleTitle">
              <BookOpen size={16} />
              Module Command Grid
            </div>

            <div className="ctetS2ModuleGrid">
              {modules.map((module) => {
                const Icon = module.Icon;
                return (
                  <button
                    type="button"
                    className={`ctetS2Module ${module.tone}`}
                    key={module.title}
                    onClick={() => navigate(module.route)}
                  >
                    <span className="ctetS2ModuleIcon">
                      <Icon size={28} />
                    </span>

                    <span className="ctetS2ModuleBody">
                      <strong>{module.title}</strong>
                      <span className="ctetS2Meta">
                        <em>{module.route}</em>
                        <b>{module.status}</b>
                      </span>
                      <span className="ctetS2Cta">
                        {module.cta}
                        <ArrowRight size={16} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="ctetS2Mentor">
          <div className="ctetS2MentorLeft">
            <div className="ctetS2MentorPhoto">VM</div>
            <div>
              <span className="ctetS2MentorBadge">
                <Sparkles size={14} />
                Mentor Authority
              </span>
              <h3>Learn from a mentor who’s walked the path.</h3>
              <p>Get expert guidance, clarity and confidence at every step.</p>
            </div>
          </div>

          <div className="ctetS2MentorMid">
            <h3>Dr. Varsha D. Maru</h3>
            <strong>Ph.D. Educator &amp; CTET/TET Mentor</strong>
            <p>Guiding thousands of aspirants toward selection with the right strategy and support.</p>
          </div>

          <div className="ctetS2MentorAction">
            <button type="button" onClick={() => navigate("/ctet-tet/courses")}>
              Meet your mentor
              <ArrowRight size={18} />
            </button>
            <small>Next up: Mentor Deep Dive</small>
          </div>
        </div>
      </div>
    </section>
  );
}

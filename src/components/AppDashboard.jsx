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

export default function AppDashboard({
  user,
  isAdmin,
}) {
  const navigate = useNavigate();
  const isAdminUser = typeof isAdmin === "function" ? isAdmin(user) : false;

  const journeySteps = [
    {
      Icon: PlayCircle,
      title: "Start",
      text: "Begin your journey",
      active: true,
    },
    {
      Icon: Target,
      title: "Practice",
      text: "Sharpen with mock tests",
    },
    {
      Icon: Video,
      title: "Watch",
      text: "Learn from expert classes",
    },
    {
      Icon: Map,
      title: "Roadmap",
      text: "Follow a smart study path",
    },
    {
      Icon: BarChart3,
      title: "Progress",
      text: "Track and improve",
    },
    {
      Icon: Crown,
      title: "Premium",
      text: "Unlock the best results",
    },
  ];

  const modules = [
    {
      Icon: FileText,
      title: "Notes",
      route: "/ctet-tet/notes",
      status: "Available",
      cta: "Open notes",
      tone: "gold",
    },
    {
      Icon: ClipboardCheck,
      title: "Mock Tests",
      route: "/ctet-tet/mock-tests",
      status: "Plan-wise access",
      cta: "Start practice",
      tone: "blue",
    },
    {
      Icon: Video,
      title: "Videos",
      route: "/ctet-tet/videos",
      status: "Live + recorded",
      cta: "Watch classes",
      tone: "violet",
    },
    {
      Icon: Newspaper,
      title: "Current Affairs",
      route: "/ctet-tet/current-affairs",
      status: "Monthly updates",
      cta: "Read updates",
      tone: "cyan",
    },
    {
      Icon: Route,
      title: "AspirePath",
      route: "/ctet-tet/roadmaps",
      status: "Guided path",
      cta: "Open roadmap",
      tone: "purple",
    },
    {
      Icon: GraduationCap,
      title: "Courses",
      route: "/ctet-tet/courses",
      status: "Structured prep",
      cta: "Explore courses",
      tone: "amber",
    },
  ];

  const momentumCards = [
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
          ? "Check your active plan and unlocked learning modules."
          : "Login to view your access state and unlocked modules.",
      cta: isAdminUser ? "Open admin" : "Manage plan",
      action: () => navigate(isAdminUser ? "/admin" : "/ctet-tet/pricing"),
      tone: "crown",
    },
  ];

  const handleMentorCta = () => {
    const nextMentorSection = document.querySelector(
      ".ctetThisWeekSection, .ctetWhatsNewSection, .premiumSection, .aspirePremiumSection"
    );

    if (nextMentorSection?.scrollIntoView) {
      nextMentorSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate("/ctet-tet/courses");
  };

  return (
    <section className="appDashboard ctetCommandScreen" aria-label="AspireNest student pathway command center">
      <div className="ctetCommandShell">
        <div className="ctetCommandTopGrid">
          <div className="ctetCommandStory">
            <span className="ctetCommandBadge">
              <Sparkles size={18} strokeWidth={2.6} />
              Smart Journey Rail
            </span>

            <h2>
              Move step by step <span>toward selection.</span>
            </h2>

            <p>
              From learning to practice to progress — everything you need inside one premium system.
            </p>
          </div>

          <div className="ctetJourneyRail" aria-label="Student preparation journey">
            {journeySteps.map((step, index) => {
              const Icon = step.Icon;

              return (
                <div className={`ctetJourneyStep ${step.active ? "isActive" : ""}`} key={step.title}>
                  <div className="ctetJourneyNode">
                    <Icon size={30} strokeWidth={2.2} />
                  </div>

                  {index < journeySteps.length - 1 && <span className="ctetJourneyLine" />}

                  <strong>{step.title}</strong>
                  <small>{step.text}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ctetCommandBodyGrid">
          <div className="ctetModuleCommandZone">
            <div className="ctetModuleHeader">
              <span className="ctetModuleKicker">
                <BookOpen size={18} strokeWidth={2.4} />
                Module Command Grid
              </span>
            </div>

            <div className="ctetModuleGrid">
              {modules.map((module) => {
                const Icon = module.Icon;

                return (
                  <button
                    type="button"
                    className={`ctetModuleCard tone-${module.tone}`}
                    key={module.title}
                    onClick={() => navigate(module.route)}
                  >
                    <span className="ctetModuleIcon">
                      <Icon size={34} strokeWidth={2.15} />
                    </span>

                    <span className="ctetModuleContent">
                      <strong>{module.title}</strong>

                      <span className="ctetModuleMetaRow">
                        <em>{module.route}</em>
                        <b>{module.status}</b>
                      </span>

                      <span className="ctetModuleCta">
                        {module.cta}
                        <ArrowRight size={20} strokeWidth={2.8} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="ctetMomentumPanel" aria-label="Student momentum panel">
            <div className="ctetMomentumHeader">
              <span>↗</span>
              <div>
                <h3>Student Momentum</h3>
                <p>Everything you need to stay consistent and move ahead with confidence.</p>
              </div>
            </div>

            <div className="ctetMomentumStack">
              {momentumCards.map((card) => {
                const Icon = card.Icon;

                return (
                  <button
                    type="button"
                    className={`ctetMomentumCard tone-${card.tone}`}
                    key={card.title}
                    onClick={card.action}
                  >
                    <span className="ctetMomentumIcon">
                      <Icon size={28} strokeWidth={2.35} />
                    </span>

                    <span>
                      <strong>{card.title}</strong>
                      <small>{card.text}</small>
                      <em>
                        {card.cta}
                        <ArrowRight size={17} strokeWidth={2.8} />
                      </em>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="ctetMentorTeaserStrip">
          <div className="ctetMentorTeaserLeft">
            <div className="ctetMentorAura">
              <span>VM</span>
            </div>

            <div>
              <span className="ctetMentorBadge">
                <Sparkles size={16} strokeWidth={2.5} />
                Mentor Authority
              </span>
              <h3>Learn from a mentor who’s walked the path.</h3>
              <p>Get expert guidance, clarity and confidence at every step.</p>
            </div>
          </div>

          <div className="ctetMentorTeaserCenter">
            <h3>Dr. Varsha D. Maru</h3>
            <strong>Ph.D. Educator &amp; CTET/TET Mentor</strong>
            <p>Guiding thousands of aspirants toward selection with the right strategy and support.</p>
          </div>

          <div className="ctetMentorTeaserAction">
            <button type="button" onClick={handleMentorCta}>
              Meet your mentor
              <ArrowRight size={22} strokeWidth={2.8} />
            </button>
            <small>Next up: Mentor Deep Dive</small>
          </div>
        </div>
      </div>
    </section>
  );
}

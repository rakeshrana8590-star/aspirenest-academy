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

export default function AppDashboard({ user, isAdmin, learningMomentumCards = [], todayMission = null, streakActivityDates = [], xpActivityEvents = [] }) {
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

  const getLocalMissionDateKey = (value = new Date()) => {
    const now = value instanceof Date ? value : new Date(value);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const missionTasks = Array.isArray(todayMission?.tasks)
    ? todayMission.tasks
    : [];

  const missionDateKey = React.useMemo(() => getLocalMissionDateKey(), []);
  const missionStorageKey = React.useMemo(
    () => `ctetTodayMission_${user?.email || "guest"}_${missionDateKey}`,
    [missionDateKey, user?.email]
  );

  const missionHistoryStorageKey = React.useMemo(
    () => `ctetMissionActivityDates_${user?.email || "guest"}`,
    [user?.email]
  );

  const [missionActivityDates, setMissionActivityDates] = React.useState([]);

  const [missionDoneIds, setMissionDoneIds] = React.useState([]);

  React.useEffect(() => {
    try {
      const savedMission = JSON.parse(
        localStorage.getItem(missionStorageKey) || "{}"
      );

      setMissionDoneIds(
        Array.isArray(savedMission.doneIds) ? savedMission.doneIds : []
      );
    } catch {
      setMissionDoneIds([]);
    }
  }, [missionStorageKey]);

  React.useEffect(() => {
    try {
      const savedHistory = JSON.parse(
        localStorage.getItem(missionHistoryStorageKey) || "[]"
      );

      setMissionActivityDates(
        Array.isArray(savedHistory) ? savedHistory.filter(Boolean) : []
      );
    } catch {
      setMissionActivityDates([]);
    }
  }, [missionHistoryStorageKey]);

  const missionTaskIds = missionTasks.map((task) => task.id);
  const completedMissionTaskIds = missionDoneIds.filter((id) =>
    missionTaskIds.includes(id)
  );
  const missionTotal = missionTasks.length || 3;
  const missionDone = completedMissionTaskIds.length;
  const missionProgress = Math.min(
    100,
    Math.round((missionDone / missionTotal) * 100)
  );

  const combinedStreakActivityDates = Array.from(
    new Set([
      ...(Array.isArray(streakActivityDates) ? streakActivityDates : []),
      ...missionActivityDates,
      ...(missionDone > 0 ? [missionDateKey] : []),
    ].filter(Boolean))
  );

  const calculateActiveStreak = (dateKeys = []) => {
    const activitySet = new Set(dateKeys);
    const todayKey = getLocalMissionDateKey();

    if (!activitySet.has(todayKey)) return 0;

    let streakCount = 0;
    const cursor = new Date();

    while (activitySet.has(getLocalMissionDateKey(cursor))) {
      streakCount += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streakCount;
  };

  const activeStreak = calculateActiveStreak(combinedStreakActivityDates);

  const streakMilestone =
    activeStreak >= 7
      ? "7-day milestone active"
      : activeStreak >= 3
      ? "3-day milestone active"
      : activeStreak > 0
      ? "Return tomorrow to grow it"
      : "Start your streak today";

  const missionXpEvents = completedMissionTaskIds.map((taskId) => {
    const task = missionTasks.find((item) => item.id === taskId);

    const xpMap = {
      notes: 10,
      mock: 15,
      roadmap: 10,
      video: 10,
    };

    return {
      id: `mission_${missionDateKey}_${taskId}`,
      type: taskId,
      dateKey: missionDateKey,
      xp: xpMap[taskId] || 10,
      label: task?.title || "Mission task",
    };
  });

  const uniqueXpEvents = Array.from(
    new globalThis.Map(
      [
        ...(Array.isArray(xpActivityEvents) ? xpActivityEvents : []),
        ...missionXpEvents,
      ]
        .filter((event) => event?.id)
        .map((event) => [String(event.id), event])
    ).values()
  );

  const totalXp = uniqueXpEvents.reduce(
    (sum, event) => sum + Math.max(0, Number(event.xp || 0)),
    0
  );

  const xpPerLevel = 100;
  const currentLevel = Math.floor(totalXp / xpPerLevel) + 1;
  const xpInCurrentLevel = totalXp % xpPerLevel;
  const levelProgress = Math.round((xpInCurrentLevel / xpPerLevel) * 100);
  const xpToNextLevel = xpPerLevel - xpInCurrentLevel;

  const handleMissionTask = (task) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const nextDoneIds = Array.from(
      new Set([...completedMissionTaskIds, task.id])
    );

    setMissionDoneIds(nextDoneIds);

    const nextActivityDates = Array.from(
      new Set([...missionActivityDates, missionDateKey])
    );

    setMissionActivityDates(nextActivityDates);

    try {
      localStorage.setItem(
        missionHistoryStorageKey,
        JSON.stringify(nextActivityDates)
      );

      localStorage.setItem(
        missionStorageKey,
        JSON.stringify({
          date: missionDateKey,
          doneIds: nextDoneIds,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Ignore local progress storage failures.
    }

    navigate(task.route);
  };

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

            {todayMission ? (
              <div className="ctetS2TodayMission">
                <div className="ctetS2TodayMissionTop">
                  <span>{todayMission.icon || "🎯"}</span>
                  <div>
                    <b>{todayMission.eyebrow || "Today’s Mission"}</b>
                    <h4>{todayMission.title}</h4>
                    <p>{todayMission.text}</p>
                  </div>
                </div>

                <div className="ctetS2TodayMissionProgress">
                  <strong>{missionDone}/{missionTotal} progress</strong>
                  <span>
                    <i style={{ width: `${missionProgress}%` }} />
                  </span>
                  <em>{missionProgress}%</em>
                </div>

                <div className="ctetS2StreakLine">
                  <span>
                    🔥 {activeStreak > 0 ? `${activeStreak}-day streak` : "No active streak"}
                  </span>
                  <em>{streakMilestone}</em>
                  <small>Level {currentLevel} • {totalXp} XP</small>
                </div>

                <div className="ctetS2XpMiniBar" aria-label="Level progress">
                  <span>
                    <i style={{ width: `${levelProgress}%` }} />
                  </span>
                  <em>{xpInCurrentLevel}/{xpPerLevel} XP • {xpToNextLevel} to next level</em>
                </div>

                <div className="ctetS2TodayMissionTasks">
                  {missionTasks.map((task) => {
                    const isDone = completedMissionTaskIds.includes(task.id);

                    return (
                      <button
                        type="button"
                        className={isDone ? "isDone" : ""}
                        key={task.id}
                        onClick={() => handleMissionTask(task)}
                      >
                        <b>{task.icon || "•"}</b>
                        <span>
                          <strong>{task.title}</strong>
                          <small>{isDone ? "Started today" : task.text}</small>
                        </span>
                        <em>{isDone ? "Done" : task.cta}</em>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="ctetS2MomentumList">
              {momentum.slice(0, todayMission ? 1 : momentum.length).map((card) => {
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


      </div>
    </section>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import "../../styles/roadmaps/aspirePath.css";

const formatDateLabel = (dateValue = "") => {
  if (!dateValue) {
    return {
      day: "--",
      month: "DATE",
      full: "Date not set",
    };
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "DATE",
      full: dateValue,
    };
  }

  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleString("en-US", { month: "short" }),
    full: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
};

const getStatusLabel = (status = "") => {
  const cleanStatus = status?.toString().trim().toLowerCase();

  if (!cleanStatus) return "Draft";

  return cleanStatus
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getPlanBadgeClass = (planType = "FREE") => {
  const plan = planType?.toString().toUpperCase();

  if (plan === "FREE") return "aspirePathBadgeFree";
  if (plan === "PREMIUM" || plan === "MENTORSHIP") {
    return "aspirePathBadgePremium";
  }

  return "";
};

const getStatusBadgeClass = (status = "draft") => {
  const cleanStatus = status?.toString().toLowerCase();

  if (cleanStatus === "published") return "aspirePathBadgePublished";
  if (cleanStatus === "draft") return "aspirePathBadgeDraft";

  return "";
};

const hasResourceValue = (resource = {}) => {
  return Boolean(
    resource.noteUrl ||
      resource.videoUrl ||
      resource.liveUrl ||
      resource.mockId
  );
};

export const AspirePathHero = ({
  eyebrow = "AspirePath",
  title = "Smart Study Roadmaps",
  subtitle = "Guide students with structured daily preparation, live sessions, mock tests, revision plans, and progress tracking.",
  actions = null,
  metrics = [],
  mode = "student",
}) => {
  const shellPrefix = mode === "admin" ? "roadmapStudio" : "aspirePath";

  return (
    <div className={`${shellPrefix}Hero`}>
      <div className={`${shellPrefix}HeroGrid`}>
        <div>
          <span className={`${shellPrefix}Eyebrow`}>{eyebrow}</span>
          <h1 className={`${shellPrefix}Title`}>{title}</h1>
          <p className={`${shellPrefix}Subtitle`}>{subtitle}</p>

          {actions ? (
            <div className={`${shellPrefix}HeroActions`}>{actions}</div>
          ) : null}
        </div>

        <div className={`${shellPrefix}HeroPanel`}>
          <div className={`${shellPrefix}MetricGrid`}>
            {(metrics.length
              ? metrics
              : [
                  { value: "Daily", label: "Guided Tasks" },
                  { value: "Live", label: "Class Flow" },
                  { value: "Mock", label: "Test Days" },
                  { value: "Track", label: "Progress" },
                ]
            ).map((metric, index) => (
              <div className={`${shellPrefix}MetricCard`} key={index}>
                <span className={`${shellPrefix}MetricValue`}>
                  {metric.value}
                </span>
                <span className={`${shellPrefix}MetricLabel`}>
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RoadmapSectionHeader = ({
  kicker = "",
  title = "",
  text = "",
  action = null,
  mode = "student",
}) => {
  const shellPrefix = mode === "admin" ? "roadmapStudio" : "aspirePath";

  return (
    <div className={`${shellPrefix}SectionHeader`}>
      <div>
        {kicker ? (
          <p className={`${shellPrefix}SectionKicker`}>{kicker}</p>
        ) : null}

        {title ? (
          <h2 className={`${shellPrefix}SectionTitle`}>{title}</h2>
        ) : null}

        {text ? <p className={`${shellPrefix}SectionText`}>{text}</p> : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
};

export const RoadmapBadge = ({
  children,
  variant = "",
  mode = "student",
}) => {
  const shellPrefix = mode === "admin" ? "roadmapStudio" : "aspirePath";

  return (
    <span className={`${shellPrefix}Badge ${variant}`}>
      {children}
    </span>
  );
};

export const RoadmapStatusBadge = ({
  status = "draft",
  mode = "student",
}) => {
  const shellPrefix = mode === "admin" ? "roadmapStudio" : "aspirePath";

  return (
    <span
      className={`${shellPrefix}Badge ${getStatusBadgeClass(status).replace(
        "aspirePath",
        shellPrefix
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export const RoadmapPlanBadge = ({
  planType = "FREE",
  mode = "student",
}) => {
  const shellPrefix = mode === "admin" ? "roadmapStudio" : "aspirePath";
  const badgeClass = getPlanBadgeClass(planType).replace(
    "aspirePath",
    shellPrefix
  );

  return (
    <span className={`${shellPrefix}Badge ${badgeClass}`}>
      {planType || "FREE"}
    </span>
  );
};

export const RoadmapProgressBar = ({
  value = 0,
  label = "Progress",
}) => {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="aspirePathProgressWrap">
      <div className="aspirePathProgressTop">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>

      <div className="aspirePathProgressTrack">
        <div
          className="aspirePathProgressFill"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
};

export const RoadmapCard = ({
  roadmap,
  progress = 0,
  to = "",
  action = null,
  mode = "student",
}) => {
  const shellPrefix = mode === "admin" ? "roadmapStudio" : "aspirePath";

  if (!roadmap) return null;

  const startDate = formatDateLabel(roadmap.startDate);
  const endDate = formatDateLabel(roadmap.endDate);

  const cardContent = (
    <article className={`${shellPrefix}Card`}>
      <div className={`${shellPrefix}CardTop`}>
        <div>
          <h3 className={`${shellPrefix}CardTitle`}>
            {roadmap.title || "Untitled Roadmap"}
          </h3>

          <p className={`${shellPrefix}CardText`}>
            {roadmap.description ||
              `${roadmap.examType || "Exam"} roadmap for structured preparation.`}
          </p>
        </div>

        <RoadmapPlanBadge planType={roadmap.planType} mode={mode} />
      </div>

      <div className="aspirePathResourceRow">
        <RoadmapBadge mode={mode}>{roadmap.examType || "Exam"}</RoadmapBadge>

        {roadmap.stream ? (
          <RoadmapBadge mode={mode}>{roadmap.stream}</RoadmapBadge>
        ) : null}

        <RoadmapStatusBadge status={roadmap.status} mode={mode} />
      </div>

      <p className={`${shellPrefix}CardText`}>
        {startDate.full} → {endDate.full}
        {roadmap.examDate
          ? ` • Exam: ${formatDateLabel(roadmap.examDate).full}`
          : ""}
      </p>

      <RoadmapProgressBar value={progress} />

      {action ? (
        <div className="aspirePathResourceRow">{action}</div>
      ) : null}
    </article>
  );

  if (to && !action) {
    return (
      <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export const RoadmapDayDate = ({ date = "" }) => {
  const dateLabel = formatDateLabel(date);

  return (
    <div className="aspirePathDayDate">
      <span className="aspirePathDayNumber">{dateLabel.day}</span>
      <span className="aspirePathDayMonth">{dateLabel.month}</span>
    </div>
  );
};

export const RoadmapResourceButton = ({
  children,
  href = "",
  onClick = null,
}) => {
  if (href && href.startsWith("/")) {
    return (
      <Link className="aspirePathResourceButton" to={href}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        className="aspirePathResourceButton"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className="aspirePathResourceButton"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const RoadmapTaskCard = ({
  task,
  completed = false,
  onToggleComplete = null,
}) => {
  if (!task) return null;

  const hasTime = task.startTime || task.endTime;

  const resourceLinks = Array.isArray(task.resourceLinks)
    ? task.resourceLinks
    : [];

  const visibleResources = resourceLinks.filter(hasResourceValue);

  return (
    <div className="aspirePathTaskCard">
      <div className="aspirePathTaskHeader">
        <div>
          <h4 className="aspirePathTaskTitle">
            {completed ? "✅ " : ""}
            {task.title || "Untitled Task"}
          </h4>

          {task.description ? (
            <p className="aspirePathTaskText">{task.description}</p>
          ) : null}
        </div>

        {hasTime ? (
          <span className="aspirePathTaskTime">
            {task.startTime || "--"} - {task.endTime || "--"}
          </span>
        ) : null}
      </div>

      <div className="aspirePathResourceRow">
        {task.slot ? <RoadmapBadge>{task.slot}</RoadmapBadge> : null}
        {task.taskType ? <RoadmapBadge>{task.taskType}</RoadmapBadge> : null}

        {typeof onToggleComplete === "function" ? (
          <button
            className={
              completed ? "aspirePathSecondaryBtn" : "aspirePathPrimaryBtn"
            }
            type="button"
            onClick={() => onToggleComplete(task)}
          >
            {completed ? "Completed" : "Mark Complete"}
          </button>
        ) : null}
      </div>

      {visibleResources.length > 0 ? (
        <div className="aspirePathResourceRow">
          {visibleResources.map((resource, index) => (
            <React.Fragment
              key={`${resource.resourceRowNumber || index}-${task.taskId}`}
            >
              {resource.noteUrl ? (
                <RoadmapResourceButton href={resource.noteUrl}>
                  📘 {resource.noteTitle || "Open Notes"}
                </RoadmapResourceButton>
              ) : null}

              {resource.videoUrl ? (
                <RoadmapResourceButton href={resource.videoUrl}>
                  ▶️ {resource.videoTitle || "Watch Video"}
                </RoadmapResourceButton>
              ) : null}

              {resource.liveUrl ? (
                <RoadmapResourceButton href={resource.liveUrl}>
                  🔴 Join Live
                </RoadmapResourceButton>
              ) : null}

              {resource.mockId ? (
                <RoadmapResourceButton
                  href={`/ctet-tet/mock-tests/start/${resource.mockId}`}
                >
                  📝 {resource.mockTestTitle || "Start Mock"}
                </RoadmapResourceButton>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const RoadmapDayCard = ({
  day,
  completedTaskIds = [],
  onToggleTask = null,
}) => {
  if (!day) return null;

  const title =
    day.focusArea ||
    day.subject ||
    day.chapter ||
    `Day ${day.dayNumber || ""}`;

  return (
    <article className="aspirePathDayCard">
      <RoadmapDayDate date={day.date} />

      <div className="aspirePathDayBody">
        <div className="aspirePathDayMeta">
          <RoadmapBadge>Day {day.dayNumber || "--"}</RoadmapBadge>
          {day.dayName ? <RoadmapBadge>{day.dayName}</RoadmapBadge> : null}
          {day.dayType ? <RoadmapBadge>{day.dayType}</RoadmapBadge> : null}
        </div>

        <h3 className="aspirePathDayTitle">{title}</h3>

        {day.chapter ? (
          <p className="aspirePathCardText">{day.chapter}</p>
        ) : null}

        <div className="aspirePathTaskList">
          {(day.tasks || []).map((task) => (
            <RoadmapTaskCard
              key={task.taskId || task.title}
              task={task}
              completed={completedTaskIds.includes(task.taskId)}
              onToggleComplete={onToggleTask}
            />
          ))}
        </div>
      </div>
    </article>
  );
};

export const RoadmapEmptyState = ({
  title = "No roadmap found",
  text = "Once a roadmap is published, it will appear here.",
  mode = "student",
  action = null,
}) => {
  const shellPrefix = mode === "admin" ? "roadmapStudio" : "aspirePath";

  return (
    <div className={`${shellPrefix}EmptyState`}>
      <h3>{title}</h3>
      <p>{text}</p>
      {action ? <div className="aspirePathResourceRow">{action}</div> : null}
    </div>
  );
};

export const RoadmapAccessLock = ({
  title = "This roadmap is locked",
  text = "Upgrade your plan to access the full guided roadmap.",
  action = null,
}) => {
  return (
    <div className="aspirePathLockCard">
      <h3 className="aspirePathCardTitle">{title}</h3>
      <p className="aspirePathCardText">{text}</p>
      {action ? <div className="aspirePathHeroActions">{action}</div> : null}
    </div>
  );
};

export const RoadmapShell = ({ children, mode = "student" }) => {
  const shellClass = mode === "admin" ? "roadmapStudioShell" : "aspirePathShell";

  return <main className={shellClass}>{children}</main>;
};
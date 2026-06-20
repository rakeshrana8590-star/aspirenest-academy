import { loadUserRoadmapProgress } from "../../../services/roadmapService";

export const getRoadmapProgressForUser = async ({ user, roadmapId }) => {
  if (!user?.uid || !roadmapId) return [];

  return loadUserRoadmapProgress({
    userId: user.uid,
    roadmapId,
  });
};

export const getCompletedTaskIdsForDay = ({
  progressItems = [],
  dayId = "",
}) => {
  const progressItem = progressItems.find((item) => item.dayId === dayId);

  return Array.isArray(progressItem?.completedTaskIds)
    ? progressItem.completedTaskIds
    : [];
};

export const groupDaysByWeek = (days = []) => {
  return days.reduce((groups, day) => {
    const weekNumber = Number(day.weekNumber || 1);

    if (!groups[weekNumber]) {
      groups[weekNumber] = [];
    }

    groups[weekNumber].push(day);

    return groups;
  }, {});
};

export const formatLongDate = (dateValue = "") => {
  if (!dateValue) return "Date not set";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const buildRoadmapMetrics = ({ roadmaps = [] }) => {
  const publishedCount = roadmaps.length;

  const freeCount = roadmaps.filter(
    (roadmap) => roadmap.planType === "FREE"
  ).length;

  const premiumCount = roadmaps.filter(
    (roadmap) =>
      roadmap.planType === "PREMIUM" || roadmap.planType === "MENTORSHIP"
  ).length;

  return [
    { value: publishedCount || "0", label: "Roadmaps" },
    { value: freeCount || "0", label: "Free Paths" },
    { value: premiumCount || "0", label: "Premium Paths" },
    { value: "Daily", label: "Guidance" },
  ];
};

export const getStudentIdentity = (user = {}) => {
  const email =
    user.email ||
    user.studentEmail ||
    user.emailAddress ||
    user.userEmail ||
    "";

  const name =
    user.displayName ||
    user.fullName ||
    user.studentName ||
    user.name ||
    user.firstName ||
    (email ? email.split("@")[0] : "") ||
    "Student";

  return {
    studentName: name,
    studentEmail: email,
  };
};

export const getDateKey = (date = new Date()) => {
  return date.toISOString().slice(0, 10);
};

export const buildCatchUpCards = ({
  roadmap,
  progressItems = [],
  todayKey = getDateKey(),
  limit = 6,
}) => {
  if (!roadmap?.id) return [];

  const days = Array.isArray(roadmap.days) ? roadmap.days : [];

  return days
    .filter((day) => {
      const dayDate = day.date || "";
      const tasks = Array.isArray(day.tasks) ? day.tasks : [];

      return dayDate && dayDate <= todayKey && tasks.length > 0;
    })
    .map((day) => {
      const tasks = Array.isArray(day.tasks) ? day.tasks : [];

      const completedTaskIds = getCompletedTaskIdsForDay({
        progressItems,
        dayId: day.id,
      });

      const completedCount = completedTaskIds.length;
      const pendingCount = Math.max(0, tasks.length - completedCount);

      return {
        roadmap,
        day,
        completedCount,
        pendingCount,
        totalTasks: tasks.length,
        isToday: day.date === todayKey,
      };
    })
    .filter((item) => item.pendingCount > 0)
    .sort((a, b) => {
      const dateCompare = (a.day.date || "").localeCompare(b.day.date || "");

      if (dateCompare !== 0) return dateCompare;

      return Number(a.day.dayNumber || 0) - Number(b.day.dayNumber || 0);
    })
    .slice(0, limit);
};

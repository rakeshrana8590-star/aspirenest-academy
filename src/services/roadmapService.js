import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    setDoc,
    query,
    where,
    writeBatch,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "../firebase";
  
  export const ROADMAP_COLLECTIONS = {
    ROADMAPS: "studyRoadmaps",
    DAYS: "studyRoadmapDays",
    PROGRESS: "studyRoadmapProgress",
  };
  
  export const ROADMAP_STATUS = {
    DRAFT: "draft",
    PUBLISHED: "published",
    UNPUBLISHED: "unpublished",
    ARCHIVED: "archived",
  };
  
  export const ROADMAP_PLAN_TYPES = {
    FREE: "FREE",
    BASIC: "BASIC",
    PREMIUM: "PREMIUM",
    MENTORSHIP: "MENTORSHIP",
  };
  
  export const ROADMAP_DAY_TYPES = {
    STUDY: "study",
    LIVE: "live",
    MOCK: "mock",
    REVISION: "revision",
    ANALYSIS: "analysis",
    REST: "rest",
    EXAM: "exam",
  };
  
  export const ROADMAP_TASK_SLOTS = {
    MORNING: "morning",
    EVENING: "evening",
    LIVE: "live",
    MOCK: "mock",
    REVISION: "revision",
    ANALYSIS: "analysis",
  };
  
  const normalizeDateValue = (value) => {
    if (!value) return "";
  
    if (typeof value === "string") {
      return value.trim();
    }
  
    if (value?.toDate) {
      return value.toDate().toISOString().slice(0, 10);
    }
  
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
  
    return value.toString();
  };
  
  const sortByDateAndDayNumber = (items = []) => {
    return [...items].sort((a, b) => {
      const dateA = normalizeDateValue(a.date);
      const dateB = normalizeDateValue(b.date);
  
      if (dateA && dateB && dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
  
      return Number(a.dayNumber || 0) - Number(b.dayNumber || 0);
    });
  };
  
  export const getRoadmapAccessLevel = (planType = "FREE") => {
    const hierarchy = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      MENTORSHIP: 3,
    };
  
    return hierarchy[planType] ?? 0;
  };
  
  export const canAccessRoadmap = ({
    roadmapPlanType = "FREE",
    userPlanType = "FREE",
    isAdmin = false,
  }) => {
    if (isAdmin) return true;
  
    return (
      getRoadmapAccessLevel(userPlanType) >=
      getRoadmapAccessLevel(roadmapPlanType)
    );
  };
  
  export const loadStudyRoadmaps = async ({
    status = "",
    includeArchived = false,
  } = {}) => {
    const snapshot = await getDocs(
      collection(db, ROADMAP_COLLECTIONS.ROADMAPS)
    );
  
    const roadmaps = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  
    return roadmaps
      .filter((roadmap) => {
        if (!includeArchived && roadmap.status === ROADMAP_STATUS.ARCHIVED) {
          return false;
        }
  
        if (status && roadmap.status !== status) {
          return false;
        }
  
        return true;
      })
      .sort((a, b) => {
        const dateA = normalizeDateValue(a.startDate);
        const dateB = normalizeDateValue(b.startDate);
  
        if (dateA && dateB && dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
  
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
  };
  
  export const loadPublishedStudyRoadmaps = async () => {
    return loadStudyRoadmaps({
      status: ROADMAP_STATUS.PUBLISHED,
    });
  };
  
  export const loadStudyRoadmapById = async (roadmapId) => {
    if (!roadmapId) return null;
  
    const roadmapRef = doc(
      db,
      ROADMAP_COLLECTIONS.ROADMAPS,
      roadmapId
    );
  
    const roadmapSnap = await getDoc(roadmapRef);
  
    if (!roadmapSnap.exists()) {
      return null;
    }
  
    return {
      id: roadmapSnap.id,
      ...roadmapSnap.data(),
    };
  };
  
  export const loadStudyRoadmapDays = async (roadmapId) => {
    if (!roadmapId) return [];
  
    const daysQuery = query(
      collection(db, ROADMAP_COLLECTIONS.DAYS),
      where("roadmapId", "==", roadmapId)
    );
  
    const snapshot = await getDocs(daysQuery);
  
    const days = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  
    return sortByDateAndDayNumber(days);
  };
  
  export const loadStudyRoadmapWithDays = async (roadmapId) => {
    const roadmap = await loadStudyRoadmapById(roadmapId);
  
    if (!roadmap) {
      return null;
    }
  
    const days = await loadStudyRoadmapDays(roadmapId);
  
    return {
      ...roadmap,
      days,
    };
  };
  
  export const createStudyRoadmap = async (roadmapPayload) => {
    const cleanPayload = {
      title: roadmapPayload.title?.trim() || "Untitled Roadmap",
      description: roadmapPayload.description?.trim() || "",
      course: roadmapPayload.course?.trim() || "CTET/TET",
      examType: roadmapPayload.examType?.trim() || "CTET/TET",
      stream: roadmapPayload.stream?.trim() || "",
      mentorName: roadmapPayload.mentorName?.trim() || "",
      planType: roadmapPayload.planType || ROADMAP_PLAN_TYPES.FREE,
      status: roadmapPayload.status || ROADMAP_STATUS.DRAFT,
      startDate: roadmapPayload.startDate || "",
      endDate: roadmapPayload.endDate || "",
      examDate: roadmapPayload.examDate || "",
      sourceType: roadmapPayload.sourceType || "manual",
      sourceFileName: roadmapPayload.sourceFileName || "",
      sourceFileUrl: roadmapPayload.sourceFileUrl || "",
      totalDays: Number(roadmapPayload.totalDays || 0),
      publishedAt:
        roadmapPayload.status === ROADMAP_STATUS.PUBLISHED
          ? serverTimestamp()
          : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  
    const docRef = await addDoc(
      collection(db, ROADMAP_COLLECTIONS.ROADMAPS),
      cleanPayload
    );
  
    return docRef.id;
  };
  
  export const updateStudyRoadmap = async (roadmapId, roadmapPayload) => {
    if (!roadmapId) {
      throw new Error("Roadmap ID is required for update.");
    }
  
    const roadmapRef = doc(
      db,
      ROADMAP_COLLECTIONS.ROADMAPS,
      roadmapId
    );
  
    await updateDoc(roadmapRef, {
      ...roadmapPayload,
      updatedAt: serverTimestamp(),
    });
  
    return roadmapId;
  };
  
  export const publishStudyRoadmap = async (roadmapId) => {
    return updateStudyRoadmap(roadmapId, {
      status: ROADMAP_STATUS.PUBLISHED,
      publishedAt: serverTimestamp(),
    });
  };
  
  export const unpublishStudyRoadmap = async (roadmapId) => {
    return updateStudyRoadmap(roadmapId, {
      status: ROADMAP_STATUS.UNPUBLISHED,
    });
  };
  
  export const archiveStudyRoadmap = async (roadmapId) => {
    return updateStudyRoadmap(roadmapId, {
      status: ROADMAP_STATUS.ARCHIVED,
    });
  };
  
  export const deleteStudyRoadmapWithDays = async (roadmapId) => {
    if (!roadmapId) {
      throw new Error("Roadmap ID is required for delete.");
    }
  
    const batch = writeBatch(db);
  
    const roadmapRef = doc(
      db,
      ROADMAP_COLLECTIONS.ROADMAPS,
      roadmapId
    );
  
    batch.delete(roadmapRef);
  
    const daysQuery = query(
      collection(db, ROADMAP_COLLECTIONS.DAYS),
      where("roadmapId", "==", roadmapId)
    );
  
    const daysSnapshot = await getDocs(daysQuery);
  
    daysSnapshot.docs.forEach((dayDoc) => {
      batch.delete(dayDoc.ref);
    });
  
    const progressQuery = query(
      collection(db, ROADMAP_COLLECTIONS.PROGRESS),
      where("roadmapId", "==", roadmapId)
    );
  
    const progressSnapshot = await getDocs(progressQuery);
  
    progressSnapshot.docs.forEach((progressDoc) => {
      batch.delete(progressDoc.ref);
    });
  
    await batch.commit();
  
    return roadmapId;
  };
  
  export const saveImportedRoadmapAsDraft = async ({
    roadmap,
    days = [],
  }) => {
    if (!roadmap?.title?.trim()) {
      throw new Error("Roadmap title is required.");
    }
  
    if (!Array.isArray(days) || days.length === 0) {
      throw new Error("At least one roadmap day is required.");
    }
  
    const roadmapRef = await addDoc(
      collection(db, ROADMAP_COLLECTIONS.ROADMAPS),
      {
        ...roadmap,
        title: roadmap.title.trim(),
        status: ROADMAP_STATUS.DRAFT,
        totalDays: days.length,
        sourceType: roadmap.sourceType || "xlsxImport",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );
  
    const batch = writeBatch(db);
  
    days.forEach((day, index) => {
      const dayRef = doc(collection(db, ROADMAP_COLLECTIONS.DAYS));
  
      batch.set(dayRef, {
        ...day,
        roadmapId: roadmapRef.id,
        dayNumber: Number(day.dayNumber || index + 1),
        tasks: Array.isArray(day.tasks) ? day.tasks : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  
    await batch.commit();
  
    return roadmapRef.id;
  };
  
  export const replaceRoadmapDays = async ({
    roadmapId,
    days = [],
  }) => {
    if (!roadmapId) {
      throw new Error("Roadmap ID is required.");
    }
  
    if (!Array.isArray(days)) {
      throw new Error("Days must be an array.");
    }
  
    const existingDaysQuery = query(
      collection(db, ROADMAP_COLLECTIONS.DAYS),
      where("roadmapId", "==", roadmapId)
    );
  
    const existingDaysSnapshot = await getDocs(existingDaysQuery);
  
    const batch = writeBatch(db);
  
    existingDaysSnapshot.docs.forEach((dayDoc) => {
      batch.delete(dayDoc.ref);
    });
  
    days.forEach((day, index) => {
      const dayRef = doc(collection(db, ROADMAP_COLLECTIONS.DAYS));
  
      batch.set(dayRef, {
        ...day,
        roadmapId,
        dayNumber: Number(day.dayNumber || index + 1),
        tasks: Array.isArray(day.tasks) ? day.tasks : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  
    const roadmapRef = doc(
      db,
      ROADMAP_COLLECTIONS.ROADMAPS,
      roadmapId
    );
  
    batch.update(roadmapRef, {
      totalDays: days.length,
      updatedAt: serverTimestamp(),
    });
  
    await batch.commit();
  
    return roadmapId;
  };
  
  export const loadUserRoadmapProgress = async ({
    userId,
    roadmapId,
  }) => {
    if (!userId || !roadmapId) return [];
  
    const progressQuery = query(
      collection(db, ROADMAP_COLLECTIONS.PROGRESS),
      where("userId", "==", userId),
      where("roadmapId", "==", roadmapId)
    );
  
    const snapshot = await getDocs(progressQuery);
  
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  };
  
  export const saveUserRoadmapDayProgress = async ({
    userId,
    roadmapId,
    dayId,
    completedTaskIds = [],
    progressPercent = 0,
    studentNote = "",
  }) => {
    if (!userId || !roadmapId || !dayId) {
      throw new Error("User ID, roadmap ID, and day ID are required.");
    }
  
    const progressKey = `${userId}_${roadmapId}_${dayId}`
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 240);
  
    const progressRef = doc(
      db,
      ROADMAP_COLLECTIONS.PROGRESS,
      progressKey
    );
  
    await setDoc(
      progressRef,
      {
        progressKey,
        userId,
        roadmapId,
        dayId,
        completedTaskIds,
        progressPercent: Number(progressPercent || 0),
        studentNote: studentNote?.trim() || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  
    return progressKey;
  };
  
  export const calculateRoadmapProgressPercent = ({
    days = [],
    progressItems = [],
  }) => {
    const totalTasks = days.reduce((total, day) => {
      return total + Number(day.tasks?.length || 0);
    }, 0);
  
    if (totalTasks === 0) return 0;
  
    const completedTasks = progressItems.reduce((total, item) => {
      return total + Number(item.completedTaskIds?.length || 0);
    }, 0);
  
    return Math.min(
      100,
      Math.round((completedTasks / totalTasks) * 100)
    );
  };
  
  export const getTodayRoadmapDay = (days = [], today = new Date()) => {
    const todayKey = today.toISOString().slice(0, 10);
  
    return (
      days.find((day) => normalizeDateValue(day.date) === todayKey) ||
      null
    );
  };
  
  export const getUpcomingRoadmapDays = ({
    days = [],
    today = new Date(),
    limit = 7,
  }) => {
    const todayKey = today.toISOString().slice(0, 10);
  
    return sortByDateAndDayNumber(days)
      .filter((day) => normalizeDateValue(day.date) >= todayKey)
      .slice(0, limit);
  };
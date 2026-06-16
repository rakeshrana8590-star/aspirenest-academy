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
  
  const normalizeRoadmapDuplicateText = (value = "") => {
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };
  
  const buildRoadmapDuplicateSignature = (roadmap = {}) => {
    return {
      titleKey: normalizeRoadmapDuplicateText(roadmap.title),
      examTypeKey: normalizeRoadmapDuplicateText(roadmap.examType),
      startDateKey: normalizeDateValue(roadmap.startDate),
      endDateKey: normalizeDateValue(roadmap.endDate),
    };
  };
  
  export const findDuplicateStudyRoadmaps = async ({
    roadmap,
    includeArchived = false,
  } = {}) => {
    const incomingSignature = buildRoadmapDuplicateSignature(roadmap);
  
    if (
      !incomingSignature.titleKey ||
      !incomingSignature.examTypeKey ||
      !incomingSignature.startDateKey
    ) {
      return {
        hasExactDuplicate: false,
        hasPotentialDuplicate: false,
        exactDuplicates: [],
        potentialDuplicates: [],
      };
    }
  
    const existingRoadmaps = await loadStudyRoadmaps({
      includeArchived: true,
    });
  
    const activeRoadmaps = existingRoadmaps.filter((item) => {
      if (item.id && roadmap?.id && item.id === roadmap.id) {
        return false;
      }
  
      if (!includeArchived && item.status === ROADMAP_STATUS.ARCHIVED) {
        return false;
      }
  
      return true;
    });
  
    const exactDuplicates = activeRoadmaps.filter((item) => {
      const existingSignature = buildRoadmapDuplicateSignature(item);
  
      return (
        existingSignature.titleKey === incomingSignature.titleKey &&
        existingSignature.examTypeKey === incomingSignature.examTypeKey &&
        existingSignature.startDateKey === incomingSignature.startDateKey &&
        existingSignature.endDateKey === incomingSignature.endDateKey
      );
    });
  
    const potentialDuplicates = activeRoadmaps.filter((item) => {
      const existingSignature = buildRoadmapDuplicateSignature(item);
  
      const sameCore =
        existingSignature.titleKey === incomingSignature.titleKey &&
        existingSignature.examTypeKey === incomingSignature.examTypeKey &&
        existingSignature.startDateKey === incomingSignature.startDateKey;
  
      const sameEndDate =
        existingSignature.endDateKey === incomingSignature.endDateKey;
  
      return sameCore && !sameEndDate;
    });
  
    return {
      hasExactDuplicate: exactDuplicates.length > 0,
      hasPotentialDuplicate: potentialDuplicates.length > 0,
      exactDuplicates,
      potentialDuplicates,
    };
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
  
  export const updateStudyRoadmapMeta = async ({
    roadmapId,
    roadmapPayload,
    allowPotentialDuplicate = false,
  }) => {
    if (!roadmapId) {
      throw new Error("Roadmap ID is required for update.");
    }
  
    const existingRoadmap = await loadStudyRoadmapById(roadmapId);
  
    if (!existingRoadmap) {
      throw new Error("Roadmap not found for update.");
    }
  
    const cleanPayload = {
      title: roadmapPayload.title?.trim() || "Untitled Roadmap",
      description: roadmapPayload.description?.trim() || "",
      course: roadmapPayload.course?.trim() || "CTET/TET",
      examType: roadmapPayload.examType?.trim() || "CTET/TET",
      stream: roadmapPayload.stream?.trim() || "",
      mentorName: roadmapPayload.mentorName?.trim() || "",
      planType: roadmapPayload.planType || ROADMAP_PLAN_TYPES.FREE,
      status: roadmapPayload.status || existingRoadmap.status || ROADMAP_STATUS.DRAFT,
      startDate: roadmapPayload.startDate || "",
      endDate: roadmapPayload.endDate || "",
      examDate: roadmapPayload.examDate || "",
      sourceType: roadmapPayload.sourceType || existingRoadmap.sourceType || "manual",
      sourceFileName:
        roadmapPayload.sourceFileName || existingRoadmap.sourceFileName || "",
      sourceFileUrl:
        roadmapPayload.sourceFileUrl || existingRoadmap.sourceFileUrl || "",
    };
  
    const duplicateAudit = await findDuplicateStudyRoadmaps({
      roadmap: {
        ...existingRoadmap,
        ...cleanPayload,
        id: roadmapId,
      },
    });
  
    if (duplicateAudit.hasExactDuplicate) {
      throw new Error(
        "Exact duplicate roadmap found. Update blocked to avoid duplicate roadmap records."
      );
    }
  
    if (duplicateAudit.hasPotentialDuplicate && !allowPotentialDuplicate) {
      throw new Error(
        "Possible duplicate roadmap found. Please confirm before saving this update."
      );
    }
  
    return updateStudyRoadmap(roadmapId, cleanPayload);
  };

  export const publishStudyRoadmap = async (roadmapId) => {
    if (!roadmapId) {
      throw new Error("Roadmap ID is required for publish.");
    }
  
    const roadmap = await loadStudyRoadmapById(roadmapId);
  
    if (!roadmap) {
      throw new Error("Roadmap not found for publish.");
    }
  
    const duplicateAudit = await findDuplicateStudyRoadmaps({
      roadmap,
    });
  
    if (duplicateAudit.hasExactDuplicate) {
      throw new Error(
        "Exact duplicate roadmap found. Publish blocked to avoid duplicate live roadmaps."
      );
    }
  
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
    allowPotentialDuplicate = false,
  }) => {
    if (!roadmap?.title?.trim()) {
      throw new Error("Roadmap title is required.");
    }
  
    if (!Array.isArray(days) || days.length === 0) {
      throw new Error("At least one roadmap day is required.");
    }

    const duplicateAudit = await findDuplicateStudyRoadmaps({
        roadmap,
      });
  
      if (duplicateAudit.hasExactDuplicate) {
        throw new Error(
          "Exact duplicate roadmap already exists. Import blocked to avoid duplicate drafts."
        );
      }
  
      if (duplicateAudit.hasPotentialDuplicate && !allowPotentialDuplicate) {
        throw new Error(
          "Possible duplicate roadmap found. Please confirm before saving as a new draft."
        );
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
    studentName = "",
    studentEmail = "",
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
        studentName: studentName?.trim() || "",
        studentEmail: studentEmail?.trim() || "",
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

  export const loadRoadmapProgressByRoadmapId = async (roadmapId) => {
    if (!roadmapId) return [];
  
    const progressQuery = query(
      collection(db, ROADMAP_COLLECTIONS.PROGRESS),
      where("roadmapId", "==", roadmapId)
    );
  
    const snapshot = await getDocs(progressQuery);
  
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  };
  
  const ROADMAP_RECOMMENDATION_SECTIONS = {
    NOTES: "notes",
    VIDEOS: "recordedVideo",
    MOCK_TESTS: "mockTest",
  };
  
  const normalizeRoadmapRecommendationText = (value = "") => {
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F\s]+/g, " ")
      .replace(/\s+/g, " ");
  };
  
  const getRoadmapRecommendationTokens = (value = "") => {
    return normalizeRoadmapRecommendationText(value)
      .split(" ")
      .map((item) => item.trim())
      .filter((item) => item.length >= 3);
  };
  
  const ROADMAP_RECOMMENDATION_ALIASES = [
    {
      keys: [
        "cdp",
        "child development",
        "child development pedagogy",
        "child development and pedagogy",
        "development and learning",
        "बाल विकास",
      ],
      expansion:
        "cdp child development pedagogy child development and pedagogy development learning बाल विकास",
    },
    {
      keys: [
        "math",
        "maths",
        "mathematics",
        "गणित",
      ],
      expansion: "math maths mathematics गणित",
    },
    {
      keys: [
        "evs",
        "environment",
        "environmental studies",
        "पर्यावरण",
      ],
      expansion: "evs environment environmental studies पर्यावरण",
    },
    {
      keys: [
        "language i",
        "language 1",
        "lang i",
        "lang 1",
        "hindi",
        "english",
        "भाषा",
      ],
      expansion: "language i language 1 lang i lang 1 hindi english भाषा",
    },
    {
      keys: [
        "language ii",
        "language 2",
        "lang ii",
        "lang 2",
        "sanskrit",
        "gujarati",
        "हिंदी",
        "english",
      ],
      expansion: "language ii language 2 lang ii lang 2 sanskrit gujarati hindi english हिंदी",
    },
    {
      keys: [
        "current affairs",
        "ca",
        "gk",
        "general knowledge",
        "समसामयिक",
      ],
      expansion: "current affairs ca gk general knowledge समसामयिक",
    },
  ];
  
  const expandRoadmapRecommendationText = (value = "") => {
    const normalizedText = normalizeRoadmapRecommendationText(value);
  
    const matchedExpansions = ROADMAP_RECOMMENDATION_ALIASES
      .filter((aliasGroup) =>
        aliasGroup.keys.some((key) =>
          normalizedText.includes(
            normalizeRoadmapRecommendationText(key)
          )
        )
      )
      .map((aliasGroup) => aliasGroup.expansion);
  
    return normalizeRoadmapRecommendationText(
      [normalizedText, ...matchedExpansions].join(" ")
    );
  };

  const buildDayRecommendationSearchText = (day = {}) => {
    const taskText = Array.isArray(day.tasks)
      ? day.tasks
          .map((task) =>
            [
              task.title,
              task.description,
              task.slot,
              task.taskType,
            ]
              .filter(Boolean)
              .join(" ")
          )
          .join(" ")
      : "";
  
    return [
      day.subject,
      day.chapter,
      day.focusArea,
      day.dayType,
      taskText,
    ]
      .filter(Boolean)
      .join(" ");
  };

  const ROADMAP_RECOMMENDATION_GENERIC_TOKENS = new Set([
    "ctet",
    "tet",
    "paper",
    "part",
    "exam",
    "course",
    "subject",
    "chapter",
    "study",
    "task",
    "roadmap",
    "daily",
    "complete",
    "learning",
    "preparation",
    "practice",
    "question",
    "questions",
    "mcq",
    "test",
    "mock",
    "notes",
    "note",
    "video",
    "class",
    "session",
    "follow",
    "revise",
    "revision",
    "imported",
    "basic",
    "premium",
    "mentorship",
    "free",
  ]);
  
  const getStrongRoadmapRecommendationTokens = (value = "") => {
    return getRoadmapRecommendationTokens(
      expandRoadmapRecommendationText(value)
    ).filter(
      (token) => !ROADMAP_RECOMMENDATION_GENERIC_TOKENS.has(token)
    );
  };
  
  const getUniqueRoadmapTokens = (tokens = []) => {
    return [...new Set(tokens.filter(Boolean))];
  };
  
  const countRoadmapTokenOverlap = (sourceTokens = [], targetTokens = []) => {
    const targetSet = new Set(targetTokens);
  
    return sourceTokens.reduce((total, token) => {
      return targetSet.has(token) ? total + 1 : total;
    }, 0);
  };
  
  const hasStrongRoadmapRecommendationMatch = ({ item = {}, day = {} }) => {
    const itemText = [
      item.title,
      item.subject,
      item.chapter,
      item.course,
      item.examType,
      item.testType,
      item.section,
      item.contentType,
    ]
      .filter(Boolean)
      .join(" ");
  
    const taskText = Array.isArray(day.tasks)
      ? day.tasks
          .map((task) =>
            [
              task.title,
              task.taskTitle,
              task.description,
              task.taskDescription,
              task.focusArea,
              task.revisionFocus,
              task.mockTitle,
              task.videoTitle,
              task.noteTitle,
            ]
              .filter(Boolean)
              .join(" ")
          )
          .join(" ")
      : "";
  
    const subjectTokens = getUniqueRoadmapTokens(
      getStrongRoadmapRecommendationTokens(day.subject)
    );
  
    const itemTokens = getUniqueRoadmapTokens(
      getStrongRoadmapRecommendationTokens(itemText)
    );
  
    const detailTokens = getUniqueRoadmapTokens(
      [
        ...getStrongRoadmapRecommendationTokens(day.chapter),
        ...getStrongRoadmapRecommendationTokens(day.focusArea),
        ...getStrongRoadmapRecommendationTokens(taskText),
      ].filter((token) => !subjectTokens.includes(token))
    );
  
    const subjectOverlap = countRoadmapTokenOverlap(
      subjectTokens,
      itemTokens
    );
  
    const detailOverlap = countRoadmapTokenOverlap(
      detailTokens,
      itemTokens
    );
  
    if (detailTokens.length > 0) {
      return detailOverlap > 0;
    }
  
    if (subjectTokens.length > 0) {
      return subjectOverlap > 0;
    }
  
    return countRoadmapTokenOverlap(
      getStrongRoadmapRecommendationTokens(buildDayRecommendationSearchText(day)),
      itemTokens
    ) >= 2;
  };
  
  const scoreRoadmapRecommendationItem = ({ item, day }) => {
    const daySearchText = buildDayRecommendationSearchText(day);
  
    const expandedDayText = expandRoadmapRecommendationText(daySearchText);
  
    const dayTokens = getRoadmapRecommendationTokens(expandedDayText);
  
    const itemText = [
      item.title,
      item.subject,
      item.chapter,
      item.course,
      item.examType,
      item.testType,
      item.section,
      item.contentType,
    ]
      .filter(Boolean)
      .join(" ");
  
    const expandedItemText = expandRoadmapRecommendationText(itemText);
  
    let score = 0;
  
    const subjectKey = expandRoadmapRecommendationText(day.subject);
    const chapterKey = expandRoadmapRecommendationText(day.chapter);
    const focusKey = expandRoadmapRecommendationText(day.focusArea);
  
    if (subjectKey && expandedItemText.includes(subjectKey)) {
      score += 40;
    }
  
    if (chapterKey && expandedItemText.includes(chapterKey)) {
      score += 40;
    }
  
    if (focusKey && expandedItemText.includes(focusKey)) {
      score += 25;
    }
  
    dayTokens.forEach((token) => {
      if (expandedItemText.includes(token)) {
        score += 4;
      }
    });
  
    const itemSubject = expandRoadmapRecommendationText(item.subject);
    const itemChapter = expandRoadmapRecommendationText(item.chapter);
  
    if (itemSubject && expandedDayText.includes(itemSubject)) {
      score += 18;
    }
  
    if (itemChapter && expandedDayText.includes(itemChapter)) {
      score += 18;
    }
  
    if (item.planType === "FREE") {
      score += 2;
    }
  
    return score;
  };
  
  const mapContentItemToRoadmapRecommendation = (item = {}) => {
    const type =
      item.section === ROADMAP_RECOMMENDATION_SECTIONS.NOTES
        ? "note"
        : item.section === ROADMAP_RECOMMENDATION_SECTIONS.VIDEOS
        ? "video"
        : "mock";
  
    let href = "";
  
    if (type === "video") {
      href = `/ctet-tet/videos/watch/${item.id}`;
    }
  
    if (type === "mock") {
      href = `/ctet-tet/mock-tests/start/${item.id}`;
    }
  
    if (type === "note") {
      href =
        item.pdfUrl ||
        item.fileUrl ||
        item.pdf ||
        "";
    }
  
    return {
      id: item.id,
      type,
      title: item.title || "Recommended Resource",
      subject: item.subject || "",
      chapter: item.chapter || "",
      planType: item.planType || "FREE",
      href,
      section: item.section || "",
      contentType: item.contentType || "",
    };
  };
  
  export const loadRoadmapSmartRecommendations = async ({
    day,
    limit = 6,
  } = {}) => {
    const safeLimit = Number(limit || 6);
  
    const emptyResult = {
      notes: [],
      videos: [],
      mocks: [],
      all: [],
      byTask: [],
    };
  
    if (!day) {
      return emptyResult;
    }
  
    const allowedSections = [
      ROADMAP_RECOMMENDATION_SECTIONS.NOTES,
      ROADMAP_RECOMMENDATION_SECTIONS.VIDEOS,
      ROADMAP_RECOMMENDATION_SECTIONS.MOCK_TESTS,
    ];
  
    const dayTasks = Array.isArray(day.tasks) ? day.tasks : [];
  
    const isPublishedStatus = (status = "") => {
      return normalizeRoadmapRecommendationText(status) === "published";
    };
  
    const isCurrentAffairsContext = (value = "") => {
      const normalizedText = normalizeRoadmapRecommendationText(value);
      const tokens = normalizedText.split(" ").filter(Boolean);
  
      return (
        normalizedText.includes("current affairs") ||
        normalizedText.includes("currentaffairs") ||
        normalizedText.includes("general knowledge") ||
        normalizedText.includes("समसामयिक") ||
        tokens.includes("ca") ||
        tokens.includes("gk")
      );
    };
  
    const dedupeRecommendations = (items = []) => {
      const seen = new Set();
  
      return items.filter((item) => {
        const key = [
          item.type,
          item.id,
          item.href,
          normalizeRoadmapRecommendationText(item.title),
        ].join("|");
  
        if (seen.has(key)) {
          return false;
        }
  
        seen.add(key);
        return true;
      });
    };
  
    const getTaskId = (task = {}, index = 0) => {
      return (
        task.taskId ||
        task.id ||
        `${task.slot || task.taskSlot || task.taskType || "task"}-${index + 1}`
      );
    };
  
    const getTaskTitle = (task = {}, index = 0) => {
      return (
        task.title ||
        task.taskTitle ||
        task.mockTitle ||
        task.videoTitle ||
        task.noteTitle ||
        task.revisionFocus ||
        task.focusArea ||
        task.description ||
        `Task ${index + 1}`
      );
    };
  
    const getTaskSlot = (task = {}) => {
      return task.taskSlot || task.slot || task.session || "";
    };
  
    const getTaskType = (task = {}) => {
      return task.taskType || task.type || task.slot || day.dayType || "study";
    };
  
    const buildTaskSearchDay = (task = {}) => {
      const taskText = [
        task.title,
        task.taskTitle,
        task.description,
        task.taskDescription,
        task.focusArea,
        task.revisionFocus,
        task.mockTitle,
        task.videoTitle,
        task.noteTitle,
        task.slot,
        task.taskSlot,
        task.taskType,
        task.type,
      ]
        .filter(Boolean)
        .join(" ");
  
      return {
        ...day,
        subject: task.subject || day.subject || "",
        chapter: task.chapter || day.chapter || "",
        focusArea: [day.focusArea, task.focusArea, taskText]
          .filter(Boolean)
          .join(" "),
        dayType: task.taskType || task.type || task.slot || day.dayType || "",
        tasks: [task],
      };
    };
  
    const getManualResourceEntries = (task = {}) => {
      const resourceLinks = Array.isArray(task.resourceLinks)
        ? task.resourceLinks
        : [];
  
      const resources = Array.isArray(task.resources) ? task.resources : [];
  
      const directResources = [];
  
      if (task.noteUrl) {
        directResources.push({
          resourceType: "note",
          url: task.noteUrl,
          title: task.noteTitle,
        });
      }
  
      if (task.videoUrl) {
        directResources.push({
          resourceType: "video",
          url: task.videoUrl,
          title: task.videoTitle,
        });
      }
  
      if (task.mockId) {
        directResources.push({
          resourceType: "mock",
          mockId: task.mockId,
          title: task.mockTitle,
        });
      }
  
      return [...resourceLinks, ...resources, ...directResources];
    };
  
    const buildManualTaskResources = (task = {}, taskIndex = 0) => {
      const taskId = getTaskId(task, taskIndex);
      const taskTitle = getTaskTitle(task, taskIndex);
      const entries = getManualResourceEntries(task);
  
      const notes = [];
      const videos = [];
      const mocks = [];
  
      entries.forEach((resource, resourceIndex) => {
        const resourceType = normalizeRoadmapRecommendationText(
          resource.resourceType ||
            resource.type ||
            resource.kind ||
            resource.section ||
            ""
        );
  
        const rawUrl =
          resource.noteUrl ||
          resource.videoUrl ||
          resource.url ||
          resource.href ||
          resource.fileUrl ||
          resource.pdfUrl ||
          "";
  
        const resourceTitle =
          resource.title ||
          resource.resourceTitle ||
          resource.noteTitle ||
          resource.videoTitle ||
          resource.mockTitle ||
          taskTitle;
  
        if (
          resource.noteUrl ||
          resource.pdfUrl ||
          resource.fileUrl ||
          resourceType.includes("note") ||
          resourceType.includes("pdf")
        ) {
          if (rawUrl) {
            notes.push({
              id: `manual-note-${taskId}-${resourceIndex}`,
              type: "note",
              title: resourceTitle || `${taskTitle} Notes`,
              subject: task.subject || day.subject || "",
              chapter: task.chapter || day.chapter || "",
              planType: day.planType || "FREE",
              href: rawUrl,
              section: ROADMAP_RECOMMENDATION_SECTIONS.NOTES,
              contentType: "MANUAL_URL",
              source: "roadmapTask",
            });
          }
  
          return;
        }
  
        if (
          resource.videoUrl ||
          resourceType.includes("video") ||
          resourceType.includes("class")
        ) {
          if (rawUrl) {
            videos.push({
              id: `manual-video-${taskId}-${resourceIndex}`,
              type: "video",
              title: resourceTitle || `${taskTitle} Video`,
              subject: task.subject || day.subject || "",
              chapter: task.chapter || day.chapter || "",
              planType: day.planType || "FREE",
              href: rawUrl,
              section: ROADMAP_RECOMMENDATION_SECTIONS.VIDEOS,
              contentType: "MANUAL_URL",
              source: "roadmapTask",
            });
          }
  
          return;
        }
  
        if (
          resource.mockId ||
          resource.testId ||
          resourceType.includes("mock") ||
          resourceType.includes("test")
        ) {
          const mockId = resource.mockId || resource.testId || "";
  
          if (mockId) {
            mocks.push({
              id: `manual-mock-${mockId}-${resourceIndex}`,
              type: "mock",
              title: resourceTitle || task.mockTitle || `${taskTitle} Mock Test`,
              subject: task.subject || day.subject || "",
              chapter: task.chapter || day.chapter || "",
              planType: day.planType || "FREE",
              href: `/ctet-tet/mock-tests/start/${mockId}`,
              section: ROADMAP_RECOMMENDATION_SECTIONS.MOCK_TESTS,
              contentType: "MANUAL_MOCK_ID",
              source: "roadmapTask",
            });
          }
        }
      });
  
      return {
        notes,
        videos,
        mocks,
      };
    };
  
    const mapSystemRecommendation = (item = {}) => {
      return {
        ...mapContentItemToRoadmapRecommendation(item),
        source: "contentItems",
      };
    };
  
    const getScoredRecommendationsForDay = ({
      contentItems = [],
      targetDay,
    }) => {
      return contentItems
        .filter((item) =>
          hasStrongRoadmapRecommendationMatch({
            item,
            day: targetDay,
          })
        )
        .map((item) => ({
          item,
          score: scoreRoadmapRecommendationItem({
            item,
            day: targetDay,
          }),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => mapSystemRecommendation(entry.item));
    };
  
    const snapshot = await getDocs(collection(db, "contentItems"));
  
    const contentItems = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .filter(
        (item) =>
          isPublishedStatus(item.status) &&
          allowedSections.includes(item.section)
      );
  
    const scoredDayItems = getScoredRecommendationsForDay({
      contentItems,
      targetDay: day,
    });
  
    const notes = dedupeRecommendations(
      scoredDayItems.filter((item) => item.type === "note")
    ).slice(0, safeLimit);
  
    const videos = dedupeRecommendations(
      scoredDayItems.filter((item) => item.type === "video")
    ).slice(0, safeLimit);
  
    const mocks = dedupeRecommendations(
      scoredDayItems.filter((item) => item.type === "mock")
    ).slice(0, safeLimit);
  
    const byTask = dayTasks.map((task, index) => {
      const taskId = getTaskId(task, index);
      const taskTitle = getTaskTitle(task, index);
      const taskSlot = getTaskSlot(task);
      const taskType = getTaskType(task);
    
      const taskContextText = [
        day.dayType,
        day.subject,
        day.chapter,
        day.focusArea,
        taskType,
        taskSlot,
        taskTitle,
        task.description,
        task.taskDescription,
        task.focusArea,
        task.revisionFocus,
      ]
        .filter(Boolean)
        .join(" ");
    
      const normalizedTaskType = normalizeRoadmapRecommendationText(taskType);
      const normalizedTaskSlot = normalizeRoadmapRecommendationText(taskSlot);
      const normalizedTaskTitle = normalizeRoadmapRecommendationText(taskTitle);
    
      const taskIntentText = [
        normalizedTaskType,
        normalizedTaskSlot,
        normalizedTaskTitle,
      ]
        .filter(Boolean)
        .join(" ");
    
      const isRestTask = normalizedTaskType === "rest";
      const isLiveTask =
        taskIntentText.includes("live") ||
        taskIntentText.includes("class");
      const isMockTask =
        taskIntentText.includes("mock") ||
        taskIntentText.includes("test");
      const isRevisionTask =
        taskIntentText.includes("revision") ||
        taskIntentText.includes("revise") ||
        taskIntentText.includes("analysis");
    
      const shouldSkipResources =
        isRestTask || isCurrentAffairsContext(taskContextText);
    
      if (shouldSkipResources) {
        return {
          taskId,
          taskTitle,
          taskSlot,
          taskType,
          notes: [],
          videos: [],
          mocks: [],
        };
      }
    
      const taskSearchDay = buildTaskSearchDay(task);
    
      const scoredTaskItems = getScoredRecommendationsForDay({
        contentItems,
        targetDay: taskSearchDay,
      });
    
      const manualResources = buildManualTaskResources(task, index);
    
      const scoredNotes = scoredTaskItems.filter((item) => item.type === "note");
      const scoredVideos = scoredTaskItems.filter((item) => item.type === "video");
      const scoredMocks = scoredTaskItems.filter((item) => item.type === "mock");
    
      let taskNotes = [];
      let taskVideos = [];
      let taskMocks = [];
    
      if (isLiveTask) {
        taskVideos = dedupeRecommendations([
          ...manualResources.videos,
          ...scoredVideos,
        ]).slice(0, 2);
    
        taskNotes = dedupeRecommendations([
          ...manualResources.notes,
          ...scoredNotes,
        ]).slice(0, 2);
    
        taskMocks = dedupeRecommendations([
          ...manualResources.mocks,
        ]).slice(0, 1);
      } else if (isMockTask) {
        taskMocks = dedupeRecommendations([
          ...manualResources.mocks,
          ...scoredMocks,
        ]).slice(0, 2);
    
        taskNotes = dedupeRecommendations([
          ...manualResources.notes,
          ...scoredNotes,
        ]).slice(0, 2);
    
        taskVideos = dedupeRecommendations([
          ...manualResources.videos,
          ...scoredVideos,
        ]).slice(0, 1);
      } else if (isRevisionTask) {
        taskNotes = dedupeRecommendations([
          ...manualResources.notes,
          ...scoredNotes,
        ]).slice(0, 3);
    
        taskVideos = dedupeRecommendations([
          ...manualResources.videos,
          ...scoredVideos,
        ]).slice(0, 2);
    
        taskMocks = dedupeRecommendations([
          ...manualResources.mocks,
          ...scoredMocks,
        ]).slice(0, 1);
      } else {
        taskNotes = dedupeRecommendations([
          ...manualResources.notes,
          ...scoredNotes,
        ]).slice(0, 2);
    
        taskVideos = dedupeRecommendations([
          ...manualResources.videos,
          ...scoredVideos,
        ]).slice(0, 2);
    
        taskMocks = dedupeRecommendations([
          ...manualResources.mocks,
          ...scoredMocks,
        ]).slice(0, 1);
      }
    
      return {
        taskId,
        taskTitle,
        taskSlot,
        taskType,
        notes: taskNotes,
        videos: taskVideos,
        mocks: taskMocks,
      };
    });
  
    return {
      notes,
      videos,
      mocks,
      all: [...notes, ...videos, ...mocks].slice(0, safeLimit),
      byTask,
    };
  };

  export const buildRoadmapProgressAnalytics = ({
    days = [],
    progressItems = [],
  }) => {
    const safeDays = Array.isArray(days) ? days : [];
    const safeProgressItems = Array.isArray(progressItems)
      ? progressItems
      : [];
  
    const totalTasks = safeDays.reduce((total, day) => {
      return total + Number(day.tasks?.length || 0);
    }, 0);
  
    const studentIds = [
      ...new Set(
        safeProgressItems
          .map((item) => item.userId)
          .filter(Boolean)
      ),
    ];
  
    const activeStudentCount = studentIds.length;
  
    const completedTaskCount = safeProgressItems.reduce((total, item) => {
      return total + Number(item.completedTaskIds?.length || 0);
    }, 0);
  
    const totalPossibleTasks = activeStudentCount * totalTasks;
  
    const overallCompletionPercent =
      totalPossibleTasks > 0
        ? Math.round((completedTaskCount / totalPossibleTasks) * 100)
        : 0;
  
    const studentMap = safeProgressItems.reduce((map, item) => {
      const userId = item.userId || "unknown-student";
  
      if (!map[userId]) {
        map[userId] = {
          userId,
          studentName: item.studentName || "",
          studentEmail: item.studentEmail || "",
          completedTaskIds: new Set(),
          completedDays: new Set(),
          touchedDays: new Set(),
          progressRecords: [],
        };
      }
      
      if (item.studentName && !map[userId].studentName) {
        map[userId].studentName = item.studentName;
      }
      
      if (item.studentEmail && !map[userId].studentEmail) {
        map[userId].studentEmail = item.studentEmail;
      }
  
      map[userId].progressRecords.push(item);
      map[userId].touchedDays.add(item.dayId);
  
      const completedIds = Array.isArray(item.completedTaskIds)
        ? item.completedTaskIds
        : [];
  
      completedIds.forEach((taskId) => {
        map[userId].completedTaskIds.add(taskId);
      });
  
      if (Number(item.progressPercent || 0) >= 100) {
        map[userId].completedDays.add(item.dayId);
      }
  
      return map;
    }, {});
  
    const studentAnalytics = Object.values(studentMap)
      .map((student) => {
        const completedTasks = student.completedTaskIds.size;
        const completionPercent =
          totalTasks > 0
            ? Math.min(100, Math.round((completedTasks / totalTasks) * 100))
            : 0;
  
            return {
                userId: student.userId,
                studentName: student.studentName || "",
                studentEmail: student.studentEmail || "",
                completedTasks,
                touchedDays: student.touchedDays.size,
                completedDays: student.completedDays.size,
                completionPercent,
                progressRecords: student.progressRecords.length,
              };
      })
      .sort((a, b) => b.completionPercent - a.completionPercent);
  
    const dayAnalytics = safeDays.map((day) => {
      const dayTasks = Array.isArray(day.tasks) ? day.tasks : [];
      const dayProgressItems = safeProgressItems.filter(
        (item) => item.dayId === day.id
      );
  
      const studentsStarted = [
        ...new Set(dayProgressItems.map((item) => item.userId).filter(Boolean)),
      ].length;
  
      const completedTasksForDay = dayProgressItems.reduce((total, item) => {
        return total + Number(item.completedTaskIds?.length || 0);
      }, 0);
  
      const possibleTasksForDay = activeStudentCount * dayTasks.length;
  
      const dayCompletionPercent =
        possibleTasksForDay > 0
          ? Math.round((completedTasksForDay / possibleTasksForDay) * 100)
          : 0;
  
      return {
        dayId: day.id,
        dayNumber: day.dayNumber || "",
        date: day.date || "",
        subject: day.subject || "",
        chapter: day.chapter || "",
        focusArea: day.focusArea || "",
        dayType: day.dayType || "",
        taskCount: dayTasks.length,
        studentsStarted,
        completedTasks: completedTasksForDay,
        completionPercent: Math.min(100, dayCompletionPercent),
      };
    });
  
    const fullyCompletedStudents = studentAnalytics.filter(
      (student) => student.completionPercent >= 100
    ).length;
  
    const averageCompletionPercent =
      studentAnalytics.length > 0
        ? Math.round(
            studentAnalytics.reduce((total, student) => {
              return total + Number(student.completionPercent || 0);
            }, 0) / studentAnalytics.length
          )
        : 0;
  
    return {
      totalDays: safeDays.length,
      totalTasks,
      activeStudentCount,
      completedTaskCount,
      totalPossibleTasks,
      overallCompletionPercent: Math.min(100, overallCompletionPercent),
      averageCompletionPercent,
      fullyCompletedStudents,
      studentAnalytics,
      dayAnalytics,
    };
  };
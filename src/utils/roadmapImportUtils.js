import * as XLSX from "xlsx";
import {
  ROADMAP_DAY_TYPES,
  ROADMAP_PLAN_TYPES,
  ROADMAP_STATUS,
  ROADMAP_TASK_SLOTS,
} from "../services/roadmapService";

export const ROADMAP_IMPORT_SHEETS = {
  INFO: "Roadmap Info",
  SCHEDULE: "Schedule",
  RESOURCES: "Resources",
};

export const ROADMAP_DEFAULT_TIMES = {
  LIVE_START: "18:00",
  LIVE_END: "19:00",
  MORNING_MINUTES: 150,
  LIVE_MINUTES: 60,
};

const allowedPlanTypes = Object.values(ROADMAP_PLAN_TYPES);
const allowedStatuses = Object.values(ROADMAP_STATUS);
const allowedDayTypes = Object.values(ROADMAP_DAY_TYPES);

const cleanText = (value = "") => {
  if (value === null || value === undefined) return "";

  return value
    .toString()
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeKey = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const getRowValue = (row = {}, candidates = []) => {
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, candidate)) {
      return row[candidate];
    }
  }

  const rowKeys = Object.keys(row);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKey(candidate);

    const matchedKey = rowKeys.find(
      (key) => normalizeKey(key) === normalizedCandidate
    );

    if (matchedKey) {
      return row[matchedKey];
    }
  }

  return "";
};

const formatDateParts = ({ year, month, day }) => {
  if (!year || !month || !day) return "";

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

const formatLocalDate = (dateValue) => {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return "";
  }

  return formatDateParts({
    year: dateValue.getFullYear(),
    month: dateValue.getMonth() + 1,
    day: dateValue.getDate(),
  });
};

export const parseRoadmapDate = (value = "") => {
  if (!value) return "";

  if (value instanceof Date) {
    return formatLocalDate(value);
  }

  if (typeof value === "number") {
    const parsedDate = XLSX.SSF.parse_date_code(value);

    if (!parsedDate) return "";

    return formatDateParts({
      year: parsedDate.y,
      month: parsedDate.m,
      day: parsedDate.d,
    });
  }

  const text = cleanText(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (slashMatch) {
    return formatDateParts({
      year: slashMatch[3],
      month: slashMatch[2],
      day: slashMatch[1],
    });
  }

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return formatLocalDate(parsed);
  }

  return "";
};

export const parseRoadmapTime = (value = "") => {
  if (!value && value !== 0) return "";

  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  const text = cleanText(value);

  const timeMatch = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);

  if (!timeMatch) {
    return text;
  }

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2] || 0);
  const period = timeMatch[3]?.toUpperCase();

  if (period === "PM" && hours < 12) {
    hours += 12;
  }

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  if (hours > 23 || minutes > 59) {
    return text;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

const parseNumber = (value, fallback = 0) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizePlanType = (value = "") => {
  const planType = cleanText(value).toUpperCase();

  return allowedPlanTypes.includes(planType)
    ? planType
    : ROADMAP_PLAN_TYPES.FREE;
};

const normalizeStatus = (value = "") => {
  const status = cleanText(value).toLowerCase();

  return allowedStatuses.includes(status) ? status : ROADMAP_STATUS.DRAFT;
};

const normalizeDayType = (value = "") => {
  const dayType = cleanText(value).toLowerCase();

  return allowedDayTypes.includes(dayType) ? dayType : "";
};

const inferDayType = ({
  explicitDayType = "",
  subject = "",
  morningTitle = "",
  eveningTitle = "",
  mockTitle = "",
  revisionFocus = "",
}) => {
  const normalizedExplicit = normalizeDayType(explicitDayType);

  if (normalizedExplicit) {
    return normalizedExplicit;
  }

  const joinedText = [
    subject,
    morningTitle,
    eveningTitle,
    mockTitle,
    revisionFocus,
  ]
    .join(" ")
    .toLowerCase();

  if (joinedText.includes("exam day") || joinedText.includes("exam")) {
    return ROADMAP_DAY_TYPES.EXAM;
  }

  if (
    joinedText.includes("analysis") ||
    joinedText.includes("weak area") ||
    joinedText.includes("weak-area")
  ) {
    return ROADMAP_DAY_TYPES.ANALYSIS;
  }

  if (joinedText.includes("mock")) {
    return ROADMAP_DAY_TYPES.MOCK;
  }

  if (joinedText.includes("revision")) {
    return ROADMAP_DAY_TYPES.REVISION;
  }

  if (
    joinedText.includes("rest") ||
    joinedText.includes("relax") ||
    joinedText.includes("break")
  ) {
    return ROADMAP_DAY_TYPES.REST;
  }

  if (joinedText.includes("live")) {
    return ROADMAP_DAY_TYPES.LIVE;
  }

  return ROADMAP_DAY_TYPES.STUDY;
};

const createTaskId = ({ dayNumber, slot, index }) =>
  `day-${dayNumber}-${slot}-${index + 1}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");

const buildTask = ({
  dayNumber,
  slot,
  index,
  title,
  description = "",
  startTime = "",
  endTime = "",
  estimatedMinutes = 0,
  taskType = ROADMAP_DAY_TYPES.STUDY,
  resourceLinks = [],
}) => ({
  taskId: createTaskId({ dayNumber, slot, index }),
  slot,
  taskType,
  title: cleanText(title),
  description: cleanText(description),
  startTime: parseRoadmapTime(startTime),
  endTime: parseRoadmapTime(endTime),
  estimatedMinutes: parseNumber(estimatedMinutes, 0),
  resourceLinks: Array.isArray(resourceLinks) ? resourceLinks : [],
  status: "active",
});

const getInfoValue = (infoRows = [], fieldName = "", fallback = "") => {
  const normalizedFieldName = normalizeKey(fieldName);

  const matchedRow = infoRows.find((row) => {
    const field = getRowValue(row, ["Field", "Key", "Name"]);
    return normalizeKey(field) === normalizedFieldName;
  });

  if (!matchedRow) return fallback;

  return getRowValue(matchedRow, ["Value", "Data", "Content"]) ?? fallback;
};

const parseResourceRows = (resourcesRows = []) => {
  return resourcesRows
    .map((row, index) => ({
      resourceRowNumber: index + 2,
      date: parseRoadmapDate(getRowValue(row, ["Date"])),
      dayNumber: parseNumber(getRowValue(row, ["Day Number"]), 0),
      subject: cleanText(getRowValue(row, ["Subject"])),
      chapter: cleanText(getRowValue(row, ["Chapter"])),
      noteTitle: cleanText(getRowValue(row, ["Note Title", "Notes Title"])),
      videoTitle: cleanText(getRowValue(row, ["Video Title"])),
      mockTestTitle: cleanText(getRowValue(row, ["Mock Test Title"])),
      noteUrl: cleanText(getRowValue(row, ["Note URL", "Notes URL"])),
      videoUrl: cleanText(getRowValue(row, ["Video URL"])),
      mockId: cleanText(getRowValue(row, ["Mock ID", "Mock Test ID"])),
      liveUrl: cleanText(getRowValue(row, ["Live URL", "Live Class URL"])),
    }))
    .filter(
      (resource) =>
        resource.date ||
        resource.dayNumber ||
        resource.subject ||
        resource.chapter ||
        resource.noteTitle ||
        resource.videoTitle ||
        resource.mockTestTitle ||
        resource.noteUrl ||
        resource.videoUrl ||
        resource.mockId ||
        resource.liveUrl
    );
};

const getResourcesForDay = ({ day, resources = [] }) => {
  return resources.filter((resource) => {
    if (resource.date && day.date && resource.date === day.date) {
      return true;
    }

    if (
      resource.dayNumber &&
      day.dayNumber &&
      Number(resource.dayNumber) === Number(day.dayNumber)
    ) {
      return true;
    }

    const sameSubject =
      resource.subject &&
      day.subject &&
      normalizeKey(resource.subject) === normalizeKey(day.subject);

    const sameChapter =
      resource.chapter &&
      day.chapter &&
      normalizeKey(resource.chapter) === normalizeKey(day.chapter);

    return sameSubject && (!resource.chapter || sameChapter);
  });
};

const parseScheduleRow = ({ row, index, resources = [] }) => {
  const date = parseRoadmapDate(getRowValue(row, ["Date"]));
  const dayName = cleanText(getRowValue(row, ["Day", "Day Name"]));
  const dayNumber = parseNumber(
    getRowValue(row, ["Day Number", "Day No"]),
    index + 1
  );
  const weekNumber = parseNumber(
    getRowValue(row, ["Week Number", "Week No"]),
    Math.ceil(dayNumber / 7)
  );

  const subject = cleanText(getRowValue(row, ["Subject"]));
  const chapter = cleanText(getRowValue(row, ["Chapter"]));
  const focusArea = cleanText(getRowValue(row, ["Focus Area", "Focus"]));

  const morningTitle = cleanText(
    getRowValue(row, [
      "Morning Title",
      "Morning Self-Study",
      "Morning Self Study",
      "Morning Self-Study (2-3 hours)",
    ])
  );

  const morningDescription = cleanText(
    getRowValue(row, ["Morning Description", "Morning Details"])
  );

  const eveningTitle = cleanText(
    getRowValue(row, [
      "Evening Title",
      "Evening Live Session",
      "Evening Live Session (6:00 PM - 7:00 PM)",
      "Live Session",
    ])
  );

  const liveStartTime =
    parseRoadmapTime(getRowValue(row, ["Live Start Time", "Start Time"])) ||
    ROADMAP_DEFAULT_TIMES.LIVE_START;

  const liveEndTime =
    parseRoadmapTime(getRowValue(row, ["Live End Time", "End Time"])) ||
    ROADMAP_DEFAULT_TIMES.LIVE_END;

  const mockTitle = cleanText(getRowValue(row, ["Mock Title", "Mock Test"]));
  const revisionFocus = cleanText(
    getRowValue(row, ["Revision Focus", "Revision"])
  );

  const dayType = inferDayType({
    explicitDayType: getRowValue(row, ["Day Type", "Type"]),
    subject,
    morningTitle,
    eveningTitle,
    mockTitle,
    revisionFocus,
  });

  const baseDay = {
    date,
    dayName,
    dayNumber,
    weekNumber,
    subject,
    chapter,
    focusArea,
    dayType,
  };

  const resourceLinks = getResourcesForDay({
    day: baseDay,
    resources,
  });

  const tasks = [];

  if (morningTitle) {
    const morningSlot =
      dayType === ROADMAP_DAY_TYPES.MOCK
        ? ROADMAP_TASK_SLOTS.MOCK
        : dayType === ROADMAP_DAY_TYPES.ANALYSIS
        ? ROADMAP_TASK_SLOTS.ANALYSIS
        : dayType === ROADMAP_DAY_TYPES.REVISION ||
          dayType === ROADMAP_DAY_TYPES.REST
        ? ROADMAP_TASK_SLOTS.REVISION
        : ROADMAP_TASK_SLOTS.MORNING;

    tasks.push(
      buildTask({
        dayNumber,
        slot: morningSlot,
        index: tasks.length,
        title: morningTitle,
        description: morningDescription,
        estimatedMinutes: ROADMAP_DEFAULT_TIMES.MORNING_MINUTES,
        taskType: dayType,
        resourceLinks,
      })
    );
  }

  if (eveningTitle) {
    const eveningIsRest =
      eveningTitle.toLowerCase().includes("rest") ||
      eveningTitle.toLowerCase().includes("revision");

    const eveningSlot = eveningIsRest
      ? ROADMAP_TASK_SLOTS.REVISION
      : ROADMAP_TASK_SLOTS.LIVE;

    tasks.push(
      buildTask({
        dayNumber,
        slot: eveningSlot,
        index: tasks.length,
        title: eveningTitle,
        startTime: eveningIsRest ? "" : liveStartTime,
        endTime: eveningIsRest ? "" : liveEndTime,
        estimatedMinutes: eveningIsRest ? 0 : ROADMAP_DEFAULT_TIMES.LIVE_MINUTES,
        taskType: eveningIsRest ? ROADMAP_DAY_TYPES.REVISION : ROADMAP_DAY_TYPES.LIVE,
        resourceLinks,
      })
    );
  }

  if (mockTitle && !tasks.some((task) => task.slot === ROADMAP_TASK_SLOTS.MOCK)) {
    tasks.push(
      buildTask({
        dayNumber,
        slot: ROADMAP_TASK_SLOTS.MOCK,
        index: tasks.length,
        title: mockTitle,
        taskType: ROADMAP_DAY_TYPES.MOCK,
        resourceLinks,
      })
    );
  }

  if (
    revisionFocus &&
    !tasks.some((task) => task.title === revisionFocus)
  ) {
    tasks.push(
      buildTask({
        dayNumber,
        slot: ROADMAP_TASK_SLOTS.REVISION,
        index: tasks.length,
        title: revisionFocus,
        taskType: ROADMAP_DAY_TYPES.REVISION,
        resourceLinks,
      })
    );
  }

  return {
    ...baseDay,
    tasks,
    resourceLinks,
    status: "published",
  };
};

export const validateRoadmapImportData = ({ roadmap, days = [] }) => {
  const errors = [];
  const warnings = [];

  if (!roadmap?.title?.trim()) {
    errors.push("Roadmap title is required in Roadmap Info sheet.");
  }

  if (!roadmap?.startDate) {
    warnings.push("Start Date is missing in Roadmap Info sheet.");
  }

  if (!roadmap?.endDate) {
    warnings.push("End Date is missing in Roadmap Info sheet.");
  }

  if (!Array.isArray(days) || days.length === 0) {
    errors.push("Schedule sheet must contain at least one day.");
  }

  const seenDates = new Set();

  days.forEach((day, index) => {
    const rowNumber = index + 2;

    if (!day.date) {
      errors.push(`Schedule row ${rowNumber}: Date is required or invalid.`);
    }

    if (day.date && seenDates.has(day.date)) {
      errors.push(`Schedule row ${rowNumber}: Duplicate date ${day.date}.`);
    }

    if (day.date) {
      seenDates.add(day.date);
    }

    if (!day.dayNumber) {
      warnings.push(`Schedule row ${rowNumber}: Day Number is missing.`);
    }

    if (!day.subject && day.dayType === ROADMAP_DAY_TYPES.STUDY) {
      warnings.push(`Schedule row ${rowNumber}: Subject is missing.`);
    }

    if (!day.tasks?.length) {
      errors.push(
        `Schedule row ${rowNumber}: At least one task title is required.`
      );
    }

    if (!allowedDayTypes.includes(day.dayType)) {
      errors.push(`Schedule row ${rowNumber}: Invalid Day Type.`);
    }
  });

  const firstDayDate = days[0]?.date || "";

  if (roadmap?.startDate && firstDayDate && roadmap.startDate !== firstDayDate) {
    warnings.push(
      `Roadmap Start Date (${roadmap.startDate}) does not match first schedule date (${firstDayDate}).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalDays: days.length,
      totalTasks: days.reduce(
        (total, day) => total + Number(day.tasks?.length || 0),
        0
      ),
      mockDays: days.filter((day) => day.dayType === ROADMAP_DAY_TYPES.MOCK)
        .length,
      revisionDays: days.filter(
        (day) => day.dayType === ROADMAP_DAY_TYPES.REVISION
      ).length,
      analysisDays: days.filter(
        (day) => day.dayType === ROADMAP_DAY_TYPES.ANALYSIS
      ).length,
    },
  };
};

export const parseRoadmapWorkbook = (workbook, sourceFileName = "") => {
  const infoSheet = workbook.Sheets[ROADMAP_IMPORT_SHEETS.INFO];
  const scheduleSheet = workbook.Sheets[ROADMAP_IMPORT_SHEETS.SCHEDULE];
  const resourcesSheet = workbook.Sheets[ROADMAP_IMPORT_SHEETS.RESOURCES];

  if (!infoSheet || !scheduleSheet) {
    return {
      roadmap: null,
      days: [],
      validation: {
        isValid: false,
        errors: [
          `Invalid template. File must contain '${ROADMAP_IMPORT_SHEETS.INFO}' and '${ROADMAP_IMPORT_SHEETS.SCHEDULE}' sheets.`,
        ],
        warnings: [],
        summary: {},
      },
    };
  }

  const infoRows = XLSX.utils.sheet_to_json(infoSheet, {
    defval: "",
  });

  const scheduleRows = XLSX.utils.sheet_to_json(scheduleSheet, {
    defval: "",
  });

  const resourcesRows = resourcesSheet
    ? XLSX.utils.sheet_to_json(resourcesSheet, {
        defval: "",
      })
    : [];

  const roadmap = {
    title: cleanText(getInfoValue(infoRows, "Title")),
    description: cleanText(getInfoValue(infoRows, "Description")),
    course: cleanText(getInfoValue(infoRows, "Course", "CTET/TET")),
    examType: cleanText(getInfoValue(infoRows, "Exam Type", "CTET/TET")),
    stream: cleanText(getInfoValue(infoRows, "Stream")),
    startDate: parseRoadmapDate(getInfoValue(infoRows, "Start Date")),
    endDate: parseRoadmapDate(getInfoValue(infoRows, "End Date")),
    examDate: parseRoadmapDate(getInfoValue(infoRows, "Exam Date")),
    planType: normalizePlanType(getInfoValue(infoRows, "Plan Type", "FREE")),
    mentorName: cleanText(getInfoValue(infoRows, "Mentor Name")),
    status: normalizeStatus(getInfoValue(infoRows, "Status", "draft")),
    sourceType: "xlsxImport",
    sourceFileName,
  };

  const resources = parseResourceRows(resourcesRows);

  const days = scheduleRows
    .filter((row) =>
      Object.values(row).some((value) => cleanText(value).length > 0)
    )
    .map((row, index) =>
      parseScheduleRow({
        row,
        index,
        resources,
      })
    );

  const validation = validateRoadmapImportData({
    roadmap,
    days,
  });

  return {
    roadmap,
    days,
    resources,
    validation,
  };
};

export const parseRoadmapXlsxFile = async (file) => {
  if (!file) {
    throw new Error("Please select a roadmap XLSX file.");
  }

  const data = await file.arrayBuffer();

  const workbook = XLSX.read(data, {
    type: "array",
    cellDates: true,
  });

  return parseRoadmapWorkbook(workbook, file.name);
};

export const buildRoadmapTemplateWorkbook = () => {
  const infoRows = [
    { Field: "Title", Value: "CTET Paper II 60-Day Smart Roadmap" },
    { Field: "Course", Value: "CTET/TET" },
    { Field: "Exam Type", Value: "CTET Paper II" },
    { Field: "Stream", Value: "Maths/Science" },
    { Field: "Start Date", Value: "2026-06-15" },
    { Field: "End Date", Value: "2026-09-05" },
    { Field: "Exam Date", Value: "2026-09-06" },
    { Field: "Plan Type", Value: "FREE" },
    { Field: "Mentor Name", Value: "Dr. Varsha D. Maru" },
    { Field: "Status", Value: "draft" },
    {
      Field: "Description",
      Value:
        "Daily guided preparation roadmap with self-study, live sessions, mock tests, revision, and analysis.",
    },
  ];

  const scheduleRows = [
    {
      Date: "2026-06-15",
      Day: "Monday",
      "Day Number": 1,
      "Week Number": 1,
      Subject: "CDP",
      Chapter: "Development and Learning",
      "Focus Area": "Concept building",
      "Day Type": "study",
      "Morning Title": "CDP: Concept of Development & Learning",
      "Morning Description": "Read concepts, prepare short notes, and solve practice questions.",
      "Evening Title": "CDP: Theories of Child Development",
      "Live Start Time": "18:00",
      "Live End Time": "19:00",
      "Mock Title": "",
      "Revision Focus": "",
    },
    {
      Date: "2026-06-20",
      Day: "Saturday",
      "Day Number": 6,
      "Week Number": 1,
      Subject: "All Subjects",
      Chapter: "Weekly Revision",
      "Focus Area": "Revision and testing",
      "Day Type": "mock",
      "Morning Title": "Revision & Mock Test 1",
      "Morning Description": "Revise weekly topics and attempt one mock test.",
      "Evening Title": "Rest/Revision",
      "Live Start Time": "",
      "Live End Time": "",
      "Mock Title": "Mock Test 1",
      "Revision Focus": "Weekly revision",
    },
  ];

  const resourceRows = [
    {
      Date: "2026-06-15",
      "Day Number": 1,
      Subject: "CDP",
      Chapter: "Development and Learning",
      "Note Title": "CDP Development Notes",
      "Video Title": "Child Development Live Class",
      "Mock Test Title": "",
      "Note URL": "",
      "Video URL": "",
      "Mock ID": "",
      "Live URL": "",
    },
  ];

  const infoSheet = XLSX.utils.json_to_sheet(infoRows);
  const scheduleSheet = XLSX.utils.json_to_sheet(scheduleRows);
  const resourcesSheet = XLSX.utils.json_to_sheet(resourceRows);

  infoSheet["!cols"] = [{ wch: 30 }, { wch: 70 }];

  scheduleSheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 30 },
    { wch: 30 },
    { wch: 16 },
    { wch: 45 },
    { wch: 70 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 30 },
  ];

  resourcesSheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 30 },
    { wch: 35 },
    { wch: 35 },
    { wch: 35 },
    { wch: 50 },
    { wch: 50 },
    { wch: 24 },
    { wch: 50 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    infoSheet,
    ROADMAP_IMPORT_SHEETS.INFO
  );

  XLSX.utils.book_append_sheet(
    workbook,
    scheduleSheet,
    ROADMAP_IMPORT_SHEETS.SCHEDULE
  );

  XLSX.utils.book_append_sheet(
    workbook,
    resourcesSheet,
    ROADMAP_IMPORT_SHEETS.RESOURCES
  );

  return workbook;
};

export const downloadRoadmapXlsxTemplate = () => {
  const workbook = buildRoadmapTemplateWorkbook();

  XLSX.writeFile(workbook, "aspirepath-roadmap-import-template.xlsx");
};
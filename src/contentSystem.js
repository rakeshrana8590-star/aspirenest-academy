export const CONTENT_SECTIONS = {
  NOTES: "notes",
  CURRENT_AFFAIRS: "currentAffairs",
  SUBJECT_PDF: "subjectPdf",
  COURSE_MATERIAL: "courseMaterial",
  RECORDED_VIDEO: "recordedVideo",
  MOCK_PDF: "mockPdf",
  ANNOUNCEMENT: "announcement",
  BANNER: "banner",
  FREE_RESOURCE: "freeResource",
};

export const CONTENT_TYPES = {
  PDF: "PDF",
  IMAGE: "IMAGE",
  TEXT: "TEXT",
  LINK: "LINK",
  VIDEO: "VIDEO",
  MOCK: "MOCK",
};

export const SOURCE_TYPES = {
  DRIVE: "DRIVE",
  YOUTUBE: "YOUTUBE",
  ASSET: "ASSET",
  FIREBASE_STORAGE: "FIREBASE_STORAGE",
};

export const PLAN_TYPES = {
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  MENTORSHIP: "MENTORSHIP",
};

export const CONTENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  UNPUBLISHED: "unpublished",
  ARCHIVED: "archived",
};

export const createContentItem = ({
  title = "",
  section = "",
  subject = "",
  course = "",
  chapter = "",
  month = "",
  date = "",
  planType = PLAN_TYPES.FREE,
  contentType = CONTENT_TYPES.PDF,
  sourceType = SOURCE_TYPES.DRIVE,
  fileUrl = "",
  videoUrl = "",
  thumbnailUrl = "",
  duration = "",
  teacherName = "",
  status = CONTENT_STATUS.DRAFT,
  order = 0,
  createdBy = "",
} = {}) => ({
  title,
  section,
  subject,
  course,
  chapter,
  month,
  date,
  planType,
  contentType,
  sourceType,
  fileUrl,
  videoUrl,
  thumbnailUrl,
  duration,
  teacherName,
  status,
  order,
  createdBy,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const validateContentItem = (item) => {
  if (!item.title?.trim()) {
    return "Title is required";
  }

  if (!item.section?.trim()) {
    return "Section is required";
  }

  if (!item.contentType?.trim()) {
    return "Content type is required";
  }

  const hasFile =
    item.fileUrl?.trim() || item.videoUrl?.trim();

  if (!hasFile) {
    return "File URL or Video URL is required";
  }

  return null;
};
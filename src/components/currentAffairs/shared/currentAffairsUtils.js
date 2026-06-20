export const CURRENT_AFFAIRS_PLAN_ORDER = [
    "FREE",
    "BASIC",
    "PREMIUM",
    "MENTORSHIP",
  ];
  
  export const CURRENT_AFFAIRS_PLAN_LABELS = {
    FREE: "Free Current Affairs",
    BASIC: "Basic Current Affairs",
    PREMIUM: "Premium Current Affairs",
    MENTORSHIP: "Mentorship Current Affairs",
  };
  
  export const CURRENT_AFFAIRS_PLAN_ICONS = {
    FREE: "📰",
    BASIC: "📘",
    PREMIUM: "⭐",
    MENTORSHIP: "👩‍🏫",
  };
  
  export const CURRENT_AFFAIRS_MONTH_ORDER = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  
  export const CURRENT_AFFAIRS_WEEK_ORDER = [
    "week-1",
    "week-2",
    "week-3",
    "week-4",
    "week-5",
    "monthly-revision",
    "monthly-pdfs",
    "yearly-compilation",
  ];
  
  export function normalizeCurrentAffairsText(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  
  export function cleanCurrentAffairsText(value = "", fallback = "") {
    const text = String(value || "").trim();
    return text || fallback;
  }
  
  export function createCurrentAffairsSlug(value = "") {
    return normalizeCurrentAffairsText(value);
  }
  
  export function getCurrentAffairsSection(item = {}) {
    return normalizeCurrentAffairsText(item.section || "");
  }
  
  export function isCurrentAffairsContent(item = {}) {
    const section = getCurrentAffairsSection(item);
  
    return (
      section === "currentaffairs" ||
      section === "current-affairs" ||
      section === "current-affair"
    );
  }
  
  export function getCurrentAffairsPdfUrl(item = {}) {
    return cleanCurrentAffairsText(
      item.fileUrl ||
        item.pdfUrl ||
        item.pdf ||
        item.url ||
        item.sourceUrl,
      ""
    );
  }
  
  export function hasValidCurrentAffairsPdf(item = {}) {
    const pdfUrl = getCurrentAffairsPdfUrl(item);
    const normalizedUrl = pdfUrl.trim().toLowerCase();
  
    if (!normalizedUrl) return false;
    if (normalizedUrl === "#") return false;
    if (normalizedUrl === "coming-soon") return false;
    if (normalizedUrl === "coming soon") return false;
    if (normalizedUrl.startsWith("javascript:")) return false;
  
    return true;
  }
  
  export function getCurrentAffairsPlan(item = {}) {
    return cleanCurrentAffairsText(
      item.planType ||
        item.accessPlan ||
        item.plan ||
        item.type,
      "FREE"
    ).toUpperCase();
  }
  
  export function getCurrentAffairsStatus(item = {}) {
    const status = cleanCurrentAffairsText(item.status, "");
  
    if (status) {
      return status.toLowerCase();
    }
  
    if (!isCurrentAffairsContent(item) && hasValidCurrentAffairsPdf(item)) {
      return "published";
    }
  
    return "draft";
  }
  
  export function isPublishedCurrentAffair(item = {}) {
    const plan = getCurrentAffairsPlan(item);
    const status = getCurrentAffairsStatus(item);
  
    return (
      status === "published" &&
      plan !== "COMING_SOON" &&
      hasValidCurrentAffairsPdf(item)
    );
  }
  
  export function getCurrentAffairsMonth(item = {}) {
    const month = cleanCurrentAffairsText(item.month, "");
  
    if (month) return month;
  
    const cmsMonth = cleanCurrentAffairsText(item.cmsMonth, "");
    const year = cleanCurrentAffairsText(
      item.year ||
        item.duration ||
        item.cmsDuration,
      ""
    );
  
    return cleanCurrentAffairsText(`${cmsMonth} ${year}`.trim(), "Current Affairs");
  }
  
  export function getCurrentAffairsMonthOnly(monthLabel = "") {
    const parts = String(monthLabel || "")
      .trim()
      .toLowerCase()
      .split(/\s+/);
  
    return parts[0] || "";
  }
  
  export function getCurrentAffairsYear(itemOrMonth = {}) {
    const source =
      typeof itemOrMonth === "string"
        ? itemOrMonth
        : `${itemOrMonth.month || ""} ${itemOrMonth.year || ""} ${
            itemOrMonth.duration || ""
          }`;
  
    const match = String(source || "").match(/\b(20\d{2}|19\d{2})\b/);
  
    return match ? Number(match[1]) : 0;
  }
  
  export function getCurrentAffairsWeek(item = {}) {
    const monthName = getCurrentAffairsMonth(item);
  
    const directWeek = cleanCurrentAffairsText(
      item.week ||
        item.weekName ||
        item.chapter ||
        item.chapterName,
      ""
    );
  
    if (
      directWeek &&
      normalizeCurrentAffairsText(directWeek) !==
        normalizeCurrentAffairsText(monthName)
    ) {
      return directWeek;
    }
  
    const type = cleanCurrentAffairsText(item.type, "");
  
    if (
      type &&
      !["FREE", "BASIC", "PREMIUM", "MENTORSHIP", "COMING_SOON"].includes(
        type.toUpperCase()
      ) &&
      normalizeCurrentAffairsText(type) !== normalizeCurrentAffairsText(monthName)
    ) {
      return type;
    }
  
    return "Monthly PDFs";
  }
  
  export function getCurrentAffairsTitle(item = {}) {
    return cleanCurrentAffairsText(
      item.title,
      `${getCurrentAffairsMonth(item)} Current Affairs`
    );
  }
  
  export function normalizeCurrentAffairsItem(item = {}, source = "contentItems") {
    const month = getCurrentAffairsMonth(item);
    const week = getCurrentAffairsWeek(item);
    const title = getCurrentAffairsTitle(item);
    const pdfUrl = getCurrentAffairsPdfUrl(item);
    const planType = getCurrentAffairsPlan(item);
    const status = getCurrentAffairsStatus(item);
  
    return {
      ...item,
      source,
      title,
      month,
      week,
      chapter: item.chapter || week,
      planType,
      status,
      fileUrl: item.fileUrl || pdfUrl,
      pdfUrl,
      id:
        item.id ||
        createCurrentAffairsSlug(
          `${title}-${month}-${week}-${planType}-${pdfUrl}`
        ),
      monthSlug: createCurrentAffairsSlug(month),
      weekSlug: createCurrentAffairsSlug(week),
    };
  }
  
  export function uniqueCurrentAffairsByKey(items = [], getKey) {
    const seen = new Set();
  
    return items.filter((item) => {
      const key = normalizeCurrentAffairsText(getKey(item));
  
      if (!key || seen.has(key)) {
        return false;
      }
  
      seen.add(key);
      return true;
    });
  }
  
  export function getCurrentAffairsItems(
    contentItems = [],
    legacyCurrentAffairs = []
  ) {
    const contentRows = Array.isArray(contentItems) ? contentItems : [];
    const legacyRows = Array.isArray(legacyCurrentAffairs)
      ? legacyCurrentAffairs
      : [];
  
    const normalizedContent = contentRows
      .filter((item) => isCurrentAffairsContent(item))
      .map((item) => normalizeCurrentAffairsItem(item, "contentItems"));
  
    const normalizedLegacy = legacyRows
      .filter((item) => !isCurrentAffairsContent(item))
      .map((item) => normalizeCurrentAffairsItem(item, "currentAffairs"));
  
    return uniqueCurrentAffairsByKey(
      [...normalizedContent, ...normalizedLegacy],
      (item) =>
        item.id ||
        `${item.title}-${item.month}-${item.week}-${item.planType}-${item.pdfUrl}`
    );
  }
  
  export function getPublishedCurrentAffairs(
    contentItems = [],
    legacyCurrentAffairs = []
  ) {
    return getCurrentAffairsItems(contentItems, legacyCurrentAffairs).filter(
      (item) => isPublishedCurrentAffair(item)
    );
  }
  
  export function getCurrentAffairsPdfCount(items = []) {
    return items.filter((item) => hasValidCurrentAffairsPdf(item)).length;
  }
  
  export function getMonthSortValue(monthLabel = "") {
    const monthOnly = getCurrentAffairsMonthOnly(monthLabel);
    const monthIndex = CURRENT_AFFAIRS_MONTH_ORDER.indexOf(monthOnly);
    const year = getCurrentAffairsYear(monthLabel);
  
    return year * 100 + (monthIndex >= 0 ? monthIndex + 1 : 0);
  }
  
  export function sortCurrentAffairsMonths(months = []) {
    return [...months].sort(
      (a, b) => getMonthSortValue(b.title || b.month) - getMonthSortValue(a.title || a.month)
    );
  }
  
  export function getWeekSortValue(weekLabel = "") {
    const normalized = normalizeCurrentAffairsText(weekLabel);
    const fixedIndex = CURRENT_AFFAIRS_WEEK_ORDER.indexOf(normalized);
  
    if (fixedIndex >= 0) return fixedIndex + 1;
  
    const weekMatch = normalized.match(/week-(\d+)/);
    if (weekMatch) return Number(weekMatch[1]);
  
    if (normalized.includes("monthly")) return 90;
    if (normalized.includes("yearly")) return 99;
  
    return 50;
  }
  
  export function sortCurrentAffairsWeeks(weeks = []) {
    return [...weeks].sort(
      (a, b) =>
        getWeekSortValue(a.title || a.week) - getWeekSortValue(b.title || b.week)
    );
  }
  
  export function buildCurrentAffairsMonthList(items = []) {
    const publishedItems = items.filter((item) => isPublishedCurrentAffair(item));
    const months = uniqueCurrentAffairsByKey(
      publishedItems,
      (item) => item.month
    ).map((item) => {
      const title = item.month;
      const monthItems = publishedItems.filter(
        (row) =>
          normalizeCurrentAffairsText(row.month) ===
          normalizeCurrentAffairsText(title)
      );
  
      const planTypes = [
        ...new Set(monthItems.map((row) => getCurrentAffairsPlan(row))),
      ];
  
      return {
        id: createCurrentAffairsSlug(title),
        title,
        count: monthItems.length,
        pdfCount: getCurrentAffairsPdfCount(monthItems),
        planTypes,
        latestWeek: monthItems[0]?.week || "Monthly PDFs",
        cover: "📰",
      };
    });
  
    return sortCurrentAffairsMonths(months);
  }
  
  export function getMonthCurrentAffairs(items = [], monthId = "") {
    const activeMonth = normalizeCurrentAffairsText(monthId);
  
    return items.filter(
      (item) =>
        isPublishedCurrentAffair(item) &&
        normalizeCurrentAffairsText(item.month) === activeMonth
    );
  }
  
  export function buildCurrentAffairsWeekGroups(items = []) {
    const groups = items.reduce((acc, item) => {
      const weekName = getCurrentAffairsWeek(item);
  
      if (!acc[weekName]) {
        acc[weekName] = [];
      }
  
      acc[weekName].push(item);
  
      return acc;
    }, {});
  
    return sortCurrentAffairsWeeks(
      Object.entries(groups).map(([title, rows]) => ({
        id: createCurrentAffairsSlug(title),
        title,
        count: rows.length,
        pdfCount: getCurrentAffairsPdfCount(rows),
        items: rows,
      }))
    );
  }
  
  export function canAccessCurrentAffairsPlan({
    planName = "FREE",
    hasPlanAccess,
  } = {}) {
    const activePlan = String(planName || "FREE").trim().toUpperCase();
  
    if (activePlan === "FREE") {
      return true;
    }
  
    if (typeof hasPlanAccess !== "function") {
      return false;
    }
  
    return Boolean(hasPlanAccess(activePlan));
  }
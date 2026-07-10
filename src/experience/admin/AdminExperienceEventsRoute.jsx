import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AdminButton,
  AdminEmptyState,
  AdminErrorBox,
  AdminSectionHeader,
  AdminStatusPill,
} from "../../components/shared/admin";
import {
  EXPERIENCE_CTA_TYPES,
  EXPERIENCE_EVENT_STATUS,
  EXPERIENCE_EVENT_TYPES,
} from "../experienceConstants";
import {
  archiveExperienceEvent,
  createExperienceEvent,
  listExperienceEvents,
  updateExperienceEvent,
} from "../experienceEventService";
import {
  getExperienceEventTypeLabel,
  normalizeExperienceEvent,
} from "../experienceEventUtils";
import {
  EXPERIENCE_NOTIFICATION_SOURCE_TYPES,
  getExperienceSourceItemId,
  getExperienceSourceItemTitle,
  getExperienceSourceItemType,
} from "../experienceNotificationSourceUtils";
import "./adminExperienceEvents.css";

const DEFAULT_FORM = {
  title: "",
  description: "",
  type: EXPERIENCE_EVENT_TYPES.LIVE_CLASS,
  status: EXPERIENCE_EVENT_STATUS.SCHEDULED,
  subject: "",
  chapter: "",
  mentorName: "",
  planType: "FREE",
  startAt: "",
  endAt: "",
  thumbnail: "",
  ctaType: EXPERIENCE_CTA_TYPES.VIEW_DETAILS,
  ctaLabel: "",
  ctaUrl: "",
  sourceType: "",
  sourceId: "",
  priority: 0,
  featured: false,
};

const STATUS_FILTERS = ["ALL", ...Object.values(EXPERIENCE_EVENT_STATUS)];
const TYPE_FILTERS = ["ALL", ...Object.values(EXPERIENCE_EVENT_TYPES)];

const SOURCE_TYPE_OPTIONS = [
  { value: "", label: "No linked source" },
  { value: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.MOCK_TEST, label: "Mock Test" },
  { value: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO, label: "Video / Live Class" },
  { value: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.NOTES, label: "Notes / PDF" },
  { value: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.CURRENT_AFFAIRS, label: "Current Affairs" },
  { value: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.ROADMAP, label: "Roadmap / Mission" },
];

const getSourceOptionLabel = (item = {}) =>
  [
    getExperienceSourceItemTitle(item),
    item.subject || item.course || item.examType,
    item.chapter || item.month,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" • ");

const toDateTimeLocalValue = (value = "") => String(value || "").trim();

const getDateInputValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 16);

  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const formatDateTime = (value) => {
  if (!value) return "Not scheduled";

  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminExperienceEventsRoute({
  universalContent = [],
  currentAffairs = [],
  roadmaps = [],
}) {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEventId, setEditingEventId] = useState("");
  const [routeError, setRouteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const sourceOptions = useMemo(() => {
    const selectedType = String(form.sourceType || "").trim();
    if (!selectedType) return [];

    const contentOptions = (Array.isArray(universalContent) ? universalContent : []).map((item) => ({
      item,
      sourceType: getExperienceSourceItemType(item),
    }));

    const currentAffairOptions = (
      Array.isArray(currentAffairs) ? currentAffairs : []
    ).map((item) => ({
      item,
      sourceType: getExperienceSourceItemType(
        item,
        EXPERIENCE_NOTIFICATION_SOURCE_TYPES.CURRENT_AFFAIRS
      ),
    }));

    const roadmapOptions = (Array.isArray(roadmaps) ? roadmaps : []).map((item) => ({
      item,
      sourceType: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.ROADMAP,
    }));

    const seenIds = new Set();

    return [...contentOptions, ...currentAffairOptions, ...roadmapOptions]
      .filter(({ item, sourceType }) => {
        const itemId = getExperienceSourceItemId(item);
        const itemTitle = getExperienceSourceItemTitle(item);

        if (!itemId || !itemTitle || sourceType !== selectedType) return false;

        const uniqueKey = `${sourceType}:${itemId}`;
        if (seenIds.has(uniqueKey)) return false;
        seenIds.add(uniqueKey);
        return true;
      })
      .map(({ item }) => item)
      .sort((first, second) =>
        getExperienceSourceItemTitle(first).localeCompare(
          getExperienceSourceItemTitle(second)
        )
      );
  }, [currentAffairs, form.sourceType, roadmaps, universalContent]);

  const normalizedEvents = useMemo(
    () => events.map((event) => normalizeExperienceEvent(event.raw || event)),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return normalizedEvents.filter((event) => {
      const statusMatch = statusFilter === "ALL" || event.status === statusFilter;
      const typeMatch = typeFilter === "ALL" || event.type === typeFilter;
      const haystack = [
        event.title,
        event.description,
        event.subject,
        event.chapter,
        event.mentorName,
        event.planType,
        event.typeLabel,
        event.status,
        event.sourceType,
        event.sourceId,
      ]
        .join(" ")
        .toLowerCase();

      return statusMatch && typeMatch && (!query || haystack.includes(query));
    });
  }, [normalizedEvents, searchText, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: normalizedEvents.length,
      live: normalizedEvents.filter((event) => event.status === EXPERIENCE_EVENT_STATUS.LIVE).length,
      upcoming: normalizedEvents.filter((event) =>
        [EXPERIENCE_EVENT_STATUS.SCHEDULED, EXPERIENCE_EVENT_STATUS.PUBLISHED].includes(event.status)
      ).length,
      featured: normalizedEvents.filter((event) => event.featured).length,
    }),
    [normalizedEvents]
  );

  const loadEvents = async () => {
    setLoading(true);
    setRouteError("");

    try {
      const records = await listExperienceEvents({ maxCount: 50 });
      setEvents(records);
    } catch (error) {
      setRouteError(error?.message || "Experience events load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingEventId("");
    setSuccessMessage("");
    setRouteError("");
  };

  const startEdit = (eventRecord = {}) => {
    const raw = eventRecord.raw || eventRecord;
    const id = eventRecord.id || raw.id || "";

    setEditingEventId(id);
    setSuccessMessage("");
    setRouteError("");

    setForm({
      title: raw.title || eventRecord.title || "",
      description: raw.description || eventRecord.description || "",
      type: raw.type || eventRecord.type || EXPERIENCE_EVENT_TYPES.LIVE_CLASS,
      status: raw.status || eventRecord.status || EXPERIENCE_EVENT_STATUS.SCHEDULED,
      subject: raw.subject || eventRecord.subject || "",
      chapter: raw.chapter || eventRecord.chapter || "",
      mentorName: raw.mentorName || eventRecord.mentorName || "",
      planType: raw.planType || eventRecord.planType || "FREE",
      startAt: getDateInputValue(raw.startAt || eventRecord.startAt),
      endAt: getDateInputValue(raw.endAt || eventRecord.endAt),
      thumbnail: raw.thumbnail || raw.thumbnailUrl || eventRecord.thumbnail || "",
      ctaType: raw.ctaType || eventRecord.cta?.type || EXPERIENCE_CTA_TYPES.VIEW_DETAILS,
      ctaLabel: raw.ctaLabel || eventRecord.cta?.label || "",
      ctaUrl: raw.ctaUrl || eventRecord.cta?.url || "",
      sourceType:
        (raw.sourceType || eventRecord.sourceType) === "manual"
          ? ""
          : raw.sourceType || eventRecord.sourceType || "",
      sourceId: raw.sourceId || eventRecord.sourceId || "",
      priority: Number(raw.priority || eventRecord.priority || 0),
      featured: Boolean(raw.featured || eventRecord.featured),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleArchive = async (eventRecord = {}) => {
    const id = eventRecord.id || eventRecord.raw?.id || "";

    if (!id) {
      setRouteError("Event id missing.");
      return;
    }

    const ok = window.confirm("Archive this experience event?");
    if (!ok) return;

    setSaving(true);
    setRouteError("");
    setSuccessMessage("");

    try {
      await archiveExperienceEvent(id);
      setSuccessMessage("Experience event archived.");
      if (editingEventId === id) resetForm();
      await loadEvents();
    } catch (error) {
      setRouteError(error?.message || "Experience event archive failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setRouteError("Event title is required.");
      return;
    }

    if (form.sourceType && !form.sourceId) {
      setRouteError("Select the exact published linked source item.");
      return;
    }

    setSaving(true);
    setRouteError("");
    setSuccessMessage("");

    try {
      const payload = {
        ...form,
        title,
        description: form.description.trim(),
        subject: form.subject.trim(),
        chapter: form.chapter.trim(),
        mentorName: form.mentorName.trim(),
        planType: form.planType.trim() || "FREE",
        startAt: toDateTimeLocalValue(form.startAt),
        endAt: toDateTimeLocalValue(form.endAt),
        thumbnail: form.thumbnail.trim(),
        ctaType: form.ctaType,
        ctaLabel: form.ctaLabel.trim(),
        ctaUrl: form.ctaUrl.trim(),
        sourceType: form.sourceType.trim() || "manual",
        sourceId: form.sourceType ? form.sourceId.trim() : "",
        priority: Number(form.priority || 0),
        featured: Boolean(form.featured),
      };

      if (editingEventId) {
        await updateExperienceEvent(editingEventId, payload);
        setSuccessMessage("Experience event updated.");
      } else {
        await createExperienceEvent(payload);
        setSuccessMessage("Experience event created.");
      }

      setForm(DEFAULT_FORM);
      setEditingEventId("");
      await loadEvents();
    } catch (error) {
      setRouteError(error?.message || "Experience event save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="coursePages adminExperiencePage">
      <AdminSectionHeader
        eyebrow="EXPERIENCE STUDIO"
        title="Experience Events"
        description="Create, feature, publish, and control CTET/TET live classes, mock schedules, workshops, marathons, and announcements from one manager."
        rightSlot={
          <AdminButton variant="secondary" size="sm" onClick={() => navigate("/admin/content")}>
            Back to Content Studio
          </AdminButton>
        }
      />

      {routeError ? (
        <AdminErrorBox title="Experience Studio Error" message={routeError} />
      ) : null}

      {successMessage ? (
        <div className="adminExperienceSuccess">
          <strong>{successMessage}</strong>
        </div>
      ) : null}

      <div className="adminExperienceStats">
        <article><span>Total Events</span><strong>{stats.total}</strong><small>All records</small></article>
        <article><span>Live Now</span><strong>{stats.live}</strong><small>Shown first</small></article>
        <article><span>Upcoming</span><strong>{stats.upcoming}</strong><small>Schedule ribbon</small></article>
        <article><span>Featured</span><strong>{stats.featured}</strong><small>Priority spotlight</small></article>
      </div>

      <div className="adminExperienceWorkspace">
        <form className="adminExperienceFormCard" onSubmit={handleSubmit}>
          <div className="adminExperienceCardHead">
            <span>{editingEventId ? "EDIT EVENT" : "CREATE EVENT"}</span>
            <h2>{editingEventId ? "Update event record" : "Launch event control"}</h2>
            <p>Use published/live status to power the public CTET/TET experience screen.</p>
          </div>

          <div className="adminExperienceFormGrid">
            <label className="isWide">
              <span>Title</span>
              <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Example: CTET Mega Mock Sunday" />
            </label>

            <label>
              <span>Type</span>
              <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                {Object.values(EXPERIENCE_EVENT_TYPES).map((type) => (
                  <option value={type} key={type}>{getExperienceEventTypeLabel(type)}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                {Object.values(EXPERIENCE_EVENT_STATUS).map((status) => (
                  <option value={status} key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Plan</span>
              <select value={form.planType} onChange={(event) => updateField("planType", event.target.value)}>
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="MENTORSHIP">MENTORSHIP</option>
              </select>
            </label>

            <label>
              <span>Priority</span>
              <input type="number" value={form.priority} onChange={(event) => updateField("priority", event.target.value)} />
            </label>

            <label>
              <span>Subject</span>
              <input value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="CDP / Maths / EVS" />
            </label>

            <label>
              <span>Chapter</span>
              <input value={form.chapter} onChange={(event) => updateField("chapter", event.target.value)} placeholder="Optional chapter" />
            </label>

            <label>
              <span>Mentor</span>
              <input value={form.mentorName} onChange={(event) => updateField("mentorName", event.target.value)} placeholder="Dr. Varsha D. Maru" />
            </label>

            <label>
              <span>Featured</span>
              <select value={form.featured ? "yes" : "no"} onChange={(event) => updateField("featured", event.target.value === "yes")}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>

            <label>
              <span>Start</span>
              <input type="datetime-local" value={form.startAt} onChange={(event) => updateField("startAt", event.target.value)} />
            </label>

            <label>
              <span>End</span>
              <input type="datetime-local" value={form.endAt} onChange={(event) => updateField("endAt", event.target.value)} />
            </label>

            <label>
              <span>Thumbnail URL</span>
              <input value={form.thumbnail} onChange={(event) => updateField("thumbnail", event.target.value)} placeholder="Optional image URL" />
            </label>

            <label>
              <span>CTA Type</span>
              <select value={form.ctaType} onChange={(event) => updateField("ctaType", event.target.value)}>
                {Object.values(EXPERIENCE_CTA_TYPES).map((type) => (
                  <option value={type} key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              <span>CTA Label</span>
              <input value={form.ctaLabel} onChange={(event) => updateField("ctaLabel", event.target.value)} placeholder="Join Live / Start Mock" />
            </label>

            <label>
              <span>CTA URL</span>
              <input value={form.ctaUrl} onChange={(event) => updateField("ctaUrl", event.target.value)} placeholder="/ctet-tet/videos or full link" />
            </label>

            <label>
              <span>Linked Source Type</span>
              <select
                value={form.sourceType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceType: event.target.value,
                    sourceId: "",
                  }))
                }
              >
                {SOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value || "manual"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Linked Source Item</span>
              <select
                value={form.sourceId}
                disabled={!form.sourceType}
                onChange={(event) => updateField("sourceId", event.target.value)}
              >
                <option value="">
                  {form.sourceType
                    ? sourceOptions.length
                      ? "Select exact published item"
                      : "No published items available"
                    : "Select source type first"}
                </option>
                {sourceOptions.map((item) => (
                  <option
                    key={getExperienceSourceItemId(item)}
                    value={getExperienceSourceItemId(item)}
                  >
                    {getSourceOptionLabel(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="isWide">
              <span>Description</span>
              <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Short public description" rows={4} />
            </label>
          </div>

          <div className="adminExperienceActions">
            <AdminButton variant="primary" type="submit" loading={saving}>
              {editingEventId ? "Update Event" : "Create Event"}
            </AdminButton>
            <AdminButton variant="secondary" type="button" onClick={resetForm}>
              {editingEventId ? "Cancel Edit" : "Reset"}
            </AdminButton>
            <AdminButton variant="secondary" type="button" loading={loading} onClick={loadEvents}>
              Refresh
            </AdminButton>
          </div>
        </form>

        <aside className="adminExperienceGuideCard">
          <span>PUBLIC DISPLAY RULE</span>
          <h3>What appears on `/ctet-tet`?</h3>
          <ul>
            <li><strong>Live</strong> events appear first.</li>
            <li><strong>Featured</strong> events become spotlight cards.</li>
            <li><strong>Published/Scheduled</strong> events power upcoming rows.</li>
            <li><strong>Archived</strong> events stay hidden from public experience.</li>
          </ul>
        </aside>
      </div>

      <AdminSectionHeader
        eyebrow="EVENT RECORDS"
        title="Latest Experience Events"
        description="Filter, edit, archive, and review events before they power the student landing experience."
        rightSlot={<AdminStatusPill status="info" label={loading ? "Loading" : String(filteredEvents.length)} />}
      />

      <div className="adminExperienceFilterPanel">
        <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search title, subject, mentor, plan..." />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_FILTERS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          {TYPE_FILTERS.map((type) => (
            <option key={type} value={type}>
              {type === "ALL" ? "ALL TYPES" : getExperienceEventTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      {filteredEvents.length ? (
        <div className="adminExperienceEventGrid">
          {filteredEvents.map((event) => (
            <article className="adminExperienceEventCard" key={event.id || event.title}>
              <div className="adminExperienceEventTop">
                <AdminStatusPill status={event.status} label={event.status} />
                {event.featured ? <AdminStatusPill status="approved" label="Featured" /> : null}
              </div>

              <h3>{event.title || "Untitled event"}</h3>
              <p>{event.description || "No description added."}</p>

              <div className="adminExperienceMetaGrid">
                <div><span>Type</span><strong>{event.typeLabel}</strong></div>
                <div><span>Plan</span><strong>{event.planType || "FREE"}</strong></div>
                <div><span>Subject</span><strong>{event.subject || "-"}</strong></div>
                <div><span>Priority</span><strong>{event.priority || 0}</strong></div>
                <div><span>Start</span><strong>{formatDateTime(event.startAt)}</strong></div>
                <div><span>CTA</span><strong>{event.cta?.label || event.ctaLabel || "-"}</strong></div>
                <div><span>CTA Type</span><strong>{event.cta?.type || event.ctaType || "-"}</strong></div>
                <div><span>Linked Source</span><strong>{event.sourceId ? `${event.sourceType} • ${event.sourceId}` : "Manual event"}</strong></div>
                <div><span>Media</span><strong>{event.thumbnail ? "Thumbnail ready" : "-"}</strong></div>
              </div>

              <div className="adminExperienceCardActions">
                <AdminButton variant="secondary" size="sm" type="button" onClick={() => startEdit(event)}>
                  Edit
                </AdminButton>
                {event.status !== EXPERIENCE_EVENT_STATUS.ARCHIVED ? (
                  <AdminButton variant="secondary" size="sm" type="button" onClick={() => handleArchive(event)}>
                    Archive
                  </AdminButton>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          eyebrow="No experience events"
          title="Create your first event"
          description="Live class announcements, mega mock schedules, doubt sessions, and marathons will appear here."
          actionLabel="Refresh"
          onAction={loadEvents}
          icon="✨"
        />
      )}
    </section>
  );
}

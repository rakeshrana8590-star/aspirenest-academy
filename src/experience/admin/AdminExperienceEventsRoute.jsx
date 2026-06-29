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
  EXPERIENCE_EVENT_STATUS,
  EXPERIENCE_EVENT_TYPES,
} from "../experienceConstants";
import {
  createExperienceEvent,
  listExperienceEvents,
} from "../experienceEventService";
import {
  getExperienceEventTypeLabel,
  normalizeExperienceEvent,
} from "../experienceEventUtils";

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
  ctaLabel: "",
  ctaUrl: "",
  priority: 0,
  featured: false,
};

const toDateTimeLocalValue = (value = "") => {
  if (!value) return "";
  return String(value).trim();
};

export default function AdminExperienceEventsRoute() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const normalizedEvents = useMemo(
    () => events.map((event) => normalizeExperienceEvent(event.raw || event)),
    [events]
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
    setSuccessMessage("");
    setRouteError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setRouteError("Event title is required.");
      return;
    }

    setSaving(true);
    setRouteError("");
    setSuccessMessage("");

    try {
      await createExperienceEvent({
        ...form,
        title,
        description: form.description.trim(),
        subject: form.subject.trim(),
        chapter: form.chapter.trim(),
        mentorName: form.mentorName.trim(),
        planType: form.planType.trim() || "FREE",
        startAt: toDateTimeLocalValue(form.startAt),
        endAt: toDateTimeLocalValue(form.endAt),
        ctaLabel: form.ctaLabel.trim(),
        ctaUrl: form.ctaUrl.trim(),
        priority: Number(form.priority || 0),
        featured: Boolean(form.featured),
      });

      setSuccessMessage("Experience event created.");
      setForm(DEFAULT_FORM);
      await loadEvents();
    } catch (error) {
      setRouteError(error?.message || "Experience event create failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="coursePages">
      <AdminSectionHeader
        eyebrow="EXPERIENCE STUDIO"
        title="Experience Events"
        description="Create public event records for live classes, mock tests, marathons, workshops, doubt sessions, and announcements without touching the existing video classroom system."
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
        <div className="adminSuccessBox">
          <strong>{successMessage}</strong>
        </div>
      ) : null}

      <form className="adminFilterBar" onSubmit={handleSubmit}>
        <label>
          <span>Title</span>
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Example: CTET Mega Mock Sunday"
          />
        </label>

        <label>
          <span>Type</span>
          <select
            value={form.type}
            onChange={(event) => updateField("type", event.target.value)}
          >
            {Object.values(EXPERIENCE_EVENT_TYPES).map((type) => (
              <option value={type} key={type}>
                {getExperienceEventTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
          >
            {Object.values(EXPERIENCE_EVENT_STATUS).map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Plan</span>
          <select
            value={form.planType}
            onChange={(event) => updateField("planType", event.target.value)}
          >
            <option value="FREE">FREE</option>
            <option value="BASIC">BASIC</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="MENTORSHIP">MENTORSHIP</option>
          </select>
        </label>

        <label>
          <span>Subject</span>
          <input
            value={form.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            placeholder="CDP / Maths / EVS"
          />
        </label>

        <label>
          <span>Chapter</span>
          <input
            value={form.chapter}
            onChange={(event) => updateField("chapter", event.target.value)}
            placeholder="Optional chapter"
          />
        </label>

        <label>
          <span>Mentor</span>
          <input
            value={form.mentorName}
            onChange={(event) => updateField("mentorName", event.target.value)}
            placeholder="Dr. Varsha D. Maru"
          />
        </label>

        <label>
          <span>Start</span>
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => updateField("startAt", event.target.value)}
          />
        </label>

        <label>
          <span>End</span>
          <input
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => updateField("endAt", event.target.value)}
          />
        </label>

        <label>
          <span>CTA Label</span>
          <input
            value={form.ctaLabel}
            onChange={(event) => updateField("ctaLabel", event.target.value)}
            placeholder="Join Live / Start Mock"
          />
        </label>

        <label>
          <span>CTA URL</span>
          <input
            value={form.ctaUrl}
            onChange={(event) => updateField("ctaUrl", event.target.value)}
            placeholder="/ctet-tet/videos or full link"
          />
        </label>

        <label>
          <span>Priority</span>
          <input
            type="number"
            value={form.priority}
            onChange={(event) => updateField("priority", event.target.value)}
          />
        </label>

        <label>
          <span>Featured</span>
          <select
            value={form.featured ? "yes" : "no"}
            onChange={(event) => updateField("featured", event.target.value === "yes")}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        <label>
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short public description"
            rows={3}
          />
        </label>

        <div className="adminFilterActions">
          <AdminButton variant="primary" type="submit" loading={saving}>
            Create Event
          </AdminButton>
          <AdminButton variant="secondary" onClick={resetForm}>
            Reset
          </AdminButton>
          <AdminButton variant="secondary" loading={loading} onClick={loadEvents}>
            Refresh
          </AdminButton>
        </div>
      </form>

      <AdminSectionHeader
        eyebrow="EVENT RECORDS"
        title="Latest Experience Events"
        description="These records will later power the CTET/TET live ribbon, countdown, AspireNest TV, weekly schedule, and What’s New sections."
        rightSlot={<AdminStatusPill status="info" label={loading ? "Loading" : String(normalizedEvents.length)} />}
      />

      {normalizedEvents.length ? (
        <div className="adminReviewGrid">
          {normalizedEvents.map((event) => (
            <article className="adminReviewCard" key={event.id || event.title}>
              <div className="adminReviewCardTop">
                <AdminStatusPill status={event.status} label={event.status} />
                {event.featured ? <AdminStatusPill status="approved" label="Featured" /> : null}
              </div>

              <h3>{event.title || "Untitled event"}</h3>
              <p>{event.description || "No description added."}</p>

              <div className="adminReviewMetaGrid">
                <div><span>Type</span><strong>{event.typeLabel}</strong></div>
                <div><span>Plan</span><strong>{event.planType || "FREE"}</strong></div>
                <div><span>Subject</span><strong>{event.subject || "-"}</strong></div>
                <div><span>Priority</span><strong>{event.priority || 0}</strong></div>
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

import React from "react";
import { useNavigate } from "react-router-dom";

const MONTH_OPTIONS = [
  "June",
  "May",
  "April",
  "March",
  "February",
  "January",
];

const WEEK_OPTIONS = [
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
  "Monthly Revision",
  "Yearly Compilation",
];

function AdminCaFormField({ label, hint, children }) {
  return (
    <label className="adminCaFormField">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export default function AdminCurrentAffairsAddRoute({
  editingCmsId,
  cmsTitle,
  setCmsTitle,
  cmsMonth,
  setCmsMonth,
  cmsDuration,
  setCmsDuration,
  cmsChapter,
  setCmsChapter,
  cmsPlanType,
  setCmsPlanType,
  cmsFileUrl,
  setCmsFileUrl,
  cmsStatus,
  setCmsStatus,
  handleSaveCurrentAffairsContent,
  planTypes = {
    FREE: "FREE",
    BASIC: "BASIC",
    PREMIUM: "PREMIUM",
    MENTORSHIP: "MENTORSHIP",
  },
  contentStatus = {
    PUBLISHED: "published",
    DRAFT: "draft",
    UNPUBLISHED: "unpublished",
  },
}) {
  const navigate = useNavigate();

  const isEditMode = Boolean(editingCmsId);
  const hasPdfUrl = Boolean(String(cmsFileUrl || "").trim());

  return (
    <section className="coursePages">
      <div className="adminCaFormPage">
        <div className="adminCaFormHero">
          <div className="adminCaFormHeroCopy">
            <span className="adminCaFormBadge">
              {isEditMode ? "EDIT CURRENT AFFAIR" : "ADD CURRENT AFFAIR"}
            </span>

            <h1>
              {isEditMode ? "Edit Current Affair PDF" : "Add Current Affair PDF"}
            </h1>

            <p>
              Add CTET/TET current affairs by month, week, plan, PDF source,
              and publish status with a clean student-visible publishing flow.
            </p>

            <div className="adminCaFormHeroActions">
              <button
                type="button"
                className="adminCaFormGhost"
                onClick={() => navigate("/admin/content/current-affairs/manage")}
              >
                Manage PDFs
              </button>

              <button
                type="button"
                className="adminCaFormGhost"
                onClick={() => navigate("/admin/content/current-affairs")}
              >
                ← Command Center
              </button>
            </div>
          </div>

          <div className="adminCaFormPreviewCard">
            <span>Publishing Preview</span>

            <h3>{cmsTitle || "Current Affair PDF Title"}</h3>

            <div className="adminCaFormPreviewMeta">
              <strong>{cmsMonth || "Month"} {cmsDuration || "Year"}</strong>
              <strong>{cmsChapter || "Week / Type"}</strong>
              <strong>{cmsPlanType || "Plan"}</strong>
              <strong>{cmsStatus || "Status"}</strong>
            </div>

            <div className={hasPdfUrl ? "adminCaFormPdfHealth live" : "adminCaFormPdfHealth"}>
              <b>{hasPdfUrl ? "PDF source ready" : "PDF source missing"}</b>
              <small>
                {hasPdfUrl
                  ? "Students can access after publish rules pass."
                  : "Paste a valid PDF URL before publishing."}
              </small>
            </div>
          </div>
        </div>

        <div className="adminCaFormShell">
          <div className="adminCaFormHeader">
            <div>
              <span>PDF Details</span>
              <h2>Current affairs setup</h2>
            </div>

            <strong>{isEditMode ? "Update Mode" : "Create Mode"}</strong>
          </div>

          <div className="adminCaFormGrid">
            <AdminCaFormField
              label="Title"
              hint="Example: June 2026 Weekly Capsule"
            >
              <input
                type="text"
                placeholder="Title e.g. June 2026 Weekly Capsule"
                value={cmsTitle}
                onChange={(event) => setCmsTitle(event.target.value)}
              />
            </AdminCaFormField>

            <AdminCaFormField label="Month" hint="Student shelf month">
              <select
                value={cmsMonth}
                onChange={(event) => setCmsMonth(event.target.value)}
              >
                <option value="">Select Month</option>
                {MONTH_OPTIONS.map((month) => (
                  <option value={month} key={month}>
                    {month}
                  </option>
                ))}
              </select>
            </AdminCaFormField>

            <AdminCaFormField label="Year" hint="Example: 2026">
              <input
                type="text"
                placeholder="Year e.g. 2026"
                value={cmsDuration}
                onChange={(event) => setCmsDuration(event.target.value)}
              />
            </AdminCaFormField>

            <AdminCaFormField label="Week / Type" hint="Week or revision group">
              <select
                value={cmsChapter}
                onChange={(event) => setCmsChapter(event.target.value)}
              >
                <option value="">Select Week / Type</option>
                {WEEK_OPTIONS.map((week) => (
                  <option value={week} key={week}>
                    {week}
                  </option>
                ))}
              </select>
            </AdminCaFormField>

            <AdminCaFormField label="Plan Access" hint="Student access shelf">
              <select
                value={cmsPlanType}
                onChange={(event) => setCmsPlanType(event.target.value)}
              >
                <option value={planTypes.FREE}>FREE</option>
                <option value={planTypes.BASIC}>BASIC</option>
                <option value={planTypes.PREMIUM}>PREMIUM</option>
                <option value={planTypes.MENTORSHIP}>MENTORSHIP</option>
              </select>
            </AdminCaFormField>

            <AdminCaFormField label="Publish Status" hint="Student visibility">
              <select
                value={cmsStatus}
                onChange={(event) => setCmsStatus(event.target.value)}
              >
                <option value={contentStatus.PUBLISHED}>published</option>
                <option value={contentStatus.DRAFT}>draft</option>
                <option value={contentStatus.UNPUBLISHED}>unpublished</option>
              </select>
            </AdminCaFormField>

            <AdminCaFormField
              label="PDF URL"
              hint="Google Drive, Firebase Storage, or direct PDF URL"
            >
              <input
                type="text"
                placeholder="PDF URL"
                value={cmsFileUrl}
                onChange={(event) => setCmsFileUrl(event.target.value)}
              />
            </AdminCaFormField>
          </div>

          <div className="adminCaFormActions">
            <button
              type="button"
              className="adminCaFormPrimary"
              onClick={handleSaveCurrentAffairsContent}
            >
              {isEditMode ? "Update Current Affair" : "Publish Current Affair"}
            </button>

            <button
              type="button"
              className="adminCaFormGhostLight"
              disabled={!hasPdfUrl}
              onClick={() => window.open(cmsFileUrl, "_blank")}
            >
              Preview PDF
            </button>

            <button
              type="button"
              className="adminCaFormGhostLight"
              onClick={() => navigate("/admin/content/current-affairs")}
            >
              ← Back to Current Affairs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
import React from "react";
import { useNavigate } from "react-router-dom";

import AdminCurrentAffairsHero from "./AdminCurrentAffairsHero";

import {
  buildCurrentAffairsMonthList,
  getCurrentAffairsItems,
  getCurrentAffairsPdfCount,
  getCurrentAffairsPdfUrl,
  getPublishedCurrentAffairs,
} from "../shared/currentAffairsUtils";

function getAdminCaPlan(item = {}) {
  return String(item.planType || item.plan || item.accessPlan || "FREE")
    .trim()
    .toUpperCase();
}

function getAdminCaStatus(item = {}) {
  return String(item.status || item.publishStatus || item.currentStatus || "")
    .trim()
    .toLowerCase();
}

export default function AdminCurrentAffairsHomeRoute({
  universalCurrentAffairs = [],
  currentAffairsList = [],

  // Safety aliases: preserve reference code compatibility
  universalContent = [],
  currentAffairs = [],
}) {
  const navigate = useNavigate();

  const sourceUniversal =
    Array.isArray(universalCurrentAffairs) && universalCurrentAffairs.length > 0
      ? universalCurrentAffairs
      : universalContent;

  const sourceLegacy =
    Array.isArray(currentAffairsList) && currentAffairsList.length > 0
      ? currentAffairsList
      : currentAffairs;

  const caItems = getCurrentAffairsItems(sourceUniversal, sourceLegacy);

  const publishedItems = getPublishedCurrentAffairs(
    sourceUniversal,
    sourceLegacy
  );

  const monthShelves = buildCurrentAffairsMonthList(caItems);
  const pdfReadyCount = getCurrentAffairsPdfCount(caItems);

  const planCount = new Set(caItems.map((item) => getAdminCaPlan(item))).size;

  const draftCount = caItems.filter(
    (item) => getAdminCaStatus(item) !== "published"
  ).length;

  const missingPdfCount = caItems.filter(
    (item) => !getCurrentAffairsPdfUrl(item)
  ).length;

  const heroStats = [
    {
      label: "Admin PDFs",
      value: caItems.length,
    },
    {
      label: "Plans",
      value: planCount,
    },
    {
      label: "Student Visible",
      value: publishedItems.length,
    },
  ];

  const workflowCards = [
    {
      icon: "✦",
      label: "Builder",
      title: "Add Current Affair",
      text:
        "Create CTET/TET current affairs with month, week, plan, PDF URL, status, and publishing settings.",
      route: "/admin/content/current-affairs/add",
    },
    {
      icon: "▣",
      label: "Manager",
      title: "Manage PDFs",
      text:
        "Edit, preview, publish, unpublish, archive, and control every saved current affairs PDF.",
      route: "/admin/content/current-affairs/manage",
    },
    {
      icon: "◇",
      label: "Structure",
      title: "Month Library",
      text:
        "Review current affairs by month and keep Month → Week → PDF flow clean for students.",
      route: "/admin/content/current-affairs/months",
    },
    {
      icon: "✓",
      label: "Student Visible",
      title: "Published PDFs",
      text:
        "Audit all current affairs currently visible to students across free and paid plans.",
      route: "/admin/content/current-affairs/published",
    },
  ];

  const quickLinks = [
    {
      title: "Months",
      text: `${monthShelves.length} active months`,
      route: "/admin/content/current-affairs/months",
    },
    {
      title: "Manage PDFs",
      text: `${caItems.length} saved items`,
      route: "/admin/content/current-affairs/manage",
    },
    {
      title: "Published PDFs",
      text: `${publishedItems.length} student-visible`,
      route: "/admin/content/current-affairs/published",
    },
    {
      title: "Draft Queue",
      text: `${draftCount} pending review`,
      route: "/admin/content/current-affairs/manage",
    },
    {
      title: "Missing PDF",
      text: `${missingPdfCount} need source check`,
      route: "/admin/content/current-affairs/manage",
    },
    {
      title: "PDF Health",
      text: `${pdfReadyCount} ready sources`,
      route: "/admin/content/current-affairs/manage",
    },
    {
      title: "Add Current Affair",
      text: "Create new PDF",
      route: "/admin/content/current-affairs/add",
    },
    {
      title: "Content Studio",
      text: "Back to main studio",
      route: "/admin/content",
    },
  ];

  return (
    <section className="coursePages">
      <div className="adminCaPage">
        <AdminCurrentAffairsHero
          stats={heroStats}
          onAdd={() => navigate("/admin/content/current-affairs/add")}
          onManage={() => navigate("/admin/content/current-affairs/manage")}
        />

        <section className="adminCaWorkflowShell">
          <div className="adminCaWorkflowMain">
            <div className="adminCaWorkflowHeader">
              <span>Admin CA System</span>

              <h2>Core CA workflow</h2>

              <p>
                Most-used current affairs actions stay above the fold. Create,
                manage, audit months, and keep student-visible PDFs clean.
              </p>
            </div>

            <div className="adminCaWorkflowGrid">
              {workflowCards.map((card) => (
                <button
                  type="button"
                  className="adminCaWorkflowCard"
                  key={card.title}
                  onClick={() => navigate(card.route)}
                >
                  <div className="adminCaWorkflowTop">
                    <span className="adminCaWorkflowIcon">{card.icon}</span>
                    <span className="adminCaWorkflowArrow">→</span>
                  </div>

                  <span className="adminCaWorkflowLabel">{card.label}</span>

                  <h3>{card.title}</h3>

                  <p>{card.text}</p>
                </button>
              ))}
            </div>
          </div>

          <aside className="adminCaQuickRail">
            <span>Quick Access</span>

            <h3>Months • Plans • PDFs</h3>

            <div className="adminCaQuickStack">
              {quickLinks.map((link) => (
                <button
                  type="button"
                  className="adminCaQuickLink"
                  key={link.title}
                  onClick={() => navigate(link.route)}
                >
                  <span>
                    <strong>{link.title}</strong>
                    <span>{link.text}</span>
                  </span>

                  <i>→</i>
                </button>
              ))}
            </div>
          </aside>
        </section>

        <div className="adminCaBackRow">
          <button type="button" onClick={() => navigate("/admin/content")}>
            ← Back to Content Studio
          </button>
        </div>
      </div>
    </section>
  );
}
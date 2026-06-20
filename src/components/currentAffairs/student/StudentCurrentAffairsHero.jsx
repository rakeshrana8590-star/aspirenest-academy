import React from "react";

export default function StudentCurrentAffairsHero({
  badge = "CTET / TET Current Affairs",
  title = "Current Affairs Library",
  text = "Month-wise current affairs PDFs with weekly grouping and plan access.",
  stats = [],
  backLabel,
  onBack,
  primaryLabel = "Start Reading →",
  secondaryLabel = "PDF Library",
  onPrimary,
  onSecondary,
}) {
  const heroStats = [
    ...stats,
    {
      label: "Material",
      value: "PDF",
    },
  ].slice(0, 4);

  const scrollToLibrary = () => {
    const shelf = document.querySelector(".studentCaShelf");

    if (shelf) {
      shelf.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handlePrimary = () => {
    if (typeof onPrimary === "function") {
      onPrimary();
      return;
    }

    scrollToLibrary();
  };

  const handleSecondary = () => {
    if (typeof onSecondary === "function") {
      onSecondary();
      return;
    }

    scrollToLibrary();
  };

  return (
    <div className="studentCaHero">
      <div className="studentCaHeroCopy">
        <div className="studentCaHeroTopActions">
          {backLabel && typeof onBack === "function" && (
            <button
              type="button"
              className="studentCaBackBtn"
              onClick={onBack}
            >
              ← {backLabel}
            </button>
          )}

          <span className="studentCaBadge">{badge}</span>
        </div>

        <h1>{title}</h1>

        <p>{text}</p>

        <div className="studentCaHeroActions">
          <button
            type="button"
            className="studentCaPrimaryBtn"
            onClick={handlePrimary}
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            className="studentCaGhostBtn"
            onClick={handleSecondary}
          >
            {secondaryLabel}
          </button>
        </div>

        <div className="studentCaTrustRow">
          <span>Month-wise</span>
          <span>Weekly PDFs</span>
          <span>Plan protected</span>
          <span>Exam focused</span>
        </div>
      </div>

      <div className="studentCaSystemCard">
        <div className="studentCaSystemTop">
          <span>Now Reading</span>
          <strong>AspireNest CA</strong>
        </div>

        <div className="studentCaSystemFeature">
          <div className="studentCaSystemIcon">📰</div>

          <div>
            <strong>{title}</strong>
            <span>{badge}</span>
          </div>
        </div>

        <div className="studentCaSystemGrid">
          {heroStats.map((item) => (
            <div key={`${item.label}-${item.value}`}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="studentCaFlow">
          <span>Month</span>
          <i />
          <span>Week</span>
          <i />
          <span>PDF</span>
        </div>
      </div>
    </div>
  );
}
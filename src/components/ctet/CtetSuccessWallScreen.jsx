import React, { useMemo } from "react";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function maskSuccessName(entry = {}) {
  const raw = String(entry.studentName || entry.studentEmail || entry.email || "AspireNest Learner").trim();

  if (raw.includes("@")) {
    const [name = "student"] = raw.split("@");
    return `${name.slice(0, 2)}***`;
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  if (!parts.length) return "AspireNest Learner";
  if (parts.length === 1) return parts[0].length > 8 ? `${parts[0].slice(0, 6)}…` : parts[0];

  return `${parts[0]} ${parts[1][0] || ""}.`.trim();
}

function getScore(entry = {}) {
  return toNumber(entry.percentage || entry.accuracy || entry.rankScore || 0);
}

export default function CtetSuccessWallScreen({
  mockLeaderboardEntries = [],
  navigate,
}) {
  const topProofs = useMemo(() => {
    return [...(Array.isArray(mockLeaderboardEntries) ? mockLeaderboardEntries : [])]
      .filter((entry) => getScore(entry) > 0)
      .sort((a, b) => getScore(b) - getScore(a) || toNumber(b.score) - toNumber(a.score))
      .slice(0, 3)
      .map((entry, index) => ({
        id: entry.id || entry.leaderboardKey || `proof-${index}`,
        rank: index + 1,
        name: maskSuccessName(entry),
        score: getScore(entry),
        testTitle: entry.testTitle || entry.subject || "Mock Test",
        plan: entry.planType || "FREE",
      }));
  }, [mockLeaderboardEntries]);

  const bestScore = topProofs[0]?.score || 0;

  return (
    <section className="ctetS5SuccessWallScreen" id="success-wall" aria-label="AspireNest success wall">
      <div className="ctetS5SuccessShell">
        <div className="ctetS5SuccessHero">
          <div>
            <span className="ctetS5SuccessEyebrow">VERIFIED SUCCESS WALL</span>
            <h2>
              Proof of Progress.
              <span>Stories of Trust.</span>
            </h2>
            <p>
              Leaderboard-backed performance, approved testimonials, and verified outcomes from AspireNest learners.
            </p>
          </div>

          <div className="ctetS5SuccessScoreCard">
            <span>Best leaderboard score</span>
            <strong>{bestScore ? `${bestScore}%` : "Pending"}</strong>
            <small>{topProofs.length ? "From verified mock performance" : "Will appear after real student activity"}</small>
          </div>
        </div>

        <div className="ctetS5SuccessGrid">
          <article className="ctetS5SuccessPanel isFeatured">
            <div className="ctetS5SuccessPanelHead">
              <span>PERFORMANCE PROOF</span>
              <strong>Leaderboard-backed ranks</strong>
            </div>

            {topProofs.length ? (
              <div className="ctetS5SuccessProofList">
                {topProofs.map((proof) => (
                  <button
                    type="button"
                    key={proof.id}
                    className="ctetS5SuccessProofRow"
                    onClick={() => navigate?.("/leaderboard")}
                  >
                    <b>#{proof.rank}</b>
                    <div>
                      <strong>{proof.name}</strong>
                      <span>{proof.testTitle} • {proof.plan}</span>
                    </div>
                    <em>{proof.score}%</em>
                  </button>
                ))}
              </div>
            ) : (
              <div className="ctetS5SuccessEmpty">
                <b>No verified success proof yet</b>
                <span>Real rank proof will appear after leaderboard-enabled mock submissions.</span>
              </div>
            )}
          </article>

          <article className="ctetS5SuccessPanel">
            <div className="ctetS5SuccessPanelHead">
              <span>APPROVED STORIES</span>
              <strong>Student testimonials</strong>
            </div>
            <p>
              Student stories will appear only after approval and consent, with privacy-safe display.
            </p>
            <button type="button" onClick={() => navigate?.("/ctet-tet/mock-tests")}>
              Build Your Proof ›
            </button>
          </article>

          <article className="ctetS5SuccessPanel">
            <div className="ctetS5SuccessPanelHead">
              <span>OUTCOME PROOF</span>
              <strong>Verified selections</strong>
            </div>
            <p>
              Selection and result stories will be published only after verification, keeping the wall credible and clean.
            </p>
            <button type="button" onClick={() => navigate?.("/ctet-tet/courses")}>
              Continue Preparation ›
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}

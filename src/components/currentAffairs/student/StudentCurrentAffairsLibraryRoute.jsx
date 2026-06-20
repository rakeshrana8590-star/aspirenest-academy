import React from "react";
import { useNavigate } from "react-router-dom";

import StudentCurrentAffairsHero from "./StudentCurrentAffairsHero";
import StudentCurrentAffairsEmptyState from "./StudentCurrentAffairsEmptyState";
import { StudentCurrentAffairsMonthCard } from "./StudentCurrentAffairsCards";

import {
  buildCurrentAffairsMonthList,
  createCurrentAffairsSlug,
  getCurrentAffairsPdfCount,
  getPublishedCurrentAffairs,
} from "../shared/currentAffairsUtils";

export default function StudentCurrentAffairsLibraryRoute({
  universalContent = [],
  currentAffairsList = [],
}) {
  const navigate = useNavigate();

  const publishedCurrentAffairs = getPublishedCurrentAffairs(
    universalContent,
    currentAffairsList
  );

  const months = buildCurrentAffairsMonthList(publishedCurrentAffairs);

  const planCount = new Set(
    publishedCurrentAffairs.map((item) => item.planType || "FREE")
  ).size;

  return (
    <section className="studentCaPage">
      <StudentCurrentAffairsHero
        stats={[
          {
            label: "Months",
            value: months.length,
          },
          {
            label: "PDFs",
            value: getCurrentAffairsPdfCount(publishedCurrentAffairs),
          },
          {
            label: "Plans",
            value: planCount,
          },
        ]}
      />

      <div className="studentCaShelf">
        <div className="studentCaShelfHeader">
          <div>
            <span>Current Affairs Library</span>

            <h2>Choose a month</h2>

            <p>
              Open month-wise CTET/TET current affairs and continue into weekly
              PDF revision.
            </p>
          </div>

          <div className="studentCaShelfStatus">
            <strong>{months.length}</strong>
            <span>Months</span>
          </div>
        </div>

        {months.length === 0 ? (
          <StudentCurrentAffairsEmptyState />
        ) : (
          <div className="studentCaMonthGrid">
            {months.map((month) => (
              <StudentCurrentAffairsMonthCard
                key={month.id}
                month={month}
                onOpen={() =>
                  navigate(
                    `/ctet-tet/current-affairs/${createCurrentAffairsSlug(
                      month.title
                    )}`
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
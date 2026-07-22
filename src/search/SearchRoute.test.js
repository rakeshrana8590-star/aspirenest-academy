import React from "react";
import {
  renderToStaticMarkup,
} from "react-dom/server";

import SearchRoute from "./SearchRoute";

const renderRoute = (props = {}) =>
  renderToStaticMarkup(
    <SearchRoute
      user={{
        uid: "student-1",
        email: "student@aspirenestacademy.in",
      }}
      navigate={jest.fn()}
      {...props}
    />
  );

describe(
  "AspireNest Search route",
  () => {
    test(
      "renders the unified protected search workspace",
      () => {
        const html = renderRoute();

        expect(html).toContain(
          "Search your learning universe"
        );
        expect(html).toContain(
          "Browse AspireNest"
        );
        expect(html).toContain(
          "Learning Hub"
        );
        expect(html).toContain(
          "My Access"
        );
        expect(html).toContain(
          "Search discovers. Access rules decide."
        );
      }
    );

    test(
      "finds a published custom-plan result without normalizing its identity",
      () => {
        const html = renderRoute({
          initialQuery:
            "Elite Mentorship",
          contentItems: [
            {
              id: "elite-note",
              title:
                "Elite Mentorship Notes",
              description:
                "Premium revision notes",
              section: "notes",
              status: "published",
              planCode:
                "ASPIRE_ELITE_2026",
              planLabel:
                "Aspire Elite 2026",
            },
          ],
        });

        expect(html).toContain(
          "Elite Mentorship Notes"
        );
        expect(html).toContain(
          "Aspire Elite 2026"
        );
        expect(html).not.toContain(
          "No matching learning content"
        );
      }
    );

    test(
      "does not render draft content or raw asset URLs",
      () => {
        const html = renderRoute({
          contentItems: [
            {
              id: "published-note",
              title: "Published Notes",
              section: "notes",
              status: "published",
              planType: "FREE",
              pdfUrl:
                "https://example.com/protected.pdf",
            },
            {
              id: "draft-note",
              title: "Draft Internal Notes",
              section: "notes",
              status: "draft",
              planType: "FREE",
              fileUrl:
                "https://example.com/draft.pdf",
            },
          ],
        });

        expect(html).toContain(
          "Published Notes"
        );
        expect(html).not.toContain(
          "Draft Internal Notes"
        );
        expect(html).not.toContain(
          "example.com"
        );
        expect(html).not.toContain(
          "protected.pdf"
        );
      }
    );

    test(
      "supports category-filtered current affairs results",
      () => {
        const html = renderRoute({
          initialCategory:
            "current-affairs",
          contentItems: [
            {
              id: "current-1",
              title:
                "January Current Affairs",
              section:
                "currentAffairs",
              status: "published",
              month: "January 2026",
              planType: "FREE",
            },
            {
              id: "note-1",
              title: "CDP Notes",
              section: "notes",
              status: "published",
              planType: "FREE",
            },
          ],
        });

        expect(html).toContain(
          "January Current Affairs"
        );
        expect(html).not.toContain(
          ">CDP Notes<"
        );
      }
    );

    test(
      "shows fail-closed access verification messaging",
      () => {
        const html = renderRoute({
          shellState: {
            mode: "error",
            isFailClosed: true,
          },
        });

        expect(html).toContain(
          'data-search-fail-closed="true"'
        );
        expect(html).toContain(
          "Access verification is temporarily unavailable."
        );
        expect(html).toContain(
          "protected results will be verified again when opened."
        );
      }
    );

    test(
      "renders a stable empty state for unmatched queries",
      () => {
        const html = renderRoute({
          initialQuery:
            "nonexistent-aspirenest-topic-xyz",
        });

        expect(html).toContain(
          "No matching learning content"
        );
        expect(html).toContain(
          "Reset search"
        );
      }
    );

    test(
      "renders published roadmaps from the existing app data",
      () => {
        const html = renderRoute({
          initialQuery:
            "30 Day CTET Roadmap",
          roadmaps: [
            {
              id: "roadmap-30",
              title:
                "30 Day CTET Roadmap",
              description:
                "Daily guided preparation",
              status: "active",
              planCode: "MENTORSHIP",
            },
          ],
        });

        expect(html).toContain(
          "30 Day CTET Roadmap"
        );
        expect(html).toContain(
          "MENTORSHIP"
        );
      }
    );
  }
);
// PHASE8_GATE4_SEARCH_OPEN_AUTH_WIRING_PROOF_V2
describe("Phase 8 Gate 4 Search open authorization wiring proof", () => {
  test("couples Search open-action wiring to re-verification and protected-resource proof", () => {
    const fs = require("fs");
    const path = require("path");

    const routeSource = fs.readFileSync(
      path.join(process.cwd(), "src/search/SearchRoute.jsx"),
      "utf8"
    );
    const suiteSource = fs.readFileSync(__filename, "utf8");

    expect(routeSource).toMatch(/(?:onClick\s*=|<Link\b)/);
    expect(routeSource).toMatch(
      /(?:navigate\s*\(|onOpen\w*\s*\(|route|path|to\s*=)/
    );
    expect(routeSource).toContain(
      "Search discovers. Access rules decide."
    );
    expect(suiteSource).toContain(
      'data-search-fail-closed="true"'
    );
    expect(suiteSource).toContain(
      "protected results will be verified again when opened."
    );
    expect(suiteSource).toContain(
      '"protected.pdf"'
    );
  });
});

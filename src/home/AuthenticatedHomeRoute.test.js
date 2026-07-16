import React from "react";
import {
  renderToStaticMarkup,
} from "react-dom/server";

import AuthenticatedHomeRoute from "./AuthenticatedHomeRoute";

const renderHome = (props = {}) =>
  renderToStaticMarkup(
    <AuthenticatedHomeRoute
      user={{
        uid: "student-1",
        email:
          "student@aspirenestacademy.in",
        displayName: "Rakesh",
      }}
      shellState={{
        mode: "active",
        isAuthenticated: true,
        isAdminUser: false,
        isFailClosed: false,
        accountRoleLabel: "Student",
        accessLabel: "Premium Access",
      }}
      myAccess={{
        canShowAccessDetails: true,
        primaryPlan: {
          planCode:
            "ASPIRE_ELITE_2026",
          label:
            "Aspire Elite 2026",
          accessRank: 640,
          noExpiry: true,
          isCustomPlan: true,
        },
        summary: {
          active: 4,
          module: 2,
        },
      }}
      navigate={jest.fn()}
      {...props}
    />
  );

describe(
  "AspireNest authenticated Home route",
  () => {
    test(
      "renders the personalized root Home presentation",
      () => {
        const html = renderHome();

        expect(html).toContain(
          "Welcome back"
        );
        expect(html).toContain("Rakesh");
        expect(html).toContain(
          "Aspire Elite 2026"
        );
        expect(html).toContain(
          "Start Learning"
        );
        expect(html).toContain(
          "Practice &amp; Growth"
        );
        expect(html).toContain(
          "Your Workspace"
        );
      }
    );

    test(
      "renders latest mock as the real existing resume source",
      () => {
        const html = renderHome({
          mockResults: [
            {
              id: "mock-1",
              testTitle:
                "Latest CDP Mock",
              percentage: 84,
              completedAt:
                "2026-07-16T09:00:00Z",
            },
          ],
        });

        expect(html).toContain(
          "Latest CDP Mock"
        );
        expect(html).toContain("84%");
        expect(html).toContain(
          "Source: mock result"
        );
      }
    );

    test(
      "renders a newer safe cross-module activity when supplied",
      () => {
        const html = renderHome({
          mockResults: [
            {
              id: "mock-old",
              testTitle: "Older Mock",
              percentage: 60,
              completedAt:
                "2026-07-14T09:00:00Z",
            },
          ],
          recentActivity: [
            {
              id: "note-latest",
              title:
                "Learning Theories Notes",
              description:
                "Continue Chapter 2",
              route:
                "/ctet-tet/notes/plan/BASIC/cdp/learning-theories",
              module: "notes",
              status: "in-progress",
              progressPercent: 45,
              updatedAt:
                "2026-07-16T09:00:00Z",
            },
          ],
        });

        expect(html).toContain(
          "Learning Theories Notes"
        );
        expect(html).toContain("45%");
        expect(html).toContain(
          "Source: learning activity"
        );
      }
    );

    test.each([
      ["loading", "Checking access"],
      ["error", "Access unavailable"],
    ])(
      "%s mode fails closed and hides the custom plan",
      (mode, expectedLabel) => {
        const html = renderHome({
          shellState: {
            mode,
            isAuthenticated: true,
            isAdminUser: false,
            isFailClosed: true,
            accountRoleLabel: "Student",
            accessLabel:
              expectedLabel,
          },
          mockResults: [
            {
              id: "hidden-mock",
              testTitle:
                "Hidden Premium Mock",
              percentage: 99,
              completedAt:
                "2026-07-16T09:00:00Z",
            },
          ],
        });

        expect(html).toContain(
          'data-home-fail-closed="true"'
        );
        expect(html).toContain(
          "Access verification is temporarily unavailable."
        );
        expect(html).not.toContain(
          "Aspire Elite 2026"
        );
        expect(html).not.toContain(
          "Hidden Premium Mock"
        );
      }
    );

    test.each([
      "blocked",
      "expired",
    ])(
      "%s access shows My Access recovery",
      (mode) => {
        const html = renderHome({
          shellState: {
            mode,
            isAuthenticated: true,
            isAdminUser: false,
            isFailClosed: false,
            accountRoleLabel: "Student",
            accessLabel:
              "Access review required",
          },
        });

        expect(html).toContain(
          "Access review required"
        );
        expect(html).toContain(
          "Open My Access"
        );
      }
    );

    test(
      "does not render raw file, PDF, or video URLs",
      () => {
        const html = renderHome({
          contentItems: [
            {
              id: "protected-note",
              title: "Protected Note",
              section: "notes",
              status: "published",
              planType: "PREMIUM",
              fileUrl:
                "https://assets.invalid/file.pdf",
              pdfUrl:
                "https://assets.invalid/secret.pdf",
              videoUrl:
                "https://assets.invalid/video",
            },
          ],
        });

        expect(html).not.toContain(
          "assets.invalid"
        );
        expect(html).not.toContain(
          "secret.pdf"
        );
      }
    );

    test(
      "admin workspace remains role gated",
      () => {
        const adminHtml = renderHome({
          shellState: {
            mode: "admin",
            isAuthenticated: true,
            isAdminUser: true,
            isFailClosed: false,
            accountRoleLabel: "Admin",
            accessLabel: "Admin Access",
          },
        });
        const studentHtml = renderHome();

        expect(adminHtml).toContain(
          'data-home-destination="admin"'
        );
        expect(studentHtml).not.toContain(
          'data-home-destination="admin"'
        );
      }
    );
  }
);

import React from "react";
import {
  renderToStaticMarkup,
} from "react-dom/server";
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

import MyAccessRoute from "./MyAccessRoute";

const renderRoute = ({
  user = {
    uid: "student-1",
    email: "student@example.com",
  },
  myAccess = {},
} = {}) =>
  renderToStaticMarkup(
    <MyAccessRoute
      user={user}
      myAccess={myAccess}
    />
  );

describe(
  "AspireNest My Access route",
  () => {
    test(
      "renders a custom dynamic plan and all supported access scopes",
      () => {
        const html = renderRoute({
          myAccess: {
            mode: "active",
            roleLabel: "Student",
            accessLabel:
              "Aspire Elite 2026",
            canShowAccessDetails: true,
            isFailClosed: false,
            isVerificationUnavailable: false,
            primaryPlan: {
              planCode:
                "ASPIRE_ELITE_2026",
              label:
                "Aspire Elite 2026",
              accessRank: 640,
              isCustomPlan: true,
              noExpiry: true,
            },
            summary: {
              total: 4,
              active: 4,
              pending: 0,
              expired: 0,
              blocked: 0,
              plan: 1,
              module: 1,
              bundle: 1,
              item: 1,
            },
            sections: [
              {
                id: "plan",
                title: "Plans",
                items: [
                  {
                    id: "plan-1",
                    scopeType: "plan",
                    scopeLabel:
                      "Plan Access",
                    title:
                      "Aspire Elite 2026",
                    status: "active",
                    planLabel:
                      "Aspire Elite 2026",
                    noExpiry: true,
                    validityLabel:
                      "No expiry",
                  },
                ],
              },
              {
                id: "module",
                title: "Modules",
                items: [
                  {
                    id: "module-1",
                    scopeType: "module",
                    scopeLabel:
                      "Module Access",
                    title: "Notes",
                    status: "active",
                    moduleLabel: "Notes",
                    planLabel:
                      "Aspire Elite 2026",
                    noExpiry: true,
                    validityLabel:
                      "No expiry",
                  },
                ],
              },
              {
                id: "bundle",
                title: "Bundles",
                items: [
                  {
                    id: "bundle-1",
                    scopeType: "bundle",
                    scopeLabel:
                      "Bundle Access",
                    title:
                      "Revision Bundle",
                    status: "active",
                    moduleLabel:
                      "Mock Tests",
                    planLabel:
                      "Aspire Elite 2026",
                    noExpiry: true,
                    validityLabel:
                      "No expiry",
                  },
                ],
              },
              {
                id: "item",
                title:
                  "Individual Items",
                items: [
                  {
                    id: "item-1",
                    scopeType: "item",
                    scopeLabel:
                      "Item Access",
                    title:
                      "CDP Practice Set",
                    status: "active",
                    moduleLabel:
                      "Mock Tests",
                    planLabel:
                      "Aspire Elite 2026",
                    noExpiry: true,
                    validityLabel:
                      "No expiry",
                  },
                ],
              },
            ],
            actions: [
              {
                id: "learning-hub",
                label:
                  "Open Learning Hub",
                route: "/ctet-tet",
              },
            ],
            emptyState: "",
          },
        });

        expect(html).toContain(
          "Aspire Elite 2026"
        );
        expect(html).toContain(
          "ASPIRE_ELITE_2026"
        );
        expect(html).toContain("Modules");
        expect(html).toContain("Bundles");
        expect(html).toContain(
          "Individual Items"
        );
        expect(html).toContain(
          "CDP Practice Set"
        );
      }
    );

    test(
      "loading and error states fail closed and hide record details",
      () => {
        const html = renderRoute({
          myAccess: {
            mode: "loading",
            roleLabel: "Student",
            accessLabel:
              "Checking access",
            canShowAccessDetails: false,
            isFailClosed: true,
            isVerificationUnavailable: true,
            primaryPlan: {
              label:
                "Must Not Render",
            },
            summary: {
              total: 0,
            },
            sections: [
              {
                id: "plan",
                title: "Plans",
                items: [
                  {
                    id: "hidden-record",
                    title:
                      "Hidden Paid Record",
                  },
                ],
              },
            ],
            actions: [],
          },
        });

        expect(html).toContain(
          'data-access-fail-closed="true"'
        );
        expect(html).toContain(
          "Access verification is temporarily unavailable."
        );
        expect(html).not.toContain(
          "Must Not Render"
        );
        expect(html).not.toContain(
          "Hidden Paid Record"
        );
      }
    );

    test(
      "external action routes are not rendered",
      () => {
        const html = renderRoute({
          myAccess: {
            mode: "free",
            roleLabel: "Student",
            accessLabel: "Free Access",
            canShowAccessDetails: true,
            isFailClosed: false,
            isVerificationUnavailable: false,
            summary: {
              total: 0,
            },
            sections: [],
            actions: [
              {
                id: "unsafe",
                label:
                  "External Action",
                route:
                  "https://example.com",
              },
              {
                id: "safe",
                label:
                  "Open Learning Hub",
                route: "/ctet-tet",
              },
            ],
            emptyState:
              "No paid or partial access is active yet.",
          },
        });

        expect(html).not.toContain(
          "External Action"
        );
        expect(html).toContain(
          "Open Learning Hub"
        );
      }
    );

    test(
      "empty access state keeps recovery actions visible",
      () => {
        const html = renderRoute({
          myAccess: {
            mode: "free",
            roleLabel: "Student",
            accessLabel: "Free Access",
            canShowAccessDetails: true,
            isFailClosed: false,
            isVerificationUnavailable: false,
            summary: {
              total: 0,
            },
            sections: [],
            actions: [
              {
                id: "redeem-access",
                label:
                  "Redeem Access Key",
                route:
                  "/ctet-tet/redeem",
              },
              {
                id: "pricing",
                label: "View Plans",
                route:
                  "/ctet-tet/pricing",
              },
            ],
            emptyState:
              "No paid or partial access is active yet.",
          },
        });

        expect(html).toContain(
          "No access records to display"
        );
        expect(html).toContain(
          "Redeem Access Key"
        );
        expect(html).toContain(
          "View Plans"
        );
      }
    );
  }
);

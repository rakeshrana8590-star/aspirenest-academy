import React from "react";
import {
  renderToStaticMarkup,
} from "react-dom/server";

const mockNavigate = jest.fn();
let mockParams = {
  testId: "mock-premium-1",
};

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

import ExamStartRoute from "./ExamStartRoute.jsx";

const USER = Object.freeze({
  uid: "student-1",
  email:
    "student@aspirenestacademy.in",
});

const TEST = Object.freeze({
  id: "mock-premium-1",
  section: "mockTest",
  status: "published",
  title: "Premium CDP Mock",
  planType: "PREMIUM",
  subject: "CDP",
  chapter: "Assessment",
  questions: [
    {
      question:
        "Protected question text",
      answer: "A",
    },
  ],
  durationMinutes: 30,
  totalMarks: 10,
  marksPerQuestion: 1,
  negativeMarks: 0,
});

const profile = (
  records = [],
  overrides = {}
) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  isBlocked: false,
  accessRecords: records,
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
  ...overrides,
});

const itemRecord = (
  itemId = TEST.id
) => ({
  id: "item-access",
  status: "active",
  scopeType: "item",
  module: "mockTest",
  itemType: "mockTest",
  itemId,
  planType: "FREE",
});

const renderRoute = (
  overrides = {}
) =>
  renderToStaticMarkup(
    <ExamStartRoute
      universalContent={[TEST]}
      getMockTestScheduleStatus={() =>
        "AVAILABLE"
      }
      getMockTestRules={() => ({
        allowPause: "yes",
        navigationMode: "free",
        calculatorAllowed: "no",
      })}
      setMockAttemptState={jest.fn()}
      mockResults={[]}
      user={USER}
      accessProfile={profile([
        itemRecord(),
      ])}
      {...overrides}
    />
  );

describe(
  "AspireNest Exam Start central authorization wiring",
  () => {
    beforeEach(() => {
      mockNavigate.mockClear();
      mockParams = {
        testId: TEST.id,
      };
      localStorage.clear();
    });

    test(
      "direct start URL renders the premium start page for exact ITEM access",
      () => {
        const html = renderRoute();

        expect(html).toContain(
          'data-exam-start-access-state="ready"'
        );
        expect(html).toContain(
          'data-exam-start-source-scope="item"'
        );
        expect(html).toContain(
          "Premium CDP Mock"
        );
        expect(html).toContain(
          "Begin Test"
        );
      }
    );

    test(
      "sibling ITEM access fails closed before reading local attempt storage",
      () => {
        const getItemSpy = jest.spyOn(
          Storage.prototype,
          "getItem"
        );

        const html = renderRoute({
          accessProfile: profile([
            itemRecord(
              "mock-premium-sibling"
            ),
          ]),
        });

        expect(html).toContain(
          'data-exam-start-access-state="locked"'
        );
        expect(html).toContain(
          "View Pricing"
        );
        expect(getItemSpy).not.toHaveBeenCalled();

        getItemSpy.mockRestore();
      }
    );

    test(
      "blocked access routes to My Access and never renders protected start details",
      () => {
        const html = renderRoute({
          accessProfile: profile([], {
            isBlocked: true,
            shellState: {
              mode: "blocked",
              isFailClosed: true,
            },
          }),
        });

        expect(html).toContain(
          'data-exam-start-access-state="blocked"'
        );
        expect(html).toContain(
          "Review My Access"
        );
        expect(html).not.toContain(
          "Exam Overview"
        );
      }
    );

    test(
      "loading access remains fail closed",
      () => {
        const html = renderRoute({
          accessProfile: profile([], {
            loading: true,
            shellState: {
              mode: "loading",
              isFailClosed: true,
            },
          }),
        });

        expect(html).toContain(
          'data-exam-start-access-state="loading"'
        );
        expect(html).not.toContain(
          "Begin Test"
        );
      }
    );

    test(
      "legacy schedule presentation remains preserved after central OPEN authorization",
      () => {
        const html = renderRoute({
          getMockTestScheduleStatus: () =>
            "UPCOMING",
        });

        expect(html).toContain(
          "Upcoming"
        );
        expect(html).toContain(
          "scheduled for"
        );
        expect(html).not.toContain(
          "Begin Test"
        );
      }
    );

    test(
      "legacy getMockTestAccessStatus prop is no longer required",
      () => {
        expect(() =>
          renderRoute()
        ).not.toThrow();
      }
    );

    test(
      "missing test fails closed without local storage access",
      () => {
        mockParams = {
          testId: "missing-test",
        };
        const getItemSpy = jest.spyOn(
          Storage.prototype,
          "getItem"
        );

        const html = renderRoute();

        expect(html).toContain(
          'data-exam-start-access-state="not_found"'
        );
        expect(html).toContain(
          "Test not found"
        );
        expect(getItemSpy).not.toHaveBeenCalled();

        getItemSpy.mockRestore();
      }
    );
  }
);

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useSearchParams: () => [
    new URLSearchParams(),
    jest.fn(),
  ],
}));

import {
  StudentMockTestLibraryRoute,
} from "./StudentMockTestRoutes.jsx";

const USER = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
});

const CONTENT = Object.freeze([
  {
    id: "mock-free",
    section: "mockTest",
    status: "published",
    title: "Free CDP Sample",
    planType: "FREE",
    subject: "CDP",
    chapter: "Learning",
    totalQuestions: 10,
    durationMinutes: 15,
    totalMarks: 10,
    questions: [
      {
        question: "Protected free question",
        answer: "A",
      },
    ],
  },
  {
    id: "mock-premium",
    section: "mockTest",
    status: "published",
    title: "Premium CDP Mega Mock",
    planType: "PREMIUM",
    subject: "CDP",
    chapter: "Assessment",
    totalQuestions: 100,
    durationMinutes: 120,
    totalMarks: 100,
    questions: [
      {
        question: "Protected premium question",
        answer: "B",
        explanation: "Protected explanation",
      },
    ],
    fileUrl: "https://assets.invalid/mock.pdf",
  },
  {
    id: "mock-custom",
    section: "mockTest",
    status: "published",
    title: "Crash 45 Final Mock",
    planCode: "CTET_CRASH_45",
    planTitle: "CTET Crash 45",
    accessRank: 150,
    subject: "Language",
    chapter: "Final Revision",
    totalQuestions: 50,
    durationMinutes: 60,
    totalMarks: 50,
  },
]);

const activeProfile = (records = []) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  isBlocked: false,
  accessRecords: records,
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
});

const renderLibrary = (overrides = {}) =>
  renderToStaticMarkup(
    <StudentMockTestLibraryRoute
      universalContent={CONTENT}
      user={USER}
      accessProfile={activeProfile([
        {
          id: "item-access",
          status: "active",
          scopeType: "item",
          module: "mockTest",
          itemType: "mockTest",
          itemId: "mock-premium",
          planType: "FREE",
        },
      ])}
      {...overrides}
    />
  );

describe(
  "AspireNest student Mock Test discovery wiring",
  () => {
    beforeEach(() => {
      mockNavigate.mockClear();
    });

    test(
      "renders centralized entitlement-aware discovery at the root route",
      () => {
        const html = renderLibrary();

        expect(html).toContain(
          'data-mock-discovery-state="ready"'
        );
        expect(html).toContain(
          'data-mock-test-id="mock-premium"'
        );
        expect(html).toContain(
          'data-mock-access-state="allow"'
        );
        expect(html).toContain(
          'data-mock-test-id="mock-custom"'
        );
        expect(html).toContain(
          'data-mock-access-state="locked_preview"'
        );
      }
    );

    test(
      "supports dynamic custom plan filters without fixed plan routes",
      () => {
        const html = renderLibrary();

        expect(html).toContain(
          "CTET_CRASH_45"
        );
        expect(html).toContain(
          "CTET Crash 45"
        );
        expect(html).not.toContain(
          "/ctet-tet/mock-tests/plan/"
        );
      }
    );

    test(
      "catalog markup never contains protected questions, answers, explanations, or raw asset URLs",
      () => {
        const html = renderLibrary();

        expect(html).not.toContain(
          "Protected free question"
        );
        expect(html).not.toContain(
          "Protected premium question"
        );
        expect(html).not.toContain(
          "Protected explanation"
        );
        expect(html).not.toContain(
          "assets.invalid"
        );
        expect(html).not.toContain(
          '"answer"'
        );
      }
    );

    test(
      "loading access fails closed without rendering test cards",
      () => {
        const html = renderLibrary({
          accessProfile: {
            loading: true,
            error: null,
            accessRecords: [],
            shellState: {
              mode: "loading",
              isFailClosed: true,
            },
          },
        });

        expect(html).toContain(
          'data-mock-discovery-state="loading"'
        );
        expect(html).toContain(
          'data-mock-discovery-closed="true"'
        );
        expect(html).not.toContain(
          'data-mock-test-id='
        );
      }
    );

    test(
      "blocked access fails closed and exposes My Access recovery",
      () => {
        const html = renderLibrary({
          accessProfile: {
            loading: false,
            error: null,
            isBlocked: true,
            accessRecords: [],
            shellState: {
              mode: "blocked",
              isFailClosed: true,
            },
          },
        });

        expect(html).toContain(
          'data-mock-discovery-state="blocked"'
        );
        expect(html).toContain(
          "Review My Access"
        );
        expect(html).not.toContain(
          'data-mock-test-id='
        );
      }
    );

    test(
      "legacy engine route components are not invoked by catalog rendering",
      () => {
        const html = renderLibrary();

        expect(html).toContain(
          "Same premium exam engine"
        );
        expect(html).not.toContain(
          "aspireExamAttempt_"
        );
      }
    );
  }
);

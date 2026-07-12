import { auth, db } from "./firebase";
import { storage } from "./firebase";
import { QRCodeCanvas } from "qrcode.react";

import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";


import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup, } from "firebase/auth";

import {
  getVerifiedAuthSession, resendVerificationEmailAndLogout, syncVerifiedStudentAccountStatus, } from "./utils/authAccountService";

import {
  ACCESS_ITEM_TYPES, ACCESS_MODULE, } from "./access/accessConstants";
import {
  canAccessContent, } from "./access/accessUtils";
import useAccessProfile from "./access/useAccessProfile";
import { grantPaymentAccess } from "./access/accessService";
import {
  getProtectedContentUrl, readProtectedContentAsset, saveProtectedContentAsset, } from "./protectedContentAssetsService";
import { upsertLearnerLoginSnapshot } from "./profile/learnerProfileService";

import {
  LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
const AuthSection = React.lazy(() => import("./components/AuthSection.jsx"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel.jsx"));
const StudentDashboard = React.lazy(() => import("./components/StudentDashboard.jsx"));

const NotesCMS = React.lazy(() => import("./components/NotesCMS.jsx"));
const CurrentAffairs = React.lazy(() => import("./components/CurrentAffairs.jsx"));
const Pricing = React.lazy(() => import("./components/Pricing.jsx"));
const Announcements = React.lazy(() => import("./components/Announcements.jsx"));
import {
  collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, updateDoc, } from "firebase/firestore";
import {
  ref, uploadBytes, getDownloadURL, } from "firebase/storage";
import React, { useState, useEffect } from 'react';



import {
  Routes, Route, Link, useNavigate, useLocation, Navigate, } from "react-router-dom";
import AspireNestLogo from "./components/AspireNestLogo.jsx";
import AcademyOverviewRoute from "./components/public/AcademyOverviewRoute.jsx";
import AuthRoute from "./components/public/AuthRoute";


import AppDashboard from "./components/AppDashboard.jsx";
import CtetLiveContentCenter from "./components/ctet/CtetLiveContentCenter.jsx";
import CtetMentorPresenceBand from "./components/ctet/CtetMentorPresenceBand.jsx";
import CtetSuccessWallScreen from "./components/ctet/CtetSuccessWallScreen.jsx";
import CtetSupportFooterScreen from "./components/ctet/CtetSupportFooterScreen.jsx";
import CtetPricingMentorGuidance from "./components/ctet/CtetPricingMentorGuidance.jsx";
import CtetPremiumHeader from "./components/ctet/CtetPremiumHeader.jsx";
import {
  StudentRoadmapHub, StudentRoadmapDetail, StudentRoadmapDay, MyAspirePath, } from "./components/roadmaps/StudentRoadmaps.jsx";

import {
  RoadmapStudioHome, RoadmapImportRoute, RoadmapEditRoute, RoadmapManageRoute, RoadmapScheduleRoute, RoadmapProgressRoute, RoadmapResourcesRoute, } from "./components/roadmaps/RoadmapStudio.jsx";
import { loadPublishedStudyRoadmaps } from "./services/roadmapService";

import VideoManagerHome from "./components/video/VideoManagerHome.jsx";
import VideoClassFormRoute from "./components/video/VideoClassFormRoute.jsx";
import VideoLibraryManageRoute from "./components/video/VideoLibraryManageRoute.jsx";
import VideoPublishedRoute from "./components/video/VideoPublishedRoute.jsx";
import VideoSubjectsRoute from "./components/video/VideoSubjectsRoute.jsx";

import VideoChaptersRoute from "./components/video/VideoChaptersRoute.jsx";
import VideoChapterClassesRoute from "./components/video/VideoChapterClassesRoute.jsx";
import StudentVideoHub from "./components/video/StudentVideoHub.jsx";
import StudentVideoPlanRoute from "./components/video/StudentVideoPlanRoute.jsx";
import StudentVideoSubjectRoute from "./components/video/StudentVideoSubjectRoute.jsx";
import StudentVideoChapterRoute from "./components/video/StudentVideoChapterRoute.jsx";
import StudentClassroomGuardRoute from "./components/video/StudentClassroomGuardRoute.jsx";

import ExamAttemptRoute from "./components/exam/ExamAttemptRoute.jsx";
import ExamResultRoute from "./components/exam/ExamResultRoute.jsx";
import ExamReviewRoute from "./components/exam/ExamReviewRoute.jsx";
import ExamStartRoute from "./components/exam/ExamStartRoute.jsx";

import {
  StudentMockTestLibraryRoute, StudentMockTestPlanRoute, StudentMockTestSubjectRoute, StudentMockTestChapterRoute, StudentMockTestHistoryRoute, StudentMockLeaderboardRoute, } from "./components/exam/StudentMockTestRoutes.jsx";

import {
  StudentNotesLibraryRoute, StudentNotesPlanRoute, StudentNotesSubjectRoute, StudentNotesChapterRoute, } from "./components/notes/student/index.js";

import {
  AdminNotesHomeRoute, AdminNotesPlanRoute, AdminNotesSubjectRoute, AdminNotesChapterRoute, AdminNotesManageRoute, } from "./components/notes/admin/index.js";

import {
  StudentCurrentAffairsLibraryRoute, StudentCurrentAffairsMonthRoute, } from "./components/currentAffairs/student/index.js";
import { AdminCurrentAffairsHomeRoute } from "./components/currentAffairs/admin/index.js";
import AdminCurrentAffairsManageRoute from "./components/currentAffairs/admin/AdminCurrentAffairsManageRoute";
import AdminCurrentAffairsAddRoute from "./components/currentAffairs/admin/AdminCurrentAffairsAddRoute";

import AdminMockTestHomeRoute from "./components/exam/AdminMockTestHomeRoute.jsx";
import AdminMockTestAddRoute from "./components/exam/AdminMockTestAddRoute.jsx";
import AdminMockTestManageRoute from "./components/exam/AdminMockTestManageRoute.jsx";
import AdminMockTestQuestionBankRoute from "./components/exam/AdminMockTestQuestionBankRoute.jsx";
import AdminMockTestQuestionBankSubjectRoute from "./components/exam/AdminMockTestQuestionBankSubjectRoute.jsx";
import AdminMockTestQuestionBankChapterRoute from "./components/exam/AdminMockTestQuestionBankChapterRoute.jsx";
import AdminMockTestSeriesRoute from "./components/exam/AdminMockTestSeriesRoute.jsx";
import AdminMockTestSeriesDetailRoute from "./components/exam/AdminMockTestSeriesDetailRoute.jsx";
import AdminMockTestResultsRoute from "./components/exam/AdminMockTestResultsRoute.jsx";
import AdminMockTestLeaderboardRoute from "./components/exam/AdminMockTestLeaderboardRoute.jsx";
import AdminMockTestAnalyticsRoute from "./components/exam/AdminMockTestAnalyticsRoute.jsx";
import AdminMockTestPreviewRoute from "./components/exam/AdminMockTestPreviewRoute.jsx";
import AdminMockTestPlanRoute from "./components/exam/AdminMockTestPlanRoute.jsx";
import AdminMockTestPlanSubjectRoute from "./components/exam/AdminMockTestPlanSubjectRoute.jsx";
import AdminMockTestPlanChapterRoute from "./components/exam/AdminMockTestPlanChapterRoute.jsx";
import AdminMockTestSubjectsRoute from "./components/exam/AdminMockTestSubjectsRoute.jsx";
import AdminMockTestSubjectRoute from "./components/exam/AdminMockTestSubjectRoute.jsx";
import AdminMockTestChapterRoute from "./components/exam/AdminMockTestChapterRoute.jsx";
import AdminMockTestChaptersRoute from "./components/exam/AdminMockTestChaptersRoute.jsx";
import AdminMockTestChapterDetailRoute from "./components/exam/AdminMockTestChapterDetailRoute.jsx";
import AdminMockTestPublishedRoute from "./components/exam/AdminMockTestPublishedRoute.jsx";
import AdminAccessHomeRoute from "./access/admin/AdminAccessHomeRoute.jsx";
import AdminAccessAddRoute from "./access/admin/AdminAccessAddRoute.jsx";
import AdminAccessManageRoute from "./access/admin/AdminAccessManageRoute.jsx";
import AdminAccessBulkRoute from "./access/admin/AdminAccessBulkRoute.jsx";
import AdminAccessInvitesRoute from "./access/admin/AdminAccessInvitesRoute.jsx";
import AdminAccessProfileRoute from "./access/admin/AdminAccessProfileRoute.jsx";
import AdminAccessAuditRoute from "./access/admin/AdminAccessAuditRoute.jsx";
import AdminPaymentVerificationRoute from "./payments/admin/AdminPaymentVerificationRoute.jsx";
import AdminExperienceEventsRoute from "./experience/admin/AdminExperienceEventsRoute.jsx";
import StudentRedeemAccessRoute from "./access/StudentRedeemAccessRoute.jsx";
import AdminAccessProductsRoute from "./access/admin/AdminAccessProductsRoute.jsx";
import AdminAccessKeysRoute from "./access/admin/AdminAccessKeysRoute.jsx";
import StudentLearnerProfileRoute from "./profile/StudentLearnerProfileRoute.jsx";
import StudentAccessInviteRoute from "./access/student/StudentAccessInviteRoute.jsx";

import MockTestActionMenu from "./components/exam/MockTestActionMenu.jsx";
import { deleteMockTest } from "./components/exam/mockTestAdminActions.js";



import {
  createEmptyMockQuestion, createDefaultMockTestForm, buildMockTestFormFromTest, buildMockTestQuestionsFormFromTest, } from "./components/exam/mockTestFormUtils.js";

import { useExamAttemptState } from "./components/exam/useExamAttemptState.js";
import { useExamTimer } from "./components/exam/useExamTimer.js";
import { useExamSecurity } from "./components/exam/useExamSecurity.js";
import { useMockTestActionMenu } from "./components/exam/useMockTestActionMenu.js";
import useExperienceEvents from "./experience/useExperienceEvents.js";
import {
  getExperienceEventPresentation,
} from "./experience/experienceEventPresentation.js";
import {
  downloadMockTestXlsxTemplate, downloadMockTestCsvTemplate, } from "./components/exam/mockTestTemplateDownloads.js";
import {
  convertGoogleDriveUrlToDownloadUrl, importMockTestJsonAsDraft, buildMockTestImportPayloadFromRows, readMockTestWorkbookRowsFromArrayBuffer, } from "./components/exam/mockTestImportUtils.js";
import './style.css';
import "./styles/public/publicRoutes.css";
import { ExperienceRibbon, ExperienceCountdown, ExperienceCarousel, ExperienceCard, ExperienceTimeline, ExperienceSectionHeader, ExperienceHero, ExperienceMentorPanel, ExperienceFeatureShowcase, ExperienceResourceGrid, ExperienceFooterPanels, ExperienceFooter } from "./components/shared/experience";
import "./styles/shared/experienceSystem.css";
import "./styles/exam/examHeader.css";
import "./styles/exam/questionWorkspace.css";
import "./styles/exam/actionBar.css";
import "./styles/exam/palettePanel.css";
import "./styles/exam/warningCard.css";
import "./styles/exam/submitCard.css";
import "./styles/exam/reviewResult.css";
import "./styles/exam/examStart.css";
import "./styles/exam/studentMockTests.css";

import "./styles/notes/studentNotes.css";
import "./styles/currentAffairs/studentCurrentAffairs.css";
import "./styles/currentAffairs/adminCurrentAffairs.css";

import "./styles/notes/adminNotes.css";

import "./styles/exam/adminMockTests.css";
import "./styles/exam/examLayoutLock.css";

import "./styles/video/videoManager.css";
import "./styles/video/videoForm.css";
import "./styles/video/videoLibrary.css";
import "./styles/video/studentClassroom.css";
import "./styles/video/videoCards.css";
import "./styles/video/videoManagerHome.css";
import "./styles/video/videoManageLibrary.css";
import "./styles/video/videoClassBuilder.css";
import "./styles/video/studentVideoHub.css";
import "./styles/video/studentVideoShelves.css";
import "./styles/video/videoLiveStates.css";
import "./styles/shared/mobileNoScrollbar.css";

import {
  CONTENT_SECTIONS,
  CONTENT_STATUS,
  PLAN_TYPES,
  SOURCE_TYPES,
  CONTENT_TYPES,
} from "./contentSystem";

import {
  addContentItem,
  updateContentItem,
  deleteContentItem,
  unpublishContentItem,
  archiveContentItem,
} from "./contentService";


export default function App() {

  const location = useLocation();
  const navigate = useNavigate();
  const ctetExperienceEnabled = location.pathname === "/ctet-tet";
  const isExamAttemptPage = location.pathname.includes(
    "/ctet-tet/mock-tests/attempt/"
  );

  const {
    events: ctetExperienceEvents,
    upcomingEvents: ctetUpcomingExperienceEvents,
    featuredEvent: ctetFeaturedExperienceEvent,
    loading: ctetExperienceLoading,
  } = useExperienceEvents({
    enabled: !isExamAttemptPage,
    maxCount: 10,
  });

  const [ctetNotificationRoadmaps, setCtetNotificationRoadmaps] = useState([]);

  useEffect(() => {
    let active = true;

    loadPublishedStudyRoadmaps()
      .then((items) => {
        if (active) {
          setCtetNotificationRoadmaps(Array.isArray(items) ? items : []);
        }
      })
      .catch((error) => {
        console.error("Notification roadmaps load failed:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const ctetFeaturedEventPresentation =
    ctetFeaturedExperienceEvent
      ? getExperienceEventPresentation(
          ctetFeaturedExperienceEvent
        )
      : null;

  const ctetFeaturedExperienceScheduleAt =
    ctetFeaturedEventPresentation?.timing
      ?.scheduleAt || null;

  const ctetFeaturedExperienceCountdownAt =
    ctetFeaturedEventPresentation?.timing
      ?.countdownAt || null;

  const ctetFeaturedExperienceScheduleLabel =
    ctetFeaturedEventPresentation?.timing
      ?.scheduleLabel || "Schedule";

  const ctetFeaturedExperienceDateLabel =
    ctetFeaturedExperienceScheduleAt
      ? ctetFeaturedExperienceScheduleAt
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
      : "Schedule soon";

  const ctetFeaturedExperienceTimeLabel =
    ctetFeaturedExperienceScheduleAt
      ? ctetFeaturedExperienceScheduleAt
          .toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })
      : "Time to be announced";

  const openCtetExperienceTarget = (
    targetUrl,
    fallbackUrl = "/ctet-tet"
  ) => {
    const safeTarget = String(
      targetUrl || fallbackUrl
    ).trim();

    if (/^https?:\/\//i.test(safeTarget)) {
      window.open(
        safeTarget,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    navigate(safeTarget || fallbackUrl);
  };

  React.useEffect(() => {
    document.body.classList.toggle(
      "aspireExamAttemptMode",
      isExamAttemptPage
    );

    return () => {
      document.body.classList.remove("aspireExamAttemptMode");
    };
  }, [isExamAttemptPage]);
  const [notesScrollState, setNotesScrollState] = React.useState({});

  const updateNotesScrollState = (rowId) => {
    const row = document.getElementById(rowId);
    if (!row) return;

    const atStart = row.scrollLeft <= 5;
    const atEnd =
      row.scrollLeft + row.clientWidth >= row.scrollWidth - 5;

    setNotesScrollState((prev) => ({
      ...prev,
      [rowId]: {
        atStart,
        atEnd,
        canScroll: row.scrollWidth > row.clientWidth + 5,
      },
    }));
  };

  const scrollShelf = (rowId, direction) => {
    const row = document.getElementById(rowId);
    if (!row) return;

    row.scrollBy({
      left: direction === "right" ? 520 : -520,
      behavior: "smooth",
    });

    setTimeout(() => updateNotesScrollState(rowId), 350);
  };

  React.useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  React.useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.key, location.pathname]);
  const [darkMode, setDarkMode] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedNotesSubject, setSelectedNotesSubject] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [ctetMobileScreen, setCtetMobileScreen] = useState("home");
  const [currentQuestion, setCurrentQuestion] = useState(0);
const [selectedAnswer, setSelectedAnswer] = useState("");
const [score, setScore] = useState(0);
const [showResult, setShowResult] = useState(false);
const [showAnswer, setShowAnswer] = useState(false);
const [timeLeft, setTimeLeft] = useState(60);

const [showMentorProfile, setShowMentorProfile] = useState(false);
const [showProfile, setShowProfile] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [fullName, setFullName] = useState("");

const [mobile, setMobile] = useState("");
const [contactEmail, setContactEmail] = useState("");
  const [user, setUser] = useState(null);
  const [universalContent, setUniversalContent] = useState([]);
  const [notesCmsTitle, setNotesCmsTitle] = useState("");
const [notesCmsDescription, setNotesCmsDescription] = useState("");
const [notesCmsPlanType, setNotesCmsPlanType] = useState("FREE");
const [notesCmsSubject, setNotesCmsSubject] = useState("");
const [notesCmsChapter, setNotesCmsChapter] = useState("");
const [notesCmsMonth, setNotesCmsMonth] = useState("");
const [notesCmsYear, setNotesCmsYear] = useState("");
const [notesCmsWeek, setNotesCmsWeek] = useState("");
const [notesCmsPdfUrl, setNotesCmsPdfUrl] = useState("");
const [notesCmsThumbnailUrl, setNotesCmsThumbnailUrl] = useState("");
const [notesCmsStatus, setNotesCmsStatus] = useState("Draft");
const [notesPlanFilter, setNotesPlanFilter] = useState("ALL");
const [notesSubjectName, setNotesSubjectName] =
  useState("");

const [notesSubjectCode, setNotesSubjectCode] =
  useState("");

const [notesSubjectSlug, setNotesSubjectSlug] =
  useState("");

const [notesSubjectOrder, setNotesSubjectOrder] =
  useState("");

const [notesSubjectStatus, setNotesSubjectStatus] =
  useState("Active");

  const [notesSubjectsList, setNotesSubjectsList] =
  useState([]);

  const [editingNotesSubjectId, setEditingNotesSubjectId] =
  useState(null);

  const [notesChapterSubjectId, setNotesChapterSubjectId] =
  useState("");

  const [notesChapterName, setNotesChapterName] =
  useState("");

const [notesChapterCode, setNotesChapterCode] =
  useState("");

const [notesChapterSlug, setNotesChapterSlug] =
  useState("");

const [notesChapterOrder, setNotesChapterOrder] =
  useState("");

const [notesChapterStatus, setNotesChapterStatus] =
  useState("Active");

const [notesChaptersList, setNotesChaptersList] =
  useState([]);

const [editingNotesChapterId, setEditingNotesChapterId] =
  useState(null);

  const filteredNotesChapters =
  notesChaptersList.filter(
    (chapter) =>
      chapter.subjectName === notesCmsSubject ||
      chapter.subjectId === notesCmsSubject
  );

const [editingNotesCmsId, setEditingNotesCmsId] = useState(null);
  const universalNotes = universalContent.filter(
    (item) =>
      item.section === CONTENT_SECTIONS.NOTES
  );

  const universalCurrentAffairs =
    universalContent.filter(
      (item) =>
        item.section ===
        CONTENT_SECTIONS.CURRENT_AFFAIRS
    );





    const activeMockPlan =
    decodeURIComponent(location.pathname.split("/")[4] || "FREE").toUpperCase();

  const activeMockSubjectId =
    decodeURIComponent(location.pathname.split("/")[5] || "");

  const activeMockChapterId =
    decodeURIComponent(location.pathname.split("/")[6] || "");











  const [paletteFilter, setPaletteFilter] = useState("all");
  const [submitConfirmTestId, setSubmitConfirmTestId] =
  useState(null);
  const [examFontScale, setExamFontScale] = useState(1);


    const {
      mockAttemptState,
      setMockAttemptState,
      updateAttemptState,
      goToAttemptQuestion,
      selectAttemptAnswer,
      clearAttemptResponse,
      markAttemptForReviewAndNext,
      saveAttemptAndNext,
      updateAttemptTimeLeft,
    } = useExamAttemptState(universalContent);

    useExamTimer({
      locationPathname: location.pathname,
      universalContent,
      setMockAttemptState,
      navigate,
    });

    useExamSecurity({
      locationPathname: location.pathname,
      universalContent,
      mockAttemptState,
      updateAttemptState,
    });


    const contentLoading = false;
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [userPlanType, setUserPlanType] = useState("FREE");
  const [membershipExpiry, setMembershipExpiry] = useState(null);
  const EMERGENCY_PREMIUM_EMAILS = new Set([
    "jamilanri786@gmail.com",
    "ansarineha340@gmail.com",
    "1990amala@gmail.com",
    "qureshihoor1986@gmail.com",
    "gratitude.pb@gmail.com",
    "yasmeen.shaikh@hkce.edu.in",
    "ruhiipatel.18@gmail.com",
    "dianapithawala@gmail.com",
  ]);

  const isEmergencyPremiumLearner = (email = "") =>
    EMERGENCY_PREMIUM_EMAILS.has(String(email || "").trim().toLowerCase());

  const accessProfile = useAccessProfile({
    user,
    profile: {
      email: user?.email,
      uid: user?.uid,
      isPremium: isPremiumUser,
      subscriptionType: userPlanType,
      membershipExpiry,
      expiryDate: membershipExpiry,
    },
    fallbackPlanType: userPlanType || "FREE",
    fallbackExpiry: membershipExpiry,
    enabled: Boolean(user),
  });

  const activeAccessPlan = accessProfile?.activePlan || userPlanType || "FREE";
  const activeAccessExpiry =
    accessProfile?.membershipExpiry || membershipExpiry || null;
  const requireLogin = () => Boolean(user);

  const requireAdmin = () => Boolean(user && isAdmin(user));

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = React.useRef(null);

  const accountDisplayName =
    user?.displayName ||
    user?.email?.split("@")?.[0] ||
    (user ? "AspireNest User" : "Guest");

  const accountEmail = user?.email || "";

  const openAccountTarget = (targetPath) => {
    setAccountMenuOpen(false);
    navigate(targetPath);
  };

  const logoutFromAccountMenu = async () => {
    setAccountMenuOpen(false);
    await handleLogout();
  };

  React.useEffect(() => {
    if (!accountMenuOpen) return;

    const handleAccountMenuOutside = (event) => {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    const handleAccountMenuEscape = (event) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleAccountMenuOutside);
    document.addEventListener("touchstart", handleAccountMenuOutside);
    document.addEventListener("keydown", handleAccountMenuEscape);

    return () => {
      document.removeEventListener("mousedown", handleAccountMenuOutside);
      document.removeEventListener("touchstart", handleAccountMenuOutside);
      document.removeEventListener("keydown", handleAccountMenuEscape);
    };
  }, [accountMenuOpen]);

  React.useEffect(() => {
    if (authLoading) return;

    const studentProtectedRoutes = new Set([
      "/student-dashboard",
      "/profile/setup",
      "/my-profile",
      "/my-courses",
      "/my-notes",
      "/my-tests",
      "/my-videos",
      "/payment",
      "/payment-history",
      "/leaderboard",
      "/ai-classroom",
      "/ctet-tet/redeem",
    ]);

    const isStudentProtectedRoute = studentProtectedRoutes.has(location.pathname);
    const isAdminRoute = location.pathname.startsWith("/admin");

    if (!user && (isStudentProtectedRoute || isAdminRoute)) {
      const returnToPath = `${location.pathname}${location.search || ""}`;
      navigate(`/login?returnTo=${encodeURIComponent(returnToPath)}`, { replace: true });
      return;
    }

    if (user && isAdminRoute && !isAdmin(user)) {
      navigate("/", { replace: true });
    }
  }, [authLoading, location.pathname, location.search, navigate, user]);

  const hasPlanAccess = (requiredPlan = "FREE", options = {}) => {
    const normalizedRequiredPlan = String(requiredPlan || "FREE").trim().toUpperCase();
    const accessOptions =
      options && typeof options === "object" && !Array.isArray(options)
        ? options
        : {};

    if (isAdmin(user)) {
      return true;
    }

    if (isEmergencyPremiumLearner(user?.email)) {
      return true;
    }

    if (accessProfile?.isBlocked) {
      return false;
    }

    if (normalizedRequiredPlan === "FREE") {
      return true;
    }

    if (accessProfile?.isExpired) {
      return false;
    }

    if (activeAccessExpiry && new Date(activeAccessExpiry) < new Date()) {
      return false;
    }

    if (
      typeof accessProfile?.hasAccess === "function" &&
      accessProfile.hasAccess(normalizedRequiredPlan, accessOptions)
    ) {
      return true;
    }

    return canAccessContent({
      requiredPlan: normalizedRequiredPlan,
      userPlan: activeAccessPlan || "FREE",
      accessRecord: accessProfile?.bestAccess || null,
      accessRecords: accessProfile?.accessRecords || [],
      module: accessOptions.module || "",
      itemType: accessOptions.itemType || "",
      itemId: accessOptions.itemId || "",
      emergencyAccess: Boolean(accessOptions.emergencyAccess),
      isAdmin: isAdmin(user),
    });
  };

  const parseMockScheduleDateTime = (
    dateValue = "",
    timeValue = "",
    fallbackTime = "00:00"
  ) => {
    const dateText = String(dateValue || "").trim();
    const timeText = String(timeValue || "").trim();

    if (!dateText) {
      return null;
    }

    const dateTimeText = dateText.includes("T")
      ? dateText
      : `${dateText}T${timeText || fallbackTime}`;

    const parsed = new Date(dateTimeText);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getMockTestScheduleStatus = (test) => {
    if (!test) {
      return "EXPIRED";
    }

    const hasScheduleWindow = Boolean(
      test.examStartDate ||
        test.examStartTime ||
        test.examEndDate ||
        test.examEndTime
    );

    if (!hasScheduleWindow) {
      return "AVAILABLE";
    }

    const now = new Date();

    const startDateTime = parseMockScheduleDateTime(
      test.examStartDate,
      test.examStartTime,
      "00:00"
    );

    const endDateTime = parseMockScheduleDateTime(
      test.examEndDate,
      test.examEndTime,
      "23:59"
    );

    if (startDateTime && now < startDateTime) {
      return "UPCOMING";
    }

    if (endDateTime && now > endDateTime) {
      return "EXPIRED";
    }

    return "AVAILABLE";
  };

  const getMockTestAccessStatus = (test) => {
    if (!test) {
      return "NOT_FOUND";
    }

    if (test.status !== "published") {
      return "UNPUBLISHED";
    }

    if (!user) {
      return "LOGIN_REQUIRED";
    }

    if (
      test.planType &&
      !hasPlanAccess(test.planType, {
        module: ACCESS_MODULE.MOCK_TEST,
        itemType: ACCESS_ITEM_TYPES.MOCK_TEST,
        itemId: test.id,
      })
    ) {
      return "PLAN_LOCKED";
    }

    if (membershipExpiry && new Date(membershipExpiry) < new Date()) {
      return "EXPIRED_MEMBERSHIP";
    }

    const scheduleStatus = getMockTestScheduleStatus(test);

    if (scheduleStatus === "UPCOMING") {
      return "UPCOMING";
    }

    if (scheduleStatus === "EXPIRED") {
      return "EXPIRED";
    }

    return "AVAILABLE";
  };

  const getMockTestRules = (test) => ({
    navigationMode: test?.navigationMode || "free",
    shuffleQuestions: test?.shuffleQuestions || "no",
    shuffleOptions: test?.shuffleOptions || "no",
    allowPause: test?.allowPause || "yes",
    calculatorAllowed: test?.calculatorAllowed || "no",
  });

  const shuffleMockArray = (items = []) => {
    const clonedItems = [...items];

    for (let index = clonedItems.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [clonedItems[index], clonedItems[randomIndex]] = [
        clonedItems[randomIndex],
        clonedItems[index],
      ];
    }

    return clonedItems;
  };

  const [activePlan, setActivePlan] = useState("FREE");
  const adminEmail = "aspirenestplatform@gmail.com";
  const isAdmin = (currentUser = user) =>
  currentUser?.email === adminEmail;
  const generateOrderId = () => {
    return "ASP-" + Date.now();
  };
  const [students, setStudents] = useState([]);
const [enquiries, setEnquiries] = useState([]);
const [mockResults, setMockResults] = useState([]);
const [mockResultsLoaded, setMockResultsLoaded] = useState(false);
const [mockResultsLoadError, setMockResultsLoadError] = useState("");
const [adminMockResults, setAdminMockResults] = useState([]);
const [paymentRequests, setPaymentRequests] = useState([]);
const [activePayment, setActivePayment] = useState(null);
const [paymentProof, setPaymentProof] = useState("");
const [adminPaymentProof, setAdminPaymentProof] = useState("");
const [paymentLoading, setPaymentLoading] = useState(false);
const [leaderboard, setLeaderboard] = useState([]);
const [mockLeaderboardEntries, setMockLeaderboardEntries] = useState([]);
const [mockQuestions, setMockQuestions] = useState([]);
const [selectedSubject, setSelectedSubject] = useState("CDP");
const [adminQuestion, setAdminQuestion] = useState("");
const [adminOption1, setAdminOption1] = useState("");
const [adminOption2, setAdminOption2] = useState("");
const [adminOption3, setAdminOption3] = useState("");
const [adminOption4, setAdminOption4] = useState("");
const [adminAnswer, setAdminAnswer] = useState("");
const [adminSubject, setAdminSubject] = useState("CDP");
const [adminLevel, setAdminLevel] = useState("Easy");
const [adminAccessPlan, setAdminAccessPlan] = useState("FREE");
const [activeAdminTab, setActiveAdminTab] = useState("Dashboard");
const [adminNoteTitle, setAdminNoteTitle] = useState("");
const [adminNoteCategory, setAdminNoteCategory] = useState("");
const [adminNoteType, setAdminNoteType] = useState("FREE");
const [adminNotePages, setAdminNotePages] = useState("");
const [adminNotePdf, setAdminNotePdf] = useState("");
const [manualNotePdfUrl, setManualNotePdfUrl] = useState("");
const [uploadingPdf, setUploadingPdf] = useState(false);
const [firebaseNotes, setFirebaseNotes] = useState([]);
const [currentAffairsList, setCurrentAffairsList] = useState([]);
const fallbackCurrentAffairs = [
  {
    id: "ca-january-2026",
    title: "January Current Affairs",
    month: "January 2026",
    type: "FREE",
    pages: 8,
    pdf: "#",
  },

  {
    id: "ca-february-2026",
    title: "February Current Affairs",
    month: "February 2026",
    type: "FREE",
    pages: 10,
    pdf: "#",
  },

  {
    id: "ca-march-2026",
    title: "March Current Affairs",
    month: "March 2026",
    type: "FREE",
    pages: 11,
    pdf: "#",
  },

  {
    id: "ca-april-2026",
    title: "April Current Affairs",
    month: "April 2026",
    type: "FREE",
    pages: 12,
    pdf: "#",
  },

  {
    id: "ca-may-2026",
    title: "May Current Affairs",
    month: "May 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },

  {
    id: "ca-june-2026",
    title: "June Current Affairs",
    month: "June 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },

  {
    id: "ca-july-2026",
    title: "July Current Affairs",
    month: "July 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },

  {
    id: "ca-august-2026",
    title: "August Current Affairs",
    month: "August 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },

  {
    id: "ca-september-2026",
    title: "September Current Affairs",
    month: "September 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },

  {
    id: "ca-october-2026",
    title: "October Current Affairs",
    month: "October 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },

  {
    id: "ca-november-2026",
    title: "November Current Affairs",
    month: "November 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },

  {
    id: "ca-december-2026",
    title: "December Current Affairs",
    month: "December 2026",
    type: "COMING_SOON",
    pages: 0,
    pdf: "#",
  },
];

const [mockTestForm, setMockTestForm] = useState(() =>
  createDefaultMockTestForm()
);

const [mockTestQuestionsForm, setMockTestQuestionsForm] = useState(() => [
  createEmptyMockQuestion(),
]);

const [editingMockTestId, setEditingMockTestId] = useState(null);
const [mockTestPlanFilter, setMockTestPlanFilter] = useState("ALL");
const [mockTestSearch, setMockTestSearch] = useState("");
const [mockTestStatusFilter, setMockTestStatusFilter] = useState("ALL");
const [mockTestExamFilter, setMockTestExamFilter] = useState("ALL");
const [mockTestSortMode, setMockTestSortMode] = useState("LATEST");

const {
  mockMenuPosition,
  mockMenuTest,
  openMockActionPortal,
  closeMockActionPortal,
} = useMockTestActionMenu();
const [selectedMockTestIds, setSelectedMockTestIds] = useState([]);
const [mockImportXlsxUrl, setMockImportXlsxUrl] = useState("");
const [mockTestPage, setMockTestPage] = useState(1);
const mockTestsPerPage = 5;
const [questionBankSearch, setQuestionBankSearch] = useState("");
const [questionBankSubjectFilter, setQuestionBankSubjectFilter] = useState("ALL");
const [questionBankChapterFilter, setQuestionBankChapterFilter] = useState("ALL");
const [questionBankDifficultyFilter, setQuestionBankDifficultyFilter] = useState("ALL");
const [questionBankItems, setQuestionBankItems] = useState([]);
const [editingQuestionBankId, setEditingQuestionBankId] = useState(null);
const [selectedQuestionBankIds, setSelectedQuestionBankIds] = useState([]);



useEffect(() => {
  const isAddMockTestRoute =
    location.pathname === "/admin/content/mock-tests/add";

  if (!isAddMockTestRoute) return;

  const editId = new URLSearchParams(location.search).get(
    "editId"
  );

  const reusedQuestionRaw = localStorage.getItem(
    "reusedQuestionForMockTest"
  );

  if (reusedQuestionRaw) {
    try {
      const reusedQuestion = JSON.parse(reusedQuestionRaw);

      setMockTestQuestionsForm((prev) => [
        ...prev,
        {
          question: reusedQuestion.question || "",
          option1: reusedQuestion.option1 || "",
          option2: reusedQuestion.option2 || "",
          option3: reusedQuestion.option3 || "",
          option4: reusedQuestion.option4 || "",
          answer: reusedQuestion.answer || "",
          explanation: reusedQuestion.explanation || "",
          level: reusedQuestion.level || "Easy",
          questionType:
            reusedQuestion.questionType || "Single Correct",
          language: reusedQuestion.language || "English",
          tag: reusedQuestion.tag || "",
          positiveMarks:
            reusedQuestion.positiveMarks?.toString() || "1",
          negativeMarks:
            reusedQuestion.negativeMarks?.toString() || "0",
          questionStatus:
            reusedQuestion.questionStatus || "published",
          saveToQuestionBank: "no",
        },
      ]);

      localStorage.removeItem("reusedQuestionForMockTest");
    } catch {
      localStorage.removeItem("reusedQuestionForMockTest");
    }
  }

  if (!editId) return;

  const editTest = universalContent.find(
    (item) =>
      item.id === editId &&
      item.section === "mockTest"
  );



  if (!editTest) return;

  setEditingMockTestId(editTest.id);
  setMockTestForm(buildMockTestFormFromTest(editTest));
  setMockTestQuestionsForm(
    buildMockTestQuestionsFormFromTest(editTest)
  );
}, [location.pathname, location.search, universalContent]);

useEffect(() => {
  setMockTestPage(1);
  setSelectedMockTestIds([]);
}, [
  mockTestSearch,
  mockTestPlanFilter,
  mockTestStatusFilter,
  mockTestExamFilter,
  mockTestSortMode,
]);
const handleSaveMockTest = async () => {
  try {
    if (!mockTestForm.title.trim()) {
      alert("Please enter test title");
      return;
    }

    if (!mockTestForm.subject.trim()) {
      alert("Please select subject");
      return;
    }

    if (!mockTestForm.chapter.trim()) {
      alert("Please enter chapter");
      return;
    }

    if (mockTestQuestionsForm.length === 0) {
      alert("Please add at least one question");
      return;
    }

    if (
      Number(mockTestForm.totalQuestions) !==
      mockTestQuestionsForm.length
    ) {
      alert(
        `Total Questions (${mockTestForm.totalQuestions}) and actual questions (${mockTestQuestionsForm.length}) do not match`
      );
      return;
    }

    for (const [index, question] of mockTestQuestionsForm.entries()) {
      if (!question.question?.trim()) {
        alert(`Question ${index + 1} is empty`);
        return;
      }

      if (
        !question.option1?.trim() ||
        !question.option2?.trim() ||
        !question.option3?.trim() ||
        !question.option4?.trim()
      ) {
        alert(
          `All four options are required in Question ${index + 1}`
        );
        return;
      }

      if (!question.answer) {
        alert(
          `Please select correct answer for Question ${index + 1}`
        );
        return;
      }
    }

    if (
      mockTestForm.scheduleType === "dateTime" &&
      (
        !mockTestForm.examStartDate ||
        !mockTestForm.examStartTime
      )
    ) {
      alert(
        "Please select exam start date and time"
      );
      return;
    }

    if (
      mockTestForm.recurringMode === "weekly" &&
      !mockTestForm.weeklyTestDay
    ) {
      alert(
        "Please select weekly test day"
      );
      return;
    }

    if (
      mockTestForm.recurringMode === "monthly" &&
      !mockTestForm.monthlyTestDate
    ) {
      alert(
        "Please select monthly test date"
      );
      return;
    }
    const confirmSave = window.confirm(
      `
    Title: ${mockTestForm.title}

    Subject: ${mockTestForm.subject}

    Chapter: ${mockTestForm.chapter}

    Questions: ${mockTestQuestionsForm.length}

    Duration: ${mockTestForm.duration} min

    Plan: ${mockTestForm.planType}

    Type: ${mockTestForm.testType}

    Do you want to save this paper?
    `
    );

    if (!confirmSave) {
      return;
    }
    const finalTitle = mockTestForm.title?.trim();
    const finalPlan = mockTestForm.planType || "FREE";
    const finalExamType = mockTestForm.examType || "CTET";
    const finalTestType = mockTestForm.testType || "Chapter Test";
    const finalSubject = mockTestForm.subject?.trim();
    const finalChapter = mockTestForm.chapter?.trim();
    const finalStatus = mockTestForm.status || "draft";

    const finalDuration = Number(mockTestForm.duration);
    const finalMarksPerQuestion = Number(mockTestForm.marksPerQuestion);
    const finalNegativeMarks = Number(mockTestForm.negativeMarks || 0);
    const finalPassingMarks = Number(
      mockTestForm.passingMarks || 0
    );

    const finalExamDifficulty =
      mockTestForm.examDifficulty || "Mixed";

    const finalExamLanguage =
      mockTestForm.examLanguage || "English";
    if (!finalTitle) {
      alert("Please enter Test Title");
      return;
    }

    if (!finalPlan) {
      alert("Please select Plan");
      return;
    }

    if (!finalExamType) {
      alert("Please select Exam Category");
      return;
    }

    if (!finalTestType) {
      alert("Please select Test Type");
      return;
    }

    if (!finalSubject) {
      alert("Please enter Subject. For full exams use ALL SUBJECTS.");
      return;
    }

    if (!finalChapter) {
      alert("Please enter Chapter. For full exams use Complete Paper.");
      return;
    }

    if (!Number.isFinite(finalDuration) || finalDuration <= 0) {
      alert("Duration must be greater than 0 minutes");
      return;
    }

    if (
      !Number.isFinite(finalMarksPerQuestion) ||
      finalMarksPerQuestion <= 0
    ) {
      alert("Marks Per Question must be greater than 0");
      return;
    }

    if (!Number.isFinite(finalNegativeMarks) || finalNegativeMarks < 0) {
      alert("Negative Marks Per Question cannot be negative");
      return;
    }

    const cleanedQuestions = mockTestQuestionsForm.map((q, index) => {
      const positiveMarks = Number(
        q.positiveMarks || finalMarksPerQuestion
      );

      const negativeMarks = Number(
        q.negativeMarks ?? finalNegativeMarks
      );

      return {
        questionNumber: index + 1,
        question: q.question?.trim() || "",
        option1: q.option1?.trim() || "",
        option2: q.option2?.trim() || "",
        option3: q.option3?.trim() || "",
        option4: q.option4?.trim() || "",
        answer: q.answer?.trim() || "",
        explanation: q.explanation?.trim() || "",
        level: q.level || "Easy",
        questionType: q.questionType || "Single Correct",
        language: q.language || "English",
        tag: q.tag?.trim() || "",
        positiveMarks:
          Number.isFinite(positiveMarks) && positiveMarks > 0
            ? positiveMarks
            : finalMarksPerQuestion,
        negativeMarks:
          Number.isFinite(negativeMarks) && negativeMarks >= 0
            ? negativeMarks
            : finalNegativeMarks,
        questionStatus: q.questionStatus || "published",
        saveToQuestionBank: q.saveToQuestionBank || "yes",
      };
    });

    const invalidQuestionIndex = cleanedQuestions.findIndex(
      (q) =>
        !q.question ||
        !q.option1 ||
        !q.option2 ||
        !q.option3 ||
        !q.option4 ||
        !q.answer
    );

    if (invalidQuestionIndex !== -1) {
      alert(
        `Question ${invalidQuestionIndex + 1} is incomplete.\n\nEach question must have Question, Option A, Option B, Option C, Option D, and Correct Answer.`
      );
      return;
    }

    const publishedQuestions = cleanedQuestions.filter(
      (q) => q.questionStatus === "published" || q.questionStatus === "approved"
    );

    if (publishedQuestions.length === 0) {
      alert("Please add at least one approved or published question");
      return;
    }

    const bankQuestions =
    publishedQuestions.filter(
      (q) =>
        q.saveToQuestionBank === "yes"
    );

    const totalQuestions = publishedQuestions.length;

    const totalMarks = publishedQuestions.reduce(
      (sum, question) => sum + Number(question.positiveMarks || 0),
      0
    );

    const mockPayload = {
      title: finalTitle,
      section: "mockTest",
      contentType: "MOCK",

      planType: finalPlan,
      examType: finalExamType,
      testType: finalTestType,

      subject: finalSubject,
      chapter: finalChapter,

      duration: finalDuration,
      durationMinutes: finalDuration,

      marksPerQuestion: finalMarksPerQuestion,
      negativeMarks: finalNegativeMarks,

      passingMarks:
      Number.isFinite(finalPassingMarks) &&
      finalPassingMarks >= 0
        ? finalPassingMarks
        : 0,

    examDifficulty: finalExamDifficulty,

    examLanguage: finalExamLanguage,

    attemptLimit: mockTestForm.attemptLimit || "unlimited",
    resultPublishMode: ["instant", "afterSubmission", "manual"].includes(
      mockTestForm.resultPublishMode
    )
      ? mockTestForm.resultPublishMode
      : "instant",
    shuffleQuestions: mockTestForm.shuffleQuestions || "no",
    shuffleOptions: mockTestForm.shuffleOptions || "no",
    navigationMode: mockTestForm.navigationMode || "free",
    allowPause: mockTestForm.allowPause || "yes",
    calculatorAllowed: mockTestForm.calculatorAllowed || "no",
    scheduleType:
  mockTestForm.scheduleType || "alwaysAvailable",

  recurringMode:
  mockTestForm.recurringMode || "none",

weeklyTestDay:
  mockTestForm.weeklyTestDay || "",

monthlyTestDate:
  mockTestForm.monthlyTestDate || "",

  liveEventMode:
  mockTestForm.liveEventMode || "no",

scholarshipMode:
  mockTestForm.scholarshipMode || "no",


  timerMode:
  mockTestForm.timerMode || "globalTimer",

  perQuestionTimeValue:
  mockTestForm.perQuestionTimeValue || "1",

perQuestionTimeUnit:
  mockTestForm.perQuestionTimeUnit || "min",

  leaderboardMode:
  mockTestForm.leaderboardMode || "disabled",

  fullscreenMode:
  mockTestForm.fullscreenMode || "no",

tabSwitchDetection:
  mockTestForm.tabSwitchDetection || "no",

copyPasteProtection:
  mockTestForm.copyPasteProtection || "no",

autoSubmitOnViolation:
  mockTestForm.autoSubmitOnViolation || "no",

  questionSource:
  mockTestForm.questionSource || "manual",

autoSubmitOnTimeUp:
  mockTestForm.autoSubmitOnTimeUp || "yes",

examStartDate:
  mockTestForm.examStartDate || "",

examStartTime:
  mockTestForm.examStartTime || "",

examEndDate:
  mockTestForm.examEndDate || "",

examEndTime:
  mockTestForm.examEndTime || "",

examInstructions:
  mockTestForm.examInstructions?.trim() || "",

      totalQuestions,
      totalMarks,

      status: finalStatus,

      questions: publishedQuestions,

      updatedAt: new Date(),
    };

    const activeEditingMockTestId = editingMockTestId;
    const savedAt = new Date();

    if (activeEditingMockTestId) {
      await updateDoc(doc(db, "contentItems", activeEditingMockTestId), {
        ...mockPayload,
        updatedAt: savedAt,
        editedAt: savedAt,
      });
    } else {
      await addDoc(collection(db, "contentItems"), {
        ...mockPayload,
        createdAt: savedAt,
        updatedAt: savedAt,
      });
    }

    if (typeof loadContentItemsFromFirestore === "function") {
      await loadContentItemsFromFirestore();
    }

    try {
      if (bankQuestions.length > 0) {
        for (const question of bankQuestions) {
          const questionBankKey =
            `${finalExamType}-${finalSubject}-${finalChapter}-${question.question}`
              .toLowerCase()
              .replace(/\s+/g, "-")
              .slice(0, 180);

          const questionBankPayload = {
            ...question,

            questionBankKey,

            sourceExamTitle: finalTitle,
            sourceExamType: finalExamType,
            sourceTestType: finalTestType,
            sourceSubject: finalSubject,
            sourceChapter: finalChapter,

            section: "questionBank",

            updatedAt: new Date(),
          };

          if (editingQuestionBankId) {
            await updateDoc(
              doc(db, "questionBank", editingQuestionBankId),
              questionBankPayload
            );

            setEditingQuestionBankId(null);
          } else {
            const existingQuestions = await getDocs(
              query(
                collection(db, "questionBank"),
                where("questionBankKey", "==", questionBankKey)
              )
            );

            if (existingQuestions.empty) {
              await addDoc(collection(db, "questionBank"), {
                ...questionBankPayload,
                createdAt: new Date(),
              });
            }
          }
        }

        await loadQuestionBankFromFirestore();
      }
    } catch (questionBankError) {
      console.warn("Question bank sync skipped after mock save:", questionBankError);
    }

    alert(
      activeEditingMockTestId
        ? "Examination Test updated successfully ✅"
        : "Examination Test saved successfully ✅"
    );

    setMockTestForm(createDefaultMockTestForm());

    setMockTestQuestionsForm([
      {
        ...createEmptyMockQuestion(),
        passingMarks: "0",
      },
    ]);

    setEditingMockTestId(null);

    navigate("/admin/content/mock-tests/manage");
  } catch (error) {
    console.error("Examination Test save error:", error);
    alert(error.message);
  }
};








const handleImportMockTestJson = async (event) => {
  try {
    const file = event.target.files?.[0];

    if (!file) return;

    const fileText = await file.text();

    const importedTest = JSON.parse(fileText);

    const imported = await importMockTestJsonAsDraft({
      importedTest,
      reloadContent: loadContentItemsFromFirestore,
    });

    if (!imported) {
      alert("Invalid exam JSON file");
      event.target.value = "";
      return;
    }

    alert("Exam imported successfully as Draft ✅");

    event.target.value = "";
  } catch (error) {
    console.error("Import exam JSON error:", error);
    alert("Invalid JSON file or import failed");
    event.target.value = "";
  }
};

const handleDownloadMockTestXlsxTemplate = () => {
  downloadMockTestXlsxTemplate();
};

const handleDownloadMockTestCsvTemplate = () => {
  downloadMockTestCsvTemplate();
};

const handleImportMockTestXlsx = async (event) => {
  try {
    const file = event.target.files?.[0];

    if (!file) return;

    const data = await file.arrayBuffer();

    const workbookRows = readMockTestWorkbookRowsFromArrayBuffer(data);

    if (!workbookRows.ok) {
      alert(workbookRows.message);
      event.target.value = "";
      return;
    }

    const { testInfoRows, questionRows } = workbookRows;

    const parsedImport = buildMockTestImportPayloadFromRows({
      testInfoRows,
      questionRows,
      sourceType: "xlsxImport",
    });

    if (!parsedImport.ok) {
      alert(parsedImport.message);
      event.target.value = "";
      return;
    }

    const confirmImport = window.confirm(
      `Import this Excel file as Draft?\n\nTitle: ${parsedImport.title}\nQuestions: ${parsedImport.totalQuestions}\nMarks: ${parsedImport.totalMarks}\n\nExisting tests will not be overwritten.`
    );

    if (!confirmImport) {
      event.target.value = "";
      return;
    }

    await addDoc(
      collection(db, "contentItems"),
      parsedImport.importPayload
    );

    await loadContentItemsFromFirestore();

    alert("Two-sheet Excel mock test imported safely as Draft ✅");

    event.target.value = "";
  } catch (error) {
    console.error("Import XLSX error:", error);
    alert("Excel import failed. Please check template format.");
    event.target.value = "";
  }
};


const handleImportMockTestXlsxFromUrl = async () => {
  try {
    if (!mockImportXlsxUrl.trim()) {
      alert("Please paste Google Drive XLSX URL");
      return;
    }

    const sourceXlsxUrl = mockImportXlsxUrl.trim();

    const downloadUrl = convertGoogleDriveUrlToDownloadUrl(sourceXlsxUrl);

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      alert(
        "Unable to fetch XLSX from URL. Please make sure the file is public/shared."
      );
      return;
    }

    const data = await response.arrayBuffer();

    const workbookRows = readMockTestWorkbookRowsFromArrayBuffer(data);

    if (!workbookRows.ok) {
      alert(workbookRows.message);
      return;
    }

    const { testInfoRows, questionRows } = workbookRows;

    const parsedImport = buildMockTestImportPayloadFromRows({
      testInfoRows,
      questionRows,
      sourceType: "googleDriveXlsxUrl",
      sourceXlsxUrl,
    });

    if (!parsedImport.ok) {
      alert(parsedImport.message);
      return;
    }

    const confirmImport = window.confirm(
      `Import this Google Drive XLSX as Draft?\n\nTitle: ${parsedImport.title}\nQuestions: ${parsedImport.totalQuestions}\nMarks: ${parsedImport.totalMarks}\n\nExisting tests will not be overwritten.`
    );

    if (!confirmImport) return;

    await addDoc(
      collection(db, "contentItems"),
      parsedImport.importPayload
    );

    await loadContentItemsFromFirestore();

    setMockImportXlsxUrl("");

    alert("Google Drive XLSX imported safely as Draft ✅");
  } catch (error) {
    console.error("Import XLSX from URL error:", error);

    alert(
      "Google Drive import failed. If Drive blocks direct access, download the file and use Import XLSX."
    );
  }
};




const [currentTitle, setCurrentTitle] = useState("");
const [currentMonth, setCurrentMonth] = useState("");
const [currentType, setCurrentType] = useState("FREE");
const [currentPages, setCurrentPages] = useState("");
const [currentPdf, setCurrentPdf] = useState("");
const [manualCurrentPdfUrl, setManualCurrentPdfUrl] = useState("");
const [uploadingCurrentPdf, setUploadingCurrentPdf] = useState(false);
const [editingNoteId, setEditingNoteId] = useState(null);
const [editingCurrentId, setEditingCurrentId] = useState(null);
const [announcementTitle, setAnnouncementTitle] = useState("");
const [announcementMessage, setAnnouncementMessage] = useState("");
const [cmsTitle, setCmsTitle] = useState("");
const [cmsSection, setCmsSection] = useState(
  CONTENT_SECTIONS.NOTES
);

const [cmsSubject, setCmsSubject] = useState("");
const [cmsCourse, setCmsCourse] = useState("");
const [cmsChapter, setCmsChapter] = useState("");



const [cmsPlanType, setCmsPlanType] = useState(
  PLAN_TYPES.FREE
);

const [cmsContentType, setCmsContentType] = useState(
  CONTENT_TYPES.PDF
);

const [cmsSourceType, setCmsSourceType] = useState(
  SOURCE_TYPES.DRIVE
);

const [cmsFileUrl, setCmsFileUrl] = useState("");
const [cmsVideoUrl, setCmsVideoUrl] = useState("");
const [cmsThumbnailUrl, setCmsThumbnailUrl] =
  useState("");

const [cmsMentorName, setCmsMentorName] =
  useState("");

const [cmsMonth, setCmsMonth] = useState("");
const [cmsDuration, setCmsDuration] =
  useState("");

  const [cmsStatus, setCmsStatus] = useState(
    CONTENT_STATUS.PUBLISHED
  );
const [editingCmsId, setEditingCmsId] =
  useState(null);
const [announcements, setAnnouncements] = useState([]);
const [paymentHistory, setPaymentHistory] = useState([]);

  const provider = new GoogleAuthProvider();
  const createPaymentRequest = async (
    planName,
    amount
  ) => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      setPaymentLoading(true);

      const orderId = generateOrderId();

      const upiLink = `upi://pay?pa=aspirenestplatform@oksbi&pn=AspireNest Academy&am=${amount}&tn=${orderId}`;
      const paymentData = {
        orderId,
        userId: user.uid,
        upiLink,
        studentEmail: user.email || "",
        studentMobile: mobile || "",
        studentName: fullName || "",
        planName,
        amount,
        status: "pending_payment",
        studentProof: "",
        adminProof: "",
        matchStatus: "waiting",
        createdAt: new Date().toISOString(),
      };

      console.log("Payment Request Created:", paymentData);
      const paymentDocRef = await addDoc(collection(db, "payments"), paymentData);
      setActivePayment({
        id: paymentDocRef.id,
        ...paymentData,
      });

      alert(
        `Payment Request Created!\nOrder ID: ${orderId}`
      );
    } catch (error) {
      console.error("Payment Error:", error);
      alert(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const verifiedUser = await getVerifiedAuthSession(auth, currentUser);

        setUser(verifiedUser);

        if (verifiedUser && !isAdmin(verifiedUser)) {
          syncVerifiedStudentAccountStatus(db, verifiedUser);

          upsertLearnerLoginSnapshot({ user: verifiedUser }).catch((error) => {
            console.warn(
              "Learner login snapshot skipped:",
              error?.message || error
            );
          });
        }

        if (!verifiedUser) {
        setIsPremiumUser(false);
        setAuthLoading(false);
        return;
      }

      // Fast first load
      checkPremiumAccess(verifiedUser);
      loadUserMockResults(verifiedUser.email);

      // Main content delay se load hoga
      setTimeout(() => {
        loadMockQuestions();
        loadFirebaseNotes();
        loadCurrentAffairs();
        loadAnnouncements();
        loadContentItemsFromFirestore();
        loadNotesSubjectsFromFirestore();
        loadNotesChaptersFromFirestore();
      }, 300);

      // Admin heavy data sirf admin ke liye
      if (isAdmin(verifiedUser)) {
        setTimeout(() => {
          loadLeaderboard();
          loadMockLeaderboardEntries();
          loadPaymentHistory(verifiedUser);
          loadPaymentRequests();
        }, 600);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);


  React.useEffect(() => {
    const routeToSection = {
      "/": null,
      "/learning": "learning-hub",
    };

    const sectionName = routeToSection[location.pathname];

    if (sectionName === undefined) return;



    setActiveSection(sectionName);

    setTimeout(() => {
      const section = document.getElementById(sectionName);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  }, [location.pathname, userPlanType]);

  const handleRegister = async (studentProfile = {}) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName =
      studentProfile.fullName?.trim() || cleanEmail.split("@")[0];

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const baseStudentProfile = {
        uid: userCredential.user.uid,
        fullName: cleanFullName,
        name: cleanFullName,
        email: cleanEmail,
        mobileNumber: studentProfile.mobileNumber || "",
        whatsappNumber: studentProfile.mobileNumber || "",
        targetExam: studentProfile.targetExam || "CTET Paper I + II",
        examTrack: "CTET/TET",
        currentProgram: "CTET/TET",
        preparationLevel: studentProfile.preparationLevel || "Beginner",
        preferredMedium: studentProfile.preferredMedium || "Bilingual",
        role: "student",
        isPremium: false,
        planType: "FREE",
        subscriptionType: "FREE",
        purchasedCourses: [],
        emailVerified: false,
        accountStatus: "pendingEmailVerification",
        profileStatus: "basicProfileCreated",
        profileCompletion: 55,
        onboardingStatus: "basicProfilePending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(
        doc(db, "students", userCredential.user.uid),
        baseStudentProfile
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...baseStudentProfile,
        displayName: cleanFullName,
        paymentStatus: "FREE",
        premiumStatus: "FREE",
      });

      await sendEmailVerification(userCredential.user);

      await signOut(auth);

      alert(
        "Account created ✅ Verification email sent. Please verify your Gmail before login."
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async (loginPayload = {}) => {
    const loginEmail = (loginPayload.email ?? email).trim();
    const loginPassword = loginPayload.password ?? password;

    if (!loginEmail || !loginPassword) {
      alert("Please enter email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      // Launch-safe login: Firebase-authenticated users can enter.
      // Email verification can be completed later; paid access stays Firestore-gated.

      setEmail(loginEmail);
      setPassword(loginPassword);

      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      navigate(returnTo || "/ctet-tet", { replace: true });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async (redirectPath = "/ctet-tet") => {
    if (window.self !== window.top) {
      alert(
        "StackBlitz preview me Google login block hota hai. App new tab me open ho rahi hai."
      );

      window.open(window.location.href, "_blank");
      return;
    }

    try {
      await signInWithPopup(auth, provider);
      navigate(redirectPath || "/ctet-tet", { replace: true });
    } catch (error) {
      if (error?.code === "auth/cancelled-popup-request") {
        return;
      }
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/login", { replace: true });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent 📩");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleContactSubmit = async () => {

    if (!fullName || !mobile || !contactEmail) {
      alert("Please fill all contact details");
      return;
    }

    try {
      await addDoc(collection(db, "enquiries"), {
        fullName: fullName,
        mobile: mobile,
        email: contactEmail,
        createdAt: new Date()
      });

      alert("Enquiry submitted successfully ✅");

      setFullName("");
      setMobile("");
      setContactEmail("");
    } catch (error) {
      alert(error.message);
    }
  };
  const handleNoteAccess = async (note) => {
    if (!note) {
      return;
    }

    const rawAccessType =
      note.accessPlan || note.planType || note.plan || note.type || "FREE";

    const normalizedAccessType = String(rawAccessType || "FREE")
      .trim()
      .toUpperCase();

    const knownPlanTypes = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];
    const isKnownPlan = knownPlanTypes.includes(normalizedAccessType);
    const accessType = isKnownPlan ? normalizedAccessType : "PREMIUM";
    const accessLabel = isKnownPlan ? accessType : normalizedAccessType;

    let notePdfUrl = note.pdfUrl || note.fileUrl || note.pdf || "";

    const canOpenNote = hasPlanAccess(accessType, {
      module: "notes",
      itemType: "notesPdf",
      itemId: String(note.id || note.slug || note.title || ""),
    });

    if (!canOpenNote) {
      if (!user) {
        navigate("/login");
      } else {
        navigate("/ctet-tet/pricing");
      }

      alert(
        accessLabel === "FREE"
          ? "This content is currently locked for your account."
          : "This content requires " + accessLabel + " access."
      );

      return;
    }

    if (note.id) {
        try {
          const protectedAsset = await readProtectedContentAsset(note.id);
          const protectedPdfUrl = getProtectedContentUrl(protectedAsset, [
            "pdfUrl",
            "fileUrl",
            "sourceUrl",
            "downloadUrl",
            "assetUrl",
          ]);

          if (protectedPdfUrl) {
            notePdfUrl = protectedPdfUrl;
          }
        } catch (error) {
          console.warn("Protected notes PDF not available, using legacy URL fallback:", error);
        }
      }



    if (!notePdfUrl || notePdfUrl === "#") {
      alert("PDF will be uploaded soon.");
      return;
    }

    window.open(notePdfUrl, "_blank", "noopener,noreferrer");
  };
  const handlePremiumSectionAccess = () => {
    if (!user) {
      alert("Please login first to access premium content.");
      return;
    }

    if (!isPremiumUser) {
      alert("This section is only for premium members. Please upgrade.");
      return;
    }

    alert("Premium access verified ✅");
  };
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const savePaymentRecord = async function() {
  console.warn("Razorpay gateway payment record is parked. Use verified payment flow only.");
  return null;
};
const unlockPremiumAccess = async function() {
  alert("Premium access is activated only after admin payment verification.");
  return null;
};
const handlePremiumPurchase = async function() {
  if (!user) {
    alert("Please login first.");
    return;
  }

  alert("Online payment gateway is parked for future. Please use the UPI payment request flow. Access will be activated after admin verification.");
};
const loadAdminData = async () => {
    try {
      const studentsSnap = await getDocs(collection(db, "students"));
      const usersSnap = await getDocs(collection(db, "users"));

const usersData = usersSnap.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));
      const enquiriesSnap = await getDocs(collection(db, "enquiries"));

      setStudents(
        studentsSnap.docs.map((doc) => {
          const student = {
            id: doc.id,
            ...doc.data(),
          };

          const userRecord = usersData.find(
            (u) => u.email === student.email
          );

          return {
            ...student,
            isPremium: userRecord?.isPremium || false,
            subscriptionType: userRecord?.subscriptionType || "FREE",
          };
        })
      );

      setEnquiries(
        enquiriesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );

      alert("Admin data loaded ✅");
    } catch (error) {
      alert(error.message);
    }
  };
  const checkPremiumAccess = async (currentUser) => {
    if (!currentUser) return;

    if (currentUser.email === adminEmail) {
      setIsPremiumUser(true);
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: currentUser.email,
          isPremium: false,
          purchasedCourses: [],
          subscriptionType: "FREE",
          purchaseDate: null,
          createdAt: new Date(),
        });

        setIsPremiumUser(false);
        return;
      }

      setIsPremiumUser(userSnap.data().isPremium === true);
      const expiryDate = userSnap.data().expiryDate?.toDate
  ? userSnap.data().expiryDate.toDate()
  : userSnap.data().expiryDate
  ? new Date(userSnap.data().expiryDate)
  : null;

if (expiryDate && expiryDate < new Date()) {
  setIsPremiumUser(false);
  setUserPlanType("FREE");
  await setDoc(
    userRef,
    {
      isPremium: false,
      subscriptionType: "FREE",
      premiumStatus: "EXPIRED",
      expiredAt: new Date(),
    },
    { merge: true }
  );
} else {
  setUserPlanType(
    userSnap.data().subscriptionType || "PREMIUM"
  );

  setMembershipExpiry(expiryDate);
}
    } catch (error) {
      alert(error.message);
      setIsPremiumUser(false);
    }
  };
  const loadUserMockResults = async (email) => {
    setMockResultsLoaded(false);
    setMockResultsLoadError("");

    if (!email) {
      setMockResults([]);
      setMockResultsLoaded(true);
      return [];
    }

    try {
      const q = query(
        collection(db, "mockResults"),
        where("email", "==", email)
      );

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMockResults(results);
      setMockResultsLoaded(true);
      return results;
    } catch (error) {
      console.error("User mock result load error:", error);
      setMockResultsLoadError(
        error?.message ||
          "Your submitted result could not be restored right now."
      );
      setMockResultsLoaded(true);
      return [];
    }
  };
  const loadAllMockResults = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "mockResults")
      );

      setAdminMockResults(
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );

      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const loadLeaderboard = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "mockResults")
      );

      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedResults = results
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      setLeaderboard(sortedResults);
    } catch (error) {
      alert(error.message);
    }
  };

  const loadMockLeaderboardEntries = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "mockLeaderboard")
      );

      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setMockLeaderboardEntries(data);
    } catch (error) {
      console.error("Mock leaderboard load error:", error);
    }
  };

  const loadMockQuestions = async (
    subject = selectedSubject
  ) => {
    try {
      const q = query(
        collection(db, "mockQuestions"),
        where("subject", "==", subject)
      );

      const querySnapshot = await getDocs(q);

      const questions = querySnapshot.docs.map((doc) => ({
        id: doc.id,

        question: doc.data().question,

        options: [
          doc.data().option1,
          doc.data().option2,
          doc.data().option3,
          doc.data().option4,
        ],

        answer: doc.data().answer,

        subject: doc.data().subject,

        level: doc.data().level,

        language: doc.data().language,

        accessPlan:
          doc.data().accessPlan || "FREE",
      }));

      const filteredQuestions =
        questions.filter((question) => {
          if (question.accessPlan === "FREE") {
            return true;
          }

          return hasPlanAccess(
            question.accessPlan
          );
        });

      setMockQuestions(filteredQuestions);

      setCurrentQuestion(0);
      setSelectedAnswer("");
      setScore(0);
      setShowResult(false);
      setShowAnswer(false);
      setTimeLeft(60);
    } catch (error) {
      alert(error.message);
    }
  };
  const loadFirebaseNotes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "notes"));

      const notes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFirebaseNotes(notes);
    } catch (error) {
      alert(error.message);
    }
  };
  const loadCurrentAffairs = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "currentAffairs")
      );

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCurrentAffairsList(data);
    } catch (error) {
      alert(error.message);
    }
  };
  const loadAnnouncements = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "announcements")
      );

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAnnouncements(data);
    } catch (error) {
      alert(error.message);
    }
  };


  React.useEffect(() => {
    loadContentItemsFromFirestore();
    loadNotesSubjectsFromFirestore();
    loadNotesChaptersFromFirestore();
  }, []);

  React.useEffect(() => {
    if (user && isAdmin(user)) {
      loadQuestionBankFromFirestore();
      return;
    }

    setQuestionBankItems([]);
  }, [user]);

  const loadPaymentHistory = async (currentUser = user) => {
    if (!currentUser) return;

    try {
      let querySnapshot;

      if (currentUser.email === adminEmail) {
        querySnapshot = await getDocs(collection(db, "payments"));
      } else {
        const q = query(
          collection(db, "payments"),
          where("userId", "==", currentUser.uid)
        );

        querySnapshot = await getDocs(q);
      }

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPaymentHistory(data);
    } catch (error) {
      alert(error.message);
    }
  };
  const loadPaymentRequests = async () => {
    if (!user || !isAdmin(user)) return;

    try {
      const querySnapshot = await getDocs(
        collection(db, "payments")
      );

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPaymentRequests(data);
    } catch (error) {
      alert(error.message);
    }
  };
  const handleAddMockQuestion = async () => {
    if (
      !adminQuestion ||
      !adminOption1 ||
      !adminOption2 ||
      !adminOption3 ||
      !adminOption4 ||
      !adminAnswer
    ) {
      alert("Please fill all question details");
      return;
    }

    try {
      await addDoc(collection(db, "mockQuestions"), {
        question: adminQuestion,

        option1: adminOption1,
        option2: adminOption2,
        option3: adminOption3,
        option4: adminOption4,

        answer: adminAnswer,

        subject: adminSubject,

        level: adminLevel,

        accessPlan: adminAccessPlan,

        language: "English",

        createdAt: new Date(),
      });

      alert("Question added successfully ✅");

      setAdminQuestion("");
      setAdminOption1("");
      setAdminOption2("");
      setAdminOption3("");
      setAdminOption4("");
      setAdminAnswer("");

      setAdminAccessPlan("FREE");

      loadMockQuestions(adminSubject);
    } catch (error) {
      alert(error.message);
    }
  };
  const handleDeleteMockQuestion = async (indexToDelete) => {
    const updatedQuestions = mockQuestions.filter(
      (_, index) => index !== indexToDelete
    );
    try {
      if (mockQuestions[indexToDelete]?.id) {
        await deleteDoc(
          doc(
            db,
            "mockQuestions",
            mockQuestions[indexToDelete].id
          )
        );
      }
    } catch (error) {
      console.log(error);
    }
    setMockQuestions(updatedQuestions);

    alert("Question deleted successfully ✅");
  };
  const handleEditNote = (note) => {
    setEditingNoteId(note.id);

    setAdminNoteTitle(note.title || "");
    setAdminNoteCategory(note.category || "");
    setAdminNotePages(note.pages || "");
    setAdminNoteType(note.type || "FREE");
    setAdminNotePdf(note.pdf || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleDeleteNote = async (noteId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "notes", noteId));

      alert("Note deleted successfully ✅");

      loadFirebaseNotes();
    } catch (error) {
      alert(error.message);
    }
  };
  const handleUploadPdf = async (file) => {
    if (!file) return "";

    try {
      setUploadingPdf(true);

      const storageRef = ref(
        storage,
        `notes/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);

      setUploadingPdf(false);

      return downloadURL;
    } catch (error) {
      setUploadingPdf(false);
      alert(error.message);
      return "";
    }
  };
  const handleUploadCurrentPdf = async (file) => {
    if (!file) return "";

    try {
      setUploadingCurrentPdf(true);

      const storageRef = ref(
        storage,
        `current-affairs/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);

      setUploadingCurrentPdf(false);

      return downloadURL;
    } catch (error) {
      setUploadingCurrentPdf(false);
      alert(error.message);
      return "";
    }
  };
  const handleSaveNote = async () => {
    if (!adminNoteTitle || !adminNoteCategory || !adminNotePages) {
      alert("Please fill title, category and pages");
      return;
    }

    try {
      if (!adminNotePdf) {
        alert("Please upload PDF first");
        return;
      }
      if (editingNoteId) {
        await updateDoc(doc(db, "notes", editingNoteId), {
          title: adminNoteTitle,
          category: adminNoteCategory,
          type: adminNoteType,
          pages: Number(adminNotePages),
          pdf: adminNotePdf,
          updatedAt: new Date(),
        });

        alert("Note updated successfully ✅");
      } else {
        await addDoc(collection(db, "notes"), {
          title: adminNoteTitle,
          category: adminNoteCategory,
          type: adminNoteType,
          pages: Number(adminNotePages),
          pdf: adminNotePdf,
          createdAt: new Date(),
        });

        alert("Note saved successfully ✅");
      }



      setAdminNoteTitle("");
      setAdminNoteCategory("");
      setAdminNotePages("");
      setAdminNotePdf("");
      setAdminNoteType("FREE");
      setEditingNoteId(null);
      loadFirebaseNotes();
    } catch (error) {
      alert(error.message);
    }
  };
  const handleEditCurrentAffairs = (item) => {
    setEditingCurrentId(item.id);

    setCurrentTitle(item.title || "");
    setCurrentMonth(item.month || "");
    setCurrentPages(item.pages || "");
    setCurrentType(item.type || "FREE");
    setCurrentPdf(item.pdf || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleDeleteCurrentAffairs = async (itemId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this current affairs PDF?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "currentAffairs", itemId));

      alert("Current affairs deleted successfully ✅");

      loadCurrentAffairs();
    } catch (error) {
      alert(error.message);
    }
  };
  const handleSaveCurrentAffairs = async () => {
    if (!currentTitle || !currentMonth || !currentPages) {
      alert("Please fill title, month and pages");
      return;
    }

    try {
      if (!currentPdf) {
        alert("Please upload current affairs PDF first");
        return;
      }

      if (editingCurrentId) {
        await updateDoc(doc(db, "currentAffairs", editingCurrentId), {
          title: currentTitle,
          month: currentMonth,
          type: currentType,
          pages: Number(currentPages),
          pdf: currentPdf,
          updatedAt: new Date(),
        });

        alert("Current affairs updated successfully ✅");
      } else {
        await addDoc(collection(db, "currentAffairs"), {
          title: currentTitle,
          month: currentMonth,
          type: currentType,
          pages: Number(currentPages),
          pdf: currentPdf,
          createdAt: new Date(),
        });

        alert("Current affairs saved successfully ✅");
      }



      setCurrentTitle("");
      setCurrentMonth("");
      setCurrentPages("");
      setCurrentPdf("");
      setCurrentType("FREE");
      setEditingCurrentId(null);

      loadCurrentAffairs();
    } catch (error) {
      alert(error.message);
    }
  };
  const handleAddAnnouncement = async () => {
    if (!announcementTitle || !announcementMessage) {
      alert("Please fill announcement title and message");
      return;
    }

    const createdAt = new Date();

    const announcementRef = await addDoc(
      collection(db, "announcements"),
      {
        title: announcementTitle,
        message: announcementMessage,
        createdAt,
      }
    );

    const newAnnouncement = {
      id: announcementRef.id,
      title: announcementTitle,
      message: announcementMessage,
      createdAt,
    };

    setAnnouncements((currentAnnouncements) => [
      newAnnouncement,
      ...currentAnnouncements,
    ]);

    setAnnouncementTitle("");
    setAnnouncementMessage("");

    alert("Announcement published successfully ✅");
  };

  const getSubjectDisplayName = (subjectValue) => {
    if (!subjectValue) return "";

    const value = subjectValue.toString().trim().toLowerCase();

    const subjectMatch = notesSubjectsList.find((subject) => {
      return (
        subject.id?.toString().trim().toLowerCase() === value ||
        subject.name?.toString().trim().toLowerCase() === value ||
        subject.slug?.toString().trim().toLowerCase() === value ||
        subject.code?.toString().trim().toLowerCase() === value
      );
    });

    return subjectMatch?.name || subjectValue;
  };

  const handleSaveNotesSubject = async () => {
    if (!notesSubjectName.trim()) {
      alert("Please enter subject name.");
      return;
    }

    const normalizedSubjectName =
    notesSubjectName.trim().toLowerCase();

  const duplicateSubject = notesSubjectsList.some(
    (subject) =>
      subject.name?.trim().toLowerCase() ===
        normalizedSubjectName &&
      subject.id !== editingNotesSubjectId
  );

  if (duplicateSubject) {
    alert("This subject already exists.");
    return;
  }

    const subjectPayload = {
      name: notesSubjectName.trim(),
      code: notesSubjectCode.trim(),
      slug:
        notesSubjectSlug.trim() ||
        notesSubjectName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-"),
      order: notesSubjectOrder || "0",
      status: notesSubjectStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingNotesSubjectId) {
        await updateDoc(
          doc(db, "notesSubjects", editingNotesSubjectId),
          subjectPayload
        );

        alert("Subject updated successfully.");
      } else {
        await addDoc(
          collection(db, "notesSubjects"),
          {
            ...subjectPayload,
            createdAt: new Date().toISOString(),
          }
        );

        alert("Subject saved to Firestore successfully.");
      }

      setNotesSubjectName("");
      setNotesSubjectCode("");
      setNotesSubjectSlug("");
      setNotesSubjectOrder("");
      setNotesSubjectStatus("Active");
      setEditingNotesSubjectId(null);

    } catch (error) {
      console.error("Subject save/update error:", error);
      alert("Subject save/update failed.");
    }
  };

  const handleSaveNotesChapter = async () => {

    if (!notesChapterSubjectId) {
      alert("Please select subject.");
      return;
    }

    if (!notesChapterName.trim()) {
      alert("Please enter chapter name.");
      return;
    }

    const chapterPayload = {
      subjectId: notesChapterSubjectId,
subjectName:
  notesSubjectsList.find(
    (subject) => subject.id === notesChapterSubjectId
  )?.name || "",
      name: notesChapterName.trim(),
      code: notesChapterCode.trim(),
      slug:
        notesChapterSlug.trim() ||
        notesChapterName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-"),
      order: notesChapterOrder || "0",
      status: notesChapterStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingNotesChapterId) {
        await updateDoc(
          doc(db, "notesChapters", editingNotesChapterId),
          chapterPayload
        );

        alert("Chapter updated successfully.");
      } else {
        await addDoc(
          collection(db, "notesChapters"),
          {
            ...chapterPayload,
            createdAt: new Date().toISOString(),
          }
        );

        alert("Chapter saved to Firestore successfully.");
      }

      setNotesChapterSubjectId("");
      setNotesChapterName("");
      setNotesChapterCode("");
      setNotesChapterSlug("");
      setNotesChapterOrder("");
      setNotesChapterStatus("Active");
      setEditingNotesChapterId(null);
      await loadNotesChaptersFromFirestore();
    } catch (error) {
      console.error("Chapter save/update error:", error);
      alert("Chapter save/update failed.");
    }
  };

  const handlePublishNotesContent = async () => {
    const normalizedNotesSubject =
      notesCmsSubject.trim();

    if (!notesCmsTitle.trim()) {
      alert("Please enter note title.");
      return;
    }

    if (!normalizedNotesSubject) {
      alert("Please select or enter subject.");
      return;
    }

    const normalizeText = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");

  const existingSubject = notesSubjectsList.find(
    (subject) =>
      normalizeText(subject.name) === normalizeText(normalizedNotesSubject) ||
      normalizeText(subject.slug) === normalizeText(normalizedNotesSubject) ||
      normalizeText(subject.code) === normalizeText(normalizedNotesSubject)
  );

    if (normalizedNotesSubject && !existingSubject) {
      await addDoc(collection(db, "notesSubjects"), {
        name: normalizedNotesSubject,
        code: "",
        slug: normalizedNotesSubject
          .toLowerCase()
          .replace(/\s+/g, "-"),
        order: "0",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await loadNotesSubjectsFromFirestore();
    }

    const existingChapter = notesChaptersList.find(
      (chapter) =>
        chapter.subjectName?.trim().toLowerCase() ===
          normalizedNotesSubject.toLowerCase() &&
        chapter.name?.trim().toLowerCase() ===
          notesCmsChapter.trim().toLowerCase()
    );

    if (
      normalizedNotesSubject &&
      notesCmsChapter.trim() &&
      !existingChapter
    ) {
      await addDoc(collection(db, "notesChapters"), {
        subjectId: "",
        subjectName: normalizedNotesSubject,
        name: notesCmsChapter.trim(),
        code: "",
        slug: notesCmsChapter
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-"),
        order: "0",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await loadNotesChaptersFromFirestore();
    }

    const notesPayload = {
      title: notesCmsTitle,
      description: notesCmsDescription,
      planType: notesCmsPlanType,
      subject: normalizedNotesSubject,
      chapter: notesCmsChapter,
      month: notesCmsMonth,
      year: notesCmsYear,
      week: notesCmsWeek,
      pdfUrl: notesCmsPdfUrl,
      thumbnailUrl: notesCmsThumbnailUrl,
      status: notesCmsStatus,
      section: "notes",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingNotesCmsId) {
        await updateDoc(
          doc(db, "contentItems", editingNotesCmsId),
          notesPayload
        );

          if (notesCmsPdfUrl.trim()) {
            await saveProtectedContentAsset(
              editingNotesCmsId,
              {
                id: editingNotesCmsId,
                ...notesPayload,
              },
              {
                actorEmail: user?.email || "admin",
                source: "notes_cms",
              }
            );
          }

        alert("Notes updated successfully.");
      } else {
        const notesRef = await addDoc(collection(db, "contentItems"), {
            ...notesPayload,
            createdAt: new Date().toISOString(),
          });

          if (notesCmsPdfUrl.trim()) {
            await saveProtectedContentAsset(
              notesRef.id,
              {
                id: notesRef.id,
                ...notesPayload,
              },
              {
                actorEmail: user?.email || "admin",
                source: "notes_cms",
              }
            );
          }

        alert("Notes saved to Firestore successfully.");
      }

      setNotesCmsTitle("");
      setNotesCmsDescription("");
      setNotesCmsPlanType("FREE");
      setNotesCmsSubject("");
      setNotesCmsChapter("");
      setNotesCmsMonth("");
      setNotesCmsYear("");
      setNotesCmsPdfUrl("");
      setNotesCmsThumbnailUrl("");
      setNotesCmsStatus("Draft");
      setEditingNotesCmsId(null);

      await loadContentItemsFromFirestore();
    } catch (error) {
      console.error("Notes save/update error:", error);
      alert("Notes save/update failed.");
    }
  };

  const handleBackfillProtectedNotesAssets = async () => {
    const confirmSync = window.confirm(
      "Sync existing Notes PDF URLs into protectedContentAssets?\n\n" +
        "This will not remove legacy URLs yet.\n" +
        "Existing protected assets will be safely updated."
    );

    if (!confirmSync) return;

    try {
      const snapshot = await getDocs(collection(db, "contentItems"));
      const noteItems = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .filter((item) => {
          const section = String(
            item.section || item.contentSection || item.type || ""
          ).toLowerCase();
          const itemType = String(
            item.itemType || item.contentType || ""
          ).toLowerCase();
          const pdfUrl = String(
            item.pdfUrl || item.fileUrl || item.pdf || item.url || ""
          ).trim();

          return Boolean(
            pdfUrl &&
              (section.includes("note") || itemType.includes("note"))
          );
        });

      if (!noteItems.length) {
        alert("No Notes PDF URLs found for protected sync.");
        return;
      }

      let syncedCount = 0;
      let failedCount = 0;

      for (const item of noteItems) {
        const pdfUrl = String(
          item.pdfUrl || item.fileUrl || item.pdf || item.url || ""
        ).trim();

        if (!item.id || !pdfUrl) {
          continue;
        }

        try {
          await saveProtectedContentAsset(
            item.id,
            {
              ...item,
              id: item.id,
              pdfUrl,
              fileUrl: item.fileUrl || pdfUrl,
              section: item.section || "notes",
              planType: item.planType || "FREE",
              course: item.course || "CTET_TET",
            },
            {
              actorEmail: user?.email || "admin",
              source: "notes_protected_backfill",
            }
          );

          syncedCount += 1;
        } catch (error) {
          failedCount += 1;
          console.error("Protected notes PDF backfill failed:", item.id, error);
        }
      }

      alert(
        "Protected Notes PDF sync complete.\n\n" +
          "Synced: " +
          syncedCount +
          "\nFailed: " +
          failedCount
      );
    } catch (error) {
      console.error("Protected notes PDF sync error:", error);
      alert("Protected Notes PDF sync failed.");
    }
  };

  const handleDeleteLocalContentItem = async (itemId) => {
    try {
      await deleteDoc(
        doc(db, "contentItems", itemId)
      );

      setUniversalContent((prevContent) =>
        prevContent.filter((item) => item.id !== itemId)
      );

      alert("Content deleted from Firestore.");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed.");
    }
  };

  const loadContentItemsFromFirestore = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "contentItems")
      );

      const loadedItems = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setUniversalContent(loadedItems);

      console.log(
        "Loaded contentItems from Firestore:",
        loadedItems
      );
    } catch (error) {
      console.error(
        "Error loading contentItems:",
        error
      );
    }
  };

  const loadQuestionBankFromFirestore = async () => {
    try {
      const bankSnapshot = await getDocs(
        collection(db, "questionBank")
      );

      const bankData = bankSnapshot.docs.map((bankDoc) => ({
        id: bankDoc.id,
        ...bankDoc.data(),
      }));

      setQuestionBankItems(bankData);
    } catch (error) {
      console.error("Question bank load error:", error);
    }
  };

  const loadNotesSubjectsFromFirestore = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "notesSubjects")
      );

      const loadedSubjects = snapshot.docs.map(
        (docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })
      );

      setNotesSubjectsList(loadedSubjects);

      console.log(
        "Loaded notesSubjects:",
        loadedSubjects
      );
    } catch (error) {
      console.error(
        "Error loading notesSubjects:",
        error
      );
    }
  };

  const loadNotesChaptersFromFirestore = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "notesChapters")
      );

      const loadedChapters = snapshot.docs.map(
        (docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })
      );

      setNotesChaptersList(loadedChapters);

      console.log(
        "Loaded notesChapters:",
        loadedChapters
      );
    } catch (error) {
      console.error(
        "Error loading notesChapters:",
        error
      );
    }
  };

  const handleSaveUniversalContent = async () => {
    try {
      const payload = {
        title: cmsTitle,
        section: cmsSection,
        subject: cmsSubject,
        course: cmsCourse,
        chapter: cmsChapter,
        month: cmsMonth,

        planType: cmsPlanType,
        contentType: cmsContentType,
        sourceType: cmsSourceType,

        fileUrl: cmsFileUrl,
        videoUrl: cmsVideoUrl,
        thumbnailUrl: cmsThumbnailUrl,

        mentorName: cmsMentorName,
        duration: cmsDuration,

        status: cmsStatus,
      };

      if (editingCmsId) {
        await updateContentItem(
          editingCmsId,
          payload
        );

        alert("Universal content updated ✅");
      } else {
        await addContentItem(payload);

        alert("Universal content published ✅");
      }

      setCmsTitle("");
      setCmsSubject("");
      setCmsCourse("");
      setCmsChapter("");

      setCmsFileUrl("");
      setCmsVideoUrl("");
      setCmsThumbnailUrl("");

      setCmsMentorName("");
      setCmsMonth("");
      setCmsDuration("");

      setEditingCmsId(null);

      loadContentItemsFromFirestore();
    } catch (error) {
      console.error(error);

      alert(error.message);
    }
  };

  const handleSaveCurrentAffairsContent = async () => {
    if (!cmsTitle.trim()) {
      alert("Please enter current affair title.");
      return;
    }

    if (!cmsMonth.trim()) {
      alert("Please select month.");
      return;
    }

    if (!cmsDuration.trim()) {
      alert("Please enter year.");
      return;
    }

    if (!cmsChapter.trim()) {
      alert("Please select week/type.");
      return;
    }

    if (!cmsFileUrl.trim()) {
      alert("Please enter PDF URL.");
      return;
    }

    const payload = {
      title: cmsTitle.trim(),
      section: CONTENT_SECTIONS.CURRENT_AFFAIRS,
      subject: "CTET/TET",
      course: "CTET/TET",
      chapter: cmsChapter,
      month: `${cmsMonth} ${cmsDuration}`,
      planType: cmsPlanType,
      contentType: CONTENT_TYPES.PDF,
      sourceType: SOURCE_TYPES.DRIVE,
      fileUrl: cmsFileUrl.trim(),
      videoUrl: "",
      thumbnailUrl: "",
      mentorName: "",
      duration: cmsDuration,
      status: cmsStatus,
    };

    try {
      if (editingCmsId) {
        await updateContentItem(editingCmsId, payload);
        alert("Current Affair updated successfully ✅");
      } else {
        await addContentItem(payload);
        alert("Current Affair saved successfully ✅");
      }

      alert("Current Affair saved successfully ✅");

      setCmsTitle("");
      setCmsMonth("");
      setCmsDuration("");
      setCmsChapter("");
      setCmsPlanType(PLAN_TYPES.FREE);
      setCmsFileUrl("");
      setCmsStatus(CONTENT_STATUS.PUBLISHED);

      await loadContentItemsFromFirestore();
    } catch (error) {
      console.error(error);
      alert("Current Affair save failed.");
    }
  };

  const handleDeleteAnnouncement = (announcementId) => {
    const updatedAnnouncements = announcements.filter(
      (item) => item.id !== announcementId
    );

    setAnnouncements(updatedAnnouncements);

    alert("Announcement deleted successfully ✅");
  };
  const approvePaymentRequest = async function(payment) {
    if (!payment || !payment.id) {
      alert("Payment record not found.");
      return;
    }

    try {

      if (payment.status === "approved" || payment.accessEngineSynced === true) {
        alert("Payment is already approved and synced.");
        return;
      }
      if (!payment.userId) {
        alert("Student user ID not found in this payment.");
        return;
      }

      const userRef = doc(db, "users", payment.userId);
      const planType =
        payment.planName === "Personal Mentorship"
          ? "MENTORSHIP"
          : payment.planName === "Premium Batch"
          ? "PREMIUM"
          : payment.planName === "Topic-wise Courses"
          ? "BASIC"
          : payment.planType || "PREMIUM";

      const purchaseDate = new Date();
      const validityMonthsRaw =
        payment.validityMonths ||
        payment.durationMonths ||
        payment.durationInMonths ||
        payment.selectedDurationMonths ||
        payment.duration ||
        6;
      const validityMonths = Number(validityMonthsRaw);
      const safeValidityMonths =
        Number.isFinite(validityMonths) && Math.max(validityMonths, 0) === validityMonths && validityMonths !== 0
          ? validityMonths
          : 6;

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + safeValidityMonths);

      await grantPaymentAccess(
        Object.assign({}, payment, {
          planType,
          accessFrom: purchaseDate,
          accessUntil: expiryDate,
          validityMonths: safeValidityMonths,
        }),
        {
          uid: user && user.uid ? user.uid : null,
          email: user && user.email ? user.email : "aspirenestplatform@gmail.com",
          role: "admin",
          isAdmin: true,
        }
      );

      await setDoc(
        userRef,
        {
          email: payment.studentEmail || payment.email || "",
          isPremium: true,
          subscriptionType: planType,
          premiumStatus: "ACTIVE",
          purchasedCourses: [payment.planName || planType],
          purchaseDate,
          expiryDate,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      await updateDoc(doc(db, "payments", payment.id), {
        status: "approved",
        matchStatus: "admin_approved",
        approvedAt: new Date(),
        approvedPlanType: planType,
        accessEngineSynced: true,
        accessUntil: expiryDate,
      });

      alert("Payment approved and access activated ✅");

      loadPaymentRequests();
      loadPaymentHistory();
      loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  };
  const handlePremiumControl = async (studentEmail, makePremium) => {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", studentEmail)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("User record not found in premium database.");
        return;
      }

      const userDoc = querySnapshot.docs[0];

      await setDoc(
        doc(db, "users", userDoc.id),
        {
          isPremium: makePremium,
          subscriptionType: makePremium ? "PREMIUM" : "FREE",
          updatedAt: new Date(),
        },
        { merge: true }
      );

      alert(
        `${studentEmail} marked as ${
          makePremium ? "Premium" : "Free"
        } user ✅`
      );

      await loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  };
  const courses = [

    {
      id: "ctet-paper-2",
      title: "CTET Paper II",
      subtitle: "Foundation Program",
      level: "Intermediate",
      price: "₹1499",
      category: "CTET",
      desc: "Comprehensive preparation covering Child Development & Pedagogy, Mathematics, Science, Social Science, and Language I & II, along with concept clarity, practice sessions, and strategic guidance for upper primary teaching aspirants.",
      lessons: "All",
      tests: 10,
      badge: "FOUNDATION",
      points: ["CDP", "Language I & II", "Maths/Science", "Social Science", "PYQ"],
    },
    {
      id: "ctet-paper-2",
      title: "CTET Paper II",
      subtitle: "Exam Mastery Program",
      level: "Exam Focused",
      price: "₹2499",
      category: "State TET",
      desc: "Complete guidance on State TET exam pattern, updated syllabus, previous year question papers (PYQs), practice tests, and full-length mock tests designed to improve accuracy, confidence, and time management skills.",
      lessons: "All",
      tests: 50,
      badge: "EXAM MASTERY",
      points: ["State Pattern", "Syllabus", "Practice Sets", "PYQ", "Strategy"],
    },
  ];
  const notesLibraryData = {
    FREE: [],

    BASIC: [],

    PREMIUM: [],

    MENTORSHIP: [],
  };


  const dynamicNotesLibraryData = Object.keys(
    notesLibraryData
  ).reduce((library, planName) => {
    const cmsSubjects = universalNotes
      .filter(
        (item) =>
          (item.planType || "FREE") === planName &&
          item.subject
      )
      .map((item) => ({
        id: item.subject
          .toLowerCase()
          .replace(/\s+/g, "-"),
        title: item.subject,
        description: "CMS uploaded notes",
        cover: "📄",
      }));

    const mergedSubjects = [
      ...notesLibraryData[planName],
      ...cmsSubjects,
    ].filter(
      (subject, index, self) =>
        index ===
        self.findIndex((s) => s.id === subject.id)
    );

    return {
      ...library,
      [planName]: mergedSubjects,
    };
  }, {});

  const notesSubjectRouteMatch = location.pathname.match(
    /^\/ctet-tet\/notes\/plan\/([^/]+)\/([^/]+)$/
  );

  const activeNotesPlan =
    notesSubjectRouteMatch?.[1]?.toUpperCase() || null;

  const activeNotesSubjectId =
    notesSubjectRouteMatch?.[2] || null;

    const videoSubjectRouteMatch = location.pathname.match(
      /^\/admin\/content\/videos\/subjects\/([^/]+)$/
    );

    const activeVideoSubjectName =
      videoSubjectRouteMatch?.[1]
        ? decodeURIComponent(videoSubjectRouteMatch[1])
        : "";

    const activeNotesSubject =
    activeNotesPlan && activeNotesSubjectId
      ? dynamicNotesLibraryData[activeNotesPlan]?.find(
          (subject) => subject.id === activeNotesSubjectId
        )
      : null;


  const sampleMockQuestions = [
    {
      question: "Piaget kis development theory ke liye famous hain?",
      options: [
        "Moral Development",
        "Cognitive Development",
        "Social Learning",
        "Classical Conditioning",
      ],
      answer: "Cognitive Development",
    },
    {
      question: "Vygotsky ki theory me ZPD ka full form kya hai?",
      options: [
        "Zone of Personal Development",
        "Zone of Proximal Development",
        "Zone of Physical Development",
        "Zone of Practical Discussion",
      ],
      answer: "Zone of Proximal Development",
    },
    {
      question: "Inclusive education ka main aim kya hai?",
      options: [
        "Only toppers ko support karna",
        "All learners ko equal opportunity dena",
        "Only disabled students ko teach karna",
        "Separate classroom banana",
      ],
      answer: "All learners ko equal opportunity dena",
    },
  ];



  const restartMockTest = () => {

    setCurrentQuestion(0);
    setSelectedAnswer("");
    setScore(0);
    setShowResult(false);
    setTimeLeft(60);
    setShowAnswer(false);
  };
  const percentage = Math.round((score / mockQuestions.length) * 100);

const performanceLevel =
  percentage >= 80
    ? "Excellent Performance 🏆"
    : percentage >= 50
    ? "Good Attempt 👍"
    : "Needs More Practice 📚";

const motivationalMessage =
  percentage >= 80
    ? "Outstanding work! Your concepts are very strong."
    : percentage >= 50
    ? "Good effort! Practice more to improve your score."
    : "Keep practicing daily. Improvement will come with consistency.";
    const totalMockAttempts = mockResults.length;

const averageAccuracy =
  mockResults.length > 0
    ? Math.round(
        mockResults.reduce(
          (total, result) => total + result.percentage,
          0
        ) / mockResults.length
      )
    : 0;
    const weeklyPerformanceData = [
      { day: "Mon", score: 45 },
      { day: "Tue", score: 52 },
      { day: "Wed", score: 61 },
      { day: "Thu", score: 58 },
      { day: "Fri", score: 70 },
      { day: "Sat", score: 82 },
      { day: "Sun", score: 90 },
    ];

    const subjectPerformanceData = [
      { name: "CDP", value: 80 },
      { name: "Maths", value: 65 },
      { name: "EVS", value: 72 },
      { name: "Language", value: 88 },
    ];

const highestScore =
  mockResults.length > 0
    ? Math.max(...mockResults.map((result) => result.percentage))
    : 0;

const latestScore =
  mockResults.length > 0
    ? mockResults[mockResults.length - 1].percentage
    : 0;

const getCtetMomentumTime = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
};

const getCtetLocalDateKey = (value) => {
  const time = getCtetMomentumTime(value);
  if (!time) return "";

  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const ctetMockActivityDateKeys = [
  ...new Set(
    (mockResults || [])
      .map((result) =>
        getCtetLocalDateKey(
          result.completedAt ||
            result.submittedAt ||
            result.createdAt ||
            result.updatedAt
        )
      )
      .filter(Boolean)
  ),
];

const ctetMockXpEvents = (mockResults || [])
  .map((result) => {
    const activityDateKey = getCtetLocalDateKey(
      result.completedAt ||
        result.submittedAt ||
        result.createdAt ||
        result.updatedAt
    );

    const eventId =
      result.id ||
      result.attemptSaveKey ||
      [
        "mock",
        result.testId || result.testTitle || result.title || "test",
        activityDateKey,
        result.score ?? "",
        result.percentage ?? "",
      ].join("_");

    return activityDateKey
      ? {
          id: eventId,
          type: "mock",
          dateKey: activityDateKey,
          xp: 40,
          label: "Mock attempt",
        }
      : null;
  })
  .filter(Boolean);

const latestMockResult = [...(mockResults || [])]
  .sort(
    (first, second) =>
      Math.max(
        getCtetMomentumTime(second.completedAt),
        getCtetMomentumTime(second.submittedAt),
        getCtetMomentumTime(second.createdAt),
        getCtetMomentumTime(second.updatedAt)
      ) -
      Math.max(
        getCtetMomentumTime(first.completedAt),
        getCtetMomentumTime(first.submittedAt),
        getCtetMomentumTime(first.createdAt),
        getCtetMomentumTime(first.updatedAt)
      )
  )[0] || null;

const latestMockScore = Number.isFinite(Number(latestMockResult?.percentage))
  ? Math.round(Number(latestMockResult.percentage))
  : 0;

const ctetContinueLearningCard = !user
  ? {
      eyebrow: "Learning Momentum",
      icon: "🚀",
      title: "Start your CTET/TET journey",
      text: "Login to unlock your personal resume card, mock history, and daily progress.",
      percent: 0,
      route: "/login",
      action: "Login ▶",
    }
  : latestMockResult
  ? {
      eyebrow: "Continue Learning",
      icon: "🧾",
      title: latestMockResult.testTitle || latestMockResult.title || "Continue from latest mock",
      text: `${totalMockAttempts} mock attempt${totalMockAttempts === 1 ? "" : "s"} • Avg accuracy ${averageAccuracy}%`,
      percent: Math.max(0, Math.min(100, latestMockScore)),
      route: "/ctet-tet/mock-tests/history",
      action: "Review ▶",
    }
  : {
      eyebrow: "Learning Momentum",
      icon: "🧾",
      title: "Start your first mock test",
      text: "Begin with a practice test so AspireNest can build your progress path.",
      percent: 0,
      route: "/ctet-tet/mock-tests",
      action: "Start ▶",
    };

const ctetTodayMission = {
  id: "todayMission",
  eyebrow: "Today’s Mission",
  icon: "🎯",
  title: user ? "Complete today’s 3-step mission" : "Login for today’s mission",
  text: user
    ? "Read, practice, and check your path. Small daily actions build selection momentum."
    : "Login to start your daily CTET/TET mission and track progress.",
  action: user ? "Start mission" : "Login",
  route: user ? "/ctet-tet/notes" : "/login",
  tasks: [
    {
      id: "notes",
      icon: "📄",
      title: "Read quick notes",
      text: "Open revision notes for one topic.",
      route: "/ctet-tet/notes",
      cta: "Open notes",
    },
    {
      id: "mock",
      icon: "🧪",
      title: "Practice mock test",
      text: "Attempt or review one mock test.",
      route: "/ctet-tet/mock-tests",
      cta: "Practice",
    },
    {
      id: "roadmap",
      icon: "🧭",
      title: "Check AspirePath",
      text: "Review today’s roadmap task.",
      route: user ? "/my-aspirepath" : "/ctet-tet/roadmaps",
      cta: user ? "Open path" : "View roadmaps",
    },
  ],
};

const ctetLearningMomentumCards = [
  {
    id: "resume",
    eyebrow: ctetContinueLearningCard.eyebrow,
    icon: ctetContinueLearningCard.icon,
    title: ctetContinueLearningCard.title,
    text: ctetContinueLearningCard.text,
    meta:
      ctetContinueLearningCard.percent > 0
        ? `${ctetContinueLearningCard.percent}% latest score`
        : user
        ? "First activity pending"
        : "Login required",
    route: ctetContinueLearningCard.route,
    action: ctetContinueLearningCard.action.replace("▶", "").trim(),
    tone: "gold",
  },
  {
    id: "roadmap",
    eyebrow: "AspirePath",
    icon: "🧭",
    title: "Open your guided roadmap",
    text: "Follow day-wise CTET/TET preparation with tasks, resources, and revision flow.",
    meta: "Roadmap • Daily plan",
    route: user ? "/my-aspirepath" : "/ctet-tet/roadmaps",
    action: user ? "Open my path" : "View roadmaps",
    tone: "violet",
  },
  {
    id: "progress",
    eyebrow: "Progress",
    icon: "📊",
    title: user ? "Check your learning progress" : "Track progress after login",
    text: user
      ? `Mocks: ${totalMockAttempts} • Best score ${highestScore}%`
      : "Login to see mock accuracy, attempts, dashboard and progress history.",
    meta: user ? `Latest score ${latestScore || 0}%` : "Private dashboard",
    route: user ? "/student-dashboard" : "/login",
    action: user ? "Open progress" : "Login",
    tone: "blue",
  },
];

const analyticsMessage =
  averageAccuracy >= 80
    ? "Excellent progress. Keep maintaining consistency."
    : averageAccuracy >= 50
    ? "Good progress. Focus on weak areas."
    : "More mock practice needed.";
    const weakSubjects = {};

mockResults.forEach((result) => {
  if (!weakSubjects[result.subject]) {
    weakSubjects[result.subject] = [];
  }

  weakSubjects[result.subject].push(result.percentage);
});

let weakestSubject = "No Data";

if (Object.keys(weakSubjects).length > 0) {
  weakestSubject = Object.entries(weakSubjects)
    .map(([subject, scores]) => ({
      subject,
      average:
        scores.reduce((a, b) => a + b, 0) / scores.length,
    }))
    .sort((a, b) => a.average - b.average)[0].subject;
}
const smartRecommendation =
  weakestSubject === "No Data"
    ? "Complete at least one mock test to get personalized recommendations."
    : weakestSubject === "CDP"
    ? "Focus on child development theories, learning principles, and pedagogy concepts."
    : weakestSubject === "Maths"
    ? "Practice calculation speed, basic concepts, and topic-wise maths MCQs."
    : weakestSubject === "EVS"
    ? "Revise environmental studies concepts and practice exam-oriented EVS questions."
    : weakestSubject === "Language"
    ? "Improve grammar, comprehension, and language pedagogy practice."
    : `Focus more on ${weakestSubject} practice to improve your performance.`;
    const performanceChartData = [
      { day: "Mon", score: 45 },
      { day: "Tue", score: 52 },
      { day: "Wed", score: 61 },
      { day: "Thu", score: 58 },
      { day: "Fri", score: 70 },
      { day: "Sat", score: 82 },
      { day: "Sun", score: 90 },
    ];

    const subjectChartData = [
      { name: "CDP", value: 80 },
      { name: "Maths", value: 65 },
      { name: "EVS", value: 72 },
      { name: "Language", value: 88 },
    ];

    const chartColors = [
      "#f97316",
      "#3b82f6",
      "#10b981",
      "#8b5cf6",
    ];
    const uniqueTestDates = [
      ...new Set(
        mockResults
          .filter((result) => result.createdAt)
          .map((result) => {
            const date = result.createdAt.toDate
              ? result.createdAt.toDate()
              : new Date(result.createdAt);

            return date.toDateString();
          })
      ),
    ];

    const dailyStreak = uniqueTestDates.length;
    const recentScores = mockResults
  .slice(-5)
  .map((result) => result.percentage);

const weeklyGrowth =
  recentScores.length >= 2
    ? recentScores[recentScores.length - 1] - recentScores[0]
    : 0;

const weeklyGrowthMessage =
  weeklyGrowth > 0
    ? `Your performance improved by ${weeklyGrowth}% recently.`
    : weeklyGrowth < 0
    ? `Your performance dropped by ${Math.abs(
        weeklyGrowth
      )}%. Focus on revision.`
    : "Complete more mock tests to track weekly growth.";
    const estimatedRank =
  averageAccuracy >= 90
    ? "Top 5%"
    : averageAccuracy >= 80
    ? "Top 10%"
    : averageAccuracy >= 60
    ? "Top 25%"
    : averageAccuracy >= 40
    ? "Needs Improvement"
    : "Start Practice";

const rankPredictionMessage =
  averageAccuracy >= 80
    ? "You are performing at a strong competitive level."
    : averageAccuracy >= 50
    ? "You are improving. More consistent practice can push you higher."
    : "Attempt more mock tests to improve your predicted rank.";
    const subjectPerformance = Object.entries(weakSubjects).map(
      ([subject, scores]) => ({
        subject,
        average: Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        ),
      })
    );
    const estimatedStudyMinutes = totalMockAttempts * 15;

const estimatedStudyHours = (
  estimatedStudyMinutes / 60
).toFixed(1);

const studyTimeMessage =
  estimatedStudyMinutes > 0
    ? `You have completed approximately ${estimatedStudyHours} study hours through mock practice.`
    : "Start attempting mock tests to track your study time.";
    const aiStudyPlan =
  weakestSubject === "No Data"
    ? [
        "Attempt one mock test today.",
        "Review your result analysis.",
        "Start with CDP and Maths basics.",
      ]
    : [
        `Revise ${weakestSubject} concepts for 30 minutes.`,
        `Attempt 10 ${weakestSubject} MCQs.`,
        "Review wrong answers and repeat weak topics.",
      ];
      const accuracyChartData = mockResults.map(
        (result, index) => ({
          test: `Test ${index + 1}`,
          accuracy: result.percentage,
        })
      );
      const pieChartData = [
        {
          name: "Correct",
          value: averageAccuracy,
        },
        {
          name: "Remaining",
          value: 100 - averageAccuracy,
        },
      ];








  if (authLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        Loading...
      </div>
    );
  }
  if (false && !user){
    return (
      <React.Suspense
        fallback={
          <div className="premium-loader">
            <img
              src="/logo-header.png"
              alt="AspireNest Academy"
              className="premium-loader-logo"
              loading="eager"
              decoding="async"
            />

            <div className="premium-loader-ring"></div>

            <h2>Loading AspireNest Academy</h2>

            <p>Preparing your smart learning experience...</p>
          </div>
        }
      >
        <div className={darkMode ? "app dark" : "app"}>
          <header>
            <div className="brand">
              <AspireNestLogo />
            </div>
          </header>

          <div
            style={{
              height: "calc(100vh - 90px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "0 20px",
              overflow: "hidden",
            }}
          >
            <AuthSection
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              handleLogin={handleLogin}
              handleGoogleLogin={handleGoogleLogin}
              handleForgotPassword={handleForgotPassword}
              handleRegister={handleRegister}
            />
          </div>
        </div>
      </React.Suspense>
    );
}

  const renderCtetPremiumHeader = (className = "") => (
    <CtetPremiumHeader
      className={className}
      user={user}
      isAdminUser={Boolean(user && isAdmin(user))}
      announcements={announcements}
      events={ctetExperienceEvents}
      contentItems={universalContent}
      currentAffairs={currentAffairsList}
      roadmaps={ctetNotificationRoadmaps}
      mockResults={mockResults}
      navigate={navigate}
      accountMenuRef={accountMenuRef}
      accountMenuOpen={accountMenuOpen}
      setAccountMenuOpen={setAccountMenuOpen}
      accountDisplayName={accountDisplayName}
      accountEmail={accountEmail}
      openAccountTarget={openAccountTarget}
      logoutFromAccountMenu={logoutFromAccountMenu}
    />
  );

return (
        <React.Suspense
          fallback={
            <div className="premium-loader">
              <img
                src="/logo-header.png"
                alt="AspireNest Academy"
                className="header-logo"
                loading="eager"
                decoding="async"
              />

              <div className="premium-loader-ring"></div>

              <h2>Loading AspireNest Academy</h2>

              <p>Preparing your smart learning experience...</p>
            </div>
          }
        >
        {!isExamAttemptPage &&
          !ctetExperienceEnabled &&
          renderCtetPremiumHeader("ctetGlobalPremiumHeader")}
<main className="appShell">
<Routes key={location.key || location.pathname}>


<Route
  path="/ctet-tet/roadmaps"
  element={
    <StudentRoadmapHub
      user={user}
      userPlanType={userPlanType}
      hasPlanAccess={hasPlanAccess}
      isAdminUser={isAdmin(user)}
    />
  }
/>

<Route
  path="/ctet-tet/roadmaps/:roadmapId"
  element={
    <StudentRoadmapDetail
      user={user}
      userPlanType={userPlanType}
      hasPlanAccess={hasPlanAccess}
      isAdminUser={isAdmin(user)}
    />
  }
/>

<Route
  path="/ctet-tet/roadmaps/:roadmapId/day/:dayId"
  element={
    <StudentRoadmapDay
      user={user}
      userPlanType={userPlanType}
      hasPlanAccess={hasPlanAccess}
      isAdminUser={isAdmin(user)}
    />
  }
/>

<Route
  path="/my-aspirepath"
  element={
    <MyAspirePath
      user={user}
      userPlanType={userPlanType}
      hasPlanAccess={hasPlanAccess}
      isAdminUser={isAdmin(user)}
    />
  }
/>

<Route
  path="/admin/content/roadmaps"
  element={
    requireAdmin() ? (
      <RoadmapStudioHome />
    ) : null
  }
/>

<Route
  path="/admin/content/roadmaps/import"
  element={
    requireAdmin() ? (
      <RoadmapImportRoute />
    ) : null
  }
/>

<Route
  path="/admin/content/roadmaps/manage"
  element={
    requireAdmin() ? (
      <RoadmapManageRoute />
    ) : null
  }
/>

<Route
  path="/admin/content/roadmaps/edit/:roadmapId"
  element={
    requireAdmin() ? (
      <RoadmapEditRoute />
    ) : null
  }
/>

<Route
  path="/admin/content/roadmaps/schedule/:roadmapId"
  element={
    requireAdmin() ? (
      <RoadmapScheduleRoute />
    ) : null
  }
/>
<Route
  path="/admin/content/roadmaps/resources/:roadmapId"
  element={
    requireAdmin() ? (
      <RoadmapResourcesRoute />
    ) : null
  }
/>


<Route
  path="/admin/content/roadmaps/progress/:roadmapId"
  element={
    requireAdmin() ? (
      <RoadmapProgressRoute />
    ) : null
  }
/>

<Route
  path="/"
  element={<AcademyOverviewRoute />}
/>


<Route
  path="/login"
  element={
    <AuthRoute
      user={user}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleLogin={handleLogin}
      handleGoogleLogin={handleGoogleLogin}
      handleForgotPassword={handleForgotPassword}
      handleRegister={handleRegister}
    />
  }
/>

<Route
  path="/access/invite/:inviteCode"
  element={<StudentAccessInviteRoute user={user} handleGoogleLogin={handleGoogleLogin} />}
/>

<Route
    path="/ctet-tet"
    element={
      <>
 <div
  style={{
    padding: "20px",
    textAlign: "center",
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: "99999",
  }}
>

</div>

    {renderCtetPremiumHeader()}

    <nav className="ctetMobileSectionDock" aria-label="CTET screen shortcuts">
      {[
        ["home", "Home"],
        ["journey", "Journey"],
        ["mentor", "Mentor"],
        ["live", "Live"],
        ["success", "Success"],
        ["help", "Help"],
      ].map(([screen, label]) => (
        <button
          type="button"
          key={screen}
          data-ctet-screen-button={screen}
          aria-pressed={ctetMobileScreen === screen ? "true" : "false"}
          onClick={() => {
            setCtetMobileScreen(screen);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="ctetMobileDockMark" aria-hidden="true" />
          <strong>{label}</strong>
        </button>
      ))}
    </nav>

    <div className="ctetExperiencePage" data-ctet-mobile-screen={ctetMobileScreen}>
  <section className="ctetTopEntryExperience" aria-label="AspireNest CTET TET top entry experience">
      {/* === CTET Screen 1 top event ticker compact gap-fit v1 === */}
      {ctetFeaturedExperienceEvent ? (
        <div className="ctetTopEventTicker" aria-label="Live event update ticker">
          <div className="ctetTopEventTickerTrack">
            {(() => {
              const tickerItems = [
                ctetFeaturedExperienceEvent.status
                  ? "STATUS " + String(ctetFeaturedExperienceEvent.status).toUpperCase()
                  : null,
                ctetFeaturedExperienceEvent.title
                  ? "EVENT " + ctetFeaturedExperienceEvent.title
                  : null,
                ctetFeaturedExperienceEvent.typeLabel
                  ? "TYPE " + ctetFeaturedExperienceEvent.typeLabel
                  : null,
                ctetFeaturedExperienceEvent.planType
                  ? "PLAN " + ctetFeaturedExperienceEvent.planType
                  : null,
                ctetFeaturedExperienceEvent.subject
                  ? "SUBJECT " + ctetFeaturedExperienceEvent.subject
                  : null,
                ctetFeaturedExperienceEvent.chapter
                  ? "CHAPTER " + ctetFeaturedExperienceEvent.chapter
                  : null,
                ctetFeaturedExperienceScheduleAt
                  ? ctetFeaturedExperienceScheduleLabel.toUpperCase() +
                    " " +
                    ctetFeaturedExperienceScheduleAt.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null,
                ctetFeaturedExperienceEvent.cta?.label
                  ? "ACTION " + ctetFeaturedExperienceEvent.cta.label
                  : null,
              ].filter(Boolean);

              return (
                <>
                  <div className="ctetTopEventTickerGroup">
                    {tickerItems.map((item, index) => (
                      <span key={"top-event-a-" + index}>{item}</span>
                    ))}
                  </div>
                  <div className="ctetTopEventTickerGroup" aria-hidden="true">
                    {tickerItems.map((item, index) => (
                      <span key={"top-event-b-" + index}>{item}</span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}

    <div className="ctetTopEntryShell">


<div className="ctetHeroCommandGrid">
        <div className="ctetHeroStory">
          <h1>
            Crack CTET/TETs
            <span> with Smart Learning</span>
          </h1>

          <p>
            Premium bilingual preparation for CTET & TET aspirants with expert mentorship,
            smart practice, concise notes, videos, live updates and personalized progress —
            all in one place.
          </p>

          <div className="ctetHeroCtas">
            <button
              type="button"
              className="ctetPrimaryCta"
              onClick={() => navigate(user ? "/ctet-tet/courses" : "/login")}
            >
              <span>📖</span>
              Start Learning
              <strong>›</strong>
            </button>

            <button type="button" onClick={() => navigate("/ctet-tet/mock-tests")}>
              <span>🧾</span>
              Mock Tests
              <strong>›</strong>
            </button>

            <button type="button" onClick={() => navigate("/ctet-tet/notes")}>
              <span>📄</span>
              Free Notes
              <strong>›</strong>
            </button>
          </div>

          <div className="ctetHeroBenefitStrip">
            {[
              ["🌐", "Bilingual Content", "Hindi + English"],
              ["👥", "Expert Educators", "CTET/TET Experts"],
              ["🎯", "Exam-Focused", "Selection-ready prep"],
              ["🛡️", "Premium Support", "Guidance when needed"],
            ].map(([icon, title, text]) => (
              <div className="ctetHeroBenefit" key={title}>
                <span>{icon}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="ctetHeroCommandDeck">
          <div className="ctetCommandDeckHeader">
            <div className="ctetCommandIcon">🎯</div>
            <div>
              <h2>Hero Command Deck</h2>
              <p>Personalized guidance to keep you on track every day.</p>
            </div>
            <span className="ctetStreakChip">{ctetContinueLearningCard.eyebrow}</span>
          </div>

          <button
            type="button"
            className="ctetNextStepCard"
            onClick={() => navigate(ctetContinueLearningCard.route)}
          >
            <span className="ctetNextIcon">{ctetContinueLearningCard.icon}</span>
            <div>
              <small>Continue Learning</small>
              <h3>{ctetContinueLearningCard.title}</h3>
              <p>{ctetContinueLearningCard.text}</p>
              <div className="ctetProgressBar">
                <span style={{ width: `${ctetContinueLearningCard.percent}%` }} />
              </div>
            </div>
            <strong>{ctetContinueLearningCard.percent > 0 ? `${ctetContinueLearningCard.percent}%` : "Start"}</strong>
            <em>{ctetContinueLearningCard.action}</em>
          </button>

          <div className="ctetQuickActionLabel">Quick Actions</div>

          <div className="ctetHeroQuickActions">
            {[
              ["🧾", "Mock Tests", "Practice Now", "/ctet-tet/mock-tests"],
              ["📰", "Current Affairs", "Daily PDF", "/ctet-tet/current-affairs"],
              ["📄", "Notes", "Quick Revision", "/ctet-tet/notes"],
              ["▶️", "Videos", "Watch Now", "/ctet-tet/videos"],
              ["📊", "My Progress", "Track Growth", user ? "/student-dashboard" : "/login"],
            ].map(([icon, title, text, url]) => (
              <button type="button" key={title} onClick={() => navigate(url)}>
                <span>{icon}</span>
                <strong>{title}</strong>
                <small>{text}</small>
              </button>
            ))}
          </div>

          <div className="ctetWeeklyGoalCard">
            <div>
              <span>🎯</span>
              <strong>Weekly Goal</strong>
              <small>Attempt 2 mock tests this week</small>
            </div>
            <b>0 / 2</b>
            <div className="ctetWeeklyGoalTrack">
              <i style={{ width: "0%" }} />
            </div>
          </div>
        </aside>
      </div>

      <div className="ctetLiveHeartbeat">
        <div className="ctetLiveInfo">
          <div className="ctetLiveBadgeRow">
            <span
              className={
                ctetFeaturedEventPresentation?.status === "live"
                  ? "ctetLiveBadge isLive"
                  : "ctetLiveBadge"
              }
            >
              {ctetFeaturedEventPresentation
                ? `${
                    ctetFeaturedEventPresentation.status === "live"
                      ? "● "
                      : ""
                  }${ctetFeaturedEventPresentation.statusLabel.toUpperCase()}`
                : ctetExperienceLoading
                  ? "LOADING"
                  : "SCHEDULE SOON"}
            </span>
            <strong>
              {ctetFeaturedEventPresentation?.headlineLabel ||
                (ctetExperienceLoading
                  ? "Syncing latest academy event"
                  : "Next academy event")}
            </strong>
          </div>

          <h2>
            {ctetFeaturedExperienceEvent?.title ||
              (ctetExperienceLoading
                ? "Checking latest AspireNest event"
                : "New class, mock test, or challenge will appear here")}
          </h2>

          <p>
            {ctetFeaturedExperienceEvent?.description ||
              (ctetExperienceLoading
                ? "Fetching real class, mock test, challenge, and workshop updates."
                : "Upcoming academy event details will appear here when published by the admin team.")}
          </p>
        </div>

        <div className="ctetLiveMentor">
          <div className="ctetMentorAvatar">VM</div>
          <div>
            <h3>
              {ctetFeaturedEventPresentation?.mentorName ||
                "Dr. Varsha D. Maru"}
            </h3>
            <p>Ph.D. Educator & CTET/TET Mentor</p>
            <small>
              {ctetFeaturedExperienceEvent?.subject ||
                ctetFeaturedEventPresentation?.typeLabel ||
                "Expert guidance"}
            </small>
          </div>
        </div>

        <div className="ctetLiveSchedule">
          <div>
            <span>📅</span>
            <strong>
              {ctetFeaturedExperienceScheduleLabel}{" "}
              {ctetFeaturedExperienceDateLabel}
            </strong>
          </div>
          <div>
            <span>⏱️</span>
            <strong>
              {ctetFeaturedExperienceTimeLabel}
            </strong>
          </div>
        </div>

        <div className="ctetLiveCountdown">
          {ctetFeaturedExperienceCountdownAt ? (
            <ExperienceCountdown
              targetAt={
                ctetFeaturedExperienceCountdownAt
              }
              label={
                ctetFeaturedEventPresentation?.timing
                  ?.countdownLabel || "Starts in"
              }
              completedLabel={
                ctetFeaturedEventPresentation?.timing
                  ?.countdownCompletedLabel ||
                "Started"
              }
            />
          ) : ctetFeaturedEventPresentation?.status ===
            "live" ? (
            <div className="ctetCountdownEmpty">
              <strong>Live now</strong>
              <span>End time not set</span>
            </div>
          ) : (
            <div className="ctetCountdownEmpty">
              <strong>Schedule</strong>
              <span>Coming Soon</span>
            </div>
          )}
        </div>

        <div className="ctetLiveActions">
          <button
            type="button"
            className="ctetPrimaryCta"
            onClick={() =>
              openCtetExperienceTarget(
                ctetFeaturedEventPresentation?.primaryCta.route,
                "/ctet-tet"
              )
            }
          >
            {ctetFeaturedEventPresentation?.primaryCta.label ||
              "View Learning Hub"}
            <strong>›</strong>
          </button>

          <button
            type="button"
            onClick={() =>
              openCtetExperienceTarget(
                ctetFeaturedEventPresentation?.secondaryCta.route,
                "/ctet-tet"
              )
            }
          >
            {ctetFeaturedEventPresentation?.secondaryCta.label ||
              "Learning Hub"}
            <strong>›</strong>
          </button>
        </div>
      </div>
    </div>
  </section>

<AppDashboard
setActiveSection={setActiveSection}
setActiveAdminTab={setActiveAdminTab}
user={user}
isAdmin={isAdmin}
learningMomentumCards={ctetLearningMomentumCards}
todayMission={ctetTodayMission}
streakActivityDates={ctetMockActivityDateKeys}
xpActivityEvents={ctetMockXpEvents}
/>


<section className="ctetS3FreshMentorAuthority" id="about">
  <div className="ctetS3FreshPhotoPanel" aria-label="Dr. Varsha mentor photo">
    <div className="ctetS3FreshPhotoGlow" />
    <img
      className="ctetS3FreshPhoto"
      src="/mentor-varsha.png"
      alt="Dr. Varsha D. Maru"
      loading="lazy"
    />
  </div>

  <div className="ctetS3FreshContentPanel">
    <div className="ctetS3FreshTopLine">
      <span>Mentor Authority Panel</span>
      <b>Academic Profile</b>
    </div>

    <h2>Dr. Varsha D. Maru</h2>

    <p className="ctetS3FreshRoleLine">
      Educator • Researcher • Academic Leader • CTET/TET Mentor
    </p>

    <p className="ctetS3FreshBio">
      Learn from a Ph.D. qualified educator, I/C Principal, Assistant Professor,
      researcher, and CTET/TET mentor with strong expertise in Education,
      Psychology, Pedagogy, Teacher Training, and Digital Learning.
    </p>


    <div className="ctetS3FreshCredentialGrid">
      {[
        ["🏫", "Current Role", "I/C Principal & Assistant Professor"],
        ["🎓", "Qualification", "Ph.D. in Education, M.Ed., M.A. Psychology"],
        ["📚", "Exam Expertise", "CTET Paper II Qualified, TAT Qualified"],
        ["🧠", "Research Area", "Cyberbullying, Mental Health, Education & Psychology"],
        ["🏆", "Recognition", "Best Excellence Teacher Award"],
        ["💻", "Digital Learning", "Google Certified Educator, AI & NEP 2020 Training"],
      ].map(([icon, title, text]) => (
        <article className="ctetS3FreshCredentialCard" key={title}>
          <span>{icon}</span>
          <strong>{title}</strong>
          <small>{text}</small>
        </article>
      ))}
    </div>

    <div className="ctetS3FreshLowerGrid">
      <div className="ctetS3FreshWhyPanel">
        <h3>Why Learn from Dr. Varsha</h3>

        <div className="ctetS3FreshWhyGrid">
          {[
            ["💡", "Concept Clarity", "Simplifying complex concepts with clarity"],
            ["📚", "Practical Pedagogy", "Real-classroom strategies and methods"],
            ["💬", "Bilingual Explanation", "Hindi and English for better understanding"],
            ["🎯", "Exam-Focused Preparation", "PYQs, strategies and smart shortcuts"],
          ].map(([icon, title, text]) => (
            <article className="ctetS3FreshWhyCard" key={title}>
              <span>{icon}</span>
              <strong>{title}</strong>
              <small>{text}</small>
            </article>
          ))}
        </div>
      </div>

        <aside className="ctetS3FreshCtaPanel" aria-label="Mentor quick actions">
          <button
            type="button"
            className="ctetS3FreshCtaCard"
            onClick={() => setShowProfile(true)}
          >
            <span>👤</span>
            <div>
              <strong>View Full Profile</strong>
              <small>Academic portfolio</small>
            </div>
            <b>›</b>
          </button>

          <button
            type="button"
            className="ctetS3FreshCtaCard"
            onClick={() => setShowMentorProfile(true)}
          >
            <span>💬</span>
            <div>
              <strong>Contact Mentor</strong>
              <small>Email for guidance</small>
            </div>
            <b>›</b>
          </button>
        </aside>

    </div>
  </div>



  <div className="ctetS3FreshImpactStrip">
    {[
      ["Academic Profile", "Verified educator background"],
      ["Current Role", "I/C Principal & Assistant Professor"],
      ["Exam Expertise", "CTET Paper II & TAT Qualified"],
      ["Research Area", "Education, Psychology & Mental Health"],
      ["Digital Learning", "Google Certified Educator"],
      ["Recognition", "Best Excellence Teacher Award"],
    ].map(([title, text]) => (
      <article className="ctetS3FreshImpactItem" key={title}>
        <strong>{title}</strong>
        <span>{text}</span>
      </article>
    ))}
  </div>
</section>




{showMentorProfile && (
  <div className="mentorProfileOverlay">
    <div className="mentorProfileModal">
      <button
        className="closeMentorProfile"
        onClick={() => setShowMentorProfile(false)}
      >
        ×
      </button>

      <h2>Connect with your mentor</h2>

      <h3>Dr. Varsha Dalpat Maru</h3>

      <p>
        <strong>
          Founder & Academic Mentor
        </strong>{" "}
        — AspireNest Academy
      </p>

      <p>
        “Guiding future educators with
        knowledge, confidence, and the right
        mentorship to transform aspirations
        into success.”
      </p>

      <p>
        <strong>📍 Location:</strong>
        {" "}Mumbai, Maharashtra, India
      </p>

      <p>
        <strong>📧 Email:</strong>
        {" "}dr.varshamaru@gmail.com
      </p>

      <p>
        <strong>📞 Phone:</strong>
        {" "}+91 97736 92578
      </p>

      <p>
        <strong>🔗 LinkedIn:</strong>
        <br />
        linkedin.com/in/dr-varsha-maru-4a71b614b
      </p>

      <p>
        <strong>
          🌐 Professional Portfolio:
        </strong>
        <br />
        bold.pro/my/drvarshadalpatmaru
      </p>
    </div>
  </div>
)}

{showProfile && (
  <div
  className="mentorProfileOverlay"
    onClick={() => setShowProfile(false)}
  >
    <div
     className="mentorProfileModal profileModal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
       className="closeMentorProfile"
        onClick={() => setShowProfile(false)}
      >
        ✕
      </button>

      <h2>Professional Academic Profile</h2>

      <h3>Dr. Varsha Dalpat Maru</h3>

      <p className="profileTag">
        Founder & Academic Mentor — AspireNest Academy
      </p>

      <p>
        “Where Aspirations Turn Into Selections”
      </p>

      <div className="profileContent">

        <h4>Professional Profile</h4>

        <p>
          Dr. Varsha Dalpat Maru is an accomplished educator,
          academic leader, researcher, and mentor with
          extensive experience in teacher education,
          psychology, educational research, and academic leadership.
        </p>

        <p>
          Currently serving as I/C Principal and Assistant
          Professor at Humera Khan College of Education, Mumbai.
        </p>

        <h4>Academic Qualifications</h4>

        <ul>
          <li>Ph.D. in Education</li>
          <li>UGC-NET Qualified – Education & Psychology</li>
          <li>CTET Paper-II Qualified</li>
          <li>TAIT Qualified</li>
          <li>M.Ed. – Education</li>
          <li>M.A. Psychology</li>
          <li>Google Certified Educator</li>
        </ul>

        <h4>Research Areas</h4>

        <p>
          Cyberbullying, Mental Health, Educational Psychology,
          Digital Education & Teacher Training.
        </p>

      </div>
    </div>
  </div>
)}

    <CtetMentorPresenceBand
      events={ctetExperienceEvents}
      navigate={navigate}
    />

    {/* === CTET Screen 3 book launch promo ribbon v1 === */}
    {(() => {
      const bookPromo = {
        enabled: true,
        title: "Child Development & Pedagogy",
        subtitle: "CTET & TETs Important Key Notes",
        description:
          "A focused CTET & TET revision handbook with important key notes, concept clarity, and exam-ready preparation support aligned with NCF-SE 2023 and NEP 2020.",
        author: "Dr. Varsha D. Maru",
        url: "https://amzn.in/d/0hWc6cLH",
        coverSrc: "/ctet-books/child-development-pedagogy-kindle-cover.png",
        qrSrc: "/ctet-books/child-development-pedagogy-amazon-qr.png",
      };

      if (!bookPromo.enabled || !bookPromo.url) {
        return null;
      }

      const tickerItems = [
        "NEW KINDLE LAUNCH",
        bookPromo.title,
        bookPromo.subtitle,
        "By " + bookPromo.author,
        "Last-minute revision support",
        "Scan QR or open Amazon Kindle",
      ];

      return (
        <section className="ctetBookLaunchRibbon" aria-label="Dr. Varsha Kindle book launch update">
          <div className="ctetBookLaunchCover" aria-hidden="true">
            <img
              src={bookPromo.coverSrc}
              alt={bookPromo.title + " Kindle book cover"}
            />
          </div>

          <div className="ctetBookLaunchContent">
            <div className="ctetBookLaunchMetaRow">
              <span className="ctetBookLaunchEyebrow">New Kindle Release</span>
              <span className="ctetBookLaunchBatchTag">CTET/TET Revision Companion</span>
            </div>

            <h3>{bookPromo.title}</h3>

            <p>
              The Ultimate Last-Moment Revision Handbook for CTET & TET aspirants —
              focused key notes, concept clarity, and exam-ready preparation support
              aligned with NCF-SE 2023 and NEP 2020.
            </p>

            <div className="ctetBookLaunchByline">
              <span>By Dr. Varsha D. Maru</span>
              <span>Available on Amazon Kindle</span>
            </div>

            <div className="ctetBookLaunchTicker" aria-label="Kindle book highlights">
              <div className="ctetBookLaunchTickerTrack">
                {[
                  "New Kindle Release",
                  "Child Development & Pedagogy",
                  "CTET & TET Key Notes",
                  "Last-Moment Revision Support",
                  "NCF-SE 2023",
                  "NEP 2020",
                  "By Dr. Varsha D. Maru",
                  "Available on Amazon Kindle",
                ]
                  .concat([
                    "New Kindle Release",
                    "Child Development & Pedagogy",
                    "CTET & TET Key Notes",
                    "Last-Moment Revision Support",
                    "NCF-SE 2023",
                    "NEP 2020",
                    "By Dr. Varsha D. Maru",
                    "Available on Amazon Kindle",
                  ])
                  .map((item, index) => (
                    <span key={"book-launch-ticker-" + index}>{item}</span>
                  ))}
              </div>
            </div>
          </div>

          <div className="ctetBookLaunchAction">
            <img src={bookPromo.qrSrc} alt="Amazon Kindle book QR code" />
            <a
              href={bookPromo.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open Child Development and Pedagogy book on Amazon Kindle"
            >
              <span>
                View on
                <strong>Amazon Kindle</strong>
              </span>
              <b>›</b>
            </a>
          </div>
        </section>
      );
    })()}

    <CtetLiveContentCenter
    events={ctetExperienceEvents}
    upcomingEvents={ctetUpcomingExperienceEvents}
    contentItems={universalContent}
    currentAffairs={currentAffairsList}
    loading={ctetExperienceLoading}
    mockLeaderboardEntries={mockLeaderboardEntries}
    user={user}
    navigate={navigate}
  />

  <CtetSuccessWallScreen
    mockLeaderboardEntries={mockLeaderboardEntries}
    navigate={navigate}
  />

  <CtetSupportFooterScreen
    fullName={fullName}
    setFullName={setFullName}
    mobile={mobile}
    setMobile={setMobile}
    contactEmail={contactEmail}
    setContactEmail={setContactEmail}
    onSubmit={handleContactSubmit}
    navigate={navigate}
  />
  </div>



</>
  }
/>

<Route
  path="/courses/ctet"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">CTET Course</span>

        <h2>CTET Complete Preparation Program</h2>

        <p>
          Learn Child Development & Pedagogy,
          Language, Maths, EVS, and exam strategy
          through premium mentor-guided preparation.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/ctet-tet/notes")}>
          📘 CTET Notes
        </button>

        <button onClick={() => navigate("/ctet-tet/mock-tests")}>
          📝 CTET Mock Tests
        </button>

        <button onClick={() => navigate("/ctet-tet/pricing")}>
          💎 Premium Plans
        </button>
      </div>
    </section>
  }
/>

<Route
  path="/courses/tet"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">TET Course</span>

        <h2>State TET Preparation Program</h2>

        <p>
          Prepare for State TET examinations with
          structured courses, premium notes,
          mock tests, and mentor guidance.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/ctet-tet/notes")}>
          📘 TET Notes
        </button>

        <button onClick={() => navigate("/ctet-tet/mock-tests")}>
          📝 TET Mock Tests
        </button>

        <button onClick={() => navigate("/ctet-tet/pricing")}>
          💎 Premium Plans
        </button>
      </div>
    </section>
  }
/>
<Route
  path="/notes"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Notes Library</span>

        <h2>CTET/TET Notes Ecosystem</h2>

        <p>
          Access free notes, premium notes,
          revision material, and mentor-guided study resources.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/courses/ctet")}>
          📘 CTET Notes
        </button>

        <button onClick={() => navigate("/courses/tet")}>
          📚 TET Notes
        </button>

        <button onClick={() => navigate("/ctet-tet/pricing")}>
          💎 Unlock Premium Notes
        </button>

        <button onClick={() => navigate("/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>
<Route
  path="/mock-tests"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Mock Test Center</span>

        <h2>CTET/TET Mock Test Ecosystem</h2>

        <p>
          Practice with subject-wise mock tests,
          PYQs, revision tests, and performance analytics.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/courses/ctet")}>
          📝 CTET Mock Tests
        </button>

        <button onClick={() => navigate("/courses/tet")}>
          📚 TET Mock Tests
        </button>

        <button onClick={() => navigate("/student-dashboard")}>
          📊 Performance Dashboard
        </button>

        <button onClick={() => navigate("/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>
<Route
  path="/current-affairs"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Current Affairs</span>

        <h2>Monthly Current Affairs Hub</h2>

        <p>
          Stay updated with exam-oriented monthly current affairs,
          revision PDFs, and educational updates.
        </p>
      </div>

      <div className="courseGrid">
        <button>
          📰 January Current Affairs
        </button>

        <button>
          📰 February Current Affairs
        </button>

        <button>
          📰 March Current Affairs
        </button>

        <button onClick={() => navigate("/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>

<Route
  path="/announcements"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Announcements</span>

        <h2>Latest Platform Announcements</h2>

        <p>
          Stay updated with latest exam alerts, platform updates,
          important notices, and AspireNest announcements.
        </p>
      </div>

      <div className="courseGrid">
        <button>
          📢 New Mock Tests Added
        </button>

        <button>
          📢 CTET Revision Schedule Live
        </button>

        <button>
          📢 Premium Notes Updated
        </button>

        <button onClick={() => navigate("/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>

<Route
  path="/pricing"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Plans & Pricing</span>

        <h2>Choose Your AspireNest Plan</h2>

        <p>
          Upgrade your learning with premium notes,
          mock tests, AI classroom, analytics, and mentor guidance.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => createPaymentRequest("Topic-wise Courses", 499)}>
          BASIC — Topic-wise Courses
        </button>

        <button onClick={() => createPaymentRequest("Premium Batch", 999)}>
          PREMIUM — Full Batch
        </button>

        <button onClick={() => createPaymentRequest("Personal Mentorship", 1999)}>
          MENTORSHIP — Personal Guidance
        </button>

        <button onClick={() => navigate("/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>
<Route
  path="/contact"
  element={
    <ExperienceFooterPanels
        id="contact"
        support={{
          badge: "ASPIRENEST SUPPORT",
          title: "Official guidance for CTET/TET learners.",
          description:
            "For courses, notes, mock tests, videos, roadmaps, payment, and access support, contact AspireNest Academy.",
          strong: "AspireNest Academy Helpdesk",
        }}
        enquiryTitle="Contact AspireNest Academy"
        enquiryContent={
          <>
            <p>Email: aspirenestacademy@gmail.com</p>
            <p>WhatsApp Support Available</p>
            <button type="button" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
          </>
        }
        faqTitle="Support areas"
        faqs={[
          "Courses and batches",
          "Notes and mock tests",
          "Videos and roadmaps",
          "Payment and access support",
        ]}
      />
  }
/>
<Route
  path="/student-dashboard"
  element={
    requireLogin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">Student App</span>

          <h2>Student Dashboard</h2>

          <p>
            Track your courses, notes, tests, premium access,
            payment history, leaderboard, and AI classroom.
          </p>
        </div>

        <div className="courseGrid">
          <button onClick={() => navigate("/my-courses")}>
            📚 My Courses
          </button>

          <button onClick={() => navigate("/my-notes")}>
            📘 My Notes
          </button>

          <button onClick={() => navigate("/my-tests")}>
            📝 My Tests
          </button>

          <button onClick={() => navigate("/payment-history")}>
            🧾 Payment History
          </button>

          <button onClick={() => navigate("/leaderboard")}>
            🏆 Leaderboard
          </button>

          <button onClick={() => navigate("/my-profile")}>
            👤 My Profile
          </button>

          <button onClick={() => navigate("/ai-classroom")}>
            🤖 AI Classroom
          </button>
        </div>

        <div style={{ marginTop: "30px" }}>
          <StudentDashboard
            user={user}
            isPremiumUser={isPremiumUser}
            userPlanType={userPlanType}
            membershipExpiry={membershipExpiry}
            hasPlanAccess={hasPlanAccess}
            isAdmin={isAdmin(user)}
            handlePremiumSectionAccess={handlePremiumSectionAccess}
            handleLogout={handleLogout}
            loadAdminData={loadAdminData}
            mockResults={mockResults}
            averageAccuracy={averageAccuracy}
            weeklyPerformanceData={weeklyPerformanceData}
            subjectPerformanceData={subjectPerformanceData}
            highestScore={highestScore}
            totalMockAttempts={totalMockAttempts}
            dailyStreak={dailyStreak}
            weeklyGrowthMessage={weeklyGrowthMessage}
            estimatedRank={estimatedRank}
            rankPredictionMessage={rankPredictionMessage}
            estimatedStudyHours={estimatedStudyHours}
            studyTimeMessage={studyTimeMessage}
            aiStudyPlan={aiStudyPlan}
            analyticsMessage={analyticsMessage}
            weakestSubject={weakestSubject}
            smartRecommendation={smartRecommendation}
            performanceChartData={performanceChartData}
            subjectChartData={subjectChartData}
            chartColors={chartColors}
          />
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/profile/setup"
  element={
    requireLogin() ? (
      <StudentLearnerProfileRoute
        user={user}
        activePlan={activeAccessPlan}
        accessStatus={accessProfile?.accessStatus || "active"}
        membershipExpiry={activeAccessExpiry}
      />
    ) : null
  }
/>

<Route
  path="/my-profile"
  element={
    requireLogin() ? (
      <StudentLearnerProfileRoute
        user={user}
        activePlan={activeAccessPlan}
        accessStatus={accessProfile?.accessStatus || "active"}
        membershipExpiry={activeAccessExpiry}
      />
    ) : null
  }
/>


<Route
  path="/my-courses"
  element={
    requireLogin() ? (
      <section className="coursePages myCoursesPage">
        <div className="sectionHeader">
          <span className="badge">My Courses</span>

          <h2>Your Enrolled Courses</h2>

          <p>
            Access your purchased CTET/TET learning programs.
          </p>

          <button
            className="btnPrimary"
            onClick={() => navigate("/student-dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/my-notes"
  element={
    requireLogin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">My Notes</span>

          <h2>Premium Notes Library</h2>

          <p>
            Access your saved and premium study materials.
          </p>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/my-tests"
  element={
    requireLogin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">My Tests</span>

          <h2>Mock Test Analytics</h2>

          <p>
            Track mock attempts, accuracy, and performance insights.
          </p>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/payment"
  element={
    requireLogin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">Upgrade Plan</span>

          <h2>Choose Premium Access</h2>

          <p>
            Unlock premium learning features and mentor guidance.
          </p>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/payment-history"
  element={
    requireLogin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">Payment History</span>

          <h2>Your Purchase Records</h2>

          <p>
            View payment requests, approvals, and subscriptions.
          </p>
        </div>
      </section>
    ) : null
  }
/>


<Route
  path="/ai-classroom"
  element={
    requireLogin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">AI Classroom</span>

          <h2>AspireNest AI Learning Center</h2>

          <p>
            Smart revision, AI guidance, analytics,
            and adaptive learning tools.
          </p>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">Admin Dashboard</span>

          <h2>AspireNest Admin Control Center</h2>

          <p>
            Manage students, mentors, content,
            payments, analytics, and platform systems.
          </p>
        </div>

        <div className="courseGrid">
          <button onClick={() => { setActiveAdminTab("Dashboard"); navigate("/admin"); }}>
            📊 Dashboard
          </button>

          <button onClick={() => { setActiveAdminTab("Enquiries"); navigate("/admin/enquiries"); }}>
            📩 Enquiries
          </button>

          <button onClick={() => { setActiveAdminTab("Students"); navigate("/admin/students"); }}>
            👨‍🎓 Students
          </button>

          <button onClick={() => { setActiveAdminTab("Notes"); navigate("/admin/notes"); }}>
            📘 Notes CMS
          </button>

          <button onClick={() => { setActiveAdminTab("Mock Tests"); navigate("/admin/mock-tests"); }}>
            📝 Mock Tests CMS
          </button>

          <button onClick={() => { setActiveAdminTab("Current Affairs"); navigate("/admin/current-affairs"); }}>
            📰 Current Affairs CMS
          </button>

          <button onClick={() => { setActiveAdminTab("Payments"); navigate("/admin/content/payments"); }}>
            💳 Payments
          </button>

          <button onClick={() => { setActiveAdminTab("Analytics"); navigate("/admin/analytics"); }}>
            📊 Analytics
          </button>

          <button onClick={() => { setActiveAdminTab("Announcements"); navigate("/admin/announcements"); }}>
            📢 Announcements
          </button>

          <button onClick={() => { setActiveAdminTab("Universal CMS"); navigate("/admin/universal-cms"); }}>
            🌍 Universal CMS
          </button>

          <button
  onClick={() => {
    setActiveAdminTab("Content Studio");
    navigate("/admin/content");
  }}
>
  🧩 Content Studio
</button>

        </div>

        <div style={{ marginTop: "30px" }}>
          <AdminPanel
            user={user}
            isAdmin={isAdmin(user)}
            activeAdminTab="Dashboard"
            setActiveAdminTab={setActiveAdminTab}
            students={students || []}
            enquiries={enquiries || []}
            mockResults={mockResults || []}
            leaderboard={leaderboard || []}
            mockQuestions={mockQuestions || []}
            adminQuestion={adminQuestion}
            setAdminQuestion={setAdminQuestion}
            adminOption1={adminOption1}
            setAdminOption1={setAdminOption1}
            adminOption2={adminOption2}
            setAdminOption2={setAdminOption2}
            adminOption3={adminOption3}
            setAdminOption3={setAdminOption3}
            adminOption4={adminOption4}
            setAdminOption4={setAdminOption4}
            adminAnswer={adminAnswer}
            setAdminAnswer={setAdminAnswer}
            adminSubject={adminSubject}
            setAdminSubject={setAdminSubject}
            adminLevel={adminLevel}
            setAdminLevel={setAdminLevel}
            adminAccessPlan={adminAccessPlan}
            setAdminAccessPlan={setAdminAccessPlan}
            notesData={[]}
            firebaseNotes={firebaseNotes || []}
            currentAffairs={currentAffairsList || []}
            currentAffairsList={currentAffairsList || []}
            fallbackCurrentAffairs={currentAffairsList || []}
            announcements={announcements || []}
            paymentHistory={paymentHistory || []}
            loadAdminData={loadAdminData}
            loadLeaderboard={loadLeaderboard}
            loadPaymentHistory={loadPaymentHistory}
            handlePremiumControl={handlePremiumControl}
            handleDeleteMockQuestion={handleDeleteMockQuestion}
            handleAddMockQuestion={handleAddMockQuestion}
            handleSaveNote={handleSaveNote}
            handleEditNote={handleEditNote}
            handleDeleteNote={handleDeleteNote}
            handleSaveCurrentAffairs={handleSaveCurrentAffairs}
            handleEditCurrentAffairs={handleEditCurrentAffairs}
            handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
            handleAddAnnouncement={handleAddAnnouncement}
            handleDeleteAnnouncement={handleDeleteAnnouncement}
          />
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/access"
  element={requireAdmin() ? <AdminAccessHomeRoute /> : null}
/>

<Route
  path="/admin/content/access/add"
  element={requireAdmin() ? <AdminAccessAddRoute /> : null}
/>

<Route
  path="/admin/content/access/manage"
  element={requireAdmin() ? <AdminAccessManageRoute user={user} isAdmin={isAdmin} /> : null}
/>

<Route
  path="/admin/content/access/bulk"
  element={requireAdmin() ? <AdminAccessBulkRoute /> : null}
/>

<Route
  path="/admin/content/access/invites"
  element={requireAdmin() ? <AdminAccessInvitesRoute /> : null}
/>

<Route
  path="/admin/content/access/products"
  element={requireAdmin() ? <AdminAccessProductsRoute /> : null}
/>

<Route
  path="/admin/content/access/keys"
  element={requireAdmin() ? <AdminAccessKeysRoute /> : null}
/>

<Route
  path="/admin/content/access/profile/:emailKey"
  element={requireAdmin() ? <AdminAccessProfileRoute /> : null}
/>

<Route
  path="/admin/content/access/audit"
  element={requireAdmin() ? <AdminAccessAuditRoute /> : null}
/>

<Route
  path="/admin/content/experience"
  element={
    requireAdmin() ? (
      <AdminExperienceEventsRoute
        universalContent={universalContent}
        currentAffairs={currentAffairsList}
        roadmaps={ctetNotificationRoadmaps}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/payments"
  element={
    requireAdmin() ? (
      <AdminPaymentVerificationRoute
        paymentRequests={paymentRequests || []}
        loadPaymentRequests={loadPaymentRequests}
        approvePaymentRequest={approvePaymentRequest}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/courses"
  element={requireAdmin() ? <Navigate to="/admin/content" replace /> : <Navigate to="/login" replace />}
/>

<Route
  path="/admin/content"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">
          CONTENT STUDIO
        </span>

        <h1>
          AspireNest Content Studio
        </h1>

        <p>
          Manage notes, current affairs,
          videos, mock tests, banners,
          announcements, and future
          learning content from one
          professional publishing system.
        </p>
      </div>

      <div className="subjectHubGrid">

        <button
         onClick={() =>
          navigate("/admin/content/notes")
        }
        >
          📘 Notes Manager
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/current-affairs"
            )
          }
        >
          📰 Current Affairs
        </button>

        <button
          onClick={() =>
            navigate("/admin/content/videos")
          }
        >
          🎥 Videos Manager
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/mock-tests"
            )
          }
        >
          🧠 Mock Tests
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/courses"
            )
          }
        >
          🎓 Courses
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/banners"
            )
          }
        >
          🖼 Banner Manager
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/announcements"
            )
          }
        >
          📢 Announcements
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/roadmaps"
            )
          }
        >
          🛣️ Roadmap Studio
        </button>

                  <button
            onClick={() =>
              navigate("/admin/content/experience")
            }
          >
            ✨ Experience Studio
          </button>

<button
          onClick={() =>
            navigate(
              "/admin/content/access"
            )
          }
        >
          🔐 Access Manager
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/pricing"
            )
          }
        >
          💳 Pricing Manager
        </button>

        <button
          onClick={() =>
            navigate(
              "/admin/content/payments"
            )
          }
        >
          Payment Verification
        </button>

      </div>
    </section>
  }
/>


<Route
  path="/admin/content/notes"
  element={
    <AdminNotesHomeRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/admin/content/notes/form"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">NOTES FORM</span>

          <h1>
            {editingNotesCmsId
              ? "Edit Note Content"
              : "Add New Note"}
          </h1>

          <p>
            Add or update CTET/TET notes,
            PDF links, subjects, chapters,
            and plan-based access.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
            <input
              type="text"
              placeholder="Content Title"
              value={notesCmsTitle}
              onChange={(e) =>
                setNotesCmsTitle(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Short Description"
              value={notesCmsDescription}
              onChange={(e) =>
                setNotesCmsDescription(e.target.value)
              }
            />

            <select
              value={notesCmsPlanType}
              onChange={(e) =>
                setNotesCmsPlanType(e.target.value)
              }
            >
              <option>FREE</option>
              <option>BASIC</option>
              <option>PREMIUM</option>
              <option>MENTORSHIP</option>
            </select>
            <input
  type="text"
  list="notesSubjectSuggestions"
  placeholder="Select or type Subject"
  value={notesCmsSubject}
  onChange={(e) =>
    setNotesCmsSubject(e.target.value)
  }
/>

<datalist id="notesSubjectSuggestions">
  {[
    ...new Set([
      ...notesSubjectsList
        .map((subject) => subject.name)
        .filter(Boolean),

      ...universalContent
        .map((item) => item.subject)
        .filter(Boolean),
    ]),
  ]
    .map((name) => name.trim())
    .filter((name) => {
      if (!name) return false;
      if (name.length < 2) return false;
      if (/^[a-zA-Z0-9]{15,}$/.test(name)) return false;

      return true;
    })
    .filter(
      (name, index, array) =>
        array.findIndex(
          (item) =>
            item.toLowerCase() === name.toLowerCase()
        ) === index
    )
    .map((name) => (
      <option key={name} value={name} />
    ))}
</datalist>

<input
  type="text"
  list="notesChapterSuggestions"
  placeholder={
    notesCmsSubject
      ? "Select or type Chapter / Topic"
      : "Select subject first"
  }
  value={notesCmsChapter}
  onChange={(e) =>
    setNotesCmsChapter(e.target.value)
  }
  disabled={!notesCmsSubject}
/>

<datalist id="notesChapterSuggestions">
  {filteredNotesChapters.map((chapter) => (
    <option
      key={chapter.id}
      value={chapter.name}
    />
  ))}
</datalist>

            <input
              type="text"
              placeholder="Month"
              value={notesCmsMonth}
              onChange={(e) =>
                setNotesCmsMonth(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Year"
              value={notesCmsYear}
              onChange={(e) =>
                setNotesCmsYear(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="PDF URL"
              value={notesCmsPdfUrl}
              onChange={(e) =>
                setNotesCmsPdfUrl(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Thumbnail URL"
              value={notesCmsThumbnailUrl}
              onChange={(e) =>
                setNotesCmsThumbnailUrl(e.target.value)
              }
            />

            <select
              value={notesCmsStatus}
              onChange={(e) =>
                setNotesCmsStatus(e.target.value)
              }
            >
              <option>Draft</option>
              <option>Published</option>
              <option>Archived</option>
            </select>
          </div>

          <div className="contentStudioActions">
            <button
              className="publishButton"
              onClick={handlePublishNotesContent}
            >
              {editingNotesCmsId
                ? "Update Content"
                : "Publish Content"}
            </button>

            <button
              className="backButton"
              onClick={() => navigate("/admin/content/notes")}
            >
              ← Back to Notes Manager
            </button>
          </div>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/notes/manage"
  element={
    requireAdmin() ? (
      <AdminNotesManageRoute
        universalContent={universalContent}
        notesPlanFilter={notesPlanFilter}
        setNotesPlanFilter={setNotesPlanFilter}
        onBackfillProtectedNotesAssets={handleBackfillProtectedNotesAssets}
        onEditNote={(item) => {
          setEditingNotesCmsId(item.id);
          setNotesCmsTitle(item.title || "");
          setNotesCmsDescription(item.description || "");
          setNotesCmsPlanType(item.planType || "FREE");
          setNotesCmsSubject(item.subject || "");
          setNotesCmsChapter(item.chapter || "");
          setNotesCmsMonth(item.month || "");
          setNotesCmsYear(item.year || "");
          setNotesCmsWeek(item.week || "");
          setNotesCmsPdfUrl(
            item.pdfUrl ||
              item.fileUrl ||
              item.pdf ||
              item.url ||
              ""
          );
          setNotesCmsThumbnailUrl(item.thumbnailUrl || "");
          setNotesCmsStatus(item.status || "Draft");

          navigate("/admin/content/notes/form");
        }}
        onDeleteNote={(item) => {
          handleDeleteLocalContentItem(item.id);
        }}
      />
    ) : null
  }
/>



<Route
  path="/admin/content/notes/subjects"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">SUBJECT MANAGER</span>

          <h1>Notes Subject Manager</h1>

          <p>
            Create and manage official subject names,
            short codes, order, and active status.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">


<input
  type="text"
  placeholder="Subject Name"
  value={notesSubjectName}
  onChange={(e) =>
    setNotesSubjectName(e.target.value)
  }
/>

<input
  type="text"
  placeholder="Short Code e.g. CDP"
  value={notesSubjectCode}
  onChange={(e) =>
    setNotesSubjectCode(e.target.value)
  }
/>

<input
  type="text"
  placeholder="Slug e.g. cdp"
  value={notesSubjectSlug}
  onChange={(e) =>
    setNotesSubjectSlug(e.target.value)
  }
/>

<input
  type="number"
  placeholder="Order"
  value={notesSubjectOrder}
  onChange={(e) =>
    setNotesSubjectOrder(e.target.value)
  }
/>

<select
  value={notesSubjectStatus}
  onChange={(e) =>
    setNotesSubjectStatus(e.target.value)
  }
>
  <option>Active</option>
  <option>Inactive</option>
</select>
          </div>

          <div className="contentStudioActions">

          <button
  className="publishButton"
  onClick={handleSaveNotesSubject}
>
  {editingNotesSubjectId
    ? "Update Subject"
    : "Save Subject"}
</button>

            <button
              className="backButton"
              onClick={() => navigate("/admin/content/notes")}
            >
              ← Back to Notes Manager
            </button>
          </div>
        </div>

        <div className="contentStudioList">
  <h3>Saved Subjects</h3>

  {[
    ...new Map(
      notesSubjectsList.map((subject) => [
        (subject.name || "")
          .trim()
          .toLowerCase(),
        subject,
      ])
    ).values(),
  ].map((subject) => (
    <div
      className="contentStudioItem"
      key={subject.id}
    >
      <strong>
        {subject.name}
      </strong>

      <div className="contentStudioActions">
        <button
          className="publishButton"
          onClick={() => {
            setEditingNotesSubjectId(subject.id);
            setNotesSubjectName(subject.name || "");
            setNotesSubjectCode(subject.code || "");
            setNotesSubjectSlug(subject.slug || "");
            setNotesSubjectOrder(subject.order || "");
            setNotesSubjectStatus(
              subject.status || "Active"
            );

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        >
          Edit Subject
        </button>
      </div>

      <p>
        {subject.code || "-"} •{" "}
        {subject.slug || "-"} • Order{" "}
        {subject.order || 0} •{" "}
        {subject.status || "Active"}
      </p>

      <button
        className="deleteContentButton"
        onClick={async () => {
          if (
            window.confirm(
              `Delete "${subject.name}" permanently?

All chapters and PDFs linked to this subject may become inaccessible.

This action cannot be undone.`
            )
          ) {
            try {
              await deleteDoc(
                doc(
                  db,
                  "notesSubjects",
                  subject.id
                )
              );

              await loadNotesSubjectsFromFirestore();

              alert(
                "Subject deleted permanently."
              );
            } catch (error) {
              console.error(error);

              alert(
                "Unable to delete subject."
              );
            }
          }
        }}
      >
        Delete Subject
      </button>
    </div>
  ))}
</div>

      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/notes/chapters"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">CHAPTER MANAGER</span>

          <h1>Notes Chapter Manager</h1>

          <p>
            Create and manage chapter names,
            short codes, order, and active status.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
          <select
  value={notesChapterSubjectId}
  onChange={(e) =>
    setNotesChapterSubjectId(e.target.value)
  }
>
  <option value="">
    Select Subject
  </option>

  {notesSubjectsList.map((subject) => (
    <option
      key={subject.id}
      value={subject.id}
    >
      {subject.name}
    </option>
  ))}
</select>
            <input
              type="text"
              placeholder="Chapter Name"
              value={notesChapterName}
              onChange={(e) =>
                setNotesChapterName(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Short Code e.g. CDP-01"
              value={notesChapterCode}
              onChange={(e) =>
                setNotesChapterCode(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Slug e.g. child-development"
              value={notesChapterSlug}
              onChange={(e) =>
                setNotesChapterSlug(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Order"
              value={notesChapterOrder}
              onChange={(e) =>
                setNotesChapterOrder(e.target.value)
              }
            />

            <select
              value={notesChapterStatus}
              onChange={(e) =>
                setNotesChapterStatus(e.target.value)
              }
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="contentStudioActions">
            <button
              className="publishButton"
              onClick={handleSaveNotesChapter}
            >
              {editingNotesChapterId
                ? "Update Chapter"
                : "Save Chapter"}
            </button>

            <button
              className="backButton"
              onClick={() =>
                navigate("/admin/content/notes")
              }
            >
              ← Back to Notes Manager
            </button>
          </div>
        </div>

        <div className="contentStudioList">
          <h3>Saved Chapters</h3>

          {notesChaptersList.map((chapter) => (
            <div
              className="contentStudioItem"
              key={chapter.id}
            >
              <strong>{chapter.name}</strong>

              <div className="contentStudioActions">
                <button
                  className="publishButton"
                  onClick={() => {
                    setEditingNotesChapterId(chapter.id);
                    setNotesChapterSubjectId(chapter.subjectId || "");
                    setNotesChapterName(chapter.name);
                    setNotesChapterCode(chapter.code);
                    setNotesChapterSlug(chapter.slug);
                    setNotesChapterOrder(chapter.order);
                    setNotesChapterStatus(chapter.status);

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                >
                  Edit Chapter
                </button>
              </div>

              <p>
  {chapter.subjectName ||
    notesSubjectsList.find(
      (subject) => subject.id === chapter.subjectId
    )?.name ||
    "No Subject"}{" "}
  • {chapter.code} • {chapter.slug} •
  Order {chapter.order} • {chapter.status}
</p>

              <button
                className="deleteContentButton"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${chapter.name}" permanently?

                    All PDFs linked to this chapter may become inaccessible.

                    This action cannot be undone.`
                    )
                  ) {
                    setNotesChaptersList(
                      notesChaptersList.filter(
                        (item) => item.id !== chapter.id
                      )
                    );
                  }
                }}
              >
                Delete Chapter
              </button>
            </div>
          ))}
        </div>
      </section>
    ) : null
  }
/>
<Route
  path="/admin/content/notes/pdfs"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">PDF MANAGER</span>

          <h1>Saved Notes PDFs</h1>

          <p>
            Review, edit, preview, and delete all saved notes PDFs
            from one clean manager page.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioActions">
            <button
              className="publishButton"
              onClick={() => {
                setEditingNotesCmsId(null);
                setNotesCmsTitle("");
                setNotesCmsDescription("");
                setNotesCmsPlanType("FREE");
                setNotesCmsSubject("");
                setNotesCmsChapter("");
                setNotesCmsMonth("");
                setNotesCmsWeek("");
                setNotesCmsYear("");
                setNotesCmsPdfUrl("");
                setNotesCmsThumbnailUrl("");
                setNotesCmsStatus("Draft");

                navigate("/admin/content/notes/form");
              }}
            >
              + Add New PDF
            </button>

            <button
              className="backButton"
              onClick={() => navigate("/admin/content/notes")}
            >
              ← Back to Notes Manager
            </button>
          </div>
        </div>

        <div className="contentStudioList">
          <h3>Saved PDFs</h3>

          {universalNotes.length === 0 ? (
            <p>No notes PDFs found.</p>
          ) : (
            universalNotes.map((note) => (
              <div
                className="contentStudioItem"
                key={note.id}
              >
                <div>
                  <strong>{note.title}</strong>

                  <p>
                    {note.subject || "No Subject"} •{" "}
                    {note.chapter || "No Chapter"} •{" "}
                    {note.planType || "FREE"} •{" "}
                    {note.status || "Draft"}
                  </p>
                </div>

                <div className="contentStudioActions">
                  <button
                    className="publishButton"
                    onClick={() =>
                      window.open(
                        note.pdfUrl || note.fileUrl,
                        "_blank"
                      )
                    }
                  >
                    Preview PDF
                  </button>

                  <button
                    className="publishButton"
                    onClick={() => {
                      setEditingNotesCmsId(note.id);
                      setNotesCmsTitle(note.title || "");
                      setNotesCmsDescription(
                        note.description || ""
                      );
                      setNotesCmsPlanType(
                        note.planType || "FREE"
                      );
                      setNotesCmsSubject(note.subject || "");
                      setNotesCmsChapter(note.chapter || "");
                      setNotesCmsMonth(note.month || "");
                      setNotesCmsWeek(note.week || "");
                      setNotesCmsYear(note.year || "");
                      setNotesCmsPdfUrl(
                        note.pdfUrl || note.fileUrl || ""
                      );
                      setNotesCmsThumbnailUrl(
                        note.thumbnailUrl || ""
                      );
                      setNotesCmsStatus(
                        note.status || "Draft"
                      );

                      navigate("/admin/content/notes/form");
                    }}
                  >
                    Edit PDF
                  </button>

                  <button
                    className="deleteContentButton"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${note.title}" permanently?`
                        )
                      ) {
                        handleDeleteLocalContentItem(note.id);
                      }
                    }}
                  >
                    Delete PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/notes/plan/:planType"
  element={
    <AdminNotesPlanRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/admin/content/notes/plan/:planType/:subjectName"
  element={
    <AdminNotesSubjectRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/admin/content/notes/plan/:planType/:subjectName/:chapterName"
  element={
    <AdminNotesChapterRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/admin/content/current-affairs"
  element={
    requireAdmin() ? (
      <AdminCurrentAffairsHomeRoute
        universalCurrentAffairs={universalCurrentAffairs}
        currentAffairsList={currentAffairsList}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/current-affairs/add"
  element={
    requireAdmin() ? (
      <AdminCurrentAffairsAddRoute
        editingCmsId={editingCmsId}
        cmsTitle={cmsTitle}
        setCmsTitle={setCmsTitle}
        cmsMonth={cmsMonth}
        setCmsMonth={setCmsMonth}
        cmsDuration={cmsDuration}
        setCmsDuration={setCmsDuration}
        cmsChapter={cmsChapter}
        setCmsChapter={setCmsChapter}
        cmsPlanType={cmsPlanType}
        setCmsPlanType={setCmsPlanType}
        cmsFileUrl={cmsFileUrl}
        setCmsFileUrl={setCmsFileUrl}
        cmsStatus={cmsStatus}
        setCmsStatus={setCmsStatus}
        handleSaveCurrentAffairsContent={handleSaveCurrentAffairsContent}
        planTypes={PLAN_TYPES}
        contentStatus={CONTENT_STATUS}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/current-affairs/manage"
  element={
    requireAdmin() ? (
      <AdminCurrentAffairsManageRoute
        universalCurrentAffairs={universalCurrentAffairs}
        setEditingCmsId={setEditingCmsId}
        setCmsTitle={setCmsTitle}
        setCmsMonth={setCmsMonth}
        setCmsDuration={setCmsDuration}
        setCmsChapter={setCmsChapter}
        setCmsPlanType={setCmsPlanType}
        setCmsFileUrl={setCmsFileUrl}
        setCmsStatus={setCmsStatus}
        deleteContentItem={deleteContentItem}
        loadContentItemsFromFirestore={loadContentItemsFromFirestore}
        planTypes={PLAN_TYPES}
        contentStatus={CONTENT_STATUS}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/current-affairs/months"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            CURRENT AFFAIRS MONTHS
          </span>

          <h1>Current Affairs Month Library</h1>

          <p>
            All current affairs are automatically grouped by Month + Year.
          </p>
        </div>

        <div className="subjectHubGrid">
          {[...new Set(
            universalCurrentAffairs
              .map((item) => item.month)
              .filter(Boolean)
          )].map((month) => {
            const monthItems = universalCurrentAffairs.filter(
              (item) => item.month === month
            );

            return (
              <button
                key={month}
                onClick={() =>
                  navigate(
                    `/admin/content/current-affairs/months/${month
                      .toLowerCase()
                      .trim()
                      .replace(/\s+/g, "-")}`
                  )
                }
              >
                {month}
                <br />
                <small>
                  {monthItems.length} PDF
                  {monthItems.length > 1 ? "s" : ""}
                </small>
              </button>
            );
          })}

          <button
            onClick={() =>
              navigate("/admin/content/current-affairs")
            }
          >
            ← Back to Current Affairs
          </button>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/current-affairs/months/:monthId"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const formatSlug = (value = "") =>
            value
              .toString()
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "-");

          const activeMonthId = location.pathname
            .split("/")
            .pop();

          const monthItems = universalCurrentAffairs.filter(
            (item) => formatSlug(item.month) === activeMonthId
          );

          const monthTitle =
            monthItems[0]?.month || "Current Affairs Month";

          const groupedWeeks = monthItems.reduce((groups, item) => {
            const weekName =
            item.week?.trim() ||
            item.chapter?.trim() ||
            "Monthly PDFs";

            if (!groups[weekName]) {
              groups[weekName] = [];
            }

            groups[weekName].push(item);
            return groups;
          }, {});

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  CURRENT AFFAIRS MONTH
                </span>

                <h1>{monthTitle}</h1>

                <p>
                  View weekly, monthly, and yearly current affairs PDFs for this month.
                </p>
              </div>

              <div className="contentStudioList">
                {Object.keys(groupedWeeks).length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No PDFs found for this month.</strong>
                    <p>
                      Add PDFs from Add Current Affair and select this month.
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedWeeks).map(([weekName, items]) => (
                    <div className="contentStudioItem" key={weekName}>
                   <div className="sectionHeader">
  <h2>{weekName}</h2>

  <p>
    {items.length} PDF{items.length > 1 ? "s" : ""} in {monthTitle}
  </p>
</div>

                      <div className="contentStudioList">
                        {items.map((item) => (
                          <div className="contentStudioItem" key={item.id}>
                            <strong>{item.title}</strong>

                            <p>
                              {item.month} • {item.chapter} • {item.planType} • {item.status}
                            </p>

                            <div className="contentStudioActions">
                              <button
                                className="backButton"
                                onClick={() =>
                                  window.open(item.fileUrl, "_blank")
                                }
                              >
                                Open PDF
                              </button>

                              <button
                                className="backButton"
                                onClick={() => {
                                  setEditingCmsId(item.id);
                                  setCmsTitle(item.title || "");

                                  const monthParts = (item.month || "").split(" ");
                                  setCmsMonth(monthParts[0] || "");
                                  setCmsDuration(monthParts[1] || "");

                                  setCmsChapter(item.chapter || "");
                                  setCmsPlanType(item.planType || PLAN_TYPES.FREE);
                                  setCmsFileUrl(item.fileUrl || "");
                                  setCmsStatus(
                                    item.status || CONTENT_STATUS.PUBLISHED
                                  );

                                  navigate(
                                    "/admin/content/current-affairs/add"
                                  );
                                }}
                              >
                                Edit
                              </button>

                              <button
  className="backButton"
  onClick={async () => {
    const newStatus =
      item.status === CONTENT_STATUS.PUBLISHED
        ? CONTENT_STATUS.DRAFT
        : CONTENT_STATUS.PUBLISHED;

    await updateContentItem(item.id, {
      status: newStatus,
    });

    await loadContentItemsFromFirestore();

    alert(
      newStatus === CONTENT_STATUS.PUBLISHED
        ? "Current affair published successfully ✅"
        : "Current affair unpublished successfully ✅"
    );
  }}
>
  {item.status === CONTENT_STATUS.PUBLISHED
    ? "Unpublish"
    : "Publish"}
</button>

                              <button
                                className="backButton"
                                onClick={async () => {
                                  const confirmDelete = window.confirm(
                                    `Delete "${item.title}" permanently?

Students may lose access to this current affair PDF.

This action cannot be undone.`
                                  );

                                  if (!confirmDelete) return;

                                  await deleteContentItem(item.id);
                                  await loadContentItemsFromFirestore();

                                  alert(
                                    "Current affair deleted successfully ✅"
                                  );
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="contentStudioActions">
                <button
                  className="backButton"
                  onClick={() =>
                    navigate("/admin/content/current-affairs/months")
                  }
                >
                  ← Back to Months
                </button>

                <button
                  className="publishButton"
                  onClick={() =>
                    navigate("/admin/content/current-affairs/add")
                  }
                >
                  + Add Current Affair
                </button>
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/current-affairs/published"
  element={
    requireAdmin() ? (
      <section className="coursePages currentAffairsPublishedPage">
        <div className="sectionHeader">
          <span className="badge">
            PUBLISHED CURRENT AFFAIRS
          </span>

          <h1>Published Current Affairs PDFs</h1>

          <p>
            Manage all published CTET/TET current affairs PDFs
            visible to students by month, week, plan, and status.
          </p>
        </div>

        <div className="contentStudioList">
          {universalCurrentAffairs.filter(
            (item) =>
              item.status === CONTENT_STATUS.PUBLISHED ||
              item.status === "published"
          ).length === 0 ? (
            <div className="contentStudioItem">
              <strong>No published PDFs found.</strong>

              <p>
                Publish current affairs from the manager or month
                detail page first.
              </p>
            </div>
          ) : (
            universalCurrentAffairs
              .filter(
                (item) =>
                  item.status === CONTENT_STATUS.PUBLISHED ||
                  item.status === "published"
              )
              .map((item) => {
                const monthSlug = (item.month || "")
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, "-");

                return (
                  <div className="contentStudioItem" key={item.id}>
                    <strong>{item.title}</strong>

                    <p>
  {item.month || "No Month"}{" "}
  •{" "}
  {item.week || item.chapter || "Monthly PDFs"}{" "}
  •{" "}
  {item.planType || PLAN_TYPES.FREE}{" "}
  •{" "}
  {item.status || CONTENT_STATUS.PUBLISHED}
</p>

                    <div className="contentStudioActions">
                      <button
                        className="backButton"
                        onClick={() =>
                          window.open(item.fileUrl, "_blank")
                        }
                      >
                        Open PDF
                      </button>

                      <button
                        className="backButton"
                        onClick={() => {
                          setEditingCmsId(item.id);
                          setCmsTitle(item.title || "");

                          const monthParts =
                            (item.month || "").split(" ");

                          setCmsMonth(monthParts[0] || "");
                          setCmsDuration(monthParts[1] || "");

                          setCmsChapter(item.week || item.chapter || "");
                          setCmsPlanType(
                            item.planType || PLAN_TYPES.FREE
                          );
                          setCmsFileUrl(item.fileUrl || "");
                          setCmsStatus(
                            item.status || CONTENT_STATUS.PUBLISHED
                          );

                          navigate(
                            "/admin/content/current-affairs/add"
                          );
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="backButton"
                        onClick={async () => {
                          await updateContentItem(item.id, {
                            status: CONTENT_STATUS.DRAFT,
                          });

                          await loadContentItemsFromFirestore();

                          alert(
                            "Current affair unpublished successfully ✅"
                          );
                        }}
                      >
                        Unpublish
                      </button>

                      <button
                        className="backButton"
                        onClick={() =>
                          navigate(
                            `/admin/content/current-affairs/months/${monthSlug}`
                          )
                        }
                      >
                        View Month
                      </button>

                      <button
                        className="backButton"
                        onClick={async () => {
                          const confirmDelete = window.confirm(
                            `Delete "${item.title}" permanently?

Students may lose access to this current affair PDF.

This action cannot be undone.`
                          );

                          if (!confirmDelete) return;

                          await deleteContentItem(item.id);
                          await loadContentItemsFromFirestore();

                          alert(
                            "Current affair deleted successfully ✅"
                          );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() =>
              navigate("/admin/content/current-affairs")
            }
          >
            ← Back to Current Affairs Manager
          </button>

          <button
            className="publishButton"
            onClick={() =>
              navigate("/admin/content/current-affairs/add")
            }
          >
            + Add Current Affair
          </button>

          <button
            className="backButton"
            onClick={() =>
              navigate("/admin/content/current-affairs/months")
            }
          >
            View Months
          </button>
        </div>
      </section>
    ) : null
  }
/>


<Route
  path="/admin/content/videos"
  element={
    requireAdmin() ? (
      <VideoManagerHome universalContent={universalContent} />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/add"
  element={
    requireAdmin() ? (
      <VideoClassFormRoute
        db={db}
        universalContent={universalContent}
        notesSubjectsList={notesSubjectsList}
        notesChaptersList={notesChaptersList}
        reloadSubjects={loadNotesSubjectsFromFirestore}
        reloadChapters={loadNotesChaptersFromFirestore}
        reloadContent={loadContentItemsFromFirestore}
      />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>


<Route
  path="/admin/content/videos/manage"
  element={
    requireAdmin() ? (
      <VideoLibraryManageRoute
        db={db}
        universalContent={universalContent}
        reloadContent={loadContentItemsFromFirestore}
      />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/subjects"
  element={
    requireAdmin() ? (
      <VideoSubjectsRoute universalContent={universalContent} />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/:subjectName"
  element={
    requireAdmin() ? (
      <VideoChaptersRoute universalContent={universalContent} />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <VideoChapterClassesRoute universalContent={universalContent} />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/published"
  element={
    requireAdmin() ? (
      <VideoPublishedRoute universalContent={universalContent} />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>


<Route
  path="/admin/content/mock-tests"
  element={requireAdmin() ? <AdminMockTestHomeRoute /> : null}
/>


<Route
  path="/admin/content/mock-tests/add"
  element={
    requireAdmin() ? (
      <AdminMockTestAddRoute
        editingMockTestId={editingMockTestId}
        mockTestForm={mockTestForm}
        setMockTestForm={setMockTestForm}
        notesSubjectsList={notesSubjectsList}
        notesChaptersList={notesChaptersList}
        mockTestQuestionsForm={mockTestQuestionsForm}
        setMockTestQuestionsForm={setMockTestQuestionsForm}
        createEmptyMockQuestion={createEmptyMockQuestion}
        handleSaveMockTest={handleSaveMockTest}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/manage"
  element={
    requireAdmin() ? (
      <AdminMockTestManageRoute
        db={db}
        universalContent={universalContent}
        mockResults={mockResults}
        mockTestSearch={mockTestSearch}
        setMockTestSearch={setMockTestSearch}
        mockTestStatusFilter={mockTestStatusFilter}
        setMockTestStatusFilter={setMockTestStatusFilter}
        mockTestExamFilter={mockTestExamFilter}
        setMockTestExamFilter={setMockTestExamFilter}
        mockTestSortMode={mockTestSortMode}
        setMockTestSortMode={setMockTestSortMode}
        mockTestPlanFilter={mockTestPlanFilter}
        setMockTestPlanFilter={setMockTestPlanFilter}
        selectedMockTestIds={selectedMockTestIds}
        setSelectedMockTestIds={setSelectedMockTestIds}
        mockTestPage={mockTestPage}
        setMockTestPage={setMockTestPage}
        mockTestsPerPage={mockTestsPerPage}
        mockImportXlsxUrl={mockImportXlsxUrl}
        setMockImportXlsxUrl={setMockImportXlsxUrl}
        loadContentItemsFromFirestore={loadContentItemsFromFirestore}
        handleImportMockTestJson={handleImportMockTestJson}
        handleImportMockTestXlsx={handleImportMockTestXlsx}
        handleDownloadMockTestXlsxTemplate={
          handleDownloadMockTestXlsxTemplate
        }
        openMockActionPortal={openMockActionPortal}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/question-bank"
  element={
    requireAdmin() ? (
      <AdminMockTestQuestionBankRoute
        db={db}
        questionBankItems={questionBankItems}
        questionBankSearch={questionBankSearch}
        setQuestionBankSearch={setQuestionBankSearch}
        questionBankSubjectFilter={questionBankSubjectFilter}
        setQuestionBankSubjectFilter={setQuestionBankSubjectFilter}
        questionBankChapterFilter={questionBankChapterFilter}
        setQuestionBankChapterFilter={setQuestionBankChapterFilter}
        questionBankDifficultyFilter={questionBankDifficultyFilter}
        setQuestionBankDifficultyFilter={setQuestionBankDifficultyFilter}
        selectedQuestionBankIds={selectedQuestionBankIds}
        setSelectedQuestionBankIds={setSelectedQuestionBankIds}
        setEditingQuestionBankId={setEditingQuestionBankId}
        loadQuestionBankFromFirestore={loadQuestionBankFromFirestore}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/preview/:testId"
  element={
    requireAdmin() ? (
      <AdminMockTestPreviewRoute
        universalContent={universalContent}
        setEditingMockTestId={setEditingMockTestId}
        setMockTestForm={setMockTestForm}
        setMockTestQuestionsForm={setMockTestQuestionsForm}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/plan/:planType"
  element={
    requireAdmin() ? (
      <AdminMockTestPlanRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/plan/:planType/:subjectName"
  element={
    requireAdmin() ? (
      <AdminMockTestPlanSubjectRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/plan/:planType/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <AdminMockTestPlanChapterRoute
        db={db}
        universalContent={universalContent}
        mockTestSearch={mockTestSearch}
        setMockTestSearch={setMockTestSearch}
        mockTestStatusFilter={mockTestStatusFilter}
        setMockTestStatusFilter={setMockTestStatusFilter}
        mockTestExamFilter={mockTestExamFilter}
        setMockTestExamFilter={setMockTestExamFilter}
        mockTestSortMode={mockTestSortMode}
        setMockTestSortMode={setMockTestSortMode}
        handleImportMockTestJson={handleImportMockTestJson}
        setEditingMockTestId={setEditingMockTestId}
        setMockTestForm={setMockTestForm}
        setMockTestQuestionsForm={setMockTestQuestionsForm}
        loadContentItemsFromFirestore={loadContentItemsFromFirestore}
        handleDeleteLocalContentItem={handleDeleteLocalContentItem}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/subjects"
  element={
    requireAdmin() ? (
      <AdminMockTestSubjectsRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/:subjectName"
  element={
    requireAdmin() ? (
      <AdminMockTestSubjectRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <AdminMockTestChapterRoute
        db={db}
        universalContent={universalContent}
        setEditingMockTestId={setEditingMockTestId}
        setMockTestForm={setMockTestForm}
        setMockTestQuestionsForm={setMockTestQuestionsForm}
        loadContentItemsFromFirestore={loadContentItemsFromFirestore}
        handleDeleteLocalContentItem={handleDeleteLocalContentItem}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/chapters"
  element={
    requireAdmin() ? (
      <AdminMockTestChaptersRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/chapters/:chapterName"
  element={
    requireAdmin() ? (
      <AdminMockTestChapterDetailRoute
        db={db}
        universalContent={universalContent}
        setEditingMockTestId={setEditingMockTestId}
        setMockTestForm={setMockTestForm}
        setMockTestQuestionsForm={setMockTestQuestionsForm}
        loadContentItemsFromFirestore={loadContentItemsFromFirestore}
        handleDeleteLocalContentItem={handleDeleteLocalContentItem}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/question-bank/:subjectName"
  element={
    requireAdmin() ? (
      <AdminMockTestQuestionBankSubjectRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/question-bank/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <AdminMockTestQuestionBankChapterRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/test-series"
  element={
    requireAdmin() ? (
      <AdminMockTestSeriesRoute
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/test-series/:seriesName"
  element={
    requireAdmin() ? (
      <AdminMockTestSeriesDetailRoute
        db={db}
        universalContent={universalContent}
        setEditingMockTestId={setEditingMockTestId}
        setMockTestForm={setMockTestForm}
        setMockTestQuestionsForm={setMockTestQuestionsForm}
        loadContentItemsFromFirestore={loadContentItemsFromFirestore}
        handleDeleteLocalContentItem={handleDeleteLocalContentItem}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/published"
  element={
    requireAdmin() ? (
      <AdminMockTestPublishedRoute
        db={db}
        universalContent={universalContent}
        setEditingMockTestId={setEditingMockTestId}
        setMockTestForm={setMockTestForm}
        setMockTestQuestionsForm={setMockTestQuestionsForm}
        loadContentItemsFromFirestore={loadContentItemsFromFirestore}
        handleDeleteLocalContentItem={handleDeleteLocalContentItem}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/results"
  element={
    requireAdmin() ? (
      <AdminMockTestResultsRoute
        universalContent={universalContent}
        mockResults={adminMockResults}
        loadAllMockResults={loadAllMockResults}
        loadLeaderboard={loadLeaderboard}
        navigate={navigate}
      />
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/leaderboard"
  element={
    requireAdmin() ? (
      <AdminMockTestLeaderboardRoute
        mockLeaderboardEntries={mockLeaderboardEntries}
        loadMockLeaderboardEntries={loadMockLeaderboardEntries}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/analytics"
  element={
    requireAdmin() ? (
      <AdminMockTestAnalyticsRoute
        mockResults={mockResults}
        universalContent={universalContent}
        navigate={navigate}
      />
    ) : null
  }
/>

<Route
  path="/admin/content/banners"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            Banner CMS
          </span>

          <h1>
            Banner Manager
          </h1>

          <p>
            Manage homepage banners,
            hero sliders, promotions,
            announcements, campaigns,
            and future AspireNest branding visuals.
          </p>
        </div>

        <div className="subjectHubGrid">
          <button>Homepage Banners</button>

          <button>Hero Sliders</button>

          <button>Course Promotions</button>

          <button>Festival Campaigns</button>

          <button>Mobile Banners</button>

          <button>Brand Assets</button>

          <button
            onClick={() =>
              navigate("/admin/content")
            }
          >
            ← Back to Content Studio
          </button>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/announcements"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            Announcements CMS
          </span>

          <h1>
            Announcements Manager
          </h1>

          <p>
            Manage student notices,
            homepage alerts, exam updates,
            offer announcements, mentor
            messages, and system alerts.
          </p>
        </div>

        <div className="subjectHubGrid">
          <button>Student Notices</button>

          <button>Homepage Alerts</button>

          <button>Exam Updates</button>

          <button>Offer Announcements</button>

          <button>Mentor Messages</button>

          <button>System Alerts</button>

          <button
            onClick={() =>
              navigate("/admin/content")
            }
          >
            ← Back to Content Studio
          </button>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/pricing"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            Pricing CMS
          </span>

          <h1>
            Pricing Manager
          </h1>

          <p>
            Manage AspireNest plans,
            FREE/BASIC/PREMIUM pricing,
            mentorship subscriptions,
            offers, coupons, and future
            payment systems.
          </p>
        </div>

        <div className="subjectHubGrid">
          <button>FREE Plan</button>

          <button>BASIC Plan</button>

          <button>PREMIUM Plan</button>

          <button>MENTORSHIP Plan</button>

          <button>Coupons & Offers</button>

          <button>Subscriptions</button>

          <button
            onClick={() =>
              navigate("/admin/content")
            }
          >
            ← Back to Content Studio
          </button>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/students"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Students"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Students"
              setActiveAdminTab={setActiveAdminTab}
              students={students || []}
              enquiries={enquiries || []}
              mockResults={mockResults || []}
              leaderboard={leaderboard || []}
              mockQuestions={mockQuestions || []}
              notesData={[]}
              firebaseNotes={firebaseNotes || []}
              currentAffairs={currentAffairsList || []}
              currentAffairsList={currentAffairsList || []}
              fallbackCurrentAffairs={currentAffairsList || []}
              announcementTitle={announcementTitle}
              setAnnouncementTitle={setAnnouncementTitle}
              announcementMessage={announcementMessage}
              setAnnouncementMessage={setAnnouncementMessage}
              announcements={announcements || []}
              paymentHistory={paymentHistory || []}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              handleDeleteMockQuestion={handleDeleteMockQuestion}
              handleAddMockQuestion={handleAddMockQuestion}
              handleSaveNote={handleSaveNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
              handleSaveCurrentAffairs={handleSaveCurrentAffairs}
              handleEditCurrentAffairs={handleEditCurrentAffairs}
              handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
              handleAddAnnouncement={handleAddAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
            />
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/enquiries"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Enquiries"), 0);
          return null;
        })()}

        <div className="sectionHeader">
          <span className="badge">Enquiries</span>

          <h2>Student Enquiries</h2>

          <p>
            Manage contact requests, doubts,
            support messages and student enquiries.
          </p>
        </div>

        <div style={{ marginTop: "30px" }}>
          <AdminPanel
            user={user}
            isAdmin={isAdmin}
            activeAdminTab="Enquiries"
            setActiveAdminTab={setActiveAdminTab}
            students={students || []}
            enquiries={enquiries || []}
            mockResults={mockResults || []}
            leaderboard={leaderboard || []}
            mockQuestions={mockQuestions || []}
            notesData={[]}
            firebaseNotes={firebaseNotes || []}
            currentAffairs={currentAffairsList || []}
            currentAffairsList={currentAffairsList || []}
            fallbackCurrentAffairs={currentAffairsList || []}
            announcements={announcements || []}
            paymentHistory={paymentHistory || []}
            loadAdminData={loadAdminData}
            loadLeaderboard={loadLeaderboard}
            loadPaymentHistory={loadPaymentHistory}
            handlePremiumControl={handlePremiumControl}
            handleDeleteMockQuestion={handleDeleteMockQuestion}
            handleAddMockQuestion={handleAddMockQuestion}
            handleSaveNote={handleSaveNote}
            handleEditNote={handleEditNote}
            handleDeleteNote={handleDeleteNote}
            handleSaveCurrentAffairs={handleSaveCurrentAffairs}
            handleEditCurrentAffairs={handleEditCurrentAffairs}
            handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
            handleAddAnnouncement={handleAddAnnouncement}
            handleDeleteAnnouncement={handleDeleteAnnouncement}
          />
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/notes"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Notes"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Notes"
              setActiveAdminTab={setActiveAdminTab}
              students={students || []}
              enquiries={enquiries || []}
              mockResults={mockResults || []}
              leaderboard={leaderboard || []}
              mockQuestions={mockQuestions || []}
              notesData={[]}
              firebaseNotes={firebaseNotes || []}
              adminNoteTitle={adminNoteTitle}
              setAdminNoteTitle={setAdminNoteTitle}
              adminNoteCategory={adminNoteCategory}
              setAdminNoteCategory={setAdminNoteCategory}
              adminNotePages={adminNotePages}
              setAdminNotePages={setAdminNotePages}
              manualNotePdfUrl={manualNotePdfUrl}
              setManualNotePdfUrl={setManualNotePdfUrl}
              setAdminNotePdf={setAdminNotePdf}
              uploadingPdf={uploadingPdf}
              handleUploadPdf={handleUploadPdf}
              adminNoteType={adminNoteType}
              setAdminNoteType={setAdminNoteType}
              editingNoteId={editingNoteId}
              currentAffairs={currentAffairsList || []}
              currentAffairsList={currentAffairsList || []}
              fallbackCurrentAffairs={currentAffairsList || []}
              announcements={announcements || []}
              paymentHistory={paymentHistory || []}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              handleDeleteMockQuestion={handleDeleteMockQuestion}
              handleAddMockQuestion={handleAddMockQuestion}
              handleSaveNote={handleSaveNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
              handleSaveCurrentAffairs={handleSaveCurrentAffairs}
              handleEditCurrentAffairs={handleEditCurrentAffairs}
              handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
              handleAddAnnouncement={handleAddAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
            />
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/mock-tests"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Mock Tests"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Mock Tests"
              setActiveAdminTab={setActiveAdminTab}
              students={students || []}
              enquiries={enquiries || []}
              mockResults={mockResults || []}
              leaderboard={leaderboard || []}
              mockQuestions={mockQuestions || []}
              notesData={[]}
              firebaseNotes={firebaseNotes || []}
              currentAffairs={currentAffairsList || []}
              currentAffairsList={currentAffairsList || []}
              fallbackCurrentAffairs={currentAffairsList || []}
              announcements={announcements || []}
              paymentHistory={paymentHistory || []}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              handleDeleteMockQuestion={handleDeleteMockQuestion}
              handleAddMockQuestion={handleAddMockQuestion}
              handleSaveNote={handleSaveNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
              handleSaveCurrentAffairs={handleSaveCurrentAffairs}
              handleEditCurrentAffairs={handleEditCurrentAffairs}
              handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
              handleAddAnnouncement={handleAddAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
            />
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/current-affairs"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Current Affairs"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Current Affairs"
              setActiveAdminTab={setActiveAdminTab}

              students={students || []}
              enquiries={enquiries || []}
              mockResults={mockResults || []}
              leaderboard={leaderboard || []}
              mockQuestions={mockQuestions || []}

              adminQuestion={adminQuestion}
              setAdminQuestion={setAdminQuestion}

              adminOption1={adminOption1}
              setAdminOption1={setAdminOption1}

              adminOption2={adminOption2}
              setAdminOption2={setAdminOption2}

              adminOption3={adminOption3}
              setAdminOption3={setAdminOption3}

              adminOption4={adminOption4}
              setAdminOption4={setAdminOption4}

              adminAnswer={adminAnswer}
              setAdminAnswer={setAdminAnswer}

              adminSubject={adminSubject}
              setAdminSubject={setAdminSubject}

              adminLevel={adminLevel}
              setAdminLevel={setAdminLevel}

              adminAccessPlan={adminAccessPlan}
              setAdminAccessPlan={setAdminAccessPlan}

              notesData={[]}
              firebaseNotes={firebaseNotes || []}

              currentTitle={currentTitle}
              setCurrentTitle={setCurrentTitle}

              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}

              currentPages={currentPages}
              setCurrentPages={setCurrentPages}

              manualCurrentPdfUrl={manualCurrentPdfUrl}
              setManualCurrentPdfUrl={setManualCurrentPdfUrl}

              currentType={currentType}
              setCurrentType={setCurrentType}

              editingCurrentId={editingCurrentId}

              setCurrentPdf={setCurrentPdf}

              uploadingCurrentPdf={uploadingCurrentPdf}
              handleUploadCurrentPdf={handleUploadCurrentPdf}

              currentAffairs={currentAffairsList || []}
              currentAffairsList={currentAffairsList || []}
              fallbackCurrentAffairs={currentAffairsList || []}

              handleSaveCurrentAffairs={handleSaveCurrentAffairs}
              handleEditCurrentAffairs={handleEditCurrentAffairs}
              handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}

              announcements={announcements || []}

              paymentHistory={paymentHistory || []}

              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}

              handlePremiumControl={handlePremiumControl}

              handleDeleteMockQuestion={handleDeleteMockQuestion}
              handleAddMockQuestion={handleAddMockQuestion}

              handleSaveNote={handleSaveNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}

              handleAddAnnouncement={handleAddAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
            />
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/payments"
  element={
    requireAdmin() ? (
      <Navigate to="/admin/content/payments" replace />
    ) : null
  }
/>
<Route
  path="/admin/analytics"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Analytics"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Analytics"
              setActiveAdminTab={setActiveAdminTab}
              students={students || []}
              enquiries={enquiries || []}
              mockResults={mockResults || []}
              leaderboard={leaderboard || []}
              mockQuestions={mockQuestions || []}
              notesData={[]}
              firebaseNotes={firebaseNotes || []}
              currentAffairs={currentAffairsList || []}
              currentAffairsList={currentAffairsList || []}
              fallbackCurrentAffairs={currentAffairsList || []}
              announcements={announcements || []}
              paymentHistory={paymentHistory || []}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              handleDeleteMockQuestion={handleDeleteMockQuestion}
              handleAddMockQuestion={handleAddMockQuestion}
              handleSaveNote={handleSaveNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
              handleSaveCurrentAffairs={handleSaveCurrentAffairs}
              handleEditCurrentAffairs={handleEditCurrentAffairs}
              handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
              handleAddAnnouncement={handleAddAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
            />
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/announcements"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Announcements"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Announcements"
              setActiveAdminTab={setActiveAdminTab}
              students={students || []}
              enquiries={enquiries || []}
              mockResults={mockResults || []}
              leaderboard={leaderboard || []}
              mockQuestions={mockQuestions || []}
              notesData={[]}
              firebaseNotes={firebaseNotes || []}
              currentAffairs={currentAffairsList || []}
              currentAffairsList={currentAffairsList || []}
              fallbackCurrentAffairs={currentAffairsList || []}

              announcementTitle={announcementTitle}
              setAnnouncementTitle={setAnnouncementTitle}

              announcementMessage={announcementMessage}
              setAnnouncementMessage={setAnnouncementMessage}

              announcements={announcements || []}

              paymentHistory={paymentHistory || []}

              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}

              handlePremiumControl={handlePremiumControl}

              handleDeleteMockQuestion={handleDeleteMockQuestion}
              handleAddMockQuestion={handleAddMockQuestion}

              handleSaveNote={handleSaveNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}

              handleSaveCurrentAffairs={handleSaveCurrentAffairs}
              handleEditCurrentAffairs={handleEditCurrentAffairs}
              handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}

              handleAddAnnouncement={handleAddAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
            />
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/universal-cms"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Universal CMS"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Universal CMS"
              setActiveAdminTab={setActiveAdminTab}
              students={students || []}
              enquiries={enquiries || []}
              mockResults={mockResults || []}
              notesData={[]}
              firebaseNotes={firebaseNotes || []}
              currentAffairs={currentAffairsList || []}
              currentAffairsList={currentAffairsList || []}
              fallbackCurrentAffairs={currentAffairsList || []}
              announcements={announcements || []}
              paymentHistory={paymentHistory || []}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              handleDeleteMockQuestion={handleDeleteMockQuestion}
              handleAddMockQuestion={handleAddMockQuestion}
              handleSaveNote={handleSaveNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
              handleSaveCurrentAffairs={handleSaveCurrentAffairs}
              handleEditCurrentAffairs={handleEditCurrentAffairs}
              handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
              handleAddAnnouncement={handleAddAnnouncement}
              handleDeleteAnnouncement={handleDeleteAnnouncement}
              universalContent={universalContent}
contentLoading={contentLoading}
cmsTitle={cmsTitle}
setCmsTitle={setCmsTitle}
cmsSection={cmsSection}
setCmsSection={setCmsSection}
cmsSubject={cmsSubject}
setCmsSubject={setCmsSubject}
cmsCourse={cmsCourse}
setCmsCourse={setCmsCourse}
cmsChapter={cmsChapter}
setCmsChapter={setCmsChapter}
cmsPlanType={cmsPlanType}
setCmsPlanType={setCmsPlanType}
cmsFileUrl={cmsFileUrl}
setCmsFileUrl={setCmsFileUrl}
cmsVideoUrl={cmsVideoUrl}
setCmsVideoUrl={setCmsVideoUrl}
cmsMentorName={cmsMentorName}
setCmsMentorName={setCmsMentorName}
cmsMonth={cmsMonth}
setCmsMonth={setCmsMonth}
editingCmsId={editingCmsId}
handleSaveUniversalContent={handleSaveUniversalContent}
            />
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/privacy-policy"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Privacy Policy</span>

        <h2>AspireNest Privacy Policy</h2>

        <p>
          Learn how AspireNest Academy collects,
          stores, and protects student information.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/terms"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Terms & Conditions</span>

        <h2>Platform Usage Terms</h2>

        <p>
          Review platform rules, memberships,
          subscriptions, and learning policies.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/refund-policy"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Refund Policy</span>

        <h2>Refund & Cancellation Policy</h2>

        <p>
          Understand payment refunds,
          cancellations, and premium access policies.
        </p>
      </div>
    </section>
  }
/>
<Route
  path="/ctet-tet/courses"
  element={
    <section className="coursePages coursesMasterPage">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Courses</span>

        <h1>Courses for CTET & TET Preparation</h1>

        <p>
          Choose structured learning programs, topic-wise courses,
          crash courses, and mentor-guided preparation paths.
        </p>
      </div>

      <div className="coursePathGrid">
        <div
          className="coursePathCard"
          onClick={() => navigate("/courses/ctet")}
        >
          <div className="coursePathIcon">📘</div>
          <h3>CTET Course</h3>
          <p>Paper-wise structured preparation for CTET aspirants.</p>
          <span>Open CTET Track →</span>
        </div>

        <div
          className="coursePathCard"
          onClick={() => navigate("/courses/tet")}
        >
          <div className="coursePathIcon">🧑‍🏫</div>
          <h3>TET Course</h3>
          <p>State TET preparation with syllabus, PYQ and mock practice.</p>
          <span>Open TET Track →</span>
        </div>

        <div
          className="coursePathCard"
          onClick={() => navigate("/ctet-tet")}
        >
          <div className="coursePathIcon">🔙</div>
          <h3>Back to Hub</h3>
          <p>Return to the full CTET/TET learning ecosystem.</p>
          <span>Go Back →</span>
        </div>
      </div>

      <div className="premiumCourseShelf">
        {courses.map((course, index) => (
          <div className="premiumCourseCard" key={`${course.id}-${index}`}>
            <span className="planTag">{course.badge}</span>

            <h3>{course.title}</h3>
            <p>{course.desc}</p>

            <div className="courseMetaGrid">
              <span><strong>Level</strong>{course.level}</span>
              <span><strong>Lessons</strong>{course.lessons}</span>
              <span><strong>Tests</strong>{course.tests}</span>
              <span><strong>Price</strong>{course.price}</span>
            </div>

            <button onClick={() => setSelectedCourse(course)}>
              View Details
            </button>
          </div>
        ))}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/videos"
  element={
    <StudentVideoHub universalContent={universalContent} />
  }
/>

<Route
  path="/ctet-tet/videos/plan/:plan"
  element={
    <StudentVideoPlanRoute
      universalContent={universalContent}
      userPlanType={userPlanType}
      isAdmin={isAdmin(user)}
    />
  }
/>

<Route
  path="/ctet-tet/videos/plan/:plan/:subjectId"
  element={
    <StudentVideoSubjectRoute
      universalContent={universalContent}
      userPlanType={userPlanType}
      isAdmin={isAdmin(user)}
    />
  }
/>

<Route
  path="/ctet-tet/videos/plan/:plan/:subjectId/:chapterId"
  element={
    <StudentVideoChapterRoute
      universalContent={universalContent}
      userPlanType={userPlanType}
      isAdmin={isAdmin(user)}
      hasPlanAccess={hasPlanAccess}
    />
  }
/>

<Route
  path="/ctet-tet/videos/watch/:videoId"
  element={
    <StudentClassroomGuardRoute
      universalContent={universalContent}
      user={user}
      userPlanType={userPlanType}
      isAdmin={isAdmin(user)}
      hasPlanAccess={hasPlanAccess}
    />
  }
/>


<Route
  path="/ctet-tet/notes"
  element={
    <StudentNotesLibraryRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/ctet-tet/notes/plan/:plan"
  element={
    <StudentNotesPlanRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/ctet-tet/notes/plan/:plan/:subjectId"
  element={
    <StudentNotesSubjectRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/ctet-tet/notes/plan/:plan/:subjectId/:chapterId"
  element={
    <StudentNotesChapterRoute
      universalContent={universalContent}
      handleNoteAccess={handleNoteAccess}
      hasPlanAccess={hasPlanAccess}
    />
  }
/>


<Route
  path="/ctet-tet/mock-tests"
  element={
    <StudentMockTestLibraryRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/ctet-tet/mock-tests/plan/:plan"
  element={
    <StudentMockTestPlanRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/ctet-tet/mock-tests/plan/:plan/:subjectId"
  element={
    <StudentMockTestSubjectRoute
      universalContent={universalContent}
    />
  }
/>

<Route
  path="/ctet-tet/mock-tests/plan/:plan/:subjectId/:chapterId"
  element={
    <StudentMockTestChapterRoute
      universalContent={universalContent}
      hasPlanAccess={hasPlanAccess}
    />
  }
/>


<Route
  path="/ctet-tet/mock-tests/start/:testId"
  element={
    <ExamStartRoute
      universalContent={universalContent}
      getMockTestAccessStatus={getMockTestAccessStatus}
      getMockTestScheduleStatus={getMockTestScheduleStatus}
      getMockTestRules={getMockTestRules}
      setMockAttemptState={setMockAttemptState}
      mockResults={mockResults}
      user={user}
    />
  }
/>

<Route
  path="/ctet-tet/mock-tests/attempt/:testId"
  element={
    <ExamAttemptRoute
      universalContent={universalContent}
      getMockTestAccessStatus={getMockTestAccessStatus}
      getMockTestRules={getMockTestRules}
      mockAttemptState={mockAttemptState}
      setMockAttemptState={setMockAttemptState}
      paletteFilter={paletteFilter}
      setPaletteFilter={setPaletteFilter}
      submitConfirmTestId={submitConfirmTestId}
      setSubmitConfirmTestId={setSubmitConfirmTestId}
      examFontScale={examFontScale}
      setExamFontScale={setExamFontScale}
      fullName={fullName}
      user={user}
      goToAttemptQuestion={goToAttemptQuestion}
      selectAttemptAnswer={selectAttemptAnswer}
      clearAttemptResponse={clearAttemptResponse}
      markAttemptForReviewAndNext={markAttemptForReviewAndNext}
      saveAttemptAndNext={saveAttemptAndNext}
      updateAttemptTimeLeft={updateAttemptTimeLeft}
    />
  }
/>

<Route
  path="/ctet-tet/mock-tests/result/:testId"
  element={
    <ExamResultRoute
      universalContent={universalContent}
      getMockTestAccessStatus={getMockTestAccessStatus}
      mockAttemptState={mockAttemptState}
      user={user}
      fullName={fullName}
      isAdmin={isAdmin}
      loadUserMockResults={loadUserMockResults}
      loadLeaderboard={loadLeaderboard}
      loadMockLeaderboardEntries={loadMockLeaderboardEntries}
      setMockAttemptState={setMockAttemptState}
      mockResults={mockResults}
      mockResultsLoaded={mockResultsLoaded}
      mockResultsLoadError={mockResultsLoadError}
    />
  }
/>


<Route
  path="/ctet-tet/mock-tests/review/:testId"
  element={
    <ExamReviewRoute
      universalContent={universalContent}
      getMockTestAccessStatus={getMockTestAccessStatus}

      mockAttemptState={mockAttemptState}
    />
  }
/>


<Route
  path="/ctet-tet/mock-tests/history"
  element={
    <StudentMockTestHistoryRoute
      mockResults={mockResults}
      user={user}
    />
  }
/>

<Route
  path="/leaderboard"
  element={
    <StudentMockLeaderboardRoute
      mockLeaderboardEntries={mockLeaderboardEntries}
      universalContent={universalContent}
      user={user}
    />
  }
/>

<Route
  path="/ctet-tet/current-affairs"
  element={
    <StudentCurrentAffairsLibraryRoute
      universalContent={universalContent}
      currentAffairsList={currentAffairsList}
    />
  }
/>

<Route
  path="/ctet-tet/current-affairs/:monthId"
  element={
    <StudentCurrentAffairsMonthRoute
      universalContent={universalContent}
      currentAffairsList={currentAffairsList}
      hasPlanAccess={hasPlanAccess}
      isAdmin={isAdmin(user)}
    />
  }
/>




<Route
  path="/ctet-tet/pricing"
  element={
    <section className="coursePages pricingMasterPage">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Plans</span>

        <h2>Choose Your CTET/TET Learning Plan</h2>

        <p>
          Select Basic, Premium, or Mentorship access for
          notes, tests, dashboard, AI classroom, and mentor guidance.
        </p>
      </div>

      <CtetPricingMentorGuidance />

      <div className="pricingActionGrid">
        <div
          className="pricingActionCard"
          onClick={() => navigate("/ctet-tet/pricing")}
        >
          <div className="pricingActionIcon">💎</div>

          <h3>View Plans</h3>

          <p>
            Compare Premium, Mentorship, and advanced
            learning access for complete preparation.
          </p>

          <span>Explore Plans →</span>
        </div>

        <div
          className="pricingActionCard"
          onClick={() => navigate("/payment")}
        >
          <div className="pricingActionIcon">🧾</div>

          <h3>Upgrade Now</h3>

          <p>
            Unlock premium notes, tests, dashboards,
            AI classroom, and mentorship support.
          </p>

          <span>Upgrade Access →</span>
        </div>

        <div
          className="pricingActionCard"
          onClick={() => navigate("/ctet-tet/redeem")}
        >
          <div className="pricingActionIcon">🔑</div>

          <h3>Redeem Access Key</h3>

          <p>
            Already received an AspireNest access key? Redeem it here to
            activate your plan, module, item, or bundle access.
          </p>

          <span>Redeem Key →</span>
        </div>

        <div
          className="pricingActionCard"
          onClick={() => navigate("/ctet-tet")}
        >
          <div className="pricingActionIcon">🔙</div>

          <h3>Back to Hub</h3>

          <p>
            Return to the CTET/TET ecosystem and continue
            your structured preparation journey.
          </p>

          <span>Go Back →</span>
        </div>
      </div>

      <div className="premiumPricingContainer">
        <Pricing
          createPaymentRequest={createPaymentRequest}
          isPremiumUser={isPremiumUser}
          setActiveSection={setActiveSection}
        />
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/redeem"
  element={<StudentRedeemAccessRoute user={user} />}
/>

</Routes>

<MockTestActionMenu
  position={mockMenuPosition}
  test={mockMenuTest}
  onClose={closeMockActionPortal}
  reloadContent={loadContentItemsFromFirestore}
  setEditingMockTestId={setEditingMockTestId}
  setMockTestForm={setMockTestForm}
  setMockTestQuestionsForm={setMockTestQuestionsForm}
/>
</main>

{selectedCourse && (
  <div
    className="mentorProfileOverlay"
    onClick={() => setSelectedCourse(null)}
  >
    <div
      className="mentorProfileModal profileModal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="closeMentorProfile"
        onClick={() => setSelectedCourse(null)}
      >
        ✕
      </button>

      <span className="badge">{selectedCourse.badge}</span>

      <h2>{selectedCourse.title}</h2>

      <p className="profileTag">
        {selectedCourse.category} • {selectedCourse.level}
      </p>

      <p>{selectedCourse.desc}</p>

      <div className="profileContent">
        <h4>What You Get</h4>

        <ul>
          {(selectedCourse.points || []).map((point) => (
            <li key={point}>✅ {point}</li>
          ))}
        </ul>

        <p>
          <strong>Lessons:</strong> {selectedCourse.lessons}
        </p>

        <p>
          <strong>Mock Tests:</strong> {selectedCourse.tests}
        </p>

        <p>
          <strong>Price:</strong> {selectedCourse.price}
        </p>
      </div>

      <button
        className="btnLink"
        onClick={() => {
          setSelectedCourse(null);
          navigate("/ctet-tet/pricing");
        }}
      >
        View Plans & Enroll
      </button>
    </div>
  </div>
)}

{activePayment && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999999,
      padding: "20px",
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "30px",
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          marginBottom: "10px",
        }}
      >
        Scan & Pay
      </h2>

      <p
        style={{
          color: "#666",
          marginBottom: "20px",
        }}
      >
        Complete your payment using any UPI app
      </p>

      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "18px",
          display: "inline-block",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <QRCodeCanvas
          value={activePayment.upiLink}
          size={220}
        />
      </div>

      <h3
        style={{
          marginTop: "20px",
          fontSize: "32px",
          color: "#ff7b00",
        }}
      >
        ₹{activePayment.amount}
      </h3>

      <p
        style={{
          marginTop: "10px",
          color: "#666",
          fontSize: "14px",
        }}
      >
        Order ID: {activePayment.orderId}
        {activePayment.status === "pending_verification" && (
  <div
    style={{
      marginTop: "16px",
      padding: "14px",
      borderRadius: "14px",
      background: "#fff7ed",
      color: "#9a3412",
      fontWeight: "700",
      fontSize: "14px",
    }}
  >
    ⏳ Approval Pending
    <br />
    Your payment proof step has started. Please wait for verification.
  </div>
)}
      </p>
      {activePayment.status === "pending_verification" && (
  <div
    style={{
      marginTop: "16px",
      textAlign: "left",
    }}
  >
    <label
      style={{
        display: "block",
        fontWeight: "700",
        marginBottom: "8px",
        color: "#111827",
      }}
    >
      Paste Payment Message / UTR
    </label>

    <textarea
      value={paymentProof}
      onChange={(e) => setPaymentProof(e.target.value)}
      placeholder="Example: Paid ₹199 via PhonePe. UTR: 1234567890"
      rows="4"
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid #ddd",
        resize: "none",
        fontSize: "14px",
      }}
    />
<button
  onClick={async () => {
    if (!paymentProof.trim()) {
      alert("Please paste payment message or UTR first.");
      return;
    }

    const whatsappMessage = `
🚨 AspireNest Payment Proof Submitted

👤 Student: ${user?.email || "Student"}
💰 Amount: ₹${activePayment?.amount}
📦 Plan: ${activePayment?.planName}
🧾 Order ID: ${activePayment?.orderId}

📝 Student Payment Proof:
${paymentProof}

✅ Action Required:
✅ Please verify and activate premium access if payment is valid.

`;

    window.open(
      `https://wa.me/919624158590?text=${encodeURIComponent(
        whatsappMessage
      )}`,
      "_blank"
    );

    const updatedPayment = {
      ...activePayment,
      studentProof: paymentProof,
      status: "student_proof_submitted",
    };

    setActivePayment(updatedPayment);

    await updateDoc(
      doc(db, "payments", activePayment.id),
      {
        studentProof: paymentProof,
        status: "student_proof_submitted",
        updatedAt: new Date(),
      }
    );

    alert(
      "Payment proof submitted ✅ Your access is under verification."
    );
  }}
  style={{
    marginTop: "12px",
    padding: "13px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
  }}
>
  Submit Payment Proof
</button>
  </div>
)}
      <button
  onClick={() => {
    setActivePayment({
      ...activePayment,
      status: "pending_verification",
    });

    alert(
      "Payment proof step started. Now student can submit payment details."
    );
  }}
  style={{
    marginTop: "20px",
    padding: "14px 22px",
    borderRadius: "14px",
    border: "none",
    background: "#ff7b00",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    width: "100%",
  }}
>
  I Have Paid
</button>
      <button
        onClick={() =>
          setActivePayment(null)
        }
        style={{
          marginTop: "24px",
          padding: "14px 22px",
          borderRadius: "14px",
          border: "none",
          background: "#111827",
          color: "#fff",
          cursor: "pointer",
          fontWeight: "700",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
   {activeSection && location.pathname === "/learning" && (
  <div className="activeSectionScreen">
    <button
      className="backToDashboardBtn"
      onClick={() => setActiveSection(null)}
    >
      ← Back to Dashboard
    </button>
    {activeSection === "learning-hub" && (
  <section className="learningHubSection">

    <p className="learningHubTag">
      AspireNest Learning Hub
    </p>

    <h1 className="learningHubTitle">
      Choose what you want to study today.
    </h1>

    <p className="learningHubSubtitle">
      Open any section directly without scrolling the full website.
    </p>

    <h2 className="learningHubHeading">
      Start Learning
    </h2>
    <div className="learningHubGrid">

<div
  className="learningHubCard"
  onClick={() => navigate("/ctet-tet/courses")}
>
  <div className="learningHubIcon">📖</div>

  <h3>Courses</h3>

  <p>
    CTET/TET learning paths and topic-wise preparation.
  </p>

  <span className="learningHubArrow">→</span>
</div>

<div
  className="learningHubCard"
  onClick={() => navigate("/ctet-tet/roadmaps")}
>
  <div className="learningHubIcon">🛣️</div>

  <h3>Learning Paths</h3>

  <p>
    Beginner to premium structured learning programs.
  </p>

  <span className="learningHubArrow">→</span>
</div>

<div
  className="learningHubCard"
  onClick={() => navigate("/ctet-tet/notes")}
>
  <div className="learningHubIcon">📝</div>

  <h3>Notes</h3>

  <p>
    Premium and free revision notes for quick learning.
  </p>

  <span className="learningHubArrow">→</span>
</div>

</div>

<h2 className="learningHubHeading">
Practice
</h2>

<div className="learningHubGrid">

<div
  className="learningHubCard"
  onClick={() => navigate("/ctet-tet/mock-tests")}
>
  <div className="learningHubIcon">✅</div>

  <h3>Mock Tests</h3>

  <p>
    Practice tests, score tracking and exam preparation.
  </p>

  <span className="learningHubArrow">→</span>
</div>

<div
  className="learningHubCard"
  onClick={() => navigate("/ctet-tet/current-affairs")}
>
  <div className="learningHubIcon">📰</div>

  <h3>Current Affairs</h3>

  <p>
    Monthly PDF updates and exam-focused current affairs.
  </p>

  <span className="learningHubArrow">→</span>
</div>

<div
  className="learningHubCard"
  onClick={() => navigate("/student-dashboard")}
>
  <div className="learningHubIcon">📊</div>

  <h3>My Progress</h3>

  <p>
    Student dashboard, analytics and learning progress.
  </p>

  <span className="learningHubArrow">→</span>
</div>

</div>

<h2 className="learningHubHeading">
Premium
</h2>

<div className="learningHubGrid">

<div
  className="learningHubCard"
  onClick={() => navigate("/ctet-tet/pricing")}
>
  <div className="learningHubIcon">👑</div>

  <h3>Premium</h3>

  <p>
    Unlock full course, mock tests, notes and mentorship.
  </p>

  <span className="learningHubArrow">→</span>
</div>

<div
  className="learningHubCard"
  onClick={() => navigate("/announcements")}
>
  <div className="learningHubIcon">📣</div>

  <h3>Announcements</h3>

  <p>
    Latest updates, exam alerts and platform notifications.
  </p>

  <span className="learningHubArrow">→</span>
</div>

<div
  className="learningHubCard"
  onClick={() => navigate("/admin")}
>
  <div className="learningHubIcon">⚙️</div>

  <h3>Admin Panel</h3>

  <p>
    Manage students, notes, mock tests and analytics.
  </p>

  <span className="learningHubArrow">→</span>
</div>

</div>

</section>
)}
    {activeSection === "learning-paths" && (
  <section className="plansSection" id="learning-paths">
    <h2>Learning Paths</h2>

    <p className="sectionText">
      Beginner se advanced mentorship tak structured learning programs.
    </p>

    <div className="grid">
      <div className="planCard">
        <span className="planTag">FREE</span>

        <h3>Free Resources</h3>

        <ul>
          <li>📘 Sample Notes</li>
          <li>📝 Free Mock Test</li>
        </ul>

        <button onClick={() => navigate("/ctet-tet/notes")}>
  Start Free
</button>
      </div>

      <div className="planCard">
        <span className="planTag orange">MINI COURSE</span>

        <h3>Topic-wise Courses</h3>

        <ul>
          <li>🧠 CDP Concepts</li>
          <li>📚 Pedagogy Lessons</li>
          <li>🎯 PYQ Practice</li>
        </ul>

        <button onClick={() => navigate("/ctet-tet/courses")}>
  Explore Courses
</button>
      </div>

      <div className="planCard premiumCard2">
        <span className="planTag darkTag">PREMIUM</span>

        <h3>Crash Course + Full Batch</h3>

        <ul>
          <li>🎥 Live Classes</li>
          <li>📝 Mock Tests</li>
          <li>📥 Notes & Revision</li>
          <li>🏆 Mentorship Support</li>
        </ul>

        <button onClick={() => navigate("/ctet-tet/pricing")}>
          Join Premium
        </button>
      </div>
    </div>
  </section>
)}


{activeSection === "login" && (
  <section id="login">
    <AuthSection
      user={user}
      setUser={setUser}
      isPremiumUser={isPremiumUser}
    />
  </section>
)}

  </div>
)}
{false && (
   <div
  className={darkMode ? "app dark" : "app"}
  id="login"
>
      {selectedCourse && (
        <div className="coursePopup">
          <div className="popupContent">
            <button
              className="closeBtn"
              onClick={() => setSelectedCourse(null)}
            >
              ✕
            </button>

            <h2>{selectedCourse.title}</h2>

            <p>{selectedCourse.desc}</p>

            <ul>
              {selectedCourse.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
            <div className="popupButtons">
            <button
  className="btnLink"
  onClick={() => navigate("/ctet-tet/pricing")}
>
  Join Course
</button>

              <a
                href="https://wa.me/917304256002"
                target="_blank"
                className="btnLink outline"
              >
                WhatsApp Enquiry
              </a>
            </div>
          </div>
        </div>
      )}
{false && (<header className="cleanHeader">
  <div className="cleanBrand">
    <img
      src="/logo-header.png"
      alt="AspireNest Academy"
      className="cleanHeaderLogo"
      loading="eager"
      decoding="async"
    />
  </div>

  <nav className="cleanNav">
    {!user ? (
      <button
        className="cleanHeaderBtn"
        onClick={() => {
          setProfileMenuOpen(false);
          navigate("/login");
        }}
      >
        Login
      </button>
    ) : isAdmin(user) ? (
      <button
        className="cleanHeaderBtn"
        onClick={() => {
          setProfileMenuOpen(false);
          navigate("/admin");
        }}
      >
        Admin
      </button>
    ) : (
      <button
        className="cleanHeaderBtn"
        onClick={() => {
          setProfileMenuOpen(false);
          navigate("/student-dashboard");
        }}
      >
        {user?.displayName || user?.email?.split("@")[0] || "Student"}
      </button>
    )}
  </nav>
</header>)}
      {false && (
  <div className="stickySectionNav"></div>
)}
<section className="hero">
  <div className="heroContent">
    <div className="taglineCard">
      <div className="taglineIcon">🏆</div>

      <div>
        <h3>Where Aspirations Turn Into Selections</h3>
        <p>
          Empowering students with the right guidance,
          resources and practice.
        </p>
      </div>
    </div>

    <span className="badge">CTET • TETs</span>

    <h2>
      Crack CTET/TETs
      <br />
      with Smart Learning
    </h2>

    <p>Bilingual preparation platform for Indian students.</p>

    <div className="buttons">
  <button
    className="btnLink"
    onClick={() => navigate("/ctet-tet/courses")}
  >
    Start Learning
  </button>
</div>
  </div>

  <div className="card heroGoalCard">
    <div className="goalTop">
      <div className="goalIcon">🎯</div>
      <div>
        <h3>Today's Goal</h3>
        <p>Child Development Practice</p>
      </div>
    </div>

    <div className="progress">
      <div className="fill"></div>
    </div>

    <span><strong>75%</strong> Completed</span>
  </div>
</section>




      <section className="coursePages" id="courses">
      <h2>CTET/TET</h2>

      <p>
  Structured learning programs designed for concept clarity,
  mock practice, and exam success.
</p>

  <div className="grid">
    {courses.map((course) => (
      <div className="course" key={course.id}>
        <span className="planTag">{course.badge}</span>

        <h3>{course.title}</h3>

        <p>{course.desc}</p>

        <p><strong>Level:</strong> {course.level}</p>

        <p><strong>Lessons:</strong> {course.lessons}</p>

        <p><strong>Mock Tests:</strong> {course.tests}</p>

        <p><strong>Price:</strong> {course.price}</p>

        <button onClick={() => setSelectedCourse(course)}>
          View Details
        </button>
      </div>
    ))}
  </div>
</section>
      <section className="plansSection">
        <h2>Learning Paths</h2>

        <p className="sectionText">
          Beginner se advanced mentorship tak structured learning programs.
        </p>

        <div className="grid">
          <div className="planCard">
            <span className="planTag">FREE</span>

            <h3>Free Resources</h3>

            <ul>
              <li>📘 Sample Notes</li>
              <li>📝 Free Mock Test</li>
            </ul>

            <button
  className="btnLink"
  onClick={() => navigate("/ctet-tet/notes")}
>
  Start Free
</button>
          </div>

          <div className="planCard">
            <span className="planTag orange">MINI COURSE</span>

            <h3>Topic-wise Courses</h3>

            <ul>
              <li>🧠 CDP Concepts</li>
              <li>📚 Pedagogy Lessons</li>
              <li>🎯 PYQ Practice</li>
            </ul>

            <button
  className="btnLink"
  onClick={() => navigate("/ctet-tet/courses")}
>
  Explore Courses
</button>
          </div>

          <div className="planCard premiumCard2">
            <span className="planTag darkTag">PREMIUM</span>

            <h3>Crash Course + Full Batch</h3>

            <ul>
              <li>🎥 Live Classes</li>
              <li>📝 Mock Tests</li>
              <li>📥 Notes & Revision</li>
              <li>🏆 Mentorship Support</li>
            </ul>

            <button
  className="btnLink"
  onClick={() => navigate("/ctet-tet/pricing")}
>
  Join Premium
</button>
          </div>
        </div>
      </section>
      <section className="cdp" id="cdp">
        <h2>CTET Child Development & Pedagogy</h2>

        <p className="sectionText">
          Complete CDP module with theories, inclusive education, assessment and
          exam-oriented revision.
        </p>

        <div className="lessonGrid">
          <div className="lessonCard">
            <span>🧠 Theory</span>
            <h3>Piaget’s Cognitive Development</h3>
            <p>
              Stages, schemas, assimilation, accommodation and CTET-level MCQ
              practice.
            </p>
          </div>

          <div className="lessonCard">
            <span>👥 Theory</span>
            <h3>Vygotsky’s Social Constructivism</h3>
            <p>
              ZPD, scaffolding, social interaction and classroom application.
            </p>
          </div>

          <div className="lessonCard">
            <span>⚖️ Theory</span>
            <h3>Kohlberg’s Moral Development</h3>
            <p>
              Pre-conventional, conventional and post-conventional moral
              reasoning.
            </p>
          </div>

          <div className="lessonCard">
            <span>🎨 Intelligence</span>
            <h3>Gardner’s Multiple Intelligence</h3>
            <p>
              Different intelligence types and learner-centered teaching
              strategies.
            </p>
          </div>

          <div className="lessonCard">
            <span>♿ Inclusion</span>
            <h3>Inclusive Education & CWSN</h3>
            <p>
              Equity, diversity, barriers to learning and inclusive classroom
              practices.
            </p>
          </div>

          <div className="lessonCard">
            <span>📝 Assessment</span>
            <h3>Assessment for Learning</h3>
            <p>
              Formative, summative, diagnostic evaluation and feedback-based
              learning.
            </p>
          </div>

          <div className="lessonCard">
            <span>📚 Learning</span>
            <h3>Learning Theories</h3>
            <p>
              Behaviorism, constructivism, motivation, transfer of learning and
              readiness.
            </p>
          </div>

          <div className="lessonCard">
            <span>🎯 Revision</span>
            <h3>CDP Quick Revision System</h3>
            <p>
              One-page summaries, memory hooks, PYQ mapping and last-minute
              revision.
            </p>
          </div>
        </div>
      </section>



<section id="notes">
      <NotesCMS
notesData={[]}
firebaseNotes={firebaseNotes}
universalNotes={universalNotes}
handleNoteAccess={handleNoteAccess}
isPremiumUser={isPremiumUser}
/>
</section>



<section id="student-profile">
      <StudentDashboard
  user={user}
  isPremiumUser={isPremiumUser}
  isAdmin={isAdmin}
  handlePremiumSectionAccess={handlePremiumSectionAccess}
  handleLogout={handleLogout}
  loadAdminData={loadAdminData}
  mockResults={mockResults}
  averageAccuracy={averageAccuracy}
  weeklyPerformanceData={weeklyPerformanceData}
subjectPerformanceData={subjectPerformanceData}
  highestScore={highestScore}
  totalMockAttempts={totalMockAttempts}
  dailyStreak={dailyStreak}
  weeklyGrowthMessage={weeklyGrowthMessage}
  estimatedRank={estimatedRank}
  rankPredictionMessage={rankPredictionMessage}
  estimatedStudyHours={estimatedStudyHours}
  studyTimeMessage={studyTimeMessage}
  aiStudyPlan={aiStudyPlan}
  analyticsMessage={analyticsMessage}
  weakestSubject={weakestSubject}
  smartRecommendation={smartRecommendation}
  performanceChartData={performanceChartData}
subjectChartData={subjectChartData}
chartColors={chartColors}
/>
</section>
{isAdmin(user) && (
<AdminPanel
  isAdmin={isAdmin}
  activeAdminTab={activeAdminTab}
  setActiveAdminTab={setActiveAdminTab}
  students={students}
  enquiries={enquiries}
  leaderboard={leaderboard}
  handlePremiumControl={handlePremiumControl}

  adminNoteTitle={adminNoteTitle}
  setAdminNoteTitle={setAdminNoteTitle}
  adminNoteCategory={adminNoteCategory}
  setAdminNoteCategory={setAdminNoteCategory}
  adminNotePages={adminNotePages}
  setAdminNotePages={setAdminNotePages}
  manualNotePdfUrl={manualNotePdfUrl}
  setManualNotePdfUrl={setManualNotePdfUrl}
  setAdminNotePdf={setAdminNotePdf}
  uploadingPdf={uploadingPdf}
  handleUploadPdf={handleUploadPdf}
  adminNoteType={adminNoteType}
  setAdminNoteType={setAdminNoteType}
  handleSaveNote={handleSaveNote}
  editingNoteId={editingNoteId}
  notesData={[]}
  firebaseNotes={firebaseNotes}
  handleDeleteNote={handleDeleteNote}
  handleEditNote={handleEditNote}

  currentTitle={currentTitle}
  setCurrentTitle={setCurrentTitle}
  currentMonth={currentMonth}
  setCurrentMonth={setCurrentMonth}
  currentPages={currentPages}
  setCurrentPages={setCurrentPages}
  manualCurrentPdfUrl={manualCurrentPdfUrl}
  setManualCurrentPdfUrl={setManualCurrentPdfUrl}
  setCurrentPdf={setCurrentPdf}
  uploadingCurrentPdf={uploadingCurrentPdf}
  handleUploadCurrentPdf={handleUploadCurrentPdf}
  currentType={currentType}
  setCurrentType={setCurrentType}
  handleSaveCurrentAffairs={handleSaveCurrentAffairs}
  editingCurrentId={editingCurrentId}
  currentAffairsList={currentAffairsList}
  fallbackCurrentAffairs={fallbackCurrentAffairs}
  handleDeleteCurrentAffairs={handleDeleteCurrentAffairs}
  handleEditCurrentAffairs={handleEditCurrentAffairs}

  adminQuestion={adminQuestion}
  setAdminQuestion={setAdminQuestion}
  adminOption1={adminOption1}
  setAdminOption1={setAdminOption1}
  adminOption2={adminOption2}
  setAdminOption2={setAdminOption2}
  adminOption3={adminOption3}
  setAdminOption3={setAdminOption3}
  adminOption4={adminOption4}
  setAdminOption4={setAdminOption4}
  adminAnswer={adminAnswer}
  setAdminAnswer={setAdminAnswer}
  adminSubject={adminSubject}
  setAdminSubject={setAdminSubject}
  adminLevel={adminLevel}
  setAdminLevel={setAdminLevel}
  adminAccessPlan={adminAccessPlan}
  setAdminAccessPlan={setAdminAccessPlan}
  handleAddMockQuestion={handleAddMockQuestion}
  mockQuestions={mockQuestions}
  handleDeleteMockQuestion={handleDeleteMockQuestion}

  paymentHistory={paymentHistory}

  announcementTitle={announcementTitle}
setAnnouncementTitle={setAnnouncementTitle}
announcementMessage={announcementMessage}
setAnnouncementMessage={setAnnouncementMessage}
  announcements={announcements}
  handleAddAnnouncement={handleAddAnnouncement}
  handleDeleteAnnouncement={handleDeleteAnnouncement}
  universalContent={universalContent}
  contentLoading={contentLoading}

  cmsTitle={cmsTitle}
  setCmsTitle={setCmsTitle}
  cmsSection={cmsSection}
  setCmsSection={setCmsSection}
  cmsSubject={cmsSubject}
  setCmsSubject={setCmsSubject}
  cmsCourse={cmsCourse}
  setCmsCourse={setCmsCourse}
  cmsChapter={cmsChapter}
  setCmsChapter={setCmsChapter}
  cmsPlanType={cmsPlanType}
  setCmsPlanType={setCmsPlanType}
  cmsContentType={cmsContentType}
  setCmsContentType={setCmsContentType}
  cmsSourceType={cmsSourceType}
  setCmsSourceType={setCmsSourceType}
  cmsFileUrl={cmsFileUrl}
  setCmsFileUrl={setCmsFileUrl}
  cmsVideoUrl={cmsVideoUrl}
  setCmsVideoUrl={setCmsVideoUrl}
  cmsThumbnailUrl={cmsThumbnailUrl}
  setCmsThumbnailUrl={setCmsThumbnailUrl}
  cmsMentorName={cmsMentorName}
  setCmsMentorName={setCmsMentorName}
  cmsMonth={cmsMonth}
  setCmsMonth={setCmsMonth}
  cmsDuration={cmsDuration}
  setCmsDuration={setCmsDuration}
  cmsStatus={cmsStatus}
  setCmsStatus={setCmsStatus}
  editingCmsId={editingCmsId}
  setEditingCmsId={setEditingCmsId}
  handleSaveUniversalContent={handleSaveUniversalContent}
/>
)}


<CurrentAffairs
  currentAffairsList={
    universalCurrentAffairs.length > 0
      ? universalCurrentAffairs
      : currentAffairsList
  }
  fallbackCurrentAffairs={[]}
  handleNoteAccess={handleNoteAccess}
  isPremiumUser={isPremiumUser}
  userPlanType={userPlanType}
  hasPlanAccess={hasPlanAccess}
  setActiveSection={setActiveSection}
/>




</div>
)}
<a
  href="https://wa.me/917304256002"
  target="_blank"
  rel="noopener noreferrer"
  className="whatsappFloat"
>
  💬
</a>
  </React.Suspense>
);
}

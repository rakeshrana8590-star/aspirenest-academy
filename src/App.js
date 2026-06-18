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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
const AuthSection = React.lazy(() => import("./components/AuthSection.jsx"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel.jsx"));
const StudentDashboard = React.lazy(() => import("./components/StudentDashboard.jsx"));

const NotesCMS = React.lazy(() => import("./components/NotesCMS.jsx"));
const CurrentAffairs = React.lazy(() => import("./components/CurrentAffairs.jsx"));
const Pricing = React.lazy(() => import("./components/Pricing.jsx"));
const Announcements = React.lazy(() => import("./components/Announcements.jsx"));
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
deleteDoc,
updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import React, { useState, useEffect } from 'react';

import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import AspireNestLogo from "./components/AspireNestLogo.jsx";
import AppDashboard from "./components/AppDashboard.jsx";
import {
  StudentRoadmapHub,
  StudentRoadmapDetail,
  StudentRoadmapDay,
  MyAspirePath,
} from "./components/roadmaps/StudentRoadmaps.jsx";

import {
  RoadmapStudioHome,
  RoadmapImportRoute,
  RoadmapEditRoute,
  RoadmapManageRoute,
  RoadmapScheduleRoute,
  RoadmapProgressRoute,
  RoadmapResourcesRoute,
} from "./components/roadmaps/RoadmapStudio.jsx";

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
  StudentMockTestLibraryRoute,
  StudentMockTestPlanRoute,
  StudentMockTestSubjectRoute,
  StudentMockTestChapterRoute,
  StudentMockTestHistoryRoute,
  StudentMockLeaderboardRoute,
} from "./components/exam/StudentMockTestRoutes.jsx";
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

import MockTestActionMenu from "./components/exam/MockTestActionMenu.jsx";
import { deleteMockTest } from "./components/exam/mockTestAdminActions.js";



import {
  createEmptyMockQuestion,
  createDefaultMockTestForm,
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
} from "./components/exam/mockTestFormUtils.js";

import { useExamAttemptState } from "./components/exam/useExamAttemptState.js";
import { useExamTimer } from "./components/exam/useExamTimer.js";
import { useExamSecurity } from "./components/exam/useExamSecurity.js";
import { useMockTestActionMenu } from "./components/exam/useMockTestActionMenu.js";
import {
  downloadMockTestXlsxTemplate,
  downloadMockTestCsvTemplate,
} from "./components/exam/mockTestTemplateDownloads.js";
import {
  convertGoogleDriveUrlToDownloadUrl,
  importMockTestJsonAsDraft,
  buildMockTestImportPayloadFromRows,
  readMockTestWorkbookRowsFromArrayBuffer,
} from "./components/exam/mockTestImportUtils.js";
import './style.css';
import "./styles/exam/examHeader.css";
import "./styles/exam/questionWorkspace.css";
import "./styles/exam/actionBar.css";
import "./styles/exam/palettePanel.css";
import "./styles/exam/warningCard.css";
import "./styles/exam/submitCard.css";
import "./styles/exam/reviewResult.css";
import "./styles/exam/examStart.css";
import "./styles/exam/studentMockTests.css";
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
  const isExamAttemptPage = location.pathname.includes(
    "/ctet-tet/mock-tests/attempt/"
  );

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
  const requireLogin = () => {
    if (!user) {
      navigate("/login", { replace: true });
      return false;
    }
  
    return true;
  };
  
  const requireAdmin = () => {
    if (!user) {
      navigate("/login", { replace: true });
      return false;
    }
  
    if (!isAdmin(user)) {
      navigate("/", { replace: true });
      return false;
    }
  
    return true;
  };
  const hasPlanAccess = (requiredPlan) => {
    if (isAdmin(user)) {
      return true;
    }

    const hierarchy = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      MENTORSHIP: 3,
    };
    const openProtectedSection = (sectionName, requiredPlan = "PREMIUM") => {
      if (hasPlanAccess(requiredPlan)) {
        navigate(`/${sectionName}`);
      } else {
        navigate("/ctet-tet/pricing");;
      }
    };
  
    return (
      hierarchy[userPlanType || "FREE"] >=
      hierarchy[requiredPlan]
    );
  };

  const getMockTestScheduleStatus = (test) => {
    if (!test) {
      return "EXPIRED";
    }
  
    const scheduleType = test.scheduleType || "alwaysAvailable";
  
    if (scheduleType === "alwaysAvailable") {
      return "AVAILABLE";
    }
  
    const now = new Date();
  
    const startDateTime =
      test.examStartDate && test.examStartTime
        ? new Date(`${test.examStartDate}T${test.examStartTime}`)
        : test.examStartDate
        ? new Date(`${test.examStartDate}T00:00`)
        : null;
  
    const endDateTime =
      test.examEndDate && test.examEndTime
        ? new Date(`${test.examEndDate}T${test.examEndTime}`)
        : test.examEndDate
        ? new Date(`${test.examEndDate}T23:59`)
        : null;
  
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
  
    if (test.planType && !hasPlanAccess(test.planType)) {
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
    const finalStatus = mockTestForm.status || "published";

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
    resultPublishMode: mockTestForm.resultPublishMode || "instant",
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

    if (editingMockTestId) {
      await updateDoc(doc(db, "contentItems", editingMockTestId), {
        ...mockPayload,
        editedAt: new Date(),
      });

      alert("Examination Test updated successfully ✅");
    } else {
      await addDoc(collection(db, "contentItems"), {
        ...mockPayload,
        createdAt: new Date(),
      });

      alert("Examination Test saved successfully ✅");
    }

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const verifiedUser =
        currentUser && currentUser.emailVerified ? currentUser : null;
    
      setUser(verifiedUser);
    
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
  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
  
      await addDoc(collection(db, "students"), {
        email: email,
        isPremium: false,
        createdAt: new Date(),
      });
  
      await sendEmailVerification(userCredential.user);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        isPremium: false,
        subscriptionType: "FREE",
        purchasedCourses: [],
        createdAt: new Date(),
      });
  
      alert("Account Created Successfully 🚀");
    } catch (error) {
      alert(error.message);
    }
  };
  const handleLogin = async () => {
    if (window.self !== window.top) {
      alert(
        "StackBlitz preview me login block ho sakta hai. App new tab me open ho rahi hai."
      );
  
      window.open(window.location.href, "_blank");
      return;
    }
  
    try {
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
  
      if (!userCredential.user.emailVerified) {
        alert(
          "Please verify your email before login 📩"
        );
  
        await signOut(auth);
  
        return;
      }
  
      navigate("/academy-overview", { replace: true });
  
    } catch (error) {
      alert(error.message);
    }
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStudents([]);
setEnquiries([]);
      alert("Logged out successfully");
    } catch (error) {
      alert(error.message);
    }
  };
  const handleGoogleLogin = async () => {
    if (window.self !== window.top) {
      alert(
        "StackBlitz preview me Google login block hota hai. App new tab me open ho rahi hai."
      );
  
      window.open(window.location.href, "_blank");
      return;
    }
  
    try {
      await signInWithPopup(auth, provider);
  
      navigate("/academy-overview", { replace: true });
  
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
  const handleNoteAccess = (note) => {
    if (!note) {
      return;
    }
  
    const accessType =
      note.accessPlan || note.type || "FREE";
  
    if (
      accessType !== "FREE" &&
      !hasPlanAccess(accessType)
    ) {
      navigate("/ctet-tet/pricing");
  
      alert(
        `This content requires ${accessType} membership access.`
      );
  
      return;
    }
  
    if (!note.pdf || note.pdf === "#") {
      alert("PDF will be uploaded soon.");
      return;
    }
  
    window.open(note.pdf, "_blank");
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
  const savePaymentRecord = async (paymentResponse) => {
    if (!user) return;
  
    try {
      const purchaseDate = new Date();

const expiryDate = new Date();
expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      await addDoc(collection(db, "payments"), {
        userId: user.uid,
        email: user.email,
        amount: 199,
        currency: "INR",
        plan: "Premium Membership",
        status: "SUCCESS",
        paymentId: paymentResponse?.razorpay_payment_id || "DEMO_PAYMENT",
        orderId: paymentResponse?.razorpay_order_id || "DEMO_ORDER",
        signature: paymentResponse?.razorpay_signature || "DEMO_SIGNATURE",
        purchaseDate: purchaseDate,
expiryDate: expiryDate,
premiumStatus: "ACTIVE",
activePlan: payment.planName || planType,
        createdAt: new Date(),
      });
  
      loadPaymentHistory();
    } catch (error) {
      alert(error.message);
    }
  };
  const unlockPremiumAccess = async (planName = "PREMIUM") => {
    if (!user) {
      alert("Please login first.");
      return;
    }
  
    try {
      const userRef = doc(db, "users", user.uid);
  
      const purchaseDate = new Date();

      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      await setDoc(
        userRef,
        {
          email: user.email,
          isPremium: true,
          subscriptionType: planType,
          purchasedCourses: [planType],
          purchaseDate: purchaseDate,
          expiryDate: expiryDate,
          premiumStatus: "ACTIVE",
        },
        { merge: true }
      );
  
      setIsPremiumUser(true);
      setActivePlan(planType);

      alert("Premium access unlocked successfully ✅");
    } catch (error) {
      alert(error.message);
    }
  };
  const handlePremiumPurchase = async () => {
    if (!user) {
      alert("Please login first.");
      return;
    }
    
    if (isPremiumUser) {
      alert("You already have premium access ✅");
      return;
    }
    const loaded = await loadRazorpayScript();
  
    if (!loaded) {
      alert("Razorpay SDK failed to load.");
      return;
    }
  
    const options = {
      key: "rzp_test_1DP5mmOlF5G5ag",
  
      amount: 19900,
  
      currency: "INR",
  
      name: "AspireNest Academy",
  
      description: "Premium Membership",
  
      handler: async function (response) {
        await savePaymentRecord(response);
      
        await unlockPremiumAccess();
      
        alert("Payment successful ✅");
      },
  
      prefill: {
        email: user?.email || "",
      },
  
      theme: {
        color: "#ff7b00",
      },
    };
  
    const paymentObject = new window.Razorpay(options);
  
    paymentObject.open();
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
    try {
      const q = query(
        collection(db, "mockResults"),
        where("email", "==", email)
      );
  
      const querySnapshot = await getDocs(q);
  
      setMockResults(
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      alert(error.message);
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
    loadQuestionBankFromFirestore();
    loadNotesSubjectsFromFirestore();
    loadNotesChaptersFromFirestore();
  }, []);

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
  
    const newAnnouncement = {
      id: Date.now(),
      title: announcementTitle,
      message: announcementMessage,
      createdAt: new Date(),
    };
    await addDoc(collection(db, "announcements"), {
      title: announcementTitle,
      message: announcementMessage,
      createdAt: new Date(),
    });
    setAnnouncements([newAnnouncement, ...announcements]);
  
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
  
        alert("Notes updated successfully.");
      } else {
        await addDoc(collection(db, "contentItems"), {
          ...notesPayload,
          createdAt: new Date().toISOString(),
        });
  
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
  const approvePaymentRequest = async (payment) => {
    if (!payment?.id) {
      alert("Payment record not found.");
      return;
    }
  
    try {
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
    : "PREMIUM";
  
      const purchaseDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
  
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
      });
  
      alert("Payment approved and premium access activated ✅");
  
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
{!isExamAttemptPage && (
  <header className="cleanHeader">
    <div className="cleanBrand">
      <AspireNestLogo />
    </div>

    <nav className="cleanNav">
      {!user ? (
        <button
          className="cleanHeaderBtn"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      ) : (
        <button
          className="cleanHeaderSwitch"
          onClick={handleLogout}
          title="Click to logout"
        >
          <span className="switchDot"></span>
          <span>
            {isAdmin(user) ? "Admin ON" : "Student ON"}
          </span>
        </button>
      )}
    </nav>
  </header>
)}
<main className="appShell">
<Routes key={location.key || location.pathname}>

<Route
  path="/ctet-tet/roadmaps"
  element={
    <StudentRoadmapHub
      user={user}
      userPlanType={userPlanType}
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
  element={
    <section className="academyOverviewPage">

      {/* SCREEN 1 — HERO */}
      <div className="academyHero">

        <div className="academyHeroLeft">

          <span className="academyBadge">
            AspireNest Academic Overview
          </span>

          <h1>
            AspireNest Academy
            Learning Platform
            for Every Student Journey
          </h1>

          <p>
            A structured academic platform where students can explore
            learning domains, study resources, practice systems,
            guidance, progress tracking, and subject-wise preparation pathways.
          </p>

         

        </div>

        <div className="academyHeroRight">

          <div className="academyPreviewCard">

            <h3>AspireNest Academic System</h3>

            <div className="academyStat">
              <span>Learning Structure</span>
              <strong>92%</strong>
            </div>

            <div className="academyBar">
              <div className="academyFill"></div>
            </div>

            <div className="academyMiniGrid">

              <div className="academyMiniCard">📚 Study Resources</div>
              <div className="academyMiniCard">🎯 Practice Systems</div>
              <div className="academyMiniCard">🧭 Guided Learning</div>
              <div className="academyMiniCard">📊 Progress Tracking</div>

            </div>

          </div>

        </div>

      </div>

      {/* SCREEN 2 — PLATFORM OVERVIEW */}
      <div className="academySectionIntro">


        <h2>
          A complete academic platform,
          designed to grow beyond one subject.
        </h2>
        <p>
  AspireNest Academy is designed as a scalable
  learning platform where students can access
  structured preparation systems, practice tools,
  study resources, mentorship, and future academic domains
  under one organized ecosystem.
</p>

      </div>

      <div className="academyTrustStrip">

        <div className="academyTrustCard">
          <h3>Structured Learning</h3>
          <p>Clear academic pathways for focused preparation.</p>
        </div>

        <div className="academyTrustCard">
          <h3>Study Resources</h3>
          <p>Notes, learning material, and subject-wise support.</p>
        </div>

        <div className="academyTrustCard">
          <h3>Practice System</h3>
          <p>Mock tests and preparation tools for improvement.</p>
        </div>

        <div className="academyTrustCard">
          <h3>Progress Tracking</h3>
          <p>Learning performance and student growth visibility.</p>
        </div>

      </div>

      {/* SCREEN 3 — LEARNING DOMAINS */}
      <div className="academySectionIntro">


        <h2>
          Choose a learning domain
          to continue.
        </h2>

        <p>
          CTET/TET is the first active learning domain.
          More academic domains can be added under the same
          platform structure as AspireNest grows.
        </p>

      </div>

      <div className="academyOverviewGrid">

        <div
          className="academyOverviewCard"
          onClick={() => navigate("/ctet-tet")}
        >

          <h3>CTET / TET</h3>

          <p>
            Active preparation domain with notes, practice systems,
            mock tests, current affairs, mentorship, and learning tools.
          </p>


        </div>

        <div className="academyOverviewCard disabled">

          <h3>Psychology</h3>

          <p>
            Future learning domain for psychology-focused academic study.
          </p>

          <span>Launching Soon</span>

        </div>

        <div className="academyOverviewCard disabled">

          <h3>B.Ed / D.El.Ed</h3>

          <p>
            Future domain for teaching education and pedagogy learning.
          </p>

          <span>Launching Soon</span>

        </div>

      </div>

{/* SCREEN 4 — LEARNING EXPERIENCE */}
<div className="academyStorySection">

  <div className="academyStoryText">

    <span>LEARNING EXPERIENCE</span>

    <h2>
      A clear learning journey
      from study to progress.
    </h2>

    <p>
      AspireNest keeps preparation simple and organized:
      students choose a learning domain, access study resources,
      practice with structured systems, and track their progress
      step by step.
    </p>

  </div>

  <div className="academyStoryVisual">

    <div className="academyVisualCard">

      <h3>Student Learning Flow</h3>

      <div className="academyVisualList">
        <p>✅ Choose a learning domain</p>
        <p>✅ Study with organized resources</p>
        <p>✅ Practice with mock systems</p>
        <p>✅ Track preparation progress</p>
      </div>

    </div>

  </div>

</div>

      {/* SCREEN 5 — FUTURE VISION */}
      <div className="academyFinalCTA">


        <h2>
          Built to expand into a complete
          academic learning ecosystem.
        </h2>

        <p>
          AspireNest starts with CTET/TET and can grow into multiple
          subject-wise learning domains without changing the core platform.
        </p>

      </div>

    </section>
  }
/>
<Route
  path="/login"
  element={
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
  }
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
    <div className="heroButtons">
    <button onClick={() => navigate("/learning")}>
  Start Learning
</button>
{user && (
  <button
    onClick={() =>
      navigate(isAdmin(user) ? "/admin" : "/student-dashboard")
    }
  >
    {isAdmin(user)
      ? "Admin Dashboard"
      : "My Dashboard"}
  </button>
)}
<button
  onClick={() => navigate("/ctet-tet/notes")}
>
  Free Notes
</button>
</div>
</div>

{false && (
  <div className="heroStats">
    <div className="statCard">
      <h3>5K+</h3>
      <p>Students</p>
    </div>

    <div className="statCard">
      <h3>120+</h3>
      <p>Visual Notes</p>
    </div>

    <div className="statCard">
      <h3>50+</h3>
      <p>Mock Tests</p>
    </div>

    <div className="statCard">
      <h3>92%</h3>
      <p>Success Rate</p>
    </div>
  </div>
)}

{user && (
  <div
    className="dashboardQuickCard"
    onClick={() =>
      navigate(isAdmin(user) ? "/admin" : "/student-dashboard")
    }
  >
    <div className="dashboardQuickLeft">
      <span className="dashboardQuickBadge">
        {isAdmin(user) ? "ADMIN ACCESS" : "STUDENT ACCESS"}
      </span>

      <h3>
        {isAdmin(user)
          ? "Admin Dashboard"
          : `Welcome back, ${
              user?.displayName ||
              user?.email?.split("@")[0] ||
              "Student"
            }`}
      </h3>

      <p>
  {isAdmin(user)
    ? "Manage students, payments, notes, mock tests, announcements and platform analytics from one admin workspace."
    : "Continue your learning journey, track progress, access tests, analytics and premium resources."}
</p>

      <button>
        {isAdmin(user)
          ? "Open Admin Dashboard"
          : "Open My Dashboard"}
      </button>
    </div>

    <div className="dashboardQuickRight">
      📊
    </div>
  </div>
)}

{false && (
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

    <span>
      <strong>75%</strong> Completed
    </span>
  </div>
)}

</section>

<section className="mentor" id="about">

<div className="mentorLeft">

  <span className="badge">Meet Your Expert Educator</span>

  <h2>Dr. Varsha D. Maru</h2>

  <p className="mentorIntro">
    Learn from a Ph.D. qualified educator, I/C Principal,
    Assistant Professor, researcher, and CTET/TET mentor
    with strong expertise in Education, Psychology,
    Pedagogy, Teacher Training, and Digital Learning.
  </p>

  <div className="mentorStats">

    <div className="mentorStat">
      <h3>Ph.D.</h3>
      <span>Education</span>
    </div>

    <div className="mentorStat">
  <h3>UGC-NET</h3>
  <p>Education Qualified</p>
</div>

    <div className="mentorStat">
      <h3>CTET</h3>
      <span>Paper II Qualified</span>
    </div>

  </div>

  <div className="mentorQuote">
    “Concept clarity, practical pedagogy, bilingual explanation,
    and exam-focused preparation are at the heart of our teaching.”
  </div>

  <div className="buttons">
  <button
    className="btnLink"
    onClick={() => navigate("/ctet-tet/courses")}
  >
    Explore Courses
  </button>

  <button
    className="secondaryBtn"
    onClick={() => setShowMentorProfile(true)}
  >
  Contact Mentor
</button>
<button
  className="secondaryBtn"
  onClick={() => setShowProfile(true)}
>
  View Full Profile
</button>

  </div>

</div>

<div className="mentorCard premiumMentorCard">

  <div className="mentorCardTop">
    <div className="mentorAvatar">VM</div>

    <div>
      <h3>Academic Profile</h3>
      <p>Educator • Researcher • Academic Leader</p>
    </div>
  </div>

  <div className="mentorHighlights">

    <div className="mentorHighlight">
      <strong>🏫 Current Role</strong>
      <span>I/C Principal & Assistant Professor</span>
    </div>

    <div className="mentorHighlight">
      <strong>🎓 Qualification</strong>
      <span>Ph.D. in Education, M.Ed., M.A. Psychology</span>
    </div>

    <div className="mentorHighlight">
      <strong>📚 Exam Expertise</strong>
      <span>CTET Paper II Qualified, TAIT Qualified</span>
    </div>

    <div className="mentorHighlight">
      <strong>🧠 Research Area</strong>
      <span>Cyberbullying, Mental Health, Education & Psychology</span>
    </div>

    <div className="mentorHighlight">
      <strong>🏆 Recognition</strong>
      <span>Best Excellence Teacher Award</span>
    </div>

    <div className="mentorHighlight">
      <strong>💻 Digital Learning</strong>
      <span>Google Certified Educator, AI & NEP 2020 Training</span>
    </div>

  </div>

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
)}<AppDashboard
setActiveSection={setActiveSection}
setActiveAdminTab={setActiveAdminTab}
user={user}
isAdmin={isAdmin}
/>

{(leaderboard || []).length > 0 && (
<section className="leaderboardSection">
  <div className="leaderboardHeader">
    <span className="badge">Top Performers</span>

    <h2>Mock Test Leaderboard</h2>

    <p>
      Highest scoring students from recent CTET/TET mock practice.
    </p>
  </div>

  <div className="leaderboardGrid">
    {(leaderboard || []).map((student, index) => (
      <div className="leaderCard" key={student.id || index}>
        <div className="rankBadge">
          #{index + 1}
        </div>

        <h3>
          {student.email || "Student"}
        </h3>

        <p className="leaderScore">
          {student.percentage || 0}%
        </p>

        <span className="leaderTag">
          Top Score
        </span>
      </div>
    ))}
  </div>
</section>
)}

<section className="premium" id="premium-section">
        <div className="premiumLeft">
          <span className="premiumBadge">PREMIUM LEARNING EXPERIENCE</span>

          <h2>
            India’s Smartest
            <br />
            CTET/TET Preparation Platform
          </h2>

          <p>
            AI-powered visual learning, bilingual notes, premium mock tests,
            revision systems and mentor guidance for serious aspirants.
          </p>

          <div className="premiumFeatures">
            <div className="feature">✅ Visual Learning Notes</div>

            <div className="feature">✅ Full Mock Test Series</div>

            <div className="feature">✅ Smart Revision System</div>

            <div className="feature">✅ Hindi + English Support</div>
          </div>

          <button onClick={handlePremiumSectionAccess}>
  Explore Premium
</button>
        </div>

        <div className="premiumCard">
          <div className="glow"></div>

          <h3>CTET Master Dashboard</h3>

          <div className="dashboardStat">
            <span>Course Progress</span>
            <strong>82%</strong>
          </div>

          <div className="dashboardBar">
            <div className="dashboardFill"></div>
          </div>

          <div className="dashboardGrid">
            <div className="miniCard">📘 150+ Notes</div>

            <div className="miniCard">🎯 50+ Tests</div>

            <div className="miniCard">🧠 AI Revision</div>

            <div className="miniCard">🏆 Top Scores</div>
          </div>
        </div>
      </section>

<section className="freeResources">
  <div className="container">
    <h2>Free Resources</h2>

    <p>
    Start your preparation with free notes and study tools.
    </p>

    <div className="freeGrid">
    <div
  className="freeCard"
  onClick={() => navigate("/ctet-tet/notes")}
>
        📘 Free CDP Notes
      </div>

      <div className="freeCard">
        🗓️ 7-Day Study Plan
      </div>

      <div
  className="freeCard"
  onClick={() => navigate("/ctet-tet/mock-tests")}
>
        📝 Free Mock Test
      </div>

      <div className="freeCard">
        📄 PYQ Starter Pack
      </div>

      <div className="freeCard">
        🎯 Exam Strategy Guide
      </div>

      <div className="freeCard">
        ✅ Revision Checklist
      </div>
    </div>
  </div>
</section>


      <section className="footerPanels" id="contact">
  <div className="footerPanelCard">
    <span>STUDENT REVIEWS</span>
    <h3>Trusted by CTET/TET learners.</h3>
    <p className="stars">⭐⭐⭐⭐⭐</p>
    <p>Visual notes se revision bahut fast ho gaya.</p>
    <strong>Priya Sharma</strong>
  </div>

  <div className="footerPanelCard enquiryPanel">
    <span>GET IN TOUCH</span>
    <h3>Need guidance? Send enquiry.</h3>

    <input
      value={fullName}
      onChange={(e) => setFullName(e.target.value)}
      placeholder="Full Name"
    />

    <input
      value={mobile}
      onChange={(e) => setMobile(e.target.value)}
      placeholder="Mobile Number"
    />

    <input
      value={contactEmail}
      onChange={(e) => setContactEmail(e.target.value)}
      placeholder="Email"
    />

    <button type="button" onClick={handleContactSubmit}>
      Submit Enquiry
    </button>
  </div>

  <div className="footerPanelCard">
    <span>FAQ</span>
    <h3>Quick answers before joining.</h3>
    <p>▶ Is this course bilingual?</p>
    <p>▶ Are mock tests included?</p>
    <p>▶ Can I use this on mobile?</p>
    <p>▶ Is pricing in INR?</p>
  </div>
</section>

    <footer className="premiumFooter">
  <div className="footerGrid">
    <div className="footerBrand">
      <h2>AspireNest Academy</h2>

      <p>
        Premium bilingual CTET/TET learning platform
        for future educators in India.
      </p>
    </div>

    <div className="footerLinks">
      <h3>Quick Links</h3>
      <button onClick={() => navigate("/ctet-tet/courses")}>
  Courses
</button>
<button onClick={() => navigate("/cdp")}>
  CDP Module
</button>
<button onClick={() => navigate("/resources")}>
  Free Resources
</button>
      <button onClick={() => navigate("/ctet-tet/pricing")}>
  Pricing
</button>
    </div>

    <div className="footerContact">
      <h3>Contact</h3>
      <p>📞 +917304256002</p>
      <p>📧 aspirenestacademy@gmail.com</p>
      <p>📍 India</p>
    </div>
  </div>

  <div className="footerBottom">
    © 2026 AspireNest Academy • All Rights Reserved
  </div>
</footer>

</>
  }
/>

<Route
  path="/subjects"
  element={
    <section className="coursePages subjectSelectorPage">
      <div className="sectionHeader">
        <span className="badge">Choose Learning Category</span>

        <h2>Select Your Subject / Exam Path</h2>

        <p>
          Every subject will have its own mentor, courses, notes,
          tests, dashboard, and premium learning system.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/ctet-tet")}>
          🧑‍🏫 CTET / TET
        </button>

        <button>
          🧠 Psychology
        </button>

        <button>
          🎓 B.Ed / D.El.Ed
        </button>

        <button>
          🏛️ Government Exams
        </button>

        <button>
          📚 State TET
        </button>
      </div>

    </section>
  }
/>


<Route
  path="/ctet-tet"
  element={
    <section className="coursePages subjectHubPage">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Subject Hub</span>

        <h2>CTET & TET Preparation Ecosystem</h2>

        <p>
          A complete mentor-guided learning system with courses,
          notes, mock tests, current affairs, premium plans,
          dashboard, and guidance by Dr. Varsha D. Maru.
        </p>
      </div>
      <div className="subjectHubGrid">
<div
  className="subjectHubCard"
  onClick={() => navigate("/ctet-tet/courses")}
>
  <div className="subjectHubIcon">📚</div>

  <h3>Courses</h3>

  <p>
    Structured CTET/TET learning paths with concept-wise preparation.
  </p>

  <span>Explore Courses →</span>
</div>

<div
  className="subjectHubCard"
  onClick={() => navigate("/ctet-tet/notes")}
>
  <div className="subjectHubIcon">📘</div>

  <h3>Notes Library</h3>

  <p>
    Free, premium, revision, and mentor-curated study notes.
  </p>

  <span>Open Notes →</span>
</div>

<div
  className="subjectHubCard"
  onClick={() => navigate("/ctet-tet/videos")}
>
  <div className="subjectHubIcon">🎬</div>

  <h3>Recorded Videos</h3>

  <p>
    Watch chapter-wise recorded lectures with related notes,
    next lectures, and classroom learning flow.
  </p>

  <span>Open Videos →</span>
</div>

<div
  className="subjectHubCard"
  onClick={() => navigate("/ctet-tet/mock-tests")}
>
  <div className="subjectHubIcon">📝</div>

  <h3>Mock Tests</h3>

  <p>
    Practice tests with analytics, ranking, and performance tracking.
  </p>

  <span>Start Practice →</span>
</div>

<div
  className="subjectHubCard"
  onClick={() => navigate("/ctet-tet/current-affairs")}
>
  <div className="subjectHubIcon">📰</div>

  <h3>Current Affairs</h3>

  <p>
    Daily educational updates and exam-focused current affairs.
  </p>

  <span>Read Updates →</span>
</div>

<div
  className="subjectHubCard"
  onClick={() => navigate("/ctet-tet/roadmaps")}
>
  <div className="subjectHubIcon">🛣️</div>

  <h3>AspirePath</h3>

  <p>
    Follow smart study roadmaps with daily tasks, live sessions,
    mock tests, revision, and progress tracking.
  </p>

  <span>Open Roadmaps →</span>
</div>

<div
  className="subjectHubCard"
  onClick={() => navigate("/ctet-tet/pricing")}
>
  <div className="subjectHubIcon">💎</div>

  <h3>Premium Plans</h3>

  <p>
    Unlock premium mentorship, notes, tests, and learning tools.
  </p>

  <span>View Plans →</span>
</div>

<div
  className="subjectHubCard"
  onClick={() => navigate("/student-dashboard")}
>
  <div className="subjectHubIcon">📊</div>

  <h3>Student Dashboard</h3>

  <p>
    Track progress, performance analytics, targets, and study growth.
  </p>

  <span>Open Dashboard →</span>
</div>

</div>
    </section>
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
    <section className="footerPanels contactScreen">
      <div className="footerPanelCard">
        <span>STUDENT REVIEWS</span>

        <h3>Trusted by CTET/TET learners.</h3>

        <p className="stars">⭐⭐⭐⭐⭐</p>

        <p>
          Visual notes se revision bahut fast ho gaya.
        </p>

        <strong>Priva Sharma</strong>
      </div>

      <div className="footerPanelCard">
        <span>CONTACT</span>

        <h3>Let’s build your teaching career.</h3>

        <p>Email: aspirenestacademy@gmail.com</p>

        <p>WhatsApp Support Available</p>

        <button
          onClick={() => navigate("/")}
          className="btnPrimary"
        >
          ← Back to Home
        </button>
      </div>
    </section>
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
        </div>
      </section>
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

          <button onClick={() => { setActiveAdminTab("Payments"); navigate("/admin/payments"); }}>
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
            isAdmin={isAdmin}
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
            paymentRequests={paymentRequests || []}
            loadPaymentRequests={loadPaymentRequests}
            loadAdminData={loadAdminData}
            loadLeaderboard={loadLeaderboard}
            loadPaymentHistory={loadPaymentHistory}
            handlePremiumControl={handlePremiumControl}
            approvePaymentRequest={approvePaymentRequest}
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
            navigate(
              "/admin/content/pricing"
            )
          }
        >
          💳 Pricing Manager
        </button>

      </div>
    </section>
  }
/>


<Route
  path="/admin/content/notes"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">NOTES MANAGER</span>

          <h1>Notes Content Manager</h1>

          <p>
            Manage CTET/TET notes by plan,
            subject, chapter, PDF source,
            publish status, and access level.
          </p>
        </div>

        <div className="contentStudioForm">
  <div className="contentStudioGrid">
          <button onClick={() => navigate("/admin/content/notes/manage")}>
            Manage All Notes
          </button>

          <button onClick={() => navigate("/admin/content/notes/form")}>
            + Add New Note
          </button>

          <button
  onClick={() =>
    navigate("/admin/content/notes/plan/FREE")
  }
>
  FREE Notes
</button>

<button
  onClick={() =>
    navigate("/admin/content/notes/plan/BASIC")
  }
>
  BASIC Notes
</button>

<button
  onClick={() =>
    navigate("/admin/content/notes/plan/PREMIUM")
  }
>
  PREMIUM Notes
</button>

<button
  onClick={() =>
    navigate("/admin/content/notes/plan/MENTORSHIP")
  }
>
  MENTORSHIP Notes
</button>
          <button
  onClick={() =>
    navigate("/admin/content/notes/subjects")
  }
>
  Subjects
</button>
<button
  onClick={() =>
    navigate("/admin/content/notes/chapters")
  }
>
  Chapters
</button>
<button
  onClick={() =>
    navigate("/admin/content/notes/pdfs")
  }
>
  PDFs
</button>

          <button onClick={() => navigate("/admin/content")}>
            ← Back to Content Studio
          </button>
          </div>
</div>
      </section>
    ) : null
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
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">MANAGE NOTES</span>

          <h1>Published Notes Manager</h1>

          <p>
            Review, edit, update, delete,
            and organize all saved notes.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
            <button onClick={() => setNotesPlanFilter("ALL")}>
              ALL
            </button>

            <button onClick={() => setNotesPlanFilter("FREE")}>
              FREE
            </button>

            <button onClick={() => setNotesPlanFilter("BASIC")}>
              BASIC
            </button>

            <button onClick={() => setNotesPlanFilter("PREMIUM")}>
              PREMIUM
            </button>

            <button onClick={() => setNotesPlanFilter("MENTORSHIP")}>
              MENTORSHIP
            </button>
          </div>
        </div>

        <div className="contentStudioList">
          <h3>Published Notes Preview</h3>

          {universalContent
            .filter(
              (item) =>
                item.section === "notes" &&
                (
                  notesPlanFilter === "ALL" ||
                  item.planType === notesPlanFilter
                )
            )
            .map((item) => (
              <div className="contentStudioItem" key={item.id}>
                <strong>{item.title}</strong>

                <p>{item.description}</p>

                <span>
                  {item.planType} • {item.subject} • {item.status}
                </span>

                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() => {
                      const finalPdfUrl =
                        item.pdfUrl ||
                        item.fileUrl ||
                        item.pdf ||
                        item.url ||
                        "";

                      if (!finalPdfUrl) {
                        alert("PDF URL missing for this note.");
                        return;
                      }

                      window.open(
                        finalPdfUrl,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    Open PDF
                  </button>

                  <button
                    className="publishButton"
                    onClick={() => {
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
                  >
                    Edit
                  </button>

                  <button
                    className="deleteContentButton"
                    onClick={() => {
                      const confirmDelete = window.confirm(
                        `Delete "${item.title}" permanently?\n\n` +
                          `Students may lose access to this content.\n\n` +
                          `This action cannot be undone.`
                      );

                      if (!confirmDelete) return;

                      handleDeleteLocalContentItem(item.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>

        <button
          className="backButton"
          onClick={() => navigate("/admin/content/notes")}
        >
          ← Back to Notes Manager
        </button>
      </section>
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
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            PLAN LIBRARY
          </span>

          <h1>
            {location.pathname.split("/").pop()} Notes Library
          </h1>

          <p>
            Manage subjects, chapters,
            and PDFs inside each plan.
          </p>
        </div>

        <div className="contentStudioForm">
          <button
            className="backButton"
            onClick={() =>
              navigate("/admin/content/notes")
            }
          >
            ← Back to Notes Manager
          </button>

          <h3>
            {location.pathname.split("/").pop()} Plan Content
          </h3>

          <div className="contentStudioList">
            <h3>Subjects in this Plan</h3>

            {(() => {
              const activePlan =
                location.pathname.split("/").pop();

              const subjectsInPlan = [
                ...new Set(
                  universalNotes
                    .filter(
                      (note) =>
                        note.planType === activePlan &&
                        (note.status || "published")
  .toLowerCase() === "published"
                    )
                    .map((note) => {
                    
                        return getSubjectDisplayName(note.subject);
                    })
                    .filter(Boolean)
                ),
              ];

              return subjectsInPlan.length === 0 ? (
                <p>No subjects found in this plan.</p>
              ) : (
                <div className="contentStudioGrid">
                  {subjectsInPlan.map((subjectName) => (
                <button
                key={subjectName}
                className="publishButton"
                onClick={() =>
                  navigate(
                    `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                      getSubjectDisplayName(subjectName)
                    )}`
                  )
                }
              >
                {getSubjectDisplayName(subjectName)}
              </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/notes/plan/:planType/:subjectName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            SUBJECT LIBRARY
          </span>

          <h1>
            {decodeURIComponent(
              location.pathname.split("/").pop()
            )}
          </h1>

          <p>
            Manage chapters and PDFs inside this subject.
          </p>
        </div>

        <div className="contentStudioForm">
          <button
            className="backButton"
            onClick={() => {
              const parts = location.pathname.split("/");
              navigate(`/admin/content/notes/plan/${parts[4]}`);
            }}
          >
            ← Back to Plan Library
          </button>

          <h3>
            Chapters in{" "}
            {decodeURIComponent(
              location.pathname.split("/").pop()
            )}
          </h3>

          <div className="contentStudioList">
            {[
              ...new Set(
                universalNotes
                  .filter(
                    (note) =>
                      note.planType ===
                        location.pathname.split("/").slice(-2)[0] &&
                      note.subject ===
                        decodeURIComponent(
                          location.pathname.split("/").pop()
                        )
                  )
                  .map((note) => note.chapter)
                  .filter(Boolean)
              ),
            ].length === 0 ? (
              <p>No chapters found in this subject.</p>
            ) : (
              <div className="contentStudioGrid">
                {[
                  ...new Set(
                    universalNotes
                      .filter(
                        (note) =>
                          note.planType ===
                            location.pathname.split("/").slice(-2)[0] &&
                          note.subject ===
                            decodeURIComponent(
                              location.pathname.split("/").pop()
                            )
                      )
                      .map((note) => note.chapter)
                      .filter(Boolean)
                  ),
                ].map((chapterName) => (
                  <button
                  key={chapterName}
                  className="publishButton"
                  onClick={() =>
                    navigate(
                      `/admin/content/notes/plan/${
                        location.pathname.split("/").slice(-2)[0]
                      }/${
                        location.pathname.split("/").pop()
                      }/${encodeURIComponent(chapterName)}`
                    )
                  }
                >
                  {chapterName}
                </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/notes/plan/:planType/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            PDF LIBRARY
          </span>

          <h1>
            {decodeURIComponent(
              location.pathname.split("/").pop()
            )}
          </h1>

          <p>
            PDFs inside this chapter / topic.
          </p>
        </div>

        <div className="contentStudioForm">
          <button
            className="backButton"
            onClick={() => {
              const parts = location.pathname.split("/");
              navigate(`/admin/content/notes/plan/${parts[4]}/${parts[5]}`);
            }}
          >
            ← Back to Subject
          </button>

          <h3>PDFs</h3>

          <div className="contentStudioList">
            {universalNotes
              .filter(
                (note) =>
                  note.planType ===
                    location.pathname.split("/").slice(-3)[0] &&
                  note.subject ===
                    decodeURIComponent(
                      location.pathname.split("/").slice(-2)[0]
                    ) &&
                  note.chapter ===
                    decodeURIComponent(
                      location.pathname.split("/").pop()
                    )
              )
              .length === 0 ? (
              <p>No PDFs found in this chapter / topic.</p>
            ) : (
              universalNotes
                .filter(
                  (note) =>
                    note.planType ===
                      location.pathname.split("/").slice(-3)[0] &&
                    note.subject ===
                      decodeURIComponent(
                        location.pathname.split("/").slice(-2)[0]
                      ) &&
                    note.chapter ===
                      decodeURIComponent(
                        location.pathname.split("/").pop()
                      )
                )
                .map((note) => (
                  <div
                    className="contentStudioItem"
                    key={note.id}
                  >
                    <strong>{note.title}</strong>

                    <p>
                      {note.subject} • {note.chapter} •{" "}
                      {note.planType} • {note.status}
                    </p>

                    <div className="contentStudioActions">
                      <button
                        className="publishButton"
                        onClick={() => {
                          const pdfLink =
                            note.pdfUrl ||
                            note.fileUrl ||
                            note.pdf ||
                            "";
                        
                          if (!pdfLink) {
                            alert("PDF URL not found for this note.");
                            return;
                          }
                        
                          window.open(pdfLink, "_blank");
                        }}
                      >
                        Open PDF
                      </button>

                      <button
                        className="backButton"
                        onClick={() => {
                          setEditingNotesCmsId(note.id);
                          setNotesCmsTitle(note.title || "");
                          setNotesCmsDescription(note.description || "");
                          setNotesCmsPlanType(note.planType || "FREE");
                          setNotesCmsSubject(note.subject || "");
                          setNotesCmsChapter(note.chapter || "");
                          setNotesCmsMonth(note.month || "");
                          setNotesCmsYear(note.year || "");
                          setNotesCmsPdfUrl(note.pdfUrl || "");
                          setNotesCmsThumbnailUrl(note.thumbnailUrl || "");
                          setNotesCmsStatus(note.status || "Draft");

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
        `Delete "${note.title}" permanently?
      
      This PDF record will be removed from AspireNest Content Studio.
      This action cannot be undone.`
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
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/current-affairs"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            CURRENT AFFAIRS MANAGER
          </span>

          <h1>
            Current Affairs Manager
          </h1>

          <p>
            Manage CTET/TET current affairs by month, week,
            PDF source, plan access, publish status, and student visibility.
          </p>
        </div>

        <div className="subjectHubGrid">
          <button
            onClick={() =>
              navigate("/admin/content/current-affairs/manage")
            }
          >
            Manage Current Affairs
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/current-affairs/add")
            }
          >
            + Add Current Affair
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/current-affairs/months")
            }
          >
            Months
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/current-affairs/published")
            }
          >
            Published PDFs
          </button>

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
  path="/admin/content/current-affairs/add"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
        <span className="badge">
  {editingCmsId
    ? "EDIT CURRENT AFFAIR"
    : "ADD CURRENT AFFAIR"}
</span>

<h1>
  {editingCmsId
    ? "Edit Current Affair PDF"
    : "Add Current Affair PDF"}
</h1>
          <p>
            Add CTET/TET current affairs by month, week, plan,
            PDF source, and publish status.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
            <input
              type="text"
              placeholder="Title e.g. June 2026 Weekly Capsule"
              value={cmsTitle}
              onChange={(e) => setCmsTitle(e.target.value)}
            />

            <select
              value={cmsMonth}
              onChange={(e) => setCmsMonth(e.target.value)}
            >
              <option value="">Select Month</option>
              <option value="June">June</option>
              <option value="May">May</option>
              <option value="April">April</option>
              <option value="March">March</option>
              <option value="February">February</option>
              <option value="January">January</option>
            </select>

            <input
              type="text"
              placeholder="Year e.g. 2026"
              value={cmsDuration}
              onChange={(e) => setCmsDuration(e.target.value)}
            />

            <select
              value={cmsChapter}
              onChange={(e) => setCmsChapter(e.target.value)}
            >
              <option value="">Select Week / Type</option>
              <option value="Week 1">Week 1</option>
              <option value="Week 2">Week 2</option>
              <option value="Week 3">Week 3</option>
              <option value="Week 4">Week 4</option>
              <option value="Monthly Revision">Monthly Revision</option>
              <option value="Yearly Compilation">Yearly Compilation</option>
            </select>

            <select
              value={cmsPlanType}
              onChange={(e) => setCmsPlanType(e.target.value)}
            >
              <option value={PLAN_TYPES.FREE}>FREE</option>
              <option value={PLAN_TYPES.BASIC}>BASIC</option>
              <option value={PLAN_TYPES.PREMIUM}>PREMIUM</option>
              <option value={PLAN_TYPES.MENTORSHIP}>MENTORSHIP</option>
            </select>

            <input
              type="text"
              placeholder="PDF URL"
              value={cmsFileUrl}
              onChange={(e) => setCmsFileUrl(e.target.value)}
            />

            <select
              value={cmsStatus}
              onChange={(e) => setCmsStatus(e.target.value)}
            >
              <option value={CONTENT_STATUS.PUBLISHED}>published</option>
              <option value={CONTENT_STATUS.DRAFT}>draft</option>
              <option value={CONTENT_STATUS.UNPUBLISHED}>unpublished</option>
            </select>
          </div>

          <div className="contentStudioActions">
          <button
  className="publishButton"
  onClick={handleSaveCurrentAffairsContent}
>
  {editingCmsId
    ? "Update Current Affair"
    : "Publish Current Affair"}
</button>

            <button
              className="backButton"
              onClick={() =>
                navigate("/admin/content/current-affairs")
              }
            >
              ← Back to Current Affairs
            </button>
          </div>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/current-affairs/manage"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            MANAGE CURRENT AFFAIRS
          </span>

          <h1>Published Current Affairs</h1>

          <p>
            Review, edit, delete, and manage all saved CTET/TET current affairs PDFs.
          </p>
        </div>

        <div className="contentStudioList">
          {universalCurrentAffairs.length === 0 ? (
            <div className="contentStudioItem">
              <strong>No current affairs added yet.</strong>
              <p>Add your first current affairs PDF from the Add Current Affair page.</p>
            </div>
          ) : (
            universalCurrentAffairs.map((item) => (
              <div className="contentStudioItem" key={item.id}>
                <strong>{item.title}</strong>

                <p>
                  {item.month} • {item.chapter} • {item.planType} • {item.status}
                </p>

                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() => window.open(item.fileUrl, "_blank")}
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
    setCmsStatus(item.status || CONTENT_STATUS.PUBLISHED);

    navigate("/admin/content/current-affairs/add");
  }}
>
  Edit
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

                      alert("Current affair deleted successfully ✅");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/current-affairs")}
          >
            ← Back to Current Affairs
          </button>
        </div>
      </section>
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
        mockResults={mockResults}
        loadLeaderboard={loadLeaderboard}
        loadUserMockResults={loadUserMockResults}
        user={user}
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
              paymentRequests={paymentRequests || []}
              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}
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
            paymentRequests={paymentRequests || []}
            loadPaymentRequests={loadPaymentRequests}
            loadAdminData={loadAdminData}
            loadLeaderboard={loadLeaderboard}
            loadPaymentHistory={loadPaymentHistory}
            handlePremiumControl={handlePremiumControl}
            approvePaymentRequest={approvePaymentRequest}
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
              paymentRequests={paymentRequests || []}
              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}
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
              paymentRequests={paymentRequests || []}
              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}
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
              paymentRequests={paymentRequests || []}

              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}

              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}

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
      <section className="coursePages">
        {(() => {
          setTimeout(() => setActiveAdminTab("Payments"), 0);

          return (
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              activeAdminTab="Payments"
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
              paymentRequests={paymentRequests || []}
              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}
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
              paymentRequests={paymentRequests || []}
              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}
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
              paymentRequests={paymentRequests || []}

              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}

              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}

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
              paymentRequests={paymentRequests || []}
              loadPaymentRequests={loadPaymentRequests}
              loadAdminData={loadAdminData}
              loadLeaderboard={loadLeaderboard}
              loadPaymentHistory={loadPaymentHistory}
              handlePremiumControl={handlePremiumControl}
              approvePaymentRequest={approvePaymentRequest}
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
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Notes</span>

        <h2>Notes & Revision Library</h2>

        <p>
          Access free notes, premium notes, revision sheets,
          CDP notes, PYQ notes, and mentor-curated study material.
        </p>
      </div>

      <div className="notesNetflixLibrary">
        {Object.entries(dynamicNotesLibraryData).map(([planName, subjects]) => (
          <div className="notesShelf" key={planName}>
            <div className="notesShelfHeader">
              <h2>
                {planName === "FREE" && "📘 FREE NOTES"}
                {planName === "BASIC" && "🔷 BASIC NOTES"}
                {planName === "PREMIUM" && "⭐ PREMIUM LIBRARY"}
                {planName === "MENTORSHIP" && "👩‍🏫 MENTORSHIP VAULT"}
              </h2>

              <span>{subjects.length} Subjects</span>
            </div>

            <div className="notesShelfScrollWrap">
              {notesScrollState[`notes-row-${planName}`]?.canScroll &&
                !notesScrollState[`notes-row-${planName}`]?.atStart && (
                  <button
                    type="button"
                    className="notesShelfArrow notesShelfArrowLeft"
                    onClick={() =>
                      scrollShelf(`notes-row-${planName}`, "left")
                    }
                  >
                    ‹
                  </button>
                )}

              <div
                className="notesSubjectRow"
                id={`notes-row-${planName}`}
                onScroll={() =>
                  updateNotesScrollState(`notes-row-${planName}`)
                }
                onMouseEnter={() =>
                  updateNotesScrollState(`notes-row-${planName}`)
                }
              >
                {subjects.map((subject) => (
                  <button
                    type="button"
                    className="notesSubjectCard"
                    key={subject.id}
                    onClick={() =>
                      navigate(
                        `/ctet-tet/notes/plan/${planName}/${encodeURIComponent(
                          subject.id
                        )}`
                      )
                    }
                  >
                    <div className="notesSubjectIcon">{subject.cover}</div>
                    <h3>{subject.title}</h3>
                    <p>{subject.description}</p>
                    <span className="notesSubjectTag">{planName}</span>
                  </button>
                ))}
              </div>

              {notesScrollState[`notes-row-${planName}`]?.canScroll &&
                !notesScrollState[`notes-row-${planName}`]?.atEnd && (
                  <button
                    type="button"
                    className="notesShelfArrow notesShelfArrowRight"
                    onClick={() =>
                      scrollShelf(`notes-row-${planName}`, "right")
                    }
                  >
                    ›
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/notes/plan/:plan"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">{activeNotesPlan} NOTES</span>

        <h2>{activeNotesPlan} Subject Library</h2>

        <p>Choose a subject to open chapters and PDF resources.</p>
      </div>

      <div className="notesShelfScrollWrap">
        {notesScrollState[`notes-row-${activeNotesPlan}`]?.canScroll &&
          !notesScrollState[`notes-row-${activeNotesPlan}`]?.atStart && (
            <button
              type="button"
              className="notesShelfArrow notesShelfArrowLeft"
              onClick={() =>
                scrollShelf(`notes-row-${activeNotesPlan}`, "left")
              }
            >
              ‹
            </button>
          )}

        <div
          className="notesSubjectRow"
          id={`notes-row-${activeNotesPlan}`}
          onScroll={() =>
            updateNotesScrollState(`notes-row-${activeNotesPlan}`)
          }
          onMouseEnter={() =>
            updateNotesScrollState(`notes-row-${activeNotesPlan}`)
          }
        >
          {(dynamicNotesLibraryData[activeNotesPlan] || []).map((subject) => (
            <button
              type="button"
              className="notesSubjectCard"
              key={subject.id}
              onClick={() =>
                navigate(
                  `/ctet-tet/notes/plan/${activeNotesPlan}/${encodeURIComponent(subject.id)}`
                )
              }
            >
              <div className="notesSubjectIcon">{subject.cover}</div>
              <h3>{subject.title}</h3>
              <p>{subject.description}</p>
              <span className="notesSubjectTag">{activeNotesPlan}</span>
            </button>
          ))}
        </div>

        {notesScrollState[`notes-row-${activeNotesPlan}`]?.canScroll &&
          !notesScrollState[`notes-row-${activeNotesPlan}`]?.atEnd && (
            <button
              type="button"
              className="notesShelfArrow notesShelfArrowRight"
              onClick={() =>
                scrollShelf(`notes-row-${activeNotesPlan}`, "right")
              }
            >
              ›
            </button>
          )}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/notes/plan/:plan/:subjectId"
  element={
    <section className="notesSubjectRoutePage">
      <button onClick={() => navigate("/ctet-tet/notes")}>
        ← Back to Notes Library
      </button>

      <span className="notesSubjectRouteBadge">
        {activeNotesPlan} LIBRARY
      </span>

      <h1>
        {activeNotesSubject?.cover}{" "}
        {activeNotesSubject?.title || "Subject Library"}
      </h1>


      <p>
        Subject-wise PDF library. PDF resources will appear here.
      </p>

      <div className="chapterLibraryStack">
  {Object.keys(
    universalNotes
      .filter((item) => {
        const itemPlan = item.planType?.toUpperCase();

        const normalizeSubject = (value = "") =>
          value
            .toString()
            .toLowerCase()
            .trim()
            .replace(/-/g, " ")
            .replace(/\s+/g, " ");

        const itemSubject = normalizeSubject(
          item.subject || item.category || ""
        );

        const activeSubject = normalizeSubject(
          activeNotesSubject?.id || activeNotesSubjectId || ""
        );

        return (
          itemPlan === activeNotesPlan &&
          (
            itemSubject.includes(activeSubject) ||
            activeSubject.includes(itemSubject)
          )
        );
      })
      .reduce((chapters, pdf) => {
        const chapterName =
          pdf.chapter?.trim() || "General Notes";

        const chapterId = chapterName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-");

        return {
          ...chapters,
          [chapterId]: chapterName,
        };
      }, {})
  ).map((chapterId) => {
    const chapterName = universalNotes
      .filter((item) => {
        const itemPlan = item.planType?.toUpperCase();

        const normalizeSubject = (value = "") =>
          value
            .toString()
            .toLowerCase()
            .trim()
            .replace(/-/g, " ")
            .replace(/\s+/g, " ");

        const itemSubject = normalizeSubject(
          item.subject || item.category || ""
        );

        const activeSubject = normalizeSubject(
          activeNotesSubject?.id || activeNotesSubjectId || ""
        );

        return (
          itemPlan === activeNotesPlan &&
          (
            itemSubject.includes(activeSubject) ||
            activeSubject.includes(itemSubject)
          )
        );
      })
      .reduce((chapters, pdf) => {
        const chapterName =
          pdf.chapter?.trim() || "General Notes";

        const id = chapterName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-");

        return {
          ...chapters,
          [id]: chapterName,
        };
      }, {})[chapterId];

    return (
      <button
        type="button"
        className="notesSubjectCard chapterLibraryCard"
        key={chapterId}
        onClick={() =>
          navigate(
            `/ctet-tet/notes/plan/${activeNotesPlan}/${activeNotesSubjectId}/${chapterId}`
          )
        }
      >
        <div className="notesSubjectIcon">📘</div>
        <h3>{chapterName}</h3>
        <p>Open chapter PDFs</p>
        <span className="notesSubjectTag">
          {activeNotesPlan}
        </span>
      </button>
    );
  })}
  </div>
    </section>
  }
/>

<Route
 path="/ctet-tet/notes/plan/:plan/:subjectId/:chapterId"
  element={
    <section className="notesSubjectRoutePage">
      <button
        onClick={() =>
          navigate(
            `/ctet-tet/notes/plan/${activeNotesPlan}/${activeNotesSubjectId}`
          )
        }
      >
        ← Back to Chapters
      </button>

      <span className="notesSubjectRouteBadge">
        {activeNotesPlan} CHAPTER
      </span>

      <h1>
        {location.pathname
          .split("/")
          .pop()
          ?.replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())}
      </h1>

      <p>
        Chapter-wise PDF library. Open or download your study PDFs.
      </p>

      <div className="pdfShelfRow">
        {universalNotes
          .filter((item) => {
            const itemPlan = item.planType?.toUpperCase();

            const normalizeValue = (value = "") =>
              value
                .toString()
                .toLowerCase()
                .trim()
                .replace(/-/g, " ")
                .replace(/\s+/g, " ");

            const itemSubject = normalizeValue(
              item.subject || item.category || ""
            );

            const activeSubject = normalizeValue(
              activeNotesSubject?.id || activeNotesSubjectId || ""
            );

            const itemChapter = normalizeValue(
              item.chapter || "General Notes"
            );

            const activeChapter = normalizeValue(
              location.pathname.split("/").pop() || ""
            );

            return (
              itemPlan === activeNotesPlan &&
              (
                itemSubject.includes(activeSubject) ||
                activeSubject.includes(itemSubject)
              ) &&
              itemChapter.includes(activeChapter) ||
              activeChapter.includes(itemChapter)
            );
          })
          .map((pdf) => (
            <div className="pdfMiniCard" key={pdf.id}>
              <div className="pdfIcon">📄</div>

              <h3>{pdf.title}</h3>

              <p>{pdf.chapter || "Premium Study Material"}</p>

              <span>{pdf.planType}</span>

              <button
                className="btnLink"
                onClick={() =>
                  handleNoteAccess({
                    ...pdf,
                    pdf: pdf.fileUrl || pdf.pdfUrl || pdf.pdf,
                  })
                }
              >
                Open PDF
              </button>
            </div>
          ))}
      </div>
    </section>
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
      mockResults={mockResults}
    />
  }
/>




<Route
  path="/ctet-tet/current-affairs"
  element={
    <section className="coursePages currentAffairsPremiumPage">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Current Affairs</span>

        <h1>Current Affairs Library</h1>

        <p>
          Month-wise current affairs PDFs with weekly grouping,
          plan access, and exam-focused preparation material.
        </p>
      </div>

      <div className="notesNetflixLibrary currentAffairsNetflixLibrary">
        <div className="notesShelf">
          

          <div className="notesShelfScrollWrap">
            {notesScrollState["current-affairs-month-row"]?.canScroll &&
              !notesScrollState["current-affairs-month-row"]?.atStart && (
                <button
                  type="button"
                  className="notesShelfArrow notesShelfArrowLeft"
                  onClick={() =>
                    scrollShelf("current-affairs-month-row", "left")
                  }
                >
                  ‹
                </button>
              )}

            <div
              className="notesSubjectRow currentAffairsMonthRow"
              id="current-affairs-month-row"
              onScroll={() =>
                updateNotesScrollState("current-affairs-month-row")
              }
              onMouseEnter={() =>
                updateNotesScrollState("current-affairs-month-row")
              }
            >
              {Object.entries(
                [...universalCurrentAffairs, ...currentAffairsList]
                  .filter(
                    (item) =>
                      item.status === CONTENT_STATUS.PUBLISHED ||
                      item.status === "published"
                  )
                  .reduce((months, item) => {
                    const monthName = item.month || "Current Affairs";

                    if (!months[monthName]) {
                      months[monthName] = [];
                    }

                    months[monthName].push(item);
                    return months;
                  }, {})
              )
                .sort(([a], [b]) => {
                  const monthOrder = [
                    "january",
                    "february",
                    "march",
                    "april",
                    "may",
                    "june",
                    "july",
                    "august",
                    "september",
                    "october",
                    "november",
                    "december",
                  ];

                  const [monthA, yearA] = a.toLowerCase().split(" ");
                  const [monthB, yearB] = b.toLowerCase().split(" ");

                  if (yearA !== yearB) {
                    return Number(yearB || 0) - Number(yearA || 0);
                  }

                  return (
                    monthOrder.indexOf(monthB) -
                    monthOrder.indexOf(monthA)
                  );
                })
                .map(([monthName, items]) => {
                  const monthSlug = monthName
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, "-");

                  return (
                    <button
                      type="button"
                      className="notesSubjectCard currentAffairsMonthCard"
                      key={monthName}
                      onClick={() =>
                        navigate(`/ctet-tet/current-affairs/${monthSlug}`)
                      }
                    >
                      <div className="notesSubjectIcon">📰</div>

                      <h3>{monthName}</h3>

                      <p>
                        {items.length} PDF
                        {items.length > 1 ? "s" : ""} available
                      </p>

                      <span className="notesSubjectTag">
                        Open Month →
                      </span>
                    </button>
                  );
                })}
            </div>

            {notesScrollState["current-affairs-month-row"]?.canScroll &&
              !notesScrollState["current-affairs-month-row"]?.atEnd && (
                <button
                  type="button"
                  className="notesShelfArrow notesShelfArrowRight"
                  onClick={() =>
                    scrollShelf("current-affairs-month-row", "right")
                  }
                >
                  ›
                </button>
              )}
          </div>
        </div>
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/current-affairs/:monthId"
  element={
    <section className="coursePages currentAffairsPremiumPage">
      {(() => {
        const formatSlug = (value = "") =>
          value.toString().toLowerCase().trim().replace(/\s+/g, "-");

        const activeMonthId = location.pathname.split("/").pop();

        const publishedCurrentAffairs = [
          ...universalCurrentAffairs,
          ...currentAffairsList,
        ].filter(
          (item) =>
            item.status === CONTENT_STATUS.PUBLISHED ||
            item.status === "published"
        );

        const monthItems = publishedCurrentAffairs.filter(
          (item) => formatSlug(item.month) === activeMonthId
        );

        const monthTitle = monthItems[0]?.month || "Current Affairs Month";

        const groupedWeeks = monthItems.reduce((groups, item) => {
          const weekName =
            item.week?.trim() || item.chapter?.trim() || "Monthly PDFs";

          if (!groups[weekName]) groups[weekName] = [];

          groups[weekName].push(item);
          return groups;
        }, {});

        const openCurrentAffairPdf = (item) => {
          const finalPdfUrl =
            item.fileUrl || item.pdfUrl || item.pdf || item.url || "";

          const accessPlan = item.planType || item.plan || PLAN_TYPES.FREE;

          if (!finalPdfUrl) {
            alert("PDF URL missing in this current affair item.");
            return;
          }

          if (
            !isAdmin &&
            accessPlan !== PLAN_TYPES.FREE &&
            hasPlanAccess &&
            !hasPlanAccess(accessPlan)
          ) {
            navigate("/ctet-tet/pricing");
            return;
          }

          window.open(finalPdfUrl, "_blank", "noopener,noreferrer");
        };

        return (
          <>
            <div className="sectionHeader">
              <span className="badge">CURRENT AFFAIRS MONTH</span>

              <h1>{monthTitle}</h1>

              <p>Weekly and monthly CTET/TET current affairs PDFs.</p>
            </div>

            <div className="caMonthPage">
              {Object.keys(groupedWeeks).length === 0 ? (
                <div className="caEmptyCard">
                  <strong>No PDFs found.</strong>
                  <p>No published current affairs available for this month.</p>
                </div>
              ) : (
                Object.entries(groupedWeeks)
                  .sort(([a], [b]) => {
                    const getWeekNumber = (weekName = "") => {
                      const match = weekName.match(/\d+/);
                      return match ? Number(match[0]) : 99;
                    };

                    return getWeekNumber(a) - getWeekNumber(b);
                  })
                  .map(([weekName, items]) => (
                    <div className="caWeekBlock" key={weekName}>
                      <div className="caWeekHeader">
                        <h2>{weekName}</h2>
                        <span>
                          {items.length} PDF{items.length > 1 ? "s" : ""} in{" "}
                          {monthTitle}
                        </span>
                      </div>

                      <div className="caPdfShelf">
                        {items.map((item) => (
                          <button
                            type="button"
                            className="caPdfCard"
                            key={item.id}
                            onClick={() => openCurrentAffairPdf(item)}
                          >
                            <div className="caPdfTop">
                              <span className="caPdfIcon">📄</span>
                              <span className="caPdfPlan">
                                {item.planType || PLAN_TYPES.FREE}
                              </span>
                            </div>

                            <h3>{item.title}</h3>

                            <p>
                              {item.month || "No Month"} •{" "}
                              {item.week || item.chapter || "Monthly PDFs"}
                            </p>

                            <span className="caPdfOpen">Open PDF →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="contentStudioActions">
              <button
                className="backButton"
                onClick={() => navigate("/ctet-tet/current-affairs")}
              >
                ← Back to Current Affairs
              </button>

              <button className="backButton" onClick={() => navigate("/ctet-tet")}>
                Back to CTET/TET Hub
              </button>
            </div>
          </>
        );
      })()}
    </section>
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
  onClick={() => navigate("/learning-paths")}
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
          <li>📅 7-Day Study Plan</li>
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
<header className="cleanHeader">
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
</header>
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
    onClick={() => navigate("/learning")}
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
              <li>📅 7-Day Study Plan</li>
            </ul>

            <button
  className="btnLink"
  onClick={() => navigate("/resources")}
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
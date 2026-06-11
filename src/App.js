import { auth, db } from "./firebase";
import { storage } from "./firebase";
import { QRCodeCanvas } from "qrcode.react";
import * as XLSX from "xlsx";
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
const MockTest = React.lazy(() => import("./components/MockTest.jsx"));
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
import { createPortal } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import AspireNestLogo from "./components/AspireNestLogo.jsx";
import AppDashboard from "./components/AppDashboard.jsx";
import './style.css';
import {
  CONTENT_SECTIONS,
  CONTENT_STATUS,
  PLAN_TYPES,
  SOURCE_TYPES,
  CONTENT_TYPES,
} from "./contentSystem";
import {
  loadPublishedContent,
  addContentItem,
  updateContentItem,
  deleteContentItem,
  unpublishContentItem,
  archiveContentItem,
} from "./contentService";


export default function App() {

  const location = useLocation();
  const navigate = useNavigate();

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
  const [mockStarted, setMockStarted] = useState(false);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [selectedAnswer, setSelectedAnswer] = useState("");
const [score, setScore] = useState(0);
const [showResult, setShowResult] = useState(false);
const [showMentorProfile, setShowMentorProfile] = useState(false);
const [showProfile, setShowProfile] = useState(false);
const [showAnswer, setShowAnswer] = useState(false);
const [timeLeft, setTimeLeft] = useState(60);
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
  
  const universalVideos = universalContent.filter(
    (item) =>
      item.section ===
      CONTENT_SECTIONS.RECORDED_VIDEO
  );

  const universalStudentVideos = universalContent.filter(
    (item) =>
      item.section === "recordedVideo" &&
      item.status === "published"
  );
  
  const studentVideoPlanRouteMatch =
    location.pathname.match(
      /^\/ctet-tet\/videos\/plan\/([^/]+)$/
    );
  
  const studentVideoSubjectRouteMatch =
    location.pathname.match(
      /^\/ctet-tet\/videos\/plan\/([^/]+)\/([^/]+)$/
    );
  
  const studentVideoChapterRouteMatch =
    location.pathname.match(
      /^\/ctet-tet\/videos\/plan\/([^/]+)\/([^/]+)\/([^/]+)$/
    );
  
  const studentVideoWatchRouteMatch =
    location.pathname.match(
      /^\/ctet-tet\/videos\/watch\/([^/]+)$/
    );
  
  const activeVideoPlan =
    (
      studentVideoPlanRouteMatch?.[1] ||
      studentVideoSubjectRouteMatch?.[1] ||
      studentVideoChapterRouteMatch?.[1] ||
      ""
    ).toUpperCase();
  
  const activeVideoSubjectId =
    studentVideoSubjectRouteMatch?.[2] ||
    studentVideoChapterRouteMatch?.[2] ||
    "";
  
  const activeVideoChapterId =
    studentVideoChapterRouteMatch?.[3] ||
    "";
  
  const activeWatchVideoId =
    studentVideoWatchRouteMatch?.[1] ||
    "";
  
    const activeMockPlan =
    decodeURIComponent(location.pathname.split("/")[4] || "FREE").toUpperCase();
  
  const activeMockSubjectId =
    decodeURIComponent(location.pathname.split("/")[5] || "");
  
  const activeMockChapterId =
    decodeURIComponent(location.pathname.split("/")[6] || "");
  
  const activeMockTestId =
    decodeURIComponent(location.pathname.split("/")[7] || "");
  
  const activeStartMockTestId =
    decodeURIComponent(location.pathname.split("/")[4] || "");
  
  const activeResultAttemptId =
    decodeURIComponent(location.pathname.split("/")[4] || "");

    const [mockAttemptAnswers, setMockAttemptAnswers] = useState({});
    const [mockAttemptCurrentIndex, setMockAttemptCurrentIndex] = useState({});
    const [mockMarkedQuestions, setMockMarkedQuestions] = useState({});
    const [mockPaletteRangeStart, setMockPaletteRangeStart] =
  useState({});
    const [mockExamStartedAt, setMockExamStartedAt] = useState({});
    const [mockExamTimeLeft, setMockExamTimeLeft] = useState({});

    useEffect(() => {
      const attemptPath =
        "/ctet-tet/mock-tests/attempt/";
    
      if (!location.pathname.includes(attemptPath))
        return;
    
      const testId = decodeURIComponent(
        location.pathname.split("/")[4] || ""
      );
    
      if (!testId) return;
    
      setMockExamStartedAt((prev) => ({
        ...prev,
        [testId]: prev[testId] || Date.now(),
      }));
    
      setMockExamTimeLeft((prev) => ({
        ...prev,
        [testId]: prev[testId] ?? 1800,
      }));
    
      const timer = setInterval(() => {
        setMockExamTimeLeft((prev) => {
          const current = prev[testId] ?? 1800;
    
          if (current <= 0) {
            return {
              ...prev,
              [testId]: 0,
            };
          }
    
          return {
            ...prev,
            [testId]: current - 1,
          };
        });
      }, 1000);
    
      return () => clearInterval(timer);
    }, [location.pathname]);

const [contentLoading, setContentLoading] = useState(false);
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

const [mockTestForm, setMockTestForm] = useState({
  title: "",
  planType: "FREE",
  subject: "",
  chapter: "",
  examType: "CTET",
  testType: "Chapter Test",
  duration: "30",
  totalQuestions: "10",
  marksPerQuestion: "1",
  negativeMarks: "0",
  passingMarks: "0",

  examDifficulty: "Mixed",
  examLanguage: "English",

  attemptLimit: "unlimited",
  resultPublishMode: "instant",

  shuffleQuestions: "no",
  shuffleOptions: "no",

  navigationMode: "free",

  allowPause: "yes",
  calculatorAllowed: "no",

  examStartDate: "",
  examEndDate: "",
  examInstructions: "",

  status: "published",
});

const [mockTestQuestionsForm, setMockTestQuestionsForm] = useState([
  {
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    answer: "",
    explanation: "",
    level: "Easy",
questionType: "Single Correct",
language: "English",
tag: "",
positiveMarks: "1",
negativeMarks: "0",
questionStatus: "published",
saveToQuestionBank: "yes",
  },
]);

const [editingMockTestId, setEditingMockTestId] = useState(null);
const [mockTestPlanFilter, setMockTestPlanFilter] = useState("ALL");
const [mockTestSearch, setMockTestSearch] = useState("");
const [mockTestStatusFilter, setMockTestStatusFilter] = useState("ALL");
const [mockTestExamFilter, setMockTestExamFilter] = useState("ALL");
const [mockTestSortMode, setMockTestSortMode] = useState("LATEST");
const [activeMockActionMenu, setActiveMockActionMenu] = useState(null);
const [mockMenuPosition, setMockMenuPosition] =
  useState(null);

const [mockMenuTest, setMockMenuTest] =
  useState(null);
  const openMockActionPortal = (event, test) => {
    const rect =
      event.currentTarget.getBoundingClientRect();
  
    setMockMenuPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
  
    setMockMenuTest(test);
  };
  
  const closeMockActionPortal = () => {
    setMockMenuPosition(null);
    setMockMenuTest(null);
  };
  useEffect(() => {
    if (!mockMenuPosition) return;
  
    const handleCloseOnMove = () => {
      closeMockActionPortal();
    };
  
    window.addEventListener("scroll", handleCloseOnMove, true);
    window.addEventListener("resize", handleCloseOnMove);
  
    return () => {
      window.removeEventListener("scroll", handleCloseOnMove, true);
      window.removeEventListener("resize", handleCloseOnMove);
    };
  }, [mockMenuPosition]);
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

const [videoForm, setVideoForm] = useState({
  title: "",
  planType: "",
  subject: "",
  chapter: "",
  videoUrl: "",
  thumbnailUrl: "",
  duration: "",
  mentorName: "",
  status: "published",
  sourceType: "YOUTUBE_PUBLIC",
});

useEffect(() => {
  const isAddMockTestRoute =
    location.pathname === "/admin/content/mock-tests/add";

  if (!isAddMockTestRoute) return;

  const editId = new URLSearchParams(location.search).get(
    "editId"
  );

  if (!editId) return;

  const editTest = universalContent.find(
    (item) =>
      item.id === editId &&
      item.section === "mockTest"
  );

  if (!editTest) return;

  setEditingMockTestId(editTest.id);

  setMockTestForm({
    title: editTest.title || "",
    planType: editTest.planType || "FREE",
    subject: editTest.subject || "",
    chapter: editTest.chapter || "",
    examType: editTest.examType || "CTET",
    testType: editTest.testType || "Chapter Test",

    duration:
      editTest.duration?.toString() ||
      editTest.durationMinutes?.toString() ||
      "30",

    totalQuestions:
      editTest.totalQuestions?.toString() ||
      editTest.questions?.length?.toString() ||
      "10",

    marksPerQuestion:
      editTest.marksPerQuestion?.toString() || "1",

    negativeMarks:
      editTest.negativeMarks?.toString() || "0",

    passingMarks:
      editTest.passingMarks?.toString() || "0",

    examDifficulty: editTest.examDifficulty || "Mixed",
    examLanguage: editTest.examLanguage || "English",

    attemptLimit: editTest.attemptLimit || "unlimited",
    resultPublishMode:
      editTest.resultPublishMode || "instant",

    shuffleQuestions: editTest.shuffleQuestions || "no",
    shuffleOptions: editTest.shuffleOptions || "no",

    navigationMode: editTest.navigationMode || "free",
    allowPause: editTest.allowPause || "yes",
    calculatorAllowed:
      editTest.calculatorAllowed || "no",

    questionSource: editTest.questionSource || "manual",

    fullscreenMode: editTest.fullscreenMode || "no",
    tabSwitchDetection:
      editTest.tabSwitchDetection || "no",
    copyPasteProtection:
      editTest.copyPasteProtection || "no",
    autoSubmitOnViolation:
      editTest.autoSubmitOnViolation || "no",

    leaderboardMode:
      editTest.leaderboardMode || "disabled",

    timerMode: editTest.timerMode || "globalTimer",
    perQuestionTimeValue:
      editTest.perQuestionTimeValue || "1",
    perQuestionTimeUnit:
      editTest.perQuestionTimeUnit || "min",
    autoSubmitOnTimeUp:
      editTest.autoSubmitOnTimeUp || "yes",

    scheduleType:
      editTest.scheduleType || "alwaysAvailable",
    examStartDate: editTest.examStartDate || "",
    examStartTime: editTest.examStartTime || "",
    examEndDate: editTest.examEndDate || "",
    examEndTime: editTest.examEndTime || "",

    recurringMode: editTest.recurringMode || "none",
    weeklyTestDay: editTest.weeklyTestDay || "",
    monthlyTestDate: editTest.monthlyTestDate || "",

    liveEventMode: editTest.liveEventMode || "no",
    scholarshipMode: editTest.scholarshipMode || "no",

    examInstructions: editTest.examInstructions || "",

    status: editTest.status || "published",
  });

  setMockTestQuestionsForm(
    editTest.questions?.length
      ? editTest.questions.map((q) => ({
          question: q.question || "",
          option1: q.option1 || "",
          option2: q.option2 || "",
          option3: q.option3 || "",
          option4: q.option4 || "",
          answer: q.answer || "",
          explanation: q.explanation || "",
          level: q.level || "Easy",
          questionType:
            q.questionType || "Single Correct",
          language: q.language || "English",
          tag: q.tag || "",
          positiveMarks:
            q.positiveMarks?.toString() || "1",
          negativeMarks:
            q.negativeMarks?.toString() || "0",
          questionStatus:
            q.questionStatus || "published",
          saveToQuestionBank:
            q.saveToQuestionBank || "yes",
        }))
      : [
          {
            question: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
            answer: "",
            explanation: "",
            level: "Easy",
            questionType: "Single Correct",
            language: "English",
            tag: "",
            positiveMarks: "1",
            negativeMarks: "0",
            questionStatus: "published",
            saveToQuestionBank: "yes",
          },
        ]
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

    await loadContentItemsFromFirestore();

    setMockTestForm({
      title: "",
      planType: "FREE",
      subject: "",
      chapter: "",
      examType: "CTET",
      testType: "Chapter Test",
    
      duration: "30",
      totalQuestions: "10",
      marksPerQuestion: "1",
      negativeMarks: "0",
      passingMarks: "0",
    
      examDifficulty: "Mixed",
      examLanguage: "English",
    
      attemptLimit: "unlimited",
      resultPublishMode: "instant",
    
      shuffleQuestions: "no",
      shuffleOptions: "no",
    
      navigationMode: "free",
      allowPause: "yes",
      calculatorAllowed: "no",
    
      questionSource: "manual",
    
      fullscreenMode: "no",
      tabSwitchDetection: "no",
      copyPasteProtection: "no",
      autoSubmitOnViolation: "no",
    
      leaderboardMode: "disabled",
    
      timerMode: "globalTimer",
      perQuestionTimeValue: "1",
      perQuestionTimeUnit: "min",
      autoSubmitOnTimeUp: "yes",
    
      scheduleType: "alwaysAvailable",
      examStartDate: "",
      examStartTime: "",
      examEndDate: "",
      examEndTime: "",
    
      recurringMode: "none",
      weeklyTestDay: "",
      monthlyTestDate: "",
    
      liveEventMode: "no",
      scholarshipMode: "no",
    
      examInstructions: "",
    
      status: "published",
    });

    setMockTestQuestionsForm([
      {
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        answer: "",
        explanation: "",
        level: "Easy",
        questionType: "Single Correct",
        language: "English",
        tag: "",
        positiveMarks: "1",
        negativeMarks: "0",
        passingMarks: "0",

        questionStatus: "published",
        saveToQuestionBank: "yes",
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

    if (!importedTest.title || !importedTest.questions?.length) {
      alert("Invalid exam JSON file");
      return;
    }

    const importPayload = {
      ...importedTest,
      title: `${importedTest.title} - Imported`,
      section: "mockTest",
      contentType: "MOCK",
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    delete importPayload.id;

    await addDoc(
      collection(db, "contentItems"),
      importPayload
    );

    await loadContentItemsFromFirestore();

    alert("Exam imported successfully as Draft ✅");

    event.target.value = "";
  } catch (error) {
    console.error("Import exam JSON error:", error);
    alert("Invalid JSON file or import failed");
  }
};



const handleExportMockTestCsv = (test) => {
  try {
    if (!test) {
      alert("No mock test selected for CSV export");
      return;
    }

    const cleanText = (value = "") =>
      value
        ?.toString()
        .replace(/\r?\n|\r/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "";

    const safeCsvValue = (value = "") => {
      const text = cleanText(value).replace(/"/g, '""');
      return `"${text}"`;
    };

    const questions = test.questions || [];

    if (questions.length === 0) {
      alert("No questions found in this mock test");
      return;
    }

    const headers = [
      "Test Title",
      "Plan",
      "Exam Type",
      "Test Type",
      "Subject",
      "Chapter",
      "Duration Minutes",
      "Total Questions",
      "Question Number",
      "Question",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer",
      "Explanation",
      "Difficulty Level",
      "Language",
      "Positive Marks",
      "Negative Marks",
      "Question Status",
    ];

    const rows = questions.map((question, index) => [
      test.title || "",
      test.planType || "FREE",
      test.examType || "",
      test.testType || "",
      test.subject || "",
      test.chapter || "",
      test.duration || test.durationMinutes || "",
      test.totalQuestions || questions.length,
      question.questionNumber || index + 1,
      question.question || "",
      question.option1 || "",
      question.option2 || "",
      question.option3 || "",
      question.option4 || "",
      question.answer || "",
      question.explanation || "",
      question.level || "",
      question.language || "",
      question.positiveMarks || test.marksPerQuestion || "",
      question.negativeMarks || test.negativeMarks || "0",
      question.questionStatus || test.status || "",
    ]);

    const csvContent = [
      headers.map(safeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(safeCsvValue).join(",")
      ),
    ].join("\n");

    const csvBlob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const downloadUrl = URL.createObjectURL(csvBlob);

    const safeFileName = (test.title || "mock-test")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${safeFileName}-questions.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Export CSV error:", error);
    alert("CSV export failed");
  }
};

const handleExportMockTestExcel = (test) => {
  try {
    if (!test) {
      alert("No mock test selected for Excel export");
      return;
    }

    const questions = test.questions || [];

    if (questions.length === 0) {
      alert("No questions found in this mock test");
      return;
    }

    const escapeHtml = (value = "") =>
      value
        ?.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;") || "";

    const headers = [
      "Test Title",
      "Plan",
      "Exam Type",
      "Test Type",
      "Subject",
      "Chapter",
      "Duration Minutes",
      "Total Questions",
      "Question Number",
      "Question",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer",
      "Explanation",
      "Difficulty Level",
      "Language",
      "Positive Marks",
      "Negative Marks",
      "Question Status",
    ];

    const rows = questions.map((question, index) => [
      test.title || "",
      test.planType || "FREE",
      test.examType || "",
      test.testType || "",
      test.subject || "",
      test.chapter || "",
      test.duration || test.durationMinutes || "",
      test.totalQuestions || questions.length,
      question.questionNumber || index + 1,
      question.question || "",
      question.option1 || "",
      question.option2 || "",
      question.option3 || "",
      question.option4 || "",
      question.answer || "",
      question.explanation || "",
      question.level || "",
      question.language || "",
      question.positiveMarks || test.marksPerQuestion || "",
      question.negativeMarks || test.negativeMarks || "0",
      question.questionStatus || test.status || "",
    ]);

    const tableHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>
                ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const excelBlob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const downloadUrl = URL.createObjectURL(excelBlob);

    const safeFileName = (test.title || "mock-test")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${safeFileName}-questions.xls`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Export Excel error:", error);
    alert("Excel export failed");
  }
};

const handleExportMockTestXlsx = (test) => {
  try {
    if (!test) {
      alert("No mock test selected for XLSX export");
      return;
    }

    const questions = test.questions || [];

    if (questions.length === 0) {
      alert("No questions found in this mock test");
      return;
    }

    const rows = questions.map((question, index) => ({
      "Test Title": test.title || "",
      Plan: test.planType || "FREE",
      "Exam Type": test.examType || "",
      "Test Type": test.testType || "",
      Subject: test.subject || "",
      Chapter: test.chapter || "",
      "Duration Minutes":
        test.duration || test.durationMinutes || "",
      "Total Questions":
        test.totalQuestions || questions.length,
      "Question Number":
        question.questionNumber || index + 1,
      Question: question.question || "",
      "Option A": question.option1 || "",
      "Option B": question.option2 || "",
      "Option C": question.option3 || "",
      "Option D": question.option4 || "",
      "Correct Answer": question.answer || "",
      Explanation: question.explanation || "",
      "Difficulty Level": question.level || "",
      Language: question.language || "",
      "Positive Marks":
        question.positiveMarks ||
        test.marksPerQuestion ||
        "",
      "Negative Marks":
        question.negativeMarks ||
        test.negativeMarks ||
        "0",
      "Question Status":
        question.questionStatus || test.status || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
      { wch: 28 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 60 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 22 },
      { wch: 60 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Questions"
    );

    const safeFileName = (test.title || "mock-test")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    XLSX.writeFile(
      workbook,
      `${safeFileName}-questions.xlsx`
    );
  } catch (error) {
    console.error("Export XLSX error:", error);
    alert("XLSX export failed");
  }
};

const handleDownloadMockTestXlsxTemplate = () => {
  const testInfoRows = [
    { Field: "Test Title", Value: "Sample CTET Subject Test" },
    { Field: "Plan", Value: "PREMIUM" },
    { Field: "Exam Type", Value: "CTET" },
    { Field: "Test Type", Value: "Subject Test" },
    { Field: "Subject", Value: "Child Development & Pedagogy" },
    { Field: "Chapter", Value: "Complete CDP" },
    { Field: "Duration Minutes", Value: 200 },
    { Field: "Total Questions", Value: 2 },
    { Field: "Marks Per Question", Value: 1 },
    { Field: "Negative Marks", Value: 0 },
    { Field: "Passing Marks", Value: 0 },
    { Field: "Exam Difficulty", Value: "Mixed" },
    { Field: "Exam Language", Value: "English" },
    { Field: "Attempt Limit", Value: "unlimited" },
    { Field: "Result Publish Mode", Value: "instant" },
    { Field: "Shuffle Questions", Value: "no" },
    { Field: "Shuffle Options", Value: "no" },
    { Field: "Navigation Mode", Value: "free" },
    { Field: "Allow Pause", Value: "yes" },
    { Field: "Calculator Allowed", Value: "no" },
    { Field: "Question Source", Value: "xlsxImport" },
    { Field: "Fullscreen Mode", Value: "no" },
    { Field: "Tab Switch Detection", Value: "no" },
    { Field: "Copy Paste Protection", Value: "no" },
    { Field: "Auto Submit On Violation", Value: "no" },
    { Field: "Leaderboard Mode", Value: "disabled" },
    { Field: "Timer Mode", Value: "globalTimer" },
    { Field: "Per Question Time Value", Value: 1 },
    { Field: "Per Question Time Unit", Value: "min" },
    { Field: "Auto Submit On Time Up", Value: "yes" },
    { Field: "Schedule Type", Value: "alwaysAvailable" },
    { Field: "Exam Start Date", Value: "" },
    { Field: "Exam Start Time", Value: "" },
    { Field: "Exam End Date", Value: "" },
    { Field: "Exam End Time", Value: "" },
    { Field: "Recurring Mode", Value: "none" },
    { Field: "Weekly Test Day", Value: "" },
    { Field: "Monthly Test Date", Value: "" },
    { Field: "Live Event Mode", Value: "no" },
    { Field: "Scholarship Mode", Value: "no" },
    { Field: "Exam Instructions", Value: "" },
    { Field: "Status", Value: "draft" },
  ];

  const questionRows = [
    {
      "Question Number": 1,
      Question: "Sample question text",
      "Option A": "Option A",
      "Option B": "Option B",
      "Option C": "Option C",
      "Option D": "Option D",
      "Correct Answer": "Option A",
      Explanation: "Sample explanation",
      "Difficulty Level": "Easy",
      "Question Type": "Single Correct",
      Language: "English",
      Tag: "",
      "Positive Marks": 1,
      "Negative Marks": 0,
      "Question Status": "published",
      "Save To Question Bank": "yes",
    },
  ];

  const testInfoSheet = XLSX.utils.json_to_sheet(testInfoRows);
  const questionsSheet = XLSX.utils.json_to_sheet(questionRows);

  testInfoSheet["!cols"] = [{ wch: 35 }, { wch: 45 }];
  questionsSheet["!cols"] = [
    { wch: 18 },
    { wch: 70 },
    { wch: 32 },
    { wch: 32 },
    { wch: 32 },
    { wch: 32 },
    { wch: 22 },
    { wch: 65 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, testInfoSheet, "Test Info");
  XLSX.utils.book_append_sheet(workbook, questionsSheet, "Questions");

  XLSX.writeFile(workbook, "mock-test-two-sheet-import-template.xlsx");
};

const handleDownloadMockTestCsvTemplate = () => {
  const headers = [
    "Test Title",
    "Plan",
    "Exam Type",
    "Test Type",
    "Subject",
    "Chapter",
    "Duration Minutes",
    "Question Number",
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer",
    "Explanation",
    "Difficulty Level",
    "Language",
    "Positive Marks",
    "Negative Marks",
    "Question Status",
  ];

  const sampleRow = [
    "Sample CTET Test",
    "FREE",
    "CTET",
    "Chapter Test",
    "Child Development & Pedagogy",
    "Growth and Development",
    "30",
    "1",
    "Sample question text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option A",
    "Sample explanation",
    "Easy",
    "English",
    "1",
    "0",
    "published",
  ];

  const safeCsvValue = (value = "") =>
    `"${value.toString().replace(/"/g, '""')}"`;

  const csvContent = [
    headers.map(safeCsvValue).join(","),
    sampleRow.map(safeCsvValue).join(","),
  ].join("\n");

  const csvBlob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const downloadUrl = URL.createObjectURL(csvBlob);

  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = "mock-test-import-template.csv";

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  URL.revokeObjectURL(downloadUrl);
};

const handleImportMockTestXlsx = async (event) => {
  try {
    const file = event.target.files?.[0];

    if (!file) return;

    const data = await file.arrayBuffer();

    const workbook = XLSX.read(data, {
      type: "array",
    });

    const testInfoSheet = workbook.Sheets["Test Info"];
    const questionsSheet = workbook.Sheets["Questions"];

    if (!testInfoSheet || !questionsSheet) {
      alert(
        "Invalid template. File must contain 'Test Info' and 'Questions' sheets."
      );
      event.target.value = "";
      return;
    }

    const testInfoRows = XLSX.utils.sheet_to_json(testInfoSheet, {
      defval: "",
    });

    const questionRows = XLSX.utils.sheet_to_json(questionsSheet, {
      defval: "",
    });

    if (!testInfoRows.length) {
      alert("Test Info sheet is empty.");
      event.target.value = "";
      return;
    }

    if (!questionRows.length) {
      alert("Questions sheet is empty.");
      event.target.value = "";
      return;
    }

    if (questionRows.length > 200) {
      alert("Maximum 200 questions allowed per import for storage safety.");
      event.target.value = "";
      return;
    }

    const testInfo = testInfoRows.reduce((acc, row) => {
      const field = row.Field?.toString().trim();
      const value = row.Value;

      if (field) {
        acc[field] = value;
      }

      return acc;
    }, {});

    const requiredQuestionColumns = [
      "Question",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer",
    ];

    const firstQuestionRow = questionRows[0];

    const missingQuestionColumns =
      requiredQuestionColumns.filter(
        (column) => !(column in firstQuestionRow)
      );

    if (missingQuestionColumns.length > 0) {
      alert(
        `Missing required question column(s): ${missingQuestionColumns.join(
          ", "
        )}`
      );
      event.target.value = "";
      return;
    }

    const importedQuestions = questionRows.map((row, index) => ({
      questionNumber: Number(row["Question Number"] || index + 1),
      question: row["Question"]?.toString().trim() || "",
      option1: row["Option A"]?.toString().trim() || "",
      option2: row["Option B"]?.toString().trim() || "",
      option3: row["Option C"]?.toString().trim() || "",
      option4: row["Option D"]?.toString().trim() || "",
      answer: row["Correct Answer"]?.toString().trim() || "",
      explanation: row["Explanation"]?.toString().trim() || "",
      level:
        row["Difficulty Level"]?.toString().trim() ||
        testInfo["Exam Difficulty"]?.toString().trim() ||
        "Easy",
      questionType:
        row["Question Type"]?.toString().trim() ||
        "Single Correct",
      language:
        row["Language"]?.toString().trim() ||
        testInfo["Exam Language"]?.toString().trim() ||
        "English",
      tag: row["Tag"]?.toString().trim() || "",
      positiveMarks: Number(
        row["Positive Marks"] ||
          testInfo["Marks Per Question"] ||
          1
      ),
      negativeMarks: Number(
        row["Negative Marks"] ||
          testInfo["Negative Marks"] ||
          0
      ),
      questionStatus:
        row["Question Status"]?.toString().trim() ||
        "published",
      saveToQuestionBank:
        row["Save To Question Bank"]?.toString().trim() ||
        "yes",
    }));

    const invalidQuestionIndex = importedQuestions.findIndex(
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
        `Question ${invalidQuestionIndex + 1} is incomplete. Import cancelled.`
      );
      event.target.value = "";
      return;
    }

    const title =
      testInfo["Test Title"]?.toString().trim() ||
      "Imported XLSX Mock Test";

    const totalQuestions = importedQuestions.length;

    const totalMarks = importedQuestions.reduce(
      (sum, q) => sum + Number(q.positiveMarks || 0),
      0
    );

    const confirmImport = window.confirm(
      `Import this Excel file as Draft?\n\nTitle: ${title}\nQuestions: ${totalQuestions}\nMarks: ${totalMarks}\n\nExisting tests will not be overwritten.`
    );

    if (!confirmImport) {
      event.target.value = "";
      return;
    }

    const importPayload = {
      title: `${title} - Imported`,
      section: "mockTest",
      contentType: "MOCK",

      planType: testInfo["Plan"]?.toString().trim() || "FREE",
      examType: testInfo["Exam Type"]?.toString().trim() || "CTET",
      testType:
        testInfo["Test Type"]?.toString().trim() ||
        "Chapter Test",

      subject: testInfo["Subject"]?.toString().trim() || "",
      chapter: testInfo["Chapter"]?.toString().trim() || "",

      duration: Number(testInfo["Duration Minutes"] || 30),
      durationMinutes: Number(testInfo["Duration Minutes"] || 30),

      totalQuestions,
      marksPerQuestion: Number(
        testInfo["Marks Per Question"] || 1
      ),
      negativeMarks: Number(testInfo["Negative Marks"] || 0),
      passingMarks: Number(testInfo["Passing Marks"] || 0),

      examDifficulty:
        testInfo["Exam Difficulty"]?.toString().trim() ||
        "Mixed",

      examLanguage:
        testInfo["Exam Language"]?.toString().trim() ||
        "English",

      attemptLimit:
        testInfo["Attempt Limit"]?.toString().trim() ||
        "unlimited",

      resultPublishMode:
        testInfo["Result Publish Mode"]?.toString().trim() ||
        "instant",

      shuffleQuestions:
        testInfo["Shuffle Questions"]?.toString().trim() ||
        "no",

      shuffleOptions:
        testInfo["Shuffle Options"]?.toString().trim() ||
        "no",

      navigationMode:
        testInfo["Navigation Mode"]?.toString().trim() ||
        "free",

      allowPause:
        testInfo["Allow Pause"]?.toString().trim() ||
        "yes",

      calculatorAllowed:
        testInfo["Calculator Allowed"]?.toString().trim() ||
        "no",

      questionSource:
        testInfo["Question Source"]?.toString().trim() ||
        "xlsxImport",

      fullscreenMode:
        testInfo["Fullscreen Mode"]?.toString().trim() ||
        "no",

      tabSwitchDetection:
        testInfo["Tab Switch Detection"]?.toString().trim() ||
        "no",

      copyPasteProtection:
        testInfo["Copy Paste Protection"]?.toString().trim() ||
        "no",

      autoSubmitOnViolation:
        testInfo["Auto Submit On Violation"]?.toString().trim() ||
        "no",

      leaderboardMode:
        testInfo["Leaderboard Mode"]?.toString().trim() ||
        "disabled",

      timerMode:
        testInfo["Timer Mode"]?.toString().trim() ||
        "globalTimer",

      perQuestionTimeValue:
        testInfo["Per Question Time Value"]?.toString().trim() ||
        "1",

      perQuestionTimeUnit:
        testInfo["Per Question Time Unit"]?.toString().trim() ||
        "min",

      autoSubmitOnTimeUp:
        testInfo["Auto Submit On Time Up"]?.toString().trim() ||
        "yes",

      scheduleType:
        testInfo["Schedule Type"]?.toString().trim() ||
        "alwaysAvailable",

      examStartDate:
        testInfo["Exam Start Date"]?.toString().trim() || "",

      examStartTime:
        testInfo["Exam Start Time"]?.toString().trim() || "",

      examEndDate:
        testInfo["Exam End Date"]?.toString().trim() || "",

      examEndTime:
        testInfo["Exam End Time"]?.toString().trim() || "",

      recurringMode:
        testInfo["Recurring Mode"]?.toString().trim() ||
        "none",

      weeklyTestDay:
        testInfo["Weekly Test Day"]?.toString().trim() || "",

      monthlyTestDate:
        testInfo["Monthly Test Date"]?.toString().trim() || "",

      liveEventMode:
        testInfo["Live Event Mode"]?.toString().trim() ||
        "no",

      scholarshipMode:
        testInfo["Scholarship Mode"]?.toString().trim() ||
        "no",

      examInstructions:
        testInfo["Exam Instructions"]?.toString().trim() || "",

      status: "draft",

      totalMarks,
      questions: importedQuestions,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db, "contentItems"), importPayload);

    await loadContentItemsFromFirestore();

    alert("Two-sheet Excel mock test imported safely as Draft ✅");

    event.target.value = "";
  } catch (error) {
    console.error("Import XLSX error:", error);
    alert("Excel import failed. Please check template format.");
    event.target.value = "";
  }
};

const convertGoogleDriveUrlToDownloadUrl = (url = "") => {
  const fileIdMatch =
    url.match(/\/d\/([^/]+)/) ||
    url.match(/[?&]id=([^&]+)/);

  if (!fileIdMatch?.[1]) {
    return url;
  }

  return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
};

const handleImportMockTestXlsxFromUrl = async () => {
  try {
    if (!mockImportXlsxUrl.trim()) {
      alert("Please paste Google Drive XLSX URL");
      return;
    }

    const downloadUrl = convertGoogleDriveUrlToDownloadUrl(
      mockImportXlsxUrl.trim()
    );

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      alert(
        "Unable to fetch XLSX from URL. Please make sure the file is public/shared."
      );
      return;
    }

    const data = await response.arrayBuffer();

    const workbook = XLSX.read(data, {
      type: "array",
    });

    const testInfoSheet = workbook.Sheets["Test Info"];
    const questionsSheet = workbook.Sheets["Questions"];

    if (!testInfoSheet || !questionsSheet) {
      alert(
        "Invalid template. File must contain 'Test Info' and 'Questions' sheets."
      );
      return;
    }

    const testInfoRows = XLSX.utils.sheet_to_json(testInfoSheet, {
      defval: "",
    });

    const questionRows = XLSX.utils.sheet_to_json(questionsSheet, {
      defval: "",
    });

    if (!testInfoRows.length || !questionRows.length) {
      alert("Excel file has empty Test Info or Questions sheet.");
      return;
    }

    if (questionRows.length > 200) {
      alert("Maximum 200 questions allowed per import for storage safety.");
      return;
    }

    const testInfo = testInfoRows.reduce((acc, row) => {
      const field = row.Field?.toString().trim();
      const value = row.Value;

      if (field) {
        acc[field] = value;
      }

      return acc;
    }, {});

    const requiredQuestionColumns = [
      "Question",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer",
    ];

    const missingQuestionColumns =
      requiredQuestionColumns.filter(
        (column) => !(column in questionRows[0])
      );

    if (missingQuestionColumns.length > 0) {
      alert(
        `Missing required question column(s): ${missingQuestionColumns.join(
          ", "
        )}`
      );
      return;
    }

    const importedQuestions = questionRows.map((row, index) => ({
      questionNumber: Number(row["Question Number"] || index + 1),
      question: row["Question"]?.toString().trim() || "",
      option1: row["Option A"]?.toString().trim() || "",
      option2: row["Option B"]?.toString().trim() || "",
      option3: row["Option C"]?.toString().trim() || "",
      option4: row["Option D"]?.toString().trim() || "",
      answer: row["Correct Answer"]?.toString().trim() || "",
      explanation: row["Explanation"]?.toString().trim() || "",
      level:
        row["Difficulty Level"]?.toString().trim() ||
        testInfo["Exam Difficulty"]?.toString().trim() ||
        "Easy",
      questionType:
        row["Question Type"]?.toString().trim() ||
        "Single Correct",
      language:
        row["Language"]?.toString().trim() ||
        testInfo["Exam Language"]?.toString().trim() ||
        "English",
      tag: row["Tag"]?.toString().trim() || "",
      positiveMarks: Number(
        row["Positive Marks"] ||
          testInfo["Marks Per Question"] ||
          1
      ),
      negativeMarks: Number(
        row["Negative Marks"] ||
          testInfo["Negative Marks"] ||
          0
      ),
      questionStatus:
        row["Question Status"]?.toString().trim() ||
        "published",
      saveToQuestionBank:
        row["Save To Question Bank"]?.toString().trim() ||
        "yes",
    }));

    const invalidQuestionIndex = importedQuestions.findIndex(
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
        `Question ${invalidQuestionIndex + 1} is incomplete. Import cancelled.`
      );
      return;
    }

    const title =
      testInfo["Test Title"]?.toString().trim() ||
      "Imported Drive XLSX Mock Test";

    const totalQuestions = importedQuestions.length;

    const totalMarks = importedQuestions.reduce(
      (sum, q) => sum + Number(q.positiveMarks || 0),
      0
    );

    const confirmImport = window.confirm(
      `Import this Google Drive XLSX as Draft?\n\nTitle: ${title}\nQuestions: ${totalQuestions}\nMarks: ${totalMarks}\n\nExisting tests will not be overwritten.`
    );

    if (!confirmImport) return;

    const importPayload = {
      title: `${title} - Imported`,
      section: "mockTest",
      contentType: "MOCK",

      planType: testInfo["Plan"]?.toString().trim() || "FREE",
      examType: testInfo["Exam Type"]?.toString().trim() || "CTET",
      testType:
        testInfo["Test Type"]?.toString().trim() ||
        "Chapter Test",

      subject: testInfo["Subject"]?.toString().trim() || "",
      chapter: testInfo["Chapter"]?.toString().trim() || "",

      duration: Number(testInfo["Duration Minutes"] || 30),
      durationMinutes: Number(testInfo["Duration Minutes"] || 30),

      totalQuestions,
      marksPerQuestion: Number(testInfo["Marks Per Question"] || 1),
      negativeMarks: Number(testInfo["Negative Marks"] || 0),
      passingMarks: Number(testInfo["Passing Marks"] || 0),

      examDifficulty:
        testInfo["Exam Difficulty"]?.toString().trim() || "Mixed",
      examLanguage:
        testInfo["Exam Language"]?.toString().trim() || "English",

      attemptLimit:
        testInfo["Attempt Limit"]?.toString().trim() || "unlimited",
      resultPublishMode:
        testInfo["Result Publish Mode"]?.toString().trim() || "instant",

      shuffleQuestions:
        testInfo["Shuffle Questions"]?.toString().trim() || "no",
      shuffleOptions:
        testInfo["Shuffle Options"]?.toString().trim() || "no",

      navigationMode:
        testInfo["Navigation Mode"]?.toString().trim() || "free",
      allowPause:
        testInfo["Allow Pause"]?.toString().trim() || "yes",
      calculatorAllowed:
        testInfo["Calculator Allowed"]?.toString().trim() || "no",

      questionSource: "googleDriveXlsxUrl",
      sourceXlsxUrl: mockImportXlsxUrl.trim(),

      fullscreenMode:
        testInfo["Fullscreen Mode"]?.toString().trim() || "no",
      tabSwitchDetection:
        testInfo["Tab Switch Detection"]?.toString().trim() || "no",
      copyPasteProtection:
        testInfo["Copy Paste Protection"]?.toString().trim() || "no",
      autoSubmitOnViolation:
        testInfo["Auto Submit On Violation"]?.toString().trim() || "no",

      leaderboardMode:
        testInfo["Leaderboard Mode"]?.toString().trim() || "disabled",

      timerMode:
        testInfo["Timer Mode"]?.toString().trim() || "globalTimer",
      perQuestionTimeValue:
        testInfo["Per Question Time Value"]?.toString().trim() || "1",
      perQuestionTimeUnit:
        testInfo["Per Question Time Unit"]?.toString().trim() || "min",
      autoSubmitOnTimeUp:
        testInfo["Auto Submit On Time Up"]?.toString().trim() || "yes",

      scheduleType:
        testInfo["Schedule Type"]?.toString().trim() ||
        "alwaysAvailable",
      examStartDate:
        testInfo["Exam Start Date"]?.toString().trim() || "",
      examStartTime:
        testInfo["Exam Start Time"]?.toString().trim() || "",
      examEndDate:
        testInfo["Exam End Date"]?.toString().trim() || "",
      examEndTime:
        testInfo["Exam End Time"]?.toString().trim() || "",

      recurringMode:
        testInfo["Recurring Mode"]?.toString().trim() || "none",
      weeklyTestDay:
        testInfo["Weekly Test Day"]?.toString().trim() || "",
      monthlyTestDate:
        testInfo["Monthly Test Date"]?.toString().trim() || "",

      liveEventMode:
        testInfo["Live Event Mode"]?.toString().trim() || "no",
      scholarshipMode:
        testInfo["Scholarship Mode"]?.toString().trim() || "no",

      examInstructions:
        testInfo["Exam Instructions"]?.toString().trim() || "",

      status: "draft",

      totalMarks,
      questions: importedQuestions,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db, "contentItems"), importPayload);

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

const handleSaveVideo = async () => {
  try {
    const finalSubject = videoForm.subject?.trim();
    const finalChapter = videoForm.chapter?.trim();

    if (
      !videoForm.title?.trim() ||
      !videoForm.planType?.trim() ||
      !finalSubject ||
      !finalChapter ||
      !videoForm.videoUrl?.trim()
    ) {
      alert("Please fill Title, Plan, Subject, Chapter, and Video URL");
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
      normalizeText(subject.name) === normalizeText(finalSubject) ||
      normalizeText(subject.slug) === normalizeText(finalSubject) ||
      normalizeText(subject.code) === normalizeText(finalSubject)
  );

    if (!existingSubject) {
      await addDoc(collection(db, "notesSubjects"), {
        name: finalSubject,
        code: "",
        slug: finalSubject.toLowerCase().replace(/\s+/g, "-"),
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
          finalSubject.toLowerCase() &&
        chapter.name?.trim().toLowerCase() ===
          finalChapter.toLowerCase()
    );

    if (!existingChapter) {
      await addDoc(collection(db, "notesChapters"), {
        subjectId: "",
        subjectName: finalSubject,
        name: finalChapter,
        code: "",
        slug: finalChapter.toLowerCase().replace(/\s+/g, "-"),
        order: "0",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await loadNotesChaptersFromFirestore();
    }

    const videoPayload = {
      title: videoForm.title.trim(),
      section: "recordedVideo",
      contentType: "VIDEO",
      planType: videoForm.planType,
      subject: finalSubject,
      chapter: finalChapter,
      videoUrl: videoForm.videoUrl.trim(),
      fileUrl: videoForm.videoUrl.trim(),
      thumbnailUrl: videoForm.thumbnailUrl || "",
      duration: videoForm.duration || "",
      mentorName: videoForm.mentorName || "",
      status: (videoForm.status || "published").toLowerCase(),
      sourceType: videoForm.sourceType || "YOUTUBE_UNLISTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db, "contentItems"), videoPayload);

    await loadContentItemsFromFirestore();

    alert("Video saved successfully 🎥");

    setVideoForm({
      title: "",
      planType: "",
      subject: "",
      chapter: "",
      videoUrl: "",
      thumbnailUrl: "",
      duration: "",
      mentorName: "",
      status: "published",
      sourceType: "YOUTUBE_PUBLIC",
    });

    navigate("/admin/content/videos/manage");
  } catch (error) {
    console.error("Video save error:", error);
    alert(error.code + "\n\n" + error.message);
  }
};

const [videoContent, setVideoContent] = useState([]);
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
  const loadUniversalContent = async () => {
    try {
      setContentLoading(true);
  
      const notesContent =
        (await loadPublishedContent(
          CONTENT_SECTIONS.NOTES
        )) || [];
  
      const currentAffairsContent =
        (await loadPublishedContent(
          CONTENT_SECTIONS.CURRENT_AFFAIRS
        )) || [];
  
      const videoContent =
        (await loadPublishedContent(
          CONTENT_SECTIONS.RECORDED_VIDEO
        )) || [];
  
      const finalContent = [
        ...notesContent,
        ...currentAffairsContent,
        ...videoContent,
      ];
  
      setUniversalContent(finalContent);
  
      console.log("Universal CMS Loaded:", {
        total: finalContent.length,
        notes: notesContent.length,
        currentAffairs: currentAffairsContent.length,
        videos: videoContent.length,
        finalContent,
      });
    } catch (error) {
      console.error(
        "Universal content loading error:",
        error
      );
  
      setUniversalContent([]);
    } finally {
      setContentLoading(false);
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
  
  const handleAnswerSubmit = () => {
    if (!selectedAnswer) {
      alert("Please select an answer");
      return;
    }
  
    setShowAnswer(true);
  
    if (selectedAnswer === mockQuestions[currentQuestion].answer) {
      setScore(score + 1);
    }
    const finalScore =
    selectedAnswer === mockQuestions[currentQuestion].answer
      ? score + 1
      : score;
    setTimeout(() => {
      if (currentQuestion + 1 < mockQuestions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer("");
        setShowAnswer(false);
        setTimeLeft(60);
      } else {
        saveMockResult(finalScore);
        setShowResult(true);
      }
    }, 2000);
  };
  const saveMockResult = async (finalScore) => {
    if (!user) return;
  
    try {
      await addDoc(collection(db, "mockResults"), {
        email: user.email,
        score: finalScore,
        totalQuestions: mockQuestions.length,
        percentage: Math.round(
          (finalScore / mockQuestions.length) * 100
        ),
        subject: selectedSubject,
        createdAt: new Date(),
      });
    } catch (error) {
      alert(error.message);
    }
  };
  
  const restartMockTest = () => {
    setMockStarted(false);
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
      
     
  useEffect(() => {
    if (!mockStarted || showResult) return;
  
    if (timeLeft === 0) {
      setShowResult(true);
      return;
    }
  
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
  
    return () => clearTimeout(timer);
  }, [mockStarted, showResult, timeLeft]);


  


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
<main className="appShell">
<Routes key={location.key || location.pathname}>



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
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">VIDEO CMS</span>

          <h1>Recorded Videos Manager</h1>

          <p>
            Add, manage, organize, publish, and preview recorded
            lectures for the student video learning system.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
            <button onClick={() => navigate("/admin/content/videos/add")}>
              ➕ Add Video
            </button>

            <button onClick={() => navigate("/admin/content/videos/manage")}>
              📂 Manage Videos
            </button>

            <button onClick={() => navigate("/admin/content/videos/subjects")}>
              📚 Subjects
            </button>

            <button onClick={() => navigate("/admin/content/videos/published")}>
              🎬 Published Videos
            </button>

            <button onClick={() => navigate("/admin/content")}>
              ← Back to Content Studio
            </button>
          </div>
        </div>
      </section>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/add"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">ADD VIDEO</span>

          <h1>Add Recorded Video</h1>

          <p>
            Save YouTube public or unlisted lectures into Firestore with plan,
            subject, chapter, mentor, thumbnail, and publish status.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
            <input
              type="text"
              placeholder="Video Title"
              value={videoForm.title}
              onChange={(e) =>
                setVideoForm({ ...videoForm, title: e.target.value })
              }
            />

            <select
              value={videoForm.planType}
              onChange={(e) =>
                setVideoForm({ ...videoForm, planType: e.target.value })
              }
            >
              <option value="">Select Plan</option>
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="MENTORSHIP">MENTORSHIP</option>
            </select>

            <input
  type="text"
  list="videoSubjectSuggestions"
  placeholder="Select or type Subject"
  value={
    videoForm.subject === "CUSTOM"
      ? videoForm.customSubject || ""
      : videoForm.subject
  }
  onChange={(e) =>
    setVideoForm({
      ...videoForm,
      subject: e.target.value,
      customSubject: "",
      chapter: "",
      customChapter: "",
    })
  }
/>

<datalist id="videoSubjectSuggestions">
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

            {videoForm.subject === "CUSTOM" && (
              <input
                type="text"
                placeholder="Enter Custom Subject"
                value={videoForm.customSubject || ""}
                onChange={(e) =>
                  setVideoForm({
                    ...videoForm,
                    customSubject: e.target.value,
                  })
                }
              />
            )}

<input
  type="text"
  list="videoChapterSuggestions"
  placeholder={
    videoForm.subject
      ? "Select or type Chapter"
      : "Select subject first"
  }
  value={
    videoForm.chapter === "CUSTOM"
      ? videoForm.customChapter || ""
      : videoForm.chapter
  }
  onChange={(e) =>
    setVideoForm({
      ...videoForm,
      chapter: e.target.value,
      customChapter: "",
    })
  }
  disabled={!videoForm.subject}
/>

<datalist id="videoChapterSuggestions">
  {[
    ...new Map(
      notesChaptersList
        .filter((chapter) => {
          if (!chapter.name) return false;

          if (!videoForm.subject) {
            return false;
          }

          const selectedSubject = videoForm.subject
            .toString()
            .trim()
            .toLowerCase();

          const chapterSubjectName = (
            chapter.subjectName || ""
          )
            .toString()
            .trim()
            .toLowerCase();

          const chapterSubjectId = (
            chapter.subjectId || ""
          )
            .toString()
            .trim()
            .toLowerCase();

          return (
            chapterSubjectName === selectedSubject ||
            chapterSubjectId === selectedSubject
          );
        })
        .filter((chapter) => {
          const name = (chapter.name || "").trim();

          if (!name) return false;
          if (name.length < 2) return false;
          if (/^[a-zA-Z0-9]{15,}$/.test(name))
            return false;

          return true;
        })
        .map((chapter) => [
          chapter.name.trim().toLowerCase(),
          chapter,
        ])
    ).values(),
  ].map((chapter) => (
    <option
      key={chapter.id}
      value={chapter.name}
    />
  ))}
</datalist>

            {videoForm.chapter === "CUSTOM" && (
              <input
                type="text"
                placeholder="Enter Custom Chapter"
                value={videoForm.customChapter || ""}
                onChange={(e) =>
                  setVideoForm({
                    ...videoForm,
                    customChapter: e.target.value,
                  })
                }
              />
            )}

            <input
              type="text"
              placeholder="YouTube Video URL"
              value={videoForm.videoUrl}
              onChange={(e) =>
                setVideoForm({ ...videoForm, videoUrl: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Thumbnail URL"
              value={videoForm.thumbnailUrl}
              onChange={(e) =>
                setVideoForm({
                  ...videoForm,
                  thumbnailUrl: e.target.value,
                })
              }
            />

            <input
              type="text"
              placeholder="Duration e.g. 32 min"
              value={videoForm.duration}
              onChange={(e) =>
                setVideoForm({ ...videoForm, duration: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Mentor Name"
              value={videoForm.mentorName}
              onChange={(e) =>
                setVideoForm({ ...videoForm, mentorName: e.target.value })
              }
            />

            <select
              value={videoForm.status}
              onChange={(e) =>
                setVideoForm({ ...videoForm, status: e.target.value })
              }
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
            </select>

            <select
              value={videoForm.sourceType}
              onChange={(e) =>
                setVideoForm({ ...videoForm, sourceType: e.target.value })
              }
            >
              <option value="YOUTUBE_PUBLIC">YouTube Public</option>
              <option value="YOUTUBE_UNLISTED">YouTube Unlisted</option>
            </select>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSaveVideo();
            }}
          >
            💾 Save Video
          </button>

          <button onClick={() => navigate("/admin/content/videos")}>
            ← Back to Videos Manager
          </button>
        </div>
      </section>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/manage"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">MANAGE VIDEOS</span>

          <h1>Manage Recorded Videos</h1>

          <p>
            Review, edit, delete, preview, publish, and unpublish
            all saved video lectures.
          </p>
        </div>

        <div className="contentStudioForm">
          <button onClick={() => navigate("/admin/content/videos")}>
            ← Back to Videos Manager
          </button>

          <div className="contentStudioList">
            {universalContent.filter(
              (item) => item.section === "recordedVideo"
            ).length === 0 ? (
              <p>No videos found yet.</p>
            ) : (
              universalContent
                .filter((item) => item.section === "recordedVideo")
                .map((video) => (
                  <div className="contentStudioItem" key={video.id}>
                    <div>
                      <strong>{video.title}</strong>

                      <p>
                        {video.planType} · {video.subject} ·{" "}
                        {video.chapter}
                      </p>

                      <p>
                        {video.duration || "No duration"} ·{" "}
                        {video.mentorName || "No mentor"}
                      </p>

                      <p>Status: {video.status}</p>
                    </div>

                    <div className="contentStudioActions">
                    <button
  onClick={() =>
    navigate(
      `/ctet-tet/videos/watch/${video.id}`
    )
  }
>
  ▶ Preview
</button>

                      <button
                        onClick={() => {
                          setVideoForm({
                            title: video.title || "",
                            planType: video.planType || "FREE",
                            subject: video.subject || "",
                            chapter: video.chapter || "",
                            videoUrl: video.videoUrl || video.fileUrl || "",
                            thumbnailUrl: video.thumbnailUrl || "",
                            duration: video.duration || "",
                            mentorName: video.mentorName || "",
                            status: video.status || "published",
                            sourceType:
                              video.sourceType || "YOUTUBE_PUBLIC",
                          });

                          setEditingCmsId(video.id);
                          navigate("/admin/content/videos/add");
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={async () => {
                          const newStatus =
                            video.status === "published"
                              ? "unpublished"
                              : "published";

                          await updateDoc(
                            doc(db, "contentItems", video.id),
                            {
                              status: newStatus,
                              updatedAt: new Date(),
                            }
                          );

                          alert(`Video ${newStatus} successfully`);

                          await loadContentItemsFromFirestore();
                        }}
                      >
                        {video.status === "published"
                          ? "🚫 Unpublish"
                          : "✅ Publish"}
                      </button>

                      <button
                        onClick={async () => {
                          const confirmDelete = window.confirm(
                            "Are you sure you want to delete this video?"
                          );

                          if (!confirmDelete) return;

                          await deleteDoc(
                            doc(db, "contentItems", video.id)
                          );

                          alert("Video deleted successfully");

                          await loadContentItemsFromFirestore();
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/subjects"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">VIDEO SUBJECTS</span>

          <h1>Video Subject Library</h1>

          <p>
            Automatically group videos by plan, subject, and chapter
            for the student-side video experience.
          </p>
        </div>
        <div className="contentStudioForm">
  <button onClick={() => navigate("/admin/content/videos")}>
    ← Back to Videos Manager
  </button>

  <div className="contentStudioList">
    {[
      ...new Map(
        universalContent
          .filter((item) => item.section === "recordedVideo")
          .filter((item) => item.subject)
          .map((item) => [
            item.subject.trim().toLowerCase(),
            item.subject,
          ])
      ).values(),
    ].length === 0 ? (
      <p>No video subjects found yet.</p>
    ) : (
      [
        ...new Map(
          universalContent
            .filter((item) => item.section === "recordedVideo")
            .filter((item) => item.subject)
            .map((item) => [
              item.subject.trim().toLowerCase(),
              item.subject,
            ])
        ).values(),
      ].map((subjectName) => (
        <div className="contentStudioItem" key={subjectName}>
          <div>
            <strong>{subjectName}</strong>
            <p>
              {
                universalContent.filter(
                  (item) =>
                    item.section === "recordedVideo" &&
                    item.subject?.trim().toLowerCase() ===
                      subjectName.trim().toLowerCase()
                ).length
              }{" "}
              videos available
            </p>
          </div>

          <div>
          <button
  onClick={() =>
    navigate(
      `/admin/content/videos/${encodeURIComponent(
        subjectName
      )}`
    )
  }
>
  View Chapters →
</button>
          </div>
        </div>
      ))
    )}
  </div>
</div>
      </section>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

<Route
  path="/admin/content/videos/:subjectName"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">
          VIDEO CHAPTERS
        </span>

        <h1>Video Chapter Library</h1>

        <p>
          Browse video chapters inside the selected subject.
        </p>
        <div className="contentStudioForm">
  <button
    onClick={() => navigate("/admin/content/videos/subjects")}
  >
    ← Back to Video Subjects
  </button>

  <div className="contentStudioList">
    {[
      ...new Set(
        universalContent
          .filter(
            (video) =>
              video.section === "recordedVideo" &&
              video.subject?.trim().toLowerCase() ===
                activeVideoSubjectName.trim().toLowerCase() &&
              video.chapter
          )
          .map((video) => video.chapter)
      ),
    ].length === 0 ? (
      <p>No chapters found for this subject.</p>
    ) : (
      [
        ...new Set(
          universalContent
            .filter(
              (video) =>
                video.section === "recordedVideo" &&
                video.subject?.trim().toLowerCase() ===
                  activeVideoSubjectName.trim().toLowerCase() &&
                video.chapter
            )
            .map((video) => video.chapter)
        ),
      ].map((chapterName) => (
        <div className="contentStudioItem" key={chapterName}>
          <div>
            <strong>{chapterName}</strong>

            <p>
              {
                universalContent.filter(
                  (video) =>
                    video.section === "recordedVideo" &&
                    video.subject?.trim().toLowerCase() ===
                      activeVideoSubjectName.trim().toLowerCase() &&
                    video.chapter?.trim().toLowerCase() ===
                      chapterName.trim().toLowerCase()
                ).length
              }{" "}
              videos available
            </p>
          </div>

          <button
            onClick={() =>
              navigate(
                `/admin/content/videos/${encodeURIComponent(
                  activeVideoSubjectName
                )}/${encodeURIComponent(chapterName)}`
              )
            }
          >
            View Videos →
          </button>
        </div>
      ))
    )}
  </div>
</div>


      </div>
    </section>
  }
/>

<Route
  path="/admin/content/videos/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">CHAPTER VIDEOS</span>

          <h1>Chapter Video Lectures</h1>

          <p>
            Review all saved video lectures inside the selected
            subject and chapter.
          </p>
        </div>

        <div className="contentStudioForm">
          <button
            onClick={() =>
              navigate(
                `/admin/content/videos/${decodeURIComponent(
                  location.pathname.split("/").slice(-2)[0]
                )}`
              )
            }
          >
            ← Back to Video Chapters
          </button>

          <div className="contentStudioList">
            {universalContent
              .filter((video) => {
                const routeParts = location.pathname.split("/");
                const routeSubject = decodeURIComponent(
                  routeParts[routeParts.length - 2]
                )
                  .trim()
                  .toLowerCase();

                const routeChapter = decodeURIComponent(
                  routeParts[routeParts.length - 1]
                )
                  .trim()
                  .toLowerCase();

                return (
                  video.section === "recordedVideo" &&
                  video.subject?.trim().toLowerCase() === routeSubject &&
                  video.chapter?.trim().toLowerCase() === routeChapter
                );
              })
              .map((video) => (
                <div className="contentStudioItem" key={video.id}>
                  <div>
                    <strong>{video.title}</strong>

                    <p>
                      {video.planType} · {video.subject} ·{" "}
                      {video.chapter}
                    </p>

                    <p>
                      {video.duration || "No duration"} ·{" "}
                      {video.mentorName || "No mentor"}
                    </p>

                    <p>Status: {video.status}</p>
                  </div>
                  <button
  onClick={() =>
    navigate(
      `/ctet-tet/videos/watch/${video.id}`
    )
  }
>
  ▶ Preview
</button>
                </div>
              ))}
          </div>
        </div>
      </section>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
<Route
  path="/admin/content/videos/published"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">PUBLISHED VIDEOS</span>

          <h1>Published Video Lectures</h1>

          <p>
            Review all student-ready published videos by plan,
            subject, chapter, mentor, and duration.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioActions">
            <button onClick={() => navigate("/admin/content/videos")}>
              ← Back to Videos Manager
            </button>

            <button onClick={() => navigate("/admin/content/videos/add")}>
              + Add New Video
            </button>

            <button onClick={() => navigate("/admin/content/videos/manage")}>
              Manage All Videos
            </button>
          </div>
        </div>

        {["FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map((plan) => {
          const planVideos = universalContent.filter(
            (item) =>
              item.section === "recordedVideo" &&
              (item.status || "").toLowerCase() === "published" &&
              (item.planType || "FREE").toUpperCase() === plan
          );

          return (
            <div className="contentStudioList" key={plan}>
              <h3>{plan} Published Videos</h3>

              {planVideos.length === 0 ? (
                <p>No published videos in {plan} plan.</p>
              ) : (
                planVideos.map((item) => (
                  <div
                    className="contentStudioItem"
                    key={item.id}
                  >
                    <div>
                      <strong>{item.title || "Untitled Video"}</strong>

                      <p>
                        {item.subject || "No Subject"} •{" "}
                        {item.chapter || "No Chapter"} •{" "}
                        {item.duration || "No Duration"}
                      </p>

                      <p>
                        {item.mentorName || "No Mentor"} •{" "}
                        Status: {item.status || "published"}
                      </p>
                    </div>

                    <div className="contentStudioActions">
                    <button
  onClick={() =>
    navigate(
      `/ctet-tet/videos/watch/${item.id}`
    )
  }
>
  ▶ Preview
</button>

                      <button
                        onClick={() => {
                          setVideoForm({
                            title: item.title || "",
                            planType: item.planType || "FREE",
                            subject: item.subject || "",
                            chapter: item.chapter || "",
                            videoUrl:
                              item.videoUrl || item.fileUrl || "",
                            thumbnailUrl: item.thumbnailUrl || "",
                            duration: item.duration || "",
                            mentorName: item.mentorName || "",
                            status: item.status || "published",
                            sourceType:
                              item.sourceType || "YOUTUBE_PUBLIC",
                          });

                          navigate("/admin/content/videos/add");
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={async () => {
                          await updateDoc(
                            doc(db, "contentItems", item.id),
                            {
                              status: "draft",
                              updatedAt: new Date(),
                            }
                          );

                          alert("Video unpublished successfully.");
                          loadContentItemsFromFirestore();
                        }}
                      >
                        🚫 Unpublish
                      </button>

                      <button
                        className="deleteContentButton"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${item.title}" permanently?`
                            )
                          ) {
                            handleDeleteLocalContentItem(item.id);
                          }
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </section>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>


<Route
  path="/admin/content/mock-tests"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">MOCK TEST CMS</span>

          <h1>Mock Tests Manager</h1>

          <p>
            Manage CTET/TET mock tests, plan-wise test series,
            subjects, chapters, question banks, answers, results,
            and student practice systems.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/add")
              }
            >
              ➕ Add Examination
            </button>

            <button
  onClick={() => {
    navigate(
      "/admin/content/mock-tests/question-bank"
    );
  }}
>
  📚 Question Bank
</button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/manage")
              }
            >
              📂 Manage Mock Tests
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/plan/FREE")
              }
            >
              FREE Mock Tests
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/plan/BASIC")
              }
            >
              BASIC Mock Tests
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/plan/PREMIUM")
              }
            >
              PREMIUM Mock Tests
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/plan/MENTORSHIP")
              }
            >
              MENTORSHIP Mock Tests
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/subjects")
              }
            >
              📚 Subjects
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/chapters")
              }
            >
              📖 Chapters
            </button>

       

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/test-series")
              }
            >
              🧪 Test Series
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/published")
              }
            >
              ✅ Published Tests
            </button>

            <button
              onClick={() =>
                navigate("/admin/content/mock-tests/results")
              }
            >
              📊 Test Results
            </button>

            <button
  className="contentStudioBtn"
  onClick={() =>
    navigate("/admin/content/mock-tests/leaderboard")
  }
>
  🏆 Leaderboard
</button>

<button
  className="contentStudioBtn"
  onClick={() =>
    navigate("/admin/content/mock-tests/analytics")
  }
>
  📈 Analytics
</button>

            <button
              onClick={() =>
                navigate("/admin/content")
              }
            >
              ← Back to Content Studio
            </button>
          </div>
        </div>
      </section>
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/add"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            {editingMockTestId
              ? "EDIT EXAMINATION"
              : "ADD EXAMINATION"}
          </span>

          <h1>
            {editingMockTestId
              ? "Edit Examination Test"
              : "Create New Examination Test"}
          </h1>

          <p>
            Build chapter tests, subject tests, full mocks, PYQ papers,
            mixed tests, live exams, and custom exams without backend changes.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="sectionHeader">
            <span className="badge">TEST CONFIGURATION</span>

            <h2>Exam Setup</h2>

            <p>
              Define exam category, test type, access plan, subject,
              chapter, duration, marking, and publish status.
            </p>
          </div>

          <div className="contentStudioGrid">
            <input
              type="text"
              placeholder="Test Title e.g. CTET Paper 1 Full Mock 01"
              value={mockTestForm.title}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  title: e.target.value,
                })
              }
            />

            <select
              value={mockTestForm.examType}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  examType: e.target.value,
                })
              }
            >
     <option value="CTET">
  CTET
</option>

<option value="TET">
  TET
</option>

<option value="CTET/TET">
  CTET / TET
</option>

<option value="SSC">
  SSC
</option>

<option value="UPSC">
  UPSC
</option>

<option value="NEET">
  NEET
</option>

<option value="REET">
  REET
</option>

<option value="GPSC">
  GPSC
</option>

<option value="Banking">
  Banking
</option>

<option value="Railway">
  Railway
</option>

<option value="Teaching Aptitude">
  Teaching Aptitude
</option>

<option value="Current Affairs">
  Current Affairs
</option>

<option value="Mixed Test">
  Mixed Test
</option>

<option value="ALL SUBJECTS">
  ALL SUBJECTS
</option>

<option value="Custom Exam">
  Custom Exam
</option>
            </select>

            <select
              value={mockTestForm.testType}
              onChange={(e) => {
                const selectedType = e.target.value;

                const isOverallTest =
                  selectedType === "Full Mock Test" ||
                  selectedType === "Grand Test" ||
                  selectedType === "Previous Year Paper" ||
                  selectedType === "Mixed Test" ||
                  selectedType === "Live Exam" ||
                  selectedType === "Custom Test";

                setMockTestForm({
                  ...mockTestForm,
                  testType: selectedType,
                  subject: isOverallTest
                    ? "ALL SUBJECTS"
                    : mockTestForm.subject,
                  chapter: isOverallTest
                    ? "Complete Paper"
                    : mockTestForm.chapter,
                });
              }}
            >
           <option value="Chapter Test">
  Chapter Test
</option>

<option value="Topic Test">
  Topic Test
</option>

<option value="Unit Test">
  Unit Test
</option>

<option value="Sectional Test">
  Sectional Test
</option>

<option value="Subject Test">
  Subject Test
</option>

<option value="Full Mock Test">
  Full Mock Test
</option>

<option value="Previous Year Paper">
  Previous Year Paper
</option>

<option value="Grand Test">
  Grand Test
</option>

<option value="Practice Test">
  Practice Test
</option>

<option value="Daily Quiz">
  Daily Quiz
</option>

<option value="Weekly Test">
  Weekly Test
</option>

<option value="Monthly Test">
  Monthly Test
</option>

<option value="Live Exam">
  Live Exam
</option>

<option value="Custom Test">
  Custom Test
</option>
            </select>

            <select
              value={mockTestForm.planType}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  planType: e.target.value,
                })
              }
            >
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="MENTORSHIP">MENTORSHIP</option>
            </select>

            <input
              type="text"
              list="mockSubjectSuggestions"
              placeholder="Subject e.g. CDP / Maths / ALL SUBJECTS"
              value={mockTestForm.subject}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  subject: e.target.value,
                  chapter:
                    e.target.value === "ALL SUBJECTS"
                      ? "Complete Paper"
                      : "",
                })
              }
            />

            <datalist id="mockSubjectSuggestions">
              <option value="ALL SUBJECTS" />

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
              list="mockChapterSuggestions"
              placeholder="Chapter / Topic e.g. Learning / Complete Paper"
              value={mockTestForm.chapter}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  chapter: e.target.value,
                })
              }
              disabled={!mockTestForm.subject}
            />

            <datalist id="mockChapterSuggestions">
              <option value="Complete Paper" />

              {notesChaptersList
                .filter((chapter) => {
                  const selectedSubject =
                    mockTestForm.subject
                      ?.toString()
                      .trim()
                      .toLowerCase();

                  if (selectedSubject === "all subjects") {
                    return true;
                  }

                  const chapterSubjectName =
                    chapter.subjectName
                      ?.toString()
                      .trim()
                      .toLowerCase();

                  const chapterSubjectId =
                    chapter.subjectId
                      ?.toString()
                      .trim()
                      .toLowerCase();

                  return (
                    chapterSubjectName === selectedSubject ||
                    chapterSubjectId === selectedSubject
                  );
                })
                .map((chapter) => (
                  <option key={chapter.id} value={chapter.name} />
                ))}
            </datalist>

            <div>
  <label>
    Exam Duration (Minutes)
  </label>

  <input
    type="number"
    min="1"
    placeholder="e.g. 150"
    value={mockTestForm.duration}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        duration: e.target.value,
      })
    }
  />
</div>

<div>
  <label>
    Default Marks Per Question
  </label>

  <input
    type="number"
    min="1"
    placeholder="e.g. 1 or 2"
    value={mockTestForm.marksPerQuestion}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        marksPerQuestion: e.target.value,
      })
    }
  />
</div>

<div>
  <label>
    Default Negative Marks
  </label>

  <input
    type="number"
    min="0"
    step="0.01"
    placeholder="e.g. 0.25 or 0.50"
    value={mockTestForm.negativeMarks}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        negativeMarks: e.target.value,
      })
    }
  />
</div>

<div>
  <label>
    Passing Marks
  </label>

  <input
    type="number"
    min="0"
    placeholder="e.g. 60"
    value={mockTestForm.passingMarks}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        passingMarks: e.target.value,
      })
    }
  />
</div>

<div>
  <label>
    Exam Difficulty
  </label>

  <select
    value={mockTestForm.examDifficulty}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        examDifficulty: e.target.value,
      })
    }
  >
    <option value="Easy">Easy</option>
    <option value="Medium">Medium</option>
    <option value="Hard">Hard</option>
    <option value="Mixed">Mixed</option>
  </select>
</div>

<div>
  <label>
    Exam Language
  </label>

  <select
    value={mockTestForm.examLanguage}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        examLanguage: e.target.value,
      })
    }
  >
    <option value="English">English</option>
    <option value="Hindi">Hindi</option>
    <option value="Gujarati">Gujarati</option>
    <option value="Bilingual">Bilingual</option>
  </select>
</div>

            <select
              value={mockTestForm.status}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  status: e.target.value,
                })
              }
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
            </select>

            <div>
  <label>
    Attempt Limit
  </label>

  <select
    value={mockTestForm.attemptLimit}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        attemptLimit: e.target.value,
      })
    }
  >
    <option value="unlimited">
      Unlimited
    </option>

    <option value="1">
      1 Attempt
    </option>

    <option value="2">
      2 Attempts
    </option>

    <option value="3">
      3 Attempts
    </option>
  </select>
</div>

<div>
  <label>
    Result Publish Mode
  </label>

  <select
    value={mockTestForm.resultPublishMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        resultPublishMode: e.target.value,
      })
    }
  >
    <option value="instant">
      Instant Result
    </option>

    <option value="afterSubmission">
      After Submission
    </option>

    <option value="manual">
      Manual Publish
    </option>
  </select>
</div>

<div>
  <label>
    Shuffle Questions
  </label>

  <select
    value={mockTestForm.shuffleQuestions}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        shuffleQuestions: e.target.value,
      })
    }
  >
    <option value="no">
      No
    </option>

    <option value="yes">
      Yes
    </option>
  </select>
</div>

<div>
  <label>
    Shuffle Options
  </label>

  <select
    value={mockTestForm.shuffleOptions}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        shuffleOptions: e.target.value,
      })
    }
  >
    <option value="no">
      No
    </option>

    <option value="yes">
      Yes
    </option>
  </select>
</div>

<div>
  <label>
    Navigation Mode
  </label>

  <select
    value={mockTestForm.navigationMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        navigationMode: e.target.value,
      })
    }
  >
    <option value="free">
      Free Navigation
    </option>

    <option value="sequential">
      Sequential Only
    </option>
  </select>
</div>

<div>
  <label>
    Allow Pause
  </label>

  <select
    value={mockTestForm.allowPause}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        allowPause: e.target.value,
      })
    }
  >
    <option value="yes">
      Yes
    </option>

    <option value="no">
      No
    </option>
  </select>
</div>

<div>
  <label>
    Calculator Allowed
  </label>

  <select
    value={mockTestForm.calculatorAllowed}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        calculatorAllowed: e.target.value,
      })
    }
  >
    <option value="no">
      No
    </option>

    <option value="yes">
      Yes
    </option>
  </select>
</div>

<div>
  <label>
    Question Source
  </label>

  <select
    value={mockTestForm.questionSource}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        questionSource: e.target.value,
      })
    }
  >
    <option value="manual">
      Manual
    </option>

    <option value="questionBank">
      Question Bank
    </option>

    <option value="imported">
      Imported
    </option>

    <option value="aiGenerated">
      AI Generated
    </option>

    <option value="pyq">
      PYQ
    </option>
  </select>
</div>

<div>
  <label>
    Fullscreen Mode
  </label>

  <select
    value={mockTestForm.fullscreenMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        fullscreenMode: e.target.value,
      })
    }
  >
    <option value="no">No</option>
    <option value="yes">Required</option>
  </select>
</div>

<div>
  <label>
    Tab Switch Detection
  </label>

  <select
    value={mockTestForm.tabSwitchDetection}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        tabSwitchDetection: e.target.value,
      })
    }
  >
    <option value="no">
  Disabled
</option>

<option value="yes">
  Enabled
</option>
  </select>
</div>

<div>
  <label>
    Copy / Paste Protection
  </label>

  <select
    value={mockTestForm.copyPasteProtection}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        copyPasteProtection: e.target.value,
      })
    }
  >
    <option value="no">
      Disabled
    </option>

    <option value="yes">
      Enabled
    </option>
  </select>
</div>

<div>
  <label>
    Auto Submit On Violation
  </label>

  <select
    value={mockTestForm.autoSubmitOnViolation}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        autoSubmitOnViolation: e.target.value,
      })
    }
  >
    <option value="no">No</option>
    <option value="yes">Yes</option>
  </select>
</div>

<div>
  <label>
    Leaderboard Mode
  </label>

  <select
    value={mockTestForm.leaderboardMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        leaderboardMode: e.target.value,
      })
    }
  >
    <option value="disabled">
      Disabled
    </option>

    <option value="liveLeaderboard">
      Live Leaderboard
    </option>

    <option value="finalLeaderboard">
      Final Leaderboard
    </option>

    <option value="globalLeaderboard">
      Global Leaderboard
    </option>

    <option value="courseLeaderboard">
      Course Leaderboard
    </option>

    <option value="subjectLeaderboard">
      Subject Leaderboard
    </option>

    <option value="stateLeaderboard">
      State Leaderboard
    </option>

    <option value="batchLeaderboard">
      Batch Leaderboard
    </option>
  </select>
</div>

<div>
  <label>
    Timer Mode
  </label>

  <select
    value={mockTestForm.timerMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        timerMode: e.target.value,
      })
    }
  >
    <option value="globalTimer">
      Global Timer
    </option>

    <option value="perQuestionTimer">
      Per Question Timer
    </option>

    <option value="noTimer">
      No Timer
    </option>
  </select>
</div>
{mockTestForm.timerMode === "perQuestionTimer" && (
  <>
    <div>
      <label>
        Time Value
      </label>

      <input
        type="number"
        min="1"
        value={mockTestForm.perQuestionTimeValue}
        onChange={(e) =>
          setMockTestForm({
            ...mockTestForm,
            perQuestionTimeValue: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label>
        Time Unit
      </label>

      <select
        value={mockTestForm.perQuestionTimeUnit}
        onChange={(e) =>
          setMockTestForm({
            ...mockTestForm,
            perQuestionTimeUnit: e.target.value,
          })
        }
      >
        <option value="sec">
          Seconds
        </option>

        <option value="min">
          Minutes
        </option>

        <option value="hr">
          Hours
        </option>
      </select>
    </div>
  </>
)}
<div>
  <label>
    Auto Submit On Time Up
  </label>

  <select
    value={mockTestForm.autoSubmitOnTimeUp}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        autoSubmitOnTimeUp: e.target.value,
      })
    }
  >
    <option value="yes">
      Yes
    </option>

    <option value="no">
      No
    </option>
  </select>
</div>

<div>
  <label>
    Schedule Type
  </label>

  <select
    value={mockTestForm.scheduleType}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        scheduleType: e.target.value,
      })
    }
  >
    <option value="alwaysAvailable">
      Always Available
    </option>

    <option value="dateOnly">
      Date Only
    </option>

    <option value="dateTime">
      Date + Time
    </option>
  </select>
</div>

{mockTestForm.scheduleType !== "alwaysAvailable" && (
  <div>
    <label>
      Exam Start Date
    </label>

    <input
      type={
        mockTestForm.scheduleType === "dateOnly"
          ? "date"
          : "datetime-local"
      }
      value={mockTestForm.examStartDate}
      onChange={(e) =>
        setMockTestForm({
          ...mockTestForm,
          examStartDate: e.target.value,
        })
      }
    />
  </div>
)}

{mockTestForm.scheduleType !== "alwaysAvailable" && (
  <div>
    <label>
      Exam End Date
    </label>

    <input
      type={
        mockTestForm.scheduleType === "dateOnly"
          ? "date"
          : "datetime-local"
      }
      value={mockTestForm.examEndDate}
      onChange={(e) =>
        setMockTestForm({
          ...mockTestForm,
          examEndDate: e.target.value,
        })
      }
    />
  </div>
)}

<div>
  <label>
    Recurring Mode
  </label>

  <select
    value={mockTestForm.recurringMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        recurringMode: e.target.value,
      })
    }
  >
    <option value="none">
      No Recurring
    </option>

    <option value="weekly">
      Weekly Test
    </option>

    <option value="monthly">
      Monthly Test
    </option>
  </select>
</div>

{mockTestForm.recurringMode === "weekly" && (
  <div>
    <label>
      Weekly Test Day
    </label>

    <select
      value={mockTestForm.weeklyTestDay}
      onChange={(e) =>
        setMockTestForm({
          ...mockTestForm,
          weeklyTestDay: e.target.value,
        })
      }
    >
      <option value="">
        Select Day
      </option>

      <option value="Sunday">
        Sunday
      </option>

      <option value="Monday">
        Monday
      </option>

      <option value="Tuesday">
        Tuesday
      </option>

      <option value="Wednesday">
        Wednesday
      </option>

      <option value="Thursday">
        Thursday
      </option>

      <option value="Friday">
        Friday
      </option>

      <option value="Saturday">
        Saturday
      </option>
    </select>
  </div>
)}

{mockTestForm.recurringMode === "monthly" && (
  
  <div>
    <label>
      Monthly Test Date
    </label>

    <input
      type="number"
      min="1"
      max="31"
      value={mockTestForm.monthlyTestDate}
      onChange={(e) =>
        setMockTestForm({
          ...mockTestForm,
          monthlyTestDate: e.target.value,
        })
      }
    />
  </div>
)}

<div>
  <label>
    Live Event Mode
  </label>

  <select
    value={mockTestForm.liveEventMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        liveEventMode: e.target.value,
      })
    }
  >
    <option value="no">
      Normal Test
    </option>

    <option value="yes">
      Live Event
    </option>
  </select>
</div>

<div>
  <label>
    Scholarship Exam Mode
  </label>

  <select
    value={mockTestForm.scholarshipMode}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        scholarshipMode: e.target.value,
      })
    }
  >
    <option value="no">
      Disabled
    </option>

    <option value="yes">
      Enabled
    </option>
  </select>
</div>

<div>
  <label>
    Exam Instructions
  </label>

  <textarea
    placeholder="Write exam instructions shown before student starts the test"
    value={mockTestForm.examInstructions}
    onChange={(e) =>
      setMockTestForm({
        ...mockTestForm,
        examInstructions: e.target.value,
      })
    }
  />
</div>

          </div>

          <div className="contentStudioList">
            <div className="sectionHeader">
              <span className="badge">QUESTION BUILDER</span>

              <h2>Manual Question Entry</h2>

              <p>
                Add unlimited questions manually. Each question supports
                options, answer key, explanation, difficulty, topic tag,
                marks, negative marks, language, and status.
              </p>
            </div>

            {mockTestQuestionsForm.map((questionItem, questionIndex) => (
              <div className="contentStudioItem" key={questionIndex}>
                <strong>Question {questionIndex + 1}</strong>

                <div className="contentStudioGrid">
                  <textarea
                    placeholder="Enter Question"
                    value={questionItem.question}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].question =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Option A"
                    value={questionItem.option1}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].option1 =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Option B"
                    value={questionItem.option2}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].option2 =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Option C"
                    value={questionItem.option3}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].option3 =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Option D"
                    value={questionItem.option4}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].option4 =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  />

                  <select
                    value={questionItem.answer}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].answer =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  >
                    <option value="">Correct Answer</option>
                    <option value="option1">Option A</option>
                    <option value="option2">Option B</option>
                    <option value="option3">Option C</option>
                    <option value="option4">Option D</option>
                  </select>

                  <textarea
                    placeholder="Explanation / Solution"
                    value={questionItem.explanation}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].explanation =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  />

                  <select
                    value={questionItem.level}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].level =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  <select
                    value={questionItem.questionType}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].questionType =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  >
              <option value="Single Correct">
  Single Correct
</option>

<option value="Multiple Correct">
  Multiple Correct
</option>

<option value="True False">
  True / False
</option>

<option value="Assertion Reason">
  Assertion Reason
</option>

<option value="Passage Based">
  Passage Based
</option>

<option value="Image Based">
  Image Based
</option>

<option value="Match the Following">
  Match the Following
</option>

<option value="Statement Based">
  Statement Based
</option>
                  </select>

                  <select
                    value={questionItem.language}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].language =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Bilingual">Bilingual</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Topic Tag e.g. Piaget / Learning / EVS"
                    value={questionItem.tag}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...mockTestQuestionsForm,
                      ];

                      updatedQuestions[questionIndex].tag =
                        e.target.value;

                      setMockTestQuestionsForm(updatedQuestions);
                    }}
                  />

<div>
  <label>
    Question Marks
  </label>

  <input
    type="number"
    min="0"
    placeholder="e.g. 1"
    value={questionItem.positiveMarks}
    onChange={(e) => {
      const updatedQuestions = [
        ...mockTestQuestionsForm,
      ];

      updatedQuestions[questionIndex].positiveMarks =
        e.target.value;

      setMockTestQuestionsForm(updatedQuestions);
    }}
  />
</div>

<div>
  <label>
    Question Negative Marks
  </label>

  <input
    type="number"
    min="0"
    step="0.01"
    placeholder="e.g. 0 or 0.25"
    value={questionItem.negativeMarks}
    onChange={(e) => {
      const updatedQuestions = [
        ...mockTestQuestionsForm,
      ];

      updatedQuestions[questionIndex].negativeMarks =
        e.target.value;

      setMockTestQuestionsForm(updatedQuestions);
    }}
  />
</div>

<div>

  <label>
    Question Status
  </label>

  <select
    value={questionItem.questionStatus}
    onChange={(e) => {
      const updatedQuestions = [
        ...mockTestQuestionsForm,
      ];

      updatedQuestions[questionIndex].questionStatus =
        e.target.value;

      setMockTestQuestionsForm(updatedQuestions);
    }}
  >


    <option value="draft">
      Draft
    </option>

    <option value="approved">
      Approved
    </option>

    <option value="published">
      Published
    </option>
  </select>

  <label>Save To Question Bank</label>

<select
  value={questionItem.saveToQuestionBank}
  onChange={(e) => {
    const updatedQuestions = [
      ...mockTestQuestionsForm,
    ];

    updatedQuestions[questionIndex].saveToQuestionBank =
      e.target.value;

    setMockTestQuestionsForm(updatedQuestions);
  }}
>
  <option value="yes">Save To Question Bank</option>
  <option value="no">Do Not Save To Question Bank</option>
</select>


</div>

                </div>

                <div className="contentStudioActions">
  <button
    className="backButton"
    disabled={questionIndex === 0}
    onClick={() => {
      const updatedQuestions = [...mockTestQuestionsForm];
      const currentQuestion = updatedQuestions[questionIndex];

      updatedQuestions[questionIndex] =
        updatedQuestions[questionIndex - 1];

      updatedQuestions[questionIndex - 1] = currentQuestion;

      setMockTestQuestionsForm(updatedQuestions);
    }}
  >
    ↑ Move Up
  </button>

  <button
    className="backButton"
    disabled={questionIndex === mockTestQuestionsForm.length - 1}
    onClick={() => {
      const updatedQuestions = [...mockTestQuestionsForm];
      const currentQuestion = updatedQuestions[questionIndex];

      updatedQuestions[questionIndex] =
        updatedQuestions[questionIndex + 1];

      updatedQuestions[questionIndex + 1] = currentQuestion;

      setMockTestQuestionsForm(updatedQuestions);
    }}
  >
    ↓ Move Down
  </button>

  <button
    className="backButton"
    onClick={() => {
      const duplicatedQuestion = {
        ...mockTestQuestionsForm[questionIndex],
        question: `${mockTestQuestionsForm[questionIndex].question || ""} Copy`,
        saveToQuestionBank: "no",
      };

      const updatedQuestions = [...mockTestQuestionsForm];

      updatedQuestions.splice(
        questionIndex + 1,
        0,
        duplicatedQuestion
      );

      setMockTestQuestionsForm(updatedQuestions);
    }}
  >
    Duplicate Question
  </button>

  {mockTestQuestionsForm.length > 1 && (
    <button
      className="deleteContentButton"
      onClick={() => {
        const updatedQuestions = mockTestQuestionsForm.filter(
          (_, index) => index !== questionIndex
        );

        setMockTestQuestionsForm(updatedQuestions);
      }}
    >
      Delete Question
    </button>
  )}
</div>
              </div>
            ))}

            <div className="contentStudioActions">
            <button
  className="dangerButton"
  onClick={() => {
    const confirmClear = window.confirm(
      "Clear all questions and start again?"
    );

    if (!confirmClear) return;

    setMockTestQuestionsForm([
      {
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        answer: "",
        explanation: "",
        level: "Easy",
        questionType: "Single Correct",
        language: "English",
        tag: "",
        positiveMarks: mockTestForm.marksPerQuestion || "1",
        negativeMarks: mockTestForm.negativeMarks || "0",
        questionStatus: "published",
        saveToQuestionBank: "yes",
      },
    ]);
  }}
>
  Clear All Questions
</button>
              <button
                className="publishButton"
                onClick={() =>
                  setMockTestQuestionsForm([
                    ...mockTestQuestionsForm,
                    {
                      question: "",
                      option1: "",
                      option2: "",
                      option3: "",
                      option4: "",
                      answer: "",
                      explanation: "",
                      level: "Easy",
                      questionType: "Single Correct",
                      language: "English",
                      tag: "",
                      positiveMarks:
                        mockTestForm.marksPerQuestion || "1",
                      negativeMarks:
                        mockTestForm.negativeMarks || "0",
                      questionStatus: "published",
                      saveToQuestionBank: "yes",
                    },
                  ])
                }
              >
                + Add Question
              </button>

              <button
                className="publishButton"
                onClick={handleSaveMockTest}
              >
                {editingMockTestId
                  ? "Update Examination Test"
                  : "Save Examination Test"}
              </button>

              <button
                className="backButton"
                onClick={() =>
                  navigate("/admin/content/mock-tests")
                }
              >
                ← Back to Examination Studio
              </button>
            </div>
          </div>
        </div>
      </section>
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/manage"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">
            MANAGE MOCK TESTS
          </span>

          <h1>Manage Mock Tests</h1>

          <p>
            Review, edit, publish, unpublish,
            preview, and delete all saved CTET/TET
            mock tests from one professional manager.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">

          <input
  type="text"
  placeholder="Search by title, subject, or chapter"
  value={mockTestSearch}
  onChange={(e) => setMockTestSearch(e.target.value)}
/>

<select
  value={mockTestStatusFilter}
  onChange={(e) => setMockTestStatusFilter(e.target.value)}
>
  <option value="ALL">All Status</option>
  <option value="published">Published</option>
  <option value="unpublished">Unpublished</option>
  <option value="draft">Draft</option>
  <option value="archived">Archived</option>
</select>

<select
  value={mockTestExamFilter}
  onChange={(e) => setMockTestExamFilter(e.target.value)}
>
  <option value="ALL">All Exams</option>
  <option value="CTET">CTET</option>
  <option value="TET">TET</option>
  <option value="CTET/TET">CTET/TET</option>
</select>

<select
  value={mockTestSortMode}
  onChange={(e) => setMockTestSortMode(e.target.value)}
>
  <option value="LATEST">Latest First</option>
  <option value="OLDEST">Oldest First</option>
</select>

            <button
              onClick={() =>
                setMockTestPlanFilter("ALL")
              }
            >
              ALL
            </button>

            <button
              onClick={() =>
                setMockTestPlanFilter("FREE")
              }
            >
              FREE
            </button>

            <button
              onClick={() =>
                setMockTestPlanFilter("BASIC")
              }
            >
              BASIC
            </button>

            <button
              onClick={() =>
                setMockTestPlanFilter("PREMIUM")
              }
            >
              PREMIUM
            </button>

            <button
              onClick={() =>
                setMockTestPlanFilter("MENTORSHIP")
              }
            >
              MENTORSHIP
            </button>
          </div>
        </div>

        <div className="mockManageStatsGrid">
  {(() => {
    const filteredStatsTests = universalContent.filter((item) => {
      const searchText =
        mockTestSearch.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        item.title?.toLowerCase().includes(searchText) ||
        item.subject?.toLowerCase().includes(searchText) ||
        item.chapter?.toLowerCase().includes(searchText);

      const matchesPlan =
        mockTestPlanFilter === "ALL" ||
        item.planType === mockTestPlanFilter;

      const matchesStatus =
        mockTestStatusFilter === "ALL" ||
        item.status === mockTestStatusFilter;

      const matchesExam =
        mockTestExamFilter === "ALL" ||
        item.examType === mockTestExamFilter;

      return (
        item.section === "mockTest" &&
        matchesSearch &&
        matchesPlan &&
        matchesStatus &&
        matchesExam
      );
    });

    return (
      <>
        <div className="mockManageStatCard">
          <span>Filtered Tests</span>
          <strong>{filteredStatsTests.length}</strong>
        </div>

        <div className="mockManageStatCard">
          <span>Published</span>
          <strong>
            {
              filteredStatsTests.filter(
                (item) => item.status === "published"
              ).length
            }
          </strong>
        </div>

        <div className="mockManageStatCard">
          <span>Draft</span>
          <strong>
            {
              filteredStatsTests.filter(
                (item) => item.status === "draft"
              ).length
            }
          </strong>
        </div>

        <div className="mockManageStatCard">
          <span>Archived</span>
          <strong>
            {
              filteredStatsTests.filter(
                (item) => item.status === "archived"
              ).length
            }
          </strong>
        </div>
      </>
    );
  })()}
</div>

<div className="mockBulkActionsBar">

<div className="mockSelectedCount">
  <span>Selected Tests</span>
  <strong>{selectedMockTestIds.length}</strong>
</div>

<button
  className="backButton"
  onClick={() => {
    const visibleMockTestIds = universalContent
      .filter((item) => {
        const searchText =
          mockTestSearch.trim().toLowerCase();

        const matchesSearch =
          !searchText ||
          item.title?.toLowerCase().includes(searchText) ||
          item.subject?.toLowerCase().includes(searchText) ||
          item.chapter?.toLowerCase().includes(searchText);

        const matchesPlan =
          mockTestPlanFilter === "ALL" ||
          item.planType === mockTestPlanFilter;

        const matchesStatus =
          mockTestStatusFilter === "ALL" ||
          item.status === mockTestStatusFilter;

        const matchesExam =
          mockTestExamFilter === "ALL" ||
          item.examType === mockTestExamFilter;

        return (
          item.section === "mockTest" &&
          matchesSearch &&
          matchesPlan &&
          matchesStatus &&
          matchesExam
        );
      })
      .sort((a, b) => {
        const firstDate =
          a.createdAt?.seconds ||
          a.updatedAt?.seconds ||
          0;

        const secondDate =
          b.createdAt?.seconds ||
          b.updatedAt?.seconds ||
          0;

        return mockTestSortMode === "OLDEST"
          ? firstDate - secondDate
          : secondDate - firstDate;
      })
      .slice(
        (mockTestPage - 1) * mockTestsPerPage,
        mockTestPage * mockTestsPerPage
      )
      .map((item) => item.id);

    setSelectedMockTestIds(visibleMockTestIds);
  }}
>
  Select All
</button>

<button
  className="backButton"
  onClick={() => {
    setSelectedMockTestIds([]);
  }}
>
  Clear Selected
</button>

<button
  className="backButton"
  onClick={async () => {
    if (selectedMockTestIds.length === 0) {
      alert("Please select at least one mock test");
      return;
    }

    const selectedCount = selectedMockTestIds.length;

    const confirmBulkAction = window.confirm(
      `You are about to publish ${selectedCount} selected mock test(s).

Do you want to continue?`
    );

    if (!confirmBulkAction) {
      return;
    }

    for (const testId of selectedMockTestIds) {
      await updateDoc(doc(db, "contentItems", testId), {
        status: "published",
        updatedAt: new Date(),
      });
    }

    await loadContentItemsFromFirestore();

    setSelectedMockTestIds([]);

    alert("Selected mock tests published ✅");
  }}
>
  Publish Selected
</button>

<button
  className="backButton"
  onClick={async () => {
    if (selectedMockTestIds.length === 0) {
      alert("Please select at least one mock test");
      return;
    }

    const selectedCount = selectedMockTestIds.length;

    const confirmBulkAction = window.confirm(
      `You are about to unpublish ${selectedCount} selected mock test(s).

Do you want to continue?`
    );

    if (!confirmBulkAction) {
      return;
    }

    for (const testId of selectedMockTestIds) {
      await updateDoc(doc(db, "contentItems", testId), {
        status: "unpublished",
        updatedAt: new Date(),
      });
    }

    await loadContentItemsFromFirestore();

    setSelectedMockTestIds([]);

    alert("Selected mock tests unpublished ✅");
  }}
>
  Unpublish Selected
</button>

<button
  className="backButton"
  onClick={async () => {
    if (selectedMockTestIds.length === 0) {
      alert("Please select at least one mock test");
      return;
    }

    const selectedCount = selectedMockTestIds.length;

    const confirmBulkAction = window.confirm(
      `You are about to archive ${selectedCount} selected mock test(s).

Do you want to continue?`
    );

    if (!confirmBulkAction) {
      return;
    }

    for (const testId of selectedMockTestIds) {
      await updateDoc(doc(db, "contentItems", testId), {
        status: "archived",
        updatedAt: new Date(),
      });
    }

    await loadContentItemsFromFirestore();

    setSelectedMockTestIds([]);

    alert("Selected mock tests archived ✅");
  }}
>
  Archive Selected
</button>

<button
  className="dangerButton"
  onClick={async () => {
    if (selectedMockTestIds.length === 0) {
      alert("Please select at least one mock test");
      return;
    }

    const confirmDelete = window.confirm(
      `Delete ${selectedMockTestIds.length} selected mock test(s) permanently?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    for (const testId of selectedMockTestIds) {
      await deleteDoc(doc(db, "contentItems", testId));
    }

    await loadContentItemsFromFirestore();

    setSelectedMockTestIds([]);

    alert("Selected mock tests deleted permanently ✅");
  }}
>
  Delete Selected
</button>
</div>

        <div className="contentStudioList">
        <h3>⭐ Featured Mock Tests</h3>

{universalContent
  .filter(
    (item) =>
      item.section === "mockTest" &&
      item.isFeatured === true
  )
  .length === 0 ? (
  <div className="contentStudioItem">
    <strong>No featured mock tests.</strong>

    <p>
      Mark any important test as Featured to
      highlight it here.
    </p>
  </div>
) : (
  universalContent
    .filter(
      (item) =>
        item.section === "mockTest" &&
        item.isFeatured === true
    )
    .map((test) => (
      <div
        className="contentStudioItem"
        key={test.id}
      >
        <strong>
          ⭐ {test.title}
        </strong>

        <p>
          {test.subject} • {test.chapter}
        </p>
      </div>
    ))
)}
          <h3>Saved Mock Tests</h3>

          {universalContent
  .filter((item) => {
    const searchText =
      mockTestSearch.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      item.title?.toLowerCase().includes(searchText) ||
      item.subject?.toLowerCase().includes(searchText) ||
      item.chapter?.toLowerCase().includes(searchText);

    const matchesPlan =
      mockTestPlanFilter === "ALL" ||
      item.planType === mockTestPlanFilter;

    const matchesStatus =
      mockTestStatusFilter === "ALL" ||
      item.status === mockTestStatusFilter;

    const matchesExam =
      mockTestExamFilter === "ALL" ||
      item.examType === mockTestExamFilter;

    return (
      item.section === "mockTest" &&
      matchesSearch &&
      matchesPlan &&
      matchesStatus &&
      matchesExam
    );
  }).length === 0 ? (
    <div className="contentStudioItem mockEmptyStateCard">
    <strong>No mock tests found.</strong>
  
    <p>
      No tests match your current search or filters.
      Try changing filters or create a new mock test.
    </p>
  
    <div className="contentStudioActions">
      <button
        className="publishButton"
        onClick={() =>
          navigate("/admin/content/mock-tests/add")
        }
      >
        + Create Mock Test
      </button>
  
      <button
        className="backButton"
        onClick={() => {
          setMockTestSearch("");
          setMockTestStatusFilter("ALL");
          setMockTestExamFilter("ALL");
          setMockTestPlanFilter("ALL");
        }}
      >
        Clear Filters
      </button>
    </div>
  </div>
          ) : (
            universalContent
            .filter((item) => {
              const searchText =
                mockTestSearch.trim().toLowerCase();
          
              const matchesSearch =
                !searchText ||
                item.title?.toLowerCase().includes(searchText) ||
                item.subject?.toLowerCase().includes(searchText) ||
                item.chapter?.toLowerCase().includes(searchText);
          
              const matchesPlan =
                mockTestPlanFilter === "ALL" ||
                item.planType === mockTestPlanFilter;
          
              const matchesStatus =
                mockTestStatusFilter === "ALL" ||
                item.status === mockTestStatusFilter;
          
              const matchesExam =
                mockTestExamFilter === "ALL" ||
                item.examType === mockTestExamFilter;
          
              return (
                item.section === "mockTest" &&
                matchesSearch &&
                matchesPlan &&
                matchesStatus &&
                matchesExam
              );
            })
            .sort((a, b) => {
              const firstDate =
                a.createdAt?.seconds ||
                a.updatedAt?.seconds ||
                0;
          
              const secondDate =
                b.createdAt?.seconds ||
                b.updatedAt?.seconds ||
                0;
          
              return mockTestSortMode === "OLDEST"
                ? firstDate - secondDate
                : secondDate - firstDate;
            })
            .slice(
              (mockTestPage - 1) * mockTestsPerPage,
              mockTestPage * mockTestsPerPage
            )
            .map((test) => (
                <div
                  className="contentStudioItem"
                  key={test.id}
                >
                  <input
  type="checkbox"
  checked={selectedMockTestIds.includes(test.id)}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedMockTestIds([
        ...selectedMockTestIds,
        test.id,
      ]);
    } else {
      setSelectedMockTestIds(
        selectedMockTestIds.filter(
          (id) => id !== test.id
        )
      );
    }
  }}
/>
<strong>
  {test.isFeatured && "⭐ "}
  {test.title}
</strong>
                  <div className="mockTestInfoBlock">
  <div className="mockTestPrimaryMeta">
    <span>{test.planType || "FREE"}</span>
    <span>{test.subject || "No Subject"}</span>
    <span>{test.chapter || "No Chapter"}</span>
    <span>{test.testType || "Mock Test"}</span>
    <span
  className={`mockStatusBadge ${
    test.status === "published"
      ? "statusPublished"
      : test.status === "draft"
      ? "statusDraft"
      : test.status === "archived"
      ? "statusArchived"
      : "statusUnpublished"
  }`}
>
  {test.status || "draft"}
</span>
  </div>

  <div className="mockTestMetaSection">
  <h5>Overview</h5>

  <div className="mockTestMetaGrid">
    <span>
      📋 {test.totalQuestions || test.questions?.length || 0} Questions
    </span>

    <span>
      ⏱ {test.duration || test.durationMinutes || 0} min
    </span>

    <span>
      🎯 {test.totalMarks || 0} Marks
    </span>

    <span>
      ✅ Passing: {test.passingMarks || 0}
    </span>
  </div>
</div>

<div className="mockTestMetaSection">
  <h5>Performance</h5>

  {(() => {
    const testResults = mockResults.filter(
      (result) => result.testId === test.id
    );

    const attempts = testResults.length;

    const averageScore =
      attempts > 0
        ? (
            testResults.reduce(
              (sum, result) => sum + Number(result.score || 0),
              0
            ) / attempts
          ).toFixed(1)
        : "0";

    const averageAccuracy =
      attempts > 0
        ? (
            testResults.reduce(
              (sum, result) => sum + Number(result.accuracy || 0),
              0
            ) / attempts
          ).toFixed(1)
        : "0";

    return (
      <div className="mockTestMetaGrid">
        <span>👥 Attempts: {attempts}</span>
        <span>🏆 Avg Score: {averageScore}</span>
        <span>🎯 Avg Accuracy: {averageAccuracy}%</span>
      </div>
    );
  })()}
</div>
<div className="mockTestMetaSection">
  <h5>Configuration</h5>

  <div className="mockTestMetaGrid">
    <span>📊 {test.examDifficulty || "Mixed"}</span>

    <span>🌐 {test.examLanguage || "English"}</span>

    <span>📝 {test.examType || "CTET/TET"}</span>

    <span>
      🔄 Attempt: {test.attemptLimit || "unlimited"}
    </span>

    <span>
      ⚡ Result: {test.resultPublishMode || "instant"}
    </span>

    <span>
      🧭 Navigation: {test.navigationMode || "free"}
    </span>

    <span>
      🔀 Shuffle Q: {test.shuffleQuestions || "no"}
    </span>

    <span>
      🎲 Options: {test.shuffleOptions || "no"}
    </span>

    <span>
      🧮 Calculator: {test.calculatorAllowed || "no"}
    </span>

    <span>
      ⏸ Pause: {test.allowPause || "yes"}
    </span>
  </div>
</div>

<div className="mockTestMetaSection">
  <h5>Schedule</h5>

  <div className="mockTestMetaGrid">
    <span>
      🚀 Start: {test.examStartDate || "Not scheduled"}
    </span>

    <span>
      🏁 End: {test.examEndDate || "Not scheduled"}
    </span>
  </div>
</div>
</div>

<div className="mockTestMetaSection">
  <h5>Audit</h5>

  <div className="mockTestMetaGrid">
  <span>
  📅 Created:{" "}
  {test.createdAt?.toDate?.().toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ) || "-"}
</span>

<span>
  🕒 Updated:{" "}
  {test.updatedAt?.toDate?.().toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ) || "-"}
</span>
  </div>
</div>

<div className="contentStudioActions mockTestCompactActions">

  <button
    className="backButton"
    onClick={() =>
      navigate(
        `/admin/content/mock-tests/preview/${test.id}`
      )
    }
  >
    Preview
  </button>
  <div className="mockActionMenuWrap">
  <button
    className="backButton"
    onClick={(event) =>
      openMockActionPortal(event, test)
    }
  >
    Actions ▾
  </button>
</div>
</div>

                </div>
              ))
          )}
        </div>


        {
  Math.ceil(
    universalContent.filter((item) => {
      const searchText =
        mockTestSearch.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        item.title?.toLowerCase().includes(searchText) ||
        item.subject?.toLowerCase().includes(searchText) ||
        item.chapter?.toLowerCase().includes(searchText);

      const matchesPlan =
        mockTestPlanFilter === "ALL" ||
        item.planType === mockTestPlanFilter;

      const matchesStatus =
        mockTestStatusFilter === "ALL" ||
        item.status === mockTestStatusFilter;

      const matchesExam =
        mockTestExamFilter === "ALL" ||
        item.examType === mockTestExamFilter;

      return (
        item.section === "mockTest" &&
        matchesSearch &&
        matchesPlan &&
        matchesStatus &&
        matchesExam
      );
    }).length / mockTestsPerPage
  ) > 1 && (
    <div className="mockPaginationBar">
      <button
        className="backButton"
        disabled={mockTestPage === 1}
        onClick={() =>
          setMockTestPage((prev) =>
            Math.max(prev - 1, 1)
          )
        }
      >
        ← Previous
      </button>

      <span>
        Page {mockTestPage}
      </span>

      <button
        className="backButton"
        disabled={
          mockTestPage >=
          Math.ceil(
            universalContent.filter((item) => {
              const searchText =
                mockTestSearch.trim().toLowerCase();

              const matchesSearch =
                !searchText ||
                item.title?.toLowerCase().includes(searchText) ||
                item.subject?.toLowerCase().includes(searchText) ||
                item.chapter?.toLowerCase().includes(searchText);

              const matchesPlan =
                mockTestPlanFilter === "ALL" ||
                item.planType === mockTestPlanFilter;

              const matchesStatus =
                mockTestStatusFilter === "ALL" ||
                item.status === mockTestStatusFilter;

              const matchesExam =
                mockTestExamFilter === "ALL" ||
                item.examType === mockTestExamFilter;

              return (
                item.section === "mockTest" &&
                matchesSearch &&
                matchesPlan &&
                matchesStatus &&
                matchesExam
              );
            }).length / mockTestsPerPage
          )
        }
        onClick={() =>
          setMockTestPage((prev) => prev + 1)
        }
      >
        Next →
      </button>
    </div>
  )
}

        <div className="contentStudioActions">
 
        <input
  type="file"
  accept=".json"
  id="mockJsonImportInput"
  style={{ display: "none" }}
  onChange={handleImportMockTestJson}
/>
<input
  type="file"
  accept=".xlsx,.xls"
  id="mockXlsxImportInput"
  style={{ display: "none" }}
  onChange={handleImportMockTestXlsx}
/>
<button
  className="backButton"
  onClick={() =>
    document
      .getElementById("mockJsonImportInput")
      ?.click()
  }
>
  Import JSON
</button>
<button
  className="backButton"
  onClick={() =>
    document
      .getElementById("mockXlsxImportInput")
      ?.click()
  }
>
  Import XLSX
</button>

<input
  type="url"
  className="contentStudioInput"
  placeholder="Paste Google Drive XLSX URL"
  value={mockImportXlsxUrl}
  onChange={(e) =>
    setMockImportXlsxUrl(e.target.value)
  }
/>

<button
  className="publishButton"
  onClick={() => {
    alert(
      "Google Drive direct import needs backend Cloud Function.\n\nFor now: Download XLSX from Drive, then use Import XLSX."
    );
  }}
>
  Drive Import Info
</button>

<button
  className="publishButton"
  onClick={handleDownloadMockTestXlsxTemplate}
>
  Download XLSX Template
</button>

          <button
            className="publishButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/add")
            }
          >
            + Add Mock Test
          </button>

          <button
            className="backButton"
            onClick={() =>
              navigate("/admin/content/mock-tests")
            }
          >
            ← Back to Mock Tests Manager
          </button>
        </div>
      </section>
    ) : null
  }
/>


<Route
  path="/admin/content/mock-tests/question-bank"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">QUESTION BANK</span>

          <h1>Examination Question Bank</h1>

          <p>
            Search, filter, review, export, and reuse saved
            examination questions from one professional question bank.
          </p>
        </div>

        <div className="mockManageStatsGrid">
          <div className="mockManageStatCard">
            <span>Total Questions</span>
            <strong>{questionBankItems.length}</strong>
          </div>

          <div className="mockManageStatCard">
            <span>Easy</span>
            <strong>
              {
                questionBankItems.filter(
                  (q) => q.level === "Easy"
                ).length
              }
            </strong>
          </div>

          <div className="mockManageStatCard">
            <span>Medium</span>
            <strong>
              {
                questionBankItems.filter(
                  (q) => q.level === "Medium"
                ).length
              }
            </strong>
          </div>

          <div className="mockManageStatCard">
            <span>Hard</span>
            <strong>
              {
                questionBankItems.filter(
                  (q) => q.level === "Hard"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioGrid">
            <input
              type="text"
              placeholder="Search by question or tag"
              value={questionBankSearch}
              onChange={(e) =>
                setQuestionBankSearch(e.target.value)
              }
            />

<select
  value={questionBankSubjectFilter}
  onChange={(e) =>
    setQuestionBankSubjectFilter(e.target.value)
  }
>
  <option value="ALL">All Subjects</option>

  {[
    ...new Set(
      questionBankItems.map(
        (item) =>
          item.sourceSubject || item.subject
      )
    ),
  ]
    .filter(Boolean)
    .sort()
    .map((subject) => (
      <option key={subject} value={subject}>
        {subject}
      </option>
    ))}
</select>

<select
  value={questionBankChapterFilter}
  onChange={(e) =>
    setQuestionBankChapterFilter(e.target.value)
  }
>
  <option value="ALL">All Chapters</option>

  {[
    ...new Set(
      questionBankItems.map(
        (item) =>
          item.sourceChapter || item.chapter
      )
    ),
  ]
    .filter(Boolean)
    .sort()
    .map((chapter) => (
      <option key={chapter} value={chapter}>
        {chapter}
      </option>
    ))}
</select>

            <select
              value={questionBankDifficultyFilter}
              onChange={(e) =>
                setQuestionBankDifficultyFilter(e.target.value)
              }
            >
              <option value="ALL">All Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <button
  className="backButton"
  onClick={() => {
    setQuestionBankSearch("");
    setQuestionBankSubjectFilter("ALL");
    setQuestionBankChapterFilter("ALL");
    setQuestionBankDifficultyFilter("ALL");
  }}
>
  Clear Filters
</button>

<button
  className="publishButton"
  onClick={() => {
    const exportPayload = filteredQuestionBank.map(
      (question) => ({
        ...question,
        exportedAt: new Date().toISOString(),
      })
    );

    const jsonBlob = new Blob(
      [JSON.stringify(exportPayload, null, 2)],
      {
        type: "application/json",
      }
    );

    const downloadUrl =
      URL.createObjectURL(jsonBlob);

    const downloadLink =
      document.createElement("a");

    downloadLink.href = downloadUrl;

    downloadLink.download =
      "question-bank-export.json";

    document.body.appendChild(downloadLink);

    downloadLink.click();

    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);
  }}
>
  Export JSON
</button>



<button
  className="backButton"
  onClick={() => {
    setSelectedQuestionBankIds(
      filteredQuestionBank.map((question) => question.id)
    );
  }}
>
  Select All
</button>

<button
  className="backButton"
  onClick={() => {
    setSelectedQuestionBankIds([]);
  }}
>
  Clear Selected
</button>

<button
  className="dangerButton"
  onClick={async () => {
    if (selectedQuestionBankIds.length === 0) {
      alert("Please select at least one question");
      return;
    }

    const confirmDelete = window.confirm(
      `Delete ${selectedQuestionBankIds.length} selected question(s)?`
    );

    if (!confirmDelete) return;

    for (const questionId of selectedQuestionBankIds) {
      await deleteDoc(doc(db, "questionBank", questionId));
    }

    await loadQuestionBankFromFirestore();

    setSelectedQuestionBankIds([]);

    alert("Selected questions deleted ✅");
  }}
>
  Bulk Delete
</button>

<button
  className="publishButton"
  onClick={() => {
    if (selectedQuestionBankIds.length === 0) {
      alert("Please select at least one question");
      return;
    }

    const selectedQuestions = questionBankItems.filter((question) =>
      selectedQuestionBankIds.includes(question.id)
    );

    const exportPayload = selectedQuestions.map((question) => ({
      ...question,
      exportedAt: new Date().toISOString(),
    }));

    const jsonBlob = new Blob(
      [JSON.stringify(exportPayload, null, 2)],
      { type: "application/json" }
    );

    const downloadUrl = URL.createObjectURL(jsonBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "selected-question-bank-export.json";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);
  }}
>
  Bulk Export
</button>

          </div>
        </div>

        <div className="contentStudioList questionBankList">
          <h3>Saved Questions</h3>

          {questionBankItems
            .filter((question) => {
              const searchText =
                questionBankSearch.trim().toLowerCase();

              const matchesSearch =
                !searchText ||
                question.question
                  ?.toLowerCase()
                  .includes(searchText) ||
                question.tag
                  ?.toLowerCase()
                  .includes(searchText);

              const matchesSubject =
                questionBankSubjectFilter === "ALL" ||
                question.sourceSubject ===
                  questionBankSubjectFilter ||
                question.subject === questionBankSubjectFilter;

              const matchesChapter =
                questionBankChapterFilter === "ALL" ||
                question.sourceChapter ===
                  questionBankChapterFilter ||
                question.chapter === questionBankChapterFilter;

              const matchesDifficulty =
                questionBankDifficultyFilter === "ALL" ||
                question.level ===
                  questionBankDifficultyFilter;

              return (
                matchesSearch &&
                matchesSubject &&
                matchesChapter &&
                matchesDifficulty
              );
            }).length === 0 ? (
            <div className="contentStudioItem">
              <strong>No questions found.</strong>
              <p>
                Add questions from Add Examination Test first.
              </p>
            </div>
          ) : (
            questionBankItems
              .filter((question) => {
                const searchText =
                  questionBankSearch.trim().toLowerCase();

                const matchesSearch =
                  !searchText ||
                  question.question
                    ?.toLowerCase()
                    .includes(searchText) ||
                  question.tag
                    ?.toLowerCase()
                    .includes(searchText);

                const matchesSubject =
                  questionBankSubjectFilter === "ALL" ||
                  question.sourceSubject ===
                    questionBankSubjectFilter ||
                  question.subject === questionBankSubjectFilter;

                const matchesChapter =
                  questionBankChapterFilter === "ALL" ||
                  question.sourceChapter ===
                    questionBankChapterFilter ||
                  question.chapter === questionBankChapterFilter;

                const matchesDifficulty =
                  questionBankDifficultyFilter === "ALL" ||
                  question.level ===
                    questionBankDifficultyFilter;

                return (
                  matchesSearch &&
                  matchesSubject &&
                  matchesChapter &&
                  matchesDifficulty
                );
              })
              .map((question) => (
                <div
                  className="contentStudioItem questionBankCard"
                  key={question.id}
                >

<input
  type="checkbox"
  checked={selectedQuestionBankIds.includes(question.id)}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedQuestionBankIds([
        ...selectedQuestionBankIds,
        question.id,
      ]);
    } else {
      setSelectedQuestionBankIds(
        selectedQuestionBankIds.filter(
          (id) => id !== question.id
        )
      );
    }
  }}
/>

               <div className="questionBankTopRow">
  <span className="questionBankPill">
    {question.level || "Easy"}
  </span>

  <span className="questionBankPill">
    {question.questionType || "Single Correct"}
  </span>

  <span className="questionBankPill">
    {question.language || "English"}
  </span>
</div>

                  <strong>
                    {question.question || "Untitled Question"}
                  </strong>

                  <div className="questionBankMetaGrid">
  <span>📝 {question.sourceExamType || "Exam"}</span>

  <span>
    📚 {question.sourceSubject || question.subject || "Subject"}
  </span>

  <span>
    📖 {question.sourceChapter || question.chapter || "Chapter"}
  </span>

  {question.tag && (
    <span>🏷 {question.tag}</span>
  )}
</div>
                  <div className="questionOptionGrid">
  <div>A. {question.option1 || "-"}</div>
  <div>B. {question.option2 || "-"}</div>
  <div>C. {question.option3 || "-"}</div>
  <div>D. {question.option4 || "-"}</div>
</div>

                  <div className="questionBankAnswerBox">
                  <strong>
  Answer:{" "}
  {question.answer === "option1"
    ? `A. ${question.option1 || "-"}`
    : question.answer === "option2"
    ? `B. ${question.option2 || "-"}`
    : question.answer === "option3"
    ? `C. ${question.option3 || "-"}`
    : question.answer === "option4"
    ? `D. ${question.option4 || "-"}`
    : question.answer || "Not set"}
</strong>

                    <p>
                      {question.explanation ||
                        "No explanation added yet."}
                    </p>
                  </div>

                  <div className="contentStudioActions">
                    <button
                      className="backButton"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          JSON.stringify(question, null, 2)
                        )
                      }
                    >
                      Copy JSON
                    </button>

                    <button
  className="backButton"
  onClick={() => {
    setEditingQuestionBankId(question.id);

    localStorage.setItem(
      "reusedQuestionForMockTest",
      JSON.stringify({
        question: question.question || "",
        option1: question.option1 || "",
        option2: question.option2 || "",
        option3: question.option3 || "",
        option4: question.option4 || "",
        answer: question.answer || "",
        explanation: question.explanation || "",
        level: question.level || "Easy",
        questionType:
          question.questionType || "Single Correct",
        language: question.language || "English",
        tag: question.tag || "",
        positiveMarks: question.positiveMarks || "1",
        negativeMarks: question.negativeMarks || "0",
        questionStatus: "published",
        saveToQuestionBank: "yes",
        editingQuestionBankId: question.id,
      })
    );

    navigate("/admin/content/mock-tests/add");
  }}
>
  Edit Question
</button>

                    <button
  className="backButton"
  onClick={() => {
    localStorage.setItem(
      "reusedQuestionForMockTest",
      JSON.stringify({
        question: question.question || "",
        option1: question.option1 || "",
        option2: question.option2 || "",
        option3: question.option3 || "",
        option4: question.option4 || "",
        answer: question.answer || "",
        explanation: question.explanation || "",
        level: question.level || "Easy",
        questionType:
          question.questionType || "Single Correct",
        language: question.language || "English",
        tag: question.tag || "",
        positiveMarks: question.positiveMarks || "1",
        negativeMarks: question.negativeMarks || "0",
        questionStatus: "published",
        saveToQuestionBank: "no",
      })
    );


    navigate("/admin/content/mock-tests/add");
  }}
>
  Reuse Question
</button>
<button
  className="dangerButton"
  onClick={async () => {
    const confirmDelete = window.confirm(
      "Delete this question permanently from Question Bank?"
    );

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "questionBank", question.id));

    await loadQuestionBankFromFirestore();

    alert("Question deleted from Question Bank ✅");
  }}
>
  Delete Question
</button>

                  </div>
                </div>
              ))
          )}
        </div>

        <div className="contentStudioActions">
          <button
            className="publishButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/add")
            }
          >
            + Add Examination Test
          </button>

          <button
            className="backButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/manage")
            }
          >
            ← Back to Manage Tests
          </button>
        </div>
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/preview/:testId"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const testId = location.pathname.split("/").pop();

          const previewTest = universalContent.find(
            (item) =>
              item.id === testId &&
              item.section === "mockTest"
          );

          if (!previewTest) {
            return (
              <>
                <div className="sectionHeader">
                  <span className="badge">MOCK TEST PREVIEW</span>

                  <h1>Test Not Found</h1>

                  <p>
                    This mock test may have been deleted or not loaded yet.
                  </p>
                </div>

                <button
                  className="backButton"
                  onClick={() =>
                    navigate("/admin/content/mock-tests/manage")
                  }
                >
                  ← Back to Manage Mock Tests
                </button>
              </>
            );
          }

          const safeQuestions =
            previewTest.questions?.length > 0
              ? previewTest.questions.map((question) => ({
                  question: question.question || "",
                  option1: question.option1 || "",
                  option2: question.option2 || "",
                  option3: question.option3 || "",
                  option4: question.option4 || "",
                  answer: question.answer || "",
                  explanation: question.explanation || "",
                  level: question.level || "Easy",
                  questionType:
                    question.questionType || "Single Correct",
                  language: question.language || "English",
                  tag: question.tag || "",
                  positiveMarks:
                    question.positiveMarks?.toString() || "1",
                  negativeMarks:
                    question.negativeMarks?.toString() || "0",
                  questionStatus:
                    question.questionStatus || "published",
                  saveToQuestionBank:
                    question.saveToQuestionBank || "yes",
                }))
              : [
                  {
                    question: "",
                    option1: "",
                    option2: "",
                    option3: "",
                    option4: "",
                    answer: "",
                    explanation: "",
                    level: "Easy",
                    questionType: "Single Correct",
                    language: "English",
                    tag: "",
                    positiveMarks: "1",
                    negativeMarks: "0",
                    questionStatus: "published",
                    saveToQuestionBank: "yes",
                  },
                ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">MOCK TEST PREVIEW</span>

                <h1>{previewTest.title}</h1>

                <p>
                  {previewTest.planType} • {previewTest.subject} •{" "}
                  {previewTest.chapter} • {previewTest.testType} •{" "}
                  {previewTest.duration || previewTest.durationMinutes} min
                </p>
              </div>

              <div className="contentStudioList">
                {safeQuestions.map((questionItem, index) => (
                  <div className="contentStudioItem" key={index}>
                    <strong>
                      Q{index + 1}. {questionItem.question}
                    </strong>

                    <p>A. {questionItem.option1}</p>
                    <p>B. {questionItem.option2}</p>
                    <p>C. {questionItem.option3}</p>
                    <p>D. {questionItem.option4}</p>

                    <p>
                      <strong>Correct:</strong>{" "}
                      {questionItem.answer === "option1"
                        ? `A. ${questionItem.option1 || "-"}`
                        : questionItem.answer === "option2"
                        ? `B. ${questionItem.option2 || "-"}`
                        : questionItem.answer === "option3"
                        ? `C. ${questionItem.option3 || "-"}`
                        : questionItem.answer === "option4"
                        ? `D. ${questionItem.option4 || "-"}`
                        : questionItem.answer || "Not set"}
                    </p>

                    <p>
                      <strong>Explanation:</strong>{" "}
                      {questionItem.explanation ||
                        "No explanation added."}
                    </p>

                    <p>
                      {questionItem.level} • {questionItem.questionType} •{" "}
                      {questionItem.language} •{" "}
                      {questionItem.tag || "No Tag"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="contentStudioActions">
                <button
                  className="publishButton"
                  onClick={() => {
                    setEditingMockTestId(previewTest.id);

                    setMockTestForm({
                      title: previewTest.title || "",
                      planType: previewTest.planType || "FREE",
                      subject: previewTest.subject || "",
                      chapter: previewTest.chapter || "",
                      examType: previewTest.examType || "CTET",
                      testType:
                        previewTest.testType || "Chapter Test",

                      duration:
                        previewTest.duration?.toString() ||
                        previewTest.durationMinutes?.toString() ||
                        "30",

                      totalQuestions:
                        previewTest.totalQuestions?.toString() ||
                        previewTest.questions?.length?.toString() ||
                        "10",

                      marksPerQuestion:
                        previewTest.marksPerQuestion?.toString() || "1",

                      negativeMarks:
                        previewTest.negativeMarks?.toString() || "0",

                      passingMarks:
                        previewTest.passingMarks?.toString() || "0",

                      examDifficulty:
                        previewTest.examDifficulty || "Mixed",

                      examLanguage:
                        previewTest.examLanguage || "English",

                      attemptLimit:
                        previewTest.attemptLimit || "unlimited",

                      resultPublishMode:
                        previewTest.resultPublishMode || "instant",

                      shuffleQuestions:
                        previewTest.shuffleQuestions || "no",

                      shuffleOptions:
                        previewTest.shuffleOptions || "no",

                      navigationMode:
                        previewTest.navigationMode || "free",

                      allowPause:
                        previewTest.allowPause || "yes",

                      calculatorAllowed:
                        previewTest.calculatorAllowed || "no",

                      questionSource:
                        previewTest.questionSource || "manual",

                      fullscreenMode:
                        previewTest.fullscreenMode || "no",

                      tabSwitchDetection:
                        previewTest.tabSwitchDetection || "no",

                      copyPasteProtection:
                        previewTest.copyPasteProtection || "no",

                      autoSubmitOnViolation:
                        previewTest.autoSubmitOnViolation || "no",

                      leaderboardMode:
                        previewTest.leaderboardMode || "disabled",

                      timerMode:
                        previewTest.timerMode || "globalTimer",

                      perQuestionTimeValue:
                        previewTest.perQuestionTimeValue || "1",

                      perQuestionTimeUnit:
                        previewTest.perQuestionTimeUnit || "min",

                      autoSubmitOnTimeUp:
                        previewTest.autoSubmitOnTimeUp || "yes",

                      scheduleType:
                        previewTest.scheduleType || "alwaysAvailable",

                      examStartDate:
                        previewTest.examStartDate || "",

                      examStartTime:
                        previewTest.examStartTime || "",

                      examEndDate:
                        previewTest.examEndDate || "",

                      examEndTime:
                        previewTest.examEndTime || "",

                      recurringMode:
                        previewTest.recurringMode || "none",

                      weeklyTestDay:
                        previewTest.weeklyTestDay || "",

                      monthlyTestDate:
                        previewTest.monthlyTestDate || "",

                      liveEventMode:
                        previewTest.liveEventMode || "no",

                      scholarshipMode:
                        previewTest.scholarshipMode || "no",

                      examInstructions:
                        previewTest.examInstructions || "",

                      status: previewTest.status || "published",
                    });

                    setMockTestQuestionsForm(safeQuestions);

                    navigate("/admin/content/mock-tests/add");
                  }}
                >
                  Edit Test
                </button>

                <button
                  className="backButton"
                  onClick={() =>
                    navigate("/admin/content/mock-tests/manage")
                  }
                >
                  ← Back to Manage
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
  path="/admin/content/mock-tests/plan/:planType"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const activePlan =
            location.pathname.split("/").pop();

          const planMockTests = universalContent.filter(
            (item) =>
              item.section === "mockTest" &&
              (item.planType || "FREE") === activePlan
          );

          const subjectsInPlan = [
            ...new Set(
              planMockTests
                .map((test) => test.subject)
                .filter(Boolean)
            ),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  {activePlan} MOCK TESTS
                </span>

                <h1>{activePlan} Mock Test Library</h1>

                <p>
                  Manage subjects, chapters, and mock tests
                  inside the {activePlan} plan.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests")
                    }
                  >
                    ← Back to Mock Tests Manager
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Subjects in {activePlan}</h3>

                {subjectsInPlan.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No subjects found.</strong>
                    <p>
                      Add a mock test in this plan first.
                    </p>
                  </div>
                ) : (
                  <div className="contentStudioGrid">
                    {subjectsInPlan.map((subjectName) => (
                      <button
                        key={subjectName}
                        className="publishButton"
                        onClick={() =>
                          navigate(
                            `/admin/content/mock-tests/plan/${activePlan}/${encodeURIComponent(
                              subjectName
                            )}`
                          )
                        }
                      >
                        {subjectName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/plan/:planType/:subjectName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");

          const activePlan = routeParts[5];

          const activeSubject = decodeURIComponent(
            routeParts[6] || ""
          );

          const subjectMockTests =
            universalContent.filter(
              (item) =>
                item.section === "mockTest" &&
                (item.planType || "FREE") === activePlan &&
                item.subject === activeSubject
            );

          const chaptersInSubject = [
            ...new Set(
              subjectMockTests
                .map((test) => test.chapter)
                .filter(Boolean)
            ),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  {activePlan} SUBJECT MOCKS
                </span>

                <h1>{activeSubject}</h1>

                <p>
                  Manage chapters and mock tests inside
                  this subject.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate(
                        `/admin/content/mock-tests/plan/${activePlan}`
                      )
                    }
                  >
                    ← Back to {activePlan}
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Chapters in {activeSubject}</h3>

                {chaptersInSubject.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No chapters found.</strong>
                    <p>
                      Add a mock test with chapter under this
                      subject first.
                    </p>
                  </div>
                ) : (
                  <div className="contentStudioGrid">
                    {chaptersInSubject.map((chapterName) => (
                      <button
                        key={chapterName}
                        className="publishButton"
                        onClick={() =>
                          navigate(
                            `/admin/content/mock-tests/plan/${activePlan}/${encodeURIComponent(
                              activeSubject
                            )}/${encodeURIComponent(
                              chapterName
                            )}`
                          )
                        }
                      >
                        {chapterName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/plan/:planType/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");

          const activePlan = routeParts[5];

          const activeSubject = decodeURIComponent(
            routeParts[6] || ""
          );

          const activeChapter = decodeURIComponent(
            routeParts[7] || ""
          );

          const chapterMockTests =
  universalContent
    .filter(
      (item) =>
        item.section === "mockTest" &&
        (item.planType || "FREE") === activePlan &&
        item.subject === activeSubject &&
        item.chapter === activeChapter
    )
    .filter((test) => {
      const searchText =
        mockTestSearch.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        test.title?.toLowerCase().includes(searchText) ||
        test.subject?.toLowerCase().includes(searchText) ||
        test.chapter?.toLowerCase().includes(searchText);

      const matchesStatus =
        mockTestStatusFilter === "ALL" ||
        test.status === mockTestStatusFilter;

      const matchesExam =
        mockTestExamFilter === "ALL" ||
        test.examType === mockTestExamFilter;

      return matchesSearch && matchesStatus && matchesExam;
    })
    .sort((a, b) => {
      const firstDate =
        a.createdAt?.seconds ||
        a.updatedAt?.seconds ||
        0;

      const secondDate =
        b.createdAt?.seconds ||
        b.updatedAt?.seconds ||
        0;

      return mockTestSortMode === "OLDEST"
        ? firstDate - secondDate
        : secondDate - firstDate;
    });

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  {activePlan} CHAPTER MOCKS
                </span>

                <h1>{activeChapter}</h1>

                <p>
                  Review and manage mock tests inside{" "}
                  {activeSubject}.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate(
                        `/admin/content/mock-tests/plan/${activePlan}/${encodeURIComponent(
                          activeSubject
                        )}`
                      )
                    }
                  >
                    ← Back to {activeSubject}
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Mock Tests in {activeChapter}</h3>

                <div className="contentStudioGrid">

                <label className="publishButton">

Import JSON

<input
  type="file"
  accept=".json"
  style={{ display: "none" }}
  onChange={handleImportMockTestJson}
/>

</label>

<input
  type="text"
  placeholder="Search Test Title..."
  value={mockTestSearch}
  onChange={(e) =>
    setMockTestSearch(e.target.value)
  }
/>

<select
  value={mockTestStatusFilter}
  onChange={(e) =>
    setMockTestStatusFilter(e.target.value)
  }
>
  <option value="ALL">
    All Status
  </option>

  <option value="published">
    Published
  </option>

  <option value="draft">
    Draft
  </option>

  <option value="unpublished">
    Unpublished
  </option>

  <option value="archived">
    Archived
  </option>
</select>

<select
  value={mockTestExamFilter}
  onChange={(e) =>
    setMockTestExamFilter(e.target.value)
  }
>
  <option value="ALL">
    All Exams
  </option>

  <option value="CTET">
    CTET
  </option>

  <option value="TET">
    TET
  </option>

  <option value="SSC">
    SSC
  </option>

  <option value="UPSC">
    UPSC
  </option>

  <option value="NEET">
    NEET
  </option>
</select>

<select
  value={mockTestSortMode}
  onChange={(e) =>
    setMockTestSortMode(e.target.value)
  }
>
  <option value="LATEST">
    Latest First
  </option>

  <option value="OLDEST">
    Oldest First
  </option>
</select>

</div>

                {chapterMockTests.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No mock tests found.</strong>

                    <p>
                      Add a mock test under this chapter first.
                    </p>
                  </div>
                ) : (
                  chapterMockTests.map((test) => (
                    <div
                      className="contentStudioItem"
                      key={test.id}
                    >
                      <strong>{test.title}</strong>

                      <p>
                        {test.planType || "FREE"} •{" "}
                        {test.subject || "No Subject"} •{" "}
                        {test.chapter || "No Chapter"} •{" "}
                        {test.testType || "Mock Test"} •{" "}
                        {test.status || "draft"}
                      </p>

                      <p>
                        {test.questions?.length || 0} Questions •{" "}
                        {test.duration || 0} min •{" "}
                        {test.examType || "CTET/TET"}
                      </p>

                      <div className="contentStudioActions">
                        <button
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/preview/${test.id}`
                            )
                          }
                        >
                          Preview
                        </button>

                        <button
                          className="publishButton"
                          onClick={() => {
                            setEditingMockTestId(test.id);

                            setMockTestForm({
                              title: test.title || "",
                              planType:
                                test.planType || "FREE",
                              subject: test.subject || "",
                              chapter: test.chapter || "",
                              examType:
                                test.examType || "CTET",
                              testType:
                                test.testType ||
                                "Chapter Test",
                              duration:
                                test.duration?.toString() ||
                                "30",
                              totalQuestions:
                                test.totalQuestions?.toString() ||
                                "10",
                              marksPerQuestion:
                                test.marksPerQuestion?.toString() ||
                                "1",
                              negativeMarks:
                                test.negativeMarks?.toString() ||
                                "0",
                              status:
                                test.status || "published",
                            });

                            setMockTestQuestionsForm(
                              test.questions?.length
                                ? test.questions
                                : [
                                    {
                                      question: "",
                                      option1: "",
                                      option2: "",
                                      option3: "",
                                      option4: "",
                                      answer: "",
                                      explanation: "",
                                      level: "Easy",
                                      questionType:
                                        "Single Correct",
                                      language: "English",
                                      tag: "",
                                      positiveMarks: "1",
                                      negativeMarks: "0",
                                      questionStatus:
                                        "published",
                                    },
                                  ]
                            );

                            navigate(
                              "/admin/content/mock-tests/add"
                            );
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="backButton"
                          onClick={async () => {
                            const newStatus =
                              test.status === "published"
                                ? "unpublished"
                                : "published";

                            await updateDoc(
                              doc(db, "contentItems", test.id),
                              {
                                status: newStatus,
                                updatedAt: new Date(),
                              }
                            );

                            await loadContentItemsFromFirestore();

                            alert(
                              newStatus === "published"
                                ? "Mock test published successfully ✅"
                                : "Mock test unpublished successfully ✅"
                            );
                          }}
                        >
                          {test.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          className="deleteContentButton"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${test.title}" permanently?\n\nThis mock test will be removed from this chapter.\n\nThis action cannot be undone.`
                              )
                            ) {
                              handleDeleteLocalContentItem(test.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/subjects"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const mockTests = universalContent.filter(
            (item) => item.section === "mockTest"
          );

          const subjects = [
            ...new Set(
              mockTests
                .map((test) => test.subject)
                .filter(Boolean)
            ),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  MOCK TEST SUBJECTS
                </span>

                <h1>Mock Test Subject Library</h1>

                <p>
                  Browse all mock test subjects and open their
                  chapters, tests, and question collections.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests")
                    }
                  >
                    ← Back to Mock Tests Manager
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>All Mock Test Subjects</h3>

                {subjects.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No subjects found.</strong>
                    <p>
                      Add mock tests first to generate subjects.
                    </p>
                  </div>
                ) : (
                  <div className="contentStudioGrid">
                    {subjects.map((subjectName) => {
                      const subjectTests = mockTests.filter(
                        (test) =>
                          test.subject === subjectName
                      );

                      return (
                        <button
                          key={subjectName}
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/${encodeURIComponent(
                                subjectName
                              )}`
                            )
                          }
                        >
                          {subjectName}
                          <br />
                          <small>
                            {subjectTests.length} Test
                            {subjectTests.length > 1
                              ? "s"
                              : ""}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/:subjectName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");

          const activeSubject = decodeURIComponent(
            routeParts[5] || ""
          );

          const mockTests = universalContent.filter(
            (item) =>
              item.section === "mockTest" &&
              item.subject === activeSubject
          );

          const chapters = [
            ...new Set(
              mockTests
                .map((test) => test.chapter)
                .filter(Boolean)
            ),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  MOCK TEST SUBJECT
                </span>

                <h1>{activeSubject}</h1>

                <p>
                  Browse all chapters and mock tests inside
                  this subject.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/subjects")
                    }
                  >
                    ← Back to Subjects
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Chapters in {activeSubject}</h3>

                {chapters.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No chapters found.</strong>
                    <p>
                      Add mock tests under this subject first.
                    </p>
                  </div>
                ) : (
                  <div className="contentStudioGrid">
                    {chapters.map((chapterName) => {
                      const chapterTests = mockTests.filter(
                        (test) =>
                          test.chapter === chapterName
                      );

                      return (
                        <button
                          key={chapterName}
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/${encodeURIComponent(
                                activeSubject
                              )}/${encodeURIComponent(
                                chapterName
                              )}`
                            )
                          }
                        >
                          {chapterName}
                          <br />
                          <small>
                            {chapterTests.length} Test
                            {chapterTests.length > 1
                              ? "s"
                              : ""}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");

          const activeSubject = decodeURIComponent(
            routeParts[5] || ""
          );

          const activeChapter = decodeURIComponent(
            routeParts[6] || ""
          );

          const chapterTests = universalContent.filter(
            (item) =>
              item.section === "mockTest" &&
              item.subject === activeSubject &&
              item.chapter === activeChapter
          );

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  MOCK TEST CHAPTER
                </span>

                <h1>{activeChapter}</h1>

                <p>
                  {activeSubject} • Browse all tests inside
                  this chapter.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate(
                        `/admin/content/mock-tests/${encodeURIComponent(
                          activeSubject
                        )}`
                      )
                    }
                  >
                    ← Back to {activeSubject}
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Tests in {activeChapter}</h3>

                {chapterTests.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No tests found.</strong>
                    <p>
                      Add mock tests under this chapter first.
                    </p>
                  </div>
                ) : (
                  chapterTests.map((test) => (
                    <div
                      className="contentStudioItem"
                      key={test.id}
                    >
                      <strong>{test.title}</strong>

                      <p>
                        {test.planType || "FREE"} •{" "}
                        {test.subject || "No Subject"} •{" "}
                        {test.chapter || "No Chapter"} •{" "}
                        {test.testType || "Mock Test"} •{" "}
                        {test.status || "draft"}
                      </p>

                      <p>
                        {test.questions?.length || 0} Questions •{" "}
                        {test.duration || 0} min •{" "}
                        {test.examType || "CTET/TET"}
                      </p>

                      <div className="contentStudioActions">
                        <button
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/preview/${test.id}`
                            )
                          }
                        >
                          Preview
                        </button>

                        <button
                          className="publishButton"
                          onClick={() => {
                            setEditingMockTestId(test.id);

                            setMockTestForm({
                              title: test.title || "",
                              planType:
                                test.planType || "FREE",
                              subject: test.subject || "",
                              chapter: test.chapter || "",
                              examType:
                                test.examType || "CTET",
                              testType:
                                test.testType ||
                                "Chapter Test",
                              duration:
                                test.duration?.toString() ||
                                "30",
                              totalQuestions:
                                test.totalQuestions?.toString() ||
                                "10",
                              marksPerQuestion:
                                test.marksPerQuestion?.toString() ||
                                "1",
                              negativeMarks:
                                test.negativeMarks?.toString() ||
                                "0",
                              status:
                                test.status || "published",
                            });

                            setMockTestQuestionsForm(
                              test.questions?.length
                                ? test.questions
                                : [
                                    {
                                      question: "",
                                      option1: "",
                                      option2: "",
                                      option3: "",
                                      option4: "",
                                      answer: "",
                                      explanation: "",
                                      level: "Easy",
                                      questionType:
                                        "Single Correct",
                                      language: "English",
                                      tag: "",
                                      positiveMarks: "1",
                                      negativeMarks: "0",
                                      questionStatus:
                                        "published",
                                    },
                                  ]
                            );

                            navigate(
                              "/admin/content/mock-tests/add"
                            );
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="backButton"
                          onClick={async () => {
                            const newStatus =
                              test.status === "published"
                                ? "unpublished"
                                : "published";

                            await updateDoc(
                              doc(db, "contentItems", test.id),
                              {
                                status: newStatus,
                                updatedAt: new Date(),
                              }
                            );

                            await loadContentItemsFromFirestore();

                            alert(
                              newStatus === "published"
                                ? "Mock test published successfully ✅"
                                : "Mock test unpublished successfully ✅"
                            );
                          }}
                        >
                          {test.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          className="deleteContentButton"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${test.title}" permanently?\n\nThis action cannot be undone.`
                              )
                            ) {
                              handleDeleteLocalContentItem(test.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/chapters"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const mockTests = universalContent.filter(
            (item) => item.section === "mockTest"
          );

          const chapters = [
            ...new Set(
              mockTests
                .map((test) => test.chapter)
                .filter(Boolean)
            ),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  MOCK TEST CHAPTERS
                </span>

                <h1>Mock Test Chapter Library</h1>

                <p>
                  Browse all chapters and open their mock tests.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests")
                    }
                  >
                    ← Back to Mock Tests Manager
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>All Mock Test Chapters</h3>

                {chapters.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No chapters found.</strong>
                    <p>
                      Add mock tests first to generate chapters.
                    </p>
                  </div>
                ) : (
                  <div className="contentStudioGrid">
                    {chapters.map((chapterName) => {
                      const chapterTests = mockTests.filter(
                        (test) =>
                          test.chapter === chapterName
                      );

                      return (
                        <button
                          key={chapterName}
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/chapters/${encodeURIComponent(
                                chapterName
                              )}`
                            )
                          }
                        >
                          {chapterName}
                          <br />
                          <small>
                            {chapterTests.length} Test
                            {chapterTests.length > 1 ? "s" : ""}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/chapters/:chapterName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");

          const activeChapter = decodeURIComponent(
            routeParts[5] || ""
          );

          const mockTests = universalContent.filter(
            (item) =>
              item.section === "mockTest" &&
              item.chapter === activeChapter
          );

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  MOCK TEST CHAPTER
                </span>

                <h1>{activeChapter}</h1>

                <p>
                  Browse all tests inside this chapter.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/chapters")
                    }
                  >
                    ← Back to Chapters
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Tests in {activeChapter}</h3>

                {mockTests.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No tests found.</strong>

                    <p>
                      Add mock tests first.
                    </p>
                  </div>
                ) : (
                  mockTests.map((test) => (
                    <div
                      className="contentStudioItem"
                      key={test.id}
                    >
                      <strong>{test.title}</strong>

                      <p>
                        {test.planType || "FREE"} •{" "}
                        {test.subject || "No Subject"} •{" "}
                        {test.chapter || "No Chapter"} •{" "}
                        {test.testType || "Mock Test"} •{" "}
                        {test.status || "draft"}
                      </p>

                      <p>
                        {test.questions?.length || 0} Questions •{" "}
                        {test.duration || 0} min •{" "}
                        {test.examType || "CTET/TET"}
                      </p>

                      <div className="contentStudioActions">
                        <button
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/preview/${test.id}`
                            )
                          }
                        >
                          Preview
                        </button>

                        <button
                          className="publishButton"
                          onClick={() => {
                            setEditingMockTestId(test.id);

                            setMockTestForm({
                              title: test.title || "",
                              planType: test.planType || "FREE",
                              subject: test.subject || "",
                              chapter: test.chapter || "",
                              examType: test.examType || "CTET",
                              testType:
                                test.testType || "Chapter Test",
                              duration:
                                test.duration?.toString() || "30",
                              totalQuestions:
                                test.totalQuestions?.toString() ||
                                "10",
                              marksPerQuestion:
                                test.marksPerQuestion?.toString() ||
                                "1",
                              negativeMarks:
                                test.negativeMarks?.toString() ||
                                "0",
                              status:
                                test.status || "published",
                            });

                            setMockTestQuestionsForm(
                              test.questions?.length
                                ? test.questions
                                : [
                                    {
                                      question: "",
                                      option1: "",
                                      option2: "",
                                      option3: "",
                                      option4: "",
                                      answer: "",
                                      explanation: "",
                                      level: "Easy",
                                      questionType:
                                        "Single Correct",
                                      language: "English",
                                      tag: "",
                                      positiveMarks: "1",
                                      negativeMarks: "0",
                                      questionStatus:
                                        "published",
                                    },
                                  ]
                            );

                            navigate(
                              "/admin/content/mock-tests/add"
                            );
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="backButton"
                          onClick={async () => {
                            const newStatus =
                              test.status === "published"
                                ? "unpublished"
                                : "published";

                            await updateDoc(
                              doc(db, "contentItems", test.id),
                              {
                                status: newStatus,
                                updatedAt: new Date(),
                              }
                            );

                            await loadContentItemsFromFirestore();

                            alert(
                              newStatus === "published"
                                ? "Mock test published successfully ✅"
                                : "Mock test unpublished successfully ✅"
                            );
                          }}
                        >
                          {test.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          className="deleteContentButton"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${test.title}" permanently?\n\nThis action cannot be undone.`
                              )
                            ) {
                              handleDeleteLocalContentItem(test.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>



<Route
  path="/admin/content/mock-tests/question-bank/:subjectName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");
          const activeSubject = decodeURIComponent(routeParts[5] || "");

          const normalize = (value = "") =>
            value.toString().trim().toLowerCase();

          const mockTests = universalContent.filter(
            (item) => item.section === "mockTest"
          );

          const subjectTests = mockTests.filter(
            (test) =>
              normalize(test.subject) === normalize(activeSubject)
          );

          const chapters = [
            ...new Set(
              subjectTests
                .map((test) => test.chapter)
                .filter(Boolean)
            ),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">QUESTION BANK SUBJECT</span>

                <h1>{activeSubject}</h1>

                <p>
                  Browse chapters and question pools inside this subject.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/question-bank")
                    }
                  >
                    ← Back to Question Bank
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Chapters in {activeSubject}</h3>

                {chapters.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No chapters found.</strong>
                    <p>Add mock tests with questions under this subject first.</p>
                  </div>
                ) : (
                  <div className="contentStudioGrid">
                    {chapters.map((chapterName) => {
                      const questionCount = subjectTests
                        .filter(
                          (test) =>
                            normalize(test.chapter) === normalize(chapterName)
                        )
                        .reduce(
                          (total, test) =>
                            total + (test.questions?.length || 0),
                          0
                        );

                      return (
                        <button
                          key={chapterName}
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/question-bank/${encodeURIComponent(
                                activeSubject
                              )}/${encodeURIComponent(chapterName)}`
                            )
                          }
                        >
                          {chapterName}
                          <br />
                          <small>{questionCount} Questions</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/question-bank/:subjectName/:chapterName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");
          const activeSubject = decodeURIComponent(routeParts[5] || "");
          const activeChapter = decodeURIComponent(routeParts[6] || "");

          const normalize = (value = "") =>
            value.toString().trim().toLowerCase();

          const mockTests = universalContent.filter(
            (item) =>
              item.section === "mockTest" &&
              normalize(item.subject) === normalize(activeSubject) &&
              normalize(item.chapter) === normalize(activeChapter)
          );

          const questions = mockTests.flatMap((test) =>
            (test.questions || []).map((question, index) => ({
              ...question,
              testTitle: test.title,
              planType: test.planType,
              questionNumber: index + 1,
            }))
          );

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">QUESTION BANK CHAPTER</span>

                <h1>{activeChapter}</h1>

                <p>
                  {activeSubject} • {questions.length} Questions
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate(
                        `/admin/content/mock-tests/question-bank/${encodeURIComponent(
                          activeSubject
                        )}`
                      )
                    }
                  >
                    ← Back to {activeSubject}
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Questions in {activeChapter}</h3>

                {questions.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No questions found.</strong>
                    <p>Add questions under this chapter first.</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div className="contentStudioItem" key={index}>
                      <strong>
                        Q{index + 1}. {question.question}
                      </strong>

                      <p>A. {question.option1}</p>
                      <p>B. {question.option2}</p>
                      <p>C. {question.option3}</p>
                      <p>D. {question.option4}</p>

                      <p>
  <strong>Correct:</strong>{" "}
  {question.answer === "option1"
    ? `A. ${question.option1 || "-"}`
    : question.answer === "option2"
    ? `B. ${question.option2 || "-"}`
    : question.answer === "option3"
    ? `C. ${question.option3 || "-"}`
    : question.answer === "option4"
    ? `D. ${question.option4 || "-"}`
    : question.answer || "Not set"}
</p>

                      <p>
                        <strong>Explanation:</strong>{" "}
                        {question.explanation || "No explanation added."}
                      </p>

                      <p>
                        {question.planType || "FREE"} •{" "}
                        {question.level || "Easy"} •{" "}
                        {question.questionType || "Single Correct"} •{" "}
                        {question.language || "English"} •{" "}
                        {question.testTitle}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/test-series"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const mockTests = universalContent.filter(
            (item) => item.section === "mockTest"
          );

          const testTypes = [
            ...new Set(
              mockTests
                .map((test) => test.testType || "Mock Test")
                .filter(Boolean)
            ),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  TEST SERIES
                </span>

                <h1>Mock Test Series</h1>

                <p>
                  Organize AspireNest mock tests by chapter tests,
                  sectional tests, full length tests, PYQ practice,
                  and daily practice sets.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests")
                    }
                  >
                    ← Back to Mock Tests Manager
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Available Test Series</h3>

                {testTypes.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No test series found.</strong>
                    <p>
                      Add mock tests first to generate test series.
                    </p>
                  </div>
                ) : (
                  <div className="contentStudioGrid">
                    {testTypes.map((typeName) => {
                      const typeTests = mockTests.filter(
                        (test) =>
                          (test.testType || "Mock Test") ===
                          typeName
                      );

                      return (
                        <button
                          key={typeName}
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/test-series/${encodeURIComponent(
                                typeName
                              )}`
                            )
                          }
                        >
                          {typeName}
                          <br />
                          <small>
                            {typeTests.length} Test
                            {typeTests.length > 1 ? "s" : ""}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/test-series/:seriesName"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const routeParts = location.pathname.split("/");

          const activeSeries = decodeURIComponent(
            routeParts[5] || ""
          );

          const seriesTests = universalContent.filter(
            (item) =>
              item.section === "mockTest" &&
              (item.testType || "Mock Test") === activeSeries
          );

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  TEST SERIES DETAIL
                </span>

                <h1>{activeSeries}</h1>

                <p>
                  Browse all mock tests inside this test series.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/test-series")
                    }
                  >
                    ← Back to Test Series
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Tests in {activeSeries}</h3>

                {seriesTests.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No tests found.</strong>
                    <p>
                      Add mock tests under this test series first.
                    </p>
                  </div>
                ) : (
                  seriesTests.map((test) => (
                    <div
                      className="contentStudioItem"
                      key={test.id}
                    >
                      <strong>{test.title}</strong>

                      <p>
                        {test.planType || "FREE"} •{" "}
                        {test.subject || "No Subject"} •{" "}
                        {test.chapter || "No Chapter"} •{" "}
                        {test.testType || "Mock Test"} •{" "}
                        {test.status || "draft"}
                      </p>

                      <p>
                        {test.questions?.length || 0} Questions •{" "}
                        {test.duration || 0} min •{" "}
                        {test.examType || "CTET/TET"}
                      </p>

                      <div className="contentStudioActions">
                        <button
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/preview/${test.id}`
                            )
                          }
                        >
                          Preview
                        </button>

                        <button
                          className="publishButton"
                          onClick={() => {
                            setEditingMockTestId(test.id);

                            setMockTestForm({
                              title: test.title || "",
                              planType: test.planType || "FREE",
                              subject: test.subject || "",
                              chapter: test.chapter || "",
                              examType: test.examType || "CTET",
                              testType:
                                test.testType || "Chapter Test",
                              duration:
                                test.duration?.toString() || "30",
                              totalQuestions:
                                test.totalQuestions?.toString() ||
                                "10",
                              marksPerQuestion:
                                test.marksPerQuestion?.toString() ||
                                "1",
                              negativeMarks:
                                test.negativeMarks?.toString() ||
                                "0",
                              status:
                                test.status || "published",
                            });

                            setMockTestQuestionsForm(
                              test.questions?.length
                                ? test.questions
                                : [
                                    {
                                      question: "",
                                      option1: "",
                                      option2: "",
                                      option3: "",
                                      option4: "",
                                      answer: "",
                                      explanation: "",
                                      level: "Easy",
                                      questionType:
                                        "Single Correct",
                                      language: "English",
                                      tag: "",
                                      positiveMarks: "1",
                                      negativeMarks: "0",
                                      questionStatus:
                                        "published",
                                    },
                                  ]
                            );

                            navigate(
                              "/admin/content/mock-tests/add"
                            );
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="backButton"
                          onClick={async () => {
                            const newStatus =
                              test.status === "published"
                                ? "unpublished"
                                : "published";

                            await updateDoc(
                              doc(db, "contentItems", test.id),
                              {
                                status: newStatus,
                                updatedAt: new Date(),
                              }
                            );

                            await loadContentItemsFromFirestore();

                            alert(
                              newStatus === "published"
                                ? "Mock test published successfully ✅"
                                : "Mock test unpublished successfully ✅"
                            );
                          }}
                        >
                          {test.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          className="deleteContentButton"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${test.title}" permanently?\n\nThis action cannot be undone.`
                              )
                            ) {
                              handleDeleteLocalContentItem(test.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/published"
  element={
    requireAdmin() ? (
      <section className="coursePages">
        {(() => {
          const publishedMockTests = universalContent.filter(
            (item) =>
              item.section === "mockTest" &&
              item.status === "published"
          );

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">
                  PUBLISHED MOCK TESTS
                </span>

                <h1>Published Mock Tests</h1>

                <p>
                  Review all student-ready published mock tests
                  with quick preview, edit, unpublish, and delete actions.
                </p>
              </div>

              <div className="contentStudioForm">
                <div className="contentStudioActions">
                  <button
                    className="backButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests")
                    }
                  >
                    ← Back to Mock Tests Manager
                  </button>

                  <button
                    className="publishButton"
                    onClick={() =>
                      navigate("/admin/content/mock-tests/add")
                    }
                  >
                    + Add Mock Test
                  </button>
                </div>
              </div>

              <div className="contentStudioList">
                <h3>Student-Visible Tests</h3>

                {publishedMockTests.length === 0 ? (
                  <div className="contentStudioItem">
                    <strong>No published tests found.</strong>
                    <p>
                      Publish mock tests from Manage Mock Tests first.
                    </p>
                  </div>
                ) : (
                  publishedMockTests.map((test) => (
                    <div
                      className="contentStudioItem"
                      key={test.id}
                    >
                      <strong>{test.title}</strong>

                      <p>
                        {test.planType || "FREE"} •{" "}
                        {test.subject || "No Subject"} •{" "}
                        {test.chapter || "No Chapter"} •{" "}
                        {test.testType || "Mock Test"}
                      </p>

                      <p>
                        {test.questions?.length || 0} Questions •{" "}
                        {test.duration || 0} min •{" "}
                        {test.examType || "CTET/TET"}
                      </p>

                      <div className="contentStudioActions">
                        <button
                          className="publishButton"
                          onClick={() =>
                            navigate(
                              `/admin/content/mock-tests/preview/${test.id}`
                            )
                          }
                        >
                          Preview
                        </button>

                        <button
                          className="publishButton"
                          onClick={() => {
                            setEditingMockTestId(test.id);

                            setMockTestForm({
                              title: test.title || "",
                              planType: test.planType || "FREE",
                              subject: test.subject || "",
                              chapter: test.chapter || "",
                              examType: test.examType || "CTET",
                              testType:
                                test.testType || "Chapter Test",
                              duration:
                                test.duration?.toString() || "30",
                              totalQuestions:
                                test.totalQuestions?.toString() ||
                                "10",
                              marksPerQuestion:
                                test.marksPerQuestion?.toString() ||
                                "1",
                              negativeMarks:
                                test.negativeMarks?.toString() ||
                                "0",
                              status:
                                test.status || "published",
                            });

                            setMockTestQuestionsForm(
                              test.questions?.length
                                ? test.questions
                                : [
                                    {
                                      question: "",
                                      option1: "",
                                      option2: "",
                                      option3: "",
                                      option4: "",
                                      answer: "",
                                      explanation: "",
                                      level: "Easy",
                                      questionType:
                                        "Single Correct",
                                      language: "English",
                                      tag: "",
                                      positiveMarks: "1",
                                      negativeMarks: "0",
                                      questionStatus:
                                        "published",
                                    },
                                  ]
                            );

                            navigate(
                              "/admin/content/mock-tests/add"
                            );
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="backButton"
                          onClick={async () => {
                            await updateDoc(
                              doc(db, "contentItems", test.id),
                              {
                                status: "unpublished",
                                updatedAt: new Date(),
                              }
                            );

                            await loadContentItemsFromFirestore();

                            alert(
                              "Mock test unpublished successfully ✅"
                            );
                          }}
                        >
                          Unpublish
                        </button>

                        <button
                          className="deleteContentButton"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${test.title}" permanently?\n\nStudents may lose access to this published test.\n\nThis action cannot be undone.`
                              )
                            ) {
                              handleDeleteLocalContentItem(test.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/results"
  element={
    requireAdmin() ? (
      <section className="coursePages resultsAnalyticsPage">
        {(() => {
          const mockTests = universalContent.filter(
            (item) => item.section === "mockTest"
          );

          const attemptResults = mockResults || [];
          const totalAttempts = attemptResults.length;

          const averageScore =
            totalAttempts > 0
              ? Math.round(
                  attemptResults.reduce(
                    (sum, result) => sum + Number(result.score || 0),
                    0
                  ) / totalAttempts
                )
              : 0;

          const averageAccuracy =
            totalAttempts > 0
              ? Math.round(
                  attemptResults.reduce(
                    (sum, result) => sum + Number(result.accuracy || 0),
                    0
                  ) / totalAttempts
                )
              : 0;

          const weakChapters = [
            ...new Map(
              attemptResults
                .filter((result) => result.chapter)
                .map((result) => {
                  const chapterResults = attemptResults.filter(
                    (item) => item.chapter === result.chapter
                  );

                  return [
                    result.chapter,
                    {
                      chapter: result.chapter,
                      subject: result.subject || "Unknown Subject",
                      attempts: chapterResults.length,
                      averageAccuracy: Math.round(
                        chapterResults.reduce(
                          (sum, item) => sum + Number(item.accuracy || 0),
                          0
                        ) / chapterResults.length
                      ),
                    },
                  ];
                })
            ).values(),
          ].sort(
            (a, b) =>
              Number(a.averageAccuracy || 0) -
              Number(b.averageAccuracy || 0)
          );

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">RESULTS ANALYTICS</span>
                <h1>Mock Test Results Analytics</h1>
                <p>
                  Stripe-style performance dashboard for attempts,
                  accuracy, tests, students, and weak chapters.
                </p>
              </div>

              <div className="resultsTopBar">
                <button
                  className="backButton"
                  onClick={() => navigate("/admin/content/mock-tests")}
                >
                  ← Back
                </button>

                <button
                  className="publishButton"
                  onClick={() =>
                    navigate("/admin/content/mock-tests/published")
                  }
                >
                  Published Tests
                </button>

                <button
                  className="backButton"
                  onClick={async () => {
                    await loadLeaderboard();

                    if (user?.email) {
                      await loadUserMockResults(user.email);
                    }
                  }}
                >
                  Refresh
                </button>
              </div>

              <div className="resultsKpiGrid">
                <div className="resultsKpiCard">
                  <span>Total Tests</span>
                  <strong>{mockTests.length}</strong>
                  <small>Created exams</small>
                </div>

                <div className="resultsKpiCard">
                  <span>Total Attempts</span>
                  <strong>{totalAttempts}</strong>
                  <small>Saved results</small>
                </div>

                <div className="resultsKpiCard">
                  <span>Average Score</span>
                  <strong>{averageScore}</strong>
                  <small>Across attempts</small>
                </div>

                <div className="resultsKpiCard">
                  <span>Average Accuracy</span>
                  <strong>{averageAccuracy}%</strong>
                  <small>Student accuracy</small>
                </div>
              </div>

              <div className="resultsSection">
                <div className="resultsSectionHeader">
                  <h3>Test-wise Performance</h3>
                  <span>{mockTests.length} tests</span>
                </div>

                <div className="resultsCompactGrid">
                  {mockTests.map((test) => {
                    const testResults = attemptResults.filter(
                      (result) => result.testId === test.id
                    );

                    const testAvgScore =
                      testResults.length > 0
                        ? Math.round(
                            testResults.reduce(
                              (sum, result) =>
                                sum + Number(result.score || 0),
                              0
                            ) / testResults.length
                          )
                        : 0;

                    const testAvgAccuracy =
                      testResults.length > 0
                        ? Math.round(
                            testResults.reduce(
                              (sum, result) =>
                                sum + Number(result.accuracy || 0),
                              0
                            ) / testResults.length
                          )
                        : 0;

                    return (
                      <div className="resultsMetricCard" key={test.id}>
                        <strong>{test.title}</strong>
                        <p>
                          {test.planType || "FREE"} •{" "}
                          {test.subject || "Subject"} •{" "}
                          {test.chapter || "Chapter"}
                        </p>

                        <div className="resultsMiniStats">
                          <span>Attempts {testResults.length}</span>
                          <span>Score {testAvgScore}</span>
                          <span>Accuracy {testAvgAccuracy}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="resultsSection">
                <div className="resultsSectionHeader">
                  <h3>Student-wise Results</h3>
                  <span>{attemptResults.length} attempts</span>
                </div>

                {attemptResults.length === 0 ? (
                  <div className="resultsEmptyCard">
                    No student results yet.
                  </div>
                ) : (
                  <div className="resultsCompactGrid">
                    {attemptResults.map((result, index) => (
                      <div
                        className="resultsStudentCard"
                        key={result.id || index}
                      >
                        <div>
                          <strong>
                            {result.studentName ||
                              result.studentEmail ||
                              result.email ||
                              "Student"}
                          </strong>

                          <p>{result.testTitle || "Mock Test"}</p>
                        </div>

                        <div className="resultsScoreBadge">
                          {result.percentage || 0}%
                        </div>

                        <div className="resultsMiniStats">
                          <span>
                            Score {result.score || 0}/
                            {result.totalMarks || 0}
                          </span>
                          <span>Correct {result.correctCount || 0}</span>
                          <span>Wrong {result.wrongCount || 0}</span>
                          <span>Skipped {result.skippedCount || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="resultsSection">
                <div className="resultsSectionHeader">
                  <h3>Weak Chapters Analytics</h3>
                  <span>{weakChapters.length} chapters</span>
                </div>

                {weakChapters.length === 0 ? (
                  <div className="resultsEmptyCard">
                    No weak chapter data yet.
                  </div>
                ) : (
                  <div className="resultsCompactGrid">
                    {weakChapters.map((chapterItem) => (
                      <div
                        className="resultsWeakCard"
                        key={chapterItem.chapter}
                      >
                        <strong>{chapterItem.chapter}</strong>
                        <p>{chapterItem.subject}</p>

                        <div className="resultsMiniStats">
                          <span>Attempts {chapterItem.attempts}</span>
                          <span>
                            Avg Accuracy {chapterItem.averageAccuracy || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
    ) : null
  }
/>

<Route
  path="/admin/content/mock-tests/leaderboard"
  element={
    requireAdmin() ? (
      <section className="coursePages leaderboardPage">
        {(() => {
          const leaderboardEntries = mockLeaderboardEntries || [];

          const rankedEntries = [...leaderboardEntries].sort(
            (a, b) =>
              Number(b.percentage || 0) -
                Number(a.percentage || 0) ||
              Number(b.score || 0) - Number(a.score || 0)
          );

          const totalRankedStudents = new Set(
            rankedEntries.map(
              (entry) =>
                entry.studentEmail ||
                entry.email ||
                entry.studentName
            )
          ).size;

          const highestScore =
            rankedEntries.length > 0
              ? Math.max(
                  ...rankedEntries.map((entry) =>
                    Number(entry.score || 0)
                  )
                )
              : 0;

          const averageAccuracy =
            rankedEntries.length > 0
              ? Math.round(
                  rankedEntries.reduce(
                    (sum, entry) =>
                      sum + Number(entry.accuracy || 0),
                    0
                  ) / rankedEntries.length
                )
              : 0;

          const topPerformer = rankedEntries[0];

          const subjectLeaders = [
            ...new Map(
              rankedEntries
                .filter((entry) => entry.subject)
                .map((entry) => [entry.subject, entry])
            ).values(),
          ];

          return (
            <>
              <div className="sectionHeader">
                <span className="badge">LEADERBOARD</span>

                <h1>Mock Test Leaderboard</h1>

                <p>
                  Stripe-style ranking dashboard for top performers,
                  accuracy leaders, subject champions, and recent
                  leaderboard entries.
                </p>
              </div>

              <div className="leaderboardTopBar">
                <button
                  className="backButton"
                  onClick={() =>
                    navigate("/admin/content/mock-tests")
                  }
                >
                  ← Back
                </button>

                <button
                  className="publishButton"
                  onClick={loadMockLeaderboardEntries}
                >
                  Refresh Leaderboard
                </button>

                <button
                  className="backButton"
                  onClick={() =>
                    navigate("/admin/content/mock-tests/results")
                  }
                >
                  View Results
                </button>
              </div>

              <div className="leaderboardKpiGrid">
                <div className="leaderboardKpiCard">
                  <span>Ranked Students</span>
                  <strong>{totalRankedStudents}</strong>
                  <small>Unique students</small>
                </div>

                <div className="leaderboardKpiCard">
                  <span>Total Entries</span>
                  <strong>{rankedEntries.length}</strong>
                  <small>Leaderboard saves</small>
                </div>

                <div className="leaderboardKpiCard">
                  <span>Highest Score</span>
                  <strong>{highestScore}</strong>
                  <small>Best score</small>
                </div>

                <div className="leaderboardKpiCard">
                  <span>Avg Accuracy</span>
                  <strong>{averageAccuracy}%</strong>
                  <small>Across ranked entries</small>
                </div>
              </div>

              <div className="leaderboardPodium">
                <div className="leaderboardSectionHeader">
                  <h3>Top 3 Podium</h3>
                  <span>Champions</span>
                </div>

                {rankedEntries.length === 0 ? (
                  <div className="leaderboardEmptyCard">
                    No leaderboard entries yet.
                  </div>
                ) : (
                  <div className="leaderboardPodiumGrid">
                    {rankedEntries.slice(0, 3).map((entry, index) => (
                      <div
                        className={`leaderboardPodiumCard rank${
                          index + 1
                        }`}
                        key={entry.id || index}
                      >
                        <div className="leaderboardRankBadge">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : "🥉"}
                        </div>

                        <strong>
                          {entry.studentName ||
                            entry.studentEmail ||
                            entry.email ||
                            "Student"}
                        </strong>

                        <p>{entry.testTitle || "Mock Test"}</p>

                        <div className="leaderboardMiniStats">
                          <span>
                            Score {entry.score || 0}/
                            {entry.totalMarks || 0}
                          </span>
                          <span>{entry.percentage || 0}%</span>
                          <span>Accuracy {entry.accuracy || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="leaderboardSection">
                <div className="leaderboardSectionHeader">
                  <h3>Global Rankings</h3>
                  <span>{rankedEntries.length} entries</span>
                </div>

                {rankedEntries.length === 0 ? (
                  <div className="leaderboardEmptyCard">
                    Leaderboard will appear after students save
                    results for tests where leaderboard mode is
                    enabled.
                  </div>
                ) : (
                  <div className="leaderboardTable">
                    {rankedEntries.map((entry, index) => (
                      <div
                        className="leaderboardRow"
                        key={entry.id || index}
                      >
                        <div className="leaderboardRank">
                          #{index + 1}
                        </div>

                        <div className="leaderboardStudent">
                          <strong>
                            {entry.studentName ||
                              entry.studentEmail ||
                              entry.email ||
                              "Student"}
                          </strong>

                          <span>
                            {entry.testTitle || "Mock Test"} •{" "}
                            {entry.subject || "Subject"} •{" "}
                            {entry.chapter || "Chapter"}
                          </span>
                        </div>

                        <div className="leaderboardScore">
                          <strong>
                            {entry.score || 0}/{entry.totalMarks || 0}
                          </strong>
                          <span>Score</span>
                        </div>

                        <div className="leaderboardScore">
                          <strong>{entry.percentage || 0}%</strong>
                          <span>Percentage</span>
                        </div>

                        <div className="leaderboardScore">
                          <strong>{entry.accuracy || 0}%</strong>
                          <span>Accuracy</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="leaderboardSection">
                <div className="leaderboardSectionHeader">
                  <h3>Subject-wise Leaders</h3>
                  <span>{subjectLeaders.length} subjects</span>
                </div>

                {subjectLeaders.length === 0 ? (
                  <div className="leaderboardEmptyCard">
                    Subject leaders will appear after leaderboard
                    entries are available.
                  </div>
                ) : (
                  <div className="leaderboardCompactGrid">
                    {subjectLeaders.map((entry, index) => (
                      <div
                        className="leaderboardSubjectCard"
                        key={`${entry.subject}-${index}`}
                      >
                        <strong>{entry.subject}</strong>

                        <p>
                          {entry.studentName ||
                            entry.studentEmail ||
                            entry.email ||
                            "Student"}
                        </p>

                        <div className="leaderboardMiniStats">
                          <span>{entry.percentage || 0}%</span>
                          <span>Score {entry.score || 0}</span>
                          <span>Accuracy {entry.accuracy || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="leaderboardSection">
                <div className="leaderboardSectionHeader">
                  <h3>Recent Winners</h3>
                  <span>Latest ranked entries</span>
                </div>

                {rankedEntries.length === 0 ? (
                  <div className="leaderboardEmptyCard">
                    No recent winners yet.
                  </div>
                ) : (
                  <div className="leaderboardCompactGrid">
                    {rankedEntries.slice(0, 6).map((entry, index) => (
                      <div
                        className="leaderboardRecentCard"
                        key={entry.id || index}
                      >
                        <strong>
                          {entry.studentName ||
                            entry.studentEmail ||
                            entry.email ||
                            "Student"}
                        </strong>

                        <p>{entry.testTitle || "Mock Test"}</p>

                        <div className="leaderboardMiniStats">
                          <span>{entry.percentage || 0}%</span>
                          <span>{entry.accuracy || 0}% accuracy</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>
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
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">
          CTET / TET Videos
        </span>

        <h2>Recorded Video Library</h2>

        <p>
          Access recorded lectures organized
          by plan, subject, and chapter.
        </p>
      </div>

      <div className="notesNetflixLibrary">
        {["FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map((planName) => {
          const videoSubjects = [
            ...new Map(
              universalStudentVideos
                .filter(
                  (video) =>
                    video.planType === planName &&
                    video.subject
                )
                .map((video) => [
                  video.subject.trim().toLowerCase(),
                  {
                    id: video.subject.trim(),
                    title: video.subject.trim(),
                    cover: "🎬",
                    description: "CMS uploaded videos",
                  },
                ])
            ).values(),
          ];

          return (
            <div className="notesShelf" key={planName}>
              <div className="notesShelfHeader">
                <h2>
                  {planName === "FREE" && "🎬 FREE VIDEOS"}
                  {planName === "BASIC" && "🔷 BASIC VIDEOS"}
                  {planName === "PREMIUM" && "⭐ PREMIUM VIDEO LIBRARY"}
                  {planName === "MENTORSHIP" && "👩‍🏫 MENTORSHIP VIDEO VAULT"}
                </h2>

                <span>{videoSubjects.length} Subjects</span>
              </div>

              <div className="notesShelfScrollWrap">
                {notesScrollState[`videos-row-${planName}`]?.canScroll &&
                  !notesScrollState[`videos-row-${planName}`]?.atStart && (
                    <button
                      type="button"
                      className="notesShelfArrow notesShelfArrowLeft"
                      onClick={() =>
                        scrollShelf(`videos-row-${planName}`, "left")
                      }
                    >
                      ‹
                    </button>
                  )}

                <div
                  className="notesSubjectRow"
                  id={`videos-row-${planName}`}
                  onScroll={() =>
                    updateNotesScrollState(`videos-row-${planName}`)
                  }
                  onMouseEnter={() =>
                    updateNotesScrollState(`videos-row-${planName}`)
                  }
                >
                  {videoSubjects.length === 0 ? (
                    <button
                      type="button"
                      className="notesSubjectCard"
                      disabled
                    >
                      <div className="notesSubjectIcon">🎬</div>
                      <h3>No videos yet</h3>
                      <p>Videos will appear here after publishing.</p>
                      <span className="notesSubjectTag">{planName}</span>
                    </button>
                  ) : (
                    videoSubjects.map((subject) => (
                      <button
                        type="button"
                        className="notesSubjectCard"
                        key={subject.id}
                        onClick={() =>
                          navigate(
                            `/ctet-tet/videos/plan/${planName}/${encodeURIComponent(
                              subject.id
                            )}`
                          )
                        }
                      >
                        <div className="notesSubjectIcon">
                          {subject.cover}
                        </div>

                        <h3>{subject.title}</h3>

                        <p>{subject.description}</p>

                        <span className="notesSubjectTag">
                          {planName}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {notesScrollState[`videos-row-${planName}`]?.canScroll &&
                  !notesScrollState[`videos-row-${planName}`]?.atEnd && (
                    <button
                      type="button"
                      className="notesShelfArrow notesShelfArrowRight"
                      onClick={() =>
                        scrollShelf(`videos-row-${planName}`, "right")
                      }
                    >
                      ›
                    </button>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/videos/plan/:plan"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">{activeVideoPlan} VIDEOS</span>

        <h2>{activeVideoPlan} Video Subject Library</h2>

        <p>Choose a subject to open chapters and recorded lectures.</p>
      </div>

      <div className="notesShelfScrollWrap">
        <div className="notesSubjectRow">
          {[
            ...new Map(
              universalStudentVideos
                .filter(
                  (video) =>
                    video.planType === activeVideoPlan &&
                    video.subject
                )
                .map((video) => [
                  video.subject.trim().toLowerCase(),
                  video.subject,
                ])
            ).values(),
          ].map((subjectName) => (
            <button
              type="button"
              className="notesSubjectCard"
              key={subjectName}
              onClick={() =>
                navigate(
                  `/ctet-tet/videos/plan/${activeVideoPlan}/${encodeURIComponent(
                    subjectName
                  )}`
                )
              }
            >
              <div className="notesSubjectIcon">🎬</div>
              <h3>{subjectName}</h3>
              <p>Open video chapters</p>
              <span className="notesSubjectTag">{activeVideoPlan}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/videos/plan/:plan/:subjectId"
  element={
    <section className="notesSubjectRoutePage">
      <button onClick={() => navigate("/ctet-tet/videos")}>
        ← Back to Videos Library
      </button>

      <span className="notesSubjectRouteBadge">
        {activeVideoPlan} VIDEO LIBRARY
      </span>

      <h1>
        🎬{" "}
        {decodeURIComponent(activeVideoSubjectId || "")
          .replace(/-/g, " ")}
      </h1>

      <p>Subject-wise video chapters will appear here.</p>

      <div className="chapterLibraryStack">
        {[
          ...new Set(
            universalStudentVideos
              .filter(
                (video) =>
                  video.planType === activeVideoPlan &&
                  video.subject?.trim().toLowerCase() ===
                    decodeURIComponent(activeVideoSubjectId)
                      .trim()
                      .toLowerCase() &&
                  video.chapter
              )
              .map((video) => video.chapter)
          ),
        ].map((chapterName) => (
          <button
            type="button"
            className="notesSubjectCard chapterLibraryCard"
            key={chapterName}
            onClick={() =>
              navigate(
                `/ctet-tet/videos/plan/${activeVideoPlan}/${activeVideoSubjectId}/${encodeURIComponent(
                  chapterName
                )}`
              )
            }
          >
            <div className="notesSubjectIcon">🎥</div>
            <h3>{chapterName}</h3>
            <p>Open chapter videos</p>
            <span className="notesSubjectTag">{activeVideoPlan}</span>
          </button>
        ))}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/videos/plan/:plan/:subjectId/:chapterId"
  element={
    <section className="notesSubjectRoutePage">
      <button
        onClick={() =>
          navigate(
            `/ctet-tet/videos/plan/${activeVideoPlan}/${activeVideoSubjectId}`
          )
        }
      >
        ← Back to Chapters
      </button>

      <span className="notesSubjectRouteBadge">
        {activeVideoPlan} VIDEO CHAPTER
      </span>

      <h1>
        {decodeURIComponent(activeVideoChapterId || "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())}
      </h1>

      <p>Chapter-wise recorded lectures. Open and watch your video lessons.</p>

      <div className="pdfShelfRow">
        {universalStudentVideos
          .filter(
            (video) =>
              video.planType === activeVideoPlan &&
              video.subject?.trim().toLowerCase() ===
                decodeURIComponent(activeVideoSubjectId)
                  .trim()
                  .toLowerCase() &&
              video.chapter?.trim().toLowerCase() ===
                decodeURIComponent(activeVideoChapterId)
                  .trim()
                  .toLowerCase()
          )
          .map((video) => (
            <div className="pdfMiniCard" key={video.id}>
              <div className="pdfIcon">▶️</div>

              <h3>{video.title}</h3>

              <p>{video.chapter || "Recorded Lecture"}</p>

              <span>{video.planType}</span>

              <button
                className="btnLink"
                onClick={() => {
                  if (
                    video.planType !== "FREE" &&
                    !hasPlanAccess(video.planType)
                  ) {
                    navigate("/ctet-tet/pricing");
                    return;
                  }

                  navigate(`/ctet-tet/videos/watch/${video.id}`);
                }}
              >
                Watch Video
              </button>
            </div>
          ))}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/videos/watch/:videoId"
  element={
    <section className="notesSubjectRoutePage">
      {universalStudentVideos
        .filter((video) => video.id === activeWatchVideoId)
        .map((video) => {
          const rawVideoUrl = video.videoUrl || video.fileUrl || "";

          const getYouTubeId = (url = "") => {
            if (!url) return "";

            try {
              const parsedUrl = new URL(url);

              if (parsedUrl.hostname.includes("youtu.be")) {
                return parsedUrl.pathname.split("/")[1] || "";
              }

              if (parsedUrl.pathname.includes("/embed/")) {
                return (
                  parsedUrl.pathname
                    .split("/embed/")[1]
                    ?.split("/")[0] || ""
                );
              }

              if (parsedUrl.pathname.includes("/shorts/")) {
                return (
                  parsedUrl.pathname
                    .split("/shorts/")[1]
                    ?.split("/")[0] || ""
                );
              }

              return parsedUrl.searchParams.get("v") || "";
            } catch {
              return "";
            }
          };

          const normalizeValue = (value = "") =>
            value
              .toString()
              .toLowerCase()
              .trim()
              .replace(/-/g, " ")
              .replace(/\s+/g, " ");

          const youtubeId = getYouTubeId(rawVideoUrl);

          const sameSubjectVideos = universalStudentVideos.filter(
            (item) =>
              item.id !== video.id &&
              normalizeValue(item.subject) ===
                normalizeValue(video.subject)
          );

          const sameChapterVideos = sameSubjectVideos.filter(
            (item) =>
              normalizeValue(item.chapter) ===
              normalizeValue(video.chapter)
          );

          const continueLearningVideos = sameSubjectVideos.filter(
            (item) =>
              normalizeValue(item.chapter) !==
              normalizeValue(video.chapter)
          );

          const relatedNotes = universalNotes.filter(
            (note) =>
              normalizeValue(note.subject || note.category) ===
                normalizeValue(video.subject) &&
              normalizeValue(note.chapter || "General Notes") ===
                normalizeValue(video.chapter)
          );

          const currentSubjectVideos = universalStudentVideos.filter(
            (item) =>
              normalizeValue(item.subject) ===
              normalizeValue(video.subject)
          );

          const currentVideoIndex = currentSubjectVideos.findIndex(
            (item) => item.id === video.id
          );

          const nextLecture =
            currentVideoIndex >= 0 &&
            currentVideoIndex < currentSubjectVideos.length - 1
              ? currentSubjectVideos[currentVideoIndex + 1]
              : null;

          return (
            <div key={video.id}>
              <button onClick={() => navigate(-1)}>
                ← Back
              </button>

              <span className="notesSubjectRouteBadge">
                VIDEO CLASSROOM
              </span>

              <h1>{video.title}</h1>

              <p>
                {video.planType} · {video.subject} · {video.chapter}
              </p>

              {youtubeId ? (
                <div className="videoPlayerBox">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <button
                  className="btnLink"
                  onClick={() =>
                    window.open(rawVideoUrl, "_blank")
                  }
                >
                  ▶ Open Video
                </button>
              )}

              <div className="pdfShelfRow">
                <div className="pdfMiniCard">
                  <div className="pdfIcon">🎬</div>

                  <h3>{video.title}</h3>

                  <p>
                    Mentor:{" "}
                    {video.mentorName || "AspireNest Mentor"}
                  </p>

                  <p>
                    Duration:{" "}
                    {video.duration || "Not specified"}
                  </p>

                  <span>
                    {video.planType} ·{" "}
                    {video.sourceType || "YouTube"}
                  </span>
                </div>

                {nextLecture && (
                  <div className="pdfMiniCard">
                    <div className="pdfIcon">⏭️</div>

                    <h3>Next Lecture</h3>

                    <p>{nextLecture.title}</p>

                    <span>
                      {nextLecture.duration || "Continue"}
                    </span>

                    <button
                      className="btnLink"
                      onClick={() => {
                        if (
                          nextLecture.planType !== "FREE" &&
                          !hasPlanAccess(nextLecture.planType)
                        ) {
                          navigate("/ctet-tet/pricing");
                          return;
                        }

                        navigate(
                          `/ctet-tet/videos/watch/${nextLecture.id}`
                        );
                      }}
                    >
                      Continue →
                    </button>
                  </div>
                )}
              </div>

              <div className="notesShelf">
                <div className="notesShelfHeader">
                  <h2>📄 Related Notes</h2>
                  <span>{relatedNotes.length} Notes</span>
                </div>

                <div className="pdfShelfRow">
                  {relatedNotes.length === 0 ? (
                    <div className="pdfMiniCard">
                      <div className="pdfIcon">📄</div>

                      <h3>No related notes yet</h3>

                      <p>
                        Matching notes from this chapter will appear
                        here.
                      </p>

                      <span>{video.chapter}</span>
                    </div>
                  ) : (
                    relatedNotes.map((note) => (
                      <div className="pdfMiniCard" key={note.id}>
                        <div className="pdfIcon">📄</div>

                        <h3>{note.title}</h3>

                        <p>
                          {note.subject || note.category} ·{" "}
                          {note.chapter || "General Notes"}
                        </p>

                        <span>{note.planType}</span>

                        <button
                          className="btnLink"
                          onClick={() =>
                            handleNoteAccess({
                              ...note,
                              pdf:
                                note.fileUrl ||
                                note.pdfUrl ||
                                note.pdf,
                            })
                          }
                        >
                          Open Note
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="notesShelf">
                <div className="notesShelfHeader">
                  <h2>🎬 Related Videos</h2>
                  <span>{sameChapterVideos.length} Videos</span>
                </div>

                <div className="pdfShelfRow">
                  {sameChapterVideos.length === 0 ? (
                    <div className="pdfMiniCard">
                      <div className="pdfIcon">▶️</div>

                      <h3>No related videos yet</h3>

                      <p>
                        More videos from this chapter will appear
                        here.
                      </p>

                      <span>{video.chapter}</span>
                    </div>
                  ) : (
                    sameChapterVideos.map((relatedVideo) => (
                      <div className="pdfMiniCard" key={relatedVideo.id}>
                        <div className="pdfIcon">▶️</div>

                        <h3>{relatedVideo.title}</h3>

                        <p>
                          {relatedVideo.subject} ·{" "}
                          {relatedVideo.chapter}
                        </p>

                        <span>
                          {relatedVideo.duration || "No duration"}
                        </span>

                        <button
                          className="btnLink"
                          onClick={() => {
                            if (
                              relatedVideo.planType !== "FREE" &&
                              !hasPlanAccess(relatedVideo.planType)
                            ) {
                              navigate("/ctet-tet/pricing");
                              return;
                            }

                            navigate(
                              `/ctet-tet/videos/watch/${relatedVideo.id}`
                            );
                          }}
                        >
                          Watch
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="notesShelf">
                <div className="notesShelfHeader">
                  <h2>▶ Continue Learning</h2>
                  <span>{continueLearningVideos.length} Videos</span>
                </div>

                <div className="pdfShelfRow">
                  {continueLearningVideos.length === 0 ? (
                    <div className="pdfMiniCard">
                      <div className="pdfIcon">🎓</div>

                      <h3>No more lessons yet</h3>

                      <p>
                        More lessons from this subject will appear
                        here.
                      </p>

                      <span>{video.subject}</span>
                    </div>
                  ) : (
                    continueLearningVideos.map((nextVideo) => (
                      <div className="pdfMiniCard" key={nextVideo.id}>
                        <div className="pdfIcon">🎓</div>

                        <h3>{nextVideo.title}</h3>

                        <p>
                          {nextVideo.subject} · {nextVideo.chapter}
                        </p>

                        <span>
                          {nextVideo.duration || "No duration"}
                        </span>

                        <button
                          className="btnLink"
                          onClick={() => {
                            if (
                              nextVideo.planType !== "FREE" &&
                              !hasPlanAccess(nextVideo.planType)
                            ) {
                              navigate("/ctet-tet/pricing");
                              return;
                            }

                            navigate(
                              `/ctet-tet/videos/watch/${nextVideo.id}`
                            );
                          }}
                        >
                          Continue →
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </section>
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
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Mock Tests</span>

        <h2>Practice & Performance Center</h2>

        <p>
          Attempt plan-wise, subject-wise, and chapter-wise mock tests
          with score tracking and analytics.
        </p>
      </div>

      <div className="notesNetflixLibrary">
        {["FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map((planName) => {
          const mockSubjects = [
            ...new Map(
              universalContent
                .filter(
                  (test) =>
                    test.section === "mockTest" &&
                    test.status === "published" &&
                    test.planType === planName &&
                    test.subject
                )
                .map((test) => [
                  test.subject.trim().toLowerCase(),
                  {
                    id: test.subject.trim(),
                    title: test.subject.trim(),
                    cover: "📝",
                    description: "Chapter-wise mock tests",
                  },
                ])
            ).values(),
          ];

          return (
            <div className="notesShelf" key={planName}>
              <div className="notesShelfHeader">
                <h2>
                  {planName === "FREE" && "📝 FREE MOCK TESTS"}
                  {planName === "BASIC" && "🔷 BASIC MOCK TESTS"}
                  {planName === "PREMIUM" && "⭐ PREMIUM TEST LIBRARY"}
                  {planName === "MENTORSHIP" && "👩‍🏫 MENTORSHIP TEST VAULT"}
                </h2>

                <span>{mockSubjects.length} Subjects</span>
              </div>

              <div className="notesShelfScrollWrap">
                <div className="notesSubjectRow">
                  {mockSubjects.length === 0 ? (
                    <button
                      type="button"
                      className="notesSubjectCard"
                      disabled
                    >
                      <div className="notesSubjectIcon">📝</div>
                      <h3>No mock tests yet</h3>
                      <p>Published mock tests will appear here.</p>
                      <span className="notesSubjectTag">{planName}</span>
                    </button>
                  ) : (
                    mockSubjects.map((subject) => (
                      <button
                        type="button"
                        className="notesSubjectCard"
                        key={subject.id}
                        onClick={() =>
                          navigate(
                            `/ctet-tet/mock-tests/plan/${planName}/${encodeURIComponent(
                              subject.id
                            )}`
                          )
                        }
                      >
                        <div className="notesSubjectIcon">
                          {subject.cover}
                        </div>

                        <h3>{subject.title}</h3>

                        <p>{subject.description}</p>

                        <span className="notesSubjectTag">
                          {planName}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/mock-tests/plan/:plan"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">{activeMockPlan} MOCK TESTS</span>

        <h2>{activeMockPlan} Subject Library</h2>

        <p>Choose a subject to open chapters and available tests.</p>
      </div>

      <div className="notesShelfScrollWrap">
        <div className="notesSubjectRow">
          {[
            ...new Map(
              universalContent
                .filter(
                  (test) =>
                    test.section === "mockTest" &&
                    test.status === "published" &&
                    test.planType === activeMockPlan &&
                    test.subject
                )
                .map((test) => [
                  test.subject.trim().toLowerCase(),
                  test.subject.trim(),
                ])
            ).values(),
          ].map((subjectName) => (
            <button
              type="button"
              className="notesSubjectCard"
              key={subjectName}
              onClick={() =>
                navigate(
                  `/ctet-tet/mock-tests/plan/${activeMockPlan}/${encodeURIComponent(
                    subjectName
                  )}`
                )
              }
            >
              <div className="notesSubjectIcon">📝</div>
              <h3>{subjectName}</h3>
              <p>Open mock test chapters</p>
              <span className="notesSubjectTag">{activeMockPlan}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/mock-tests/plan/:plan/:subjectId"
  element={
    <section className="notesSubjectRoutePage">
      <button onClick={() => navigate("/ctet-tet/mock-tests")}>
        ← Back to Mock Test Library
      </button>

      <span className="notesSubjectRouteBadge">
        {activeMockPlan} MOCK TESTS
      </span>

      <h1>
        📝{" "}
        {decodeURIComponent(activeMockSubjectId || "")
          .replace(/-/g, " ")}
      </h1>

      <p>Subject-wise mock test chapters will appear here.</p>

      <div className="chapterLibraryStack">
        {[
          ...new Set(
            universalContent
              .filter(
                (test) =>
                  test.section === "mockTest" &&
                  test.status === "published" &&
                  test.planType === activeMockPlan &&
                  test.subject?.trim().toLowerCase() ===
                    decodeURIComponent(activeMockSubjectId)
                      .trim()
                      .toLowerCase() &&
                  test.chapter
              )
              .map((test) => test.chapter)
          ),
        ].map((chapterName) => (
          <button
            type="button"
            className="notesSubjectCard chapterLibraryCard"
            key={chapterName}
            onClick={() =>
              navigate(
                `/ctet-tet/mock-tests/plan/${activeMockPlan}/${activeMockSubjectId}/${encodeURIComponent(
                  chapterName
                )}`
              )
            }
          >
            <div className="notesSubjectIcon">📚</div>
            <h3>{chapterName}</h3>
            <p>Open chapter tests</p>
            <span className="notesSubjectTag">{activeMockPlan}</span>
          </button>
        ))}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/mock-tests/plan/:plan/:subjectId/:chapterId"
  element={
    <section className="notesSubjectRoutePage">
      <button
        onClick={() =>
          navigate(
            `/ctet-tet/mock-tests/plan/${activeMockPlan}/${activeMockSubjectId}`
          )
        }
      >
        ← Back to Chapters
      </button>

      <span className="notesSubjectRouteBadge">
        {activeMockPlan} MOCK CHAPTER
      </span>

      <h1>
        {decodeURIComponent(activeMockChapterId || "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())}
      </h1>

      <p>Chapter-wise available mock tests. Select a test to start practice.</p>

      <div className="pdfShelfRow">
        {universalContent
          .filter(
            (test) =>
              test.section === "mockTest" &&
              test.status === "published" &&
              test.planType === activeMockPlan &&
              test.subject?.trim().toLowerCase() ===
                decodeURIComponent(activeMockSubjectId)
                  .trim()
                  .toLowerCase() &&
              test.chapter?.trim().toLowerCase() ===
                decodeURIComponent(activeMockChapterId)
                  .trim()
                  .toLowerCase()
          )
          .map((test) => (
            <div className="pdfMiniCard" key={test.id}>
              <div className="pdfIcon">📝</div>

              <h3>{test.title}</h3>

              <p>
                {test.subject} · {test.chapter}
              </p>

              <span>
                {test.planType} · {test.testType || "Mock Test"}
              </span>

              <button
                className="btnLink"
                onClick={() => {
                  if (
                    test.planType !== "FREE" &&
                    !hasPlanAccess(test.planType)
                  ) {
                    navigate("/ctet-tet/pricing");
                    return;
                  }

                  navigate(
                    `/ctet-tet/mock-tests/start/${test.id}`
                  );
                }}
              >
                Start Test
              </button>
            </div>
          ))}
      </div>
    </section>
  }
/>

<Route
  path="/ctet-tet/mock-tests/start/:testId"
  element={
    <section className="notesSubjectRoutePage">
      {universalContent
        .filter(
          (test) =>
            test.section === "mockTest" &&
            test.id === activeStartMockTestId
        )
        .map((test) => (
          <div key={test.id}>
            <button onClick={() => navigate(-1)}>
              ← Back to Tests
            </button>

            <span className="notesSubjectRouteBadge">
              MOCK TEST START
            </span>

            <h1>{test.title}</h1>

            <p>
              {test.planType} · {test.subject} · {test.chapter}
            </p>

            <div className="pdfShelfRow">
              <div className="pdfMiniCard">
                <div className="pdfIcon">📝</div>

                <h3>Test Details</h3>

                <p>
                  Type: {test.testType || "Mock Test"}
                </p>

                <p>
                  Duration: {test.duration || "Not specified"}
                </p>

                <p>
                  Questions: {test.questions?.length || 0}
                </p>

                <span>{test.planType}</span>

                <button
                  className="btnLink"
                  onClick={() =>
                    navigate(
                      `/ctet-tet/mock-tests/attempt/${test.id}`
                    )
                  }
                >
                  Begin Test
                </button>
              </div>
            </div>
          </div>
        ))}
    </section>
  }
/>

<Route
  path="/ctet-tet/mock-tests/attempt/:testId"
  element={
    <section className="premiumExamPage">
      {universalContent
        .filter(
          (test) =>
            test.section === "mockTest" &&
            test.id === activeStartMockTestId
        )
        .map((test) => {
          const questions = test.questions || [];

          const currentQuestionIndex =
            mockAttemptCurrentIndex?.[test.id] || 0;

          const currentQuestion =
            questions[currentQuestionIndex];

          const selectedAnswerKey =
            mockAttemptAnswers?.[test.id]?.[
              currentQuestionIndex
            ] || "";

          const optionList = currentQuestion
            ? [
                {
                  key: "option1",
                  label: "A",
                  text:
                    currentQuestion.option1 ||
                    currentQuestion.options?.[0],
                },
                {
                  key: "option2",
                  label: "B",
                  text:
                    currentQuestion.option2 ||
                    currentQuestion.options?.[1],
                },
                {
                  key: "option3",
                  label: "C",
                  text:
                    currentQuestion.option3 ||
                    currentQuestion.options?.[2],
                },
                {
                  key: "option4",
                  label: "D",
                  text:
                    currentQuestion.option4 ||
                    currentQuestion.options?.[3],
                },
              ].filter((option) => option.text)
            : [];

          const answeredCount = questions.filter(
            (_, index) => mockAttemptAnswers?.[test.id]?.[index]
          ).length;

          const palettePageSize = 25;

          const activePaletteRangeStart =
            mockPaletteRangeStart?.[test.id] || 0;
          
          const currentRangeStart =
            Math.floor(currentQuestionIndex / palettePageSize) *
            palettePageSize;
          
          const finalPaletteRangeStart =
            activePaletteRangeStart === currentRangeStart
              ? activePaletteRangeStart
              : currentRangeStart;
          
          const paletteRangeQuestions = questions.slice(
            finalPaletteRangeStart,
            finalPaletteRangeStart + palettePageSize
          );
          
          const paletteRanges = Array.from(
            {
              length: Math.ceil(questions.length / palettePageSize),
            },
            (_, rangeIndex) => {
              const start = rangeIndex * palettePageSize;
              const end = Math.min(
                start + palettePageSize,
                questions.length
              );
          
              return {
                start,
                end,
                label: `${start + 1}-${end}`,
              };
            }
          );

          const getTimerSeconds = (value, unit) => {
            const numericValue = Number(value || 1);

            if (unit === "hr") return numericValue * 60 * 60;
            if (unit === "min") return numericValue * 60;

            return numericValue;
          };

          const isNoTimer =
            test.timerMode === "noTimer";

          const isPerQuestionTimer =
            test.timerMode === "perQuestionTimer";

          const timerLabel =
            isPerQuestionTimer ? "Question Time" : "Time Left";

          const defaultTimerSeconds =
            isPerQuestionTimer
              ? getTimerSeconds(
                  test.perQuestionTimeValue,
                  test.perQuestionTimeUnit
                )
              : Number(test.duration || 30) * 60;

          const timeLeft = isNoTimer
            ? 0
            : mockExamTimeLeft?.[test.id] ?? defaultTimerSeconds;

          const resetQuestionTimer = () => {
            if (!isPerQuestionTimer) return;

            setMockExamTimeLeft((prev) => ({
              ...prev,
              [test.id]: defaultTimerSeconds,
            }));
          };

          const formattedTime = `${String(
            Math.floor(timeLeft / 60)
          ).padStart(2, "0")}:${String(timeLeft % 60).padStart(
            2,
            "0"
          )}`;

          const handleTimerEnd = () => {
            if (isNoTimer) return;
          
            if (isPerQuestionTimer) {
              if (currentQuestionIndex < questions.length - 1) {
                setMockAttemptCurrentIndex((prev) => ({
                  ...prev,
                  [test.id]: currentQuestionIndex + 1,
                }));
          
                resetQuestionTimer();
                return;
              }
          
              navigate(`/ctet-tet/mock-tests/result/${test.id}`);
              return;
            }
          
            navigate(`/ctet-tet/mock-tests/result/${test.id}`);
          };
          
          if (!isNoTimer && timeLeft === 0) {
            setTimeout(() => {
              handleTimerEnd();
            }, 0);
          }

          return (
            <div className="premiumExamShell" key={test.id}>
              <div className="premiumExamTop">
                <button
                  type="button"
                  className="examGhostBtn"
                  onClick={() => navigate(-1)}
                >
                  ← Back
                </button>

                <div className="examTitleBlock">
                  <span className="examMiniBadge">
                    {test.planType} MOCK TEST
                  </span>

                  <h1>{test.title}</h1>

                  <p>
                    {test.subject} · {test.chapter}
                  </p>
                </div>

                <div className="examTopStats">
                  {!isNoTimer && (
                    <div className="timerStat">
                      <span>{timerLabel}</span>
                      <strong>{formattedTime}</strong>
                    </div>
                  )}

                  <div>
                    <span>Question</span>
                    <strong>
                      {currentQuestionIndex + 1}/{questions.length}
                    </strong>
                  </div>

                  <div>
                    <span>Answered</span>
                    <strong>{answeredCount}</strong>
                  </div>

                  <button
  type="button"
  className="examSubmitBtn"
  onClick={() => {
    const finalAnswers =
      mockAttemptAnswers?.[test.id] || {};

    localStorage.setItem(
      `mockAttemptAnswers_${test.id}`,
      JSON.stringify(finalAnswers)
    );

    navigate(
      `/ctet-tet/mock-tests/result/${test.id}`
    );
  }}
>
  Submit
</button>
                </div>
              </div>

              <div className="premiumExamGrid">
                <main className="premiumQuestionWorkspace">
                  <div className="compactQuestionStatus">
                    <span>
                      Q{currentQuestionIndex + 1} of {questions.length}
                    </span>

                    <strong
                      className={
                        selectedAnswerKey
                          ? "statusAnswered"
                          : "statusPending"
                      }
                    >
                      {selectedAnswerKey ? "Answered" : "Not Answered"}
                    </strong>

                    <span>
                      {mockMarkedQuestions?.[test.id]?.[
                        currentQuestionIndex
                      ]
                        ? "Marked for Review"
                        : "Not Marked"}
                    </span>
                  </div>

                  {questions.length === 0 ? (
                    <div className="examEmptyState">
                      <h2>No Questions Found</h2>
                      <p>
                        This mock test does not have questions yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="premiumQuestionCard">
                        <span className="questionNumberPill">
                          Q{currentQuestionIndex + 1}
                        </span>

                        <h2>{currentQuestion?.question}</h2>
                      </div>

                      <div className="premiumOptionList">
                        {optionList.map((option) => (
                          <button
                            type="button"
                            key={option.key}
                            className={
                              selectedAnswerKey === option.key
                                ? "premiumOption selectedPremiumOption"
                                : "premiumOption"
                            }
                            onClick={() => {
                              const updatedAnswers = {
                                ...(mockAttemptAnswers?.[test.id] || {}),
                                [currentQuestionIndex]: option.key,
                              };
                            
                              setMockAttemptAnswers((prev) => ({
                                ...prev,
                                [test.id]: updatedAnswers,
                              }));
                            
                              localStorage.setItem(
                                `mockAttemptAnswers_${test.id}`,
                                JSON.stringify(updatedAnswers)
                              );
                            }}
                          >
                            <span className="optionLetter">
                              {option.label}
                            </span>

                            <span className="optionText">
                              {option.text}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="premiumExamControls finalExamControls">
                        <button
                          type="button"
                          className="examControlBtn secondary"
                          disabled={currentQuestionIndex === 0}
                          onClick={() =>
                            setMockAttemptCurrentIndex((prev) => ({
                              ...prev,
                              [test.id]: currentQuestionIndex - 1,
                            }))
                          }
                        >
                          ← Previous
                        </button>

                        <button
                          type="button"
                          className="examControlBtn ghost"
                          onClick={() => {
                            const updatedAnswers = {
                              ...(mockAttemptAnswers?.[test.id] || {}),
                              [currentQuestionIndex]: "",
                            };
                          
                            setMockAttemptAnswers((prev) => ({
                              ...prev,
                              [test.id]: updatedAnswers,
                            }));
                          
                            localStorage.setItem(
                              `mockAttemptAnswers_${test.id}`,
                              JSON.stringify(updatedAnswers)
                            );
                          }}
                        >
                          Clear Response
                        </button>

                        <button
                          type="button"
                          className="examControlBtn review"
                          onClick={() => {
                            setMockMarkedQuestions((prev) => ({
                              ...prev,
                              [test.id]: {
                                ...(prev[test.id] || {}),
                                [currentQuestionIndex]:
                                  !prev?.[test.id]?.[
                                    currentQuestionIndex
                                  ],
                              },
                            }));

                            if (
                              currentQuestionIndex <
                              questions.length - 1
                            ) {
                              setMockAttemptCurrentIndex((prev) => ({
                                ...prev,
                                [test.id]: currentQuestionIndex + 1,
                              }));

                              resetQuestionTimer();
                            }
                          }}
                        >
                          Mark for Review & Next
                        </button>

                        <button
                          type="button"
                          className="examControlBtn primary"
                          onClick={() => {
                            if (
                              currentQuestionIndex ===
                              questions.length - 1
                            ) {
                              navigate(
                                `/ctet-tet/mock-tests/result/${test.id}`
                              );
                              return;
                            }

                            setMockAttemptCurrentIndex((prev) => ({
                              ...prev,
                              [test.id]: currentQuestionIndex + 1,
                            }));

                            resetQuestionTimer();
                          }}
                        >
                          {currentQuestionIndex === questions.length - 1
                            ? "Submit Test"
                            : "Save & Next"}
                        </button>
                      </div>
                    </>
                  )}
                </main>

                <aside className="premiumPalettePanel">
                  <div className="paletteHeader">
                    <h3>Question Palette</h3>
                    <p>
                      {answeredCount}/{questions.length} answered
                    </p>
                  </div>

                  <div className="paletteRanges">
  {paletteRanges.map((range) => (
    <button
      key={range.start}
      type="button"
      className={
        finalPaletteRangeStart === range.start
          ? "paletteRangeBtn active"
          : "paletteRangeBtn"
      }
      onClick={() => {
        setMockPaletteRangeStart((prev) => ({
          ...prev,
          [test.id]: range.start,
        }));
      }}
    >
      {range.label}
    </button>
  ))}
</div>

                  <div className="premiumPaletteGrid">
                  {paletteRangeQuestions.map((_, rangeIndex) => {
  const index = finalPaletteRangeStart + rangeIndex;

  const isCurrent =
    index === currentQuestionIndex;

  const isAnswered =
    Boolean(
      mockAttemptAnswers?.[test.id]?.[index]
    );

  const isMarked =
    Boolean(
      mockMarkedQuestions?.[test.id]?.[index]
    );

  return (
    <button
      type="button"
      key={index}
      className={[
        "paletteNumber",
        isAnswered ? "paletteAnswered" : "",
        isMarked ? "paletteMarked" : "",
        isCurrent ? "paletteCurrent" : "",
      ].join(" ")}
      onClick={() => {
        setMockAttemptCurrentIndex((prev) => ({
          ...prev,
          [test.id]: index,
        }));

        setMockPaletteRangeStart((prev) => ({
          ...prev,
          [test.id]: finalPaletteRangeStart,
        }));

        resetQuestionTimer();
      }}
    >
      {index + 1}
    </button>
  );
})}
                  </div>

                  <div className="paletteSummary">
                    <div>
                      <span className="dot answeredDot"></span>
                      Answered
                    </div>

                    <div>
                      <span className="dot pendingDot"></span>
                      Not Answered
                    </div>

                    <div>
                      <span className="dot markedDot"></span>
                      Marked
                    </div>

                    <div>
                      <span className="dot currentDot"></span>
                      Current
                    </div>
                  </div>

                  <div className="examFinalBox">
                    <h4>Ready to submit?</h4>
                    <p>
                      Review your answers before final submission.
                    </p>

                    <button
  type="button"
  onClick={() => {
    localStorage.setItem(
      `mockAttemptAnswers_${test.id}`,
      JSON.stringify(mockAttemptAnswers[test.id] || {})
    );

    navigate(
      `/ctet-tet/mock-tests/result/${test.id}`
    );
  }}
>
  Submit Test
</button>
                  </div>
                </aside>
              </div>
            </div>
          );
        })}
    </section>
  }
/>

<Route
  path="/ctet-tet/mock-tests/result/:testId"
  element={
    <section className="notesSubjectRoutePage">
      {universalContent
        .filter(
          (test) =>
            test.section === "mockTest" &&
            test.id === activeResultAttemptId
        )
        .map((test) => {
          const questions = test.questions || [];
          const totalQuestions = questions.length;

          const storedAttemptAnswers = JSON.parse(
            localStorage.getItem(`mockAttemptAnswers_${test.id}`) || "{}"
          );
          
          const liveAttemptAnswers =
          mockAttemptAnswers?.[test.id] || {};
        
        const attemptAnswers =
          Object.keys(liveAttemptAnswers).length > 0
            ? liveAttemptAnswers
            : storedAttemptAnswers;

          const correctCount = questions.filter(
            (question, index) =>
              attemptAnswers[index] &&
              attemptAnswers[index] === question.answer
          ).length;

          const skippedCount = questions.filter(
            (_, index) => !attemptAnswers[index]
          ).length;

          const wrongCount =
            totalQuestions - correctCount - skippedCount;

          const accuracy =
            totalQuestions > 0
              ? Math.round((correctCount / totalQuestions) * 100)
              : 0;

          const totalMarks =
            Number(test.totalMarks) ||
            totalQuestions * Number(test.marksPerQuestion || 1);

          const score =
            questions.reduce((sum, question, index) => {
              const selected = attemptAnswers[index];

              if (!selected) return sum;

              if (selected === question.answer) {
                return sum + Number(question.positiveMarks || test.marksPerQuestion || 1);
              }

              return sum - Number(question.negativeMarks || test.negativeMarks || 0);
            }, 0);

          const percentage =
            totalMarks > 0
              ? Math.round((score / totalMarks) * 100)
              : 0;

              const leaderboardEnabled =
              test.leaderboardMode &&
              test.leaderboardMode !== "disabled";
            
            const canShowLeaderboardButton =
              leaderboardEnabled || isAdmin(user);
              const saveToLeaderboard = async () => {
                if (!user?.email) {
                  alert("Please login to save result");
                  return;
                }
              
                const attemptKey = `${test.id}_${user.email}`;
              
                const existingResult = await getDocs(
                  query(
                    collection(db, "mockResults"),
                    where("attemptKey", "==", attemptKey)
                  )
                );
              
                if (existingResult.empty) {
                  await addDoc(collection(db, "mockResults"), {
                    attemptKey,
              
                    testId: test.id,
                    testTitle: test.title || "",
              
                    email: user.email,
                    studentEmail: user.email,
                    studentName: fullName || user.email,
              
                    subject: test.subject || "",
                    chapter: test.chapter || "",
                    planType: test.planType || "FREE",
                    examType: test.examType || "",
                    testType: test.testType || "",
              
                    score,
                    totalMarks,
                    percentage,
                    accuracy,
              
                    correctCount,
                    wrongCount,
                    skippedCount,
                    totalQuestions,
              
                    createdAt: new Date(),
                  });
                }
              
                if (leaderboardEnabled) {
                  const leaderboardKey = `${test.id}_${user.email}_${test.leaderboardMode}`;
              
                  const existingLeaderboard = await getDocs(
                    query(
                      collection(db, "mockLeaderboard"),
                      where("leaderboardKey", "==", leaderboardKey)
                    )
                  );
              
                  if (existingLeaderboard.empty) {
                    await addDoc(collection(db, "mockLeaderboard"), {
                      leaderboardKey,
                      leaderboardMode: test.leaderboardMode,
              
                      testId: test.id,
                      testTitle: test.title || "",
              
                      studentEmail: user.email,
                      studentName: fullName || user.email,
              
                      subject: test.subject || "",
                      chapter: test.chapter || "",
                      planType: test.planType || "FREE",
                      examType: test.examType || "",
                      testType: test.testType || "",
              
                      score,
                      totalMarks,
                      percentage,
                      accuracy,
              
                      correctCount,
                      wrongCount,
                      skippedCount,
                      totalQuestions,
              
                      rankScore: percentage,
                      rankTieBreakerScore: score,
              
                      createdAt: new Date(),
                    });
                  }
                }
              
                await loadUserMockResults(user.email);
                await loadLeaderboard();
                await loadMockLeaderboardEntries();
              
                alert(
                  leaderboardEnabled
                    ? "Result and leaderboard saved ✅"
                    : "Result saved ✅ Leaderboard is disabled for this test"
                );
              };
            

          return (
            <div key={test.id}>
              <button onClick={() => navigate(-1)}>
                ← Back to Attempt
              </button>

              <span className="notesSubjectRouteBadge">
                MOCK TEST RESULT
              </span>

              <h1>Result: {test.title}</h1>

              <p>
                {test.planType} · {test.subject} · {test.chapter}
              </p>

              <div className="pdfShelfRow">
                <div className="pdfMiniCard">
                  <div className="pdfIcon">🏆</div>

                  <h3>Score Summary</h3>

                  <p>Total Questions: {totalQuestions}</p>

                  <p>Correct: {correctCount}</p>

                  <p>Wrong: {wrongCount}</p>

                  <p>Skipped: {skippedCount}</p>

                  <p>
                    Score: {score} / {totalMarks}
                  </p>

                  <span>Accuracy: {accuracy}%</span>

                  {canShowLeaderboardButton && (
                    <p>
                      Leaderboard: {test.leaderboardMode}
                    </p>
                  )}

                  <button
                    className="btnLink"
                    onClick={() =>
                      navigate(
                        `/ctet-tet/mock-tests/review/${test.id}`
                      )
                    }
                  >
                    Review Answers
                  </button>
                  {canShowLeaderboardButton && (
                    <button
  className="btnLink"
  onClick={async () => {
    await saveToLeaderboard();
    navigate("/admin/content/mock-tests/leaderboard");
  }}
>
  Save to Leaderboard
</button>
)}
                </div>

                <div className="pdfMiniCard">
                  <div className="pdfIcon">📊</div>

                  <h3>Performance</h3>

                  <p>
                    Percentage: {percentage}%
                  </p>

                  <span>
                    {percentage >= 80
                      ? "Excellent"
                      : percentage >= 50
                      ? "Good Attempt"
                      : "Needs Revision"}
                  </span>

                  <button
                    className="btnLink"
                    onClick={() => navigate("/ctet-tet/mock-tests")}
                  >
                    Back to Mock Tests
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </section>
  }
/>


<Route
  path="/ctet-tet/mock-tests/review/:testId"
  element={
    <section className="notesSubjectRoutePage">
      {universalContent
        .filter(
          (test) =>
            test.section === "mockTest" &&
            test.id === activeResultAttemptId
        )
        .map((test) => {
          const storedAttemptAnswers = JSON.parse(
            localStorage.getItem(`mockAttemptAnswers_${test.id}`) || "{}"
          );

          const liveAttemptAnswers =
            mockAttemptAnswers?.[test.id] || {};

          const attemptAnswers =
            Object.keys(liveAttemptAnswers).length > 0
              ? liveAttemptAnswers
              : storedAttemptAnswers;

          return (
            <div key={test.id}>
              <button onClick={() => navigate(-1)}>
                ← Back to Result
              </button>

              <span className="notesSubjectRouteBadge">
                ANSWER REVIEW
              </span>

              <h1>{test.title}</h1>

              <p>
                Review your answers, correct answers, and explanations.
              </p>

              <div className="pdfShelfRow">
                {(test.questions || []).map((question, index) => {
                  const userAnswer = attemptAnswers[index];
                  const isCorrect = userAnswer === question.answer;
                  const isSkipped = !userAnswer;

                  return (
                    <div className="pdfMiniCard" key={index}>
                      <div className="pdfIcon">
                        {isSkipped ? "⏭️" : isCorrect ? "✅" : "❌"}
                      </div>

                      <h3>Question {index + 1}</h3>

                      <p>{question.question}</p>

                      <p>
                        Your Answer:{" "}
                        <strong>{userAnswer || "Not Attempted"}</strong>
                      </p>

                      <p>
                        Correct Answer:{" "}
                        <strong>{question.answer}</strong>
                      </p>

                      <span>
                        {isSkipped
                          ? "Skipped"
                          : isCorrect
                          ? "Correct"
                          : "Wrong"}
                      </span>

                      {question.explanation && (
                        <p>Explanation: {question.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                className="btnLink"
                onClick={() => navigate("/ctet-tet/mock-tests/history")}
              >
                My Attempts History
              </button>
            </div>
          );
        })}
    </section>
  }
/>

<Route
  path="/ctet-tet/mock-tests/history"
  element={
    <section className="notesSubjectRoutePage">
      <span className="notesSubjectRouteBadge">
        MY ATTEMPTS
      </span>

      <h1>Mock Test History</h1>

      <p>
        Previous mock tests and performance records
        from Firestore.
      </p>

      <div className="pdfShelfRow">
        {mockResults.filter(
          (result) =>
            result.email === user?.email ||
            result.studentEmail === user?.email
        ).length === 0 ? (
          <div className="pdfMiniCard">
            <div className="pdfIcon">📊</div>

            <h3>No Attempts Yet</h3>

            <p>
              Attempted mock tests will appear here
              after submission.
            </p>

            <span>Start Practice</span>

            <button
              className="btnLink"
              onClick={() =>
                navigate("/ctet-tet/mock-tests")
              }
            >
              Open Mock Tests
            </button>
          </div>
        ) : (
          mockResults
            .filter(
              (result) =>
                result.email === user?.email ||
                result.studentEmail === user?.email
            )
            .map((result) => (
              <div
                className="pdfMiniCard"
                key={result.id}
              >
                <div className="pdfIcon">🏆</div>

                <h3>
                  {result.testTitle || "Mock Test"}
                </h3>

                <p>
                  {result.subject || "Subject"} ·{" "}
                  {result.chapter || "Chapter"}
                </p>

                <p>
                  Score: {result.score || 0} /{" "}
                  {result.totalQuestions || 0}
                </p>

                <p>
                  Correct: {result.correct || 0} · Wrong:{" "}
                  {result.wrong || 0} · Skipped:{" "}
                  {result.skipped || 0}
                </p>

                <span>
                  Accuracy: {result.accuracy || 0}%
                </span>

                <button
                  className="btnLink"
                  onClick={() =>
                    navigate("/leaderboard")
                  }
                >
                  View Leaderboard
                </button>
              </div>
            ))
        )}
      </div>
    </section>
  }
/>

<Route
  path="/leaderboard"
  element={
    <section className="notesSubjectRoutePage">
      <span className="notesSubjectRouteBadge">
        LEADERBOARD
      </span>

      <h1>Top Student Rankings</h1>

      <p>
        Rankings generated from saved mock test results.
      </p>

      <div className="pdfShelfRow">
        {mockResults.length === 0 ? (
          <div className="pdfMiniCard">
            <div className="pdfIcon">🏆</div>

            <h3>No Rankings Yet</h3>

            <p>
              Leaderboard will appear after students submit mock tests.
            </p>

            <span>Start Practice</span>

            <button
              className="btnLink"
              onClick={() =>
                navigate("/ctet-tet/mock-tests")
              }
            >
              Open Mock Tests
            </button>
          </div>
        ) : (
          [...mockResults]
            .sort(
              (a, b) =>
                Number(b.score || 0) - Number(a.score || 0)
            )
            .slice(0, 20)
            .map((result, index) => (
              <div
                className="pdfMiniCard"
                key={result.id || index}
              >
                <div className="pdfIcon">
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : "🏆"}
                </div>

                <h3>
                  #{index + 1}{" "}
                  {result.studentName ||
                    result.studentEmail ||
                    result.email ||
                    "Student"}
                </h3>

                <p>
                  {result.testTitle || "Mock Test"}
                </p>

                <p>
                  Score: {result.score || 0} /{" "}
                  {result.totalQuestions || 0}
                </p>

                <p>
                  Correct: {result.correct || 0} · Wrong:{" "}
                  {result.wrong || 0} · Skipped:{" "}
                  {result.skipped || 0}
                </p>

                <span>
                  Accuracy: {result.accuracy || 0}%
                </span>
              </div>
            ))
        )}
      </div>
    </section>
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

{mockMenuPosition &&
  mockMenuTest &&
  createPortal(
    <div
      className="mockPortalBackdrop"
      onClick={closeMockActionPortal}
    >
      <div
        className="mockPortalMenu"
        style={{
          position: "fixed",
          top: `${mockMenuPosition.top}px`,
          left: `${mockMenuPosition.left}px`,
          zIndex: 999999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
       <button
  onClick={() => {
    if (!mockMenuTest?.id) return;

    setEditingMockTestId(mockMenuTest.id);

    setMockTestForm({
      title: mockMenuTest.title || "",
      planType: mockMenuTest.planType || "FREE",
      subject: mockMenuTest.subject || "",
      chapter: mockMenuTest.chapter || "",
      examType: mockMenuTest.examType || "CTET",
      testType: mockMenuTest.testType || "Chapter Test",

      duration:
        mockMenuTest.duration?.toString() ||
        mockMenuTest.durationMinutes?.toString() ||
        "30",

      totalQuestions:
        mockMenuTest.totalQuestions?.toString() ||
        mockMenuTest.questions?.length?.toString() ||
        "10",

      marksPerQuestion:
        mockMenuTest.marksPerQuestion?.toString() || "1",

      negativeMarks:
        mockMenuTest.negativeMarks?.toString() || "0",

      passingMarks:
        mockMenuTest.passingMarks?.toString() || "0",

      examDifficulty: mockMenuTest.examDifficulty || "Mixed",
      examLanguage: mockMenuTest.examLanguage || "English",

      attemptLimit: mockMenuTest.attemptLimit || "unlimited",
      resultPublishMode: mockMenuTest.resultPublishMode || "instant",

      shuffleQuestions: mockMenuTest.shuffleQuestions || "no",
      shuffleOptions: mockMenuTest.shuffleOptions || "no",

      navigationMode: mockMenuTest.navigationMode || "free",
      allowPause: mockMenuTest.allowPause || "yes",
      calculatorAllowed: mockMenuTest.calculatorAllowed || "no",

      questionSource: mockMenuTest.questionSource || "manual",

      fullscreenMode: mockMenuTest.fullscreenMode || "no",
      tabSwitchDetection: mockMenuTest.tabSwitchDetection || "no",
      copyPasteProtection: mockMenuTest.copyPasteProtection || "no",
      autoSubmitOnViolation:
        mockMenuTest.autoSubmitOnViolation || "no",

      leaderboardMode:
        mockMenuTest.leaderboardMode || "disabled",

      timerMode: mockMenuTest.timerMode || "globalTimer",
      perQuestionTimeValue:
        mockMenuTest.perQuestionTimeValue || "1",
      perQuestionTimeUnit:
        mockMenuTest.perQuestionTimeUnit || "min",
      autoSubmitOnTimeUp:
        mockMenuTest.autoSubmitOnTimeUp || "yes",

      scheduleType:
        mockMenuTest.scheduleType || "alwaysAvailable",
      examStartDate: mockMenuTest.examStartDate || "",
      examStartTime: mockMenuTest.examStartTime || "",
      examEndDate: mockMenuTest.examEndDate || "",
      examEndTime: mockMenuTest.examEndTime || "",

      recurringMode: mockMenuTest.recurringMode || "none",
      weeklyTestDay: mockMenuTest.weeklyTestDay || "",
      monthlyTestDate: mockMenuTest.monthlyTestDate || "",

      liveEventMode: mockMenuTest.liveEventMode || "no",
      scholarshipMode: mockMenuTest.scholarshipMode || "no",

      examInstructions: mockMenuTest.examInstructions || "",

      status: mockMenuTest.status || "published",
    });

    setMockTestQuestionsForm(
      mockMenuTest.questions?.length
        ? mockMenuTest.questions.map((question) => ({
            question: question.question || "",
            option1: question.option1 || "",
            option2: question.option2 || "",
            option3: question.option3 || "",
            option4: question.option4 || "",
            answer: question.answer || "",
            explanation: question.explanation || "",
            level: question.level || "Easy",
            questionType:
              question.questionType || "Single Correct",
            language: question.language || "English",
            tag: question.tag || "",
            positiveMarks:
              question.positiveMarks?.toString() || "1",
            negativeMarks:
              question.negativeMarks?.toString() || "0",
            questionStatus:
              question.questionStatus || "published",
            saveToQuestionBank:
              question.saveToQuestionBank || "yes",
          }))
        : [
            {
              question: "",
              option1: "",
              option2: "",
              option3: "",
              option4: "",
              answer: "",
              explanation: "",
              level: "Easy",
              questionType: "Single Correct",
              language: "English",
              tag: "",
              positiveMarks: "1",
              negativeMarks: "0",
              questionStatus: "published",
              saveToQuestionBank: "yes",
            },
          ]
    );

    closeMockActionPortal();

localStorage.removeItem(
  "reusedQuestionForMockTest"
);

navigate(
  `/admin/content/mock-tests/add?editId=${mockMenuTest.id}`
);
  }}
>
  ✏ Edit
</button>

        <div className="mockPortalMenuDivider" />

        <button
          onClick={async () => {
            const confirmClone = window.confirm(
              `Create a duplicate copy of "${mockMenuTest.title}" as Draft?`
            );

            if (!confirmClone) return;

            const clonePayload = {
              ...mockMenuTest,
              title: `${mockMenuTest.title || "Mock Test"} - Copy`,
              status: "draft",
              isFeatured: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              clonedFrom: mockMenuTest.id,
            };

            delete clonePayload.id;

            await addDoc(collection(db, "contentItems"), clonePayload);
            await loadContentItemsFromFirestore();

            closeMockActionPortal();
            alert("Mock test duplicated as Draft ✅");
          }}
        >
          📋 Duplicate
        </button>

        <div className="mockPortalMenuDivider" />

        <button
          onClick={async () => {
            const nextStatus =
              mockMenuTest.status === "published"
                ? "unpublished"
                : "published";

            await updateDoc(doc(db, "contentItems", mockMenuTest.id), {
              status: nextStatus,
              updatedAt: new Date(),
            });

            await loadContentItemsFromFirestore();
            closeMockActionPortal();

            alert(
              nextStatus === "published"
                ? "Mock test published ✅"
                : "Mock test unpublished ✅"
            );
          }}
        >
          🚀 Publish / Unpublish
        </button>

        <button
          onClick={async () => {
            await updateDoc(doc(db, "contentItems", mockMenuTest.id), {
              isFeatured: !mockMenuTest.isFeatured,
              updatedAt: new Date(),
            });

            await loadContentItemsFromFirestore();
            closeMockActionPortal();

            alert(
              !mockMenuTest.isFeatured
                ? "Mock test marked as featured ⭐"
                : "Mock test removed from featured"
            );
          }}
        >
          ⭐ Feature / Remove Feature
        </button>

        {mockMenuTest.status === "archived" ? (
  <button
    onClick={async () => {
      if (!mockMenuTest?.id) return;

      const confirmRestore = window.confirm(
        `Restore "${mockMenuTest.title}" back to Unpublished?`
      );

      if (!confirmRestore) return;

      await updateDoc(doc(db, "contentItems", mockMenuTest.id), {
        status: "unpublished",
        updatedAt: new Date(),
        restoredAt: new Date(),
      });

      await loadContentItemsFromFirestore();
      closeMockActionPortal();

      alert("Mock test restored successfully ✅");
    }}
  >
    📂 Restore / Unarchive
  </button>
) : (
  <button
    onClick={async () => {
      if (!mockMenuTest?.id) return;

      const confirmArchive = window.confirm(
        `Archive "${mockMenuTest.title}"?\n\nArchived tests stay saved in admin but should not appear to students.`
      );

      if (!confirmArchive) return;

      await updateDoc(doc(db, "contentItems", mockMenuTest.id), {
        status: "archived",
        updatedAt: new Date(),
        archivedAt: new Date(),
      });

      await loadContentItemsFromFirestore();
      closeMockActionPortal();

      alert("Mock test archived successfully ✅");
    }}
  >
    📦 Archive
  </button>
)}

        

        <div className="mockPortalMenuDivider" />

        <button
          onClick={async () => {
            const testLink = `${window.location.origin}/ctet-tet/mock-tests/attempt/${mockMenuTest.id}`;

            await navigator.clipboard.writeText(testLink);
            closeMockActionPortal();

            alert("Student test link copied ✅");
          }}
        >
          🔗 Copy Link
        </button>

        <button
          onClick={() => {
            const exportPayload = {
              ...mockMenuTest,
              exportedAt: new Date().toISOString(),
              exportedFrom: "AspireNest Academy",
            };

            const jsonBlob = new Blob(
              [JSON.stringify(exportPayload, null, 2)],
              { type: "application/json" }
            );

            const downloadUrl = URL.createObjectURL(jsonBlob);

            const downloadLink = document.createElement("a");
            downloadLink.href = downloadUrl;
            downloadLink.download = `${(
              mockMenuTest.title || "mock-test"
            )
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}.json`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(downloadUrl);
            closeMockActionPortal();
          }}
        >
          📤 Export JSON
        </button>

        <button
  type="button"
  onClick={() => {
    handleExportMockTestCsv(mockMenuTest);
    closeMockActionPortal();
  }}
>
  📊 Export CSV
</button>

<button
  type="button"
  onClick={() => {
    handleExportMockTestExcel(mockMenuTest);
    closeMockActionPortal();
  }}
>
  📗 Export Excel
</button>
<button
  type="button"
  onClick={() => {
    handleExportMockTestXlsx(mockMenuTest);
    closeMockActionPortal();
  }}
>
  📘 Export XLSX
</button>

        <div className="mockPortalMenuDivider" />

        <button
          className="dangerMenuButton"
          onClick={async () => {
            const confirmDelete = window.confirm(
              `Delete "${mockMenuTest.title}" permanently?\n\nThis action cannot be undone.`
            );

            if (!confirmDelete) return;

            await deleteDoc(doc(db, "contentItems", mockMenuTest.id));
            await loadContentItemsFromFirestore();

            closeMockActionPortal();
            alert("Mock test deleted permanently ✅");
          }}
        >
          🗑 Delete
        </button>
      </div>
    </div>,
    document.body
  )}
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
      {mockQuestions.length > 0 && (
        <section id="mock-tests">
      <MockTest
  mockStarted={mockStarted}
  setMockStarted={setMockStarted}
  showResult={showResult}
  currentQuestion={currentQuestion}
  mockQuestions={mockQuestions}
  timeLeft={timeLeft}
  setTimeLeft={setTimeLeft}
  score={score}
  selectedSubject={selectedSubject}
  setSelectedSubject={setSelectedSubject}
  loadMockQuestions={loadMockQuestions}
  percentage={percentage}
  performanceLevel={performanceLevel}
  motivationalMessage={motivationalMessage}
  restartMockTest={restartMockTest}
  selectedAnswer={selectedAnswer}
  setSelectedAnswer={setSelectedAnswer}
  showAnswer={showAnswer}
  handleAnswerSubmit={handleAnswerSubmit}
  />
  </section>
)}


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
import { auth, db } from "./firebase";
import { storage } from "./firebase";
import { QRCodeCanvas } from "qrcode.react";


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
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AspireNestLogo from "./components/AspireNestLogo.jsx";
import AppDashboard from "./components/AppDashboard.jsx";
import './style.css';
import januaryCurrentAffairsPdf from "./assets/pdfs/CA JANUARY 26.pdf";
import februaryCurrentAffairsPdf from "./assets/pdfs/CA FEBRUARY 26.pdf";
import marchCurrentAffairsPdf from "./assets/pdfs/CA MARCH 26.pdf";
import aprilCurrentAffairsPdf from "./assets/pdfs/CA APRIL 26.pdf";
import childDevelopmentNotes from "./assets/pdfs/notes/child-development-notes.pdf";

export default function App() {

  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
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
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [userPlanType, setUserPlanType] = useState("FREE");
  const [membershipExpiry, setMembershipExpiry] = useState(null);
  const hasPlanAccess = (requiredPlan) => {
    const hierarchy = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      MENTORSHIP: 3,
    };
    const openProtectedSection = (sectionName, requiredPlan = "PREMIUM") => {
      if (hasPlanAccess(requiredPlan)) {
        setActiveSection(sectionName);
      } else {
        navigate("/subjects/ctet-tet/pricing");;
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
    pdf: januaryCurrentAffairsPdf,
  },

  {
    id: "ca-february-2026",
    title: "February Current Affairs",
    month: "February 2026",
    type: "FREE",
    pages: 10,
    pdf: februaryCurrentAffairsPdf,
  },

  {
    id: "ca-march-2026",
    title: "March Current Affairs",
    month: "March 2026",
    type: "FREE",
    pages: 11,
    pdf: marchCurrentAffairsPdf,
  },

  {
    id: "ca-april-2026",
    title: "April Current Affairs",
    month: "April 2026",
    type: "FREE",
    pages: 12,
    pdf: aprilCurrentAffairsPdf,
  },
];
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
      }, 300);
    
      // Admin heavy data sirf admin ke liye
      if (isAdmin(verifiedUser)) {
        setTimeout(() => {
          loadLeaderboard();
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
  
      "/courses": "courses",
      "/learning-paths": "learning-paths",
  
      "/notes": "notes",
  
      "/resources": "resources",
      "/cdp": "cdp",
  
      "/mock-tests": "mock-tests",
      "/current-affairs": "current-affairs",
  
      "/pricing": "pricing",
  
      "/student-dashboard": "student-profile",
  
      "/admin": "admin-panel",
  
      "/contact": "contact",
    };
  
    const sectionName = routeToSection[location.pathname];
  
    if (sectionName === undefined) return;
  
    if (
      sectionName === "current-affairs" &&
      !hasPlanAccess("PREMIUM")
    ) {
      navigate("/subjects/ctet-tet/pricing");
      return;
    }
  
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
      alert("Login Successful ✅");
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
    try {
      await signInWithPopup(auth, provider);
      alert("Google Login Successful ✅");
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
      navigate("/subjects/ctet-tet/pricing");
  
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
  const notesData = [
    {
      id: 1,
      title: "Child Development Notes",
      category: "CDP",
      type: "PREMIUM",
      pages: 69,
      pdf: childDevelopmentNotes,
    },
    {
      id: 2,
      title: "Learning Theories PDF",
      category: "Psychology",
      type: "FREE",
      pages: 28,
      pdf: "#",
    },
    {
      id: 3,
      title: "Inclusive Education",
      category: "Pedagogy",
      type: "PREMIUM",
      pages: 35,
      pdf: "#",
    },
    {
      id: 4,
      title: "CTET PYQ Notes",
      category: "PYQ",
      type: "PREMIUM",
      pages: 50,
      pdf: "#",
    },
    {
      id: 5,
      title: "Topic-wise CDP Short Notes",
      category: "CDP",
      type: "BASIC",
      pages: 22,
      pdf: "#",
    },
    {
      id: 6,
      title: "Mentor Strategy Sheet",
      category: "Strategy",
      type: "MENTORSHIP",
      pages: 12,
      pdf: "#",
    },
  ];


  
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
  if (!user) {
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

<header className="mainHeader">
  <div className="brand">
    <AspireNestLogo />
  </div>

  <nav className={mobileMenuOpen ? "nav mobile-open" : "nav"}>
  <button
  onClick={() => {
    setProfileMenuOpen(false);
    navigate("/subjects/ctet-tet/courses");
  }}
>
  Courses
</button>

<button
  onClick={() => {
    setProfileMenuOpen(false);
    navigate("/subjects/ctet-tet/notes");
  }}
>
  Notes
</button>

<button
  onClick={() => {
    setProfileMenuOpen(false);
    navigate("/subjects/ctet-tet/pricing");
  }}
>
  Pricing
</button>

<button
  onClick={() => {
    setProfileMenuOpen(false);
    navigate("/contact");
  }}
>
  Contact
</button>
{user ? (
  <div
  className="profileMenuWrapper"
  onMouseLeave={() => setProfileMenuOpen(false)}
>
    <button
      type="button"
      className="profileTrigger"
      onClick={(e) => {
        e.stopPropagation();
        setProfileMenuOpen((prev) => !prev);
      }}
    >
      <div className="profileAvatar">
        {isAdmin(user) ? "A" : user?.email?.charAt(0)}
      </div>

      <span className="profileName">
        {isAdmin(user) ? "Admin" : user?.email?.split("@")[0]}
      </span>
    </button>

    {profileMenuOpen && (
  <div className="profileDropdown">
    <button
      onClick={() => {
        navigate("/student-dashboard");
        setProfileMenuOpen(false);
      }}
    >
      My Dashboard
    </button>

    <button
      onClick={() => {
        navigate("/subjects/ctet-tet/pricing");
        setProfileMenuOpen(false);
      }}
    >
      Premium Access
    </button>

    {isAdmin(user) && (
      <button
        onClick={() => {
          navigate("/admin");
          setProfileMenuOpen(false);
        }}
      >
        Admin Panel
      </button>
    )}

    <button
      onClick={() => {
        setProfileMenuOpen(false);
        handleLogout();
      }}
    >
      Logout
    </button>
  </div>
)}
  </div>
) : (
  <button onClick={() => navigate("/student-dashboard")}>
    Login
  </button>
)}
<button
  onClick={() => {
    setProfileMenuOpen(false);
    setActiveSection(null);
    navigate("/");
    setTimeout(() => window.scrollTo(0, 0), 50);
  }}
>
  Home
</button>
  </nav>

  <button
    className="mobile-menu-btn"
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  >
    ☰
  </button>
</header>

<Routes>
  <Route
    path="/"
    element={
      !activeSection ? (
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

<button
  onClick={() => navigate("/subjects/ctet-tet/notes")}
>
  Free Notes
</button>
</div>

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

    <span>
      <strong>75%</strong> Completed
    </span>
  </div>
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
    onClick={() => navigate("/subjects/ctet-tet/courses")}
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
<section className="freeResources">
  <div className="container">
    <h2>Free Resources</h2>

    <p>
    Start your preparation with free notes and study tools.
    </p>

    <div className="freeGrid">
    <div
  className="freeCard"
  onClick={() => navigate("/subjects/ctet-tet/notes")}
>
        📘 Free CDP Notes
      </div>

      <div className="freeCard">
        🗓️ 7-Day Study Plan
      </div>

      <div
  className="freeCard"
  onClick={() => navigate("/subjects/ctet-tet/mock-tests")}
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
      <button onClick={() => navigate("/subjects/ctet-tet/courses")}>
  Courses
</button>
<button onClick={() => navigate("/cdp")}>
  CDP Module
</button>
<button onClick={() => navigate("/resources")}>
  Free Resources
</button>
      <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
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
      ) : null
    }
  />
    />

    <Route
  path="/courses"
  element={
    <section className="coursePages subjectHubPage">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Courses</span>

        <h2>Choose Your CTET/TET Course</h2>

        <p>
          Start with the right course path under the CTET/TET learning ecosystem.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/courses/ctet")}>
          📘 CTET Course
        </button>

        <button onClick={() => navigate("/courses/tet")}>
          🧑‍🏫 TET Course
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>
<Route
  path="/academy-overview"
  element={
    <section className="coursePages academyOverviewPage">
      <div className="sectionHeader">
        <span className="badge">
          AspireNest Learning Ecosystem
        </span>

        <h2>
          Welcome to AspireNest Academy
        </h2>

        <p>
          Explore mentor-guided learning systems,
          AI-powered preparation, premium courses,
          and future-ready education pathways.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/subjects")}>
          📚 Explore Subjects
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🧑‍🏫 CTET / TET Hub
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
          💎 Premium Plans
        </button>

        <button onClick={() => navigate("/student-dashboard")}>
          📊 Student Dashboard
        </button>

        {isAdmin(user) && (
          <button onClick={() => navigate("/admin")}>
            ⚙️ Admin Panel
          </button>
        )}
      </div>
    </section>
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
        <button onClick={() => navigate("/subjects/ctet-tet")}>
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
  path="/subjects/ctet-tet"
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

      <div className="courseGrid">
        <button onClick={() => navigate("/subjects/ctet-tet/courses")}>
          📚 Courses
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/notes")}>
          📘 Notes
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/mock-tests")}>
          📝 Mock Tests
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/current-affairs")}>
          📰 Current Affairs
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
          💎 Plans
        </button>

        <button onClick={() => navigate("/student-dashboard")}>
          📊 Student Dashboard
        </button>
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
        <button onClick={() => navigate("/subjects/ctet-tet/notes")}>
          📘 CTET Notes
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/mock-tests")}>
          📝 CTET Mock Tests
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
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
        <button onClick={() => navigate("/subjects/ctet-tet/notes")}>
          📘 TET Notes
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/mock-tests")}>
          📝 TET Mock Tests
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
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

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
          💎 Unlock Premium Notes
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
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

        <button onClick={() => navigate("/subjects/ctet-tet")}>
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

        <button onClick={() => navigate("/subjects/ctet-tet")}>
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

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>
<Route
  path="/student-dashboard"
  element={
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
  }
/>
<Route
  path="/my-courses"
  element={
    <section className="coursePages" style={{ paddingTop: "190px" }}>
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
  }
/>

<Route
  path="/my-notes"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">My Notes</span>

        <h2>Premium Notes Library</h2>

        <p>
          Access your saved and premium study materials.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/my-tests"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">My Tests</span>

        <h2>Mock Test Analytics</h2>

        <p>
          Track mock attempts, accuracy, and performance insights.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/payment"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Upgrade Plan</span>

        <h2>Choose Premium Access</h2>

        <p>
          Unlock premium learning features and mentor guidance.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/payment-history"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Payment History</span>

        <h2>Your Purchase Records</h2>

        <p>
          View payment requests, approvals, and subscriptions.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/leaderboard"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Leaderboard</span>

        <h2>Top Student Rankings</h2>

        <p>
          Compare performance with top CTET/TET learners.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/ai-classroom"
  element={
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
  }
/>
<Route
  path="/admin"
  element={
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
        <button onClick={() => navigate("/admin/students")}>
          👨‍🎓 Students
        </button>

        <button onClick={() => navigate("/admin/notes")}>
          📘 Notes CMS
        </button>

        <button onClick={() => navigate("/admin/mock-tests")}>
          📝 Mock Tests CMS
        </button>

        <button onClick={() => navigate("/admin/current-affairs")}>
          📰 Current Affairs CMS
        </button>

        <button onClick={() => navigate("/admin/payments")}>
          💳 Payments
        </button>

        <button onClick={() => navigate("/admin/analytics")}>
          📊 Analytics
        </button>

        <button onClick={() => navigate("/admin/announcements")}>
          📢 Announcements
        </button>
      </div>
      <div style={{ marginTop: "30px" }}>
  <AdminPanel
    user={user}
    isAdmin={isAdmin}
    activeAdminTab={activeAdminTab}
    setActiveAdminTab={setActiveAdminTab}
    students={students || []}
    enquiries={enquiries || []}
    mockResults={mockResults || []}
    leaderboard={leaderboard || []}
    mockQuestions={mockQuestions || []}
    notesData={notesData || []}
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
  }
/>

<Route
  path="/admin/students"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Students</span>

        <h2>Student Management</h2>

        <p>
          Manage enrolled students, memberships,
          and learning activity.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/admin/notes"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Notes CMS</span>

        <h2>Notes Management System</h2>

        <p>
          Upload, edit, organize, and manage premium notes.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/admin/mock-tests"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Mock Tests CMS</span>

        <h2>Mock Test Management</h2>

        <p>
          Manage questions, test series,
          subject-wise exams, and analytics.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/admin/current-affairs"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Current Affairs CMS</span>

        <h2>Current Affairs Management</h2>

        <p>
          Upload and manage monthly current affairs PDFs.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/admin/payments"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Payments</span>

        <h2>Payment Approval System</h2>

        <p>
          Verify payments, manage premium access,
          and monitor subscriptions.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/admin/analytics"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Analytics</span>

        <h2>Platform Analytics</h2>

        <p>
          Monitor growth, student performance,
          revenue, and engagement analytics.
        </p>
      </div>
    </section>
  }
/>

<Route
  path="/admin/announcements"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">Announcements</span>

        <h2>Announcement Management</h2>

        <p>
          Publish updates, notices,
          and learning announcements.
        </p>
      </div>
    </section>
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
  path="/subjects/ctet-tet/courses"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Courses</span>

        <h2>Courses for CTET & TET Preparation</h2>

        <p>
          Choose structured learning programs, topic-wise courses,
          crash courses, and mentor-guided preparation paths.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/courses/ctet")}>
          📘 CTET Course
        </button>

        <button onClick={() => navigate("/courses/tet")}>
          🧑‍🏫 TET Course
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
    </section>
  }
/>

<Route
  path="/subjects/ctet-tet/notes"
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

      <div className="courseGrid">
        <button onClick={() => navigate("/subjects/ctet-tet/notes")}>
          📘 Open Notes Library
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
          💎 Unlock Premium Notes
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
      <div style={{ marginTop: "30px" }}>
  <NotesCMS
    notesData={notesData}
    firebaseNotes={firebaseNotes}
    handleNoteAccess={handleNoteAccess}
    isPremiumUser={isPremiumUser}
    setActiveSection={setActiveSection}
    activePlan={activePlan}
    userPlanType={userPlanType}
    hasPlanAccess={hasPlanAccess}
  />
</div>
    </section>
  }
/>

<Route
  path="/subjects/ctet-tet/mock-tests"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Mock Tests</span>

        <h2>Practice & Performance Center</h2>

        <p>
          Attempt subject-wise mock tests, PYQs, revision tests,
          and track your score with analytics.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/subjects/ctet-tet/mock-tests")}>
          📝 Open Mock Tests
        </button>

        <button onClick={() => navigate("/leaderboard")}>
          🏆 Leaderboard
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
      <div style={{ marginTop: "30px" }}>
  <MockTest />
</div>
    </section>
  }
/>

<Route
  path="/subjects/ctet-tet/current-affairs"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Current Affairs</span>

        <h2>Exam-Oriented Current Affairs</h2>

        <p>
          Monthly PDFs, education updates, NEP/NCF-related content,
          and teaching-exam focused current affairs.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/subjects/ctet-tet/current-affairs")}>
          📰 Open Current Affairs
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
      <div style={{ marginTop: "30px" }}>
      <CurrentAffairs
  currentAffairsList={currentAffairsList}
  fallbackCurrentAffairs={fallbackCurrentAffairs}
  handleNoteAccess={handleNoteAccess}
  isPremiumUser={isPremiumUser}
  userPlanType={userPlanType}
  hasPlanAccess={hasPlanAccess}
  setActiveSection={setActiveSection}
/>
</div>
    </section>
  }
/>

<Route
  path="/subjects/ctet-tet/pricing"
  element={
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">CTET / TET Plans</span>

        <h2>Choose Your CTET/TET Learning Plan</h2>

        <p>
          Select Basic, Premium, or Mentorship access for
          notes, tests, dashboard, AI classroom, and mentor guidance.
        </p>
      </div>

      <div className="courseGrid">
        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
          💎 View Plans
        </button>

        <button onClick={() => navigate("/payment")}>
          🧾 Upgrade Now
        </button>

        <button onClick={() => navigate("/subjects/ctet-tet")}>
          🔙 Back to CTET/TET Hub
        </button>
      </div>
      <div style={{ marginTop: "30px" }}>
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
          navigate("/subjects/ctet-tet/pricing");
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
   {activeSection && (
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

      <div className="learningHubCard">
        <div className="learningHubIcon">📖</div>
        <h3>Courses</h3>
        <p>
          CTET/TET learning paths and topic-wise preparation.
        </p>

        <button onClick={() => navigate("/subjects/ctet-tet/courses")}>
  Open
</button>
      </div>

      <div className="learningHubCard">
        <div className="learningHubIcon">🛣️</div>
        <h3>Learning Paths</h3>
        <p>
          Beginner to premium structured learning programs.
        </p>

        <button onClick={() => navigate("/learning-paths")}>
  Open
</button>
      </div>

      <div className="learningHubCard">
        <div className="learningHubIcon">📝</div>
        <h3>Notes</h3>
        <p>
          Premium and free revision notes for quick learning.
        </p>

        <button onClick={() => navigate("/subjects/ctet-tet/notes")}>
  Open
</button>
      </div>

    </div>

    <h2 className="learningHubHeading">
      Practice
    </h2>

    <div className="learningHubGrid">

      <div className="learningHubCard">
        <div className="learningHubIcon">✅</div>
        <h3>Mock Tests</h3>
        <p>
          Practice tests, score tracking and exam preparation.
        </p>

        <button onClick={() => navigate("/subjects/ctet-tet/mock-tests")}>
  Open
</button>
      </div>

      <div className="learningHubCard">
        <div className="learningHubIcon">📰</div>
        <h3>Current Affairs</h3>
        <p>
          Monthly PDF updates and exam-focused current affairs.
        </p>

        <button onClick={() => navigate("/subjects/ctet-tet/current-affairs")}>
  Open
</button>
      </div>

      <div className="learningHubCard">
        <div className="learningHubIcon">📊</div>
        <h3>My Progress</h3>
        <p>
          Student dashboard, analytics and learning progress.
        </p>

        <button
  onClick={() => navigate("/student-dashboard")}
>
  Open
</button>
      </div>

    </div>

    <h2 className="learningHubHeading">
      Premium
    </h2>

    <div className="learningHubGrid">

      <div className="learningHubCard">
        <div className="learningHubIcon">👑</div>
        <h3>Premium</h3>
        <p>
          Unlock full course, mock tests, notes and mentorship.
        </p>

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
  Open
</button>
      </div>

      <div className="learningHubCard">
        <div className="learningHubIcon">📣</div>
        <h3>Announcements</h3>
        <p>
          Latest updates, exam alerts and platform notifications.
        </p>

        <button onClick={() => navigate("/announcements")}>
  Open
</button>
      </div>

      <div className="learningHubCard">
        <div className="learningHubIcon">⚙️</div>
        <h3>Admin Panel</h3>
        <p>
          Manage students, notes, mock tests and analytics.
        </p>

        <button onClick={() => navigate("/admin")}>
  Open
</button>
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

        <button onClick={() => navigate("/subjects/ctet-tet/notes")}>
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

        <button onClick={() => navigate("/subjects/ctet-tet/courses")}>
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

        <button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
          Join Premium
        </button>
      </div>
    </div>
  </section>
)}
    {activeSection === "courses" && (
 <section className="coursePages" id="courses">
 <h2>CTET/TET Courses</h2>

 <p>
   Structured learning programs designed for concept clarity,
   mock practice, and exam success.
 </p>

 <div className="grid">
   {courses.map((course) => (
     <div className="course" key={course.id}>
       <span className="planTag">{course.badge}</span>

       <h3>{course.title}</h3>

       <p className="courseSubtitle">
         {course.subtitle}
       </p>

       <p>{course.desc}</p>

       <p>
         <strong>Level:</strong> {course.level}
       </p>

       <p>
         <strong>Lessons:</strong> {course.lessons}
       </p>

       <p>
         <strong>Mock Tests:</strong> {course.tests}
       </p>

       {course.badge === "FOUNDATION" ? (
         <p className="courseAccess">
           🔓 Included in BASIC Plan
         </p>
       ) : (
         <p className="courseAccess">
           🌟 Included in PREMIUM Plan
         </p>
       )}

       <button onClick={() => setSelectedCourse(course)}>
         View Details
       </button>
     </div>
   ))}
 </div>
</section>
)}
{activeSection === "notes" && (
  <section id="notes">
    <NotesCMS
      notesData={notesData}
      firebaseNotes={firebaseNotes}
      handleNoteAccess={handleNoteAccess}
      isPremiumUser={isPremiumUser}
      setActiveSection={setActiveSection}
      activePlan={activePlan}
      userPlanType={userPlanType}
      hasPlanAccess={hasPlanAccess}
    />
  </section>
)}

{activeSection === "mock-tests" && (
  <section id="mock-tests">
    <MockTest
      mockStarted={mockStarted}
      setMockStarted={setMockStarted}
      showResult={showResult}
      currentQuestion={currentQuestion}
      mockQuestions={mockQuestions || []}
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
      userPlanType={userPlanType}
hasPlanAccess={hasPlanAccess}
setActiveSection={setActiveSection}
    />
  </section>
)}
{activeSection === "pricing" && (
  <section id="pricing">
    <Pricing
      createPaymentRequest={createPaymentRequest}
      isPremiumUser={isPremiumUser}
      setActiveSection={setActiveSection}
    />
  </section>
)}
{activeSection === "contact" && (
  <section className="footerPanels contactScreen">

    <div className="footerPanelCard">
      <span>STUDENT REVIEWS</span>

      <h3>Trusted by CTET/TET learners.</h3>

      <p className="stars">⭐⭐⭐⭐⭐</p>

      <p>
        Visual notes se revision bahut fast ho gaya.
      </p>

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

      <button type="button">
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
)}


{activeSection === "admin-panel" && (
  <section id="admin-panel">
    <AdminPanel
      user={user}
      isAdmin={isAdmin}

      activeAdminTab={activeAdminTab}
      setActiveAdminTab={setActiveAdminTab}

      students={students || []}
      enquiries={enquiries || []}
      mockResults={mockResults || []}
      leaderboard={leaderboard || []}
      mockQuestions={mockQuestions || []}

      notesData={notesData || []}
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
  onClick={() => navigate("/subjects/ctet-tet/pricing")}
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
<header>
  <div className="brand">
  <img
  src="/logo-header.png"
  alt="AspireNest Academy"
  className="header-logo"
  loading="eager"
  decoding="async"
/>
  </div>

        <nav className={mobileMenuOpen ? "nav mobile-open" : "nav"}>
        <button
  onClick={() => {
    setProfileMenuOpen(false);
    navigate("/subjects/ctet-tet/courses");
  }}
>
  Courses
</button>

<button onClick={() => navigate("/subjects/ctet-tet/notes")}>
  Notes
</button>

<button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
  Pricing
</button>

          <button
  onClick={() => {
    setActiveSection(null);

    setTimeout(() => {
      document
        .getElementById("contact")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }}
>
  Contact
</button>
{user ? (
  <div
    className="profileMenuWrapper"
    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
  >
    <div className="profileAvatar">
      {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
    </div>

    <span className="profileName">
      {user?.displayName || user?.email?.split("@")[0]}
    </span>

    {profileMenuOpen && activeSection !== "student-profile" && (
      <div
  className={`profileDropdown ${
    profileMenuOpen ? "" : "hidden"
  }`}
  onMouseLeave={() => setProfileMenuOpen(false)}
>
    <button
      onClick={() => {
        setProfileMenuOpen(false);
        navigate("/student-dashboard");
      }}
    >
      My Dashboard
    </button>

    <button
      onClick={() => {
        setProfileMenuOpen(false);
        navigate("/subjects/ctet-tet/pricing");
      }}
    >
      Premium Access
    </button>

    {isAdmin(user) && (
      <button
        onClick={() => {
          setProfileMenuOpen(false);
          navigate("/admin");
        }}
      >
        Admin Panel
      </button>
    )}

    <button
      onClick={() => {
        setProfileMenuOpen(false);
        handleLogout();
      }}
    >
      Logout
    </button>
  </div>
)}
  </div>
) : (
  <button onClick={() => navigate("/student-profile")}>
  Login
</button>
)}
          <button
  className="mobile-menu-btn"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
>
  ☰
</button>

        </nav>
      </header>
      <div className="stickySectionNav">
      <button onClick={() => navigate("/subjects/ctet-tet/courses")}>
  Courses
</button>
<button onClick={() => navigate("/subjects/ctet-tet/notes")}>
  Notes
</button>
<button onClick={() => navigate("/subjects/ctet-tet/current-affairs")}>
  Current Affairs
</button>
<button onClick={() => navigate("/subjects/ctet-tet/mock-tests")}>
  Mock Tests
</button>
<button onClick={() => navigate("/subjects/ctet-tet/pricing")}>
  Premium
</button>
  <button onClick={() => navigate("/contact")}>
  Contact
</button>
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
  onClick={() => navigate("/subjects/ctet-tet/courses")}
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
  onClick={() => navigate("/subjects/ctet-tet/pricing")}
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
notesData={notesData}
firebaseNotes={firebaseNotes}
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
  notesData={notesData}
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
/>
)}
<CurrentAffairs
  currentAffairsList={currentAffairsList}
  fallbackCurrentAffairs={fallbackCurrentAffairs}
  handleNoteAccess={handleNoteAccess}
  isPremiumUser={isPremiumUser}
  userPlanType={userPlanType}
hasPlanAccess={hasPlanAccess}
setActiveSection={setActiveSection}
/>




</div>
)}
  </React.Suspense>
);
}
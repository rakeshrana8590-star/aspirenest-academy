import { auth, db } from "./firebase";
import { storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
signInWithPopup
} from "firebase/auth";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import './style.css';
import currentAffairsPdf from "./assets/pdfs/CA MARCH 26.pdf";
export default function App() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [mockStarted, setMockStarted] = useState(false);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [selectedAnswer, setSelectedAnswer] = useState("");
const [score, setScore] = useState(0);
const [showResult, setShowResult] = useState(false);
const [showAnswer, setShowAnswer] = useState(false);
const [timeLeft, setTimeLeft] = useState(60);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
const [mobile, setMobile] = useState("");
const [contactEmail, setContactEmail] = useState("");
  const [user, setUser] = useState(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const adminEmail = "aspirenestplatform@gmail.com";
  const [students, setStudents] = useState([]);
const [enquiries, setEnquiries] = useState([]);
const [mockResults, setMockResults] = useState([]);
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
const [activeAdminTab, setActiveAdminTab] = useState("Dashboard");
const [adminNoteTitle, setAdminNoteTitle] = useState("");
const [adminNoteCategory, setAdminNoteCategory] = useState("");
const [adminNoteType, setAdminNoteType] = useState("FREE");
const [adminNotePages, setAdminNotePages] = useState("");
const [adminNotePdf, setAdminNotePdf] = useState("");
const [uploadingPdf, setUploadingPdf] = useState(false);
const [firebaseNotes, setFirebaseNotes] = useState([]);
const [currentAffairsList, setCurrentAffairsList] = useState([]);
const [currentTitle, setCurrentTitle] = useState("");
const [currentMonth, setCurrentMonth] = useState("");
const [currentType, setCurrentType] = useState("FREE");
const [currentPages, setCurrentPages] = useState("");
const [currentPdf, setCurrentPdf] = useState("");
const [uploadingCurrentPdf, setUploadingCurrentPdf] = useState(false);
const [editingNoteId, setEditingNoteId] = useState(null);
const [editingCurrentId, setEditingCurrentId] = useState(null);
const [announcementTitle, setAnnouncementTitle] = useState("");
const [announcementMessage, setAnnouncementMessage] = useState("");
const [announcements, setAnnouncements] = useState([]);
const [paymentHistory, setPaymentHistory] = useState([]);
  const provider = new GoogleAuthProvider();
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    
      if (currentUser) {
        checkPremiumAccess(currentUser);
        loadUserMockResults(currentUser.email);
        setTimeout(() => {
          checkPremiumAccess(currentUser);
        }, 1000);
        loadLeaderboard();
        loadMockQuestions();
        loadFirebaseNotes();
        loadCurrentAffairs();
        loadAnnouncements();
        loadPaymentHistory();
      }
    });
  
    return () => unsubscribe();
  }, []);
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
      await signInWithEmailAndPassword(auth, email, password);
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
    if (note.type === "PREMIUM" && !isPremiumUser) {
      alert(
        "This is premium content. Please upgrade to access this note."
      );
      return;
    }
  
    if (note.pdf === "#") {
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
        createdAt: new Date(),
      });
  
      loadPaymentHistory();
    } catch (error) {
      alert(error.message);
    }
  };
  const unlockPremiumAccess = async () => {
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
          subscriptionType: "PREMIUM",
          purchasedCourses: ["Premium Notes"],
          purchaseDate: purchaseDate,
          expiryDate: expiryDate,
          premiumStatus: "ACTIVE",
        },
        { merge: true }
      );
  
      setIsPremiumUser(true);
  
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
  const loadMockQuestions = async (subject = selectedSubject) => {
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
      }));
  
      setMockQuestions(questions);
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
  const loadPaymentHistory = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "payments")
      );
  
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setPaymentHistory(data);
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
  const handleDeleteNote = (noteId) => {
    const updatedNotes = notesData.filter((note) => note.id !== noteId);
  
    alert("Note deleted from UI successfully ✅");
  
    // Future: Firebase notes collection delete yaha add hoga
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
    } catch (error) {
      alert(error.message);
    }
  };
  const courses = [
    {
      id: "ctet-paper-1",
      title: "CTET Paper I",
      level: "Foundation",
      price: "Free",
      category: "CTET",
      desc: "Class 1 to 5 teaching aspirants ke liye complete foundation course.",
      lessons: 24,
      tests: 10,
      badge: "FREE",
      points: ["CDP", "Language I & II", "Mathematics", "EVS", "Mock Tests"],
    },
    {
      id: "ctet-paper-2",
      title: "CTET Paper II",
      level: "Intermediate",
      price: "₹499",
      category: "CTET",
      desc: "Class 6 to 8 aspirants ke liye subject-wise exam preparation.",
      lessons: 32,
      tests: 15,
      badge: "BASIC",
      points: ["CDP", "Language I & II", "Maths/Science", "Social Science", "PYQ"],
    },
    {
      id: "state-tet",
      title: "State TET / MAHA TET",
      level: "Exam Focused",
      price: "₹1499",
      category: "State TET",
      desc: "State TET pattern, syllabus, PYQ aur mock test preparation.",
      lessons: 40,
      tests: 20,
      badge: "PREMIUM",
      points: ["State Pattern", "Syllabus", "Practice Sets", "PYQ", "Strategy"],
    },
  ];
  const notesData = [
    {
      id: 1,
      title: "Child Development Notes",
      category: "CDP",
      type: "FREE",
      pages: 42,
      pdf: "#",
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
  ];

  const currentAffairsData = [
    {
      id: 1,
      title: "March Current Affairs",
      month: "March 2026",
      type: "FREE",
      pages: 11,
      pdf: currentAffairsPdf,
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
  const leaderboardData = [
    {
      rank: 1,
      name: "Priya Sharma",
      score: "98%",
      badge: "Topper",
    },
    {
      rank: 2,
      name: "Amit Patel",
      score: "92%",
      badge: "Excellent",
    },
    {
      rank: 3,
      name: "Neha Verma",
      score: "88%",
      badge: "Great",
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
      
      const pieColors = ["#16a34a", "#e5e7eb"];
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
  return (
    <div className={darkMode ? "app dark" : "app"}>
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
              <a href="#pricing" className="btnLink">
                Join Course
              </a>

              <a
                href="https://wa.me/919999999999"
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
        <h1>AspireNest Academy</h1>

        <nav>
          <a href="#ctet">Courses</a>

          <a href="#notes">Notes</a>

          <a href="#pricing">Pricing</a>

          <a href="#contact">Contact</a>
          <a href="#login">Login</a>
          <button
  className="themeBtn"
  onClick={() => setDarkMode(!darkMode)}
>
  {darkMode ? "☀️" : "🌙"}
</button>
        </nav>
      </header>
      <section className="hero">
        <div>
          <span className="badge">CTET • TET • B.Ed • D.El.Ed</span>

          <h2>
            Crack CTET & TET
            <br />
            with Smart Learning
          </h2>

          <p>Bilingual preparation platform for Indian students.</p>

          <div className="buttons">
            <a href="#ctet" className="btnLink">
              Start Learning
            </a>
            <a href="#resources" className="btnLink outline">
              Free Notes
            </a>
          </div>
        </div>

        <div className="card">
          <h3>Today's Goal</h3>
          <p>Child Development Practice</p>

          <div className="progress">
            <div className="fill"></div>
          </div>

          <span>75% Completed</span>
        </div>
      </section>
      <section className="stats">
        <div className="statBox">
          <h1>10K+</h1>
          <p>Students</p>
        </div>

        <div className="statBox">
          <h1>150+</h1>
          <p>Visual Notes</p>
        </div>

        <div className="statBox">
          <h1>50+</h1>
          <p>Mock Tests</p>
        </div>

        <div className="statBox">
          <h1>95%</h1>
          <p>Success Rate</p>
        </div>
      </section>{' '}
      <section className="mentor" id="about">
        <div>
          <span className="badge">About Mentor</span>
          <h2>Learn from an Experienced Educator</h2>
          <p>
            CTET/TET aspirants ke liye exam-focused, bilingual aur practical
            teaching approach. Concept clarity, pedagogy understanding, mock
            practice aur revision system par focus.
          </p>
        </div>

        <div className="mentorCard">
          <h3>Teaching Approach</h3>
          <ul>
            <li>✅ Simple Hindi + English explanation</li>
            <li>✅ CTET/TET syllabus-aligned content</li>
            <li>✅ Visual notes and quick revision</li>
            <li>✅ Practice-based preparation</li>
          </ul>
        </div>
      </section>
      <section className="coursePages" id="ctet">
  <h2>CTET/TET Course Pages</h2>

  <p className="sectionText">
    Structured courses with lessons, mock tests and exam-focused preparation.
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

            <a href="#resources" className="btnLink">
              Start Free
            </a>
          </div>

          <div className="planCard">
            <span className="planTag orange">MINI COURSE</span>

            <h3>Topic-wise Courses</h3>

            <ul>
              <li>🧠 CDP Concepts</li>
              <li>📚 Pedagogy Lessons</li>
              <li>🎯 PYQ Practice</li>
            </ul>

            <a href="#ctet" className="btnLink">
              Explore Courses
            </a>
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

            <a href="#pricing" className="btnLink">
              Join Premium
            </a>
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
      <section className="mockPyq premiumMock" id="mocktest">
  <div className="mockIntro">
    <span className="badge">Free Practice Test</span>
    <h2>CTET Mock Test</h2>
    <p>
      Exam-style MCQs, instant scoring and smart practice experience.
    </p>

    {mockStarted && !showResult && (
      <div className="mockProgress">
        <div
          className="mockProgressFill"
          style={{
            width: `${((currentQuestion + 1) / mockQuestions.length) * 100}%`,
          }}
        ></div>
      </div>
    )}

{mockStarted && !showResult && (
  <>
    <p className="mockTimer">
      ⏱️ Time Left: {timeLeft}s
    </p>

    <p className="mockCounter">
      Score: {score} / {mockQuestions.length}
    </p>
  </>
)}
  </div>
  {mockQuestions.length === 0 && (
  <p className="sectionText">
    Loading mock questions...
  </p>
)}
<div className="subjectFilters">
  <button
    className="subjectBtn"
    onClick={() => {
      setSelectedSubject("CDP");
      loadMockQuestions("CDP");
    }}
  >
    CDP
  </button>

  <button
    className="subjectBtn"
    onClick={() => {
      setSelectedSubject("Maths");
      loadMockQuestions("Maths");
    }}
  >
    Maths
  </button>

  <button
    className="subjectBtn"
    onClick={() => {
      setSelectedSubject("EVS");
      loadMockQuestions("EVS");
    }}
  >
    EVS
  </button>

  <button
    className="subjectBtn"
    onClick={() => {
      setSelectedSubject("Language");
      loadMockQuestions("Language");
    }}
  >
    Language
  </button>
</div>
  <div className="mockBox premiumMockBox">
    {!mockStarted ? (
      <>
        <h3>Ready to start?</h3>
        <p>3 demo questions se practice start karo.</p>
        <button
  className="btnLink"
  onClick={() => {
    setMockStarted(true);
    setTimeLeft(60);
  }}
>
          Start Mock Test
        </button>
      </>
    ) : showResult ? (
      <>
      <h3>Test Completed 🎉</h3>
    
      <div className="resultCircle">
        <span>{percentage}%</span>
      </div>
    
      <p className="resultScore">
        Score: {score} / {mockQuestions.length}
      </p>
    
      <h4 className="performanceLevel">
        {performanceLevel}
      </h4>
    
      <p className="motivationalMessage">
        {motivationalMessage}
      </p>
    
      <button className="btnLink" onClick={restartMockTest}>
        Restart Test
      </button>
    </>
    ) : (
      <>
        <span className="questionTag">
          Question {currentQuestion + 1} of {mockQuestions.length}
        </span>

        <h3>{mockQuestions[currentQuestion].question}</h3>

        <div className="options">
          {mockQuestions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={`optionBtn ${
                showAnswer && option === mockQuestions[currentQuestion].answer
                  ? "correctOption"
                  : showAnswer && option === selectedAnswer
                  ? "wrongOption"
                  : selectedAnswer === option
                  ? "activeOption"
                  : ""
              }`}
              onClick={() => setSelectedAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <button className="btnLink" onClick={handleAnswerSubmit}>
  Submit Answer
</button>
      </>
    )}
  </div>
</section>
<section className="leaderboardSection">
  <div className="leaderboardHeader">
    <span className="badge">Top Performers</span>

    <h2>Mock Test Leaderboard</h2>

    <p>
      Highest scoring students from recent CTET/TET mock practice.
    </p>
  </div>

  <div className="leaderboardGrid">
  {leaderboard.map((student, index) => (
   <div className="leaderCard" key={student.id}>
   <div className="rankBadge">
     #{index + 1}
   </div>
 
   <h3>{student.email}</h3>
 
   <p className="leaderScore">
     {student.percentage}%
   </p>
 
   <span className="leaderTag">
     Top Score
   </span>
 </div>
    ))}
  </div>
</section>
      <section className="resources" id="resources">
        <h2>Free Resources</h2>
        <p className="sectionText">
          Free notes aur study tools se preparation start karein.
        </p>

        <div className="grid">
          <div className="course">📘 Free CDP Notes</div>
          <div className="course">📅 7-Day Study Plan</div>
          <div className="course">📝 Free Mock Test</div>
          <div className="course">📄 PYQ Starter Pack</div>
          <div className="course">🎯 Exam Strategy Guide</div>
          <div className="course">✅ Revision Checklist</div>
        </div>
      </section>
      <a
        className="whatsapp"
        href="https://wa.me/919999999999?text=Hello%20Smart%20TET%20Academy,%20I%20want%20details%20about%20CTET/TET%20courses."
        target="_blank"
      >
        💬 WhatsApp Enquiry
      </a>
      <section className="premium">
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
      {user && (
<section className="studentDashboard">
        <div className="dashboardSidebar">
          <h3>Dashboard</h3>
          <div className="userEmail">
  <p>Welcome, {user.email}</p>

  <span
    style={{
      display: "inline-block",
      marginTop: "8px",
      padding: "6px 12px",
      borderRadius: "20px",
      background: isPremiumUser
        ? "#16a34a"
        : "#6b7280",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "bold",
    }}
  >
    {isPremiumUser
      ? "🌟 PREMIUM MEMBER"
      : "FREE MEMBER"}
  </span>
  {isPremiumUser && (
  <p
    style={{
      marginTop: "8px",
      fontSize: "12px",
      color: "#16a34a",
      fontWeight: "bold",
    }}
  >
    Premium Access Active ✅
  </p>
)}
</div>
          <ul>
            <li>📚 My Courses</li>
        
            <li>📝 Mock Tests</li>
            <li>📈 Progress</li>
            <li onClick={handlePremiumSectionAccess}>
  📥 Download Notes {isPremiumUser ? "✅" : "🔒"}
</li>
<li onClick={handlePremiumSectionAccess}>
  🎯 Revision Planner {isPremiumUser ? "✅" : "🔒"}
</li>

            <li>🏆 Certificates</li>
            <li>📢 Announcements</li>
            <li>💬 Help Support</li>
            <button className="logoutBtn" onClick={handleLogout}>
  Logout
</button>
{user?.email === adminEmail && (
  <button className="logoutBtn" onClick={loadAdminData}>
    Load Admin Data
  </button>
)}
          </ul>
        </div>

        <div className="dashboardContent">
          <div className="dashboardTop">
            <div className="dashboardStat">
              <h2>82%</h2>
              <p>Course Completion</p>
            </div>

            <div className="dashboardStat">
              <h2>14</h2>
              <p>Mock Tests Completed</p>
            </div>

            <div className="dashboardStat">
              <h2>96%</h2>
              <p>Average Accuracy</p>
            </div>
          </div>

          <div className="dashboardCards">
            <div className="dashboardCard">
              <h3>Upcoming Test</h3>
              <p>CDP Full Mock Test • Sunday • 7 PM</p>
            </div>

            <div className="dashboardCard">
              <h3>Current Course</h3>
              <p>Inclusive Education Masterclass</p>
            </div>

            <div className="dashboardCard">
              <h3>Revision Target</h3>
              <p>Complete Piaget + Kohlberg Today</p>
            </div>

            <div className="dashboardCard">
              <h3>Achievements</h3>
              <p>🔥 7-Day Study Streak Active</p>
            </div>
            <div className="dashboardCard">
  <h3>Mock Tests Attempted</h3>

  <p>{mockResults.length}</p>
</div>

<div className="dashboardCard">
  <h3>Latest Accuracy</h3>

  <p>
    {mockResults.length > 0
      ? `${mockResults[mockResults.length - 1].percentage}%`
      : "No Tests Yet"}
  </p>
</div>
<div className="dashboardCard">
  <h3>Average Accuracy</h3>

  <p>{averageAccuracy}%</p>
</div>

<div className="dashboardCard">
  <h3>Highest Score</h3>

  <p>{highestScore}%</p>
</div>

<div className="dashboardCard">
  <h3>Total Attempts</h3>

  <p>{totalMockAttempts}</p>
</div>
<div className="dashboardCard">
  <h3>Daily Study Streak</h3>

  <p>🔥 {dailyStreak} Day Streak</p>
</div>
<div className="dashboardCard">
  <h3>Weekly Growth</h3>

  <p>{weeklyGrowthMessage}</p>
</div>
<div className="dashboardCard">
  <h3>Predicted Rank</h3>

  <p>{estimatedRank}</p>

  <small>{rankPredictionMessage}</small>
</div>

<div className="dashboardCard">
  <h3>Study Time Tracker</h3>
  <div className="dashboardCard">
  <h3>Purchase History</h3>

  {paymentHistory.filter((payment) => payment.email === user.email).length > 0 ? (
    paymentHistory
      .filter((payment) => payment.email === user.email)
      .map((payment) => (
        <div key={payment.id}>
          <p>✅ {payment.plan}</p>
          <p>💰 ₹{payment.amount}</p>
          <p>🧾 {payment.status}</p>
        </div>
      ))
  ) : (
    <p>No purchases yet.</p>
  )}
</div>
  <p>{estimatedStudyHours} Hours</p>

  <small>{studyTimeMessage}</small>
</div>
<div className="dashboardCard">
  <h3>AI Study Planner</h3>

  <ul className="studyPlanList">
    {aiStudyPlan.map((task, index) => (
      <li key={index}>✅ {task}</li>
    ))}
  </ul>
</div>
<div className="dashboardCard">
  <h3>Performance Insight</h3>

  <p>{analyticsMessage}</p>
</div>
<div className="dashboardCard">
  <h3>Weakest Subject</h3>

  <p>{weakestSubject}</p>
</div>
<div className="dashboardCard">
  <h3>Smart Recommendation</h3>

  <p>{smartRecommendation}</p>
</div>
<div className="analyticsChartCard">
  <h3>Accuracy Progress</h3>

  <ResponsiveContainer width="100%" height={260}>
  <LineChart data={accuracyChartData}>
    <XAxis dataKey="test" />
    <YAxis />
    <Tooltip />

    <Line
      type="monotone"
      dataKey="accuracy"
      stroke="#16a34a"
      strokeWidth={3}
    />
  </LineChart>
</ResponsiveContainer>
</div>

<div className="analyticsChartCard">
  <h3>Subject Comparison</h3>

  <div className="accuracyBars">
    {subjectPerformance.length > 0 ? (
      subjectPerformance.map((item) => (
        <div className="accuracyBarItem" key={item.subject}>
          <span>{item.subject}</span>

          <div className="accuracyBar">
            <div
              className="accuracyFill"
              style={{ width: `${item.average}%` }}
            ></div>
          </div>

          <strong>{item.average}%</strong>
        </div>
      ))
    ) : (
      <p>No subject data yet.</p>
    )}
  </div>
</div>

<div className="analyticsChartCard">
  <h3>Accuracy Overview</h3>

  <div className="pieChartBox">
  <ResponsiveContainer width="100%" height={260}>
    <PieChart>
      <Pie
        data={pieChartData}
        dataKey="value"
        nameKey="name"
        innerRadius={60}
        outerRadius={90}
        paddingAngle={4}
      >
        {pieChartData.map((entry, index) => (
          <Cell key={entry.name} fill={pieColors[index]} />
        ))}
      </Pie>

      <Tooltip />
    </PieChart>
  </ResponsiveContainer>

  <p>
    Overall accuracy based on your mock test attempts.
  </p>
</div>
</div>
            {user?.email === adminEmail && (
              <div className="adminProPanel">
  <div className="adminProHeader">
    <div>
      <span className="badge">Admin Panel PRO</span>
      <h2>Platform Control Center</h2>
      <p>Manage students, content, mock tests, payments and announcements.</p>
    </div>
  </div>

  <div className="adminTabs">
  ["Dashboard", "Students", "Enquiries", "Notes", "Current Affairs", "Mock Tests", "Analytics", "Payments", "Announcements"].map((tab) => (
      <button
        key={tab}
        className={activeAdminTab === tab ? "adminTab activeAdminTab" : "adminTab"}
        onClick={() => setActiveAdminTab(tab)}
      >
        {tab}
      </button>
    ))}
  </div>
  {activeAdminTab === "Dashboard" && (
  <div className="adminOverviewGrid">
    <div className="dashboardCard">
      <h3>Total Students</h3>
      <p>{students.length}</p>
    </div>

    <div className="dashboardCard">
      <h3>Total Enquiries</h3>
      <p>{enquiries.length}</p>
    </div>
    <div className="dashboardCard">
  <h3>Total Mock Results</h3>

  <p>{leaderboard.length}</p>
</div>

<div className="dashboardCard">
  <h3>Admin Mode</h3>

  <p>Active</p>
</div>
    </div>
)}
{activeAdminTab === "Students" && (
  <div className="adminStudentsSection">
    <h3>Registered Students</h3>

    <div className="adminStudentsGrid">
      {students.length > 0 ? (
        students.map((student, index) => (
          <div className="studentCard" key={index}>
            <h4>{student.name || "Student"}</h4>

            <p>📧 {student.email}</p>

            <p>
              ⭐ {student.isPremium ? "Premium User" : "Free User"}
            </p>

            <p>
              📊 Mock Attempts:
              {" "}
              {student.mockAttempts || 0}
            </p>
            <div className="studentActions">
  <button
    className="btnLink"
    onClick={() =>
      handlePremiumControl(student.email, true)
    }
  >
    Make Premium
  </button>

  <button
    className="btnLink"
    onClick={() =>
      handlePremiumControl(student.email, false)
    }
  >
    Remove Premium
  </button>
</div>
          </div>
        ))
      ) : (
        <p>No students found.</p>
      )}
    </div>
  </div>
)}
{activeAdminTab === "Enquiries" && (
  <div className="adminStudentsSection">
    <h3>Student Enquiries</h3>

    <div className="adminStudentsGrid">
      {enquiries.length > 0 ? (
        enquiries.map((enquiry, index) => (
          <div className="studentCard" key={index}>
            <h4>{enquiry.fullName || "Student Enquiry"}</h4>

            <p>📞 {enquiry.mobile}</p>

            <p>📧 {enquiry.email}</p>

            <p>
              📅{" "}
              {enquiry.createdAt?.toDate
                ? enquiry.createdAt.toDate().toLocaleDateString()
                : "Date not available"}
            </p>
          </div>
        ))
      ) : (
        <p>No enquiries found.</p>
      )}
    </div>
  </div>
)}
{activeAdminTab === "Mock Tests" && (
    <div className="adminQuestionForm">
  <h3>Add Mock Question</h3>
  <div className="adminStudentsSection">
  <h3>Current Mock Questions</h3>

  <div className="adminStudentsGrid">
    {mockQuestions.length > 0 ? (
      mockQuestions.map((question, index) => (
        <div className="studentCard" key={question.id || index}>
          <h4>{question.subject || "General"}</h4>

          <p>{question.question}</p>

          <button
            className="btnLink"
            onClick={() => handleDeleteMockQuestion(index)}
          >
            Delete Question
          </button>
        </div>
      ))
    ) : (
      <p>No questions found.</p>
    )}
  </div>
</div>
  <input
    placeholder="Question"
    value={adminQuestion}
    onChange={(e) => setAdminQuestion(e.target.value)}
  />

  <input
    placeholder="Option 1"
    value={adminOption1}
    onChange={(e) => setAdminOption1(e.target.value)}
  />

  <input
    placeholder="Option 2"
    value={adminOption2}
    onChange={(e) => setAdminOption2(e.target.value)}
  />

  <input
    placeholder="Option 3"
    value={adminOption3}
    onChange={(e) => setAdminOption3(e.target.value)}
  />

  <input
    placeholder="Option 4"
    value={adminOption4}
    onChange={(e) => setAdminOption4(e.target.value)}
  />

  <input
    placeholder="Correct Answer"
    value={adminAnswer}
    onChange={(e) => setAdminAnswer(e.target.value)}
  />

  <select
    value={adminSubject}
    onChange={(e) => setAdminSubject(e.target.value)}
  >
    <option>CDP</option>
    <option>Maths</option>
    <option>EVS</option>
    <option>Language</option>
    <option>Pedagogy</option>
    <option>State TET</option>
  </select>

  <select
    value={adminLevel}
    onChange={(e) => setAdminLevel(e.target.value)}
  >
    <option>Easy</option>
    <option>Medium</option>
    <option>Hard</option>
  </select>

  <button className="btnLink" onClick={handleAddMockQuestion}>
    Add Question
  </button>
  </div>
  )}
  {activeAdminTab === "Notes" && (
  <div className="adminQuestionForm">
    <h3>Notes CMS</h3>

    <input
      placeholder="Note Title"
      value={adminNoteTitle}
      onChange={(e) => setAdminNoteTitle(e.target.value)}
    />

    <input
      placeholder="Category"
      value={adminNoteCategory}
      onChange={(e) => setAdminNoteCategory(e.target.value)}
    />

    <input
      placeholder="Pages"
      value={adminNotePages}
      onChange={(e) => setAdminNotePages(e.target.value)}
    />

<div className="pdfUploadBox">
  <input
    type="file"
    accept="application/pdf"
    onChange={async (e) => {
      const file = e.target.files[0];

      if (!file) return;

      const uploadedUrl = await handleUploadPdf(file);

      if (uploadedUrl) {
        setAdminNotePdf(uploadedUrl);
      }
    }}
    
  />
  {activeAdminTab === "Current Affairs" && (
  <div className="adminQuestionForm">
    <h3>Current Affairs CMS</h3>

    <input
      placeholder="Current Affairs Title"
      value={currentTitle}
      onChange={(e) => setCurrentTitle(e.target.value)}
    />

    <input
      placeholder="Month"
      value={currentMonth}
      onChange={(e) => setCurrentMonth(e.target.value)}
    />

    <input
      placeholder="Pages"
      value={currentPages}
      onChange={(e) => setCurrentPages(e.target.value)}
    />

    <div className="pdfUploadBox">
      <input
        type="file"
        accept="application/pdf"
        onChange={async (e) => {
          const file = e.target.files[0];

          if (!file) return;

          const uploadedUrl =
            await handleUploadCurrentPdf(file);

          if (uploadedUrl) {
            setCurrentPdf(uploadedUrl);
          }
        }}
      />

      {uploadingCurrentPdf && (
        <p>Uploading PDF...</p>
      )}

      {currentPdf && (
        <p style={{ color: "#16a34a" }}>
          Current Affairs PDF uploaded ✅
        </p>
      )}
    </div>

    <select
      value={currentType}
      onChange={(e) => setCurrentType(e.target.value)}
    >
      <option>FREE</option>
      <option>PREMIUM</option>
    </select>

    <button
      className="btnLink"
      onClick={handleSaveCurrentAffairs}
      disabled={uploadingCurrentPdf}
    >
      {uploadingCurrentPdf
  ? "Uploading PDF..."
  : editingCurrentId
  ? "Update Current Affairs"
  : "Save Current Affairs"}
    </button>

    <div className="adminStudentsSection">
      <h3>Current Affairs Library</h3>

      <div className="adminStudentsGrid">
        {currentAffairsList.length > 0 ? (
          currentAffairsList.map((item) => (
            <div
              className="studentCard"
              key={item.id}
            >
              <h4>{item.title}</h4>

              <p>📅 {item.month}</p>

              <p>📄 {item.pages} Pages</p>

              <p>⭐ {item.type}</p>
              <button
  className="btnLink"
  onClick={() => handleEditCurrentAffairs(item)}
>
  Edit Current Affairs
</button>
            </div>
          ))
        ) : (
          <p>No current affairs found.</p>
        )}
      </div>
    </div>
  </div>
)}

  {uploadingPdf && (
    <p>Uploading PDF...</p>
  )}

  {adminNotePdf && (
    <p style={{ color: "#16a34a" }}>
      PDF uploaded successfully ✅
    </p>
  )}
</div>

    <select
      value={adminNoteType}
      onChange={(e) => setAdminNoteType(e.target.value)}
    >
      <option>FREE</option>
      <option>PREMIUM</option>
    </select>

    <button
  className="btnLink"
  onClick={handleSaveNote}
  disabled={uploadingPdf}
>
{uploadingPdf
  ? "Uploading PDF..."
  : editingNoteId
  ? "Update Note"
  : "Save Note"}
</button>
    <div className="adminStudentsSection">
  <h3>Current Notes</h3>

  <div className="adminStudentsGrid">
  {[...notesData, ...firebaseNotes].map((note) => (
      <div className="studentCard" key={note.id}>
        <h4>{note.title}</h4>

        <p>📂 {note.category}</p>

        <p>⭐ {note.type}</p>

        <button
          className="btnLink"
          onClick={() => handleDeleteNote(note.id)}
        >
          Delete Note
        </button>
        <button
  className="btnLink"
  onClick={() => handleEditNote(note)}
>
  Edit Note
</button>
      </div>
    ))}
  </div>
</div>
  </div>
)}
{activeAdminTab === "Analytics" && (
  <div className="adminStudentsSection">
    <h3>Admin Analytics</h3>

    <div className="adminOverviewGrid">
      <div className="dashboardCard">
        <h3>Total Test Records</h3>
        <p>{leaderboard.length}</p>
      </div>

      <div className="dashboardCard">
        <h3>Total Students</h3>
        <p>{students.length}</p>
      </div>

      <div className="dashboardCard">
        <h3>Total Enquiries</h3>
        <p>{enquiries.length}</p>
      </div>

      <div className="dashboardCard">
        <h3>Platform Status</h3>
        <p>Active</p>
      </div>
    </div>
  </div>
)}
{activeAdminTab === "Payments" && (
  <div className="adminStudentsSection">
    <h3>Payment Monitoring</h3>

    <div className="adminOverviewGrid">
      <div className="dashboardCard">
        <h3>Revenue Mode</h3>
        <p>Live Tracking Active</p>
      </div>

      <div className="dashboardCard">
      <div className="dashboardCard">
  <h3>Total Payments</h3>
  <p>{paymentHistory.length}</p>
</div>
        <h3>Premium System</h3>
        <p>Enabled</p>
      </div>

      <div className="dashboardCard">
        <h3>Payment Gateway</h3>
        <p>Razorpay Foundation</p>
      </div>

      <div className="dashboardCard">
        <h3>Subscription Type</h3>
        <p>Premium Notes</p>
      </div>
    </div>
    <div className="adminStudentsSection">
  <h3>Recent Payment History</h3>

  <div className="adminStudentsGrid">
    {paymentHistory.length > 0 ? (
      paymentHistory.map((payment) => (
        <div className="studentCard" key={payment.id}>
          <h4>{payment.plan}</h4>

          <p>📧 {payment.email}</p>

          <p>💰 ₹{payment.amount}</p>

          <p>✅ {payment.status}</p>

          <p>🧾 {payment.paymentId}</p>
        </div>
      ))
    ) : (
      <p>No payment history found.</p>
    )}
  </div>
</div>
  </div>
)}
{activeAdminTab === "Announcements" && (
  <div className="adminQuestionForm">
    <h3>Announcements System</h3>

    <input
      placeholder="Announcement Title"
      value={announcementTitle}
      onChange={(e) => setAnnouncementTitle(e.target.value)}
    />

    <textarea
      placeholder="Announcement Message"
      value={announcementMessage}
      onChange={(e) =>
        setAnnouncementMessage(e.target.value)
      }
      rows={5}
    />

    <button
      className="btnLink"
      onClick={handleAddAnnouncement}
    >
      Publish Announcement
    </button>

    <div className="announcementList">
      {announcements.map((item) => (
        <div className="studentCard" key={item.id}>
          <h4>{item.title}</h4>

          <p>{item.message}</p>
          <button
  className="btnLink"
  onClick={() => handleDeleteAnnouncement(item.id)}
>
  Delete Announcement
</button>
        </div>
      ))}
    </div>
  </div>
)}
</div>
)}
          </div>
        </div>
      </section>
      )}
     <section id="notes" className="notesSection">
  <h2>Premium Notes Library</h2>

  <p className="sectionText">
    Smart bilingual notes with visual learning and quick revision support.
  </p>

  <div className="grid">
  {[...notesData, ...firebaseNotes].map((note) => (
      <div className="course" key={note.id}>
        <span className="planTag">{note.type}</span>

        <h3>{note.title}</h3>

        <p>📂 Category: {note.category}</p>

        <p>📄 Pages: {note.pages}</p>

        <button
  className="btnLink"
  onClick={() => handleNoteAccess(note)}
>
{note.type === "PREMIUM" && !isPremiumUser
  ? "🔒 Premium Only"
  : note.type === "PREMIUM"
  ? "🌟 Open Premium PDF"
  : "📥 Download PDF"}
</button>
      </div>
    ))}
  </div>
</section>
<section id="current-affairs" className="currentAffairs">
  <div className="currentHeader">
    <span className="badge">Monthly Updates</span>

    <h2>Current Affairs Library</h2>

    <p>
      Latest bilingual current affairs PDFs for CTET/TET preparation.
    </p>
  </div>

  <div className="currentGrid">
  {currentAffairsList.length === 0 && (
  <p className="sectionText">
    No current affairs uploaded yet.
  </p>
)}
  {currentAffairsList.map((item) => (
      <div className="currentCard" key={item.id}>
        <div className="currentTop">
          <span className="planTag">{item.type}</span>
          <span className="monthTag">{item.month}</span>
        </div>

        <h3>{item.title}</h3>

        <div className="currentInfo">
          <p>📄 {item.pages} Pages</p>
        </div>

        <a
          href={item.pdf}
          target="_blank"
          rel="noreferrer"
          className="btnLink"
        >
          Open PDF
        </a>
      </div>
    ))}
  </div>
</section>
      <section id="pricing" className="pricingPro">
        <h2>Choose Your Learning Plan</h2>

        <p className="sectionText">
          Flexible pricing for every CTET/TET aspirant.
        </p>

        <div className="pricingGrid">
          <div className="pricingCard">
            <span className="priceBadge">FREE</span>

            <h3>Starter</h3>

            <h1>₹0</h1>

            <ul>
              <li>📘 Sample Notes</li>
              <li>📝 1 Mock Test</li>
              <li>📅 Study Plan</li>
            </ul>
            <a href="#resources" className="btnLink">
              Start Free
            </a>
          </div>

          <div className="pricingCard">
            <span className="priceBadge orange">BASIC</span>

            <h3>Topic-wise Courses</h3>

            <h1>₹499</h1>

            <ul>
              <li>🎯 Topic Modules</li>
              <li>📚 PYQ Practice</li>
              <li>📝 Mini Tests</li>
            </ul>

            <a href="#contact" className="btnLink">
              Join Now
            </a>
          </div>

          <div className="pricingCard featuredPrice">
            <span className="priceBadge premium">MOST POPULAR</span>

            <h3>Premium Batch</h3>

            <h1>₹1499</h1>

            <ul>
              <li>🎥 Live Classes</li>
              <li>📘 Complete Notes</li>
              <li>📝 Full Mock Tests</li>
              <li>🏆 Performance Tracking</li>
            </ul>

            <button className="btnLink" onClick={handlePremiumPurchase}>
  Get Premium
</button>
          </div>

          <div className="pricingCard darkPrice">
            <span className="priceBadge darkTag">MENTORSHIP</span>

            <h3>Personal Mentorship</h3>

            <h1>₹2999</h1>

            <ul>
              <li>👨‍🏫 Mentor Guidance</li>
              <li>📈 Progress Analysis</li>
              <li>🎯 Strategy Sessions</li>
              <li>📞 Priority Support</li>
            </ul>

            <a href="#contact" className="btnLink">
              Apply Now
            </a>
          </div>
        </div>
      </section>
      {/* <MockTestApp /> */}
      {user && (
<section className="dashboard" id="dashboard">
        <div>
          <span className="badge">Student Dashboard</span>
          <h2>Your Learning Command Center</h2>
          <p>
            Students apna course progress, mock test scores, notes, revision
            plan aur live class updates ek jagah dekh sakenge.
          </p>
        </div>

        <div className="dashboardPanel">
          <div>📚 My Courses</div>
          <div>📈 Progress Tracker</div>
          <div>📝 Mock Tests</div>
          <div>📥 Download Notes</div>
          <div>📅 Revision Planner</div>
          <div>🎥 Live Classes</div>
          <div>📢 Announcements</div>
          <div>🏅 Certificates</div>
        </div>
      </section>
      )}
      <section className="testimonials">
        <h2>Student Reviews</h2>

        <div className="grid">
          <div className="review">
            <p>⭐️⭐️⭐️⭐️⭐️</p>
            <h3>Priya Sharma</h3>
            <p>Visual notes se revision bahut fast ho gaya.</p>
          </div>

          <div className="review">
            <p>⭐️⭐️⭐️⭐️⭐️</p>
            <h3>Amit Patel</h3>
            <p>Mock tests exam level ke according hain.</p>
          </div>

          <div className="review">
            <p>⭐️⭐️⭐️⭐️⭐️</p>
            <h3>Neha Verma</h3>
            <p>Hindi-English explanation very easy hai.</p>
          </div>
        </div>
      </section>
      <section id="contact">
        <h2>Get Course Details</h2>

        <form>
        <input
  placeholder="Full Name"
  value={fullName}
  onChange={(e) => setFullName(e.target.value)}
/>
<input
  placeholder="Mobile Number"
  value={mobile}
  onChange={(e) => setMobile(e.target.value)}
/>
<input
  placeholder="Email"
  value={contactEmail}
  onChange={(e) => setContactEmail(e.target.value)}
/>
<button type="button" onClick={handleContactSubmit}>
  Submit Enquiry
</button>
        </form>

        <p className="contactHelp">
          📞 Get instant demo class details on WhatsApp.
        </p>
      </section>
      <section className="faq">
        <h2>Frequently Asked Questions</h2>

        <div className="faqBox">
          <details>
            <summary>Is this course bilingual?</summary>

            <p>Yes, Hindi + English dono language me content available hai.</p>
          </details>

          <details>
            <summary>Are mock tests included?</summary>

            <p>Yes, chapter-wise aur full syllabus mock tests included hain.</p>
          </details>

          <details>
            <summary>Can I use this on mobile?</summary>

            <p>Yes, platform fully mobile responsive hai.</p>
          </details>

          <details>
            <summary>Is pricing in INR?</summary>

            <p>Yes, sabhi plans Indian Rupees me hain.</p>
          </details>
        </div>
      </section>
      <section id="login" className="loginSection">
  <h2>Student Login</h2>

  <div className="loginBox">
    <input
      type="email"
      placeholder="Enter Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <input
      type="password"
      placeholder="Enter Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <button onClick={handleLogin}>Login</button>
    <button className="googleBtn" onClick={handleGoogleLogin}>
  Continue with Google
</button>
    <p className="forgotPassword" onClick={handleForgotPassword}>
  Forgot Password?
</p>
    <p>
      New student?{" "}
      <span onClick={handleRegister}>Create Account</span>
    </p>
  </div>
</section>

<footer className="footer">
  <div className="footerTop">
    <div>
      <h2>AspireNest Academy</h2>
      <p>
        Premium bilingual CTET/TET learning platform for future educators
        in India.
      </p>
    </div>

    <div>
      <h3>Quick Links</h3>
      <a href="#ctet">Courses</a>
      <a href="#cdp">CDP Module</a>
      <a href="#resources">Free Resources</a>
      <a href="#pricing">Pricing</a>
    </div>

    <div>
      <h3>Contact</h3>
      <p>📞 +91 XXXXX XXXXX</p>
      <p>📧 aspirenestacademy@gmail.com</p>
      <p>📍 India</p>
    </div>
  </div>

  <div className="footerBottom">
    © 2026 AspireNest Academy • All Rights Reserved
  </div>
</footer>
    </div>
  );
}

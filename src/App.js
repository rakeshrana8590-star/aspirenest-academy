import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
signInWithPopup
} from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import React, { useState, useEffect } from 'react';
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
  const adminEmail = "aspirenestplatform@gmail.com";
  const [students, setStudents] = useState([]);
const [enquiries, setEnquiries] = useState([]);
  const provider = new GoogleAuthProvider();
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  
    return () => unsubscribe();
  }, []);
  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "students"), {
        email: email,
        createdAt: new Date()
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
  const loadAdminData = async () => {
    try {
      const studentsSnap = await getDocs(collection(db, "students"));
      const enquiriesSnap = await getDocs(collection(db, "enquiries"));
  
      setStudents(
        studentsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
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
  
  const mockQuestions = [
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
  
    setTimeout(() => {
      if (currentQuestion + 1 < mockQuestions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer("");
        setShowAnswer(false);
        setTimeLeft(60);
      } else {
        setShowResult(true);
      }
    }, 2000);
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

          <a href="#resources">Notes</a>

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

          <button>Explore Premium</button>
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
          {user && <p className="userEmail">Welcome, {user.email}</p>}
          <ul>
            <li>📚 My Courses</li>
        
            <li>📝 Mock Tests</li>
            <li>📈 Progress</li>
            <li>📥 Download Notes</li>
            <li>🎯 Revision Planner</li>

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
            {user?.email === adminEmail && (
  <>
    <div className="dashboardCard">
      <h3>Total Students</h3>
      <p>{students.length}</p>
    </div>

    <div className="dashboardCard">
      <h3>Total Enquiries</h3>
      <p>{enquiries.length}</p>
    </div>
  </>
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
    {notesData.map((note) => (
      <div className="course" key={note.id}>
        <span className="planTag">{note.type}</span>

        <h3>{note.title}</h3>

        <p>📂 Category: {note.category}</p>

        <p>📄 Pages: {note.pages}</p>

        <a href={note.pdf} className="btnLink">
          Download PDF
        </a>
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
    {currentAffairsData.map((item) => (
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

            <a href="#contact" className="btnLink">
              Get Premium
            </a>
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

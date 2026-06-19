import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const TARGET_EXAMS = [
  "CTET Paper I",
  "CTET Paper II",
  "CTET Paper I + II",
  "State TET",
  "Not decided yet",
];

const PREPARATION_LEVELS = [
  "Beginner",
  "Studying regularly",
  "Revision stage",
  "Mock test ready",
];

const LEARNING_MEDIUMS = ["Hindi", "English", "Gujarati", "Bilingual"];

export default function AuthSection({
  email = "",
  setEmail = () => {},
  password = "",
  setPassword = () => {},
  handleLogin,
  handleGoogleLogin,
  handleForgotPassword,
  handleRegister,
}) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState(email || "");
  const [loginPassword, setLoginPassword] = useState(password || "");

  const [registerEmail, setRegisterEmail] = useState(email || "");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [targetExam, setTargetExam] = useState("CTET Paper I + II");
  const [preparationLevel, setPreparationLevel] = useState("Beginner");
  const [preferredMedium, setPreferredMedium] = useState("Bilingual");

  const registerSubtext = useMemo(
    () => "Create your verified AspireNest account with a basic learning profile.",
    []
  );

  const resetRegisterFields = () => {
    setConfirmPassword("");
    setFullName("");
    setMobileNumber("");
    setTargetExam("CTET Paper I + II");
    setPreparationLevel("Beginner");
    setPreferredMedium("Bilingual");
  };

  const openRegister = () => {
    setRegisterEmail(loginEmail);
    setRegisterPassword("");
    setIsRegisterOpen(true);
  };

  const closeRegister = () => {
    setIsRegisterOpen(false);
    resetRegisterFields();
  };

  const submitLogin = () => {
    const cleanEmail = loginEmail.trim();

    setEmail(cleanEmail);
    setPassword(loginPassword);

    handleLogin?.({
      email: cleanEmail,
      password: loginPassword,
    });
  };

  const submitForgotPassword = () => {
    const cleanEmail = loginEmail.trim();

    if (!cleanEmail) {
      alert("Please enter email address first.");
      return;
    }

    setEmail(cleanEmail);
    handleForgotPassword?.(cleanEmail);
  };

  const submitRegister = () => {
    const cleanEmail = registerEmail.trim();

    if (!fullName.trim()) {
      alert("Please enter student full name.");
      return;
    }

    if (!cleanEmail) {
      alert("Please enter email address.");
      return;
    }

    if (!registerPassword.trim()) {
      alert("Please enter password.");
      return;
    }

    if (registerPassword.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      alert("Password and confirm password do not match.");
      return;
    }

    setEmail(cleanEmail);
    setPassword(registerPassword);

    handleRegister?.({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      targetExam,
      preparationLevel,
      preferredMedium,
      email: cleanEmail,
      password: registerPassword,
    });
  };

  return (
    <>
      <section id="login" className="aspireLoginRoute">
        <div className="aspireLoginStoryPanel">
          <span className="aspireLoginEyebrow">AspireNest Academy</span>

          <h1>Secure access for serious learning.</h1>

          <p>
            Login or create a verified student account to continue CTET/TET
            preparation with notes, classes, mock tests, roadmaps, and progress
            tracking in one connected academy system.
          </p>

          <div className="aspireLoginFeatureGrid">
            <div>📚 Notes & Resources</div>
            <div>🎯 Mock Test Practice</div>
            <div>🎥 Video & Live Classes</div>
            <div>🧭 AspirePath Roadmaps</div>
          </div>

          <div className="aspireLoginTrustRow">
            <span>Email Verification</span>
            <span>Student Profile</span>
            <span>CTET/TET Live</span>
          </div>
        </div>

        <div className="aspireLoginCardPanel">
          <div className="aspireLoginBox">
            <div className="aspireLoginModeTabs">
              <button type="button" className="active">
                Login
              </button>

              <button type="button" onClick={openRegister}>
                Create Account
              </button>
            </div>

            <span className="aspireLoginBadge">Student Access</span>

            <h2>Welcome Back</h2>

            <p className="aspireLoginSubtext">
              Sign in to continue your AspireNest learning journey.
            </p>

            <label className="aspireLoginField">
              <span>Email Address</span>
              <input
                type="email"
                placeholder="Enter registered email"
                value={loginEmail}
                autoComplete="email"
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>

            <label className="aspireLoginField">
              <span>Password</span>

              <div className="aspireLoginPasswordWrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={loginPassword}
                  autoComplete="current-password"
                  onChange={(event) => setLoginPassword(event.target.value)}
                />

                <button
                  type="button"
                  className="aspireLoginPasswordToggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button
              type="button"
              className="aspireLoginPrimaryBtn"
              onClick={submitLogin}
            >
              Login
            </button>

            <button
              type="button"
              className="aspireLoginGoogleBtn"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </button>

            <div className="aspireLoginSupportRow">
              <button
                type="button"
                className="aspireLoginTextBtn"
                onClick={submitForgotPassword}
              >
                Forgot Password?
              </button>

              <Link to="/ctet-tet" className="aspireLoginTextLink">
                Explore CTET/TET
              </Link>
            </div>

            <p className="aspireLoginCreateText">
              New student? <span onClick={openRegister}>Create Account</span>
            </p>
          </div>
        </div>
      </section>

      {isRegisterOpen && (
        <div className="aspireRegisterOverlay" onClick={closeRegister}>
          <div
            className="aspireRegisterModal"
            role="dialog"
            aria-modal="true"
            aria-label="Create Student Account"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="aspireRegisterModalHeader">
              <div>
                <span className="aspireLoginBadge">
                  Verified Student Setup
                </span>

                <h2>Create Student Account</h2>

                <p>{registerSubtext}</p>
              </div>

              <button
                type="button"
                className="aspireRegisterCloseBtn"
                onClick={closeRegister}
                aria-label="Close registration form"
              >
                ×
              </button>
            </div>

            <div className="aspireRegisterModalGrid">
              <label className="aspireLoginField">
                <span>Student Full Name</span>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  autoComplete="name"
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>

              <label className="aspireLoginField">
                <span>Mobile / WhatsApp</span>
                <input
                  type="tel"
                  placeholder="Optional mobile number"
                  value={mobileNumber}
                  autoComplete="tel"
                  onChange={(event) => setMobileNumber(event.target.value)}
                />
              </label>

              <label className="aspireLoginField">
                <span>Email Address</span>
                <input
                  type="email"
                  placeholder="Enter registered email"
                  value={registerEmail}
                  autoComplete="email"
                  onChange={(event) => setRegisterEmail(event.target.value)}
                />
              </label>

              <label className="aspireLoginField">
                <span>Password</span>

                <div className="aspireLoginPasswordWrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={registerPassword}
                    autoComplete="new-password"
                    onChange={(event) =>
                      setRegisterPassword(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="aspireLoginPasswordToggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="aspireLoginField">
                <span>Confirm Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>

              <label className="aspireLoginField">
                <span>Target Exam</span>
                <select
                  value={targetExam}
                  onChange={(event) => setTargetExam(event.target.value)}
                >
                  {TARGET_EXAMS.map((exam) => (
                    <option value={exam} key={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
              </label>

              <label className="aspireLoginField">
                <span>Preparation Level</span>
                <select
                  value={preparationLevel}
                  onChange={(event) =>
                    setPreparationLevel(event.target.value)
                  }
                >
                  {PREPARATION_LEVELS.map((level) => (
                    <option value={level} key={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <label className="aspireLoginField">
                <span>Preferred Medium</span>
                <select
                  value={preferredMedium}
                  onChange={(event) =>
                    setPreferredMedium(event.target.value)
                  }
                >
                  {LEARNING_MEDIUMS.map((medium) => (
                    <option value={medium} key={medium}>
                      {medium}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="aspireLoginVerificationNote">
              Verification email will be sent to this Gmail address. Login will
              stay locked until email is verified.
            </div>

            <div className="aspireRegisterModalActions">
              <button
                type="button"
                className="aspireLoginPrimaryBtn"
                onClick={submitRegister}
              >
                Create Account & Send Verification
              </button>

              <button
                type="button"
                className="aspireLoginGoogleBtn"
                onClick={closeRegister}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
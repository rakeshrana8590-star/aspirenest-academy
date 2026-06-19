import React, { useMemo, useRef, useState } from "react";
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

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  isVisible,
  onToggleVisible,
}) {
  const inputRef = useRef(null);

  const handleToggle = () => {
    onToggleVisible();

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <label className="aspireLoginField">
      <span>{label}</span>

      <div className="aspireLoginPasswordWrap">
        <input
          ref={inputRef}
          name={name}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
        />

        <button
          type="button"
          className="aspireLoginPasswordToggle"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleToggle}
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}

export default function AuthSection({
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  handleGoogleLogin,
  handleForgotPassword,
  handleRegister,
}) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [targetExam, setTargetExam] = useState("CTET Paper I + II");
  const [preparationLevel, setPreparationLevel] = useState("Beginner");
  const [preferredMedium, setPreferredMedium] = useState("Bilingual");

  const registerSubtext = useMemo(() => {
    return "Create your verified AspireNest account with a basic learning profile.";
  }, []);

  const resetRegisterFields = () => {
    setConfirmPassword("");
    setFullName("");
    setMobileNumber("");
    setTargetExam("CTET Paper I + II");
    setPreparationLevel("Beginner");
    setPreferredMedium("Bilingual");
    setShowRegisterPassword(false);
  };

  const openRegister = () => {
    setIsRegisterOpen(true);
  };

  const closeRegister = () => {
    setIsRegisterOpen(false);
    resetRegisterFields();
  };

  const submitLogin = (event) => {
    event.preventDefault();
    handleLogin();
  };

  const submitRegister = (event) => {
    event.preventDefault();

    if (!fullName.trim()) {
      alert("Please enter student full name.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter email address.");
      return;
    }

    if (!password.trim()) {
      alert("Please enter password.");
      return;
    }

    if (password.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Password and confirm password do not match.");
      return;
    }

    handleRegister({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      targetExam,
      preparationLevel,
      preferredMedium,
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
          <form className="aspireLoginBox" onSubmit={submitLogin}>
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
                name="username"
                type="email"
                placeholder="Enter registered email"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <PasswordField
              label="Password"
              name="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter password"
              autoComplete="current-password"
              isVisible={showLoginPassword}
              onToggleVisible={() =>
                setShowLoginPassword((current) => !current)
              }
            />

            <button type="submit" className="aspireLoginPrimaryBtn">
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
                onClick={handleForgotPassword}
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
          </form>
        </div>
      </section>

      {isRegisterOpen && (
        <div className="aspireRegisterOverlay" onClick={closeRegister}>
          <form
            className="aspireRegisterModal"
            role="dialog"
            aria-modal="true"
            aria-label="Create Student Account"
            onClick={(event) => event.stopPropagation()}
            onSubmit={submitRegister}
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
                  name="email"
                  type="email"
                  placeholder="Enter registered email"
                  value={email}
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <PasswordField
                label="Password"
                name="newPassword"
                value={password}
                onChange={setPassword}
                placeholder="Enter password"
                autoComplete="new-password"
                isVisible={showRegisterPassword}
                onToggleVisible={() =>
                  setShowRegisterPassword((current) => !current)
                }
              />

              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm password"
                autoComplete="new-password"
                isVisible={showRegisterPassword}
                onToggleVisible={() =>
                  setShowRegisterPassword((current) => !current)
                }
              />

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
                  onChange={(event) => setPreparationLevel(event.target.value)}
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
                  onChange={(event) => setPreferredMedium(event.target.value)}
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
              <button type="submit" className="aspireLoginPrimaryBtn">
                Create Account & Send Verification
              </button>

              <button
                type="button"
                className="aspireLoginGoogleBtn"
                onClick={closeRegister}
              >
                Already verified? Login
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
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
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  handleGoogleLogin,
  handleForgotPassword,
  handleRegister,
}) {
  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [targetExam, setTargetExam] = useState("CTET Paper I + II");
  const [preparationLevel, setPreparationLevel] = useState("Beginner");
  const [preferredMedium, setPreferredMedium] = useState("Bilingual");

  const isRegisterMode = authMode === "register";

  const formTitle = useMemo(() => {
    return isRegisterMode ? "Create Student Account" : "Welcome Back";
  }, [isRegisterMode]);

  const formSubtext = useMemo(() => {
    return isRegisterMode
      ? "Create your verified AspireNest account and start with a clear preparation profile."
      : "Sign in to continue your AspireNest learning journey.";
  }, [isRegisterMode]);

  const resetRegisterFields = () => {
    setConfirmPassword("");
    setFullName("");
    setMobileNumber("");
    setTargetExam("CTET Paper I + II");
    setPreparationLevel("Beginner");
    setPreferredMedium("Bilingual");
  };

  const switchToLogin = () => {
    setAuthMode("login");
    resetRegisterFields();
  };

  const switchToRegister = () => {
    setAuthMode("register");
  };

  const submitRegister = () => {
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
    <section id="login" className="loginSection loginExperience aspireLoginRoute">
      <div className="loginStoryPanel aspireLoginStoryPanel">
        <span className="aspireLoginEyebrow">AspireNest Academy</span>

        <h1>Secure access for serious learning.</h1>

        <p>
          Login or create a verified student account to continue CTET/TET
          preparation with notes, classes, mock tests, roadmaps, and progress
          tracking in one connected academy system.
        </p>

        <div className="loginFeatureGrid aspireLoginFeatureGrid">
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

      <div className="loginCardPanel aspireLoginCardPanel">
        <div className="loginBox premiumLoginBox aspireLoginBox">
          <div className="aspireLoginModeTabs">
            <button
              type="button"
              className={!isRegisterMode ? "active" : ""}
              onClick={switchToLogin}
            >
              Login
            </button>

            <button
              type="button"
              className={isRegisterMode ? "active" : ""}
              onClick={switchToRegister}
            >
              Create Account
            </button>
          </div>

          <span className="loginBadge aspireLoginBadge">
            {isRegisterMode ? "Verified Student Setup" : "Student Access"}
          </span>

          <h2>{formTitle}</h2>

          <p className="loginSubtext aspireLoginSubtext">{formSubtext}</p>

          {isRegisterMode && (
            <div className="aspireLoginRegisterGrid">
              <label className="aspireLoginField">
                <span>Student Full Name</span>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label className="aspireLoginField">
                <span>Mobile / WhatsApp</span>
                <input
                  type="tel"
                  placeholder="Optional mobile number"
                  value={mobileNumber}
                  autoComplete="tel"
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </label>
            </div>
          )}

          <label className="aspireLoginField">
            <span>Email Address</span>
            <input
              type="email"
              placeholder="Enter registered email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="aspireLoginField">
            <span>Password</span>

            <div className="aspireLoginPasswordWrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
                onChange={(e) => setPassword(e.target.value)}
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

          {isRegisterMode && (
            <>
              <label className="aspireLoginField">
                <span>Confirm Password</span>

                <div className="aspireLoginPasswordWrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </label>

              <div className="aspireLoginRegisterGrid">
                <label className="aspireLoginField">
                  <span>Target Exam</span>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
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
                    onChange={(e) => setPreparationLevel(e.target.value)}
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
                    onChange={(e) => setPreferredMedium(e.target.value)}
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
            </>
          )}

          {!isRegisterMode ? (
            <button
              type="button"
              className="aspireLoginPrimaryBtn"
              onClick={handleLogin}
            >
              Login
            </button>
          ) : (
            <button
              type="button"
              className="aspireLoginPrimaryBtn"
              onClick={submitRegister}
            >
              Create Account & Send Verification
            </button>
          )}

          {!isRegisterMode && (
            <button
              type="button"
              className="googleBtn aspireLoginGoogleBtn"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </button>
          )}

          <div className="aspireLoginSupportRow">
            {!isRegisterMode ? (
              <button
                type="button"
                className="forgotPassword aspireLoginTextBtn"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            ) : (
              <button
                type="button"
                className="forgotPassword aspireLoginTextBtn"
                onClick={switchToLogin}
              >
                Already verified? Login
              </button>
            )}

            <Link to="/ctet-tet" className="aspireLoginTextLink">
              Explore CTET/TET
            </Link>
          </div>

          {!isRegisterMode ? (
            <p className="createAccountText aspireLoginCreateText">
              New student?{" "}
              <span onClick={switchToRegister}>Create Account</span>
            </p>
          ) : (
            <p className="createAccountText aspireLoginCreateText">
              Email verified? <span onClick={switchToLogin}>Go to Login</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
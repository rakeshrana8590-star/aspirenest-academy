import React from "react";

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
  return (
    <section id="login" className="loginSection loginExperience">

      <div className="loginStoryPanel">
        <span>AspireNest Academy</span>

        <h1>
          Start your structured
          learning journey.
        </h1>

        <p>
          Access study resources, practice systems,
          progress tracking, and guided preparation
          inside one organized academic platform.
        </p>

        <div className="loginFeatureGrid">
          <div>📚 Study Resources</div>
          <div>🎯 Practice Systems</div>
          <div>📊 Progress Tracking</div>
          <div>🧭 Guided Learning</div>
        </div>
      </div>

      <div className="loginCardPanel">
        <div className="loginBox premiumLoginBox">
          <span className="loginBadge">Student Access</span>

          <h2>Student Login</h2>

          <p className="loginSubtext">
            Continue to AspireNest Academic Overview.
          </p>

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

          <button onClick={handleLogin}>
            Login
          </button>

          <button
            className="googleBtn"
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </button>

          <p
            className="forgotPassword"
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </p>

          <p className="createAccountText">
            New student?{" "}
            <span onClick={handleRegister}>
              Create Account
            </span>
          </p>
        </div>
      </div>

    </section>
  );
}
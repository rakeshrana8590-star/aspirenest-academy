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
    );
  }
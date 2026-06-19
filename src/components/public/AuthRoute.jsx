import React from "react";
import { Navigate } from "react-router-dom";

import AuthSection from "../AuthSection";

export default function AuthRoute({
  user,
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  handleGoogleLogin,
  handleForgotPassword,
  handleRegister,
}) {
  if (user) {
    return <Navigate to="/ctet-tet" replace />;
  }

  return (
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
  );
}
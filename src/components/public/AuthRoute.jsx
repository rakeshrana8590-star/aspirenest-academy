import React from "react";
import { Navigate } from "react-router-dom";
import { getAspireNestLandingRoute } from "../../auth/aspireNestIdentity";

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
  initialMode = "login",
}) {
  if (user) {
    return <Navigate to={getAspireNestLandingRoute(user)} replace />;
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
      initialRegisterOpen={initialMode === "register"}
    />
  );
}
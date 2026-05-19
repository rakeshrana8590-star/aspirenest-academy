import React from "react";

function AspireNestLogo({ className = "" }) {
  return (
    <img
      src="/logo-header.png"
      alt="AspireNest Academy"
      className={`header-logo ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

export default AspireNestLogo;
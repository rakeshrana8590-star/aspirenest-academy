import React from "react";

export default function AdminButton({
  children,
  type = "button",
  variant = "secondary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const classes = [
    "adminBtn",
    "adminBtn--" + variant,
    "adminBtn--" + size,
    loading ? "adminBtn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : "false"}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

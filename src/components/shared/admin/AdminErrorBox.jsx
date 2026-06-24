import React from "react";

export default function AdminErrorBox({
  title = "Something went wrong",
  message = "Please check the details and try again.",
  children,
}) {
  return (
    <div className="adminErrorBox" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
      {children ? <div className="adminErrorBoxBody">{children}</div> : null}
    </div>
  );
}

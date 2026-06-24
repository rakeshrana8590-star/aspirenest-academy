import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function AdminConfirmDialog({
  open = false,
  title = "Confirm action",
  message = "Please confirm before continuing.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "warning",
  requiresText = "",
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  const [typedText, setTypedText] = useState("");

  const requiredText = useMemo(
    () => String(requiresText || "").trim(),
    [requiresText]
  );

  const canConfirm = !requiredText || typedText.trim() === requiredText;

  useEffect(() => {
    if (open) {
      setTypedText("");
    }
  }, [open, requiresText]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="adminConfirmOverlay" role="presentation">
      <div
        className={["adminConfirmDialog", "adminConfirmDialog--" + tone]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="adminConfirmHeader">
          <span>{tone === "danger" ? "Danger Zone" : "Confirmation"}</span>
          <button type="button" onClick={onCancel} aria-label="Close confirmation dialog">
            ×
          </button>
        </div>

        <div className="adminConfirmBody">
          <h3>{title}</h3>
          <p>{message}</p>
          {children ? <div className="adminConfirmCustomBody">{children}</div> : null}

          {requiredText ? (
            <label className="adminConfirmTypeBox">
              <span>Type <strong>{requiredText}</strong> to continue</span>
              <input
                value={typedText}
                onChange={(event) => setTypedText(event.target.value)}
                placeholder={requiredText}
                autoFocus
              />
            </label>
          ) : null}
        </div>

        <div className="adminConfirmFooter">
          <button
            type="button"
            className="adminConfirmButton adminConfirmButton--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={["adminConfirmButton", "adminConfirmButton--" + tone]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              if (!canConfirm || loading) return;
              onConfirm?.();
            }}
            disabled={!canConfirm || loading}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export default function AdminPortalActionMenu({
  open = false,
  anchorRect = null,
  actions = [],
  onClose,
  align = "right",
  width = 240,
  title = "Actions",
}) {
  const safeActions = useMemo(() => actions.filter(Boolean), [actions]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const onScroll = () => onClose?.();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose]);

  if (!open || !anchorRect || typeof document === "undefined") return null;

  const viewportWidth = window.innerWidth || 1200;
  const viewportHeight = window.innerHeight || 800;
  const gap = 10;

  let left = align === "left" ? anchorRect.left : anchorRect.right - width;
  left = Math.max(12, Math.min(left, viewportWidth - width - 12));

  let top = anchorRect.bottom + gap;
  const estimatedHeight = Math.min(420, 54 + safeActions.length * 48);

  if (top + estimatedHeight > viewportHeight - 12) {
    top = Math.max(12, anchorRect.top - estimatedHeight - gap);
  }

  return createPortal(
    <div className="adminPortalMenuLayer" onMouseDown={onClose}>
      <div
        className="adminPortalMenu"
        style={{ top, left, width }}
        onMouseDown={(event) => event.stopPropagation()}
        role="menu"
        aria-label={title}
      >
        <div className="adminPortalMenuHeader">
          <span>{title}</span>
          <button type="button" onClick={onClose} aria-label="Close action menu">
            ×
          </button>
        </div>

        <div className="adminPortalMenuList">
          {safeActions.length ? (
            safeActions.map((action, index) => (
              <button
                key={action.key || action.label || index}
                type="button"
                className={[
                  "adminPortalMenuItem",
                  "adminPortalMenuItem--" + (action.tone || "default"),
                ].join(" ")}
                disabled={Boolean(action.disabled)}
                onClick={() => {
                  if (action.disabled) return;
                  action.onClick?.();
                  if (action.closeOnClick !== false) onClose?.();
                }}
                role="menuitem"
              >
                {action.icon ? <span className="adminPortalMenuIcon">{action.icon}</span> : null}
                <span className="adminPortalMenuText">
                  <strong>{action.label}</strong>
                  {action.description ? <small>{action.description}</small> : null}
                </span>
              </button>
            ))
          ) : (
            <div className="adminPortalMenuEmpty">No actions available</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

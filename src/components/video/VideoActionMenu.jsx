import React from "react";
import { createPortal } from "react-dom";

export default function VideoActionMenu({
  position,
  video,
  onClose,
  onPreview,
  onEdit,
  onToggleStatus,
  onDuplicate,
  onDelete,
}) {
  if (!position || !video) return null;

  return createPortal(
    <div className="videoPortalBackdrop" onClick={onClose}>
      <div
        className="videoPortalMenu"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            onPreview?.(video);
            onClose?.();
          }}
        >
          ▶ Preview Classroom
        </button>

        <button
          type="button"
          onClick={() => {
            onEdit?.(video);
            onClose?.();
          }}
        >
          ✏️ Edit Class
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleStatus?.(video);
            onClose?.();
          }}
        >
          {video.status === "published" ? "🙈 Unpublish" : "✅ Publish"}
        </button>

        <button
          type="button"
          onClick={() => {
            onDuplicate?.(video);
            onClose?.();
          }}
        >
          📄 Duplicate
        </button>

        <button
          type="button"
          className="videoMenuDanger"
          onClick={() => {
            onDelete?.(video);
            onClose?.();
          }}
        >
          🗑 Delete
        </button>
      </div>
    </div>,
    document.body
  );
}
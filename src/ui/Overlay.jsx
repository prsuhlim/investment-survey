// src/ui/Overlay.jsx
import React from "react";

/**
 * Overlay
 * ----------------------------------------------------------------------------
 * Single full-screen modal container for all follow-ups.
 * - Non-interactive backdrop (pointerEvents: none) — base stays clickable off.
 * - Centers a card area; children handle their own layout.
 *
 * Props
 *  - open: boolean
 *  - onRequestClose?: () => void   // optional ESC handler, or for future backdrop clicks
 *  - children: ReactNode
 */
export default function Overlay({ open, onRequestClose, children }) {
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    // Autofocus the first focusable element inside the overlay
    const root = rootRef.current;
    if (!root) return;
    const focusable = root.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open || !onRequestClose) return;
    const onKey = (e) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onRequestClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000, // :root --z-overlay
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      {/* Backdrop (non-interactive) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17,24,39,0.45)",
          pointerEvents: "none",
        }}
      />
      {/* Card area */}
      <div
        ref={rootRef}
        style={{
          position: "relative",
          width: "min(800px, 96vw)",
          maxWidth: "96vw",
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

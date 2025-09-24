// src/ui/MiniConfirmBadge.jsx
import React from "react";

export default function MiniConfirmBadge({ label = "Confirm" }) {
  return (
    <span
      role="img"
      aria-label={`${label} button (example)`}
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1.1,
        borderRadius: 8,
        background: "#000000",     // same family as your primary
        color: "#fff",
        border: "1px solid #1e40af",
        verticalAlign: "baseline",
        transform: "translateY(-1px)",
        userSelect: "none",
      }}
    >
      {label}
    </span>
  );
}

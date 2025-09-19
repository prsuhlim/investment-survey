import React from "react";

export default function MiniConfirmBadge({ label = "Confirm Allocation", style, className }) {
  return (
    <span
      aria-label={`${label} button`}
      className={className}
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#111827",
        color: "#fff",
        fontSize: "0.9rem",
        lineHeight: 1,
        boxShadow: "0 1px 2px rgba(0,0,0,0.10)",
        userSelect: "none",
        ...(style || {}),
      }}
    >
      {label}
    </span>
  );
}

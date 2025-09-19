import React from "react";

export default function Callout({
  tone = "warning", // "warning" | "info" | "success" | "neutral"
  icon = null,
  title = null,
  children,
  style,
  className
}) {
  const tones = {
    warning: { bg: "#fff8e1", border: "#facc15" },
    info:    { bg: "#eff6ff", border: "#93c5fd" },
    success: { bg: "#ecfdf5", border: "#6ee7b7" },
    neutral: { bg: "#f9fafb", border: "#e5e7eb" },
  };
  const c = tones[tone] || tones.neutral;

  return (
    <div
      className={className}
      style={{
        marginTop: 12,
        marginBottom: 12,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: 12,
        ...(style || {}),
      }}
    >
      {(icon || title) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          {icon}
          {title && <b>{title}</b>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

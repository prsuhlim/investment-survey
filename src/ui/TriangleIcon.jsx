// components/ui/TriangleIcon.jsx
import React from "react";

export default function TriangleIcon({ dir = "right", size = 14 }) {
  const transform = dir === "left" ? "rotate(180 12 12)" : undefined;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <g transform={transform}>
        <polygon points="8,5 19,12 8,19" fill="currentColor" />
      </g>
    </svg>
  );
}

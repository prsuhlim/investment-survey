import React from "react";

export default function AlertTriangle({ size = 16, className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ verticalAlign: "text-bottom", ...(style || {}) }}
    >
      <path d="M12 2L1 21h22L12 2z" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.2" />
      <rect x="11" y="8" width="2" height="6" fill="#92400e" />
      <rect x="11" y="16.5" width="2" height="2" fill="#92400e" />
    </svg>
  );
}

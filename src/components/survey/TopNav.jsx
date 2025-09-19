// components/survey/TopNav.jsx
import React from "react";
import TriangleIcon from "../ui/TriangleIcon";

export default function TopNav({
  idx,
  total = 32,          // default to 32 if not provided
  maxVisitedIdx,
  onBack,
  onForward,
}) {
  return (
    <div className="progressText" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <div>Item {Math.min(idx + 1, total)} of {total}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="startBtn"
          aria-label="Back"
          title={idx > 0 ? "Back" : "Exit / Back"}
          onClick={onBack}
          style={{ background: "#000000", width: 40, height: 40, borderRadius: 999, display: "grid", placeItems: "center", padding: 0 }}
        >
          <TriangleIcon dir="left" />
        </button>
        <button
          type="button"
          className="startBtn"
          aria-label="Forward (visited only)"
          title={idx < maxVisitedIdx ? "Forward" : "You can only move within visited items"}
          onClick={onForward}
          disabled={!(idx < maxVisitedIdx)}
          style={{
            background: "#000000",
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            padding: 0,
            opacity: idx < maxVisitedIdx ? 1 : 0.6,
          }}
        >
          <TriangleIcon dir="right" />
        </button>
      </div>
    </div>
  );
}

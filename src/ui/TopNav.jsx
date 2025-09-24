// components/survey/TopNav.jsx
import React from "react";
import TriangleIcon from "../ui/TriangleIcon";

export default function TopNav({
  idx = 0,
  total = 30,
  maxVisitedIdx = 0,
  onBack,
  onForward,
  showIndex = false,          // ← default hidden
}) {
  const canBack = idx > 0;
  const canForward = idx < Math.max(0, Math.min(maxVisitedIdx, total - 1));

  return (
    <div
      className="progressText"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      aria-label={showIndex ? `Item ${Math.min(idx + 1, total)} of ${total}` : undefined} // no screenreader count when hidden
    >
      {/* Only render the index when explicitly requested */}
      {showIndex ? (
        <div>Item {Math.min(idx + 1, total)} of {total}</div>
      ) : <div />}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="startBtn"
          aria-label={canBack ? "Back" : "Exit / Back"}
          title={canBack ? "Back" : "Exit / Back"}
          onClick={onBack}
          disabled={!canBack}
          style={{
            background: "#000000",
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            padding: 0,
            opacity: canBack ? 1 : 0.6,
          }}
        >
          <TriangleIcon dir="left" />
        </button>

        <button
          type="button"
          className="startBtn"
          aria-label={canForward ? "Forward (visited only)" : "You can only move within visited items"}
          title={canForward ? "Forward" : "You can only move within visited items"}
          onClick={onForward}
          disabled={!canForward}
          style={{
            background: "#000000",
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            padding: 0,
            opacity: canForward ? 1 : 0.6,
          }}
        >
          <TriangleIcon dir="right" />
        </button>
      </div>
    </div>
  );
}

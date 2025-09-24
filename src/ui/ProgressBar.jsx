import React from "react";

export default function ProgressBar({ pct }) {
  const width = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <div className="progressWrap" style={{ marginTop: 10 }}>
      <div className="progressBar">
        <div className="fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

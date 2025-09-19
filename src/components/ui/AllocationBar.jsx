// components/ui/AllocationBar.jsx
import React from "react";
import "../../styles/survey.css"; // uses your existing styles :contentReference[oaicite:2]{index=2}

export default function AllocationBar({
  value,
  setValue,
  disabled,
  barRef,
  onBarPointerDown,
  onHandleKeyDown,
}) {
  return (
    <div
      ref={barRef}
      className="allocBar allocBar--interactive"
      role="presentation"
      onPointerDown={onBarPointerDown}
      onTouchStart={onBarPointerDown}
      aria-disabled={disabled}
    >
      <div className="seg segA" style={{ width: `${100 - value}%`, opacity: disabled ? 0.6 : 1 }} />
      <div className="seg segB" style={{ width: `${value}%`, opacity: disabled ? 0.6 : 1 }} />

      <div className="allocTicks" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="tick" style={{ left: `${(i + 1) * 10}%` }} />
        ))}
      </div>

      <button
        className="allocHandle"
        style={{ left: `${100 - value}%`, opacity: disabled ? 0.6 : 1 }}
        aria-label="Allocation handle"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}% in Option B`}
        onKeyDown={onHandleKeyDown}
        tabIndex={disabled ? -1 : 0}
      />
    </div>
  );
}
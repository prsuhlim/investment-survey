// src/components/ui/AllocationBar.jsx
import React from "react";
import "../styles/survey.css";

export default function AllocationBar({
  value,
  setValue,
  disabled,
  barRef,
  onBarPointerDown,
  onHandleKeyDown,
}) {
  const pctB = Math.max(0, Math.min(100, Number(value) || 0));
  const pctA = 100 - pctB;

  return (
    <div
      ref={barRef}
      className={`allocBar ${!disabled ? "allocBar--interactive" : ""}`}
      role="presentation"
      onPointerDown={onBarPointerDown}
      onTouchStart={onBarPointerDown}
      aria-disabled={disabled}
      title={!disabled ? "Drag anywhere on the bar to adjust" : undefined}
    >
      {/* Left = A, Right = B */}
      <div className="seg segA" style={{ width: `${pctA}%`, opacity: disabled ? 0.6 : 1 }} />
      <div className="seg segB" style={{ width: `${pctB}%`, opacity: disabled ? 0.6 : 1 }} />

      {/* Circular knob sitting exactly on the boundary */}
      <button
        className="allocHandle allocHandle--knob"
        style={{ left: `${pctA}%`, opacity: disabled ? 0.6 : 1 }}
        aria-label="Allocation handle"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pctB}
        aria-valuetext={`${pctB}% in Option B`}
        onKeyDown={onHandleKeyDown}
        tabIndex={disabled ? -1 : 0}
      />
    </div>
  );
}

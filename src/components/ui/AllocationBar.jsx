// src/components/ui/AllocationBar.jsx
import React from "react";
import "../../styles/survey.css";

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
      className={`allocBar ${!disabled ? "allocBar--interactive" : ""}`}
      role="presentation"
      onPointerDown={onBarPointerDown}
      onTouchStart={onBarPointerDown}
      aria-disabled={disabled}
      title={!disabled ? "Drag anywhere on the bar to adjust" : undefined}
    >
      {/* Left = A, Right = B */}
      <div
        className="seg segA"
        style={{ width: `${100 - value}%`, opacity: disabled ? 0.6 : 1 }}
        aria-hidden="true"
      />
      <div
        className="seg segB"
        style={{ width: `${value}%`, opacity: disabled ? 0.6 : 1 }}
        aria-hidden="true"
      />

      {/* Circular knob sitting on the boundary */}
      <button
        className="allocHandle allocHandle--knob"
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

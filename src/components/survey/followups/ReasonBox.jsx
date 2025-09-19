import React from "react";

export default function ReasonBox({ value, setValue, onSubmit, disabled }) {
  const minLen = 5;
  const canSubmit = !disabled && value.trim().length >= minLen;

  return (
    <section style={{ marginTop: 24, paddingTop: 16, borderTop: "2px solid #e5e7eb" }}>
      <label htmlFor="reasonBox" style={{ display: "block", marginBottom: 6 }}>
        <p><b>Q. Briefly explain the reasoning behind your allocation choice in the scenario above.</b></p>
      </label>
      <textarea
        id="reasonBox"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your explanation here."
        disabled={disabled}
        style={{
          width: "100%",
          minHeight: 100,
          borderRadius: 8,
          border: "1px solid #d1d5db",
          padding: 10,
          fontSize: "1rem",
          resize: "vertical",
          filter: disabled ? "blur(3px)" : "none",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
          userSelect: disabled ? "none" : "auto",
        }}
      />
      <div className="actions" style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="startBtn"
          onClick={onSubmit}
          disabled={!canSubmit}
          title={
            disabled
              ? "Read-only when viewing a previously completed screen"
              : value.trim().length < minLen
                ? `Please enter at least ${minLen} characters`
                : "Submit and continue"
          }
        >
          Submit explanation
        </button>
      </div>
    </section>
  );
}

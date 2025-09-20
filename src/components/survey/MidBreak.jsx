import React from "react";
import ProgressBar from "./ProgressBar";

export default function MidBreak({ pct, inflationText, onContinue }) {
  return (
    <main className="container">
      <h1>Investment Scenarios</h1>

      <ProgressBar pct={pct} />
      <div className="progressText" style={{ marginTop: 6 }}>
        You’ve completed {pct}% of the section
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 18,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#fff",
          lineHeight: 1.65,
        }}
      >
        <div
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 10,
            letterSpacing: ".2px",
          }}
        >
          You’re halfway there!
        </div>

        <p style={{ marginTop: 0 }}>
          From this point on, the <b>inflation assumption</b> is{" "}
          <b style={{ color: "#2563eb", fontSize: "1.3em" }}>{inflationText}</b>.{" "}
          All other settings remain the same as before.
        </p>

        <p style={{ margin: "8px 0" }}>
          Please choose your allocations with this change in mind.
        </p>

        <p style={{ marginBottom: 0 }}>
          Take a moment to choose your answers carefully —{" "}
          <u>your considered input is most valuable to this study.</u>
        </p>
      </div>

      <div className="actions" style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button className="startBtn" onClick={onContinue}>Continue</button>
      </div>
    </main>
  );
}

// src/pages/Instructions.jsx
// Instructions split into 3 pages with uniform grey cards.

import React from "react";
import "../styles/global.css";
import AlertTriangle from "../ui/AlertTriangle";
import Callout from "../ui/Callout";
import MiniConfirmBadge from "../ui/MiniConfirmBadge";

const qs = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
const AMOUNT   = Number(qs.get("amount") ?? 100000);
const CURRENCY = qs.get("currency") ?? "USD";
const moneyFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export default function Instructions({ onNext, onBack }) {
  const [step, setStep] = React.useState(1);

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  // Common card style
  const cardStyle = {
    background: "#e7e7e7",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: "24px 28px",
    minHeight: "420px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  return (
    <main className="container">
      <h1>Instructions</h1>
      <hr style={{ margin: "10px 0 18px 0", border: "none", borderTop: "1px solid #ddd" }} />

      {step === 1 && (
        <div style={cardStyle}>
          <p>
            In this survey, you will complete <b>30</b> investment scenarios.
          </p>
          <p>
            In each scenario, you will decide how to allocate a total of{" "}
            <b>{moneyFmt.format(AMOUNT)}</b> between two investment options.
          </p>
          <p>
            The potential returns and risks of each option will differ from scenario to scenario.
          </p>
          <p>
            Take a moment to read each carefully and make the choice that best reflects your preferences.
          </p>
          <p>The choices are hypothetical, but please treat each decision as if you were investing in real life.</p>
        </div>
      )}

      {step === 2 && (
        <div style={cardStyle}>
          <p>Each scenario presents two options.</p>

          <figure className="figureCenter inList">
            <img
              src="/images/Explanation1.png"
              alt="Example of Option A (fixed outcome) vs Option B (two-outcome)"
              style={{ maxWidth: "100%", marginTop: 12 }}
            />
            <figcaption style={{ textAlign: "center", marginTop: 6 }}><em><b>Figure 1.</b> How the two options appear on screen.</em></figcaption>
          </figure>

          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            <li><b>Option A:</b> a fixed, guaranteed outcome.</li>
            <li><b>Option B:</b> 50% chance of a “high” outcome and 50% chance of a “low” outcome.</li>
          </ul>
        </div>
      )}

      {step === 3 && (
        <div style={cardStyle}>
          <p>Use the slider to set how much to allocate to each option.</p>

          <figure className="figureCenter inList">
            <img
              src="/images/Explanation2.png"
              alt="Example of the allocation slider and handle"
              style={{ maxWidth: "100%", marginTop: 12 }}
            />
            <figcaption style={{ textAlign: "center", marginTop: 6 }}><em><b>Figure 2.</b> Set your allocation with the slider.</em></figcaption>
          </figure>

          <p style={{ marginTop: 10 }}>
            Click <MiniConfirmBadge /> to record your choice and move forward.
          </p>

          <div style={{ marginTop: "auto" }}>
            <Callout
              tone="warning"
              icon={<AlertTriangle />}
              title="Important:"
            >
              You may revisit earlier scenarios to view their conditions, but once confirmed,
              your answers cannot be viewed or changed.
            </Callout>
          </div>
        </div>
      )}

      <hr style={{ margin: "18px 0", border: "none", borderTop: "1px solid #ddd" }} />

      {/* Navigation buttons */}
      <div className="actions" style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "space-between" }}>
        <button className="startBtn" onClick={step === 1 ? onBack : prevStep} type="button">
          Back
        </button>
        {step < 3 ? (
          <button className="startBtn" onClick={nextStep} type="button">
            Next
          </button>
        ) : (
          <button className="startBtn" onClick={onNext} type="button">
            Start
          </button>
        )}
      </div>
    </main>
  );
}

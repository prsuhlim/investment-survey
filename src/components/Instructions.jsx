// src/components/Instructions.jsx
import React from "react";
import "../styles/global.css";
import AlertTriangle from "./ui/AlertTriangle";
import MiniConfirmBadge from "./ui/MiniConfirmBadge";
import Callout from "./ui/Callout";

const qs = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
const AMOUNT   = Number(qs.get("amount") ?? 100000);
const CURRENCY = qs.get("currency") ?? "USD";
const moneyFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export default function Instructions({ onNext, onBack }) {
  return (
    <main className="container">
      <h1>Instructions</h1>
      <hr style={{ margin: "10px 0 18px 0", border: "none", borderTop: "1px solid #ddd" }} />

      {/* Intro */}
      <p>
        You will complete <b>32 investment scenarios</b>. 
      </p>

      <p>In each scenario, <b>decide how to invest</b> a
        (hypothetical) total of {moneyFmt.format(AMOUNT)} between two options.
      </p>

      {/* What to expect */}
      <p style={{ marginTop: 14, marginBottom: 6, fontWeight: 600 }}>Here is what to expect:</p>

      <ul className="instrList" style={{ marginTop: 8, marginBottom: 12, paddingLeft: 22 }}>
        {/* Two options + Image 1 */}
        <li style={{ marginBottom: 12 }}>
          Each scenario presents two options.

          <figure className="figureCenter inList">
            <img
              src="/images/Explanation1.png"
              alt="Example of Option A (fixed outcome) vs Option B (two-outcome)"
            />
            <figcaption><em><b>Figure 1.</b> How the two options appear on screen.</em></figcaption>
          </figure>

          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            <li><b>Option A:</b> a fixed, guaranteed outcome.</li>
            <li><b>Option B:</b> 50% chance of a “high” outcome and 50% chance of a “low” outcome.</li>
          </ul>
        </li>

        {/* Slider + Image 2 */}
        <li style={{ marginBottom: 12 }}>
          Use the slider to set how much to allocate to each option.

          <figure className="figureCenter inList">
            <img
              src="/images/Explanation2.png"
              alt="Example of the allocation slider and handle"
            />
            <figcaption><em><b>Figure 2.</b> Set your allocation with the slider.</em></figcaption>
          </figure>
        </li>

        {/* Confirm */}
        <li style={{ marginBottom: 0 }}>
          Click <MiniConfirmBadge /> to record your choice and move forward.
        </li>
      </ul>

      {/* Important note as a reusable Callout */}
      <Callout
        tone="warning"
        icon={<AlertTriangle />}
        title="Important:"
      >
        You may revisit earlier scenarios to view their conditions, but once confirmed, your answers cannot be viewed or changed.
      </Callout>

      <hr style={{ margin: "18px 0 18px 0", border: "none", borderTop: "1px solid #ddd" }} />

      {/* Actions */}
      <div className="actions" style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "space-between" }}>
        <button className="startBtn" onClick={onBack} type="button">
          Back
        </button>
        <button className="startBtn" onClick={onNext} type="button">
          Start
        </button>
      </div>
    </main>
  );
}

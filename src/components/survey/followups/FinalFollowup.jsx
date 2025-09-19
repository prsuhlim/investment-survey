import React from "react";

// Small helper with a tiny tolerance to avoid floating-point false positives
const ne = (a, b, eps = 1e-9) => Math.abs(a - b) > eps;

export default function FinalFollowup({
  // allocations to show (first vs final)
  firstBaselineRow,   // { risky_share }
  lastScenarioRow,    // { risky_share }

  // just pass the current scenario object you already have on this screen
  cur,                // { s, u, d, p? } (p fixed at 0.5 in your design)

  // rest of state/handlers
  followChange, setFollowChange,
  followInfl, setFollowInfl,
  followText, setFollowText,
  onSubmit, submitDisabled,
}) {
  // --- Pull allocations safely ---
  const firstRisky = Number.isFinite(firstBaselineRow?.risky_share)
    ? Number(firstBaselineRow.risky_share)
    : null;
  const lastRisky = Number.isFinite(lastScenarioRow?.risky_share)
    ? Number(lastScenarioRow.risky_share)
    : null;

  const firstSafe = firstRisky != null ? 100 - firstRisky : null;
  const lastSafe  = lastRisky  != null ? 100 - lastRisky  : null;

  // --- Change magnitude (toward A or B) ---
  const canCompare = firstRisky != null && lastRisky != null;
  const deltaRisky = canCompare ? (lastRisky - firstRisky) : 0; // + means toward B
  const didChange  = canCompare ? ne(deltaRisky, 0) : false;
  const toward     = deltaRisky > 0 ? "B (risky)" : deltaRisky < 0 ? "A (safe)" : "";
  const absDelta   = Math.abs(deltaRisky);

  // --- Auto-detect which SINGLE aspect changed vs the fixed baseline 2% vs 5%/−1% ---
  // Baseline (SVY1): A=+2%; B: 50-50 {+5%, −1%}, p fixed at 0.5
  const diffLabel = (() => {
    const s0 = 2, u0 = 5, d0 = -1;
    const p  = 0.5; // fixed

    const s1 = Number(cur?.s);
    const u1 = Number(cur?.u);
    const d1 = Number(cur?.d);

    if (![s1, u1, d1].every(Number.isFinite)) return null;

    const meanB0 = p * u0 + (1 - p) * d0; // 2
    const meanB1 = p * u1 + (1 - p) * d1;

    const spreadB0 = Math.abs(u0 - d0);   // 6
    const spreadB1 = Math.abs(u1 - d1);

    const sChanged      = ne(s1, s0);
    const meanChanged   = ne(meanB1, meanB0);
    const spreadChanged = ne(spreadB1, spreadB0);

    const changedCount = [sChanged, meanChanged, spreadChanged].filter(Boolean).length;
    if (changedCount !== 1) return null;

    if (sChanged)      return "The safe return.";
    if (meanChanged)   return "Option B’s average return.";
    if (spreadChanged) return "Option B’s spread(risk).";
    return null;
  })();

  // --- Sequential gating ---
  // Require at least 5 characters before unlocking Q2
  const hasQ1Explanation = (followText ?? "").trim().length >= 5;
  const q2Dimmed = !hasQ1Explanation;
  const q3Dimmed = !hasQ1Explanation || !followChange;

  const gateStyles = (dimmed) => ({
    opacity: dimmed ? 0.55 : 1,
    filter: dimmed ? "grayscale(30%)" : "none",
    transition: "opacity .15s ease",
    pointerEvents: dimmed ? "none" : "auto",
  });

  return (
    <section style={{ marginTop: 20, padding: 16, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff" }}>
      <h3 style={{ marginTop: 0 }}>Final follow-up</h3>

      {/* Q1 */}
      <fieldset style={{ border: "none", padding: 0, margin: "12px 0 0 0" }}>
        <legend style={{ fontWeight: 600, marginBottom: 6 }}>
          Q1. Let’s compare your final allocation to the very first decision you made in this survey.
        </legend>

        {/* Green info box: ONLY the sole changed aspect (auto) */}
        <div
          role="note"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: ".95rem",
            color: "#0f5132",
            background: "#d1e7dd",
            border: "1px solid #badbcc",
            borderRadius: 6,
            padding: "6px 10px",
            margin: "0 0 10px",
          }}
        >
          <span aria-hidden="true">ℹ️</span>
          <span>
            {diffLabel
              ? <>Everything in this question was the same as the first question <i>except</i>: <b>{diffLabel.replace(/\.$/, "")}</b>.</>
              : <>Everything in this question was the same as the first question <i>except</i> that exactly one aspect changed.</>
            }
          </span>
        </div>

        {/* Mini cards: baseline (2% vs 5%/−1%) → current (s,u,d) */}
        {(() => {
          const s0 = 2, u0 = 5, d0 = -1;                   // baseline
          const s1 = Number(cur?.s) ?? 0;                  // current
          const u1 = Number(cur?.u) ?? 0;
          const d1 = Number(cur?.d) ?? 0;
          const fmt = (x) => `${x > 0 ? "+" : ""}${x}%`;

          const cardBase = {
            borderRadius: 10,
            padding: "10px 14px",
            minWidth: 120,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          };

          const cardA = { ...cardBase, background: "#e0f2fe" }; // sky blue
          const cardB = { ...cardBase, background: "#ede9fe" }; // lavender

          const badge = {
            display: "inline-block",
            fontSize: ".8rem",
            fontWeight: 700,
            padding: "2px 10px",
            borderRadius: 999,
            border: "1px solid #9ca3af", // grey border
            color: "#374151",            // grey text
            background: "transparent",
            marginBottom: 6,
          };

          const val = (x) => ({
            fontSize: "1rem",
            fontWeight: 600,
            color: x > 0 ? "#0f7a35" : x < 0 ? "#b44a3e" : "#374151", // green/red/gray
          });

          return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, margin: "10px 0 16px" }}>
              {/* BEFORE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={cardA}>
                  <div style={badge}>OPTION A</div>
                  <div style={val(s0)}>{fmt(s0)}</div>
                </div>
                <div style={cardB}>
                  <div style={badge}>OPTION B</div>
                  <div>
                    <span style={val(u0)}>{fmt(u0)}</span>{" / "}
                    <span style={val(d0)}>{fmt(d0)}</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div aria-hidden="true" style={{ fontSize: "1.4rem", color: "#6b7280" }}>→</div>

              {/* AFTER */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={cardA}>
                  <div style={badge}>OPTION A</div>
                  <div style={val(s1)}>{fmt(s1)}</div>
                </div>
                <div style={cardB}>
                  <div style={badge}>OPTION B</div>
                  <div>
                    <span style={val(u1)}>{fmt(u1)}</span>{" / "}
                    <span style={val(d1)}>{fmt(d1)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}



        {/* If answers are the SAME: show only the underlined note (and no initial-allocation line) */}
       {!didChange && canCompare && (
        <div style={{ marginBottom: 10 }}>
            Your decision remained the same across the two scenarios
            {firstSafe != null && firstRisky != null && (
              <> ({firstSafe}% in Option A and {firstRisky}% in Option B)</>
            )}.
         </div>
      )}
        {/* If answers DIFFER: show the initial allocation line and the change badge */}
        {didChange && (
          <>
            <div style={{ marginBottom: 8 }}>
              In the very first scenario you allocated{" "}
              <b>{firstSafe != null ? firstSafe : "—"}%</b> to A and{" "}
              <b>{firstRisky != null ? firstRisky : "—"}%</b> to B.
            </div>
            <div style={{ marginBottom: 10 }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: ".95rem",
                  color: "#92400e",
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  borderRadius: 6,
                  padding: "4px 8px",
                }}
              >
                Changed by <b>{absDelta}</b> percentage points toward <b>{toward}</b>.
              </span>
            </div>
          </>
        )}

        {/* Q1 explanation textarea (unchanged placeholder, but wording matches your request) */}
        <label style={{ display: "block", marginBottom: 6 }}>
          {didChange
            ? "Briefly explain why your allocation changed:"
            : "Briefly explain why your allocation did not change. Would another factor—or a more extreme change—have led you to choose differently?"}
        </label>
        <textarea
          value={followText}
          onChange={(e) => setFollowText(e.target.value)}
          placeholder="Type your answer here."
          style={{
            width: "100%",
            minHeight: 100,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            padding: 10,
            fontSize: "1rem",
          }}
        />
      </fieldset>

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "14px 0" }} />

      {/* Q2: Likert ratings of factors (0–5) */}
      <fieldset
        aria-disabled={q2Dimmed}
        style={{ border: "none", padding: 0, margin: 0, ...gateStyles(q2Dimmed) }}
      >
        <legend style={{ fontWeight: 600, marginBottom: 8, color: q2Dimmed ? "#6b7280" : "inherit" }}>
          Q2. From a scale of 0 to 5 (0 = no influence at all, 5 = highest influence), 
          rate the factors that affected you the most across <b><u>all scenarios</u></b>.
        </legend>

        {/* Header row: 0..5 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr repeat(6, 1fr)",
            gap: 6,
            alignItems: "center",
            marginBottom: 6,
            fontSize: ".9rem",
            fontWeight: 500,
            color: "#374151",
          }}
        >
          <div></div>
          {[0,1,2,3,4,5].map(n => (
            <div key={n} style={{ textAlign: "center" }}>{n}</div>
          ))}
        </div>

        <ul style={{ margin: 0, paddingLeft: "1.2em", listStyleType: "disc" }}>
          {[
            "Safe Return from A",
            "Upside Return from B",
            "Downside Return from B",
            "Average Return of B",
            "Spread (Dispersion) of B",
            "Inflation",
            "Attitude toward risk",
            "Balancing Investments",
            "Personal Strategy",
          ].map((factor, i) => (
            <li key={factor} style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr repeat(6, 1fr)",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <div>{factor}</div>
                {[0,1,2,3,4,5].map((num) => (
                  <label key={num} style={{ textAlign: "center", cursor: q2Dimmed ? "not-allowed" : "pointer" }}>
                    <input
                      type="radio"
                      name={`likert-${i}`}
                      value={num}
                      checked={String(followChange?.[factor] ?? "") === String(num)}
                      onChange={(e) =>
                        setFollowChange((prev) => ({
                          ...(prev || {}),
                          [factor]: e.target.value,
                        }))
                      }
                      disabled={q2Dimmed}
                    />
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>

        {/* Optional open-ended follow-up */}
        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            (Optional) Were there any other factors not listed above that influenced your decisions? Please specify:
          </label>
          <textarea
            value={followInfl}
            onChange={(e) => setFollowInfl(e.target.value)}
            placeholder="Type your answer here."
            style={{
              width: "100%",
              minHeight: 80,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: 10,
              fontSize: "1rem",
            }}
          />
        </div>
      </fieldset>



      <div className="actions" style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          className="startBtn"
          onClick={onSubmit}
          disabled={submitDisabled}
          title={submitDisabled ? "Please answer the required questions" : "Submit and finish"}
        >
          Submit follow-up
        </button>
      </div>
    </section>
  );
}

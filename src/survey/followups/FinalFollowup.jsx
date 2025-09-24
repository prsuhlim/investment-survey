// src/components/survey/followups/FinalFollowup.jsx
import React from "react";

/* ========= Small helpers ========= */
const ne = (a, b, eps = 1e-9) => Math.abs(a - b) > eps;
const toNum = (x, def = 0) => {
  const v = Number(x);
  return Number.isFinite(v) ? v : def;
};
const fmtPct = (x) => `${x > 0 ? "+" : ""}${x}%`;

/* ========= Shared mini-card styles ========= */
const MINI_CARD_MIN_WIDTH = 125;
const MINI_CARD_MIN_HEIGHT = 64;

const cardBase = {
  borderRadius: 12,
  padding: "10px 8px",
  minWidth: MINI_CARD_MIN_WIDTH,
  minHeight: MINI_CARD_MIN_HEIGHT,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid var(--svy-edge, #e5e7eb)",
  // NOTE: no background here so survey.css .svy-optionA/B colors apply (same as Header)
};

const badge = {
  display: "inline-block",
  fontSize: ".8rem",
  fontWeight: 700,
  padding: "2px 10px",
  borderRadius: 999,
  border: "1px solid #9ca3af",
  color: "#374151",
  background: "rgba(255,255,255,0.6)",
  marginBottom: 6,
};

const valStyle = (x) => ({
  fontSize: "1rem",
  fontWeight: 800,
  color: x > 0 ? "#15803d" : x < 0 ? "#b91c1c" : "#374151",
});

/* ========= Q1: Compare first vs last ========= */
export default function FinalFollowupQ1({
  firstBaselineRow,
  lastScenarioRow,
  cur,
  followText,
  setFollowText,
  onSubmitQ1,
}) {
  // Risk shares
  const firstRisky = Number.isFinite(Number(firstBaselineRow?.risky_share))
    ? Number(firstBaselineRow.risky_share)
    : null;
  const lastRisky = Number.isFinite(Number(lastScenarioRow?.risky_share))
    ? Number(lastScenarioRow.risky_share)
    : null;

  const canCompare = firstRisky != null && lastRisky != null;
  const deltaRisky = canCompare ? lastRisky - firstRisky : 0; // + means moved toward B
  const didChange = canCompare ? ne(deltaRisky, 0) : false;
  const absDelta = Math.abs(deltaRisky);

  // Dollar change on $100,000 base
  const AMOUNT = 100000;
  const currencyFmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const deltaDollars = currencyFmt.format(Math.round((absDelta / 100) * AMOUNT));

  // BEFORE (baseline) fixed
  const s0 = 2, u0 = 5, d0 = -1;
  // AFTER (current final)
  const s1 = toNum(cur?.s, 0);
  const u1 = toNum(cur?.u, 0);
  const d1 = toNum(cur?.d, 0);

  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
  const canSubmitQ1 = String(followText ?? "").trim().length >= 5;

  // Prompt line (two versions)
  let summaryLine;
  if (canCompare) {
    summaryLine = !didChange ? (
      <>Your answers remained the same across both scenarios. Briefly explain why your preferred portfolio didn&apos;t change.</>
    ) : (
      <>You invested <b>{deltaDollars}</b> more in Option B. What factor led you to change your preferred portfolio?</>
    );
  } else {
    summaryLine = <>Briefly explain why you chose your final portfolio.</>;
  }

  // Debug strip
  const branch = !canCompare ? "fallback" : !didChange ? "same" : "different";
  // eslint-disable-next-line no-console
  console.log("FFU-Q1 DEBUG", { firstRisky, lastRisky, deltaRisky, branch });

  return (
    <section
      style={{
        marginTop: 0,
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <div
        style={{
          margin: "-6px 0 8px",
          fontSize: ".85rem",
          padding: "6px 8px",
          background: "#f0f9ff",
          border: "1px dashed #93c5fd",
          borderRadius: 6,
          color: "#1f2937",
        }}
      >
        FFU-Q1 vDEBUG • first={String(firstRisky)} • last={String(lastRisky)} • branch={branch}
      </div>

      <h3 style={{ marginTop: 0 }}>Final follow-up</h3>

      <fieldset style={{ border: "none", padding: 0, margin: "12px 0 0 0" }}>
        <legend style={{ fontWeight: 600, marginBottom: 6 }}>
          Q. Compare your final allocation to your very first decision in this survey.
        </legend>

        {/* BEFORE → AFTER mini cards, with captions */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 20,
            margin: "10px 0 16px",
          }}
        >
          {/* BEFORE (Case 1) */}
          <div>
            <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>Case 1</div>
            <div style={grid2}>
              <div className="svy-card svy-optionA" style={cardBase}>
                <div style={badge}>Option A</div>
                <div style={valStyle(s0)}>{fmtPct(s0)}</div>
              </div>
              <div className="svy-card svy-optionB" style={cardBase}>
                <div style={badge}>Option B</div>
                <div>
                  <span style={valStyle(u0)}>{fmtPct(u0)}</span>{" "}
                  <span style={{ opacity: 0.6 }}>/</span>{" "}
                  <span style={valStyle(d0)}>{fmtPct(d0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div aria-hidden="true" style={{ fontSize: "1.4rem", color: "#6b7280", alignSelf: "center" }}>→</div>

          {/* AFTER (Case 30) */}
          <div>
            <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>Case 30</div>
            <div style={grid2}>
              <div className="svy-card svy-optionA" style={cardBase}>
                <div style={badge}>Option A</div>
                <div style={valStyle(s1)}>{fmtPct(s1)}</div>
              </div>
              <div className="svy-card svy-optionB" style={cardBase}>
                <div style={badge}>Option B</div>
                <div>
                  <span style={valStyle(u1)}>{fmtPct(u1)}</span>{" "}
                  <span style={{ opacity: 0.6 }}>/</span>{" "}
                  <span style={valStyle(d1)}>{fmtPct(d1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional line */}
        <div style={{ marginBottom: 10 }}>{summaryLine}</div>

        {/* Explanation */}
        <label style={{ display: "block", marginBottom: 6 }}>
          Please write a brief explanation below.
        </label>
        <textarea
          value={followText ?? ""}
          onChange={(e) => setFollowText?.(e.target.value)}
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

        <div className="actions" style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button
            className="startBtn"
            onClick={onSubmitQ1}
            disabled={!canSubmitQ1}
            title={!canSubmitQ1 ? "Please write a short explanation (≥ 5 characters)" : "Continue"}
          >
            Continue
          </button>
        </div>
      </fieldset>
    </section>
  );
}

/* ========= Q2: Final Review page (standalone) ========= */
export function FinalFollowupQ2Page({
  case29, case30,
  followChange, setFollowChange,
  followInfl, setFollowInfl,
  onSubmit,            // called only when all required rows are rated
  submitDisabled,      // optional legacy prop; if provided, still respected
}) {
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
  const fmt = (x) => `${x > 0 ? "+" : ""}${x}%`;

  const s29 = toNum(case29?.s, 0), u29 = toNum(case29?.u, 0), d29 = toNum(case29?.d, 0);
  const s30 = toNum(case30?.s, 0), u30 = toNum(case30?.u, 0), d30 = toNum(case30?.d, 0);

  // REQUIRED factors (must all be rated 0–5)
  const FACTORS = [
    "Safe Return from A",
    "Upside Return from B",
    "Downside Return from B",
    "Average Return of B",
    "Spread (Dispersion) of B",
    "Inflation",
    "Attitude toward risk",
    "Securing some guaranteed return",
    "Balancing Investments",
    "Personal Strategy",
  ];

  const allRated = FACTORS.every(f =>
    followChange &&
    Object.prototype.hasOwnProperty.call(followChange, f) &&
    String(followChange[f]).length > 0
  );

  // If parent passes submitDisabled, respect it; otherwise use completeness
  const isDisabled = (typeof submitDisabled === "boolean")
    ? submitDisabled
    : !allRated;

  return (
    <main className="container">
      <h1>Final Review</h1>

      <section style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff" }}>
        {/* Quick reminder of the last two cases */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>Case 29</div>
            <div style={grid2}>
              <div className="svy-card svy-optionA" style={cardBase}>
                <div style={badge}>Option A</div>
                <div style={valStyle(s29)}>{fmt(s29)}</div>
              </div>
              <div className="svy-card svy-optionB" style={cardBase}>
                <div style={badge}>Option B</div>
                <div>
                  <span style={valStyle(u29)}>{fmt(u29)}</span>{" "}
                  <span style={{ opacity: 0.6 }}>/</span>{" "}
                  <span style={valStyle(d29)}>{fmt(d29)}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>Case 30</div>
            <div style={grid2}>
              <div className="svy-card svy-optionA" style={cardBase}>
                <div style={badge}>Option A</div>
                <div style={valStyle(s30)}>{fmt(s30)}</div>
              </div>
              <div className="svy-card svy-optionB" style={cardBase}>
                <div style={badge}>Option B</div>
                <div>
                  <span style={valStyle(u30)}>{fmt(u30)}</span>{" "}
                  <span style={{ opacity: 0.6 }}>/</span>{" "}
                  <span style={valStyle(d30)}>{fmt(d30)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: 8 }}>
            Q. From a scale of 0 to 5 (0 = no influence at all, 5 = highest influence),
            rate the factors that affected you the most across <b><u>all scenarios</u></b>.
          </legend>

          <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(6, 1fr)", gap: 6, alignItems: "center", marginBottom: 6, fontSize: ".9rem", fontWeight: 500, color: "#374151" }}>
            <div></div>
            {[0,1,2,3,4,5].map(n => <div key={`hdr-${n}`} style={{ textAlign: "center" }}>{n}</div>)}
          </div>

          <ul style={{ margin: 0, paddingLeft: "1.2em", listStyleType: "disc" }}>
            {FACTORS.map((factor, i) => (
              <li key={factor} style={{ marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(6, 1fr)", gap: 6, alignItems: "center" }}>
                  <div>{factor}</div>
                  {[0,1,2,3,4,5].map(num => {
                    const name = `likert-${i}`;
                    const checked = String(followChange?.[factor] ?? "") === String(num);
                    return (
                      <label key={`${name}-${num}`} style={{ textAlign: "center", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name={name}
                          value={num}
                          checked={checked}
                          onChange={(e) => setFollowChange?.((prev) => ({ ...(prev || {}), [factor]: e.target.value }))}
                        />
                      </label>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>

          {!allRated && (
            <div style={{ marginTop: 8, fontSize: ".9rem", color: "#6b7280" }}>
              Please rate every row (0–5) before submitting.
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              (Optional) Were there any other factors not listed above that influenced your decisions? Please specify:
            </label>
            <textarea
              value={followInfl ?? ""}
              onChange={(e) => setFollowInfl?.(e.target.value)}
              placeholder="Type your answer here."
              style={{ width: "100%", minHeight: 80, borderRadius: 8, border: "1px solid #d1d5db", padding: 10, fontSize: "1rem" }}
            />
          </div>
        </fieldset>

        <div className="actions" style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button
            className="startBtn"
            onClick={() => { if (!isDisabled) onSubmit?.(); }}
            disabled={isDisabled}
            title={isDisabled ? "Please answer all required rows" : "Submit and finish"}
          >
            Submit
          </button>
        </div>
      </section>
    </main>
  );
}

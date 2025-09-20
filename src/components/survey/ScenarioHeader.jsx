import React from "react";
import { signClass, fmtOutcome } from "./utils/math";

export default function ScenarioHeader({
  cfg,
  cur,
  idx,
  introVariant = "auto",
  highlight = false,
}) {
  const amount = cfg.amount;
  const currency = cfg.currency;
  const moneyFmt = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  const s  = Number(cur?.s)  || 0;
  const u  = Number(cur?.u)  || 0;
  const d  = Number(cur?.d)  || 0;
  const p  = Number.isFinite(Number(cur?.p)) ? Number(cur.p) : 0.5;
  const pi = Number(cur?.pi) || 0;

  // Flags
  const isBaseline =
    introVariant === "baseline" || (introVariant === "auto" && idx === 0 && cur?.tag === "BASE");
  const isChanged =
    introVariant === "changed" || (introVariant === "auto" && idx > 0);
  const inSecondHalf = Number.isFinite(idx) && idx >= 15; // scenarios 16..31
  const isFinal = Number.isFinite(idx) && idx === 31;     // hardcoded final scenario

  // Header line
  let topLine; // JSX node
  if (isFinal) {
    const backInflationLabel = pi === 0 ? "0%" : "6%";
    topLine = (
      <>
        <b>The Final Question!</b> <br/>
        The setting is <i>exactly the same</i> as the previous page{" "}
        <i>except</i> <u>the inflation rate is back to{" "}
        <b style={{ color: "#ea580c" }}>{backInflationLabel}</b></u>.
        <br />
        Choose how you would allocate your funds given the following conditions.
      </>
    );
  } else if (isBaseline) {
    topLine = <>How would you allocate your funds under the following conditions?</>;
  } else if (isChanged && !inSecondHalf) {
    // Only show the "changed" copy in the FIRST half (items 2..15).
    topLine = cur?.isMirror ? (
      <>
        <u>Inflation is different in this scenario.</u>
        <br />
        Choose how you would allocate your funds under these new conditions.
      </>
    ) : (
      <>
        <u>The outcomes have changed.</u>
        <br />
        Choose how you would allocate your funds under these new conditions.
      </>
    );
  } else {
    // Generic line (used throughout the second half and any other fallback)
    topLine = <>Choose how you would allocate your funds given the following conditions.</>;
  }

  return (
    <div
      style={{
        marginTop: 12, marginBottom: 8,
        border: "1px solid #e5e7eb",
        borderRadius: 10, padding: 14, fontSize: "1.08rem", lineHeight: 1.5,
        background: "#e7e7e7ff",
      }}
    >
      {/* Small banner ABOVE the header for scenarios 16–31 */}
      {inSecondHalf && (
        <div
          role="note"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: ".95rem",
            color: "#92400e",
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: 6,
            padding: "6px 8px",
            margin: "0 0 8px",
          }}
        >
          <span aria-hidden="true">⚠️</span>
          <span>
            Inflation is now <b style={{ color: "#ea580c" }}>{pi}%</b> in this scenario.
          </span>
        </div>
      )}

      <p style={{ margin: 0, marginBottom: 8, fontSize: "1.1rem", fontWeight: 600 }}>
        {topLine}
      </p>

      <ul style={{ margin: 0, paddingLeft: "1.4em", lineHeight: 1.6, listStylePosition: "outside" }}>
        <li>
          You have {moneyFmt.format(amount)} to allocate between the two options below.
          <div className="row" style={{ marginTop: 8 }}>
            <div className="card optionA">
              <div className="cardHeader">
                <span className="optionBadge">Option A</span>
                <span className="titleText">Bank Deposit</span>
              </div>
              <div className="cardBody">
                <div className="line">
                  <span className="chance">100% chance</span>
                  <span
                    className={`pill ${signClass(s)}`}
                    style={highlight ? { background: "rgba(253, 224, 71, 0.35)", borderRadius: 6 } : {}}
                  >
                    {fmtOutcome(s)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card optionB">
              <div className="cardHeader">
                <span className="optionBadge">Option B</span>
                <span className="titleText">Financial Fund</span>
              </div>
              <div className="cardBody">
                <ul className="bullets tight">
                  <li className="line">
                    <span className="chance">{(p * 100).toFixed(0)}% chance</span>
                    <span
                      className={`pill ${signClass(u)}`}
                      style={highlight ? { background: "rgba(253, 224, 71, 0.35)", borderRadius: 6 } : {}}
                    >
                      {fmtOutcome(u)}
                    </span>
                  </li>
                  <li className="line">
                    <span className="chance">{(100 - p * 100).toFixed(0)}% chance</span>
                    <span
                      className={`pill ${signClass(d)}`}
                      style={highlight ? { background: "rgba(253, 224, 71, 0.35)", borderRadius: 6 } : {}}
                    >
                      {fmtOutcome(d)}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </li>

        <li>The outcomes above are realized in one year.</li>
        {pi === 6 ? (
          <li>Assume <b style={{ color: "#2563eb" }}>6% inflation</b> (overall prices increase by 6% over the year).</li>
        ) : (
          <li>Assume <b style={{ color: "#2563eb" }}>0% inflation</b> (overall prices remain the same over the year).</li>
        )}
        <li>Please ignore taxes and fees.</li>
      </ul>
    </div>
  );
}

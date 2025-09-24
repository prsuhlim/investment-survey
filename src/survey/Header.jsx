// src/components/survey/Header.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signClass, fmtOutcome } from "../state/math";

/**
 * Header (Scenario header)
 * - Expanded: instruction list + large A/B cards + (second-half) inflation note
 * - Collapsed: compact chip row
 */
export default function Header({
  cfg,
  cur,
  idx,
  highlight = false,
  collapsed = false,
  footer = null,
  // new prop to show final-case explanation
  isFinalCase = false,
}) {
  const amount = Number(cfg?.amount) || 0;
  const currency = cfg?.currency || "USD";

  const moneyFmt = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  const s = Number(cur?.s) || 0;
  const u = Number(cur?.u) || 0;
  const d = Number(cur?.d) || 0;
  const pi = Number(cur?.pi) || 0;

  // chips-only formatter
  const fmtOutcomeShort = (x) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return "";
    if (n > 0) return `+${n}%`;
    if (n < 0) return `${n}%`;
    return "0%";
  };

  // start banner at Case 15 (idx >= 14)
  const inSecondHalf = Number.isFinite(idx) && idx >= 14;

  const inflationBanner = inSecondHalf ? (
    <div className="svy-inflationNote" role="note">
      <span className="svy-inflationIcon" aria-hidden="true">⚠️</span>
      <span>
        Inflation is now <b className="svy-inflationValue">{pi}%</b>.
      </span>
    </div>
  ) : null;

  // Map JS signClass → svy-pill variants
  const pillClass = (x) => {
    const s = signClass(x); // 'gain' | 'loss' | 'neutral'
    return `svy-pill ${s}${highlight ? " svy-pill--hl" : ""}`;
  };

  return (
    <div aria-label="header" className="svy-header">
      <AnimatePresence initial={false} mode="wait">
        {!collapsed ? (
          // Expanded
          <motion.div
            key="expanded"
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="svy-box"
          >
            {inflationBanner}

            {/* Final case explanation block */}
            {isFinalCase && (
              <div
                style={{
                  marginTop: 8,
                  marginBottom: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#fff7ed",       // warm light (orange-ish)
                  border: "1px solid #fed7aa", // orange-200
                  color: "#7c2d12",            // orange-900
                }}
              >
                Conditions are <i>exactly the same as in the previous case</i> except inflation.{" "}
               <b>Inflation is now 6% again.</b>
              </div>
            )}

            <ul className="svy-list">
              <li>
                You have {moneyFmt.format(amount)} to allocate between the two options below.
                <div className="svy-row" style={{ marginTop: 8 }}>
                  {/* Option A (sure) */}
                  <div className="svy-card svy-optionA">
                    <div className="svy-cardHeader">
                      <span className="svy-optionBadge">Option A</span>
                      <span className="svy-titleText">Bank Deposit</span>
                    </div>
                    <div className="svy-cardBody">
                      <div className="svy-line">
                        <span className="svy-chance">100% chance</span>
                        <span className={pillClass(s)}>{fmtOutcome(s)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Option B (two outcomes) */}
                  <div className="svy-card svy-optionB">
                    <div className="svy-cardHeader">
                      <span className="svy-optionBadge">Option B</span>
                      <span className="svy-titleText">Financial Fund</span>
                    </div>
                    <div className="svy-cardBody">
                      <ul className="svy-bullets svy-bullets--tight">
                        <li className="svy-line">
                          <span className="svy-chance">50% chance</span>
                          <span className={pillClass(u)}>{fmtOutcome(u)}</span>
                        </li>
                        <li className="svy-line">
                          <span className="svy-chance">50% chance</span>
                          <span className={pillClass(d)}>{fmtOutcome(d)}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </li>

              <li>The outcomes above are realized in one year.</li>

              {pi === 6 ? (
                <li>
                  Assume{" "}
                  <span className="svy-pillInfo">6% inflation</span>{" "}
                  (overall prices increase by 6% over the year).
                </li>
              ) : (
                <li>
                  Assume{" "}
                  <span className="svy-pillInfo svy-pillInfo--zero">0% inflation</span>{" "}
                  (overall prices remain the same over the year).
                </li>
              )}

              <li>Please ignore taxes and fees.</li>
            </ul>
          </motion.div>
        ) : (
          // Collapsed
          <motion.div
            key="collapsed"
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="svy-collapsed"
          >
            <div className="svy-chipRow" role="group" aria-label="Scenario parameters">
              <div className="svy-chip" aria-label="Option A">
                <span className="svy-chipLabel">A:</span>
                <span className={`svy-chipVal ${s > 0 ? "pos" : s < 0 ? "neg" : "zero"}`}>
                  {fmtOutcomeShort(s)}
                </span>
              </div>
              <div className="svy-chip" aria-label="Option B up">
                <span className="svy-chipLabel">B↑:</span>
                <span className={`svy-chipVal ${u > 0 ? "pos" : u < 0 ? "neg" : "zero"}`}>
                  {fmtOutcomeShort(u)}
                </span>
              </div>
              <div className="svy-chip" aria-label="Option B down">
                <span className="svy-chipLabel">B↓:</span>
                <span className={`svy-chipVal ${d > 0 ? "pos" : d < 0 ? "neg" : "zero"}`}>
                  {fmtOutcomeShort(d)}
                </span>
              </div>
              <div className="svy-chip" aria-label="Inflation">
                <span className="svy-chipLabel">π:</span>
                <span className="svy-chipVal infl">{pi}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!collapsed && footer && (
        <div className="svy-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

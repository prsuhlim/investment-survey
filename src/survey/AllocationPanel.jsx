// src/survey/AllocationPanel.jsx
import React from "react";
import "../styles/allocation.css";
import AllocationBar from "../ui/AllocationBar";
import TriangleIcon from "../ui/TriangleIcon";

export default function AllocationPanel({
  cfg,
  cur,
  value,
  setValue,
  disabled = false,
  barRef,
  onBarPointerDown,
  onHandleKeyDown,
  // Expected values (passed from SurveyShell)
  expectedPct,
  expectedAmt,
  // Risk-state values from calcPortfolioEarnings
  upPct,
  dnPct,
  upAmt,
  dnAmt,
  confirmDisabled,
  onConfirm,
  onBack,
}) {
  const amount = (() => {
    const a = Number(cfg?.amount);
    return Number.isFinite(a) && a > 0 ? a : 100000;
  })();
  const currency = cfg?.currency || "USD";
  const P = Number.isFinite(Number(cur?.p)) ? Number(cur.p) : 0.5;

  const moneyFmt = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  const amountInA = (pctB) => (amount * (100 - (Number(pctB) || 0))) / 100;
  const amountInB = (pctB) => (amount * (Number(pctB) || 0)) / 100;

  const outcomeColor = (amt) =>
    amt === 0 ? "#374151" : amt > 0 ? "#0f7a35" : "#b44a3e";

  // "+$..." for amt >= 0, "-$..." for amt < 0
  const fmtSigned = (amt) => {
    const formattedAbs = moneyFmt.format(Math.abs(amt));
    return amt < 0 ? "-" + formattedAbs : "+" + formattedAbs;
  };

  // Track whether the user has touched/changed the allocation
  const [hasTouched, setHasTouched] = React.useState(false);
  React.useEffect(() => {
    setHasTouched(false);
  }, [cur?.id]);

  const handleSetValue = (v) => {
    if (!hasTouched) setHasTouched(true);
    setValue(v);
  };
  const handleBarPointerDown = (e) => {
    if (!hasTouched) setHasTouched(true);
    onBarPointerDown?.(e);
  };
  const handleKeyDown = (e) => {
    if (!hasTouched) setHasTouched(true);
    onHandleKeyDown?.(e);
  };

  // Inputs: hide default 50/50 until touched
  const pctB = Number(value) || 0;
  const pctA = 100 - pctB;
  const inputValueA = hasTouched ? String(pctA) : "";
  const inputValueB = hasTouched ? String(pctB) : "";

  // === Summary helpers ===
  const deterministic = Math.round(upAmt) === Math.round(dnAmt);
  const detAmt = Number.isFinite(expectedAmt) ? expectedAmt : upAmt;

  // Track immediate post-click disable so it greys out instantly
  const [justConfirmed, setJustConfirmed] = React.useState(false);
  React.useEffect(() => {
    setJustConfirmed(false);
  }, [cur?.id]);

  return (
    <>
      <div className="allocBox">
        {onBack && (
          <button
            type="button"
            className="backBtn"
            onClick={onBack}
            aria-label="Back to header"
          >
            <TriangleIcon dir="left" size={18} />
            <span className="backLabel">
              <b>Show Options Again</b>
            </span>
          </button>
        )}

        <div className="allocInstruction">
          Adjust the handle to set your investment split: move left for more in
          Option B, right for more in Option A.<br />
          You can also type in the percentages below.
        </div>

        <AllocationBar
          value={value}
          setValue={handleSetValue}
          disabled={disabled}
          barRef={barRef}
          onBarPointerDown={handleBarPointerDown}
          onHandleKeyDown={handleKeyDown}
        />

        <div className="allocInputsRow">
          <div className="allocCol">
            <div className="allocHeadingRow">
              <span className="allocHeading optA">Option A</span>
              <span className="amtHint">{moneyFmt.format(amountInA(pctB))}</span>
            </div>
            <div className="pctField">
              <input
                id="pctA"
                type="number"
                min={0}
                max={100}
                step={1}
                value={inputValueA}
                onChange={(e) => {
                  const v = Number(e.target.value ?? 0);
                  const b = Math.max(0, Math.min(100, 100 - v));
                  handleSetValue(b);
                }}
                onFocus={() => !hasTouched && setHasTouched(true)}
                disabled={disabled}
                placeholder={hasTouched ? undefined : " "}
              />
              <span className="pctSuffix">%</span>
            </div>
          </div>

          <div className="allocCol">
            <div className="allocHeadingRow">
              <span className="allocHeading optB">Option B</span>
              <span className="amtHint">{moneyFmt.format(amountInB(pctB))}</span>
            </div>
            <div className="pctField">
              <input
                id="pctB"
                type="number"
                min={0}
                max={100}
                step={1}
                value={inputValueB}
                onChange={(e) => {
                  const v = Number(e.target.value ?? 0);
                  const b = Math.max(0, Math.min(100, v));
                  handleSetValue(b);
                }}
                onFocus={() => !hasTouched && setHasTouched(true)}
                disabled={disabled}
                placeholder={hasTouched ? undefined : " "}
              />
              <span className="pctSuffix">%</span>
            </div>
          </div>
        </div>

        <div className="allocSummary">
          {deterministic ? (
            <>
              This portfolio has a <b>100% chance</b> of{" "}
              <b style={{ color: outcomeColor(detAmt) }}>
                {fmtSigned(detAmt)}
              </b>.
            </>
          ) : (
            <>
              This portfolio has a <b>{(P * 100).toFixed(0)}% chance</b> of{" "}
              <b style={{ color: outcomeColor(upAmt) }}>
                {fmtSigned(upAmt)}
              </b>{" "}
              and a <b>{((1 - P) * 100).toFixed(0)}% chance</b> of{" "}
              <b style={{ color: outcomeColor(dnAmt) }}>
                {fmtSigned(dnAmt)}
              </b>.
            </>
          )}
        </div>
      </div>

      {/* Confirm + hint stacked on the right */}
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}
        >
          <button
            type="button"
            className="startBtn"
            onClick={() => {
              setJustConfirmed(true);
              onConfirm?.();
            }}
            disabled={disabled || !!confirmDisabled || justConfirmed}
            aria-describedby={confirmDisabled ? "confirm-hint" : undefined}
            style={{
              backgroundColor:
                disabled || confirmDisabled || justConfirmed
                  ? "#d1d5db"
                  : "#000000",
              color:
                disabled || confirmDisabled || justConfirmed
                  ? "#6b7280"
                  : "#ffffff",
              cursor:
                disabled || confirmDisabled || justConfirmed
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Confirm
          </button>

          {confirmDisabled && (
            <div
              id="confirm-hint"
              aria-live="polite"
              style={{
                marginTop: 6,
                fontSize: ".9rem",
                lineHeight: 1.2,
                color: "#6b7280",
                maxWidth: 280,
                textAlign: "right",
              }}
            >
              Adjust the allocation bar at least once before you can proceed.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

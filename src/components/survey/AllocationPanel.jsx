import React from "react";
import AllocationBar from "../ui/AllocationBar";

export default function AllocationPanel({
  cfg,
  cur,
  value,
  setValue,
  disabled,
  barRef,
  onBarPointerDown,
  onHandleKeyDown,
  expectedPct,
  expectedAmt,
  upPct,
  dnPct,
  upAmt,
  dnAmt,
  confirmDisabled,
  onConfirm,
}) {
  const amount = (() => {
    const a = Number(cfg?.amount);
    return Number.isFinite(a) && a > 0 ? a : 100000;
  })();
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

  const P = Number.isFinite(Number(cur?.p)) ? Number(cur.p) : 0.5;

  const amountInA = (pctB) => amount * (100 - (Number(pctB) || 0)) / 100;
  const amountInB = (pctB) => amount * ((Number(pctB) || 0)) / 100;

  const signedPct = (x) =>
    x > 0 ? `+${x.toFixed(2)}%` : x < 0 ? `-${Math.abs(x).toFixed(2)}%` : "0.00%";
  const outcomeColor = (amt) => (amt === 0 ? "#374151" : amt > 0 ? "#0f7a35" : "#b44a3e");
  const outcomeVerb = (amt) => (amt >= 0 ? "earning" : "losing");

  return (
    <div className="panel" style={{ marginTop: 8 }}>
      <div className="panelTitle">How much would you allocate to each option?</div>
      <div className="panelHint" style={{ color: "#000000" }}>
        Drag the handle or input percentages to reflect your preferred portfolio.
      </div>

      <AllocationBar
        value={value}
        setValue={setValue}
        disabled={disabled}
        barRef={barRef}
        onBarPointerDown={onBarPointerDown}
        onHandleKeyDown={onHandleKeyDown}
        step={1}
      />

      <div className="allocInputs">
        <div className="allocInput">
          <label htmlFor="pctA">Option A</label>
          <div className="pctField">
            <input
              id="pctA"
              type="number"
              min={0}
              max={100}
              step={1}
              value={100 - value}
              onChange={(e) => {
                const v = Number(e.target.value ?? 0);
                const b = Math.max(0, Math.min(100, 100 - v));
                setValue(b);
              }}
              disabled={disabled}
            />
            <span className="pctSuffix">%</span>
          </div>
        </div>

        <div className="allocInput">
          <label htmlFor="pctB">Option B</label>
          <div className="pctField">
            <input
              id="pctB"
              type="number"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(e) => {
                const v = Number(e.target.value ?? 0);
                const b = Math.max(0, Math.min(100, v));
                setValue(b);
              }}
              disabled={disabled}
            />
            <span className="pctSuffix">%</span>
          </div>
        </div>
      </div>

      <div className="mixText" style={{ textAlign: "center" }}>
        You are investing <b style={{ color: "#000000" }}>{moneyFmt.format(amountInA(value))}</b> in Option A, and{" "}
        <b style={{ color: "#000000" }}>{moneyFmt.format(amountInB(value))}</b> in Option B.
      </div>

      <div
        style={{
          marginTop: 8,
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 10,
          fontSize: ".95rem",
        }}
      >
        {value === 0 ? (
          <>
            <p>With this portfolio,</p>
            (i) You have a 100% chance of{" "}
            <b style={{ color: outcomeColor(upAmt) }}>
              {outcomeVerb(upAmt)} {moneyFmt.format(Math.abs(upAmt))} ({signedPct(upPct)})
            </b>.
            <div style={{ marginTop: 4 }}>
              (ii) On average you would be{" "}
              <b style={{ color: outcomeColor(expectedAmt) }}>
                {outcomeVerb(expectedAmt)} {signedPct(expectedPct)}
              </b>.
            </div>
          </>
        ) : (
          <>
            <p>With this portfolio,</p>
            (i) You have a {(P * 100).toFixed(0)}% chance of{" "}
            <b style={{ color: outcomeColor(upAmt) }}>
              {outcomeVerb(upAmt)} {moneyFmt.format(Math.abs(upAmt))} ({signedPct(upPct)})
            </b>{" "}
            and a {(100 - P * 100).toFixed(0)}% chance of{" "}
            <b style={{ color: outcomeColor(dnAmt) }}>
              {outcomeVerb(dnAmt)} {moneyFmt.format(Math.abs(dnAmt))} ({signedPct(dnPct)})
            </b>.
            <div style={{ marginTop: 4 }}>
              (ii) On average you would be{" "}
              <b style={{ color: outcomeColor(expectedAmt) }}>
                {outcomeVerb(expectedAmt)} {signedPct(expectedPct)}
              </b>.
            </div>
          </>
        )}
      </div>

      <div className="actions" style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="startBtn"
          onClick={onConfirm}
          disabled={confirmDisabled}
          title={confirmDisabled ? "Adjust the handle at least once before confirming." : "Confirm and continue"}
        >
          Confirm Allocation
        </button>
      </div>
    </div>
  );
}

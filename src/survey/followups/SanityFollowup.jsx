// src/components/survey/followups/SanityFollowup.jsx
import React from "react";

export default function SanityFollowup({
  title = "A quick follow-up",
  options = [],
  primary = "",
  setPrimary = () => {},
  secondary = [],
  setSecondary = () => {},
  otherText = "",
  setOtherText = () => {},
  onSubmit = () => {},
  submitDisabled = false,
}) {
  // Defensive: always work with arrays
  const opts = Array.isArray(options) ? options : [];
  const sec  = Array.isArray(secondary) ? secondary : [];

  // Unique + sanitized radio group name (prevents cross-mount collisions)
  const rawId = React.useId();
  const groupName = React.useMemo(
    () => `sanity_${String(rawId).replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [rawId]
  );

  // Checkbox toggle
  const toggleSecondary = (key, checked) => {
    setSecondary((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return checked
        ? Array.from(new Set([...arr, key]))
        : arr.filter((x) => x !== key);
    });
  };

  // Show "Other" text box logic
  const showOtherBox = primary === "other" || sec.includes("other");

  // Dim & block secondary until a primary is chosen
  const secondaryDimmed = !primary;

  return (
    <section
      style={{
        marginTop: 20,
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#fff",
        position: "relative",
        isolation: "isolate",
        zIndex: 10000,          // sit above anything else
        pointerEvents: "auto",  // ensure we can click
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      {/* Q: Primary reason */}
      <fieldset
        role="radiogroup"
        aria-label="Main reason"
        style={{ border: "none", padding: 0, margin: 0, position: "relative", zIndex: 2 }}
      >
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>
          Q. What <u>best explains</u> your decision in <i>this</i> setting?
        </legend>

        {opts.map((opt, i) => {
          const key = String(opt?.key ?? `opt_${i}`);
          const label = String(opt?.label ?? key);
          // Provide a stable input id for label-click targeting
          const inputId = `${groupName}_radio_${key}`;

          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={key}
                checked={primary === key}
                onChange={(e) => setPrimary(e.target.value)}
                required
                style={{ marginRight: 8 }}
              />
              <label htmlFor={inputId} style={{ cursor: "pointer" }}>
                {label}
              </label>
            </div>
          );
        })}
      </fieldset>

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "14px 0" }} />

      {/* Q′: Secondary reasons (dim until primary chosen) */}
      <fieldset
        aria-disabled={secondaryDimmed}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          marginTop: 4,
          opacity: secondaryDimmed ? 0.55 : 1,
          filter: secondaryDimmed ? "grayscale(30%)" : "none",
          transition: "opacity .15s ease",
          pointerEvents: secondaryDimmed ? "none" : "auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <legend
          style={{
            fontWeight: 600,
            marginBottom: 8,
            color: secondaryDimmed ? "#6b7280" : "inherit",
          }}
        >
          Q′. Were there any <b>other reasons</b> that also influenced your decision?{" "}
          <span style={{ color: "#6b7280" }}>(Optional — select all that apply)</span>
        </legend>

        {opts.map((opt, i) => {
          const key = String(opt?.key ?? `opt_${i}`);
          const label = String(opt?.label ?? key);

          const disabledBecausePrimary = key === primary;
          const checked = sec.includes(key);
          const inputId = `${groupName}_check_${key}`;

          return (
            <div
              key={`sec_${key}`}
              style={{
                marginBottom: 8,
                color: disabledBecausePrimary ? "#9ca3af" : "inherit",
              }}
            >
              <input
                id={inputId}
                type="checkbox"
                disabled={disabledBecausePrimary}
                checked={checked}
                onChange={(e) => toggleSecondary(key, e.target.checked)}
                style={{ marginRight: 8 }}
              />
              <label htmlFor={inputId} style={{ cursor: disabledBecausePrimary ? "not-allowed" : "pointer" }}>
                {label} {disabledBecausePrimary && "(already chosen as main reason)"}
              </label>
            </div>
          );
        })}

        {showOtherBox && (
          <div style={{ marginTop: 10 }}>
            <label htmlFor={`${groupName}_other`} style={{ display: "block", marginBottom: 6 }}>
              If you selected “Other,” please specify:
            </label>
            <textarea
              id={`${groupName}_other`}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Type your explanation here."
              style={{
                width: "100%",
                minHeight: 88,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: 10,
                fontSize: "1rem",
              }}
            />
          </div>
        )}
      </fieldset>

      <div className="actions" style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="startBtn"
          onClick={onSubmit}
          disabled={submitDisabled}
          title={submitDisabled ? "Please select your main reason" : "Submit and continue"}
        >
          Submit
        </button>
      </div>
    </section>
  );
}

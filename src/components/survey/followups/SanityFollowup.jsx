import React from "react";

export default function SanityFollowup({
  options,
  primary,
  setPrimary,
  secondary,
  setSecondary,
  otherText,
  setOtherText,
  onSubmit,
  submitDisabled,
}) {
  const toggleSecondary = (key, checked) => {
    setSecondary((prev) => (checked ? [...prev, key] : prev.filter((x) => x !== key)));
  };

  const showOtherBox = primary === "other" || secondary.includes("other");

  // Dim Q′ until a primary is selected
  const secondaryDimmed = !primary;

  return (
    <section style={{ marginTop: 20, padding: 16, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff" }}>
      <h3 style={{ marginTop: 0 }}>A quick follow-up</h3>

      {/* Q: Primary reason */}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 6 }}>
          Q. What <u>best explains</u> your decision in <i>this</i> setting?
        </legend>

        {options.map((opt) => (
          <label key={opt.key} style={{ display: "block", marginBottom: 6 }}>
            <input
              type="radio"
              name="sanityPrimary"
              value={opt.key}
              checked={primary === opt.key}
              onChange={(e) => setPrimary(e.target.value)}
              required
              style={{ marginRight: 6 }}
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "14px 0" }} />

      {/* Q′: Secondary reasons (dim until primary chosen) */}
      <fieldset
        aria-disabled={secondaryDimmed}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          opacity: secondaryDimmed ? 0.55 : 1,          // light grey look
          filter: secondaryDimmed ? "grayscale(30%)" : "none",
          transition: "opacity .15s ease",
          pointerEvents: secondaryDimmed ? "none" : "auto", // ← uncomment to ENFORCE sequence
        }}
      >
        <legend style={{ fontWeight: 600, marginBottom: 6, color: secondaryDimmed ? "#6b7280" : "inherit" }}>
          Q′. Were there any <b>other reasons</b> that also influenced your decision?{" "}
          <span style={{ color:"#6b7280" }}>(Optional — select all that apply)</span>
        </legend>

        {options.map((opt) => {
          const disabledBecausePrimary = opt.key === primary;
          return (
            <label
              key={opt.key}
              style={{
                display: "block",
                marginBottom: 6,
                color: disabledBecausePrimary ? "#9ca3af" : "inherit",
              }}
            >
              <input
                type="checkbox"
                disabled={disabledBecausePrimary}
                checked={secondary.includes(opt.key)}
                onChange={(e) => toggleSecondary(opt.key, e.target.checked)}
                style={{ marginRight: 6 }}
              />
              {opt.label} {disabledBecausePrimary && "(already chosen as main reason)"}
            </label>
          );
        })}

        {showOtherBox && (
          <div style={{ marginTop: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              If you selected “Other,” please specify:
            </label>
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Type your explanation here."
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
        )}
      </fieldset>

      <div className="actions" style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
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

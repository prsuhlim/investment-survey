// src/pages/Demographics.jsx
// Route: "/demographics" — Gated demographics form with local persistence.
// Expects props.onNext() to advance in the flow.
import React from "react";
import "../styles/demographics.css"

const STORAGE_KEY = "demoForm_v2"; // bumped to avoid stale cached shapes

const DEFAULT_FORM = {
  prolificId: "",
  yob: "",
  gender: "",
  genderOther: "",
  educationLevel: "",
  educationStatus: "",
  activity: "",          // <- keep this; validation needs it
  activityOther: "",
  riskScale: "",         // blank until user interacts
};

const gateStyles = (dimmed) => ({
  opacity: dimmed ? 0.55 : 1,
  filter: dimmed ? "grayscale(30%)" : "none",
  transition: "opacity .15s ease",
  pointerEvents: dimmed ? "none" : "auto",
});

export default function Demographics({ onNext }) {
  const [form, setForm] = React.useState(() => {
    try {
      if (typeof window === "undefined") return { ...DEFAULT_FORM };
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return { ...DEFAULT_FORM };
      const parsed = JSON.parse(saved);
      // Merge with defaults so any missing keys are filled safely
      return { ...DEFAULT_FORM, ...(parsed || {}) };
    } catch {
      return { ...DEFAULT_FORM };
    }
  });

  const saveForm = (next) => {
    const data = { ...form, ...next };
    setForm(data);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {}
  };

  // --- Per-question completion flags (for gating) ---
  const q1Done = (form.prolificId ?? "").trim().length > 0;
  const q2Done = /^\d{4}$/.test(String(form.yob ?? ""));
  const q3Done =
    !!form.gender &&
    (form.gender !== "selfDescribe" || (form.genderOther ?? "").trim().length > 0);
  const q4Done = !!form.educationLevel && !!form.educationStatus;
  const q5Done =
    !!form.activity && (form.activity !== "5" || (form.activityOther ?? "").trim().length > 0);
  const q6Done = form.riskScale !== "" && form.riskScale >= 0 && form.riskScale <= 10;

  // Robust validation (same logic as flags, but all must be true)
  const allValid = q1Done && q2Done && q3Done && q4Done && q5Done && q6Done;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allValid) return;
    onNext(); // advance to survey
  };

  const genderOptions = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "nonbinary", label: "Non-binary" },
    { value: "preferNot", label: "Prefer not to say" },
    { value: "selfDescribe", label: "Self-describe", type: "other", placeholder: "Optional label" },
  ];

  const activityOptions = [
    { value: "1", label: "No participation" },
    { value: "2", label: "I only invest in safe assets (savings accounts, deposits, CDs)" },
    {
      value: "3",
      label:
        "I have some investments (e.g., stocks, bonds), but primarily long-term with minimal trading",
    },
    { value: "4", label: "I frequently trade, research investments, and monitor markets regularly" },
    { value: "5", label: "Other (please specify)", type: "other", placeholder: "Please specify" },
  ];

  return (
    <main className="container">
      <h1>Before we begin</h1>
      <hr style={{ margin: "10px 0 10px 0", border: "none", borderTop: "1px solid #ddd" }} />

      <p className="introText">Please share a few details about yourself.</p>

      {/* NOTE: demoForm class lets demographics.css override global form spacing */}
      <form className="demoForm" onSubmit={handleSubmit}>
        <ol className="qList">
          {/* 1. Prolific ID */}
          <li className="qItem" style={gateStyles(false)}>
            <label className="qLabel">
              <span className="qTitle">
                1. Prolific ID <span aria-hidden="true">*</span>
              </span>
              <div className="qDesc">
                This is needed for payment. You can copy and paste from your Prolific profile.
              </div>
            </label>
            <input
              type="text"
              placeholder="e.g., 5f3a2c9b1234abcd5678ef90"
              value={form.prolificId}
              onChange={(e) => saveForm({ prolificId: e.target.value })}
              required
            />
          </li>

          {/* 2. Year of Birth */}
          <li className="qItem" style={gateStyles(!q1Done)}>
            <label className="qLabel">
              <span className="qTitle">
                2. Year of Birth <span aria-hidden="true">*</span>
              </span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g., 1989"
              min="1900"
              max={new Date().getFullYear()}
              value={form.yob}
              onChange={(e) => saveForm({ yob: e.target.value })}
              required
            />
          </li>

          {/* 3. Gender */}
          <li className="qItem" style={gateStyles(!q2Done)}>
            <label className="qLabel">
              <span className="qTitle">
                3. Gender <span aria-hidden="true">*</span>
              </span>
            </label>
            <ChoiceGroup
              name="gender"
              value={form.gender}
              onChange={(v) =>
                saveForm({
                  gender: v,
                  genderOther: v === "selfDescribe" ? (form.genderOther ?? "") : "",
                })
              }
              otherText={form.genderOther ?? ""}
              onOtherText={(t) => saveForm({ genderOther: t })}
              required
              options={genderOptions}
            />
          </li>

          {/* 4. Highest level of education */}
          <li className="qItem" style={gateStyles(!q3Done)}>
            <label className="qLabel">
              <span className="qTitle">
                4. Highest Level of Education <span aria-hidden="true">*</span>
              </span>
            </label>

            <div className="eduRow">
              <select
                value={form.educationLevel}
                onChange={(e) => saveForm({ educationLevel: e.target.value, educationStatus: "" })}
                required
              >
                <option value="">-- Select Level --</option>
                <option value="none">No formal education</option>
                <option value="primary">Primary school</option>
                <option value="secondary">Middle/High school</option>
                <option value="college">College / University</option>
                <option value="tertiary">Graduate School</option>
              </select>

              <select
                value={form.educationStatus}
                onChange={(e) => saveForm({ educationStatus: e.target.value })}
                required
              >
                <option value="">-- Select Status --</option>
                <option value="current">Currently enrolled</option>
                <option value="dropout">Did not complete / Dropped out</option>
                <option value="completed">Completed / Graduated</option>
              </select>
            </div>
          </li>

          {/* 5. Financial Market Participation */}
          <li className="qItem" style={gateStyles(!q4Done)}>
            <label className="qLabel">
              <span className="qTitle">
                5. Financial Market Participation <span aria-hidden="true">*</span>
              </span>
              <div className="qDesc">
                Which description best fits your activeness in the financial market?
              </div>
            </label>
            <ChoiceGroup
              name="activity"
              value={form.activity}
              onChange={(v) =>
                saveForm({
                  activity: v,
                  activityOther: v === "5" ? (form.activityOther ?? "") : "",
                })
              }
              otherText={form.activityOther ?? ""}
              onOtherText={(t) => saveForm({ activityOther: t })}
              required
              options={activityOptions}
            />
          </li>

          {/* 6. General risk willingness */}
          <li className="qItem" style={gateStyles(!q5Done)}>
            <label className="qLabel">
              <span className="qTitle">
                6. Risk Tolerance <span aria-hidden="true">*</span>
              </span>
              <div className="qDesc">
                On a scale of 0 to 10, how willing are you to take risks in general?
                (0 = completely unwilling, 10 = very willing)
              </div>
            </label>

            <div className="sliderWrap">
              <div className="sliderLabels" style={{
                width: "clamp(260px, 60vw, 680px)",
                margin: "0 auto 6px auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.9rem",
                color: "#333"
              }}>
                <span>0 (Dislike Risk)</span>
                <span>10 (Enjoy Risk)</span>
              </div>

              <div className="sliderCenter" style={{ display: "flex", justifyContent: "center" }}>
                <div className="sliderRow" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={form.riskScale === "" ? 5 : Number(form.riskScale)}
                    onChange={(e) => saveForm({ riskScale: Number(e.target.value) })}
                    required
                    className="riskSlider"
                    style={{
                      WebkitAppearance: "none",
                      appearance: "none",
                      width: "clamp(260px, 60vw, 680px)",
                      height: 10,
                      borderRadius: 6,
                      background: "#ccc",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    className="riskNumber"
                    min="0"
                    max="10"
                    step="1"
                    value={form.riskScale === "" ? "" : form.riskScale}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") { saveForm({ riskScale: "" }); return; }
                      const n = Number(raw);
                      if (!Number.isNaN(n)) saveForm({ riskScale: n });
                    }}
                    onBlur={() => {
                      if (form.riskScale === "") return;
                      const n = Number(form.riskScale);
                      const clamped = Math.max(0, Math.min(10, Number.isNaN(n) ? 5 : n));
                      if (clamped !== form.riskScale) saveForm({ riskScale: clamped });
                    }}
                    aria-label="Enter a number from 0 to 10"
                    style={{
                      width: 32, minWidth: 32, maxWidth: 32, boxSizing: "border-box",
                      textAlign: "center", padding: "2px 2px",
                      border: "1px solid #d0d0d5", borderRadius: 4, fontSize: "0.85rem", background: "#fff"
                    }}
                  />
                </div>
              </div>
            </div>
          </li>
        </ol>

        <div className="actions">
          <button
            type="submit"
            className="startBtn"
            disabled={!allValid}
            aria-disabled={!allValid}
            title={!allValid ? "Please complete all required items to continue" : undefined}
          >
            Continue
          </button>
        </div>
      </form>
    </main>
  );
}

/** Reusable radio group with optional write-in for any option marked { type: "other" } */
function ChoiceGroup({
  name,
  value,
  onChange,
  options,
  required = false,
  otherText = "",
  onOtherText = () => {},
}) {
  return (
    <ul className="choiceList">
      {options.map((opt) => {
        const isOther = opt.type === "other";
        const checked = value === opt.value;
        return (
          <li key={opt.value}>
            <label className="choice">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={(e) => onChange(e.target.value)}
                required={required}
              />
              {opt.label}
            </label>

            {isOther && checked && (
              <div className="otherInline">
                <input
                  type="text"
                  placeholder={opt.placeholder || "Please specify"}
                  value={otherText}
                  onChange={(e) => onOtherText(e.target.value)}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

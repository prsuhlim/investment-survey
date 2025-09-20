// src/admin/AdminConsole.jsx
import React from "react";
import Welcome from "../components/Welcome";
import Demographics from "../components/Demographics";
import Instructions from "../components/Instructions";
import SurveyShell from "../components/survey/SurveyShell";
import FinalPage from "../components/FinalPage";
import "../styles/global.css";
import "../styles/survey.css";

// utility: export localStorage rows to CSV
function exportCSV(storagePrefix = "resp_followups") {
  const rows = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(storagePrefix)) {
      try {
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(arr)) rows.push(...arr);
      } catch {
        /* ignore */
      }
    }
  }
  if (!rows.length) {
    alert("No rows found in localStorage.");
    return;
  }
  const cols = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const csv = [cols.join(",")].concat(
    rows.map(r => cols.map(c => JSON.stringify(r[c] ?? "")).join(","))
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "survey_rows.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminConsole() {
  const [step, setStep] = React.useState("welcome"); // "welcome" | "demographics" | "instructions" | "survey" | "final"
  const [surveyIdx, setSurveyIdx] = React.useState(0);
  const [totalScenarios, setTotalScenarios] = React.useState(0);
  const [ghostMode, setGhostMode] = React.useState(false);

  // send commands to SurveyShell via BroadcastChannel
  const sendCmd = (type, extra = {}) => {
    const chan = new BroadcastChannel("survey-admin");
    chan.postMessage({ type, ...extra });
  };

  const renderStep = () => {
    if (step === "welcome") return <Welcome onNext={() => setStep("demographics")} />;
    if (step === "demographics") return <Demographics onNext={() => setStep("instructions")} />;
    if (step === "instructions") return (
      <Instructions
        onBack={() => setStep("demographics")}
        onNext={() => setStep("survey")}
      />
    );
    if (step === "survey") {
      return (
        <SurveyShell
          storageName="resp_followups_admin"
          onExit={() => setStep("instructions")}
          onFinished={() => setStep("final")}
        />
      );
    }
    if (step === "final") return <FinalPage storageName="resp_followups_admin" onExit={() => setStep("welcome")} />;
    return null;
  };

  return (
    <>
      {renderStep()}

      {/* floating admin toolbar */}
      <div
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          zIndex: 9999,
          background: "rgba(17,24,39,0.95)",
          color: "white",
          padding: 12,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minWidth: 300,
        }}
      >
        <strong style={{ fontSize: 14, marginBottom: 4 }}>Admin Console</strong>

        {/* Step navigation */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["welcome","demographics","instructions","survey","final"].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              style={{
                flex: "1 1 auto",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: step === s ? "#2563eb" : "#374151",
                color: "white",
                fontWeight: 600,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {step === "survey" && (
          <>
            {/* Scenario navigation */}
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Scenario index controls (uses BroadcastChannel)
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => sendCmd("prev")} style={{ flex: 1 }}>◀ Prev</button>
              <button onClick={() => sendCmd("next")} style={{ flex: 1 }}>Next ▶</button>
              <button onClick={() => sendCmd("finish")} style={{ flex: 1, background: "#7c3aed", color: "white" }}>Finish</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(e.currentTarget.jump.value) || 0;
                sendCmd("jump", { to: n });
              }}
              style={{ display: "flex", gap: 6, marginTop: 4 }}
            >
              <input
                name="jump"
                type="number"
                placeholder="Scenario #"
                min={0}
                style={{ flex: 1, borderRadius: 6, padding: "4px 6px" }}
              />
              <button type="submit">Go</button>
            </form>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={ghostMode}
                onChange={(e) => {
                  setGhostMode(e.target.checked);
                  sendCmd("ghost", { value: e.target.checked });
                }}
              />
              Ghost mode (skip saving)
            </label>
          </>
        )}

        <button
          onClick={() => exportCSV("resp_followups")}
          style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "#10b981", color: "white" }}
        >
          Export CSV
        </button>
      </div>
    </>
  );
}

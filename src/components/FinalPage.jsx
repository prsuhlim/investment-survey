import React from "react";
import "../styles/global.css";
import "../styles/survey.css";

/**
 * FinalPage
 *
 * Props:
 * - finishCode?: string              // external code (e.g., from Prolific / parent)
 * - storageName?: string             // defaults to "resp_followups_v1"
 * - scenarioCount?: number | null    // if provided, used to reconstruct the localStorage key
 * - homeHref?: string                // optional link to home/landing
 * - onExit?: () => void              // optional callback for a "Done" button (instead of link)
 */
export default function FinalPage({
  finishCode: finishCodeProp = null,
  storageName = "resp_followups_v1",
  scenarioCount = null,
  homeHref,
  onExit,
}) {
  // 1) Prefer prop; 2) URL (?prolific_code or ?code); 3) localStorage fallback
  const qs = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const fromUrl = qs.get("prolific_code") || qs.get("code") || null;

  const finishCode = React.useMemo(() => {
    if (finishCodeProp) return finishCodeProp;
    if (fromUrl) return fromUrl;

    // Try to reconstruct the persisted fallback code from SurveyShell
    // Key format used there: `${storageName}_${scenarios.length}_finishCode`
    if (typeof window !== "undefined") {
      if (Number.isFinite(scenarioCount)) {
        const exactKey = `${storageName}_${scenarioCount}_finishCode`;
        const exact = window.localStorage.getItem(exactKey);
        if (exact) return exact;
      }

      // As a last resort, scan for any *_finishCode keys under this storageName
      const candidates = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i) || "";
        if (k.startsWith(`${storageName}_`) && k.endsWith("_finishCode")) {
          const v = window.localStorage.getItem(k);
          if (v) candidates.push(v);
        }
      }
      if (candidates.length) return candidates[candidates.length - 1]; // latest
    }

    // If nothing found, show placeholder (should be rare when integrated with SurveyShell)
    return "—";
  }, [finishCodeProp, fromUrl, scenarioCount, storageName]);

  // Copy-to-clipboard feedback
  const [copied, setCopied] = React.useState(false);
  const copyCode = React.useCallback(async () => {
    try {
      await (navigator?.clipboard?.writeText?.(finishCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback for older browsers / non-HTTPS
      const ta = document.createElement("textarea");
      ta.value = finishCode;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, [finishCode]);

  return (
    <main className="container">
      <h1 style={{ fontSize: "1.9rem", marginBottom: 6 }}>Thank you for completing this survey!</h1>
      <p style={{ marginTop: 0 }}>Your responses have been saved.</p>

      <div className="progressWrap" style={{ marginTop: 10 }}>
        <div className="progressBar"><div className="fill" style={{ width: "100%" }} /></div>
        <div className="progressText">All items completed</div>
      </div>

      <div
        className="doneBox"
        style={{
          margin: "16px 0 10px 0",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 14,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: "1.05rem", marginBottom: 8 }}>
          The Prolific <strong>Completion Code</strong> needed for payment: 
        </div>

        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 12,
            }}
            >
            {/* Row: code + copy button */}
            <div
                style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                }}
            >
                <code
                style={{
                    fontSize: "1.2rem",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "10px 14px",
                    wordBreak: "break-all",
                    textAlign: "center",
                }}
                >
                {finishCode}
                </code>

                <button
                type="button"
                className="startBtn"
                onClick={copyCode}
                style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}
                aria-label="Copy completion code to clipboard"
                >
                Copy
                </button>
            </div>

            {/* Feedback line below */}
            <span
                role="status"
                aria-live="polite"
                style={{
                fontSize: 13,
                color: copied ? "#065f46" : "transparent",
                transition: "color .15s ease",
                marginTop: 6,
                }}
            >
                {copied ? "Code has been copied to Clipboard" : "placeholder"}
            </span>
            </div>
      </div>

      {/* Optional nav back/home */}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
        {typeof onExit === "function" ? (
          <button className="startBtn" onClick={onExit}>Done</button>
        ) : homeHref ? (
          <a className="startBtn" href={homeHref} style={{ textDecoration: "none" }}>Done</a>
        ) : null}
      </div>
    </main>
  );
}

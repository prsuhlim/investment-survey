// src/app/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// Pages (moved under src/pages/)
import Welcome from "../pages/Welcome";
import Demographics from "../pages/Demographics";
import Instructions from "../pages/Instructions";
import FinalPage from "../pages/FinalPage";

// Survey (v2 orchestrator)
import SurveyShell from "../survey/SurveyShell";

// Optional admin console
import AdminConsole from "../admin/AdminConsole";

// Global styles
import "../styles/global.css";
import "../styles/survey.css";

/** ---------- Minimal error boundary ---------- */
class PageBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <main className="container" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Something went wrong on this page.</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#b91c1c" }}>
            {String(this.state.err?.message || this.state.err)}
          </pre>
        </main>
      );
    }
    return this.props.children;
  }
}

/** ---------- Simple step flow mounted at "/" ---------- */
function FlowApp() {
  const navigate = useNavigate();

  // Persist where the respondent is in the flow
  const [step, setStep] = React.useState(() => {
    try {
      return localStorage.getItem("app_step_v2") || "welcome";
    } catch {
      return "welcome";
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("app_step_v2", step);
    } catch {}
  }, [step]);

  if (step === "welcome") {
    return (
      <PageBoundary>
        <Welcome onNext={() => setStep("demographics")} />
      </PageBoundary>
    );
  }

  if (step === "demographics") {
    return (
      <PageBoundary>
        <Demographics onNext={() => setStep("instructions")} />
      </PageBoundary>
    );
  }

  if (step === "instructions") {
    return (
      <PageBoundary>
        <Instructions
          onBack={() => setStep("demographics")}
          onNext={() => setStep("survey")}
        />
      </PageBoundary>
    );
  }

  if (step === "survey") {
    return (
      <PageBoundary>
        <SurveyShell
          onExit={() => setStep("instructions")}
          onFinished={() => navigate("/final")}
        />
      </PageBoundary>
    );
  }

  return null;
}

/** ---------- App with routes ---------- */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FlowApp />} />
        <Route
          path="/final"
          element={
            <PageBoundary>
              <FinalPage />
            </PageBoundary>
          }
        />
        <Route
          path="/admin"
          element={
            <PageBoundary>
              <AdminConsole />
            </PageBoundary>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

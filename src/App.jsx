// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Welcome from "./components/Welcome";
import Demographics from "./components/Demographics";
import Instructions from "./components/Instructions";
import SurveyShell from "./components/survey/SurveyShell";
import FinalPage from "./components/FinalPage";
import AdminConsole from "./admin/AdminConsole";

import "./styles/global.css";
import "./styles/survey.css";

/** ---------- Tiny ErrorBoundary so crashes aren’t a white screen ---------- */
class PageBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { /* no-op, could log */ }
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

/** ---------- Step-based flow mounted at "/" ---------- */
function FlowApp() {
  const navigate = useNavigate();

  const [step, setStep] = React.useState(() => {
    try {
      return localStorage.getItem("app_step_v1") || "welcome";
    } catch {
      return "welcome";
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem("app_step_v1", step); } catch {}
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

/** ---------- Header that only shows "Admin" link if ?admin=1 ---------- */
function HeaderWithOptionalAdminLink() {
  const location = useLocation();
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const showAdmin = params.get("admin") === "1";

  return (
    <header style={{ padding: "6px 10px", borderBottom: "1px solid #ddd" }}>
      <Link to="/" style={{ marginRight: 12 }}>Home</Link>
      {showAdmin && location.pathname !== "/admin" && <Link to="/admin">Admin</Link>}
    </header>
  );
}

/** ---------- App with routes (no wildcard fallback) ---------- */
export default function App() {
  return (
    <BrowserRouter>
      <HeaderWithOptionalAdminLink />
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

import React from "react";
import Welcome from "./components/Welcome";
import Demographics from "./components/Demographics";
import Instructions from "./components/Instructions";
import Survey from "./components/survey/SurveyShell";
import "./styles/global.css";

function DoneScreen() {
  return (
    <main className="container">
      <h1>All set — thank you!</h1>
      <p>Your responses have been recorded. You may safely close this window.</p>
    </main>
  );
}

export default function App() {
  // Persist step so accidental refresh doesn't dump respondents back to the start
  const [step, setStep] = React.useState(() => {
    try {
      const saved = localStorage.getItem("app_step_v1");
      return saved || "welcome";
    } catch {
      return "welcome";
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem("app_step_v1", step); } catch {}
  }, [step]);

  if (step === "welcome") {
    return <Welcome onNext={() => setStep("demographics")} />;
  }

  if (step === "demographics") {
    return <Demographics onNext={() => setStep("instructions")} />;
  }

  if (step === "instructions") {
    return (
      <Instructions
        onBack={() => setStep("demographics")}
        onNext={() => setStep("survey")}
      />
    );
  }

  if (step === "survey") {
    return (
      <Survey
        onExit={() => setStep("instructions")}
        onFinished={() => setStep("done")}
      />
    );
  }

  return <DoneScreen />;
}

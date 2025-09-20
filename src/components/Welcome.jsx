import React from "react";

export default function Welcome({ onNext }) {
  return (
    <main className="container" style={{ lineHeight: 2 }}>

      <h1 style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}>Welcome!</h1>

      <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "0.8rem 0" }} />

      <h2 style={{ fontSize: "1.2rem", fontWeight: "normal", marginBottom: "1.5rem" }}>
        Thank you for participating in our survey.
      </h2>

      <p>
        In this survey, you will be presented with a series of hypothetical financial
        scenarios and asked to make investment decisions based on the information provided.
      </p>

      <p>
        <strong>There are no right or wrong answers.</strong> We are interested in your
        genuine choices and perspectives, which will help us better understand how
        individuals approach financial decision-making.
      </p>

      <ul style={{ marginTop: "1rem", marginBottom: "1.5rem", paddingLeft:"3rem" }}>
        <li>The survey should take approximately 30 minutes to complete.</li>
        <li>All responses will remain anonymous and strictly confidential.</li>
        <li>A completion code will be provided at the end of the survey.</li>
      </ul>

      {/* Right-aligned button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
        <button className="startBtn" onClick={onNext}>
          Start Survey
        </button>
      </div>
    </main>
  );
}

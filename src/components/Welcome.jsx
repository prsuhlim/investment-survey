import React from "react";

export default function Welcome({ onNext }) {
  return (
    <main className="container">
      <h1>Welcome!</h1>
      <h2>Thank you for participating in our survey.</h2>

      <p>
        In this survey, you will be presented with a series of hypothetical financial
        scenarios and asked to make investment decisions based on the information provided.
      </p>

      <p>
        <strong>There are no right or wrong answers.</strong> We are interested in your
        genuine choices and perspectives, which will help us better understand how
        individuals approach financial decision-making.
      </p>

      <ul>
        <li>The survey should take approximately 15–20 minutes to complete.</li>
        <li>All responses will remain anonymous and strictly confidential.</li>
        <li>A completion code and link will be provided at the end of the survey.</li>
      </ul>

      <button className="startBtn" onClick={onNext}>
        Start Survey
      </button>
    </main>
  );
}

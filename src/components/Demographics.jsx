import React from "react";
import "../styles/demographics.css";

export default function Demographics({ onNext }) {
  const [form, setForm] = React.useState(() => {
    try {
      const saved = localStorage.getItem("demoForm_v1");
      return saved ? JSON.parse(saved) : {
        prolificId: "", yob: "", gender: "", education: "",
        activity: "", activityOther: "",
      };
    } catch {
      return { prolificId: "", yob: "", gender: "", education: "", activity: "", activityOther: "" };
    }
  });

  const saveForm = (next) => {
    const data = { ...form, ...next };
    setForm(data);
    localStorage.setItem("demoForm_v1", JSON.stringify(data));
  };

  const allValid = React.useMemo(() => {
    const idOk = form.prolificId.trim().length > 0;
    const yobOk = /^\d{4}$/.test(form.yob);
    const genderOk = !!form.gender;
    const eduOk = !!form.education;
    const actOk = !!form.activity && (form.activity !== "5" || form.activityOther.trim().length > 0);
    return idOk && yobOk && genderOk && eduOk && actOk;
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allValid) return;
    onNext(); // advance to survey
  };

  return (
    <main className="container">
      <div className="pageTitle">
        <h1>Before we begin</h1>
        <h2>Please share a few details about yourself</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <ol className="qList">
          {/* 1. Prolific ID */}
          <li className="qItem">
            <label className="qLabel">
              <span className="qTitle">1. Prolific ID <span aria-hidden="true">*</span></span>
              <div className="qDesc">Please copy exactly as shown in your Prolific profile.</div>
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
          <li className="qItem">
            <label className="qLabel">
              <span className="qTitle">2. Year of Birth <span aria-hidden="true">*</span></span>
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
          <li className="qItem">
            <label className="qLabel">
              <span className="qTitle">3. Gender <span aria-hidden="true">*</span></span>
            </label>
            <ul className="choiceList">
              <li>
                <label className="choice">
                  <input
                    type="radio" name="gender" value="female"
                    checked={form.gender === "female"}
                    onChange={(e) => saveForm({ gender: e.target.value })}
                    required
                  />
                  Female
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="gender" value="male"
                    checked={form.gender === "male"}
                    onChange={(e) => saveForm({ gender: e.target.value })}
                  />
                  Male
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="gender" value="nonbinary"
                    checked={form.gender === "nonbinary"}
                    onChange={(e) => saveForm({ gender: e.target.value })}
                  />
                  Non-binary
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="gender" value="preferNot"
                    checked={form.gender === "preferNot"}
                    onChange={(e) => saveForm({ gender: e.target.value })}
                  />
                  Prefer not to say
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="gender" value="selfDescribe"
                    checked={form.gender === "selfDescribe"}
                    onChange={(e) => saveForm({ gender: e.target.value })}
                  />
                  Self-describe
                </label>
              </li>
            </ul>
          </li>

          {/* 4. Highest education */}
          <li className="qItem">
            <label className="qLabel">
              <span className="qTitle">4. Highest Level of Education Completed <span aria-hidden="true">*</span></span>
            </label>
            <ul className="choiceList">
              <li>
                <label className="choice">
                  <input
                    type="radio" name="education" value="none"
                    checked={form.education === "none"}
                    onChange={(e) => saveForm({ education: e.target.value })}
                    required
                  />
                  No formal schooling
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="education" value="highschool"
                    checked={form.education === "highschool"}
                    onChange={(e) => saveForm({ education: e.target.value })}
                  />
                  High school
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="education" value="college"
                    checked={form.education === "college"}
                    onChange={(e) => saveForm({ education: e.target.value })}
                  />
                  College / University
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="education" value="grad"
                    checked={form.education === "grad"}
                    onChange={(e) => saveForm({ education: e.target.value })}
                  />
                  Graduate school
                </label>
              </li>
            </ul>
          </li>

          {/* 5. Financial Market Participation */}
          <li className="qItem">
            <label className="qLabel">
              <span className="qTitle">5. Financial Market Participation <span aria-hidden="true">*</span></span>
              <div className="qDesc">Which description best fits your activeness in the financial market?</div>
            </label>
            <ul className="choiceList">
              <li>
                <label className="choice">
                  <input
                    type="radio" name="activity" value="1"
                    checked={form.activity === "1"}
                    onChange={(e) => saveForm({ activity: e.target.value, activityOther: "" })}
                    required
                  />
                  No participation
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="activity" value="2"
                    checked={form.activity === "2"}
                    onChange={(e) => saveForm({ activity: e.target.value, activityOther: "" })}
                  />
                  I only invest in safe accounts (savings accounts or deposits)
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="activity" value="3"
                    checked={form.activity === "3"}
                    onChange={(e) => saveForm({ activity: e.target.value, activityOther: "" })}
                  />
                  I have some investments (e.g., stocks, bonds, retirement accounts),
                  primarily long-term with minimal trading
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="activity" value="4"
                    checked={form.activity === "4"}
                    onChange={(e) => saveForm({ activity: e.target.value, activityOther: "" })}
                  />
                  I frequently trade, research investments, and monitor markets regularly
                </label>
              </li>
              <li>
                <label className="choice">
                  <input
                    type="radio" name="activity" value="5"
                    checked={form.activity === "5"}
                    onChange={(e) => saveForm({ activity: e.target.value })}
                  />
                  Other (please specify)
                </label>
                {form.activity === "5" && (
                  <div className="otherInline">
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={form.activityOther}
                      onChange={(e) => saveForm({ activityOther: e.target.value })}
                    />
                  </div>
                )}
              </li>
            </ul>
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

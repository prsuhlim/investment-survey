import React from "react";
import { AnimatePresence, motion } from "framer-motion";

import TopNav from "./TopNav";
import ProgressBar from "./ProgressBar";
import ScenarioHeader from "./ScenarioHeader";
import AllocationPanel from "./AllocationPanel";
import ReasonBox from "./followups/ReasonBox";
import SanityFollowup from "./followups/SanityFollowup";
import FinalFollowup from "./followups/FinalFollowup";
import MidBreak from "./MidBreak";

import useLocalRows from "./hooks/useLocalRows";
import useProgress from "./hooks/useProgress";

import useScenarios from "./hooks/useScenarios";
import useAllocation from "./hooks/useAllocation";
import useFollowups from "./hooks/useFollowups";

import { readUrlConfig } from "./utils/urlConfig";
import { clamp, calcPortfolioEarnings } from "./utils/math";
import "../../styles/global.css";
import "../../styles/survey.css";

/** Error boundary to avoid total crash on unexpected runtime errors */
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(err){ return { hasError: true, err }; }
  componentDidCatch(){/* no-op */ }
  render(){
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="container" style={{ paddingTop: 16 }}>
        <h1>Something went wrong</h1>
        <p style={{ color: "#b91c1c" }}>The survey screen hit an unexpected error and stopped rendering.</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#fff7ed", border: "1px solid #fed7aa", padding: 12, borderRadius: 8 }}>
{String(this.state.err?.message || this.state.err || "Unknown error")}
        </pre>
      </main>
    );
  }
}

export default function SurveyShell(props) {
  return (
    <ErrorBoundary>
      <SurveyInner {...props} />
    </ErrorBoundary>
  );
}

function SurveyInner({
  onExit,
  onFinished,
  storageName = "resp_followups_v1",
  introVariant = "auto",
  requireReasonOnConfirm = false,
  requireReasonForTag = "BASE",
}) {
  const cfg = readUrlConfig();
  const scenarios = useScenarios(cfg);

  const [rows, setRows] = useLocalRows(`${storageName}_${scenarios.length}`);
  const { idx, setIdx, setFurthestVisited, goNextLinear, maxVisitedIdx } =
    useProgress(scenarios, rows);

  const cur = Number.isFinite(idx) ? (scenarios[idx] || null) : null;
  const curAnswer = cur ? rows.find(r => r.order === cur.order) : null;
  const isConfirmed = !!curAnswer;
  const isViewingPast = Number.isFinite(idx) ? (idx < maxVisitedIdx) : false;

  const alloc = useAllocation({
    cfg, cur, isConfirmed, isViewingPast,
    onTouched: () => {},
  });

  const finishCode = React.useMemo(() => makeCompletionCode(rows.length), [rows.length]);
  const finished = Number.isFinite(idx) && idx >= scenarios.length;

  const needReason = React.useMemo(() => {
    // Skip the open-ended reason on Question 16 (idx === 15)
    if (Number.isFinite(idx) && idx === 15) return false;

    if (!requireReasonForTag && !requireReasonOnConfirm) return false;
    if (requireReasonOnConfirm) return true;

    const set = new Set(Array.isArray(requireReasonForTag) ? requireReasonForTag : [requireReasonForTag]);
    return !!(cur && set.has(cur.tag));
  }, [cur, idx, requireReasonForTag, requireReasonOnConfirm]);

  // Midpoint rest screen after the 15th follow-up
  const [showMidBreak, setShowMidBreak] = React.useState(false);

  // ---------- Final follow-up local state ----------
  const [followChange, setFollowChange] = React.useState("");
  const [followInfl, setFollowInfl] = React.useState("");
  const [followText, setFollowText] = React.useState("");

  // Hardcode last index as requested
  const LAST_INDEX = 31;

  // Safely compute the first baseline row and the last (non-mirror) scenario row
  const firstBaselineRow = React.useMemo(() => {
    if (!rows || !rows.length) return null;
    const onlyBaselines = rows.filter(r => r?.is_baseline);
    if (onlyBaselines.length) {
      // pick earliest by order
      return onlyBaselines.sort((a,b) => (a.order ?? 1e9) - (b.order ?? 1e9))[0];
    }
    // fallback: earliest row
    return rows.slice().sort((a,b) => (a.order ?? 1e9) - (b.order ?? 1e9))[0] ?? null;
  }, [rows]);

  const lastScenarioRow = React.useMemo(() => {
    if (!rows || !rows.length) return null;
    const nonMirrorLasts = rows.filter(r => r?.is_last && !r?.is_mirror);
    if (nonMirrorLasts.length) return nonMirrorLasts[nonMirrorLasts.length - 1];
    // fallback: try by LAST_INDEX order
    const intended = scenarios[LAST_INDEX]?.order;
    if (intended != null) {
      const match = rows.find(r => r.order === intended);
      if (match) return match;
    }
    // final fallback: most recent row
    return rows[rows.length - 1] ?? null;
  }, [rows, scenarios]);

  // useFollowups controls follow-up modals/screens
  const fup = useFollowups({
    cfg, cur, rows, setRows,
    isConfirmed,
    needReason,
    idx,
    firstBaselineRow,
    lastScenarioRow,
    onAdvance: () => {
      setFurthestVisited(v => Math.max(v ?? 0, idx + 1));
      goNextLinear();
    },
    onMidBreak: () => setShowMidBreak(true),
  });

  // Block nav while any follow-up UI is open
  const followupOpen = fup.showReason || fup.showSanity || fup.showMidSanity || fup.showFinal;

  React.useEffect(() => {
    setFurthestVisited(v => Math.max(v ?? 0, idx));
  }, [idx, setFurthestVisited]);

  if (!scenarios.length) {
    return (
      <main className="container">
        <h1>Investment Scenarios</h1>
        <p>Unable to load scenarios. Please check your configuration.</p>
        {typeof onExit === "function" && <button className="startBtn" onClick={onExit}>Back</button>}
      </main>
    );
  }

  if (finished) {
    return (
      <main className="container">
        <h1>Investment Scenarios</h1>
        <div className="progressWrap">
          <div className="progressBar"><div className="fill" style={{ width: "100%" }} /></div>
          <div className="progressText">All items completed</div>
        </div>
        <p>Thanks for completing this section. Your responses have been saved.</p>
        <div className="doneBox" style={{ margin: "10px 0 16px 0" }}>
          <div><strong>Completion code:</strong> <code>{finishCode}</code></div>
        </div>
        <div className="actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            className="startBtn"
            onClick={() => {
              if (!rows.length) return;
              const header = Object.keys(rows[0]);
              const csv = [header.join(","), ...rows.map(r => header.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              a.download = `${storageName}.csv`;
              a.click();
            }}
          >
            Download CSV
          </button>
          {typeof onFinished === "function" && (
            <button className="startBtn" onClick={onFinished}>Continue</button>
          )}
        </div>
      </main>
    );
  }

  if (!cur) {
    return (
      <main className="container">
        <h1>Investment Scenarios</h1>
        <p>Loading…</p>
      </main>
    );
  }

  // --- midpoint rest screen right after submitting the 15th follow-up
  if (showMidBreak) {
    const nextPi = Number(scenarios[idx + 1]?.pi);
    const inflText = Number.isFinite(nextPi) ? `${nextPi}%` : "0%";
    const pct = Math.round(((idx + 1) / scenarios.length) * 100);
    return (
      <MidBreak
        pct={pct}
        inflationText={inflText}
        onContinue={() => {
          setShowMidBreak(false);
          setFurthestVisited(v => Math.max(v ?? 0, idx + 1));
          goNextLinear(); // proceed to scenario 16 (index 15)
        }}
      />
    );
  }

  const P = Number.isFinite(Number(cur.p)) ? Number(cur.p) : 0.5;
  const safeAmount = Math.max(1, Number(cfg.amount) || 0); // avoid zeros
  const { upPct, dnPct, upAmt, dnAmt } = calcPortfolioEarnings({
    amount: safeAmount,
    pctB: alloc.value,
    s: Number(cur.s) || 0,
    u: Number(cur.u) || 0,
    d: Number(cur.d) || 0,
  });
  const expectedPct = P * upPct + (1 - P) * dnPct;
  const expectedAmt = P * upAmt + (1 - P) * dnAmt;

  const progressPct = Math.round((idx / scenarios.length) * 100);

  const scenarioVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -20 },
  };

  // Block nav clicks while any follow-up is open
  const onBack = () => {
    if (followupOpen) return;
    if (idx > 0) setIdx(idx - 1);
    else if (typeof onExit === "function") onExit();
  };
  const onForwardVisited = () => {
    if (followupOpen) return;
    if (idx < maxVisitedIdx) setIdx(Math.min(maxVisitedIdx, idx + 1));
  };

  const persistRow = (row) =>
    setRows(xs => (xs.some(r => r.order === row.order && r.tag === row.tag) ? xs : [...xs, row]));

  const onConfirm = () => {
    if (!cur || isConfirmed) return;
    const row = {
      order: cur.order,
      scenario_id: cur.id,
      tag: cur.tag,
      s: Number(cur.s) || 0,
      u: Number(cur.u) || 0,
      d: Number(cur.d) || 0,
      p: P,
      risky_share: clamp(alloc.value, 0, 100),
      pi: Number(cur.pi) || 0,
      is_baseline: !!cur.isBaseline,
      is_sanity:   !!cur.isSanity,
      is_last:     !!cur.isLast,
      is_mirror:   !!cur.isMirror,
      ts: Date.now(),
      ua: (typeof navigator !== "undefined" ? navigator.userAgent : "NA"),
    };
    persistRow(row);

    // Do not advance when a follow-up is required
    if (needReason) { fup.openReason(); return; }
    if (cur.isSanity) { fup.openSanity(); return; }
    // Midpoint follow-up on the 15th scenario (index 14)
    if (idx === 14) { fup.openMidSanity(); return; }
    // Final follow-up after last mirror scenario
    if (cur.isLast && cur.isMirror) { fup.openFinal(); return; }

    // Otherwise, proceed
    fup.advance();
  };

  // ---------- Final follow-up submit wiring ----------

    // Factors required for Q2 ratings (0–5)
    const factors = [
    "Safe Return from A",
    "Upside Return from B",
    "Downside Return from B",
    "Average Return of B",
    "Spread (Dispersion) of B",
    "Inflation",
    "Attitude toward risk",
    "Balancing Investments",
    "Personal Strategy",
    ];

    // Q1: require ≥ 5 characters
    const q1Complete = (followText ?? "").trim().length >= 5;

    // Q2: every factor must be rated (0–5)
    const q2Complete = factors.every(f => followChange && followChange[f] !== undefined);

    // Final guard (open-ended 'other factors' remains optional)
    const canSubmitFinal = q1Complete && q2Complete;

    const handleFinalSubmit = () => {
    // save a synthetic "final follow-up" row (distinct tag)
    const finalOrder = scenarios[LAST_INDEX]?.order ?? (rows[rows.length - 1]?.order ?? "final");
    const payload = {
        order: finalOrder,
        scenario_id: cur?.id ?? "final",
        tag: "FINAL_FOLLOWUP",
        follow_change: followChange,                     // Likert object: { factor: "0".."5" }
        follow_infl: followInfl?.trim?.() ?? "",        // optional open-ended text (you can rename later)
        follow_text: (followText ?? "").trim(),         // Q1 explanation
        ts: Date.now(),
        ua: (typeof navigator !== "undefined" ? navigator.userAgent : "NA"),
    };
    setRows(xs => [...xs, payload]);

    // advance to completion screen
    setFurthestVisited(v => Math.max(v ?? 0, idx + 1));
    goNextLinear(); // idx becomes scenarios.length -> finished screen
    };

  const blurNow = alloc.controlsLocked && !fup.showFinal;

  return (
    <main className="container">
      <h1>Investment Scenarios</h1>

      <ProgressBar pct={progressPct} />
      <TopNav
        idx={idx}
        total={scenarios.length}
        maxVisitedIdx={maxVisitedIdx}
        onBack={onBack}
        onForward={onForwardVisited}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${cur.id}|pi=${cur.pi}`}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeOut" }}
          variants={scenarioVariants}
        >
          <ScenarioHeader
            cfg={cfg}
            cur={cur}
            idx={idx}
            introVariant={introVariant}
            highlight={alloc.highlight}
          />

          {!alloc.panelUnlocked && !isViewingPast ? (
            <div className="actions" style={{ marginTop: 6, display: "flex", justifyContent: "right" }}>
              <button type="button" className="startBtn" onClick={alloc.unlock} title="Proceed to set your allocation">
                ✓ Proceed to Allocation
              </button>
            </div>
          ) : null}

          <div
            style={{
                filter: blurNow ? "blur(3px)" : "none",
                pointerEvents: blurNow ? "none" : "auto",
                transition: "filter .15s ease",
            }}
            >
            <AllocationPanel
                cfg={cfg}
                cur={cur}
                value={alloc.value}
                setValue={alloc.setValue}
                disabled={alloc.controlsLocked}
                barRef={alloc.barRef}
                onBarPointerDown={alloc.onBarPointerDown}
                onHandleKeyDown={alloc.onHandleKeyDown}
                expectedPct={expectedPct}
                expectedAmt={expectedAmt}
                upPct={upPct}
                dnPct={dnPct}
                upAmt={upAmt}
                dnAmt={dnAmt}
                confirmDisabled={alloc.confirmDisabled}
                onConfirm={onConfirm}
            />
            </div>

          {fup.showReason && (
            <ReasonBox
              value={fup.reasonText}
              setValue={fup.setReasonText}
              onSubmit={fup.submitReason}
              disabled={isViewingPast}
            />
          )}

          {fup.showSanity && cur.isSanity && (
            <SanityFollowup
              options={fup.shuffledReasonOptions}
              primary={fup.primaryReason}
              setPrimary={fup.setPrimaryReason}
              secondary={fup.secondaryReasons}
              setSecondary={fup.setSecondaryReasons}
              otherText={fup.sanityOtherText}
              setOtherText={fup.setSanityOtherText}
              onSubmit={fup.submitSanity}
              submitDisabled={!fup.primaryReason}
            />
          )}

          {fup.showMidSanity && (
            <SanityFollowup
              title="Quick check-in (midway)"
              options={fup.shuffledReasonOptions}
              primary={fup.midPrimary}
              setPrimary={fup.setMidPrimary}
              secondary={fup.midSecondary}
              setSecondary={fup.setMidSecondary}
              otherText={fup.midOtherText}
              setOtherText={fup.setMidOtherText}
              onSubmit={fup.submitMidSanity}
              submitDisabled={!fup.midPrimary}
            />
          )}

          {fup.showFinal && (cur.isLast && cur.isMirror) && (
            <FinalFollowup
              firstBaselineRow={firstBaselineRow ?? {}}
              lastScenarioRow={lastScenarioRow ?? {}}
              cur={cur}  // used to auto-detect changed aspect vs baseline
              followChange={followChange}
              setFollowChange={setFollowChange}
              followInfl={followInfl}
              setFollowInfl={setFollowInfl}
              followText={followText}
              setFollowText={setFollowText}
              onSubmit={handleFinalSubmit}
              submitDisabled={!canSubmitFinal}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

/** deterministic completion code */
function makeCompletionCode(n) {
  const now = new Date();
  const base = `${n}-${now.getFullYear()}-${now.getTime()}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `JMP-${(h >>> 0).toString(36).toUpperCase()}`;
}

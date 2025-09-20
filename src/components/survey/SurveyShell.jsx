// src/components/survey/SurveyShell.jsx
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

// NEW: server append helper
import { sendFinalRow } from "./utils/sendFinalRow";

/** Error boundary */
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(err){ return { hasError: true, err }; }
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

// NEW: pull demographics saved by your Demographics page
function getDemoFromStorage() {
  if (typeof window === "undefined") return {};
  const ls = window.localStorage;
  return {
    resp_id:    ls.getItem("resp_id")          || "",
    age:        ls.getItem("demo_age")         || "",
    gender:     ls.getItem("demo_gender")      || "",
    education:  ls.getItem("demo_education")   || "",
    country:    ls.getItem("demo_country")     || "",
  };
}

// NEW: meta bundle for CSV
function buildMeta({ cfg, scenarios, rows }) {
  const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "NA");

  // infer starting inflation from first baseline row; fallback to first scenario
  let started_inflation = "";
  const firstBase = rows?.find(r => r?.is_baseline);
  if (firstBase && Number.isFinite(firstBase.pi)) {
    started_inflation = String(firstBase.pi);
  } else if (Number.isFinite(scenarios?.[0]?.pi)) {
    started_inflation = String(scenarios[0].pi);
  }

  return {
    started_inflation,
    order_vector: Array.isArray(scenarios) ? scenarios.map(s => (s?.id ?? s?.label ?? s?.order ?? "")).join("|") : "",
    pool_group: (cfg?.group ?? cfg?.GROUP ?? cfg?.grp ?? "") || "",
    pool_seed: String(cfg?.poolseed ?? cfg?.seed ?? cfg?.POOL_SEED ?? cfg?.POOL ?? ""),
    ua,
    time_total_ms: rows?.reduce((acc, r) => acc + (Number(r?.ms_spent) || 0), 0) || 0,
    schema_version: "v1",
  };
}

function SurveyInner({
  onExit,
  onFinished,                                  // parent routes to FinalPage.jsx
  storageName = "resp_followups_v1",
  introVariant = "auto",
  requireReasonOnConfirm = false,
  requireReasonForTag = "BASE",
  completionCode = null,                       // optional external code (Prolific)
  acceptAdminCommands = false,                 // /admin should pass true
}) {
  const qs = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const cfg = { ...readUrlConfig(), defaultB: Number(qs.get("defaultB") ?? 50) };
  const externalFinishCode = completionCode || qs.get("prolific_code") || qs.get("code") || null;

  const scenarios = useScenarios(cfg);
  const [rows, setRows] = useLocalRows(`${storageName}_${scenarios.length}`);
  const { idx, setIdx, setFurthestVisited, goNextLinear, maxVisitedIdx } =
    useProgress(scenarios, rows);

  const cur = Number.isFinite(idx) ? (scenarios[idx] || null) : null;
  const curAnswer = cur ? rows.find((r) => r.order === cur.order) : null;
  const isConfirmed = !!curAnswer;
  const isViewingPast = Number.isFinite(idx) ? (idx < maxVisitedIdx) : false;

  const alloc = useAllocation({
    cfg, cur, isConfirmed, isViewingPast, onTouched: () => {},
  });

  /** Persist completion code so FinalPage can read it */
  const finishCodeKey = `${storageName}_${scenarios.length}_finishCode`;
  React.useEffect(() => {
    if (!externalFinishCode) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(finishCodeKey, externalFinishCode);
    }
  }, [externalFinishCode, finishCodeKey]);

  React.useEffect(() => {
    if (externalFinishCode) return;
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(finishCodeKey);
    if (existing) return;
    const gen = makeCompletionCode(rows.length);
    window.localStorage.setItem(finishCodeKey, gen);
  }, [externalFinishCode, finishCodeKey, rows.length]);

  /** Need-reason logic */
  const needReason = React.useMemo(() => {
    if (Number.isFinite(idx) && idx === 15) return false; // skip on Q16
    if (!requireReasonForTag && !requireReasonOnConfirm) return false;
    if (requireReasonOnConfirm) return true;
    const set = new Set(Array.isArray(requireReasonForTag) ? requireReasonForTag : [requireReasonForTag]);
    return !!(cur && set.has(cur.tag));
  }, [cur, idx, requireReasonForTag, requireReasonOnConfirm]);

  // Midpoint rest screen after the 15th follow-up
  const [showMidBreak, setShowMidBreak] = React.useState(false);

  // Final follow-up local state
  const [followChange, setFollowChange] = React.useState("");
  const [followInfl, setFollowInfl] = React.useState("");
  const [followText, setFollowText] = React.useState("");

  const LAST_INDEX = 31;

  const firstBaselineRow = React.useMemo(() => {
    if (!rows || !rows.length) return null;
    const onlyBaselines = rows.filter((r) => r?.is_baseline);
    if (onlyBaselines.length) {
      return onlyBaselines.sort((a,b) => (a.order ?? 1e9) - (b.order ?? 1e9))[0];
    }
    return rows.slice().sort((a,b) => (a.order ?? 1e9) - (b.order ?? 1e9))[0] ?? null;
  }, [rows]);

  const lastScenarioRow = React.useMemo(() => {
    if (!rows || !rows.length) return null;

    // Prefer final mirror (true last)
    const mirrors = rows.filter((r) => r?.is_last && r?.is_mirror);
    if (mirrors.length) return mirrors[mirrors.length - 1];

    const nonMirrorLasts = rows.filter((r) => r?.is_last && !r?.is_mirror);
    if (nonMirrorLasts.length) return nonMirrorLasts[nonMirrorLasts.length - 1];

    const intended = scenarios[LAST_INDEX]?.order;
    if (intended != null) {
      const match = rows.find((r) => r.order === intended);
      if (match) return match;
    }
    return rows[rows.length - 1] ?? null;
  }, [rows, scenarios]);

  const fup = useFollowups({
    cfg, cur, rows, setRows, isConfirmed, needReason, idx,
    firstBaselineRow, lastScenarioRow,
    onAdvance: () => {
      setFurthestVisited((v) => Math.max(v ?? 0, idx + 1));
      goNextLinear();
    },
    onMidBreak: () => setShowMidBreak(true),
  });

  // keep progress updated (locks forward to visited)
  React.useEffect(() => {
    setFurthestVisited((v) => Math.max(v ?? 0, idx));
  }, [idx, setFurthestVisited]);

  /** ======= Admin broadcast (disabled for respondents) ======= */
  const ghostRef = React.useRef(
    typeof window !== "undefined" ? (localStorage.getItem("SURVEY_GHOST_MODE") === "1") : false
  );
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "SURVEY_GHOST_MODE") {
        ghostRef.current = e.newValue === "1";
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  React.useEffect(() => {
    if (!acceptAdminCommands) return;
    if (typeof window === "undefined") return;
    const chan = new BroadcastChannel("survey-admin");
    const onMsg = (e) => {
      const data = e?.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "prev") {
        if (!(fup.showReason || fup.showSanity || fup.showMidSanity || fup.showFinal)) {
          setIdx((i) => Math.max(0, i - 1));
        }
      } else if (data.type === "next") {
        if (!(fup.showReason || fup.showSanity || fup.showMidSanity || fup.showFinal)) {
          setIdx((i) => Math.min(scenarios.length - 1, i + 1));
        }
      } else if (data.type === "jump") {
        const to = Number(data.to);
        if (Number.isFinite(to)) {
          setIdx(Math.max(0, Math.min(scenarios.length - 1, to)));
        }
      } else if (data.type === "finish") {
        if (typeof onFinished === "function") onFinished();
      } else if (data.type === "ghost") {
        ghostRef.current = !!data.value;
        localStorage.setItem("SURVEY_GHOST_MODE", ghostRef.current ? "1" : "0");
      }
    };
    chan.addEventListener("message", onMsg);
    return () => chan.removeEventListener("message", onMsg);
  }, [acceptAdminCommands, fup.showReason, fup.showSanity, fup.showMidSanity, fup.showFinal, setIdx, scenarios.length, onFinished]);

  /** ---------- early load / mid break ---------- */
  if (!scenarios.length) {
    return (
      <main className="container">
        <h1>Investment Decisions</h1>
        <p>Unable to load scenarios. Please check your configuration.</p>
        {typeof onExit === "function" && <button className="startBtn" onClick={onExit}>Back</button>}
      </main>
    );
  }

  if (showMidBreak) {
    const nextPi = Number(scenarios[idx + 1]?.pi);
    const inflText = Number.isFinite(nextPi) ? `${nextPi}%` : "0%";
    const pctDone = Math.round(((idx + 1) / scenarios.length) * 100);
    return (
      <MidBreak
        pct={pctDone}
        inflationText={inflText}
        onContinue={() => {
          setShowMidBreak(false);
          setFurthestVisited((v) => Math.max(v ?? 0, idx + 1));
          goNextLinear(); // proceed to scenario 16 (index 15)
        }}
      />
    );
  }

  /** ---------- metrics ---------- */
  const P = Number.isFinite(Number(cur?.p)) ? Number(cur.p) : 0.5;
  const safeAmount = Math.max(1, Number(cfg.amount) || 0);
  const { upPct, dnPct, upAmt, dnAmt } = calcPortfolioEarnings({
    amount: safeAmount,
    pctB: alloc.value,
    s: Number(cur?.s) || 0,
    u: Number(cur?.u) || 0,
    d: Number(cur?.d) || 0,
  });
  const expectedPct = P * upPct + (1 - P) * dnPct;
  const expectedAmt = P * upAmt + (1 - P) * dnAmt;

  const pct = Number.isFinite(idx) && scenarios.length > 0
    ? Math.round((idx / scenarios.length) * 100)
    : 0;

  /** ---------- nav within visited (respondents can’t skip ahead) ---------- */
  const followupOpen = fup.showReason || fup.showSanity || fup.showMidSanity || fup.showFinal;
  const onBack = () => {
    if (followupOpen) return;
    if (idx > 0) setIdx(idx - 1);
    else if (typeof onExit === "function") onExit();
  };
  const onForwardVisited = () => {
    if (followupOpen) return;
    if (idx < maxVisitedIdx) setIdx(Math.min(maxVisitedIdx, idx + 1));
  };

  /** ---------- save row (ghost-aware) ---------- */
  const persistRow = (row) => {
    const ghost = localStorage.getItem("SURVEY_GHOST_MODE") === "1" || ghostRef.current;
    if (ghost) return; // skip writes
    setRows((xs) => (xs.some((r) => r.order === row.order && r.tag === row.tag) ? xs : [...xs, row]));
  };

  /** ---------- confirm allocation ---------- */
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
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "NA",
    };
    persistRow(row);

    if (needReason) { fup.openReason(); return; }
    if (cur.isSanity) { fup.openSanity(); return; }
    if (idx === 14) { fup.openMidSanity(); return; }
    if (cur.isLast && cur.isMirror) { fup.openFinal(); return; }

    fup.advance();
  };

  /** ---------- final follow-up submit (SERVER APPEND HERE) ---------- */
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

  const q1Complete = (followText ?? "").trim().length >= 5;
  const q2Complete = factors.every((f) => followChange && followChange[f] !== undefined);
  const canSubmitFinal = q1Complete && q2Complete;

  const handleFinalSubmit = async () => {
    // write the final follow-up row locally
    const finalOrder = scenarios[31]?.order ?? (rows[rows.length - 1]?.order ?? "final");
    const payload = {
      order: finalOrder,
      scenario_id: cur?.id ?? "final",
      tag: "FINAL_FOLLOWUP",
      follow_change: followChange,
      follow_infl: followInfl?.trim?.() ?? "",
      follow_text: (followText ?? "").trim(),
      ts: Date.now(),
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "NA",
    };
    const ghost = localStorage.getItem("SURVEY_GHOST_MODE") === "1" || ghostRef.current;
    let rowsAfter = rows;
    if (!ghost) {
      setRows((xs) => [...xs, payload]);
      rowsAfter = [...rows, payload];
    }

    // compose demographics + meta and send to server
    try {
      const demo = getDemoFromStorage();
      const meta = buildMeta({ cfg, scenarios, rows: rowsAfter });
      await sendFinalRow({ rows: rowsAfter, demo, meta });
      if (typeof onFinished === "function") onFinished();
    } catch (e) {
      console.error(e);
      alert("Saving failed. Please check your connection and retry.");
    }
  };

  /**
   * BLUR LOGIC:
   * - When you click "Proceed", controls unlock and button hides.
   * - After confirm on BASELINE (ReasonBox opens), DON’T blur — keep choice visible.
   * - Revisit from later pages => blur (read-only).
   */
  const showProceed = !isConfirmed && !isViewingPast && !alloc.panelUnlocked;
  const showingReason = fup.showReason === true;
  const blurNow = (!fup.showFinal) && (
    (isViewingPast) ||
    (alloc.controlsLocked && !showingReason)
  );

  // refs for follow-ups + scroll center
  const reasonRef = React.useRef(null);
  const sanityRef = React.useRef(null);
  const midRef    = React.useRef(null);
  const finalRef  = React.useRef(null);

  React.useEffect(() => {
    const target =
      (fup.showReason     && reasonRef.current) ||
      (fup.showSanity     && sanityRef.current) ||
      (fup.showMidSanity  && midRef.current)    ||
      (fup.showFinal      && finalRef.current)  ||
      null;
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
    }
  }, [fup.showReason, fup.showSanity, fup.showMidSanity, fup.showFinal]);

  if (!cur) {
    return (
      <main className="container">
        <h1>Investment Scenarios</h1>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Investment Decisions</h1>

      <ProgressBar pct={Math.round((idx / scenarios.length) * 100)} />
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
          variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } }}
        >
          <ScenarioHeader
            cfg={cfg}
            cur={cur}
            idx={idx}
            introVariant={introVariant}
            highlight={alloc.highlight}
          />

          {/* Proceed button */}
          <div className="actions" style={{ marginTop: 6, display: "flex", justifyContent: "right" }}>
            <button
              type="button"
              className="startBtn"
              onClick={!alloc.panelUnlocked && !isConfirmed && !isViewingPast ? alloc.unlock : undefined}
              disabled={alloc.panelUnlocked || isConfirmed || isViewingPast}
              title="Proceed to set your allocation"
              style={{
                opacity: (alloc.panelUnlocked || isConfirmed || isViewingPast) ? 0.5 : 1,
                cursor:  (alloc.panelUnlocked || isConfirmed || isViewingPast) ? "not-allowed" : "pointer",
              }}
            >
              ✓ Proceed to Allocation
            </button>
          </div>

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
            <div ref={reasonRef}>
              <ReasonBox
                value={fup.reasonText}
                setValue={fup.setReasonText}
                onSubmit={fup.submitReason}
                disabled={isViewingPast}
              />
            </div>
          )}

          {fup.showMidSanity && (
            <div ref={midRef}>
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
            </div>
          )}

          {fup.showFinal && cur.isLast && cur.isMirror && (
            <div ref={finalRef}>
              <FinalFollowup
                firstBaselineRow={firstBaselineRow ?? {}}
                lastScenarioRow={lastScenarioRow ?? {}}
                cur={cur}
                followChange={followChange}
                setFollowChange={setFollowChange}
                followInfl={followInfl}
                setFollowInfl={setFollowInfl}
                followText={followText}
                setFollowText={setFollowText}
                onSubmit={handleFinalSubmit}
                submitDisabled={!canSubmitFinal}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

/** deterministic completion code (fallback for local testing) */
function makeCompletionCode(n) {
  const now = new Date();
  const base = `${n}-${now.getFullYear()}-${now.getTime()}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `JMP-${(h >>> 0).toString(36).toUpperCase()}`;
}

// src/components/survey/SurveyShell.jsx
// Renders all cases with animations. Final Review (Q2) is a dedicated page.

import React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

import ProgressBar from "../ui/ProgressBar";
import TopNav from "../ui/TopNav";

import Header from "./Header";
import AllocationPanel from "./AllocationPanel";
import ReasonBox from "./followups/ReasonBox";
import SanityFollowup from "./followups/SanityFollowup";
import FinalFollowupQ1, { FinalFollowupQ2Page } from "./followups/FinalFollowup";
import MidBreak from "./MidBreak";

import useScenarios from "../state/useScenarios";
import useProgress from "../state/useProgress";
import useAllocation from "../state/useAllocation";
import useFollowups from "../state/useFollowups";
import { calcPortfolioEarnings } from "../state/math";

const pageVariants = {
  initial: { opacity: 0, filter: "blur(1px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(1px)" },
};
const pageTransition = { duration: 0.22, ease: "easeOut" };
const sectionTransition = { duration: 0.18, ease: "easeOut" };

const DUMMY_SCENARIO = {
  id: "SCN_DUMMY",
  tag: "BASE",
  block: 1,
  pi: 0,
  s: 2,
  rp: 0,
  sd: 3,
  p: 0.5,
  u: 5,
  d: -1,
  isBaseline: true,
};

const MID_INDEX = 14;
const AMOUNT = 100000;
const LS_BASELINE_KEY = "bp_baseline_risky_share_v1";
const LS_PROGRESS_KEY = "bp_progress_v2";

function computeRunId(list) {
  if (!Array.isArray(list) || !list.length) return "EMPTY";
  return `${list.length}|${list.map((s) => s?.id ?? "?").join(",")}`;
}
function modePi(list, start, end) {
  const freq = new Map();
  for (let i = start; i < end && i < list.length; i++) {
    const v = Number(list[i]?.pi);
    if (!Number.isFinite(v)) continue;
    freq.set(v, (freq.get(v) || 0) + 1);
  }
  let best = 0, bestC = -1;
  for (const [k, c] of freq.entries()) {
    if (c > bestC) { bestC = c; best = k; }
  }
  return Number.isFinite(best) ? best : 0;
}

export default function SurveyShell({ onExit, onFinished }) {
  const { list = [], ready } = useScenarios();

  const {
    idx,
    setIdx,
    maxVisitedIdx,
    goNextLinear,
    setFurthestVisited,
  } = useProgress(list);

  const totalCases = list.length || 30;
  const hasCur = list.length > 0 && idx >= 0 && idx < totalCases;
  const cur = hasCur ? list[idx] : DUMMY_SCENARIO;

  React.useEffect(() => {
    setFurthestVisited((m) => Math.max(m ?? 0, idx));
  }, [idx, setFurthestVisited]);

  React.useEffect(() => {
    if (ready && list.length > 0 && idx >= totalCases) onFinished?.();
  }, [ready, list, idx, totalCases, onFinished]);

  const isViewingPast = hasCur ? idx < maxVisitedIdx : false;
  const alloc = useAllocation({ cfg: { defaultB: 50 }, cur, isViewingPast });

  const [panelOpen, setPanelOpen] = React.useState(false);
  const [forceClosed, setForceClosed] = React.useState(false);
  React.useEffect(() => { setPanelOpen(false); setForceClosed(false); }, [idx]);

  const { upPct, dnPct, upAmt, dnAmt } = calcPortfolioEarnings({
    amount: AMOUNT, pctB: alloc.value, s: cur.s, u: cur.u, d: cur.d,
  });
  const b = Number(alloc.value) / 100;
  const expectedPct = (1 - b) * Number(cur.s) + b * 0.5 * (Number(cur.u) + Number(cur.d));
  const expectedAmt = Math.round((expectedPct / 100) * AMOUNT);

  const fup = useFollowups({
    idx, cur,
    onAdvance: () => {
      setFurthestVisited((m) => Math.max(m ?? 0, idx + 1));
      goNextLinear();
    },
    onFinished,
  });

  const showUI = ready && hasCur;

  const hookUnlocked =
    typeof alloc?.panelUnlocked === "boolean" ? alloc.panelUnlocked : null;
  const baseUnlocked = hookUnlocked !== null ? hookUnlocked : panelOpen;
  const isUnlocked = baseUnlocked && !forceClosed;
  const showAlloc = showUI && isUnlocked && !isViewingPast;

  const showInlineReason = showUI && fup.showReason;
  const showInlineSanity = showUI && fup.showSanity;
  const showInlineFinal  = showUI && fup.showFinal;

  const [midShown, setMidShown] = React.useState(false);
  React.useEffect(() => { if (idx !== MID_INDEX && midShown) setMidShown(false); }, [idx, midShown]);
  const shouldShowMidPage = idx === MID_INDEX && !midShown;

  const pctDone = totalCases > 0 ? Math.round((Math.min(idx, totalCases) / totalCases) * 100) : 0;

  const [readyToProceed, setReadyToProceed] = React.useState(false);
  React.useEffect(() => {
    setReadyToProceed(false);
    const t = setTimeout(() => setReadyToProceed(true), 1500);
    return () => clearTimeout(t);
  }, [idx]);

  // Final follow-up flow state (Q1 -> Q2 page)
  const [finalStep, setFinalStep] = React.useState(null);
  React.useEffect(() => {
    if (fup.showFinal && finalStep == null) setFinalStep("q1");
    if (!fup.showFinal && finalStep != null) setFinalStep(null);
  }, [fup.showFinal, finalStep]);

  const case29 = list[totalCases - 2] || null;
  const case30 = list[totalCases - 1] || null;

  const rows = Array.isArray(alloc?.rows) ? alloc.rows : [];
  const baselineRef = React.useRef(null);
  React.useEffect(() => {
    if (baselineRef.current) return;
    try {
      const v = localStorage.getItem(LS_BASELINE_KEY);
      if (v != null) {
        const risky = Number(v);
        if (Number.isFinite(risky)) baselineRef.current = { risky_share: risky };
      }
    } catch {}
  }, []);
  const firstBaselineRow =
    fup.firstBaselineRow
    ?? rows.find(r => r?.isBaseline)
    ?? rows[0]
    ?? baselineRef.current
    ?? null;
  const histLast = rows.length ? rows[rows.length - 1] : null;
  const lastScenarioRow =
    fup.lastScenarioRow
    ?? (Number.isFinite(Number(histLast?.risky_share))
        ? histLast
        : { ...(histLast || {}), risky_share: Number(alloc?.value) });

  const onConfirm = () => {
    if (!showUI) return;
    const currentRisky = Number(alloc?.value);
    const rowPayload = {
      cur,
      risky_share: Number.isFinite(currentRisky) ? currentRisky : 0,
    };
    alloc.persist?.(rowPayload);
    if (idx === 0) {
      if (typeof fup.setFirstBaselineRow === "function") fup.setFirstBaselineRow(rowPayload);
      baselineRef.current = rowPayload;
      try { localStorage.setItem(LS_BASELINE_KEY, String(rowPayload.risky_share)); } catch {}
    }
    if (fup.needReason && idx !== MID_INDEX) { fup.openReason(); return; }
    if (idx === 13 && !fup.showSanity) { fup.openSanity(); return; }
    if (idx === totalCases - 1) {
      if (typeof fup.setLastScenarioRow === "function") fup.setLastScenarioRow(rowPayload);
      try { localStorage.setItem("bp_last_risky_share_v1", String(rowPayload.risky_share)); } catch {}
      fup.openFinal();
      return;
    }
    if (cur.isSanity) { fup.openSanity(); return; }
    fup.advance();
  };

  const firstBlockPi  = modePi(list, 0, MID_INDEX);
  const secondBlockPi = modePi(list, MID_INDEX, totalCases);
  const isMirror29 = idx === totalCases - 2;
  const isMirror30 = idx === totalCases - 1;
  const displayedPi =
    isMirror29 ? secondBlockPi :
    isMirror30 ? 6 :
    Number(cur?.pi) || 0;
  const headerCur = { ...cur, pi: displayedPi };

  const restoreTriedRef = React.useRef(false);
  React.useEffect(() => {
    if (!ready || !list.length || restoreTriedRef.current) return;
    restoreTriedRef.current = true;

    const runId = computeRunId(list);
    try {
      const raw = localStorage.getItem(LS_PROGRESS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || saved.runId !== runId) return;

      if (Number.isFinite(saved.idx)) {
        const safeIdx = Math.max(0, Math.min(totalCases - 1, Number(saved.idx)));
        setIdx(safeIdx);
      }
      if (Number.isFinite(saved.furthest)) {
        setFurthestVisited((m) => Math.max(m ?? 0, Number(saved.furthest)));
      }
      if (saved.rows && Array.isArray(saved.rows) && saved.rows.length) {
        if (typeof alloc?.hydrate === "function") {
          try { alloc.hydrate(saved.rows); } catch {}
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, list.length]);

  const runId = computeRunId(list);
  React.useEffect(() => {
    if (!ready || !list.length) return;
    try {
      const payload = {
        runId,
        idx,
        furthest: maxVisitedIdx,
        rows: rows.map((r) => ({
          risky_share: Number(r?.risky_share),
          isBaseline: !!r?.isBaseline,
          id: r?.cur?.id ?? r?.id ?? null,
          tag: r?.cur?.tag ?? r?.tag ?? null,
          idx: Number.isFinite(r?.idx) ? r.idx : undefined,
        })),
        ts: Date.now(),
      };
      localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(payload));
    } catch {}
  }, [ready, list.length, runId, idx, maxVisitedIdx, rows]);

  // === Standalone "Final Review" PAGE (Q2) ===
  if (showUI && showInlineFinal && finalStep === "q2") {
    return (
      <main className="container" style={{ overflowAnchor: "none" }}>
        <ProgressBar pct={pctDone} />
        <div className="progressText" style={{ marginTop: 6 }}>
          You’ve completed {pctDone}% of the survey
        </div>

        <TopNav
          idx={idx}
          total={totalCases}
          maxVisitedIdx={maxVisitedIdx}
          onBack={() => setFinalStep("q1")} // back to Q1 page
          onForward={() => {}}             // disabled on Final Review
        />

        <AnimatePresence mode="wait">
          <motion.div
            key="final-q2-page"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <div className="caseTitle">
              <span className="caseNum">Final Review</span>
            </div>

            <FinalFollowupQ2Page
              case29={list[totalCases - 2] || null}
              case30={list[totalCases - 1] || null}
              followChange={fup.followChange}
              setFollowChange={fup.setFollowChange}
              followInfl={fup.followInfl}
              setFollowInfl={fup.setFollowInfl}
              onSubmit={() => {
                if (typeof fup.submitFinal === "function") fup.submitFinal();
                else if (typeof onFinished === "function") onFinished();
              }}
              // submitDisabled omitted so page can enforce "answer all" itself
            />
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  // === Normal flow page (Header/Allocation + inline followups, including Q1) ===
  return (
    <main className="container" style={{ overflowAnchor: "none" }}>
      <ProgressBar pct={pctDone} />
      <div className="progressText" style={{ marginTop: 6 }}>
        You’ve completed {pctDone}% of the survey
      </div>

      <TopNav
        idx={idx}
        total={totalCases}
        maxVisitedIdx={maxVisitedIdx}
        onBack={() => (idx ? setIdx(idx - 1) : onExit?.())}
        onForward={() => setIdx(Math.min(maxVisitedIdx, idx + 1))}
      />

      {(() => {
        if (idx === MID_INDEX && !midShown) {
          return (
            <MidBreak
              pct={pctDone}
              inflationText={`${headerCur.pi}%`}
              onContinue={() => {
                setMidShown(true);
                try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
              }}
            />
          );
        }

        return (
          <>
            <div className="caseTitle">
              {idx === totalCases - 1 ? (
                <span className="caseNum">Final Case</span>
              ) : (
                <>
                  <span className="caseNum">Case {idx + 1}</span>
                  <span className="caseTotal"> / {totalCases}</span>
                </>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={cur.id ?? idx}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <LayoutGroup>
                  <Header
                    cfg={{ amount: AMOUNT, currency: "USD" }}
                    cur={headerCur}
                    idx={idx}
                    collapsed={!!showAlloc}
                    isFinalCase={idx === totalCases - 1}
                    footer={
                      showUI && !showAlloc && (
                        <>
                          {!readyToProceed ? (
                            <button
                              className="startBtn"
                              disabled
                              style={{
                                background: "#d1d5db",
                                color: "#6b7280",
                                cursor: "not-allowed",
                                borderColor: "#d1d5db",
                              }}
                            >
                              Please read the given information…
                            </button>
                          ) : (
                            <button
                              className="startBtn"
                              disabled={isViewingPast}
                              aria-disabled={isViewingPast}
                              onClick={() => {
                                if (isViewingPast) return;
                                setForceClosed(false);
                                if (alloc?.unlock) alloc.unlock();
                                else setPanelOpen(true);
                              }}
                            >
                              Proceed to Allocation
                            </button>
                          )}
                        </>
                      )
                    }
                  />

                  <AnimatePresence>
                    {showAlloc && (
                      <motion.div key="alloc" layout transition={sectionTransition}>
                        <AllocationPanel
                          cfg={{ amount: AMOUNT, currency: "USD" }}
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
                          onBack={() => {
                            if (alloc?.lock) alloc.lock();
                            else if (typeof alloc?.setPanelUnlocked === "function") alloc.setPanelUnlocked(false);
                            setForceClosed(true);
                            setPanelOpen(false);
                            try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
                          }}
                        />

                        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
                          {showInlineReason && (
                            <ReasonBox
                              value={fup.reasonText}
                              setValue={fup.setReasonText}
                              onSubmit={fup.submitReason}
                              disabled={isViewingPast}
                            />
                          )}

                          {showInlineSanity && (
                            <SanityFollowup
                              title="A quick follow-up"
                              options={fup.options}
                              primary={fup.primary}
                              setPrimary={fup.setPrimary}
                              secondary={fup.secondary}
                              setSecondary={fup.setSecondary}
                              otherText={fup.otherText}
                              setOtherText={fup.setOtherText}
                              onSubmit={() => fup.submitSanity()}
                              submitDisabled={!fup.primary}
                            />
                          )}

                          {/* Final follow-up Q1 stays inline under allocation */}
                          {showInlineFinal && finalStep === "q1" && (
                            <FinalFollowupQ1
                              firstBaselineRow={firstBaselineRow ?? {}}
                              lastScenarioRow={lastScenarioRow ?? {}}
                              cur={cur}
                              followText={fup.followText}
                              setFollowText={fup.setFollowText}
                              onSubmitQ1={() => {
                                setFinalStep("q2"); // switches to standalone Final Review page
                                try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
                              }}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </LayoutGroup>
              </motion.div>
            </AnimatePresence>
          </>
        );
      })()}
    </main>
  );
}

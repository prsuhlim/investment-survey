// src/components/survey/hooks/useFollowups.js
import React from "react";
import { mulberry32, shuffleInPlace } from "../utils/rng";

/**
 * Centralizes which follow-up to open, field states, and submit/advance
 */
export default function useFollowups({
  cfg,
  cur,
  rows,
  setRows,
  isConfirmed,
  needReason,
  idx,
  firstBaselineRow,
  lastScenarioRow,
  onAdvance,
  onMidBreak,            // 👈 NEW: notify shell to show the rest page
}) {
  // --- Reason (baseline) ---
  const [showReason, setShowReason] = React.useState(false);
  const [reasonText, setReasonText] = React.useState("");

  // --- Sanity (dominance) ---
  const [showSanity, setShowSanity] = React.useState(false);
  const [primaryReason, setPrimaryReason] = React.useState("");
  const [secondaryReasons, setSecondaryReasons] = React.useState([]);
  const [sanityOtherText, setSanityOtherText] = React.useState("");

  // --- Final follow-up (mirror last) ---
  const [showFinal, setShowFinal] = React.useState(false);
  const [followFactors, setFollowFactors] = React.useState([]);
  const [followChange, setFollowChange] = React.useState("");
  const [followInfl, setFollowInfl] = React.useState("");
  const [followText, setFollowText] = React.useState("");

  // --- Midpoint sanity (same UI/logic; separate fields) ---
  const [showMidSanity, setShowMidSanity] = React.useState(false);
  const [midPrimary, setMidPrimary] = React.useState("");
  const [midSecondary, setMidSecondary] = React.useState([]);
  const [midOtherText, setMidOtherText] = React.useState("");

  // Options
  const baseOptions = React.useRef([
    { key: "balance",       label: "I wanted to diversify (strike a balance between the two options)." },
    { key: "dominance",     label: "I saw that one option was better in every possible outcome." },
    { key: "risk_dislike",  label: "I wanted to avoid losses or low returns." },
    { key: "higher_return", label: "I aimed for a higher potential return." },
    { key: "consistency",   label: "I tried to stay consistent with my earlier answers." },
    { key: "intuitive",     label: "I relied on intuition or instinct." },
    { key: "other",         label: "Other (please specify)." },
  ]).current;

  // Shuffle only on true sanity items (keeps order stable elsewhere)
  const shuffledReasonOptions = React.useMemo(() => {
    if (!cur?.isSanity) return baseOptions;
    const base = baseOptions.filter((o) => o.key !== "other");
    const seed = ((cfg.poolseed >>> 0) ^ (cur.order >>> 0) ^ 0x9e3779b9) >>> 0;
    const rng  = mulberry32(seed);
    shuffleInPlace(base, rng);
    base.push(baseOptions.find((o) => o.key === "other"));
    return base;
  }, [cur?.isSanity, cur?.order, cfg.poolseed, baseOptions]);

  React.useEffect(() => {
    // reset on scenario change
    setShowReason(false); setReasonText("");
    setShowSanity(false); setPrimaryReason(""); setSecondaryReasons([]); setSanityOtherText("");
    setShowFinal(false);  setFollowFactors([]); setFollowChange(""); setFollowInfl(""); setFollowText("");

    setShowMidSanity(false); setMidPrimary(""); setMidSecondary([]); setMidOtherText("");

    if (isConfirmed) {
      const saved = rows.find(r => r.order === cur?.order);
      if (!saved) return;

      if (needReason && !saved.reason_text) setShowReason(true);
      if (cur?.isSanity && !saved.sanity_primary) setShowSanity(true);
      if (cur?.isLast && cur?.isMirror && (!saved.follow_change || !saved.follow_inflation_effect)) {
        setShowFinal(true);
      }

      // midpoint sanity exactly once at index 14 (15th scenario)
      if (idx === 14 && !saved.mid_sanity_primary) {
        setShowMidSanity(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id, cur?.pi, idx]);

  const writeBack = (patch) => {
    setRows(xs => {
      const copy = xs.slice();
      const i = copy.findIndex(r => r.order === cur.order);
      if (i !== -1) copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  const openReason = () => setShowReason(true);
  const openSanity = () => setShowSanity(true);
  const openFinal  = () => setShowFinal(true);
  const openMidSanity = () => setShowMidSanity(true);
  const advance    = () => onAdvance?.();

  const submitReason = () => {
    if (!reasonText.trim()) return;
    writeBack({ reason_text: reasonText.trim() });
    setShowReason(false);
    if (cur?.isLast && cur?.isMirror) { setShowFinal(true); return; }
    advance();
  };

  const submitSanity = () => {
    if (!primaryReason) return;
    writeBack({
      sanity_primary: primaryReason || null,
      sanity_secondary: secondaryReasons.slice(),
      sanity_other_text: sanityOtherText?.trim() || null,
      sanity_opts_order: shuffledReasonOptions.map(o => o.key),
    });
    setShowSanity(false);
    advance();
  };

  const submitFinal = () => {
    writeBack({
      follow_factors: followFactors.slice(),
      follow_change: followChange || null,
      follow_inflation_effect: followInfl || null,
      follow_text: followText.trim() || null,
      baseline_pctB: firstBaselineRow ? firstBaselineRow.risky_share : null,
      last_pctB:      lastScenarioRow ? lastScenarioRow.risky_share  : null,
    });
    setShowFinal(false);
    advance();
  };

  const submitMidSanity = () => {
    if (!midPrimary) return;
    writeBack({
      mid_sanity_primary: midPrimary || null,
      mid_sanity_secondary: midSecondary.slice(),
      mid_sanity_other_text: midOtherText?.trim() || null,
      mid_sanity_opts_order: baseOptions.map(o => o.key),
    });
    setShowMidSanity(false);
    // 👉 trigger break screen instead of immediate advance
    if (typeof onMidBreak === "function") onMidBreak();
    else advance();
  };

  return {
    // which UI to show
    showReason, showSanity, showFinal, showMidSanity,

    // baseline reason
    reasonText, setReasonText, openReason, submitReason,

    // sanity
    shuffledReasonOptions,
    primaryReason, setPrimaryReason,
    secondaryReasons, setSecondaryReasons,
    sanityOtherText, setSanityOtherText,
    openSanity, submitSanity,

    // midpoint sanity
    midPrimary, setMidPrimary,
    midSecondary, setMidSecondary,
    midOtherText, setMidOtherText,
    openMidSanity, submitMidSanity,

    // final
    firstBaselineRow, lastScenarioRow,
    followFactors, setFollowFactors,
    followChange, setFollowChange,
    followInfl, setFollowInfl,
    followText, setFollowText,
    openFinal, submitFinal,

    // general
    advance,
  };
}

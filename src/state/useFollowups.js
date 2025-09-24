// src/state/useFollowups.js
import React from "react";
import { mulberry32, shuffleInPlace } from "./rng";

/**
 * Centralizes follow-up modals (baseline reason, dominance sanity, final),
 * including field state and deterministic option shuffles.
 * Robust: works with either cfg.poolseed or meta.poolseed/meta.seed.
 */
export default function useFollowups({
  // compatibility: provide either cfg.poolseed or meta.poolseed/meta.seed
  cfg,
  meta,

  // scenario + index
  cur,
  idx = 0,

  // optional persistence (safe to omit in dev)
  rows,
  setRows,

  // gating (optional)
  isConfirmed = false,
  needReason: needReasonIn,

  // optional context for final page
  firstBaselineRow,
  lastScenarioRow,

  // navigation
  onAdvance,
  onMidBreak, // optional: called after midpoint sanity submit
}) {
  // ---- modal flags ----
  const [showReason, setShowReason] = React.useState(false);
  const [showSanity, setShowSanity] = React.useState(false);
  const [showFinal,  setShowFinal]  = React.useState(false);
  const [showMid,    setShowMid]    = React.useState(false); // midpoint sanity

  // ---- baseline reason ----
  const [reasonText, setReasonText] = React.useState("");

  // ---- sanity (dominance) ----
  const [primary,   setPrimary]   = React.useState("");
  const [secondary, setSecondary] = React.useState([]);
  const [otherText, setOtherText] = React.useState("");

  // ---- final follow-ups ----
  const [followFactors, setFollowFactors] = React.useState([]);  // keep for compat
  const [followChange,  setFollowChange]  = React.useState(null);
  const [followInfl,    setFollowInfl]    = React.useState("");
  const [followText,    setFollowText]    = React.useState("");

  // ---- fixed option set for sanity prompts ----
  const baseOptions = React.useRef([
    { key: "balance",       label: "I wanted to diversify (strike a balance between the two options)." },
    { key: "dominance",     label: "I saw that one option was better in every possible outcome." },
    { key: "guaranteed",    label: "I focused on securing a guaranteed amount before taking risk." },
    { key: "risk_dislike",  label: "I wanted to avoid losses or low returns." },
    { key: "higher_return", label: "I aimed for a higher potential return." },
    { key: "consistency",   label: "I tried to stay consistent with my earlier answers." },
    { key: "intuitive",     label: "I relied on intuition or instinct." },
    { key: "other",         label: "Other (please specify)." },
  ]).current;

  // seed used to shuffle options on sanity screens only
  const poolseedUInt =
    ((cfg?.poolseed ?? meta?.poolseed ?? meta?.seed ?? 0) >>> 0);
  const ordUInt = ((cur?.ord ?? cur?.order ?? 0) >>> 0);

  const options = React.useMemo(() => {
    if (!cur?.isSanity) return baseOptions;
    const arr = baseOptions.filter(o => o.key !== "other");
    const rng = mulberry32((poolseedUInt ^ ordUInt ^ 0x9e3779b9) >>> 0);
    shuffleInPlace(arr, rng);
    arr.push(baseOptions.find(o => o.key === "other"));
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.isSanity, poolseedUInt, ordUInt]);

  // reset state on scenario change; optionally auto-open needed follow-ups
  React.useEffect(() => {
    setShowReason(false); setReasonText("");
    setShowSanity(false); setPrimary(""); setSecondary([]); setOtherText("");
    setShowFinal(false);  setFollowFactors([]); setFollowChange(null); setFollowInfl(""); setFollowText("");
    setShowMid(false);

    if (!isConfirmed) return;

    const saved = Array.isArray(rows)
      ? rows.find(r => (r.order ?? r.ord) === (cur?.order ?? cur?.ord))
      : null;

    const needReason = needReasonIn ?? (cur?.tag === "BASE");
    if (needReason && (!saved || !saved.reason_text)) setShowReason(true);

    if (cur?.isSanity && (!saved || !saved.sanity_primary)) setShowSanity(true);

    if (idx === 14 && (!saved || !saved.mid_sanity_primary)) setShowMid(true);

    if (cur?.isFinal && (!saved || !saved.follow_change || !saved.follow_inflation_effect)) {
      setShowFinal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id, cur?.pi, idx, isConfirmed, needReasonIn]);

  const writeBack = (patch) => {
    if (typeof setRows !== "function" || !Array.isArray(rows)) return; // no-op if unmanaged
    setRows(xs => {
      const copy = xs.slice();
      const key  = (cur?.order ?? cur?.ord);
      const i    = copy.findIndex(r => (r.order ?? r.ord) === key);
      if (i !== -1) copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  // actions
  const advance     = () => onAdvance?.();
  const openReason  = () => setShowReason(true);
  const openSanity  = () => setShowSanity(true);
  const openFinal   = () => setShowFinal(true);
  const openMid     = () => setShowMid(true);
  const close       = () => { setShowReason(false); setShowSanity(false); setShowFinal(false); setShowMid(false); };

  const submitReason = () => {
    const txt = (reasonText ?? "").trim();
    if (!txt) return;
    writeBack({ reason_text: txt });
    setShowReason(false);
    if (cur?.isFinal) { setShowFinal(true); return; }
    advance();
  };

  const submitSanity = () => {
    if (!primary) return;
    writeBack({
      sanity_primary: primary || null,
      sanity_secondary: secondary.slice(),
      sanity_other_text: (otherText ?? "").trim() || null,
      sanity_opts_order: options.map(o => o.key),
    });
    setShowSanity(false);
    advance();
  };

  const submitMid = () => {
    if (!primary) return;
    writeBack({
      mid_sanity_primary: primary || null,
      mid_sanity_secondary: secondary.slice(),
      mid_sanity_other_text: (otherText ?? "").trim() || null,
      mid_sanity_opts_order: options.map(o => o.key),
    });
    setShowMid(false);
    if (typeof onMidBreak === "function") onMidBreak();
    else advance();
  };

  const submitFinal = () => {
    writeBack({
      follow_factors: followFactors.slice(),
      follow_change: followChange || null,
      follow_inflation_effect: followInfl || null,
      follow_text: (followText ?? "").trim() || null,
      baseline_pctB: firstBaselineRow ? firstBaselineRow.risky_share : null,
      last_pctB:      lastScenarioRow ? lastScenarioRow.risky_share  : null,
    });
    setShowFinal(false);
    advance();
  };

  const canSubmitFinal = (followText ?? "").trim().length >= 5;

  return {
    // visibility
    showReason, showSanity, showFinal, showMid,
    close,

    // baseline reason
    reasonText, setReasonText, openReason, submitReason,

    // sanity fields (with names SurveyShell uses)
    options,
    primary, setPrimary,
    secondary, setSecondary,
    otherText, setOtherText,
    openSanity, submitSanity,

    // midpoint sanity
    openMid, submitMid,

    // final follow-ups
    followFactors, setFollowFactors,
    followChange, setFollowChange,
    followInfl, setFollowInfl,
    followText, setFollowText,
    openFinal, submitFinal,
    canSubmitFinal,

    // general
    advance,
    needReason: needReasonIn ?? (cur?.tag === "BASE"),
  };
}

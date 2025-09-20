// src/components/survey/utils/flattenRow.js
import { ALLOC_COLUMNS, TIME_COLUMNS, ALL_SCENARIO_SLUGS, LABEL_TO_SLUG } from "./schema";

// Choose the demographic fields you collect
export const DEMO_COLUMNS = [
  "resp_id",
  "age",
  "gender",
  "education",
  "country",
  // ... add whatever you collect
];

export const META_COLUMNS = [
  "started_inflation",   // 0 or 6 (first block)
  "order_vector",        // comma-separated labels shown order
  "pool_group",          // A/B/C
  "pool_seed",           // numeric
  "ua",                  // user agent
  "time_total_ms",
];

const FOLLOWUP_SLOTS = 5; // how many follow-up sets you expect max
// For each slot we store what scenario triggered it + the answers
export const FOLLOWUP_COLUMNS = Array.from({ length: FOLLOWUP_SLOTS }, (_, k) => ([
  `fup${k+1}__for_slug`,
  `fup${k+1}__reason_text`,
  `fup${k+1}__changed_choice`, // e.g., Yes/No or your coding
  `fup${k+1}__infl_choice`     // e.g., "0%", "6%", etc., if applicable
])).flat();

export const CSV_HEADERS = [
  ...DEMO_COLUMNS,
  ...META_COLUMNS,
  ...ALLOC_COLUMNS,
  ...TIME_COLUMNS,
  ...FOLLOWUP_COLUMNS,
];

const emptyWideRow = () => Object.fromEntries(CSV_HEADERS.map(h => [h, ""]));

/**
 * rows: the array you already build during the survey (allocations, followups, final, etc.)
 * demo: { resp_id, age, gender, ... }
 * meta: { started_inflation, order_vector (array of labels), group, seed, ua }
 */
export function buildWideRow({ rows, demo, meta }) {
  const out = emptyWideRow();

  // 1) demographics
  for (const k of DEMO_COLUMNS) if (demo?.[k] !== undefined) out[k] = demo[k];

  // 2) metadata
  out.started_inflation = String(meta?.started_inflation ?? "");
  out.order_vector      = Array.isArray(meta?.order_vector) ? meta.order_vector.join("|") : "";
  out.pool_group        = meta?.pool_group ?? "";
  out.pool_seed         = String(meta?.pool_seed ?? "");
  out.ua                = meta?.ua ?? "";

  // 3) allocations + time
  // Assume allocation rows look like:
  // { tag: "ALLOC", scenario_label: "P_01", allocB: 0.75, ms_spent: 12345, ts: ... }
  let totalMs = 0;

  rows?.forEach(r => {
    if (r?.tag === "ALLOC" && r?.scenario_label) {
      const slug = LABEL_TO_SLUG[r.scenario_label];
      if (!slug) return; // unknown scenario label -> ignore or log error
      const allocKey = `allocB__${slug}`;
      const timeKey  = `ms__${slug}`;
      out[allocKey]  = (typeof r.allocB === "number") ? r.allocB : "";
      if (typeof r.ms_spent === "number") {
        out[timeKey] = r.ms_spent;
        totalMs += r.ms_spent;
      }
    }
  });

  out.time_total_ms = totalMs;

  // 4) follow-ups
  // Examples of rows you may already save:
  // { tag: "FOLLOWUP_REASON", for_label: "BASE_0INF", reason_text: "..." }
  // { tag: "FOLLOWUP_CHANGE",  for_label: "P_12", changed_choice: "Yes" }
  // { tag: "FOLLOWUP_INFL",    for_label: "P_12", infl_choice: "6%" }
  //
  // Or you already aggregate them into a unified object per follow-up. If not,
  // we collect them by for_label and stitch fields together:

  const byFollowFor = new Map();
  rows?.forEach(r => {
    if (r?.tag?.startsWith?.("FOLLOWUP")) {
      const key = r.for_label;
      if (!key) return;
      const prev = byFollowFor.get(key) || {};
      if (r.tag === "FOLLOWUP_REASON") prev.reason_text = r.reason_text ?? prev.reason_text;
      if (r.tag === "FOLLOWUP_CHANGE") prev.changed_choice = r.changed_choice ?? prev.changed_choice;
      if (r.tag === "FOLLOWUP_INFL")   prev.infl_choice    = r.infl_choice ?? prev.infl_choice;
      byFollowFor.set(key, prev);
    }
    if (r?.tag === "FINAL_FOLLOWUP") {
      // Optionally treat final as another slot with a synthetic label:
      const key = r.for_label ?? "FINAL";
      const prev = byFollowFor.get(key) || {};
      prev.reason_text   = r.follow_text   ?? prev.reason_text;
      prev.changed_choice= r.follow_change ?? prev.changed_choice;
      prev.infl_choice   = r.follow_infl   ?? prev.infl_choice;
      byFollowFor.set(key, prev);
    }
  });

  // Write up to FOLLOWUP_SLOTS into fixed columns
  const keys = Array.from(byFollowFor.keys());
  for (let i = 0; i < Math.min(FOLLOWUP_SLOTS, keys.length); i++) {
    const forLabel = keys[i];
    const slug = LABEL_TO_SLUG[forLabel] || forLabel; // FINAL may not map
    const data = byFollowFor.get(forLabel) || {};
    out[`fup${i+1}__for_slug`]     = slug;
    out[`fup${i+1}__reason_text`]  = data.reason_text ?? "";
    out[`fup${i+1}__changed_choice`] = data.changed_choice ?? "";
    out[`fup${i+1}__infl_choice`]  = data.infl_choice ?? "";
  }

  return out;
}

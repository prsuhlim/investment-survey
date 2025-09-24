// src/state/pool.js
// Builds the 30-screen survey flow with deterministic randomness.
// Flow per respondent:
//   Block 1 (π1): BASE → 6 core → SANITY → 6 core  = 14
//   Block 2 (π2): BASE → 6 core → SANITY → 6 core  = 14
//   Finals: group-fixed final shown once under π1 and once under π2 = 2
// Same 12 core items repeat across blocks with independent order. Deterministic via seed.

import { makeRng, mulberry32, shuffleInPlace } from "./rng";

// ---------- Grid (39 cores = 45 minus baseline and FOSD) ----------
const SAFE_SET = [-4, -2, 0, 2, 4];
const RP_SET = [0, 2, 4];
const SD_SET = [3, 5, 7];

const BASELINE = { s: 2, rp: 0, sd: 3, p: 0.5 };

function core39() {
  const out = [];
  for (const s of SAFE_SET) {
    for (const rp of RP_SET) {
      for (const sd of SD_SET) {
        const isBaseline = s === 2 && rp === 0 && sd === 3;
        const isFOSD = rp === 4 && sd === 3; // reserved for sanities
        if (isBaseline || isFOSD) continue;
        const mean = s + rp;
        out.push({ s, rp, sd, p: 0.5, u: mean + sd, d: mean - sd });
      }
    }
  }
  // 5*3*3 - 1 - 5 = 39
  return out;
}

// ---------- Deterministic A/B/C groups (exactly 13 each) ----------
const MASTER_SEED_FOR_GROUPS = 20240901;
let CACHED_GROUPS = null;

export function getFixedGroups() {
  if (CACHED_GROUPS) return CACHED_GROUPS;

  // single global shuffle for all 39, then 13/13/13 split
  const all = core39();
  const rng = mulberry32(MASTER_SEED_FOR_GROUPS); // rand() in [0,1)
  shuffleInPlace(all, rng);

  const A = all.slice(0, 13).map((c) => ({ ...c }));
  const B = all.slice(13, 26).map((c) => ({ ...c }));
  const C = all.slice(26, 39).map((c) => ({ ...c }));

  CACHED_GROUPS = { A, B, C };
  return CACHED_GROUPS;
}

// ---------- Finals (one-aspect different from baseline) ----------
const FINAL_BY_GROUP = {
  A: { s: 4, rp: 0, sd: 3, p: 0.5 }, // safe ↑
  B: { s: 2, rp: 0, sd: 7, p: 0.5 }, // vol ↑
  C: { s: 2, rp: 2, sd: 3, p: 0.5 }, // premium ↑
};

// ---------- Fixed sanity pairs by group (FOSD: rp=4, sd=3) ----------
const SANITY_BY_GROUP = {
  A: [
    { s: 2, rp: 4, sd: 3, p: 0.5 },
    { s: -4, rp: 4, sd: 3, p: 0.5 },
  ],
  B: [
    { s: -2, rp: 4, sd: 3, p: 0.5 },
    { s: 4, rp: 4, sd: 3, p: 0.5 },
  ],
  C: [
    { s: 0, rp: 4, sd: 3, p: 0.5 },
    { s: -4, rp: 4, sd: 3, p: 0.5 }, // swap to 4 if you prefer avoiding repeat of −4 across groups
  ],
};

// ---------- Helpers ----------
function mkScenario(base, { pi, tag, block, flags = {} }, id) {
  const { s, rp, sd, p = 0.5 } = base;
  const mean = s + rp;
  return {
    id,
    ord: -1,
    tag, // "BASE" | "POOL" | "SANITY" | "FINAL"
    block, // 1 | 2
    pi, // 0 | 6
    s, rp, sd, p,
    u: mean + sd,
    d: mean - sd,
    isBaseline: !!flags.isBaseline,
    isSanity: !!flags.isSanity,
    isFinal: !!flags.isFinal,
  };
}

function pickTwelve(group13, rng) {
  const shuffled = rng.shuffle(group13);
  return [shuffled.slice(0, 12), shuffled[12]];
}

function splitSixSix(twelveOrdered) {
  return [twelveOrdered.slice(0, 6), twelveOrdered.slice(6, 12)];
}

// ---------- Public builder ----------
/**
 * buildSurveyFlow
 * Generates the 30-screen survey sequence.
 * @param {string|number} seed – respondent seed
 * @param {{groupKey?: "A"|"B"|"C", blockOrder?: [0|6,0|6]}} opts
 * @returns {{meta: object, list: Array}}
 */
export function buildSurveyFlow(seed, opts = {}) {
  const rng = makeRng(seed ?? "default-seed");
  const groups = getFixedGroups();

  // Group selection (optional override)
  const groupKey = opts.groupKey || rng.pickOne(["A", "B", "C"]);
  const core13 = (groups[groupKey] || []).map((g) => ({ ...g, p: 0.5 }));
  if (core13.length !== 13) throw new Error(`Group ${groupKey} must have 13 items`);

  // Inflation order (optional override)
  const [pi1, pi2] =
    Array.isArray(opts.blockOrder) && opts.blockOrder.length === 2
      ? opts.blockOrder
      : rng.pickOne([[0, 6], [6, 0]]);

  // Select 12-of-13 and create independent orders for each block
  const [twelve /* heldOut */] = pickTwelve(core13, rng.derive("cores"));
  const b1Order = rng.derive("B1.order").shuffle(twelve);
  const b2Order = rng.derive("B2.order").shuffle(twelve);
  const [b1Six, b1Six2] = splitSixSix(b1Order);
  const [b2Six, b2Six2] = splitSixSix(b2Order);

  // Sanity pair, with per-respondent flip of which goes to which block
  const pair = SANITY_BY_GROUP[groupKey];
  const flip = rng.derive("san.flip").pickOne([false, true]);
  const sanB1 = flip ? pair[1] : pair[0];
  const sanB2 = flip ? pair[0] : pair[1];

  // ID generator
  const nextId = (() => {
    let k = 1;
    return () => `SCN_${String(k++).padStart(3, "0")}`;
  })();

  // Compose block 1
  const block1 = [];
  block1.push(
    mkScenario(
      BASELINE,
      { pi: pi1, tag: "BASE", block: 1, flags: { isBaseline: true } },
      nextId()
    )
  );
  b1Six.forEach((c) =>
    block1.push(mkScenario(c, { pi: pi1, tag: "POOL", block: 1 }, nextId()))
  );
  block1.push(
    mkScenario(
      sanB1,
      { pi: pi1, tag: "SANITY", block: 1, flags: { isSanity: true } },
      nextId()
    )
  );
  b1Six2.forEach((c) =>
    block1.push(mkScenario(c, { pi: pi1, tag: "POOL", block: 1 }, nextId()))
  );

  // Compose block 2
  const block2 = [];
  block2.push(
    mkScenario(
      BASELINE,
      { pi: pi2, tag: "BASE", block: 2, flags: { isBaseline: true } },
      nextId()
    )
  );
  b2Six.forEach((c) =>
    block2.push(mkScenario(c, { pi: pi2, tag: "POOL", block: 2 }, nextId()))
  );
  block2.push(
    mkScenario(
      sanB2,
      { pi: pi2, tag: "SANITY", block: 2, flags: { isSanity: true } },
      nextId()
    )
  );
  b2Six2.forEach((c) =>
    block2.push(mkScenario(c, { pi: pi2, tag: "POOL", block: 2 }, nextId()))
  );

  // Finals (one under each inflation)
  const final = FINAL_BY_GROUP[groupKey];
  const final1 = mkScenario(
    final,
    { pi: pi1, tag: "FINAL", block: 2, flags: { isFinal: true } },
    nextId()
  );
  const final2 = mkScenario(
    final,
    { pi: pi2, tag: "FINAL", block: 2, flags: { isFinal: true } },
    nextId()
  );

  const all = [...block1, ...block2, final1, final2].map((x, i) => ({
    ...x,
    ord: i,
  }));

  // Integrity (dev)
  if (block1.length !== 14 || block2.length !== 14 || all.length !== 30) {
    // eslint-disable-next-line no-console
    console.warn("Unexpected counts", {
      b1: block1.length,
      b2: block2.length,
      total: all.length,
    });
  }

  return {
    meta: {
      seed: String(seed ?? "default-seed"),
      groupKey,
      inflationOrder: [pi1, pi2],
      pickedCores: 12,
    },
    list: all,
  };
}

// pool.js — fixed groups & two-block builder (31 allocations + final reflection)

// ---------- grid ----------
const SAFE_SET = [-4, -2, 0, 2, 4];
const RP_SET   = [0, 2, 4];
const SD_SET   = [3, 5, 7];

// Build the full 45, then drop baseline (2,0,3) and trivial FOSD (rp=4, sd=3) → 39 core
function _core39() {
  const out = [];
  for (const s of SAFE_SET) {
    for (const rp of RP_SET) {
      for (const sd of SD_SET) {
        const isBaseline = (s === 2 && rp === 0 && sd === 3);
        const isTrivial  = (rp === 4 && sd === 3);
        if (isBaseline || isTrivial) continue;
        const mean = s + rp;
        out.push({ s, rp, sd, u: mean + sd, d: mean - sd, p: 0.5 });
      }
    }
  }
  return out; // 39
}

// ---------- deterministic A/B/C groups ----------
const MASTER_SEED_FOR_GROUPS = 20240901;
let _CACHED_GROUPS = null;

export function getFixedGroups() {
  if (_CACHED_GROUPS) return _CACHED_GROUPS;

  const rng = mulberry32(MASTER_SEED_FOR_GROUPS);
  const core = _core39();

  // bucket by (rp,sd), shuffle inside buckets, round-robin to A/B/C
  const buckets = new Map();
  for (const c of core) {
    const k = `${c.rp}|${c.sd}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(c);
  }
  for (const arr of buckets.values()) shuffleInPlace(arr, rng);

  const A = [], B = [], C = [];
  for (const arr of buckets.values()) {
    arr.forEach((c, i) => (i % 3 === 0 ? A : i % 3 === 1 ? B : C).push(c));
  }

  // Top-up slight imbalances deterministically
  const all = shuffleInPlace(core.slice(), rng);
  while (A.length < 13) A.push(all.pop());
  while (B.length < 13) B.push(all.pop());
  while (C.length < 13) C.push(all.pop());

  _CACHED_GROUPS = { A, B, C };
  return _CACHED_GROUPS;
}

// ---------- blocks, sanities, and final pair ----------
function _pickFinalForGroup(groupKey) {
  // Final (group-specific) single-factor change vs. baseline (2 vs 5/−1):
  // A: safe shift; B: risk-premium shift; C: dispersion shift
  if (groupKey === "A") return { s: -2, rp: 0, sd: 3 };
  if (groupKey === "B") return { s:  2, rp: 2, sd: 3 };
  return { s: 2, rp: 0, sd: 5 }; // "C"
}

function _sanityBank() {
  // Two super-easy FOSD sanities (distinct from pool)
  const items = [
    { s:  4, rp: 4, sd: 3 },
    { s:  0, rp: 4, sd: 3 },
    { s:  2, rp: 4, sd: 3 },
    { s: -2, rp: 4, sd: 3 },
  ];
  return items.map(({ s, rp, sd }) => {
    const mean = s + rp;
    return { s, rp, sd, u: mean + sd, d: mean - sd, p: 0.5 };
  });
}

// Materialize scenario with inflation label "pi" and tags
function _mk(c, pi, tag, idMaker, extra = {}) {
  const id = idMaker();
  return {
    id,
    order: -1, // fill later
    tag,
    s: c.s,
    u: c.u ?? (c.s + c.rp + c.sd),
    d: c.d ?? (c.s + c.rp - c.sd),
    p: 0.5,
    pi,        // 0 or 6 (inflation assumption to display)
    ...extra,
  };
}

/**
 * Build one respondent’s 31 allocation screens in your structure:
 *
 * Block 1 (pi = order[0]):
 *   baseline → 6 pool → sanity → 7 pool    (15 screens)
 * Block 2 (pi = order[1]):
 *   baseline → 6 pool → sanity → 7 pool → final → final'   (16 screens)
 *
 * You’ll display your reflection screen after final' (32nd screen overall).
 */
export function buildRespondentSurveyFixed({
  seedRespondent = 12345,
  groupKey = null,        // "A" | "B" | "C" | null (null = random)
  blockOrder = null,      // [0,6] | [6,0] | null (null = random)
  storageTag = "ALT",
} = {}) {
  const rng = mulberry32(seedRespondent);

  // 1) Pick group A/B/C (fixed membership), then shuffle that group's 13
  const groups = getFixedGroups();
  const keys = ["A", "B", "C"];
  const pickKey = () => keys[Math.floor(rng() * 3)];
  const gk = (groupKey && keys.includes(groupKey)) ? groupKey : pickKey();
  const group13 = shuffleInPlace(groups[gk].slice(), rng);

  // Same six/seven split used in both blocks (keeps cognitive load tidy)
  const six = group13.slice(0, 6);
  const sev = group13.slice(6); // remaining 7

  // 2) Pick inflation block order
  const block = Array.isArray(blockOrder) && blockOrder.length === 2
    ? blockOrder
    : (rng() < 0.5 ? [0, 6] : [6, 0]);

  // 3) Assemble the two blocks
  const BASE = { s: 2, rp: 0, sd: 3 }; // (2 vs 5/−1)
  const SAN = _sanityBank();
  const nextId = (() => { let k = 1; return () => `SCN_${(k++).toString().padStart(3, "0")}`; })();

  const items = [];

  // Block 1
  items.push(_mk(BASE, block[0], "BASE", nextId, { isBaseline: true }));
  items.push(...six.map(c => _mk(c, block[0], storageTag, nextId)));
  // deterministic pick of sanity for block 1
  const s1 = SAN[Math.floor(rng() * SAN.length)];
  items.push(_mk(s1, block[0], "SAN", nextId, { isSanity: true }));
  items.push(...sev.map(c => _mk(c, block[0], storageTag, nextId)));

  // Block 2
  items.push(_mk(BASE, block[1], "BASE", nextId, { isBaseline: true }));
  items.push(...six.map(c => _mk(c, block[1], storageTag, nextId)));
  const s2 = SAN[(Math.floor(rng() * SAN.length) + 1) % SAN.length];
  items.push(_mk(s2, block[1], "SAN", nextId, { isSanity: true }));
  items.push(...sev.map(c => _mk(c, block[1], storageTag, nextId)));

  // Final + Mirror (same pi as block 2)
  const FINAL = _pickFinalForGroup(gk);
  items.push(_mk(FINAL, block[1], "LAST",   nextId, { isLast: true }));
  items.push(_mk(FINAL, block[0], "MIRROR", nextId, { isLast: true, isMirror: true }));

  // 4) Assign global sequential order
  items.forEach((it, i) => { it.order = i + 1; });

  return items;
}

// ---------- utilities ----------
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t |= 0; t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// src/components/survey/utils/schema.js
// Define ALL scenarios you may show (including 2 baselines + 10 sanity + 78 pool)
// Each must map to a stable slug so column order never changes.
// Example slug format: S{safe}%_U{up}%_D{down}%_I{infl}  (zero-padded / signed)
const pad = (n) => String(Math.abs(n)).padStart(2, "0");
const sgn = (n) => (n < 0 ? `m${pad(n)}` : `p${pad(n)}`); // m04 for -4, p06 for +6

export const scenarioSlug = ({ safe, up, down, infl }) =>
  `S${sgn(safe)}_U${sgn(up)}_D${sgn(down)}_I${sgn(infl)}`;

// ---- Enumerate your 90 scenarios here ----
// Example skeleton; replace with your full set:
const BASELINES = [
  { label: "BASE_0INF",   safe:  2, up:  5, down: -1, infl: 0   },
  { label: "BASE_6INF",   safe:  2, up:  5, down: -1, infl: 6   },
];

const SANITY = [
  // 10 sanity checks; examples:
  { label: "SAN_01", safe:  6, up:  9, down:  3, infl: 0 },
  { label: "SAN_02", safe:  4, up:  7, down:  1, infl: 0 },
  // ... fill to 10 total
];

const POOL = [
  // 78 pool scenarios in your design; examples:
  { label: "P_01", safe:  4, up:  0, down:  3, infl: 0 },
  { label: "P_02", safe:  0, up:  3, down: -3, infl: 0 },
  // ...
  // include both inflation variants as needed
];

export const ALL_SCENARIOS = [
  ...BASELINES,
  ...SANITY,
  ...POOL,
];

export const ALL_SCENARIO_SLUGS = ALL_SCENARIOS.map(s => scenarioSlug(s));

// For convenience, a lookup from scenario id in your app → slug
// If your runtime rows carry scenario_id = label or a numeric id, keep a map:
export const LABEL_TO_SLUG = Object.fromEntries(
  ALL_SCENARIOS.map(s => [s.label, scenarioSlug(s)])
);

// Fixed “alloc B” columns for the 90 scenarios
export const ALLOC_COLUMNS = ALL_SCENARIO_SLUGS.map(slug => `allocB__${slug}`);

// Optional: time spent columns per scenario (ms)
export const TIME_COLUMNS  = ALL_SCENARIO_SLUGS.map(slug => `ms__${slug}`);

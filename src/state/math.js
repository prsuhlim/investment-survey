export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function calcPortfolioEarnings({ amount, pctB, s, u, d }) {
  const b = clamp(Number(pctB) || 0, 0, 100) / 100;
  const a = 1 - b;
  const upPct = a * (Number(s) || 0) + b * (Number(u) || 0);
  const dnPct = a * (Number(s) || 0) + b * (Number(d) || 0);
  const upAmt = (amount * upPct) / 100;
  const dnAmt = (amount * dnPct) / 100;
  return { upPct, dnPct, upAmt, dnAmt };
}

export const signClass = (v) => (v > 0 ? "gain" : v < 0 ? "loss" : "neutral");

export function fmtOutcome(v) {
  const r = Math.abs(Math.round(Number(v) || 0));
  if (v > 0) return `+${r}% return`;
  if (v < 0) return `-${r}% loss`;
  return "0% return";
}

export const amountInA = (amount, pctB) =>
  amount * (100 - clamp(Number(pctB) || 0, 0, 100)) / 100;

export const amountInB = (amount, pctB) =>
  amount * clamp(Number(pctB) || 0, 0, 100) / 100;

export const signedPct = (x) =>
  x > 0 ? `+${x.toFixed(2)}%` : x < 0 ? `-${Math.abs(x).toFixed(2)}%` : "0.00%";

export const outcomeColor = (amt) =>
  amt === 0 ? "#374151" : amt > 0 ? "#0f7a35" : "#b44a3e";

export const outcomeVerb = (amt) => (amt >= 0 ? "earning" : "losing");

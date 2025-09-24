// urlConfig.js
export function readUrlConfig() {
  const qs = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const snap     = Number(qs.get("snap") ?? 5);
  const post     = qs.get("post") || "";
  const defaultB = Number(qs.get("defaultB") ?? 100);
  const poolseed = Number(qs.get("poolseed") ?? 12345);
  const pooltag  = qs.get("pooltag") ?? "ALT";
  const group    = qs.get("group") || null;

  let order = null;
  const rawOrder = qs.get("order");
  if (rawOrder) {
    const parts = rawOrder.split(",").map(x => Number(x.trim()));
    if (parts.length === 2 && parts.every(v => v === 0 || v === 6) && parts[0] !== parts[1]) {
      order = parts; // [0,6] or [6,0]
    }
  }

  const amountRaw = qs.get("amount");
  const parsedAmt = Number(amountRaw);
  const amount    = Number.isFinite(parsedAmt) && parsedAmt > 0 ? parsedAmt : 100000;

  const currency  = qs.get("currency") ?? "USD";

  // NEW: admin toggle (URL param or localStorage)
  const adminFromUrl = qs.get("admin") === "1";
  const adminFromLS  = (typeof localStorage !== "undefined" && localStorage.getItem("isAdmin") === "1");
  const isAdmin      = adminFromUrl || adminFromLS;

  return { snap, post, defaultB, poolseed, pooltag, group, order, amount, currency, isAdmin };
}
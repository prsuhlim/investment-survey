/**
 * Centralized URL param reader → normalized config object
 * ?poolseed=12345&pooltag=ALT&group=A|B|C&order=0,6|6,0&snap=5&defaultB=100&post=/api&amount=100000&currency=USD
 */
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

  // Robust number parse: only accept positive numbers. Blank/0/NaN → default.
  const amountRaw = qs.get("amount");
  const parsedAmt = Number(amountRaw);
  const amount    = Number.isFinite(parsedAmt) && parsedAmt > 0 ? parsedAmt : 100000;

  const currency = qs.get("currency") ?? "USD";

  return { snap, post, defaultB, poolseed, pooltag, group, order, amount, currency };
}

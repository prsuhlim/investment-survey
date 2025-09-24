// src/components/survey/utils/sendFinalRow.js
import { CSV_HEADERS } from "./flattenRow";
import { buildWideRow } from "./flattenRow";

/**
 * Send one respondent's wide row to your /api/appendRow endpoint.
 * Requires:
 *  - Server running (server/index.js in our setup)
 *  - Same shared secret on client and server
 * 
 * Env:
 *  - VITE_INGEST_SECRET must equal server's INGEST_SECRET
 *  - Optional: VITE_API_BASE if your API lives on a different origin
 */
const API_KEY  = import.meta.env.VITE_INGEST_SECRET || "";
const API_BASE = import.meta.env.VITE_API_BASE || ""; // e.g., "https://ingest.yourdomain.com"

export async function sendFinalRow({ rows, demo, meta }) {
  const wide = buildWideRow({ rows, demo, meta });
  const url  = `${API_BASE}/api/appendRow`; // resolved to "/api/appendRow" if API_BASE is ""

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      headers: CSV_HEADERS,
      row: wide,
    }),
  });

  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const j = await res.json();
      if (j && j.error) errMsg = j.error;
    } catch {}
    throw new Error(`Append failed: ${errMsg}`);
  }
}

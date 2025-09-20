// api/appendRow.ts
import { neon } from "@neondatabase/serverless";
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("POST required", { status: 405 });

  const secret = process.env.INGEST_SECRET || "";
  const auth = req.headers.get("x-api-key") || "";
  if (!secret || auth !== secret) return new Response("Unauthorized", { status: 401 });

  const { row } = await req.json();
  if (!row || typeof row !== "object") return new Response("Missing row", { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    insert into survey_wide_v1 (row_json, resp_id, version_tag, time_total_ms, order_vector)
    values (${JSON.stringify(row)}::jsonb, ${row.resp_id ?? null}, ${row.version_tag ?? null},
            ${Number.isFinite(+row.time_total_ms) ? +row.time_total_ms : null},
            ${row.order_vector ?? null})
  `;

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
}

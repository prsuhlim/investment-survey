import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ---- Env
const PORT = Number(process.env.PORT || 3000);
const CSV_DIR = process.env.CSV_DIR || "../data";
const CSV_FILE = process.env.CSV_FILE || "responses.csv";
const CSV_PATH = path.join(process.cwd(), CSV_DIR, CSV_FILE);
const INGEST_SECRET = process.env.INGEST_SECRET || "";
const SINGLE_WRITER = String(process.env.SINGLE_WRITER || "true").toLowerCase() === "true";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

// ---- CORS (lock down to allowed origins if provided)
if (ALLOWED_ORIGINS.length) {
  app.use(cors({
    origin: (origin, cb) => {
      // allow same-origin (like curl/postman without Origin)
      if (!origin) return cb(null, true);
      return ALLOWED_ORIGINS.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"));
    }
  }));
} else {
  app.use(cors()); // permissive; okay in dev
}

app.use(express.json({ limit: "1mb" }));

// ---- Ensure data dir exists
function ensureDir() {
  const dir = path.join(process.cwd(), CSV_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---- Very small write queue to avoid concurrent append overlaps
const writeQueue = [];
let isWriting = false;

function enqueueWrite(fn) {
  if (!SINGLE_WRITER) return fn();
  writeQueue.push(fn);
  if (!isWriting) drainQueue();
}

function drainQueue() {
  if (!writeQueue.length) { isWriting = false; return; }
  isWriting = true;
  const fn = writeQueue.shift();
  Promise.resolve()
    .then(() => fn())
    .catch(err => console.error("Write error:", err))
    .finally(() => drainQueue());
}

const csvLine = (arr) => arr.map(v => JSON.stringify(v ?? "")).join(",") + "\n";

// ---- Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---- Append wide row
app.post("/api/appendRow", (req, res) => {
  try {
    const auth = req.header("x-api-key") || "";
    if (!INGEST_SECRET || auth !== INGEST_SECRET) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { headers, row } = req.body;
    if (!Array.isArray(headers) || !headers.length || typeof row !== "object" || row === null) {
      return res.status(400).json({ ok: false, error: "Bad payload" });
    }

    ensureDir();
    const exists = fs.existsSync(CSV_PATH);

    const doWrite = () => new Promise((resolve, reject) => {
      try {
        const fd = fs.openSync(CSV_PATH, "a");
        if (!exists) {
          fs.writeSync(fd, csvLine(headers));
        }
        const ordered = headers.map(h => row[h]);
        fs.writeSync(fd, csvLine(ordered));
        fs.closeSync(fd);
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    enqueueWrite(async () => {
      await doWrite();
      res.json({ ok: true });
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`CSV collector listening on http://localhost:${PORT}`);
  console.log(`Writing to: ${CSV_PATH}`);
});

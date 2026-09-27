import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import dns from "dns/promises";
import net from "net";
import { fileURLToPath } from "url";

// ── Upload + bookmark server ──────────────────────────────────────────────────
//
// Production (Render): files go to Supabase Storage, NOT to this server's disk.
// Render's filesystem is wiped on every deploy/restart (same problem as the
// Hocuspocus SQLite), so anything saved to ./uploads there would vanish.
//
// Local dev: with no Supabase env vars set, files are saved to ./uploads and
// served from here, exactly like before.
//
// Env vars (Render → Environment):
//   PORT                        set by Render automatically
//   SUPABASE_URL                https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service_role secret (server-only)
//   UPLOAD_BUCKET               storage bucket name (default "uploads")
//   ALLOWED_ORIGINS             comma-separated frontend origins, e.g.
//                               https://folio.onrender.com,http://localhost:5173
//                               (unset = allow any origin, for local dev)
//   REQUIRE_AUTH                "true" = uploads need a Supabase session token
//                               in "Authorization: Bearer <access_token>"
//   PUBLIC_URL                  local-disk mode only: this server's base URL

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.UPLOAD_BUCKET ?? "uploads";
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";
const PUBLIC_URL = (
  process.env.PUBLIC_URL ?? `http://localhost:${PORT}`
).replace(/\/$/, "");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const useSupabase = !!(SUPABASE_URL && SERVICE_ROLE);
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!useSupabase && !fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const app = express();

app.use(
  cors(
    ALLOWED_ORIGINS.length
      ? {
          origin: (origin, cb) =>
            // No Origin header = same-origin / curl / health checks.
            cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
        }
      : undefined,
  ),
);

if (!useSupabase) app.use("/uploads", express.static(UPLOAD_DIR));

// Render health check.
app.get("/health", (_req, res) => res.json({ ok: true }));

// ── Auth ──────────────────────────────────────────────────────────────────────
// Validates the caller's Supabase access token with Supabase itself (no extra
// dependency). Off unless REQUIRE_AUTH=true, so turning it on can wait until
// the client sends the header.
async function requireUser(req, res, next) {
  if (!REQUIRE_AUTH) return next();
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !SUPABASE_URL) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return res.status(401).json({ error: "Not authenticated" });
    return next();
  } catch {
    return res.status(503).json({ error: "Auth check failed" });
  }
}

// ── Uploads ───────────────────────────────────────────────────────────────────

const upload = multer({
  // Supabase mode keeps the file in memory just long enough to forward it.
  storage: useSupabase
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
        filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
      }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// <timestamp>-<random><ext>, with the extension reduced to safe characters.
function uniqueName(originalName) {
  const ext = path
    .extname(originalName ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")
    .slice(0, 12);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

const publicUrlFor = (name) =>
  useSupabase
    ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${name}`
    : `${PUBLIC_URL}/uploads/${name}`;

async function putInStorage(name, buffer, contentType) {
  const r = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "max-age=31536000",
        "x-upsert": "false",
      },
      body: buffer,
    },
  );
  if (!r.ok) throw new Error(`Storage ${r.status}: ${await r.text()}`);
}

app.post("/api/upload", requireUser, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    if (useSupabase) {
      const name = uniqueName(req.file.originalname);
      await putInStorage(name, req.file.buffer, req.file.mimetype);
      return res.json({ url: publicUrlFor(name) });
    }
    return res.json({ url: publicUrlFor(req.file.filename) });
  } catch (err) {
    console.error("[upload]", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/api/uploads", requireUser, async (_req, res) => {
  try {
    if (useSupabase) {
      const r = await fetch(
        `${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`,
        {
          method: "POST",
          headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prefix: "",
            limit: 1000,
            sortBy: { column: "created_at", order: "desc" },
          }),
        },
      );
      if (!r.ok) throw new Error(`Storage ${r.status}: ${await r.text()}`);
      const items = await r.json();
      return res.json(
        items
          .filter((it) => it.id) // skip folder placeholders
          .map((it) => ({ filename: it.name, url: publicUrlFor(it.name) })),
      );
    }
    const files = fs.readdirSync(UPLOAD_DIR).map((filename) => ({
      filename,
      url: publicUrlFor(filename),
    }));
    return res.json(files);
  } catch (err) {
    console.error("[uploads]", err);
    return res.status(500).json({ error: "Could not list uploads" });
  }
});

// ── Bookmark previews ─────────────────────────────────────────────────────────
// Fetches a page server-side (browsers can't, because of CORS) and reads its
// title / description / image. Public on the internet, this would otherwise
// be an open proxy into private networks (e.g. Render's internal services or
// cloud metadata at 169.254.169.254), so every hop is checked: http(s) only,
// public addresses only, redirects re-checked, at most 1 MB read.

const MAX_HTML_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 4;

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
  return v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd");
}

async function assertPublicUrl(raw) {
  const u = new URL(raw);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http(s) URLs");
  }
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const addresses = net.isIP(host)
    ? [{ address: host }]
    : await dns.lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error("Private address");
  }
  return u;
}

async function fetchPublicHtml(raw) {
  let current = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = await assertPublicUrl(current);
    const response = await fetch(u, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect without location");
      current = new URL(location, u).toString();
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Read at most MAX_HTML_BYTES — the <head> is all we need.
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (size < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return Buffer.concat(chunks).toString("utf8");
  }
  throw new Error("Too many redirects");
}

app.get("/api/bookmark", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    const html = await fetchPublicHtml(url);
    const get = (pattern) => html.match(pattern)?.[1]?.trim() ?? null;

    const title =
      get(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ??
      get(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i) ??
      get(/<title[^>]*>([^<]+)<\/title>/i) ??
      null;

    const description =
      get(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ??
      get(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i) ??
      get(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ??
      get(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i) ??
      null;

    const image =
      get(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ??
      get(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i) ??
      null;

    const origin = new URL(url).origin;
    const favicon = `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;

    res.json({ title, description, image, favicon, url });
  } catch {
    // Fallback — return just the URL info without metadata
    try {
      const parsed = new URL(url);
      res.json({
        title: parsed.hostname.replace("www.", ""),
        description: null,
        image: null,
        favicon: `https://www.google.com/s2/favicons?domain=${parsed.origin}&sz=32`,
        url,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch URL" });
    }
  }
});

app.listen(PORT, () =>
  console.log(
    `Upload server on port ${PORT} — storing in ${
      useSupabase ? `Supabase bucket "${BUCKET}"` : UPLOAD_DIR
    }`,
  ),
);
// link-preview: title, description, image and favicon of a web page, for
// the bookmark block. Replaces the old localhost:3000/api/bookmark server.
//
// POST { "url": "https://…" }
// → { "url", "title", "description", "image", "favicon" }
//
// Called with the signed-in user's token (Supabase checks it before this
// code runs). Only public http(s) addresses are fetched, with a timeout and
// a size cap, so the function can't be pointed at internal services.

// CORS, so the browser can call this with supabase.functions.invoke().
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const TIMEOUT_MS = 8000;
const MAX_BYTES = 512 * 1024; // the <head> is near the top; no need for more

// Hosts the function refuses: loopback, private ranges, link-local,
// cloud metadata, and names that only resolve inside a network.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (!h.includes(".") && !h.includes(":")) return true; // bare intranet names

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  if (h.includes(":")) {
    return (
      h === "::1" ||
      h === "::" ||
      h.startsWith("fc") ||
      h.startsWith("fd") ||
      h.startsWith("fe80") ||
      h.startsWith("::ffff:")
    );
  }
  return false;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? null) : null;
}

// <meta property|name="key" content="…">
function meta(html: string, keys: string[]): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    if (keys.includes(key)) {
      const content = attr(tag, "content");
      if (content) return decodeEntities(content);
    }
  }
  return null;
}

function favicon(html: string): string | null {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (rel.split(/\s+/).some((r) => r === "icon" || r === "apple-touch-icon")) {
      const href = attr(tag, "href");
      if (href) return href;
    }
  }
  return null;
}

function absolute(value: string | null, base: URL): string | null {
  if (!value) return null;
  try {
    const u = new URL(value, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

async function readHead(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let html = "";
  let bytes = 0;
  while (bytes < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    html += decoder.decode(value, { stream: true });
    if (/<\/head>/i.test(html)) break;
  }
  await reader.cancel().catch(() => {});
  return html;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  let target: URL;
  try {
    const { url } = (await req.json()) as { url?: string };
    target = new URL(String(url ?? "").trim());
  } catch {
    return json({ error: "Send { url } with a full web address" }, 400);
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return json({ error: "Only http and https links can be previewed" }, 400);
  }
  if (isBlockedHost(target.hostname)) {
    return json({ error: "This address can't be previewed" }, 400);
  }

  try {
    // Follow redirects by hand so every hop is checked.
    let current = target;
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": "FolioLinkPreview/1.0 (+https://folio)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        const next = new URL(location, current);
        if (
          (next.protocol !== "http:" && next.protocol !== "https:") ||
          isBlockedHost(next.hostname)
        ) {
          return json({ error: "This address can't be previewed" }, 400);
        }
        current = next;
        continue;
      }
      break;
    }
    if (!res || !res.ok) {
      return json({ error: `The page answered ${res?.status ?? "nothing"}` }, 502);
    }

    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) {
      await res.body?.cancel();
      return json({
        url: current.toString(),
        title: current.hostname,
        description: null,
        image: type.startsWith("image/") ? current.toString() : null,
        favicon: absolute("/favicon.ico", current),
      });
    }

    const html = await readHead(res);
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

    return json({
      url: current.toString(),
      title:
        meta(html, ["og:title", "twitter:title"]) ??
        (titleTag ? decodeEntities(titleTag) : null) ??
        current.hostname,
      description: meta(html, ["og:description", "twitter:description", "description"]),
      image: absolute(meta(html, ["og:image", "og:image:url", "twitter:image"]), current),
      favicon: absolute(favicon(html) ?? "/favicon.ico", current),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    return json({ error: timedOut ? "The page took too long to answer" : "The page couldn't be reached" }, 502);
  }
});
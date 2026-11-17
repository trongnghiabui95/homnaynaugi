// Máy chủ thử cho e2e: phục vụ dist/ như Cloudflare Pages và chạy functions/api/[[path]].js trên D1 giả lập (node:sqlite).
// Chạy: node tests/may-chu-thu.mjs 8098   (tests/e2e.py tự bật). Xác minh Turnstile giả: mã "token-thu" là người thật.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { taoD1 } from "./d1-gia.mjs";
import { xuLy } from "../functions/api/[[path]].js";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const LOAI = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json", ".xml": "application/xml", ".txt": "text/plain" };

async function tinh(pathname) {
  let p = path.join(DIST, decodeURIComponent(pathname));
  if (!p.startsWith(DIST)) return new Response("", { status: 403 });
  try { if ((await fs.stat(p)).isDirectory()) p = path.join(p, "index.html"); return new Response(await fs.readFile(p), { headers: { "content-type": LOAI[path.extname(p)] || "application/octet-stream" } }); }
  catch { return new Response(await fs.readFile(path.join(DIST, "404.html")).catch(() => ""), { status: 404, headers: { "content-type": LOAI[".html"] } }); }
}

const fetchGoc = globalThis.fetch;
globalThis.fetch = async (u, o) => (String(u).includes("challenges.cloudflare.com")
  ? new Response(JSON.stringify({ success: o?.body?.get("response") === "token-thu" }))
  : fetchGoc(u, o));

const env = { DB: taoD1(), ASSETS: { fetch: (u) => tinh(new URL(u).pathname) }, TURNSTILE_SECRET: "bi-mat-thu", ADMIN_TOKEN: "ma-quan-tri-thu", MUOI: "muoi-thu" };

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const request = new Request(url, { method: req.method, headers: { ...req.headers, "cf-connecting-ip": "127.0.0.1" }, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks), duplex: "half" });
  const r = url.pathname.startsWith("/api/") ? await xuLy(request, env).catch((e) => new Response(String(e), { status: 500 })) : await tinh(url.pathname);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(Number(process.argv[2] || 8098));

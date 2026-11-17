// Cloudflare Pages Function cho mọi đường dẫn /api/*: "Thành quả của bạn đọc" (ảnh món đã nấu + bình luận theo từng món).
// Cần trên Cloudflare Pages (Settings → Bindings / Variables): D1 binding tên DB; biến bí mật TURNSTILE_SECRET, ADMIN_TOKEN, MUOI.
// Bảng tự tạo ở lần gọi đầu. Không lưu IP thật: chỉ lưu mã băm SHA-256 của IP + MUOI để giới hạn tần suất và chống báo cáo trùng.
// Kiểm thử trên Node: tests/thanh-qua.test.mjs (D1 giả lập bằng node:sqlite).

const GH = { ten: 40, noiDung: 500, anh: 600 * 1024, baiMoiGio: 5, baoCaoAn: 3, moiTrang: 60 };
const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS bai (id INTEGER PRIMARY KEY AUTOINCREMENT, mon TEXT NOT NULL, ten TEXT NOT NULL, noi_dung TEXT NOT NULL DEFAULT '', anh BLOB, anh_loai TEXT, tao_luc INTEGER NOT NULL, ip TEXT NOT NULL, bao_cao INTEGER NOT NULL DEFAULT 0, an INTEGER NOT NULL DEFAULT 0);",
  "CREATE INDEX IF NOT EXISTS bai_mon ON bai (mon, an, id);",
  "CREATE INDEX IF NOT EXISTS bai_ip ON bai (ip, tao_luc);",
  "CREATE TABLE IF NOT EXISTS bao_cao (bai_id INTEGER NOT NULL, ip TEXT NOT NULL, PRIMARY KEY (bai_id, ip));",
].join("\n"); // D1 exec: mỗi câu lệnh một dòng

let sanSang = null;
const chuanBi = (db) => (sanSang ??= db.exec(SCHEMA).catch((e) => { sanSang = null; throw e; }));

const json = (data, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache } });
const loi = (msg, status) => json({ loi: msg }, status);

// Chữ người dùng: bỏ ký tự điều khiển, gộp khoảng trắng, cắt độ dài. Web luôn thoát HTML khi hiển thị.
const sach = (s, max) => String(s ?? "")
  .replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮]/g, "")
  .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
const CO_LINK = /(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|vn|xyz|info|top|io|me|ru|cn|ly|site|online|shop|link)\b)/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function kieuAnh(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  const s = (i, n) => String.fromCharCode(...b.subarray(i, i + n));
  if (b.length > 12 && s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "image/webp";
  return "";
}
// Ảnh do web nén lại bằng canvas không còn EXIF (vị trí GPS, máy chụp). Ảnh còn EXIF nghĩa là gửi thẳng, không qua web: từ chối.
function coExif(b) {
  const n = Math.min(b.length, 65536) - 5;
  for (let i = 0; i < n; i++) if (b[i] === 0x45 && b[i + 1] === 0x78 && b[i + 2] === 0x69 && b[i + 3] === 0x66 && b[i + 4] === 0 && b[i + 5] === 0) return true;
  return false;
}

async function bam(env, ip) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.MUOI || "hnng"}|${ip || "?"}`));
  return [...new Uint8Array(d)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join("");
}

let monCache = { t: 0, set: null };
async function cacMon(request, env) {
  if (monCache.set && Date.now() - monCache.t < 300e3) return monCache.set;
  try {
    const r = await env.ASSETS.fetch(new URL("/data/recipes.json", request.url));
    monCache = { t: Date.now(), set: new Set((await r.json()).map((x) => x.s)) };
  } catch { monCache = { t: Date.now(), set: new Set() }; }
  return monCache.set;
}

async function quaBot(env, token, ip) {
  const fd = new FormData();
  fd.append("secret", env.TURNSTILE_SECRET);
  fd.append("response", String(token || ""));
  if (ip) fd.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd });
    return !!(await r.json()).success;
  } catch { return false; }
}

const banCongKhai = (r) => ({ id: r.id, ten: r.ten, noi_dung: r.noi_dung, co_anh: r.co_anh ? 1 : 0, tao_luc: r.tao_luc });

async function dsBai(url, env) {
  const mon = url.searchParams.get("mon") || "";
  if (!SLUG.test(mon)) return loi("Thiếu tên món.", 400);
  const { results } = await env.DB.prepare("SELECT id, ten, noi_dung, anh IS NOT NULL AS co_anh, tao_luc FROM bai WHERE mon = ? AND an = 0 ORDER BY id DESC LIMIT ?").bind(mon, GH.moiTrang).all();
  return json({ bai: results.map(banCongKhai) }, 200, "public, max-age=15");
}

async function guiBai(request, env) {
  if (!env.TURNSTILE_SECRET) return loi("Mục này chưa được bật.", 503);
  let fd;
  try { fd = await request.formData(); } catch { return loi("Dữ liệu gửi lên không hợp lệ.", 400); }
  const mon = String(fd.get("mon") || "");
  if (!SLUG.test(mon) || !(await cacMon(request, env)).has(mon)) return loi("Không tìm thấy món này.", 404);
  const ten = sach(fd.get("ten"), GH.ten), noi = sach(fd.get("noi_dung"), GH.noiDung);
  if (!ten) return loi("Bạn nhập tên hiển thị nhé.", 400);
  if (CO_LINK.test(`${ten} ${noi}`)) return loi("Bình luận không được chứa đường link.", 400);
  let anh = null, loai = null;
  const f = fd.get("anh");
  if (f && typeof f === "object" && f.size) {
    if (f.size > GH.anh) return loi("Ảnh quá lớn.", 413);
    anh = new Uint8Array(await f.arrayBuffer());
    loai = kieuAnh(anh);
    if (!loai) return loi("Chỉ nhận ảnh JPEG hoặc WebP.", 415);
    if (coExif(anh)) return loi("Bạn gửi ảnh qua nút trên web nhé.", 400);
  }
  if (!anh && !noi) return loi("Bạn thêm ảnh hoặc vài dòng cảm nhận nhé.", 400);
  const ipThat = request.headers.get("cf-connecting-ip") || "";
  if (!(await quaBot(env, fd.get("cf-turnstile-response"), ipThat))) return loi("Chưa xác minh được. Bạn thử gửi lại nhé.", 403);
  const ip = await bam(env, ipThat);
  const dem = await env.DB.prepare("SELECT COUNT(*) AS n FROM bai WHERE ip = ? AND tao_luc > ?").bind(ip, Date.now() - 3600e3).first();
  if (dem.n >= GH.baiMoiGio) return loi("Bạn gửi hơi nhiều. Nghỉ tay một lát rồi gửi tiếp nhé.", 429);
  const now = Date.now();
  const r = await env.DB.prepare("INSERT INTO bai (mon, ten, noi_dung, anh, anh_loai, tao_luc, ip) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id")
    .bind(mon, ten, noi, anh ? anh.buffer : null, loai, now, ip).first();
  return json({ bai: banCongKhai({ id: r.id, ten, noi_dung: noi, co_anh: !!anh, tao_luc: now }) }, 201);
}

async function traAnh(id, env, chiCongKhai) {
  if (!/^\d+$/.test(id)) return loi("Không tìm thấy.", 404);
  const r = await env.DB.prepare(`SELECT anh, anh_loai FROM bai WHERE id = ? AND anh IS NOT NULL${chiCongKhai ? " AND an = 0" : ""}`).bind(Number(id)).first();
  if (!r) return loi("Không tìm thấy.", 404);
  return new Response(new Uint8Array(r.anh), { headers: { "content-type": r.anh_loai, "cache-control": chiCongKhai ? "public, max-age=3600" : "no-store", "x-content-type-options": "nosniff" } });
}

async function baoCao(id, request, env) {
  if (!/^\d+$/.test(id)) return loi("Không tìm thấy.", 404);
  const ip = await bam(env, request.headers.get("cf-connecting-ip") || "");
  const r = await env.DB.prepare("INSERT OR IGNORE INTO bao_cao (bai_id, ip) SELECT id, ? FROM bai WHERE id = ?").bind(ip, Number(id)).run();
  if (r.meta?.changes) {
    await env.DB.prepare("UPDATE bai SET bao_cao = bao_cao + 1, an = CASE WHEN bao_cao + 1 >= ? THEN 1 ELSE an END WHERE id = ?").bind(GH.baoCaoAn, Number(id)).run();
  }
  return json({ ok: true });
}

async function quanTri(p, request, env, url) {
  const tk = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!env.ADMIN_TOKEN || tk !== env.ADMIN_TOKEN) return loi("Sai mã quản trị.", 401);
  const m = request.method;
  if (p[1] === "thanh-qua" && !p[2] && m === "GET") {
    const chiAn = url.searchParams.get("loc") === "an";
    const { results } = await env.DB.prepare(`SELECT id, mon, ten, noi_dung, anh IS NOT NULL AS co_anh, tao_luc, bao_cao, an FROM bai${chiAn ? " WHERE an = 1" : ""} ORDER BY id DESC LIMIT 200`).all();
    return json({ bai: results.map((r) => ({ ...banCongKhai(r), mon: r.mon, bao_cao: r.bao_cao, an: r.an })) });
  }
  if (p[1] === "anh" && p[2] && m === "GET") return traAnh(p[2], env, false);
  if (p[1] === "thanh-qua" && /^\d+$/.test(p[2] || "") && m === "POST") {
    const id = Number(p[2]);
    const { hanh_dong: hd } = await request.json().catch(() => ({}));
    if (hd === "an") await env.DB.prepare("UPDATE bai SET an = 1 WHERE id = ?").bind(id).run();
    else if (hd === "hien") await env.DB.batch([env.DB.prepare("UPDATE bai SET an = 0, bao_cao = 0 WHERE id = ?").bind(id), env.DB.prepare("DELETE FROM bao_cao WHERE bai_id = ?").bind(id)]);
    else if (hd === "xoa") await env.DB.batch([env.DB.prepare("DELETE FROM bai WHERE id = ?").bind(id), env.DB.prepare("DELETE FROM bao_cao WHERE bai_id = ?").bind(id)]);
    else return loi("Hành động không hợp lệ.", 400);
    return json({ ok: true });
  }
  return loi("Không tìm thấy.", 404);
}

/** Xử lý một yêu cầu /api/*. Tách riêng để kiểm thử trên Node. */
export async function xuLy(request, env) {
  const url = new URL(request.url);
  const p = url.pathname.replace(/^.*?\/api\//, "").replace(/\/+$/, "").split("/");
  if (!env.DB) return loi("Mục này chưa được bật.", 503);
  await chuanBi(env.DB);
  const m = request.method;
  if (p[0] === "thanh-qua") {
    if (p.length === 1 && m === "GET") return dsBai(url, env);
    if (p.length === 1 && m === "POST") return guiBai(request, env);
    if (p[1] === "anh" && p.length === 3 && m === "GET") return traAnh(p[2], env, true);
    if (p[2] === "bao-cao" && p.length === 3 && m === "POST") return baoCao(p[1], request, env);
  }
  if (p[0] === "quan-tri") return quanTri(p, request, env, url);
  return loi("Không tìm thấy.", 404);
}

export async function onRequest({ request, env }) {
  try { return await xuLy(request, env); }
  catch (e) { console.error(e); return loi("Có lỗi. Bạn thử lại sau nhé.", 500); }
}

// Cho kiểm thử
export const _noi = { sach, kieuAnh, coExif, CO_LINK, GH, datLai: () => { sanSang = null; monCache = { t: 0, set: null }; } };

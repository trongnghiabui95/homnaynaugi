// Tiện ích dùng chung cho script build: đọc CSV, thoát HTML, Markdown tối giản.

/** Đọc CSV chuẩn RFC 4180 (dấu phẩy, ngoặc kép, xuống dòng trong ô). Trả về mảng object theo dòng tiêu đề. */
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!nonEmpty.length) return [];
  const head = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r, idx) => {
    const o = { _row: idx + 2 };
    head.forEach((h, j) => { if (h) o[h] = (r[j] ?? "").trim(); });
    return o;
  });
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Bỏ dấu tiếng Việt, chữ thường — dùng cho tìm kiếm. */
export const fold = (s) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (_, t, u) => {
      const ext = u.startsWith("http");
      return `<a href="${u}"${ext ? ' rel="noopener" target="_blank"' : ""}>${t}</a>`;
    });
}

/** Markdown tối giản: tiêu đề ##/###, đoạn văn, danh sách -, 1., **đậm**, *nghiêng*, [link](url). */
export function md(src) {
  const lines = String(src ?? "").replace(/\r/g, "").split("\n");
  const out = [];
  let list = null, para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      flushPara(); flushList();
      const lvl = Math.min(m[1].length, 4);
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/)) || (m = line.match(/^\d+\.\s+(.*)$/))) {
      flushPara();
      const tag = /^\d/.test(line) ? "ol" : "ul";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push(m[1]);
    } else { flushList(); para.push(line); }
  }
  flushPara(); flushList();
  return out.join("\n");
}

/** Danh sách nguồn dạng "Tên | url; Tên 2 | url2" hoặc chỉ url, mỗi nguồn cách nhau dấu chấm phẩy hoặc xuống dòng. */
export function parseSources(s) {
  return String(s ?? "").split(/[;\n]/).map((x) => x.trim()).filter(Boolean).map((x) => {
    const [a, b] = x.split("|").map((y) => y.trim());
    if (b) return { name: a, url: b };
    return /^https?:/.test(a) ? { name: a.replace(/^https?:\/\/(www\.)?/, "").split("/")[0], url: a } : { name: a, url: "" };
  });
}

/** Mô tả trang (meta description) ≤ max ký tự: giữ nguyên phần đuôi (thời gian, khẩu phần), cắt bớt phần tóm tắt ở ranh giới từ và thêm "…". */
export function moTaNgan(sum, tail = "", max = 160) {
  sum = String(sum || "").replace(/\s+/g, " ").trim(); tail = String(tail || "").trim();
  const full = [sum, tail].filter(Boolean).join(" ");
  if (full.length <= max) return full;
  const room = max - (tail ? tail.length + 1 : 0) - 1;
  if (room < 20) return full.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  const head = sum.slice(0, room + 1), cut = (/\s/.test(head) ? head.replace(/\s+\S*$/, "") : head.slice(0, room)).replace(/[\s,.;:–-]+$/, "");
  return `${cut}…${tail ? " " + tail : ""}`;
}

/** Trình kiểm tra cục bộ dữ liệu có cấu trúc Recipe: trả về tên các trường Google cần/khuyên dùng mà còn thiếu. */
export function thieuTruongRecipe(ld) {
  const thieu = [];
  for (const k of ["name", "image", "recipeIngredient", "recipeInstructions", "totalTime"]) {
    const v = ld?.[k];
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) thieu.push(k);
  }
  return thieu;
}

export const isSlug = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s || "");

/** Link chia sẻ Google Drive → link ảnh trực tiếp (lh3.googleusercontent.com). Link khác giữ nguyên. */
export function imgUrl(u) {
  const s = String(u || "").trim();
  const m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/) || s.match(/drive\.google\.com\/.*[?&]id=([\w-]{20,})/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : s;
}

/** Nhận mã 11 ký tự hoặc link YouTube (watch, youtu.be, shorts, embed) → { id, shorts }. Không hợp lệ → null. */
export function parseYouTube(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return { id: s, shorts: false };
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? { id: m[1], shorts: /\/shorts\//.test(s) } : null;
}

// Làm nổi thông tin trong từng bước lúc build: tô đậm định lượng/thời gian/lửa, dò nguyên liệu dùng ở bước.
import { esc, fold } from "./lib.mjs";

const L = "\\p{L}\\p{N}";
const SO = "\\d+(?:[.,]\\d+)?(?:\\s*[–-]\\s*\\d+(?:[.,]\\d+)?)?";
const DON_VI = [
  "phút", "giờ", "tiếng", "giây", "ngày", "đêm", "°C", "°F", "độ C", "độ", "cm", "mm",
  "minutes", "minute", "mins", "min", "hours", "hour", "hrs", "hr", "seconds", "second", "secs", "sec", "days", "day", "inches", "inch",
];
const LUA = [
  "lửa (?:thật |rất )?(?:liu riu|riu riu|nhỏ vừa|vừa lớn|nhỏ|vừa|lớn|to|mạnh)",
  "(?:low|medium-low|medium-high|medium|high) heat",
];
const RE = new RegExp(
  `(?<![${L}])(?:${SO}\\s*(?:${DON_VI.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})|${LUA.join("|")})(?![${L}])`,
  "giu",
);

/** Thoát HTML rồi bọc <strong> quanh thời gian, nhiệt độ, kích cỡ, mức lửa. Không đổi câu chữ; khoảng trắng trong cụm thành &nbsp; để số không tách khỏi đơn vị. */
export function toDam(text) {
  const s = String(text ?? "");
  let out = "", last = 0;
  for (const m of s.matchAll(RE)) {
    out += esc(s.slice(last, m.index)) + `<strong>${esc(m[0]).replace(/\s+/g, "&nbsp;")}</strong>`;
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
}

const coDau = (s) => fold(s) !== s.toLowerCase();

/**
 * Trả về chỉ số các nguyên liệu (theo thứ tự trong danh sách) có tên xuất hiện trong chữ của bước.
 * So khớp nguyên từ, không phân biệt hoa thường, tên dài được ưu tiên ("trứng cút" thắng "trứng").
 * Bỏ dấu chỉ khi chữ trong bước viết không dấu, để "mười" không bị nhận là "muối".
 */
export function doNguyenLieu(text, names) {
  const s = String(text ?? "").normalize("NFC");
  const f = fold(s);
  if (f.length !== s.length) return []; // phòng hờ: fold phải giữ nguyên độ dài để so vị trí
  const taken = new Array(s.length).fill(false), hit = new Set();
  const order = names.map((n, i) => ({ i, n: String(n ?? "").normalize("NFC").replace(/\s*\(.*?\)\s*/g, " ").trim() }))
    .filter((x) => x.n).sort((a, b) => b.n.length - a.n.length);
  const isL = (c) => c !== undefined && /[\p{L}\p{N}]/u.test(c);
  for (const { i, n } of order) {
    const fn = fold(n), low = n.toLowerCase();
    for (let at = f.indexOf(fn); at >= 0; at = f.indexOf(fn, at + 1)) {
      const end = at + fn.length;
      if (isL(s[at - 1]) || isL(s[end])) continue;
      if (taken.slice(at, end).some(Boolean)) continue;
      const doan = s.slice(at, end);
      if (doan.toLowerCase() !== low && coDau(doan)) continue;
      taken.fill(true, at, end); hit.add(i);
    }
  }
  return [...hit].sort((a, b) => a - b);
}

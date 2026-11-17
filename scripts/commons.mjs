// Ảnh Wikimedia Commons: cột `anh` nhận link trang ảnh Commons, build tự lấy link ảnh cỡ vừa
// cùng tác giả, giấy phép để ghi nguồn (CC BY/BY-SA bắt buộc ghi nguồn).
// Không lấy được thông tin thì trả null: nơi gọi bỏ ảnh, không bao giờ hiện ảnh thiếu ghi nguồn.
import fs from "node:fs/promises";
import path from "node:path";

const API = "https://commons.wikimedia.org/w/api.php";
const WIDTH = 1280; // cỡ ảnh thu nhỏ chuẩn của Wikimedia

/**
 * Link/tên ảnh Commons → tên file chuẩn "File:Tên ảnh.jpg"; không phải ảnh Commons → "".
 * Nhận: commons.wikimedia.org/wiki/File:…, link "#/media/File:…" của Wikipedia,
 * upload.wikimedia.org/wikipedia/commons/… (cả ảnh thu nhỏ /thumb/), hoặc chỉ "File:…".
 */
export function commonsFile(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  let m = s.match(/^(?:File|Tập tin|Tập_tin):(.+)$/i)
    || s.match(/^https?:\/\/(?:commons\.(?:m\.)?wikimedia\.org\/wiki\/|[\w.-]+\.wikipedia\.org\/wiki\/[^#]*#\/media\/)(?:File|Tập_tin|Tập tin):([^?#]+)/i);
  let name = m?.[1];
  if (!name && (m = s.match(/^https?:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/))) name = m[2];
  if (!name) return "";
  try { name = decodeURIComponent(name); } catch {}
  name = name.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return name ? `File:${name[0].toUpperCase()}${name.slice(1)}` : "";
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
/** HTML trong metadata Commons (Artist thường là thẻ <a>) → chữ thường. */
export const plain = (h) => String(h || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (x, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? x)
  .replace(/\s+/g, " ").trim();

/** Đọc một trang trả về của API (formatversion=2) → thông tin ảnh, hoặc lý do không dùng được. */
function pageInfo(p) {
  if (!p || p.missing || p.invalid) return { why: "không có trên Commons (sai tên hoặc đã bị xoá)" };
  const ii = p.imageinfo?.[0];
  if (!ii) return { why: "Commons không trả thông tin ảnh" };
  const meta = ii.extmetadata || {};
  const v = (k) => plain(meta[k]?.value);
  const license = v("LicenseShortName");
  if (!license) return { why: "không rõ giấy phép" };
  // Commons hay gắn link trang thảo luận sau tên: "Phương Huy (thảo luận)", "Name (talk)" – bỏ phần đó.
  const author = (v("Artist") || v("Credit")).replace(/\s*\(\s*(thảo luận|talk|discussion|contribs|đóng góp)[^)]*\)/gi, "").trim().slice(0, 120);
  if (!author && !/public domain|cc0|pd/i.test(license)) return { why: "không rõ tác giả" };
  const src = (ii.thumburl || ii.url || "").replace(/\?.*$/, ""); // bỏ ?utm_… Wikimedia gắn thêm
  // Ảnh thu nhỏ có thể nằm ở upload.wikimedia.org hoặc thumb.wikimedia.org (máy chủ ảnh mới của Wikimedia)
  if (!/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(src || "")) return { why: "link ảnh lạ" };
  const page = ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURI(p.title.replace(/ /g, "_"))}`;
  return { src, page, author, license, licenseUrl: v("LicenseUrl") };
}

/** Gộp nhiều câu trả lời API (mỗi câu tối đa 50 ảnh) → Map tên file đã hỏi → thông tin ảnh. */
export function parseResponses(titles, responses) {
  const norm = new Map(), pages = new Map();
  for (const r of responses) {
    for (const n of r?.query?.normalized || []) norm.set(n.from, n.to);
    for (const p of r?.query?.pages || []) pages.set(p.title, p);
  }
  return new Map(titles.map((t) => [t, pageInfo(pages.get(norm.get(t) || t))]));
}

async function fetchBatch(batch) {
  const q = new URLSearchParams({
    action: "query", format: "json", formatversion: "2", prop: "imageinfo",
    iiprop: "url|extmetadata", iiurlwidth: String(WIDTH),
    iiextmetadatafilter: "Artist|Credit|LicenseShortName|LicenseUrl", titles: batch.join("|"),
  });
  let err;
  for (let lan = 0; lan < 3; lan++) {
    try {
      const res = await fetch(`${API}?${q}`, { headers: { "User-Agent": "HomNayNauGi-build/1.0 (static recipe site builder)" }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { err = e; await new Promise((ok) => setTimeout(ok, [2000, 8000, 20000][lan])); } // 429: chờ lâu dần
  }
  throw err;
}

/**
 * Tra thông tin cho các ảnh Commons. Kiểm thử không cần mạng: nếu `dataDir/commons.json` có sẵn
 * (mảng câu trả lời API mẫu) thì đọc file đó thay cho gọi mạng.
 * Trả về { info: Map tên file → {src, page, author, license, licenseUrl} | {why}, error }.
 */
export async function resolveCommons(titles, dataDir) {
  titles = [...new Set(titles.filter(Boolean))];
  if (!titles.length) return { info: new Map() };
  if (dataDir) {
    try { return { info: parseResponses(titles, JSON.parse(await fs.readFile(path.join(dataDir, "commons.json"), "utf8"))) }; } catch (e) { if (e.code !== "ENOENT") throw e; }
  }
  try {
    const responses = [];
    for (let i = 0; i < titles.length; i += 50) responses.push(await fetchBatch(titles.slice(i, i + 50)));
    return { info: parseResponses(titles, responses) };
  } catch (e) {
    return { info: new Map(titles.map((t) => [t, { why: "không kết nối được Wikimedia Commons" }])), error: e.message };
  }
}

/** Dòng ghi nguồn dạng cột anh_nguon: "Tác giả, Giấy phép https://trang-ảnh". */
export const creditText = (c) => `${c.author ? `${c.author}, ` : ""}${c.license} ${c.page}`;

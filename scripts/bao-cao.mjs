#!/usr/bin/env node
// Báo cáo tình trạng nội dung của "Hôm Nay Nấu Gì" cho bộ máy vận hành.
// Đọc Google Sheet (hoặc CSV qua --sample / DATA_DIR) rồi in Markdown kèm khối JSON.
//   node scripts/bao-cao.mjs              → đọc Sheet (ID trong sheet.json hoặc SHEET_ID)
//   node scripts/bao-cao.mjs --sample     → đọc data/sample
//   node scripts/bao-cao.mjs --json       → chỉ in JSON
// Chạy mỗi sáng trên GitHub Actions (.github/workflows/bao-cao-van-hanh.yml), kết quả ghi vào Issue nhãn "bao-cao".
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV, fold, isSlug, parseYouTube } from "./lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TABS = ["settings", "categories", "recipes", "ingredients", "steps"];
const sampleOnly = process.argv.includes("--sample");
const jsonOnly = process.argv.includes("--json");
const MAM = ["mon-man", "mon-canh", "mon-rau-xao"];
const MUC_TIEU = 50; // mục tiêu món đã duyệt trước khi đăng ký AdSense

let sheetJson = {};
try { sheetJson = JSON.parse(await fs.readFile(path.join(ROOT, "sheet.json"), "utf8")); } catch {}
const SHEET_ID = sampleOnly || process.env.DATA_DIR ? "" : process.env.SHEET_ID || sheetJson.sheetId || "";

async function loadTab(tab) {
  if (SHEET_ID) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được tab "${tab}" (HTTP ${res.status}).`);
    return parseCSV(await res.text());
  }
  const file = path.join(process.env.DATA_DIR || path.join(ROOT, "data", "sample"), `${tab}.csv`);
  try { return parseCSV(await fs.readFile(file, "utf8")); } catch { return []; }
}

const raw = Object.fromEntries(await Promise.all(TABS.map(async (t) => [t, await loadTab(t)])));
const settings = Object.fromEntries(raw.settings.map((r) => [r.key, r.value]));
const cats = raw.categories.filter((c) => isSlug(c.slug));
const catSlugs = new Set(cats.map((c) => c.slug));
const countBy = (rows) => rows.reduce((m, r) => ((m[r.recipe_slug] = (m[r.recipe_slug] || 0) + 1), m), {});
const ingN = countBy(raw.ingredients);
const stepN = countBy(raw.steps);

const mon = raw.recipes.filter((r) => r.slug || r.ten).map((r) => {
  const loi = [];
  if (!isSlug(r.slug)) loi.push("slug không hợp lệ");
  if (!catSlugs.has(r.danh_muc)) loi.push(`danh mục "${r.danh_muc || "trống"}" không có`);
  if (!ingN[r.slug]) loi.push("chưa có nguyên liệu");
  if (!stepN[r.slug]) loi.push("chưa có bước");
  return {
    slug: r.slug, ten: r.ten, danh_muc: r.danh_muc,
    duyet: fold(r.trang_thai) === "duyet",
    co_video: !!parseYouTube(r.video), co_anh: !!r.anh, co_kenh: !!r.kenh,
    cap_nhat: r.cap_nhat || "", loi,
  };
});

const len = mon.filter((m) => m.duyet && !m.loi.length); // món thật sự lên web
const nhap = mon.filter((m) => !m.duyet);
const duyetLoi = mon.filter((m) => m.duyet && m.loi.length); // đã duyệt nhưng bị build bỏ qua
const theoDanhMuc = Object.fromEntries(cats.map((c) => [c.slug, len.filter((m) => m.danh_muc === c.slug).length]));
const data = {
  ngay: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }),
  nguon: SHEET_ID ? "google-sheet" : "csv",
  site_url: settings.site_url || "",
  adsense: !!settings.adsense_client,
  muc_tieu: MUC_TIEU,
  tong_mon: mon.length,
  len_web: len.length,
  nhap: nhap.map((m) => ({ slug: m.slug, ten: m.ten, loi: m.loi })),
  duyet_nhung_loi: duyetLoi.map((m) => ({ slug: m.slug, ten: m.ten, loi: m.loi })),
  theo_danh_muc: theoDanhMuc,
  danh_muc_trong: cats.filter((c) => !theoDanhMuc[c.slug]).map((c) => c.slug),
  mam_com_du: MAM.every((s) => theoDanhMuc[s] > 0),
  thieu_video: len.filter((m) => !m.co_video).map((m) => m.slug),
  video_thieu_kenh: len.filter((m) => m.co_video && !m.co_kenh).map((m) => m.slug),
  thieu_anh: len.filter((m) => !m.co_anh && !m.co_video).map((m) => m.slug),
};

if (jsonOnly) { console.log(JSON.stringify(data, null, 2)); process.exit(0); }

const ds = (a, n = 15) => (a.length ? a.slice(0, n).map((x) => `\`${typeof x === "string" ? x : x.slug}\``).join(", ") + (a.length > n ? ` … (+${a.length - n})` : "") : "không có");
const out = [
  `# Báo cáo nội dung ${data.ngay}`,
  "",
  `Tự cập nhật mỗi sáng bởi workflow **Báo cáo vận hành**. Skill \`/van-hanh\` đọc báo cáo này để lên việc.`,
  "",
  `- Món đang lên web: **${data.len_web}/${MUC_TIEU}** (mục tiêu trước khi đăng ký AdSense)`,
  `- Món nháp chờ bạn duyệt: **${nhap.length}**`,
  `- Đã duyệt nhưng bị bỏ qua vì lỗi: **${duyetLoi.length}**`,
  `- Mâm cơm 3 món: ${data.mam_com_du ? "đủ món mặn, canh, rau/xào" : "**thiếu** một trong 3 danh mục mặn / canh / rau-xào"}`,
  `- Domain thật: ${data.site_url || "chưa có"} · AdSense: ${data.adsense ? "đã gắn" : "chưa"}`,
  "",
  "## Theo danh mục",
  ...cats.map((c) => `- ${c.bieu_tuong || ""} ${c.ten}: ${theoDanhMuc[c.slug]}`),
  "",
  "## Cần xử lý",
  `- Đã duyệt nhưng lỗi: ${duyetLoi.length ? duyetLoi.map((m) => `\`${m.slug}\` (${m.loi.join(", ")})`).join("; ") : "không có"}`,
  `- Nháp: ${nhap.length ? nhap.slice(0, 15).map((m) => `\`${m.slug}\`${m.loi.length ? ` (${m.loi.join(", ")})` : " (sẵn sàng duyệt)"}`).join("; ") : "không có"}`,
  `- Món chưa có video: ${ds(data.thieu_video)}`,
  `- Video chưa ghi tên kênh: ${ds(data.video_thieu_kenh)}`,
  `- Món không có ảnh lẫn video: ${ds(data.thieu_anh)}`,
  `- Danh mục chưa có món: ${ds(data.danh_muc_trong)}`,
  "",
  "<!-- DU-LIEU",
  JSON.stringify(data),
  "DU-LIEU -->",
];
console.log(out.join("\n"));

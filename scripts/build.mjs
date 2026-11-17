#!/usr/bin/env node
// Dựng web "Hôm Nay Nấu Gì" tĩnh từ Google Sheets (hoặc CSV mẫu) ra thư mục dist/.
//   node scripts/build.mjs            → đọc Google Sheet nếu có SHEET_ID, không thì đọc data/sample
//   node scripts/build.mjs --sample   → luôn đọc data/sample
// Biến môi trường: SHEET_ID, DATA_DIR (thư mục CSV), BASE_PATH (chạy trong thư mục con), SITE_URL.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV, esc, fold, md, isSlug, imgUrl, parseYouTube } from "./lib.mjs";
import { commonsFile, resolveCommons, creditText } from "./commons.mjs";
import { layout, adSlot, emptyState, ytThumb, icon, recipeCard, abs } from "./templates.mjs";
import { LANGS, PREFIX, tr, diffText } from "./i18n.mjs";
import { toDam, doNguyenLieu } from "./buoc.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const TABS = ["settings", "categories", "recipes", "ingredients", "steps"];
const report = { skipped: [], warnings: [], errors: [] };
const skip = (tab, r, why) => report.skipped.push(`${tab} dòng ${r._row}${r.slug ? ` (${r.slug})` : ""}: ${why}`);
const sampleOnly = process.argv.includes("--sample");
// Gia vị coi như nhà nào cũng có: không tính khi so "tủ lạnh có gì".
const PANTRY = ["muoi", "duong", "nuoc mam", "tieu", "tieu xay", "dau an", "hat nem", "nuoc", "bot ngot", "nuoc tuong", "dau o liu", "da vien", "nuoc loc"];
// Ba ngăn của mâm cơm: slug danh mục cho từng ngăn.
const MAM = [["mon-man", "mam_man"], ["mon-canh", "mam_canh"], ["mon-rau-xao", "mam_rau"]];
// Danh mục có ít món hơn số này thì không hiện ở trang chủ, trang Danh mục và sitemap (trang vẫn có, đặt noindex).
const MIN_MON_DANH_MUC = 1;

// ID Google Sheet: biến môi trường SHEET_ID, không có thì đọc sheet.json. Sheet để chế độ "ai có link đều xem được" nên ID không phải bí mật.
let sheetJson = {};
try { sheetJson = JSON.parse(await fs.readFile(path.join(ROOT, "sheet.json"), "utf8")); } catch {}
const SHEET_ID = sampleOnly || process.env.DATA_DIR ? "" : process.env.SHEET_ID || sheetJson.sheetId || "";

async function loadTab(tab) {
  const sheetId = SHEET_ID;
  if (sheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được tab "${tab}" từ Google Sheets (HTTP ${res.status}). Kiểm tra quyền chia sẻ và tên tab.`);
    return parseCSV(await res.text());
  }
  const file = path.join(process.env.DATA_DIR || path.join(ROOT, "data", "sample"), `${tab}.csv`);
  try { return parseCSV(await fs.readFile(file, "utf8")); } catch { return []; }
}

const num = (v, d = 0) => (v === "" || v == null || isNaN(Number(String(v).replace(",", "."))) ? d : Number(String(v).replace(",", ".")));
const byOrder = (a, b) => num(a.thu_tu, 999) - num(b.thu_tu, 999);
const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
const iso = (m) => `PT${Math.round(m)}M`;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const money = (v) => (lang === "vi" ? `${Math.round(v).toLocaleString("vi-VN")}đ` : `${Math.round(v).toLocaleString("en-US")}₫`);
export function qtyText(q) {
  if (!q) return "";
  const whole = Math.floor(q), frac = Math.round((q - whole) * 100) / 100;
  const F = { 0.25: "¼", 0.33: "⅓", 0.5: "½", 0.67: "⅔", 0.75: "¾" };
  if (frac && F[frac]) return `${whole || ""}${F[frac]}`;
  return String(Math.round(q * 10) / 10).replace(".", ",");
}

const pages = [];
// Ngôn ngữ đang dựng: build chạy lần lượt "vi" rồi "en"; t() lấy chữ giao diện từ scripts/i18n.mjs.
let lang = "vi", t = tr("vi");
// Ghi công ảnh có giấy phép: "Tên tác giả, CC BY-SA 4.0 https://link-trang-ảnh"
function photoCredit(nguon, tag = "figcaption", attr = "") {
  const raw = String(nguon || "").trim();
  if (!raw) return "";
  const link = raw.match(/https?:\/\/\S+/);
  const txt = raw.replace(/https?:\/\/\S+/, "").replace(/[\s,;·–-]+$/, "").trim();
  // Một dòng nhỏ, màu nhạt: "Nguồn: tác giả, giấy phép"; cả dòng là link tới trang ảnh (CC BY/BY-SA bắt buộc ghi tên tác giả).
  const chu = `${t("source")}${txt ? `: <span lang="vi">${esc(txt)}</span>` : ""}`;
  return `<${tag} class="credit"${attr}${txt ? ` title="${t("photo")}: ${esc(txt)}"` : ""}>${link ? `<a href="${esc(link[0])}" rel="noopener" target="_blank">${chu}</a>` : chu}</${tag}>`;
}
async function write(rel, content) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}
async function page(site, p) {
  if (!p.noindex) pages.push({ path: PREFIX[lang] + p.path, alt: p.path, lastmod: p.lastmod });
  let html = layout({ ...site, lang }, p);
  // Bản tiếng Anh: link trang nội bộ "/x" → "/en/x" (trừ tài nguyên tĩnh); "/__vi__/x" là link về bản tiếng Việt → "/x".
  if (lang !== "vi") html = html.replace(/(\s(?:href|action)=")\/(?!\/|en\/|assets\/|data\/|api\/|manifest\.webmanifest|__vi__\/)/g, `$1${PREFIX[lang]}/`);
  html = html.replace(/(\s(?:href|action)=")\/__vi__\//g, "$1/");
  await write(PREFIX[lang] + (p.path === "/404" ? "/404.html" : path.join(p.path, "index.html")), html);
}

async function main() {
  const raw = {};
  for (const t of TABS) raw[t] = await loadTab(t);

  const site = { site_name: "Hôm Nay Nấu Gì", tagline: "", site_url: "" };
  for (const r of raw.settings) if (r.key) site[r.key] = r.value;
  site.base = (process.env.BASE_PATH || "").replace(/\/+$/, "");
  site.site_url = (process.env.SITE_URL || site.site_url || "https://example.com").replace(/\/+$/, "");
  site.build_id = Date.now().toString(36);

  // Ảnh Wikimedia Commons: tra link ảnh, tác giả, giấy phép một lần cho cả web.
  const dataDir = SHEET_ID ? "" : process.env.DATA_DIR || path.join(ROOT, "data", "sample");
  const commons = await resolveCommons([...raw.recipes, ...raw.steps, ...raw.categories].map((x) => commonsFile(x.anh)), dataDir);
  if (commons.error) report.warnings.push(`không lấy được thông tin ảnh từ Wikimedia Commons (${commons.error}) – tạm ẩn các ảnh Commons`);
  // Một ô `anh` → { src, credit }. Ảnh Commons tự kèm dòng ghi nguồn; tra không được thì bỏ ảnh, không hiện ảnh thiếu nguồn.
  const pic = (u, where) => {
    const f = commonsFile(u);
    if (!f) return { src: imgUrl(u), credit: "" };
    const c = commons.info.get(f);
    if (c.why) { if (!commons.error) report.warnings.push(`${where}: ảnh "${f}" ${c.why} – bỏ ảnh`); return { src: "", credit: "" }; }
    return { src: c.src, credit: creditText(c) };
  };

  // ----- Dữ liệu -----
  const cats = raw.categories.filter((c) => (isSlug(c.slug) ? true : (skip("categories", c, "slug không hợp lệ"), false))).sort(byOrder)
    .map((c) => { const p = pic(c.anh, `categories ${c.slug}`); return { ...c, img: p.src, credit: p.src ? c.anh_nguon || p.credit : "" }; });
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));
  const ingBy = groupMap(raw.ingredients.filter((i) => i.ten), "recipe_slug");
  const stepBy = groupMap(raw.steps.filter((s) => s.noi_dung), "recipe_slug");
  const recipes = [];
  for (const r of raw.recipes) {
    if (!isSlug(r.slug)) { skip("recipes", r, "slug không hợp lệ"); continue; }
    if (fold(r.trang_thai) !== "duyet") { skip("recipes", r, `trạng thái "${r.trang_thai || "trống"}", chưa duyệt`); continue; }
    if (!catBySlug[r.danh_muc]) { skip("recipes", r, `danh mục "${r.danh_muc}" không có trong tab categories`); continue; }
    const ings = ingBy.get(r.slug) || [], steps = (stepBy.get(r.slug) || []).sort((a, b) => num(a.buoc) - num(b.buoc));
    if (!ings.length || !steps.length) { skip("recipes", r, "cần ít nhất 1 nguyên liệu và 1 bước"); continue; }
    const vraw = r.video || r.youtube_id || "";
    const yt = parseYouTube(vraw);
    if (vraw && !yt) report.warnings.push(`recipes ${r.slug}: video "${vraw}" không phải link/mã YouTube hợp lệ, bỏ video`);
    const p = pic(r.anh, `recipes ${r.slug}`), anh = p.src;
    const stepPics = steps.map((s) => { const q = pic(s.anh, `steps ${r.slug} bước ${s.buoc}`); return { ...s, img: q.src, credit: q.src ? s.anh_nguon || q.credit : "" }; });
    recipes.push({
      ...r, anh_nguon: r.anh_nguon || p.credit, ings, steps: stepPics, cat: catBySlug[r.danh_muc], yt, anh,
      serv: num(r.khau_phan, 2) || 2, prep: num(r.phut_chuan_bi), cook: num(r.phut_nau), total: num(r.phut_chuan_bi) + num(r.phut_nau),
      cal: num(r.calo), cost: num(r.chi_phi), bua: list(r.bua).map(fold), tagList: list(r.tags), anKem: list(r.an_kem),
      img: anh || (yt ? ytThumb(yt.id) : ""),
    });
  }
  const seen = new Set();
  for (const r of recipes) { if (seen.has(r.slug)) report.errors.push(`recipes: trùng slug "${r.slug}" (dòng ${r._row})`); seen.add(r.slug); }
  if (report.errors.length) { console.error("LỖI:\n- " + report.errors.join("\n- ")); process.exit(1); }
  recipes.sort((a, b) => (b.cap_nhat || "").localeCompare(a.cap_nhat || "") || a.ten.localeCompare(b.ten, "vi"));
  const bySlug = Object.fromEntries(recipes.map((r) => [r.slug, r]));
  // Bản dịch tiếng Anh (cột *_en, có thể trống). Giữ chữ gốc tiếng Việt ở .vi; localize() đổi chữ hiển thị theo ngôn ngữ đang dựng.
  for (const c of cats) c.vi = { ten: c.ten, mo_ta: c.mo_ta };
  for (const r of recipes) {
    r.vi = { ten: r.ten, tom_tat: r.tom_tat, meo: r.meo };
    for (const i of r.ings) i.vi = { ten: i.ten, ghi_chu: i.ghi_chu, nhom: i.nhom, don_vi: i.don_vi };
    for (const s of r.steps) s.vi = { tieu_de: s.tieu_de, noi_dung: s.noi_dung };
    r.dich = daDich(r, "en");
  }
  const catCount = (c) => recipes.filter((r) => r.danh_muc === c.slug).length;
  const catsShown = cats.filter((c) => catCount(c) >= MIN_MON_DANH_MUC);
  site.has_video = recipes.some((r) => r.yt); // ẩn link "Tất cả video" ở chân trang khi chưa có video

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.cp(SRC, DIST, { recursive: true });

  // Chỉ mục cho vòng quay, tìm kiếm, tủ lạnh, đi chợ, đã lưu (phía trình duyệt)
  const tEn = tr("en");
  const index = recipes.map((r) => ({
    s: r.slug, t: r.ten, c: r.danh_muc, cn: r.cat.ten, ...(r.ten_en ? { te: r.ten_en } : {}), ...(tEn("cat_name", r.danh_muc) ? { ce: tEn("cat_name", r.danh_muc) } : {}), m: r.total, k: r.do_kho, img: r.img, v: r.yt ? 1 : 0,
    cal: r.cal || 0, b: r.bua, n: r.nguyen_lieu_chinh || "", d: r.cap_nhat || "", tg: r.tagList.map(fold),
    f: fold([r.ten, r.tom_tat, r.cat.ten, r.tags, r.nguyen_lieu_chinh, r.ten_en, r.tom_tat_en, tEn("cat_name", r.danh_muc)].join(" ")),
    g: r.ings.filter((i) => !PANTRY.includes(fold(i.ten))).map((i) => fold(i.ten)),
    sv: r.serv, ig: r.ings.map((i) => [i.ten, num(i.so_luong, 0), i.don_vi]),
  }));
  await write("data/recipes.json", JSON.stringify(index));

  for (lang of LANGS) {
  t = tr(lang);
  localize(lang, cats, recipes);
  const L = { ...site, lang, tagline: lang === "vi" ? site.tagline : site[`tagline_${lang}`] || t("tagline_default") };
  const vi = (s) => (lang === "vi" ? s : `<span lang="vi">${s}</span>`); // nội dung tiếng Việt chưa dịch trong trang tiếng Anh
  const LV = lang === "vi" ? "" : ' lang="vi"';
  const grid = (rs, attrs = false, row = false) => `<div class="${row ? "cat-row" : "rgrid"}">${rs.map((r) => recipeCard(r, attrs, lang)).join("")}</div>`;
  const mains = [...new Set(recipes.map((r) => r.nguyen_lieu_chinh).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const themes = list(site.chu_de).filter((t) => recipes.some((r) => r.tagList.map(fold).includes(fold(t))));
  const fridge = topIngredients(recipes, 24);

  // ----- Video: thẻ phát tại chỗ (trang chủ) và trình xem liên tiếp (/video/). Chỉ nhúng youtube-nocookie, luôn ghi kênh + link YouTube.
  const withVideo = recipes.filter((r) => r.yt);
  const watchUrl = (yt) => `https://www.youtube.com/${yt.shorts ? `shorts/${yt.id}` : `watch?v=${yt.id}`}`;
  const videoCredit = (r) => `${t("video_by", r.kenh ? esc(r.kenh) : "")} · <a href="${watchUrl(r.yt)}" rel="noopener" target="_blank">${t("watch_yt")}</a>`;
  const liteYT = (r, attr) => `<button class="lite-yt" type="button" ${attr} aria-label="${esc(t("play_video", r.ten))}"><img src="${ytThumb(r.yt.id)}" alt="" loading="lazy" width="480" height="360"><span class="play" aria-hidden="true"></span></button>`;
  const vcard = (r) => `<article class="vcard${r.yt.shorts ? " doc" : ""}" data-vcard data-id="${esc(r.yt.id)}">
  <div class="vcard-media">${liteYT(r, "data-vplay")}</div>
  <div class="vcard-body"><strong${A(r.lv.ten)}>${esc(r.ten)}</strong>${r.yt.shorts || !r.tom_tat ? "" : `<p${A(r.lv.tom_tat)}>${esc(r.tom_tat)}</p>`}<small>${videoCredit(r)}</small><a class="vcard-link" href="/mon/${r.slug}/">${t("see_recipe_arrow")}</a></div>
</article>`;

  // ----- Trang chủ -----
  // Trang chủ: món có ảnh (ảnh thật hoặc ảnh bìa video) xếp trước món chưa có ảnh; trong mỗi nhóm giữ thứ tự mới nhất.
  const anhTruoc = (rs) => [...rs.filter((r) => r.img), ...rs.filter((r) => !r.img)];
  const quick = anhTruoc(recipes.filter((r) => r.total && r.total <= 20)).slice(0, 8);
  // Công thức mới không lặp lại món đã có ở hàng "Nhanh gọn"
  const moi = anhTruoc(recipes.filter((r) => !quick.includes(r))).slice(0, 8);
  await page(L, {
    path: "/", page: "home", title: site.site_name,
    description: t("home_desc", L.tagline, recipes.length),
    jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: site.site_name, url: abs(site, lang, "/"), inLanguage: lang,
      potentialAction: { "@type": "SearchAction", target: `${abs(site, lang, "/tim-kiem/")}?q={q}`, "query-input": "required name=q" } }],
    body: `
<section class="hero">
  <h1>${t("hero_h1")}</h1>
  ${L.tagline ? `<p class="lead">${esc(L.tagline)}</p>` : ""}
  <form class="search big" action="/tim-kiem/" role="search">${icon("search")}<label class="sr-only" for="hq">${t("search_label")}</label><input id="hq" name="q" type="search" placeholder="${t("search_ph")}"></form>
  ${themes.length ? `<nav class="chips" aria-label="${t("themes")}">${themes.map((x) => `<a class="chip" href="/tim-kiem/?tag=${encodeURIComponent(x)}"${LV}>${esc(x)}</a>`).join("")}</nav>` : ""}
</section>

<section class="spin card" data-spin aria-labelledby="spin-title">
  <h2 id="spin-title">${t("spin_h2")}</h2>
  <button class="icon-btn spin-am" type="button" data-spin-am aria-pressed="true" aria-label="${t("spin_sound")}">${icon("loa")}</button>
  <div class="kind" role="radiogroup" aria-label="${t("spin_kind")}">
    <label><input type="radio" name="spin-kind" value="an" data-spin-kind checked><span>${t("kind_food")}</span></label>
    <label><input type="radio" name="spin-kind" value="uong" data-spin-kind><span>${t("kind_drink")}</span></label>
  </div>
  <div class="seg" role="tablist" aria-label="${t("spin_modes")}" data-spin-modes>
    <button type="button" role="tab" data-spin-mode="one" aria-selected="true">${t("mode_one")}</button>
    <button type="button" role="tab" data-spin-mode="mam" aria-selected="false">${t("mode_mam")}</button>
  </div>
  <details class="spin-more"><summary>${t("filters")}<span data-spin-fcount></span></summary><div class="spin-filters">
    <label><span>${t("f_meal")}</span><select data-spin-f="b"><option value="">${t("f_meal_any")}</option><option value="sang">${t("meal_sang")}</option><option value="trua">${t("meal_trua")}</option><option value="toi">${t("meal_toi")}</option></select></label>
    <label><span>${t("f_time")}</span><select data-spin-f="m"><option value="">${t("f_time_any")}</option>${[15, 30, 45].map((n) => `<option value="${n}">${t("under_min", n)}</option>`).join("")}</select></label>
    <label><span>${t("f_main")}</span><select data-spin-f="n"><option value="">${t("f_main_any")}</option>${mains.map((n) => `<option${LV}>${esc(n)}</option>`).join("")}</select></label>
  </div></details>
  <div class="row spin-go"><button class="btn big" type="button" data-spin-go>${icon("dice")}<span>${t("spin_go")}</span></button></div>
  <div class="spin-slots" data-spin-slots aria-live="polite" data-mam='${esc(JSON.stringify(MAM.map(([c, k]) => [c, t(k)])))}'><div class="slot empty-slot" data-slot="one"><div><div class="slot-label">${t("for_you")}</div><p>${t("waiting")}</p></div></div></div>
  <div class="row spin-shop"><button class="btn ghost" type="button" data-spin-shop hidden>${icon("cart")}<span>${t("add_shop")}</span></button></div>
  <p class="muted small">${t("spin_hint")}</p>
</section>
${adSlot(L, "home")}
${withVideo.length ? `<section data-vstrip aria-labelledby="vstrip-title">
  <div class="sec-head"><h2 id="vstrip-title">${t("vstrip_h2")}</h2><a href="/video/">${t("all_n_videos", withVideo.length)}</a></div>
  <div class="vstrip">${withVideo.slice(0, 10).map(vcard).join("")}</div>
</section>` : ""}

<section>
  <div class="sec-head"><h2>${t("by_category")}</h2><a href="/danh-muc/">${t("all")}</a></div>
  <div class="cat-row">${catsShown.map((c) => catCard(c, recipes, lang)).join("")}</div>
</section>

<section data-saved-home hidden><div class="sec-head"><h2>${t("my_saved")}</h2><a href="/da-luu/">${t("see_all")}</a></div><div class="rgrid" data-saved-grid></div></section>
${quick.length ? `<section><div class="sec-head"><h2>${t("quick_h2")}</h2></div><div class="rgrid rrow">${quick.map((r) => recipeCard(r, false, lang)).join("")}</div></section>` : ""}

<section class="fridge-cta card">
  <div><h2>${t("fridge_h2")}</h2><p class="muted">${t("fridge_p")}</p></div>
  <a class="btn" href="/tim-kiem/?mode=nl">${t("fridge_btn")}</a>
</section>
${moi.length || !recipes.length ? `<section><div class="sec-head"><h2>${t("new_h2")}</h2><a href="/mon/">${t("all_n_dishes", recipes.length)}</a></div>${recipes.length ? grid(moi) : emptyState(t("no_recipes"), t("no_recipes_p"))}</section>` : ""}`,
  });

  // ----- Tất cả món, danh mục -----
  const filterBar = (rs) => `<div class="filters" data-filters>
  <div class="chips" data-f="k" aria-label="${t("difficulty")}"><button type="button" class="chip" data-v="" aria-pressed="true">${t("any_diff")}</button>${["de", "vua", "kho"].filter((k) => rs.some((r) => fold(r.do_kho) === k)).map((k) => `<button type="button" class="chip" data-v="${k}" aria-pressed="false">${t(`diff_${k}`)}</button>`).join("")}</div>
  <div class="chips" data-f="m" aria-label="${t("time")}"><button type="button" class="chip" data-v="" aria-pressed="true">${t("any_time")}</button>${[15, 30, 60].map((n) => `<button type="button" class="chip" data-v="${n}" aria-pressed="false">${t("le_min", n)}</button>`).join("")}</div>
  ${rs.some((r) => r.cal) ? `<div class="chips" data-f="cal" aria-label="${t("calories")}"><button type="button" class="chip" data-v="" aria-pressed="true">${t("any_cal")}</button><button type="button" class="chip" data-v="300" aria-pressed="false">≤ 300 kcal</button><button type="button" class="chip" data-v="500" aria-pressed="false">≤ 500 kcal</button></div>` : ""}
  <label class="sort"><span>${t("sort")}</span><select data-sort><option value="new">${t("sort_new")}</option><option value="fast">${t("sort_fast")}</option></select></label>
</div><p class="muted small" data-fcount></p>`;
  await page(L, {
    path: "/mon/", page: "list", title: t("all_recipes"), crumbs: [[t("all_dishes"), "/mon/"]],
    description: t("all_desc", recipes.length),
    body: `<h1>${t("all_recipes")}</h1>${recipes.length ? filterBar(recipes) + grid(recipes, true) : emptyState(t("no_recipes"))}`,
  });
  await page(L, {
    path: "/danh-muc/", title: t("cats_title"), crumbs: [[t("cats_h1"), "/danh-muc/"]],
    description: t("cats_desc", catsShown.map((c) => c.ten.toLowerCase()).join(", ")),
    body: `<h1>${t("cats_h1")}</h1><div class="cat-grid">${catsShown.map((c) => catCard(c, recipes, lang)).join("")}</div>`,
  });
  for (const c of cats) {
    const rs = recipes.filter((r) => r.danh_muc === c.slug);
    await page(L, {
      path: `/danh-muc/${c.slug}/`, page: "list", noindex: rs.length < MIN_MON_DANH_MUC, title: t("cat_title", c.ten), crumbs: [[t("cats_h1"), "/danh-muc/"], [c.ten, `/danh-muc/${c.slug}/`, !!c.lv.ten]],
      description: (!c.lv.mo_ta && c.mo_ta) || t("cat_desc", c.ten),
      body: `<header class="cat-head">${c.img ? `<img src="${esc(c.img)}" alt="" width="96" height="96">` : `<span class="cat-emoji big" aria-hidden="true">${esc(c.bieu_tuong || "🍽️")}</span>`}<div><h1${A(c.lv.ten)}>${esc(c.ten)}</h1><p class="lead"${A(c.lv.mo_ta)}>${esc(c.mo_ta)}</p>${c.img ? photoCredit(c.credit, "p") : ""}</div></header>
${rs.length ? filterBar(rs) + grid(rs, true) : emptyState(t("cat_empty"), t("cat_empty_p"))}`,
    });
  }

  // ----- Trang công thức -----
  for (const r of recipes) {
    const groups = groupMap(r.ings, "nhom");
    const ingHTML = [...groups].map(([g, gl]) => `${g ? `<h3${A(gl[0].lv.nhom)}>${esc(g)}</h3>` : ""}<ul class="ings">${gl.map((i) => {
      const q = num(i.so_luong, 0);
      // Cả dòng theo ngôn ngữ của tên nguyên liệu (để nhãn "Need to buy …" đọc đúng); đơn vị, ghi chú khác ngôn ngữ thì ghi lang riêng.
      const con = (l) => (l === i.lv.ten ? "" : ` lang="${l || lang}"`);
      return `<li${A(i.lv.ten)}><label><input type="checkbox" aria-label="${esc(t("need_buy", i.ten))}"><span><b class="qty" data-q="${q || ""}">${qtyText(q)}</b> <span class="unit"${con(i.lv.don_vi)}>${esc(i.don_vi)}</span> <strong>${esc(i.ten)}</strong>${i.ghi_chu ? ` <small${con(i.lv.ghi_chu)}>(${esc(i.ghi_chu)})</small>` : ""}</span></label></li>`;
    }).join("")}</ul>`).join("");
    const stepHTML = r.steps.map((s, i) => {
      const sec = num(s.giay_video, -1), tmin = num(s.hen_gio_phut, 0);
      const tools = [
        r.yt && sec >= 0 ? `<button class="mini" type="button" data-seek="${sec}">${icon("play")} ${t("see_part", mmss(sec))}</button>` : "",
        tmin ? `<button class="mini" type="button" data-timer="${tmin}" data-label="${esc(s.tieu_de || t("step_n", i + 1))}">${icon("timer")} ${t("timer_min", qtyText(tmin))}</button>` : "",
      ].join("");
      // "Dùng ở bước này": dò tên nguyên liệu (tiếng Việt) trong chữ gốc của bước; lượng có class qty để đổi theo khẩu phần.
      const uses = doNguyenLieu(s.vi.noi_dung, r.ings.map((x) => x.vi.ten)).map((k) => {
        const g = r.ings[k], q = num(g.so_luong, 0);
        return `<span${A(g.lv.ten)}>${esc(g.ten)}${q ? `&nbsp;<b class="qty" data-q="${q}">${qtyText(q)}</b>${g.don_vi ? `&nbsp;<span${A(g.lv.don_vi)}>${esc(g.don_vi)}</span>` : ""}` : ""}</span>`;
      }).join(" · ");
      return `<li data-step id="buoc-${i + 1}">${s.tieu_de ? `<h3${A(s.lv.tieu_de)}>${esc(s.tieu_de)}</h3>` : ""}<p${A(s.lv.noi_dung)}>${toDam(s.noi_dung)}</p>${uses ? `<div class="uses">${t("step_uses")}: ${uses}</div>` : ""}${s.img ? `<figure class="step-fig"><img class="step-img" src="${esc(s.img)}" alt="${esc(s.tieu_de || t("step_n", i + 1))}"${s.tieu_de ? A(s.lv.tieu_de) : ""} loading="lazy" width="800" height="600">${photoCredit(s.credit)}</figure>` : ""}${tools ? `<div class="step-tools">${tools}</div>` : ""}</li>`;
    }).join("");

    // Món ăn kèm: lấy từ cột an_kem, thiếu thì gợi ý theo mâm cơm (mặn ↔ canh, rau)
    let pair = r.anKem.map((s) => bySlug[s]).filter(Boolean);
    if (pair.length < 3) {
      const want = MAM.map(([s]) => s).filter((s) => s !== r.danh_muc);
      for (const s of want) { const x = recipes.find((y) => y.danh_muc === s && y.slug !== r.slug && !pair.includes(y)); if (x) pair.push(x); }
    }
    pair = pair.slice(0, 3);
    const related = recipes.filter((x) => x.danh_muc === r.danh_muc && x.slug !== r.slug && !pair.includes(x)).slice(0, 4);
    const watch = r.yt ? `https://www.youtube.com/${r.yt.shorts ? `shorts/${r.yt.id}` : `watch?v=${r.yt.id}`}` : "";
    const ld = {
      "@context": "https://schema.org", "@type": "Recipe", name: r.ten, description: r.tom_tat,
      ...(r.img ? { image: [r.img] } : {}),
      inLanguage: lang !== "vi" && r.dich ? lang : "vi", // món chưa dịch đủ thì nội dung vẫn là tiếng Việt
      author: { "@type": "Organization", name: site.site_name, url: site.site_url, logo: `${site.site_url}/assets/icons/icon-512.png` },
      ...(r.cap_nhat ? { datePublished: r.cap_nhat } : {}),
      ...(r.prep ? { prepTime: iso(r.prep) } : {}), ...(r.cook ? { cookTime: iso(r.cook) } : {}), ...(r.total ? { totalTime: iso(r.total) } : {}),
      recipeYield: t("recipe_yield", r.serv), recipeCategory: r.cat.ten, recipeCuisine: t("cuisine"), keywords: r.tagList.join(", "),
      ...(r.cal ? { nutrition: { "@type": "NutritionInformation", calories: `${r.cal} kcal` } } : {}),
      recipeIngredient: r.ings.map((i) => [qtyText(num(i.so_luong, 0)), i.don_vi, i.ten, i.ghi_chu ? `(${i.ghi_chu})` : ""].filter(Boolean).join(" ")),
      recipeInstructions: r.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, ...(s.tieu_de ? { name: s.tieu_de } : {}), text: s.noi_dung, url: `${abs(site, lang, `/mon/${r.slug}/`)}#buoc-${i + 1}`, ...(s.img ? { image: s.img } : {}) })),
      ...(r.yt ? { video: { "@type": "VideoObject", name: r.ten, description: r.tom_tat, thumbnailUrl: [ytThumb(r.yt.id)], embedUrl: `https://www.youtube-nocookie.com/embed/${r.yt.id}`, contentUrl: watch } } : {}),
    };
    const facts = [
      r.prep ? ["clock", t("min", r.prep), t("f_prep")] : null,
      r.cook ? ["flame", t("min", r.cook), t("f_cook")] : null,
      r.do_kho ? ["chef", diffText(t, fold(r.do_kho), r.do_kho), t("f_diff")] : null,
      r.cal ? ["leaf", `${r.cal} kcal`, t("f_cal")] : null,
      r.cost ? ["coin", `~${money(r.cost)}`, t("f_cost")] : null,
      ["people", t("servings", r.serv), t("f_serv")],
    ].filter(Boolean);
    const thumbMax = r.yt ? `https://i.ytimg.com/vi/${r.yt.id}/maxresdefault.jpg` : "";
    const videoBox = r.yt ? `<div class="player-box${r.yt.shorts ? " vertical" : ""}" data-player data-id="${esc(r.yt.id)}">
      <button class="lite-yt" type="button" data-play aria-label="${esc(t("play_guide", r.ten))}"><img src="${thumbMax}" onerror="this.onerror=null;this.src='${ytThumb(r.yt.id)}'" alt="" width="1280" height="720"><span class="play" aria-hidden="true"></span></button>
    </div>` : "";
    const media = r.yt || r.anh ? `<figure class="media">
  ${r.yt && r.anh ? `<div class="seg small" role="tablist" aria-label="${t("photo_or_video")}"><button type="button" role="tab" data-media="photo" aria-selected="true">${t("tab_photo")}</button><button type="button" role="tab" data-media="video" aria-selected="false">${icon("play")} ${t("video")}</button></div>` : ""}
  ${r.anh ? `<img class="hero-img" data-media-panel="photo" src="${esc(r.anh)}" alt="${esc(r.ten)}" width="1200" height="900">${photoCredit(r.anh_nguon, "figcaption", ' data-media-panel="photo"')}` : ""}
  ${r.yt ? `<div data-media-panel="video"${r.anh ? " hidden" : ""}>${videoBox}<figcaption>${videoCredit(r)}</figcaption></div>` : ""}
</figure>` : "";

    await page(L, {
      path: `/mon/${r.slug}/`, page: "recipe", title: r.ten, ogType: "article", ogImage: r.img, lastmod: r.cap_nhat,
      crumbs: [[r.cat.ten, `/danh-muc/${r.danh_muc}/`, !!r.cat.lv.ten], [r.ten, `/mon/${r.slug}/`, !!r.lv.ten]],
      description: t("recipe_desc", r.tom_tat, r.total, r.serv, !!r.yt),
      jsonld: [ld],
      body: `<article class="recipe" data-slug="${r.slug}" data-name="${esc(r.ten)}" data-base-serv="${r.serv}">
<p class="kicker"><a href="/danh-muc/${r.danh_muc}/"${A(r.cat.lv.ten)}>${esc(r.cat.ten)}</a></p>
<h1${A(r.lv.ten)}>${esc(r.ten)}</h1>
${lang === "vi" || r.dich ? "" : `<p class="muted small" data-not-translated>${t("not_translated")}</p>`}
<p class="lead"${A(r.lv.tom_tat)}>${esc(r.tom_tat)}</p>
<ul class="facts">${facts.map(([ic, b, s]) => `<li>${icon(ic)}<b>${esc(b)}</b><small>${esc(s)}</small></li>`).join("")}</ul>
<div class="actions">
  <button class="btn ghost" type="button" data-fav aria-pressed="false">${icon("heart")}<span>${t("save")}</span></button>
  <button class="btn" type="button" data-cook>${icon("chef")}<span>${t("start_cook")}</span></button>
</div>
<div class="r-cols"><div class="r-side">
${media}
<section class="ing-box card" aria-labelledby="ing-title">
  <div class="ing-head"><h2 id="ing-title">${t("ingredients")}</h2>
    <div class="stepper" role="group" aria-label="${t("n_people")}"><button type="button" data-serv-dec aria-label="${t("less_one")}">−</button><output data-serv-out>${r.serv}</output><span>${t("servings_unit")}</span><button type="button" data-serv-inc aria-label="${t("more_one")}">+</button></div>
  </div>
  <div class="serv-quick" role="group" aria-label="${t("quick_people")}">${[1, 2, 4, 6].map((n) => `<button type="button" class="chip" data-serv="${n}" aria-pressed="${n === r.serv}">${t("servings", n)}</button>`).join("")}</div>
  <p class="muted small">${t("ing_hint")}</p>
  ${ingHTML}
  <div class="row"><button class="btn ghost" type="button" data-copy-shop>${icon("copy")}<span>${t("copy_shop")}</span></button><button class="btn ghost" type="button" data-add-shop>${icon("cart")}<span>${t("add_shop")}</span></button></div>
</section>
</div><div class="r-main">
${adSlot(L, "mid")}
<section aria-labelledby="steps-title"><h2 id="steps-title">${t("steps")}</h2><ol class="steps">${stepHTML}</ol></section>
${r.meo ? `<aside class="tip"><h2>${icon("leaf")} ${t("tip")}</h2>${r.lv.meo ? vi(md(r.meo)) : md(r.meo)}</aside>` : ""}
</div></div>
${pair.length ? `<section><h2>${t("pair")}</h2>${grid(pair, false, true)}</section>` : ""}
${r.tagList.length ? `<p class="tags"${LV}>${r.tagList.map((x) => `<a class="tag" href="/tim-kiem/?tag=${encodeURIComponent(x)}">#${esc(x)}</a>`).join(" ")}</p>` : ""}
${r.cap_nhat ? `<p class="muted small">${t("updated", esc(r.cap_nhat))}</p>` : ""}
</article>
${site.turnstile_site_key ? `<section class="tq" data-tq data-mon="${r.slug}" data-key="${esc(site.turnstile_site_key)}" hidden aria-labelledby="tq-title">
  <div class="sec-head"><h2 id="tq-title">${t("tq_h2")}</h2></div>
  <p class="muted">${t("tq_p")}</p>
  <button class="btn" type="button" data-tq-mo>${icon("camera")}<span>${t("tq_btn")}</span></button>
  <div class="tq-ds" data-tq-ds aria-live="polite"></div>
</section>` : ""}
${adSlot(L, "bottom")}
${related.length ? `<section><h2 class="section-title">${t("more_in", r.cat.lv.ten ? vi(esc(r.cat.ten)) : esc(r.cat.ten))}</h2>${grid(related, false, true)}</section>` : ""}
<div class="cook" data-cook-view hidden role="dialog" aria-modal="true" aria-label="${t("cook_dlg")}">
  <div class="cook-top"><span data-cook-pos></span><button class="icon-btn" type="button" data-cook-close aria-label="${t("cook_exit")}">✕</button></div>
  <div class="cook-bar"><span data-cook-bar></span></div>
  <div class="cook-body"><h2 class="cook-title" data-cook-title${r.dich ? "" : LV}></h2><p class="cook-text" data-cook-text${r.dich ? "" : LV}></p><div class="uses" data-cook-uses hidden></div><img class="cook-img" data-cook-img alt="" hidden></div>
  <label class="cook-done"><input type="checkbox" data-cook-done> ${t("cook_done")}</label>
  <div class="cook-tools" data-cook-tools></div>
  <div class="cook-nav"><button class="btn ghost" type="button" data-cook-prev>${t("prev")}</button><button class="btn" type="button" data-cook-next>${t("next")}</button></div>
</div>`,
    });
  }

  // ----- Video, tìm kiếm, đi chợ, đã lưu -----
  const v0 = withVideo[0];
  const vdata = withVideo.map((r) => ({ id: r.yt.id, sh: r.yt.shorts ? 1 : 0, s: r.slug, t: r.ten, ...(r.lv.ten ? { l: r.lv.ten } : {}), k: r.kenh || "", w: watchUrl(r.yt) }));
  await page(L, {
    path: "/video/", page: "video", title: t("video_title"), noindex: !withVideo.length, crumbs: [[t("nav_video"), "/video/"]],
    description: t("video_desc"),
    body: `<h1>${t("video_h1")}</h1><p class="lead">${t("video_lead")}</p>${withVideo.length ? `
<section class="vstage" data-vstage data-videos='${esc(JSON.stringify(vdata))}' aria-label="${t("video_stage")}">
  <div class="player-box${v0.yt.shorts ? " vertical" : ""}" data-vbox>${liteYT(v0, "data-vstart")}</div>
  <p class="muted small" data-vpos aria-live="polite">${t("video_pos", 1, withVideo.length)}</p>
  <h2 data-vtitle${A(v0.lv.ten)}>${esc(v0.ten)}</h2>
  <p class="muted small" data-vcredit>${videoCredit(v0)}</p>
  <div class="vnav"><button class="btn ghost" type="button" data-vprev aria-label="${t("video_prev")}">${t("prev")}</button><a class="btn" data-vrecipe href="/mon/${v0.slug}/">${t("see_recipe")}</a><button class="btn ghost" type="button" data-vnext aria-label="${t("video_next")}">${t("next_short")}</button></div>
  <p class="muted small">${t("video_swipe")}</p>
</section>
<section><h2>${t("video_all")}</h2>${grid(withVideo)}</section>` : `<div class="empty"><p class="empty-title">${t("video_empty")}</p><p>${t("video_empty_p")}</p><p><a class="btn" href="/mon/">${t("see_all_recipes")}</a></p></div>`}`,
  });
  await page(L, {
    path: "/tim-kiem/", page: "search", title: t("search_title"), crumbs: [[t("nav_search"), "/tim-kiem/"]],
    description: t("search_desc"),
    body: `<h1>${t("search_h1")}</h1>
<div class="seg" role="tablist"><button type="button" role="tab" data-mode="ten" aria-selected="true">${t("by_name")}</button><button type="button" role="tab" data-mode="nl" aria-selected="false">${t("fridge_h2")}</button></div>
<div data-panel="ten">
  <form class="search" role="search" onsubmit="return false">${icon("search")}<label class="sr-only" for="q">${t("search_q")}</label><input id="q" name="q" type="search" autocomplete="off" placeholder="${t("search_q_ph")}"></form>
  <p class="muted small">${t("no_accent")}</p>
  ${themes.length ? `<div class="chips" data-tags><button type="button" class="chip" data-v="" aria-pressed="true">${t("any_theme")}</button>${themes.map((x) => `<button type="button" class="chip" data-v="${esc(fold(x))}" aria-pressed="false"${LV}>${esc(x)}</button>`).join("")}</div>` : ""}
</div>
<div data-panel="nl" hidden>
  <p class="muted">${t("fridge_have")}</p>
  <div class="chips wrap" data-fridge>${fridge.map((g) => `<button type="button" class="chip" data-v="${esc(fold(g))}" aria-pressed="false"${LV}>${esc(g)}</button>`).join("")}</div>
  <form class="search" onsubmit="return false">${icon("plus")}<label class="sr-only" for="add-ing">${t("add_ing")}</label><input id="add-ing" type="text" autocomplete="off" placeholder="${t("add_ing_ph")}"></form>
</div>
<p class="muted small" data-count></p>
<div class="rgrid" data-results></div>`,
  });
  await page(L, {
    path: "/di-cho/", page: "shop", title: t("shop_title"), crumbs: [[t("nav_shop"), "/di-cho/"]], noindex: true,
    description: t("shop_desc"),
    body: `<h1>${t("shop_h1")}</h1><p class="lead">${t("shop_lead")}</p><div data-shop></div>
<div class="row"><button class="btn ghost" type="button" data-shop-share>${icon("copy")}<span>${t("shop_share")}</span></button><button class="btn ghost" type="button" data-shop-clear>${t("shop_clear")}</button></div>`,
  });
  await page(L, {
    path: "/da-luu/", page: "saved", title: t("saved_title"), crumbs: [[t("nav_saved"), "/da-luu/"]], noindex: true,
    description: t("saved_desc"),
    body: `<h1>${t("saved_h1")}</h1><p class="lead">${t("saved_lead")}</p><div class="rgrid" data-saved-grid></div><div data-saved-empty hidden>${emptyState(t("saved_empty"), t("saved_empty_p"))}</div>`,
  });

  // ----- Trang thông tin -----
  const email = site.contact_email ? `<a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a>` : t("email_none");
  const name = vi(esc(site.site_name));
  const info = t("info", name, email);
  info[3][3] += `<p class="muted small">${t("info_updated", new Date().toISOString().slice(0, 10))}</p>`;
  if (site.turnstile_site_key) {
    info[2][3] += t("tq_privacy", email);
    info[3][3] = info[3][3].replace("</ol>", `${t("tq_terms")}</ol>`);
  }
  // Mô tả (meta) là chữ thường, không có thẻ HTML
  const plain = (x) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
  for (const [slug, title, description, html] of info) await page(L, { path: `/${slug}/`, title, description: plain(description), crumbs: [[title, `/${slug}/`]], body: `<article class="prose"><h1>${title}</h1>${html}</article>` });
  if (site.turnstile_site_key) await page(L, { path: "/quan-tri/", page: "admin", noindex: true, title: t("admin_title"), description: t("admin_desc"),
    body: `<h1>${t("admin_title")}</h1><div data-qt><form class="row" data-qt-dang-nhap><label class="grow"><span class="muted small">${t("admin_code")}</span><input type="password" data-qt-ma autocomplete="current-password" required></label><button class="btn" type="submit">${t("admin_open")}</button></form><div data-qt-ds></div></div>` });
  await page(L, { path: "/404", page: "404", title: t("nf_title"), noindex: true, description: t("nf_desc"), body: `<h1>${t("nf_title")}</h1>${t("nf_body")}` });
  } // hết vòng lặp ngôn ngữ

  // ----- sitemap, robots, ads.txt, service worker, manifest, đường dẫn gốc -----
  // Sitemap có cả 2 ngôn ngữ; mỗi URL kèm link bản ngôn ngữ kia (hreflang) để Google ghép cặp.
  const alts = (p) => LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(abs(site, l, p.alt))}"/>`).join("");
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages.map((p) => `<url><loc>${esc(site.site_url + p.path)}</loc>${alts(p)}${p.lastmod ? `<lastmod>${esc(p.lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
  await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.site_url}/sitemap.xml\n`);
  if (site.adsense_client) await write("ads.txt", `google.com, ${site.adsense_client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
  const sw = await fs.readFile(path.join(DIST, "sw.js"), "utf8");
  await write("sw.js", sw.replace("__BUILD_ID__", site.build_id).replace("__BASE__", site.base));
  const mf = JSON.parse(await fs.readFile(path.join(DIST, "manifest.webmanifest"), "utf8"));
  mf.name = site.site_name; mf.short_name = site.site_name; mf.description = site.tagline || mf.description;
  await write("manifest.webmanifest", JSON.stringify(mf, null, 2));
  if (site.base) await rebase(site.base);

  const src = SHEET_ID ? "Google Sheets" : process.env.DATA_DIR || "data/sample";
  console.log(`Xong: ${pages.length} trang → dist/  (nguồn: ${src}${site.base ? `, đường dẫn gốc ${site.base}` : ""})`);
  console.log(`Đã xuất bản: ${recipes.length} món (${recipes.filter((r) => r.yt).length} có video), ${cats.length} danh mục.`);
  for (const [s, n] of MAM) if (!recipes.some((r) => r.danh_muc === s)) report.warnings.push(`chưa có món nào trong danh mục "${s}" (${tr("vi")(n)}) – vòng quay mâm cơm sẽ thiếu ngăn này`);
  // Nhắc Biên tập bổ sung (không chặn build)
  const thieuAnh = recipes.filter((r) => !r.anh), thieuVideo = recipes.filter((r) => !r.yt);
  if (thieuAnh.length) console.log(`\nTHIẾU ẢNH (${thieuAnh.length}/${recipes.length} món, cột anh trống): ${thieuAnh.map((r) => r.slug + (r.yt ? " (đang dùng ảnh bìa video)" : "")).join(", ")}`);
  if (thieuVideo.length) console.log(`\nTHIẾU VIDEO (${thieuVideo.length}/${recipes.length} món, cột video trống): ${thieuVideo.map((r) => r.slug).join(", ")}`);
  if (report.warnings.length) console.log(`\nCẢNH BÁO:\n- ` + report.warnings.join("\n- "));
  if (report.skipped.length) console.log(`\nKHÔNG xuất bản ${report.skipped.length} dòng:\n- ` + report.skipped.join("\n- "));
}

function catCard(c, recipes, lang = "vi") {
  const n = recipes.filter((r) => r.danh_muc === c.slug).length;
  return `<a class="cat-card" href="/danh-muc/${c.slug}/">${c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy" width="120" height="120">` : `<span class="cat-emoji" aria-hidden="true">${esc(c.bieu_tuong || "🍽️")}</span>`}<strong${A(c.lv.ten)}>${esc(c.ten)}</strong><span>${tr(lang)("n_dishes", n)}</span></a>`;
}
/** Thuộc tính lang cho một ô nội dung: "vi" khi trang tiếng Anh đang hiện chữ tiếng Việt (chưa dịch). */
function A(l) { return l ? ` lang="${l}"` : ""; }
/** Món "đã dịch" khi có đủ tên, tóm tắt, mọi nguyên liệu (kể cả ghi chú) và mọi bước (kể cả tiêu đề bước). Mẹo, nhóm, đơn vị không bắt buộc. */
function daDich(r, lang) {
  const has = (o, k) => !String((o.vi || o)[k] || "").trim() || String(o[`${k}_${lang}`] || "").trim();
  return !!(String(r[`ten_${lang}`] || "").trim() && String(r[`tom_tat_${lang}`] || "").trim()
    && r.ings.every((i) => String(i[`ten_${lang}`] || "").trim() && has(i, "ghi_chu"))
    && r.steps.every((s) => String(s[`noi_dung_${lang}`] || "").trim() && has(s, "tieu_de")));
}
/** Đổi chữ hiển thị của món, nguyên liệu, bước, danh mục sang ngôn ngữ đang dựng; thiếu bản dịch thì giữ tiếng Việt và ghi o.lv[k] = "vi". */
function localize(lang, cats, recipes) {
  const t = tr(lang);
  const set = (o, k, en) => {
    const goc = o.vi[k];
    const v = lang === "vi" ? goc : String(en ?? o[`${k}_${lang}`] ?? "").trim();
    o.lv = o.lv || {};
    if (lang !== "vi" && !v && String(goc || "").trim()) { o[k] = goc; o.lv[k] = "vi"; } else { o[k] = lang === "vi" ? goc : v; o.lv[k] = ""; }
  };
  for (const c of cats) { set(c, "ten", t("cat_name", c.slug)); set(c, "mo_ta", ""); }
  for (const r of recipes) {
    for (const k of ["ten", "tom_tat", "meo"]) set(r, k);
    for (const i of r.ings) {
      for (const k of ["ten", "ghi_chu", "nhom"]) set(i, k);
      // Đơn vị: cột don_vi_en, không có thì tra từ điển (đơn vị đếm như "quả" dịch thành chữ trống), không có nữa thì giữ tiếng Việt.
      const u = lang === "vi" ? undefined : i[`don_vi_${lang}`] || t("unit", fold(i.vi.don_vi || ""));
      if (u === undefined) set(i, "don_vi", ""); else { i.don_vi = u; i.lv.don_vi = ""; }
    }
    for (const s of r.steps) for (const k of ["tieu_de", "noi_dung"]) set(s, k);
  }
}
function topIngredients(recipes, n) {
  const count = new Map();
  for (const r of recipes) for (const i of r.ings) {
    const k = fold(i.ten); if (PANTRY.includes(k)) continue;
    const e = count.get(k) || { name: i.ten, n: 0 }; e.n++; count.set(k, e);
  }
  return [...count.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "vi")).slice(0, n).map((e) => e.name);
}
function groupMap(arr, key) {
  const m = new Map();
  for (const x of arr) { const k = x[key] || ""; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return m;
}

/** Thêm đường dẫn gốc vào mọi link nội bộ ("/x" → "/ten-repo/x") trong HTML và manifest. */
async function rebase(base) {
  const walk = async (dir) => {
    const out = [];
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      out.push(...(e.isDirectory() ? await walk(p) : [p]));
    }
    return out;
  };
  for (const f of await walk(DIST)) {
    if (!f.endsWith(".html")) continue;
    const s = await fs.readFile(f, "utf8");
    await fs.writeFile(f, s.replace(/(\s(?:href|src|action)=")\/(?!\/)/g, `$1${base}/`).replace(/<html lang="(\w+)"/, `<html lang="$1" data-base="${base}"`));
  }
  const mf = path.join(DIST, "manifest.webmanifest");
  const m = JSON.parse(await fs.readFile(mf, "utf8"));
  m.start_url = base + m.start_url; m.scope = base + "/";
  m.icons = m.icons.map((i) => ({ ...i, src: base + i.src }));
  await fs.writeFile(mf, JSON.stringify(m, null, 2));
}

main().catch((e) => { console.error(process.env.DEBUG ? e : e.message || e); process.exit(1); });

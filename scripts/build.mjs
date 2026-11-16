#!/usr/bin/env node
// Dựng web "Hôm Nay Nấu Gì" tĩnh từ Google Sheets (hoặc CSV mẫu) ra thư mục dist/.
//   node scripts/build.mjs            → đọc Google Sheet nếu có SHEET_ID, không thì đọc data/sample
//   node scripts/build.mjs --sample   → luôn đọc data/sample
// Biến môi trường: SHEET_ID, DATA_DIR (thư mục CSV), BASE_PATH (chạy trong thư mục con), SITE_URL.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV, esc, fold, md, isSlug, imgUrl, parseYouTube } from "./lib.mjs";
import { layout, adSlot, emptyState, ytThumb, icon, recipeCard } from "./templates.mjs";

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
const MAM = [["mon-man", "Món mặn"], ["mon-canh", "Món canh"], ["mon-rau-xao", "Món rau / xào"]];
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
const money = (v) => `${Math.round(v).toLocaleString("vi-VN")}đ`;
export function qtyText(q) {
  if (!q) return "";
  const whole = Math.floor(q), frac = Math.round((q - whole) * 100) / 100;
  const F = { 0.25: "¼", 0.33: "⅓", 0.5: "½", 0.67: "⅔", 0.75: "¾" };
  if (frac && F[frac]) return `${whole || ""}${F[frac]}`;
  return String(Math.round(q * 10) / 10).replace(".", ",");
}

const pages = [];
async function write(rel, content) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}
async function page(site, p) {
  if (!p.noindex) pages.push({ path: p.path, lastmod: p.lastmod });
  await write(p.path === "/404" ? "404.html" : path.join(p.path, "index.html"), layout(site, p));
}

async function main() {
  const raw = {};
  for (const t of TABS) raw[t] = await loadTab(t);

  const site = { site_name: "Hôm Nay Nấu Gì", tagline: "", site_url: "" };
  for (const r of raw.settings) if (r.key) site[r.key] = r.value;
  site.base = (process.env.BASE_PATH || "").replace(/\/+$/, "");
  site.site_url = (process.env.SITE_URL || site.site_url || "https://example.com").replace(/\/+$/, "");
  site.build_id = Date.now().toString(36);

  // ----- Dữ liệu -----
  const cats = raw.categories.filter((c) => (isSlug(c.slug) ? true : (skip("categories", c, "slug không hợp lệ"), false))).sort(byOrder)
    .map((c) => ({ ...c, img: imgUrl(c.anh) }));
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
    const anh = imgUrl(r.anh);
    recipes.push({
      ...r, ings, steps: steps.map((s) => ({ ...s, img: imgUrl(s.anh) })), cat: catBySlug[r.danh_muc], yt, anh,
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
  const catCount = (c) => recipes.filter((r) => r.danh_muc === c.slug).length;
  const catsShown = cats.filter((c) => catCount(c) >= MIN_MON_DANH_MUC);
  site.has_video = recipes.some((r) => r.yt); // ẩn link "Tất cả video" ở chân trang khi chưa có video

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.cp(SRC, DIST, { recursive: true });

  // Chỉ mục cho vòng quay, tìm kiếm, tủ lạnh, đi chợ, đã lưu (phía trình duyệt)
  const index = recipes.map((r) => ({
    s: r.slug, t: r.ten, c: r.danh_muc, cn: r.cat.ten, e: r.cat.bieu_tuong || "", m: r.total, k: r.do_kho, img: r.img, v: r.yt ? 1 : 0,
    cal: r.cal || 0, b: r.bua, n: r.nguyen_lieu_chinh || "", d: r.cap_nhat || "", tg: r.tagList.map(fold),
    f: fold([r.ten, r.tom_tat, r.cat.ten, r.tags, r.nguyen_lieu_chinh].join(" ")),
    g: r.ings.filter((i) => !PANTRY.includes(fold(i.ten))).map((i) => fold(i.ten)),
    sv: r.serv, ig: r.ings.map((i) => [i.ten, num(i.so_luong, 0), i.don_vi]),
  }));
  await write("data/recipes.json", JSON.stringify(index));

  const grid = (rs, attrs = false) => `<div class="rgrid">${rs.map((r) => recipeCard(r, attrs)).join("")}</div>`;
  const mains = [...new Set(recipes.map((r) => r.nguyen_lieu_chinh).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const themes = list(site.chu_de).filter((t) => recipes.some((r) => r.tagList.map(fold).includes(fold(t))));
  const fridge = topIngredients(recipes, 24);

  // ----- Trang chủ -----
  const quick = recipes.filter((r) => r.total && r.total <= 20).slice(0, 6);
  await page(site, {
    path: "/", page: "home", title: site.site_name,
    description: `${site.tagline}. ${recipes.length} công thức có hướng dẫn từng bước, gợi ý mâm cơm 3 món mỗi ngày.`,
    jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: site.site_name, url: site.site_url,
      potentialAction: { "@type": "SearchAction", target: `${site.site_url}/tim-kiem/?q={q}`, "query-input": "required name=q" } }],
    body: `
<section class="hero">
  <h1>Hôm nay nấu gì?</h1>
  ${site.tagline ? `<p class="lead">${esc(site.tagline)}</p>` : ""}
  <form class="search big" action="/tim-kiem/" role="search">${icon("search")}<label class="sr-only" for="hq">Tìm món</label><input id="hq" name="q" type="search" placeholder="Tìm món, nguyên liệu: gà, cá, trứng…"></form>
  ${themes.length ? `<nav class="chips" aria-label="Chủ đề">${themes.map((t) => `<a class="chip" href="/tim-kiem/?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join("")}</nav>` : ""}
</section>

<section class="spin card" data-spin aria-labelledby="spin-title">
  <h2 id="spin-title">Quay món cho hôm nay</h2>
  <div class="seg" role="tablist" aria-label="Kiểu gợi ý">
    <button type="button" role="tab" data-spin-mode="one" aria-selected="false">Gợi ý 1 món</button>
    <button type="button" role="tab" data-spin-mode="mam" aria-selected="true">Mâm cơm 3 món</button>
  </div>
  <div class="spin-filters">
    <label><span>Bữa</span><select data-spin-f="b"><option value="">Mọi bữa</option><option value="sang">Bữa sáng</option><option value="trua">Bữa trưa</option><option value="toi">Bữa tối</option></select></label>
    <label><span>Thời gian</span><select data-spin-f="m"><option value="">Mọi thời gian</option><option value="15">Dưới 15 phút</option><option value="30">Dưới 30 phút</option><option value="45">Dưới 45 phút</option></select></label>
    <label><span>Nguyên liệu chính</span><select data-spin-f="n"><option value="">Mọi nguyên liệu</option>${mains.map((n) => `<option>${esc(n)}</option>`).join("")}</select></label>
  </div>
  <div class="row spin-go"><button class="btn big" type="button" data-spin-go>${icon("dice")}<span>Quay món</span></button><button class="btn ghost" type="button" data-spin-shop hidden>${icon("cart")}<span>Thêm cả mâm vào Đi chợ</span></button></div>
  <div class="spin-slots" data-spin-slots aria-live="polite" data-mam='${esc(JSON.stringify(MAM))}'></div>
  <p class="muted small">Bấm ổ khoá để giữ món đã ưng, lần quay sau chỉ đổi các món còn lại.</p>
</section>
${adSlot(site, "home")}

<section>
  <div class="sec-head"><h2>Chọn theo loại món</h2><a href="/danh-muc/">Tất cả</a></div>
  <div class="cat-row">${catsShown.map((c) => catCard(c, recipes)).join("")}</div>
</section>

<section class="fridge-cta card">
  <div><h2>Tủ lạnh có gì?</h2><p class="muted">Chọn nguyên liệu bạn đang có, web gợi ý món nấu được ngay.</p></div>
  <a class="btn" href="/tim-kiem/?mode=nl">Chọn nguyên liệu</a>
</section>

<section data-saved-home hidden><div class="sec-head"><h2>Sổ tay món ngon của tôi</h2><a href="/da-luu/">Xem hết</a></div><div class="rgrid" data-saved-grid></div></section>
${quick.length ? `<section><div class="sec-head"><h2>Nhanh gọn dưới 20 phút</h2></div>${grid(quick)}</section>` : ""}
<section><div class="sec-head"><h2>Công thức mới</h2><a href="/mon/">Tất cả ${recipes.length} món</a></div>${recipes.length ? grid(recipes.slice(0, 12)) : emptyState("Chưa có công thức", "Thêm công thức trong Google Sheets, web sẽ tự cập nhật.")}</section>`,
  });

  // ----- Tất cả món, danh mục -----
  const filterBar = (rs) => `<div class="filters" data-filters>
  <div class="chips" data-f="k" aria-label="Độ khó"><button type="button" class="chip" data-v="" aria-pressed="true">Mọi độ khó</button>${["Dễ", "Vừa", "Khó"].filter((k) => rs.some((r) => fold(r.do_kho) === fold(k))).map((k) => `<button type="button" class="chip" data-v="${fold(k)}" aria-pressed="false">${k}</button>`).join("")}</div>
  <div class="chips" data-f="m" aria-label="Thời gian"><button type="button" class="chip" data-v="" aria-pressed="true">Mọi thời gian</button><button type="button" class="chip" data-v="15" aria-pressed="false">≤ 15 phút</button><button type="button" class="chip" data-v="30" aria-pressed="false">≤ 30 phút</button><button type="button" class="chip" data-v="60" aria-pressed="false">≤ 60 phút</button></div>
  ${rs.some((r) => r.cal) ? `<div class="chips" data-f="cal" aria-label="Calo"><button type="button" class="chip" data-v="" aria-pressed="true">Mọi mức calo</button><button type="button" class="chip" data-v="300" aria-pressed="false">≤ 300 kcal</button><button type="button" class="chip" data-v="500" aria-pressed="false">≤ 500 kcal</button></div>` : ""}
  <label class="sort"><span>Sắp xếp</span><select data-sort><option value="new">Mới nhất</option><option value="fast">Nấu nhanh nhất</option></select></label>
</div><p class="muted small" data-fcount></p>`;
  await page(site, {
    path: "/mon/", page: "list", title: "Tất cả công thức", crumbs: [["Tất cả món", "/mon/"]],
    description: `Tất cả ${recipes.length} công thức nấu ăn, lọc theo độ khó, thời gian nấu.`,
    body: `<h1>Tất cả công thức</h1>${recipes.length ? filterBar(recipes) + grid(recipes, true) : emptyState("Chưa có công thức")}`,
  });
  await page(site, {
    path: "/danh-muc/", title: "Danh mục món ăn", crumbs: [["Danh mục", "/danh-muc/"]],
    description: `Chọn món theo loại: ${catsShown.map((c) => c.ten.toLowerCase()).join(", ")}.`,
    body: `<h1>Danh mục</h1><div class="cat-grid">${catsShown.map((c) => catCard(c, recipes)).join("")}</div>`,
  });
  for (const c of cats) {
    const rs = recipes.filter((r) => r.danh_muc === c.slug);
    await page(site, {
      path: `/danh-muc/${c.slug}/`, page: "list", noindex: rs.length < MIN_MON_DANH_MUC, title: `${c.ten} – công thức dễ làm`, crumbs: [["Danh mục", "/danh-muc/"], [c.ten, `/danh-muc/${c.slug}/`]],
      description: c.mo_ta || `Công thức ${c.ten} có video hướng dẫn.`,
      body: `<header class="cat-head">${c.img ? `<img src="${esc(c.img)}" alt="" width="96" height="96">` : `<span class="cat-emoji big" aria-hidden="true">${esc(c.bieu_tuong || "🍽️")}</span>`}<div><h1>${esc(c.ten)}</h1><p class="lead">${esc(c.mo_ta)}</p></div></header>
${rs.length ? filterBar(rs) + grid(rs, true) : emptyState("Danh mục đang được bổ sung", "Công thức mới sẽ sớm có ở đây.")}`,
    });
  }

  // ----- Trang công thức -----
  for (const r of recipes) {
    const groups = groupMap(r.ings, "nhom");
    const ingHTML = [...groups].map(([g, gl]) => `${g ? `<h3>${esc(g)}</h3>` : ""}<ul class="ings">${gl.map((i) => {
      const q = num(i.so_luong, 0);
      return `<li><label><input type="checkbox" aria-label="Cần mua ${esc(i.ten)}"><span><b class="qty" data-q="${q || ""}">${qtyText(q)}</b> <span class="unit">${esc(i.don_vi)}</span> <strong>${esc(i.ten)}</strong>${i.ghi_chu ? ` <small>(${esc(i.ghi_chu)})</small>` : ""}</span></label></li>`;
    }).join("")}</ul>`).join("");
    const stepHTML = r.steps.map((s, i) => {
      const sec = num(s.giay_video, -1), tmin = num(s.hen_gio_phut, 0);
      const tools = [
        r.yt && sec >= 0 ? `<button class="mini" type="button" data-seek="${sec}">${icon("play")} Xem đoạn ${mmss(sec)}</button>` : "",
        tmin ? `<button class="mini" type="button" data-timer="${tmin}" data-label="${esc(s.tieu_de || `Bước ${i + 1}`)}">${icon("timer")} Hẹn giờ ${qtyText(tmin)} phút</button>` : "",
      ].join("");
      return `<li data-step id="buoc-${i + 1}">${s.tieu_de ? `<h3>${esc(s.tieu_de)}</h3>` : ""}<p>${esc(s.noi_dung)}</p>${s.img ? `<img class="step-img" src="${esc(s.img)}" alt="${esc(s.tieu_de || `Bước ${i + 1}`)}" loading="lazy" width="800" height="600">` : ""}${tools ? `<div class="step-tools">${tools}</div>` : ""}</li>`;
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
      author: { "@type": "Organization", name: site.site_name, url: site.site_url, logo: `${site.site_url}/assets/icons/icon-512.png` },
      ...(r.cap_nhat ? { datePublished: r.cap_nhat } : {}),
      ...(r.prep ? { prepTime: iso(r.prep) } : {}), ...(r.cook ? { cookTime: iso(r.cook) } : {}), ...(r.total ? { totalTime: iso(r.total) } : {}),
      recipeYield: `${r.serv} người`, recipeCategory: r.cat.ten, recipeCuisine: "Việt Nam", keywords: r.tagList.join(", "),
      ...(r.cal ? { nutrition: { "@type": "NutritionInformation", calories: `${r.cal} kcal` } } : {}),
      recipeIngredient: r.ings.map((i) => [qtyText(num(i.so_luong, 0)), i.don_vi, i.ten, i.ghi_chu ? `(${i.ghi_chu})` : ""].filter(Boolean).join(" ")),
      recipeInstructions: r.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, ...(s.tieu_de ? { name: s.tieu_de } : {}), text: s.noi_dung, url: `${site.site_url}/mon/${r.slug}/#buoc-${i + 1}`, ...(s.img ? { image: s.img } : {}) })),
      ...(r.yt ? { video: { "@type": "VideoObject", name: r.ten, description: r.tom_tat, thumbnailUrl: [ytThumb(r.yt.id)], embedUrl: `https://www.youtube-nocookie.com/embed/${r.yt.id}`, contentUrl: watch } } : {}),
    };
    const facts = [
      r.prep ? ["clock", `${r.prep} phút`, "sơ chế"] : null,
      r.cook ? ["flame", `${r.cook} phút`, "nấu"] : null,
      r.do_kho ? ["chef", r.do_kho, "độ khó"] : null,
      r.cal ? ["leaf", `${r.cal} kcal`, "mỗi phần"] : null,
      r.cost ? ["coin", `~${money(r.cost)}`, "chi phí ước tính"] : null,
      ["people", `${r.serv} người`, "khẩu phần gốc"],
    ].filter(Boolean);
    const thumbMax = r.yt ? `https://i.ytimg.com/vi/${r.yt.id}/maxresdefault.jpg` : "";
    const videoBox = r.yt ? `<div class="player-box${r.yt.shorts ? " vertical" : ""}" data-player data-id="${esc(r.yt.id)}">
      <button class="lite-yt" type="button" data-play aria-label="Phát video hướng dẫn ${esc(r.ten)}"><img src="${thumbMax}" onerror="this.onerror=null;this.src='${ytThumb(r.yt.id)}'" alt="" width="1280" height="720"><span class="play" aria-hidden="true"></span></button>
    </div>` : "";
    // Ghi công ảnh có giấy phép: "Tên tác giả, CC BY-SA 4.0 https://link-trang-ảnh"
    const photoCredit = (t) => {
      const raw = String(t || "").trim();
      if (!raw) return "";
      const link = raw.match(/https?:\/\/\S+/);
      const txt = raw.replace(/https?:\/\/\S+/, "").replace(/[\s,;·–-]+$/, "").trim();
      return `<figcaption class="credit" data-media-panel="photo">Ảnh: ${esc(txt || "xem nguồn")}${link ? ` · <a href="${esc(link[0])}" rel="noopener" target="_blank">Nguồn ảnh</a>` : ""}</figcaption>`;
    };
    const media = r.yt || r.anh ? `<figure class="media">
  ${r.yt && r.anh ? `<div class="seg small" role="tablist" aria-label="Ảnh hoặc video"><button type="button" role="tab" data-media="photo" aria-selected="true">Ảnh món</button><button type="button" role="tab" data-media="video" aria-selected="false">${icon("play")} Video</button></div>` : ""}
  ${r.anh ? `<img class="hero-img" data-media-panel="photo" src="${esc(r.anh)}" alt="${esc(r.ten)}" width="1200" height="900">${photoCredit(r.anh_nguon)}` : ""}
  ${r.yt ? `<div data-media-panel="video"${r.anh ? " hidden" : ""}>${videoBox}<figcaption>Video: ${r.kenh ? `kênh <strong>${esc(r.kenh)}</strong>` : "YouTube"} · <a href="${watch}" rel="noopener" target="_blank">Xem trên YouTube</a></figcaption></div>` : ""}
</figure>` : "";

    await page(site, {
      path: `/mon/${r.slug}/`, page: "recipe", title: r.ten, ogType: "article", ogImage: r.img, lastmod: r.cap_nhat,
      crumbs: [[r.cat.ten, `/danh-muc/${r.danh_muc}/`], [r.ten, `/mon/${r.slug}/`]],
      description: `${r.tom_tat} ${r.total ? `${r.total} phút, ` : ""}${r.serv} người ăn${r.yt ? ", có video hướng dẫn" : ""}.`,
      jsonld: [ld],
      body: `<article class="recipe" data-slug="${r.slug}" data-name="${esc(r.ten)}" data-base-serv="${r.serv}">
<p class="kicker"><a href="/danh-muc/${r.danh_muc}/">${esc(r.cat.ten)}</a></p>
<h1>${esc(r.ten)}</h1>
<p class="lead">${esc(r.tom_tat)}</p>
<ul class="facts">${facts.map(([ic, b, s]) => `<li>${icon(ic)}<b>${esc(b)}</b><small>${esc(s)}</small></li>`).join("")}</ul>
<div class="actions">
  <button class="btn ghost" type="button" data-fav aria-pressed="false">${icon("heart")}<span>Lưu sổ tay</span></button>
  <button class="btn" type="button" data-cook>${icon("chef")}<span>Bắt đầu nấu</span></button>
</div>
${media}
<section class="ing-box card" aria-labelledby="ing-title">
  <div class="ing-head"><h2 id="ing-title">Nguyên liệu</h2>
    <div class="stepper" role="group" aria-label="Số người ăn"><button type="button" data-serv-dec aria-label="Bớt một người">−</button><output data-serv-out>${r.serv}</output><span>người</span><button type="button" data-serv-inc aria-label="Thêm một người">+</button></div>
  </div>
  <div class="serv-quick" role="group" aria-label="Chọn nhanh số người">${[1, 2, 4, 6].map((n) => `<button type="button" class="chip" data-serv="${n}" aria-pressed="${n === r.serv}">${n} người</button>`).join("")}</div>
  <p class="muted small">Tích những món cần mua, rồi chép hoặc thêm vào danh sách đi chợ.</p>
  ${ingHTML}
  <div class="row"><button class="btn ghost" type="button" data-copy-shop>${icon("copy")}<span>Chép danh sách đi chợ</span></button><button class="btn ghost" type="button" data-add-shop>${icon("cart")}<span>Thêm vào Đi chợ</span></button></div>
</section>
${adSlot(site, "mid")}
<section aria-labelledby="steps-title"><h2 id="steps-title">Cách làm</h2><ol class="steps">${stepHTML}</ol></section>
${r.meo ? `<aside class="tip"><h2>${icon("leaf")} Bí quyết nấu ngon</h2>${md(r.meo)}</aside>` : ""}
${pair.length ? `<section><h2>Ăn kèm hợp vị</h2>${grid(pair)}</section>` : ""}
${r.tagList.length ? `<p class="tags">${r.tagList.map((t) => `<a class="tag" href="/tim-kiem/?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join(" ")}</p>` : ""}
${r.cap_nhat ? `<p class="muted small">Cập nhật: ${esc(r.cap_nhat)}</p>` : ""}
</article>
${adSlot(site, "bottom")}
${related.length ? `<section><h2 class="section-title">Thêm món trong ${esc(r.cat.ten)}</h2>${grid(related)}</section>` : ""}
<div class="cook" data-cook-view hidden role="dialog" aria-modal="true" aria-label="Chế độ đang nấu">
  <div class="cook-top"><span data-cook-pos></span><button class="icon-btn" type="button" data-cook-close aria-label="Thoát chế độ nấu">✕</button></div>
  <div class="cook-bar"><span data-cook-bar></span></div>
  <div class="cook-body"><h2 class="cook-title" data-cook-title></h2><p class="cook-text" data-cook-text></p><img class="cook-img" data-cook-img alt="" hidden></div>
  <label class="cook-done"><input type="checkbox" data-cook-done> Đã xong bước này</label>
  <div class="cook-tools" data-cook-tools></div>
  <div class="cook-nav"><button class="btn ghost" type="button" data-cook-prev>← Trước</button><button class="btn" type="button" data-cook-next>Tiếp →</button></div>
</div>`,
    });
  }

  // ----- Video, tìm kiếm, đi chợ, đã lưu -----
  const withVideo = recipes.filter((r) => r.yt);
  await page(site, {
    path: "/video/", title: "Video hướng dẫn nấu ăn", noindex: !withVideo.length, crumbs: [["Video", "/video/"]],
    description: "Video hướng dẫn nấu ăn, mỗi video đi kèm công thức chi tiết.",
    body: `<h1>Video hướng dẫn</h1><p class="lead">Mỗi video có công thức chi tiết đi kèm: nguyên liệu, từng bước, hẹn giờ.</p>${withVideo.length ? grid(withVideo) : emptyState("Video đang được bổ sung", "Dán link YouTube hoặc YouTube Shorts vào cột video trong Google Sheets.")}`,
  });
  await page(site, {
    path: "/tim-kiem/", page: "search", title: "Tìm món và Tủ lạnh có gì", crumbs: [["Tìm món", "/tim-kiem/"]],
    description: "Tìm công thức theo tên món, chủ đề, hoặc chọn nguyên liệu đang có trong tủ lạnh để biết nấu được món gì.",
    body: `<h1>Tìm món</h1>
<div class="seg" role="tablist"><button type="button" role="tab" data-mode="ten" aria-selected="true">Theo tên món</button><button type="button" role="tab" data-mode="nl" aria-selected="false">Tủ lạnh có gì?</button></div>
<div data-panel="ten">
  <form class="search" role="search" onsubmit="return false">${icon("search")}<label class="sr-only" for="q">Tìm kiếm</label><input id="q" name="q" type="search" autocomplete="off" placeholder="Ví dụ: trứng, canh, sinh tố…"></form>
  <p class="muted small">Gõ không dấu vẫn tìm được.</p>
  ${themes.length ? `<div class="chips" data-tags><button type="button" class="chip" data-v="" aria-pressed="true">Mọi chủ đề</button>${themes.map((t) => `<button type="button" class="chip" data-v="${esc(fold(t))}" aria-pressed="false">${esc(t)}</button>`).join("")}</div>` : ""}
</div>
<div data-panel="nl" hidden>
  <p class="muted">Chọn nguyên liệu bạn đang có. Gia vị cơ bản (muối, đường, nước mắm, dầu ăn…) được tính là có sẵn.</p>
  <div class="chips wrap" data-fridge>${fridge.map((g) => `<button type="button" class="chip" data-v="${esc(fold(g))}" aria-pressed="false">${esc(g)}</button>`).join("")}</div>
  <form class="search" onsubmit="return false">${icon("plus")}<label class="sr-only" for="add-ing">Thêm nguyên liệu khác</label><input id="add-ing" type="text" autocomplete="off" placeholder="Nguyên liệu khác, gõ rồi Enter"></form>
</div>
<p class="muted small" data-count></p>
<div class="rgrid" data-results></div>`,
  });
  await page(site, {
    path: "/di-cho/", page: "shop", title: "Danh sách đi chợ", crumbs: [["Đi chợ", "/di-cho/"]], noindex: true,
    description: "Danh sách nguyên liệu cần mua, gom từ các món bạn chọn.",
    body: `<h1>Đi chợ</h1><p class="lead">Nguyên liệu gom từ các món bạn đã thêm. Tích khi đã mua.</p><div data-shop></div>
<div class="row"><button class="btn ghost" type="button" data-shop-share>${icon("copy")}<span>Chép / chia sẻ qua Zalo</span></button><button class="btn ghost" type="button" data-shop-clear>Xoá món đã mua</button></div>`,
  });
  await page(site, {
    path: "/da-luu/", page: "saved", title: "Sổ tay món ngon của tôi", crumbs: [["Sổ tay", "/da-luu/"]], noindex: true,
    description: "Các công thức bạn đã lưu trên máy này, không cần đăng nhập.",
    body: `<h1>Sổ tay món ngon</h1><p class="lead">Món bạn lưu nằm ngay trên máy này, không cần tài khoản.</p><div class="rgrid" data-saved-grid></div><div data-saved-empty hidden>${emptyState("Sổ tay còn trống", "Bấm “Lưu vào sổ tay” ở trang công thức để xem lại nhanh ở đây.")}</div>`,
  });

  // ----- Trang thông tin -----
  const email = site.contact_email ? `<a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a>` : "đang cập nhật";
  const name = esc(site.site_name);
  const info = [
    ["gioi-thieu", "Giới thiệu", `${site.site_name} giúp bạn trả lời câu hỏi mỗi ngày: hôm nay nấu gì?`,
      `<p>${name} giúp bạn trả lời câu hỏi quen thuộc mỗi ngày: hôm nay nấu gì? Web gợi ý món và mâm cơm 3 món, có công thức rõ ràng, nguyên liệu tính theo số người ăn, hẹn giờ từng bước và video hướng dẫn từ các kênh YouTube được ghi tên.</p><p>Công thức do chúng tôi tự viết. Nếu bạn thấy chỗ chưa đúng, hãy <a href="/lien-he/">báo cho chúng tôi</a>.</p>`],
    ["ban-quyen-video", "Bản quyền video", "Cách chúng tôi dùng video YouTube và cách yêu cầu gỡ.",
      `<p>Video trên web được nhúng bằng trình phát chính thức của YouTube, không tải về hay sao chép. Lượt xem được tính cho kênh gốc, mỗi video đều ghi tên kênh và đường dẫn xem trên YouTube.</p><p>Chủ kênh có thể tắt chức năng nhúng trên YouTube bất cứ lúc nào. Nếu bạn là chủ kênh và muốn gỡ video, hãy liên hệ: ${email}. Chúng tôi gỡ trong vòng 48 giờ.</p><p>Công thức (nguyên liệu, các bước) do chúng tôi tự viết, không sao chép phần mô tả của video.</p>`],
    ["chinh-sach-bao-mat", "Chính sách bảo mật", "Cách web xử lý dữ liệu của bạn.",
      `<h2>Dữ liệu trên máy</h2><p>Sổ tay món ngon và danh sách đi chợ chỉ lưu trong trình duyệt trên máy của bạn. Chúng tôi không có máy chủ lưu những dữ liệu này và không yêu cầu đăng nhập.</p><h2>Thống kê và quảng cáo</h2><p>Web có thể dùng công cụ thống kê lượt truy cập và hiển thị quảng cáo của Google. Các dịch vụ này có thể dùng cookie theo chính sách của họ, xem tại <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">policies.google.com</a>.</p><h2>Video</h2><p>Video được nhúng từ YouTube ở chế độ hạn chế cookie và chỉ tải khi bạn bấm xem.</p>`],
    ["dieu-khoan", "Điều khoản sử dụng", `Điều khoản khi sử dụng ${site.site_name}.`,
      `<ol><li>Nội dung công thức thuộc ${name}. Bạn được dùng cho mục đích cá nhân; khi chia sẻ lại vui lòng dẫn link về trang gốc.</li><li>Video thuộc bản quyền của các kênh YouTube được ghi tên.</li><li>Lượng calo, chi phí và thời gian (nếu có) chỉ là ước tính, có thể khác tuỳ nguyên liệu và cách nấu.</li><li>Nếu bạn có bệnh lý hoặc dị ứng thực phẩm, hãy kiểm tra kỹ nguyên liệu trước khi nấu.</li><li>Chúng tôi có thể cập nhật điều khoản này; ngày cập nhật ghi ở cuối trang.</li></ol><p class="muted small">Cập nhật: ${new Date().toISOString().slice(0, 10)}</p>`],
    ["lien-he", "Liên hệ", `Liên hệ ${site.site_name}.`, `<p>Góp ý công thức, báo lỗi hoặc hợp tác: ${email}.</p>`],
  ];
  for (const [slug, title, description, html] of info) await page(site, { path: `/${slug}/`, title, description, crumbs: [[title, `/${slug}/`]], body: `<article class="prose"><h1>${title}</h1>${html}</article>` });
  await page(site, { path: "/404", title: "Không tìm thấy trang", noindex: true, description: "Trang không tồn tại.", body: `<h1>Không tìm thấy trang</h1><p>Trang bạn tìm không tồn tại. <a href="/">Về trang chủ</a> hoặc <a href="/tim-kiem/">tìm món</a>.</p>` });

  // ----- sitemap, robots, ads.txt, service worker, manifest, đường dẫn gốc -----
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${esc(site.site_url + p.path)}</loc>${p.lastmod ? `<lastmod>${esc(p.lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
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
  console.log(`Đã xuất bản: ${recipes.length} món (${withVideo.length} có video), ${cats.length} danh mục.`);
  for (const [s, n] of MAM) if (!recipes.some((r) => r.danh_muc === s)) report.warnings.push(`chưa có món nào trong danh mục "${s}" (${n}) – vòng quay mâm cơm sẽ thiếu ngăn này`);
  if (report.warnings.length) console.log(`\nCẢNH BÁO:\n- ` + report.warnings.join("\n- "));
  if (report.skipped.length) console.log(`\nKHÔNG xuất bản ${report.skipped.length} dòng:\n- ` + report.skipped.join("\n- "));
}

function catCard(c, recipes) {
  const n = recipes.filter((r) => r.danh_muc === c.slug).length;
  return `<a class="cat-card" href="/danh-muc/${c.slug}/">${c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy" width="120" height="120">` : `<span class="cat-emoji" aria-hidden="true">${esc(c.bieu_tuong || "🍽️")}</span>`}<strong>${esc(c.ten)}</strong><span>${n} món</span></a>`;
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
    await fs.writeFile(f, s.replace(/(\s(?:href|src|action)=")\/(?!\/)/g, `$1${base}/`).replace('<html lang="vi">', `<html lang="vi" data-base="${base}">`));
  }
  const mf = path.join(DIST, "manifest.webmanifest");
  const m = JSON.parse(await fs.readFile(mf, "utf8"));
  m.start_url = base + m.start_url; m.scope = base + "/";
  m.icons = m.icons.map((i) => ({ ...i, src: base + i.src }));
  await fs.writeFile(mf, JSON.stringify(m, null, 2));
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });

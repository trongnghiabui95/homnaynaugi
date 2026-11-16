#!/usr/bin/env node
// Dựng web công thức nấu ăn tĩnh từ Google Sheets (hoặc CSV mẫu) ra thư mục dist/.
//   node scripts/build.mjs            → đọc Google Sheet nếu có SHEET_ID, không thì đọc data/sample
//   node scripts/build.mjs --sample   → luôn đọc data/sample
// Biến môi trường: SHEET_ID, DATA_DIR (thư mục CSV), BASE_PATH (chạy trong thư mục con), SITE_URL.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV, esc, fold, md, isSlug } from "./lib.mjs";
import { layout, adSlot, emptyState, ytThumb, icon } from "./templates.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const TABS = ["settings", "categories", "recipes", "ingredients", "steps"];
const report = { skipped: [], warnings: [], errors: [] };
const skip = (tab, r, why) => report.skipped.push(`${tab} dòng ${r._row}${r.slug ? ` (${r.slug})` : ""}: ${why}`);
const sampleOnly = process.argv.includes("--sample");

async function loadTab(tab) {
  const sheetId = sampleOnly ? "" : process.env.SHEET_ID || "";
  if (sheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được tab "${tab}" từ Google Sheets (HTTP ${res.status}). Kiểm tra quyền chia sẻ và tên tab.`);
    return parseCSV(await res.text());
  }
  const file = path.join(process.env.DATA_DIR || path.join(ROOT, "data", "sample"), `${tab}.csv`);
  try { return parseCSV(await fs.readFile(file, "utf8")); } catch { return []; }
}

const num = (v, d = 0) => (v === "" || v == null || isNaN(Number(String(v).replace(",", "."))) ? d : Number(String(v).replace(",", ".")));
const byOrder = (a, b) => num(a.thu_tu, 999) - num(b.thu_tu, 999);
const iso = (m) => `PT${Math.round(m)}M`;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
/** 0.5 → "½", 1.5 → "1½", 0.25 → "¼" */
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

  const site = { site_name: "Bếp Nhà Mình", tagline: "", site_url: "" };
  for (const r of raw.settings) if (r.key) site[r.key] = r.value;
  site.base = (process.env.BASE_PATH || "").replace(/\/+$/, "");
  site.site_url = (process.env.SITE_URL || site.site_url || "https://example.com").replace(/\/+$/, "");
  site.build_id = Date.now().toString(36);

  // ----- Dữ liệu -----
  const cats = raw.categories.filter((c) => (isSlug(c.slug) ? true : (skip("categories", c, "slug không hợp lệ"), false))).sort(byOrder);
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
    if (r.youtube_id && !/^[\w-]{11}$/.test(r.youtube_id)) { report.warnings.push(`recipes ${r.slug}: youtube_id "${r.youtube_id}" không hợp lệ, bỏ video`); r.youtube_id = ""; }
    recipes.push({
      ...r, ings, steps, cat: catBySlug[r.danh_muc],
      serv: num(r.khau_phan, 2) || 2, prep: num(r.phut_chuan_bi), cook: num(r.phut_nau),
      total: num(r.phut_chuan_bi) + num(r.phut_nau),
      tagList: (r.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      img: r.anh || (r.youtube_id ? ytThumb(r.youtube_id) : ""),
    });
  }
  for (const [tab, list, key] of [["categories", cats, "slug"], ["recipes", recipes, "slug"]]) {
    const seen = new Set();
    for (const r of list) { if (seen.has(r[key])) report.errors.push(`${tab}: trùng ${key} "${r[key]}" (dòng ${r._row})`); seen.add(r[key]); }
  }
  if (report.errors.length) { console.error("LỖI:\n- " + report.errors.join("\n- ")); process.exit(1); }
  recipes.sort((a, b) => (b.cap_nhat || "").localeCompare(a.cap_nhat || "") || a.ten.localeCompare(b.ten, "vi"));

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.cp(SRC, DIST, { recursive: true });

  // Chỉ mục cho tìm kiếm, đi chợ, đã lưu (phía trình duyệt)
  const index = recipes.map((r) => ({
    s: r.slug, t: r.ten, d: r.tom_tat, c: r.danh_muc, cn: r.cat.ten, m: r.total, k: r.do_kho, img: r.img, v: r.youtube_id ? 1 : 0,
    f: fold([r.ten, r.tom_tat, r.cat.ten, r.tags].join(" ")),
    g: r.ings.map((i) => fold(i.ten)),
  }));
  await write("data/recipes.json", JSON.stringify(index));

  const card = (r) => `<a class="rcard" href="/mon/${r.slug}/">
  <div class="rcard-img">${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" width="480" height="360">` : `<span class="rcard-emoji" aria-hidden="true">${esc(r.cat.bieu_tuong || "🍽️")}</span>`}${r.youtube_id ? `<span class="has-video">${icon("play")} Video</span>` : ""}</div>
  <div class="rcard-body"><strong>${esc(r.ten)}</strong><span class="meta">${icon("clock")} ${r.total} phút · ${esc(r.do_kho || "")}</span></div>
</a>`;
  const grid = (list) => `<div class="rgrid">${list.map(card).join("")}</div>`;

  // ----- Trang chủ -----
  const quick = recipes.filter((r) => r.total && r.total <= 30).slice(0, 6);
  await page(site, {
    path: "/", page: "home", title: site.site_name,
    description: `${site.tagline}. ${recipes.length} công thức món Việt, món Á, món Âu, bánh và đồ uống, kèm video hướng dẫn.`,
    jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: site.site_name, url: site.site_url,
      potentialAction: { "@type": "SearchAction", target: `${site.site_url}/tim-kiem/?q={q}`, "query-input": "required name=q" } }],
    body: `
<section class="hero">
  <h1>${esc(site.tagline || site.site_name)}</h1>
  <form class="search big" action="/tim-kiem/" role="search">${icon("search")}<label class="sr-only" for="hq">Tìm món</label><input id="hq" name="q" type="search" placeholder="Hôm nay nấu gì? Ví dụ: trứng, gà, chay…"></form>
  <a class="by-ing" href="/tim-kiem/?mode=nl">Tủ lạnh còn gì? Tìm món theo nguyên liệu →</a>
</section>
<nav class="chips" aria-label="Danh mục">${cats.map((c) => `<a class="chip" href="/danh-muc/${c.slug}/"><span aria-hidden="true">${esc(c.bieu_tuong || "")}</span> ${esc(c.ten)}</a>`).join("")}</nav>
<section data-saved-home hidden><h2 class="section-title">Món bạn đã lưu</h2><div class="rgrid" data-saved-grid></div></section>
${quick.length ? `<section><h2 class="section-title">Nhanh dưới 30 phút</h2>${grid(quick)}</section>` : ""}
<section><h2 class="section-title">Mới thêm</h2>${recipes.length ? grid(recipes.slice(0, 12)) : emptyState("Chưa có công thức", "Thêm công thức trong Google Sheets, web sẽ tự cập nhật.")}</section>
${recipes.length > 12 ? `<p class="center"><a class="btn ghost" href="/mon/">Xem tất cả ${recipes.length} món</a></p>` : ""}`,
  });

  // ----- Tất cả món, danh mục -----
  await page(site, {
    path: "/mon/", title: "Tất cả công thức", crumbs: [["Tất cả món", "/mon/"]],
    description: `Tất cả ${recipes.length} công thức nấu ăn, sắp xếp theo món mới thêm.`,
    body: `<h1>Tất cả công thức</h1>${recipes.length ? grid(recipes) : emptyState("Chưa có công thức")}`,
  });
  await page(site, {
    path: "/danh-muc/", title: "Danh mục món ăn", crumbs: [["Danh mục", "/danh-muc/"]],
    description: "Tìm công thức theo danh mục: món Việt, món Á, món Âu, bánh ngọt, đồ uống, món chay.",
    body: `<h1>Danh mục</h1><div class="cat-grid">${cats.map((c) => {
      const n = recipes.filter((r) => r.danh_muc === c.slug).length;
      return `<a class="cat-card" href="/danh-muc/${c.slug}/"><span class="cat-emoji" aria-hidden="true">${esc(c.bieu_tuong || "🍽️")}</span><strong>${esc(c.ten)}</strong><span>${n} món</span></a>`;
    }).join("")}</div>`,
  });
  for (const c of cats) {
    const list = recipes.filter((r) => r.danh_muc === c.slug);
    await page(site, {
      path: `/danh-muc/${c.slug}/`, title: `Công thức ${c.ten}`, crumbs: [["Danh mục", "/danh-muc/"], [c.ten, `/danh-muc/${c.slug}/`]],
      description: c.mo_ta || `Công thức ${c.ten} có video hướng dẫn.`,
      body: `<h1>${esc(c.bieu_tuong || "")} ${esc(c.ten)}</h1><p class="lead">${esc(c.mo_ta)}</p>${list.length ? grid(list) : emptyState("Danh mục đang được bổ sung", "Công thức mới sẽ sớm có ở đây.")}`,
    });
  }

  // ----- Trang công thức -----
  for (const r of recipes) {
    const groups = groupMap(r.ings, "nhom");
    const ingHTML = [...groups].map(([g, list]) => `${g ? `<h3>${esc(g)}</h3>` : ""}<ul class="ings">${list.map((i, j) => {
      const q = num(i.so_luong, 0);
      return `<li><label><input type="checkbox"><span><b class="qty" data-q="${q || ""}">${qtyText(q)}</b> ${esc(i.don_vi)} <strong>${esc(i.ten)}</strong>${i.ghi_chu ? ` <small>(${esc(i.ghi_chu)})</small>` : ""}</span></label></li>`;
    }).join("")}</ul>`).join("");
    const stepHTML = r.steps.map((s, i) => {
      const sec = num(s.giay_video, -1), tmin = num(s.hen_gio_phut, 0);
      const tools = [
        r.youtube_id && sec >= 0 ? `<button class="mini" type="button" data-seek="${sec}">${icon("play")} Xem đoạn ${mmss(sec)}</button>` : "",
        tmin ? `<button class="mini" type="button" data-timer="${tmin}" data-label="Bước ${i + 1}">${icon("timer")} Hẹn giờ ${qtyText(tmin)} phút</button>` : "",
      ].join("");
      return `<li data-step><p>${esc(s.noi_dung)}</p>${tools ? `<div class="step-tools">${tools}</div>` : ""}</li>`;
    }).join("");
    const related = recipes.filter((x) => x.danh_muc === r.danh_muc && x.slug !== r.slug).slice(0, 4);
    const watch = r.youtube_id ? `https://www.youtube.com/watch?v=${r.youtube_id}` : "";
    const ld = {
      "@context": "https://schema.org", "@type": "Recipe", name: r.ten, description: r.tom_tat,
      ...(r.anh ? { image: [r.anh] } : {}),
      author: { "@type": "Organization", name: site.site_name },
      ...(r.cap_nhat ? { datePublished: r.cap_nhat } : {}),
      ...(r.prep ? { prepTime: iso(r.prep) } : {}), ...(r.cook ? { cookTime: iso(r.cook) } : {}), ...(r.total ? { totalTime: iso(r.total) } : {}),
      recipeYield: `${r.serv} người`, recipeCategory: r.cat.ten, recipeCuisine: r.cat.ten, keywords: r.tagList.join(", "),
      recipeIngredient: r.ings.map((i) => [qtyText(num(i.so_luong, 0)), i.don_vi, i.ten, i.ghi_chu ? `(${i.ghi_chu})` : ""].filter(Boolean).join(" ")),
      recipeInstructions: r.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s.noi_dung, url: `${site.site_url}/mon/${r.slug}/#buoc-${i + 1}` })),
      ...(r.youtube_id ? { video: { "@type": "VideoObject", name: r.ten, description: r.tom_tat, thumbnailUrl: [ytThumb(r.youtube_id)], embedUrl: `https://www.youtube-nocookie.com/embed/${r.youtube_id}`, contentUrl: watch } } : {}),
    };
    await page(site, {
      path: `/mon/${r.slug}/`, page: "recipe", title: r.ten, ogType: "article", ogImage: r.img, lastmod: r.cap_nhat,
      crumbs: [[r.cat.ten, `/danh-muc/${r.danh_muc}/`], [r.ten, `/mon/${r.slug}/`]],
      description: `${r.tom_tat} ${r.total ? `${r.total} phút, ` : ""}${r.serv} người ăn${r.youtube_id ? ", có video hướng dẫn" : ""}.`,
      jsonld: [ld],
      body: `<article class="recipe" data-slug="${r.slug}" data-name="${esc(r.ten)}" data-serv="${r.serv}">
<h1>${esc(r.ten)}</h1>
<p class="lead">${esc(r.tom_tat)}</p>
<ul class="facts">
  ${r.total ? `<li>${icon("clock")}<span><b>${r.total} phút</b>${r.prep && r.cook ? `<small>sơ chế ${r.prep} + nấu ${r.cook}</small>` : ""}</span></li>` : ""}
  <li>${icon("people")}<span><b>${r.serv} người</b><small>khẩu phần gốc</small></span></li>
  ${r.do_kho ? `<li>${icon("chef")}<span><b>${esc(r.do_kho)}</b><small>độ khó</small></span></li>` : ""}
</ul>
<div class="actions">
  <button class="btn ghost" type="button" data-fav>${icon("heart")}<span>Lưu món</span></button>
  <button class="btn ghost" type="button" data-cook>${icon("chef")}<span>Chế độ nấu</span></button>
</div>
${r.youtube_id ? `<figure class="player">
  <div class="player-box" data-player data-id="${esc(r.youtube_id)}">
    <button class="lite-yt" type="button" data-play aria-label="Phát video hướng dẫn ${esc(r.ten)}"><img src="${ytThumb(r.youtube_id)}" alt="" width="480" height="360"><span class="play" aria-hidden="true"></span></button>
  </div>
  <figcaption>Video: ${r.kenh ? `kênh <strong>${esc(r.kenh)}</strong>` : "YouTube"} · <a href="${watch}" rel="noopener" target="_blank">Xem trên YouTube</a></figcaption>
</figure>` : r.anh ? `<img class="hero-img" src="${esc(r.anh)}" alt="${esc(r.ten)}" width="800" height="600">` : ""}
<section class="ing-box card">
  <div class="ing-head"><h2>Nguyên liệu</h2>
    <div class="stepper" role="group" aria-label="Số người ăn"><button type="button" data-serv-dec aria-label="Bớt một người">−</button><output data-serv-out>${r.serv}</output><span>người</span><button type="button" data-serv-inc aria-label="Thêm một người">+</button></div>
  </div>
  ${ingHTML}
  <button class="btn" type="button" data-add-shop>${icon("cart")}<span>Thêm vào danh sách đi chợ</span></button>
</section>
<section><h2>Cách làm</h2><ol class="steps">${stepHTML}</ol></section>
${r.meo ? `<section class="tip"><h2>Mẹo nhỏ</h2>${md(r.meo)}</section>` : ""}
${r.tagList.length ? `<p class="tags">${r.tagList.map((t) => `<a class="tag" href="/tim-kiem/?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join(" ")}</p>` : ""}
${r.cap_nhat ? `<p class="muted small">Cập nhật: ${esc(r.cap_nhat)}</p>` : ""}
</article>
${adSlot(site, "bottom")}
${related.length ? `<section><h2 class="section-title">Thêm món trong ${esc(r.cat.ten)}</h2>${grid(related)}</section>` : ""}
<div class="cook" data-cook-view hidden role="dialog" aria-modal="true" aria-label="Chế độ nấu">
  <div class="cook-top"><span data-cook-pos></span><button class="icon-btn" type="button" data-cook-close aria-label="Đóng">✕</button></div>
  <p class="cook-text" data-cook-text></p>
  <div class="cook-tools" data-cook-tools></div>
  <div class="cook-nav"><button class="btn ghost" type="button" data-cook-prev>← Trước</button><button class="btn" type="button" data-cook-next>Tiếp →</button></div>
</div>`,
    });
  }

  // ----- Video, tìm kiếm, đi chợ, đã lưu -----
  const withVideo = recipes.filter((r) => r.youtube_id);
  await page(site, {
    path: "/video/", title: "Video hướng dẫn nấu ăn", crumbs: [["Video", "/video/"]],
    description: "Tất cả video hướng dẫn nấu ăn, mỗi video đi kèm công thức chi tiết.",
    body: `<h1>Video hướng dẫn</h1><p class="lead">Mỗi video có công thức chi tiết đi kèm: nguyên liệu, từng bước, hẹn giờ.</p>${withVideo.length ? grid(withVideo) : emptyState("Video đang được bổ sung", "Thêm mã video YouTube vào cột youtube_id trong Google Sheets.")}`,
  });
  await page(site, {
    path: "/tim-kiem/", page: "search", title: "Tìm món", crumbs: [["Tìm món", "/tim-kiem/"]],
    description: "Tìm công thức theo tên món hoặc theo nguyên liệu bạn đang có. Gõ không dấu vẫn tìm được.",
    body: `<h1>Tìm món</h1>
<div class="seg" role="tablist"><button type="button" role="tab" data-mode="ten" aria-selected="true">Theo tên món</button><button type="button" role="tab" data-mode="nl" aria-selected="false">Theo nguyên liệu</button></div>
<form class="search" role="search" onsubmit="return false">${icon("search")}<label class="sr-only" for="q">Tìm kiếm</label><input id="q" name="q" type="search" autocomplete="off" placeholder="Ví dụ: trứng, mì, sinh tố…"></form>
<p class="muted small" data-hint>Gõ không dấu vẫn tìm được.</p>
<div class="filters">
  <div class="chips" data-filter="c"><button type="button" class="chip" data-v="" aria-pressed="true">Tất cả</button>${cats.map((c) => `<button type="button" class="chip" data-v="${c.slug}" aria-pressed="false">${esc(c.ten)}</button>`).join("")}</div>
  <div class="chips" data-filter="m"><button type="button" class="chip" data-v="" aria-pressed="true">Mọi thời gian</button><button type="button" class="chip" data-v="15" aria-pressed="false">≤ 15 phút</button><button type="button" class="chip" data-v="30" aria-pressed="false">≤ 30 phút</button><button type="button" class="chip" data-v="60" aria-pressed="false">≤ 60 phút</button></div>
</div>
<p class="muted small" data-count></p>
<div class="rgrid" data-results></div>`,
  });
  await page(site, {
    path: "/di-cho/", page: "shop", title: "Danh sách đi chợ", crumbs: [["Đi chợ", "/di-cho/"]], noindex: true,
    description: "Danh sách nguyên liệu cần mua, gom từ các món bạn chọn.",
    body: `<h1>Đi chợ</h1><p class="lead">Nguyên liệu gom từ các món bạn đã thêm. Tích khi đã mua.</p><div data-shop></div>
<div class="row"><button class="btn ghost" type="button" data-shop-share>Chia sẻ qua Zalo</button><button class="btn ghost" type="button" data-shop-clear>Xoá món đã mua</button></div>`,
  });
  await page(site, {
    path: "/da-luu/", page: "saved", title: "Món đã lưu", crumbs: [["Đã lưu", "/da-luu/"]], noindex: true,
    description: "Các công thức bạn đã lưu trên điện thoại này.",
    body: `<h1>Món đã lưu</h1><div class="rgrid" data-saved-grid></div><div data-saved-empty hidden>${emptyState("Chưa lưu món nào", "Bấm “Lưu món” ở trang công thức để xem lại nhanh ở đây.")}</div>`,
  });

  // ----- Trang thông tin -----
  const email = site.contact_email ? `<a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a>` : "đang cập nhật";
  const info = [
    ["ve-chung-toi", "Về chúng tôi", `${site.site_name} tổng hợp công thức nấu ăn dễ làm, có video hướng dẫn.`,
      `<p>${esc(site.site_name)} là nơi tìm công thức nấu ăn dễ làm tại nhà: món Việt, món Á, món Âu, bánh và đồ uống.</p><p>Mỗi công thức được viết lại rõ ràng, có nguyên liệu tính theo số người ăn, từng bước làm, hẹn giờ và video hướng dẫn từ các kênh YouTube được ghi tên.</p>`],
    ["ban-quyen-video", "Bản quyền video", "Cách chúng tôi dùng video YouTube và cách yêu cầu gỡ.",
      `<p>Video trên web được nhúng bằng trình phát chính thức của YouTube, không tải về hay sao chép. Lượt xem được tính cho kênh gốc, và mỗi video đều ghi tên kênh cùng đường dẫn xem trên YouTube.</p><p>Chủ kênh có thể tắt chức năng nhúng trên YouTube bất cứ lúc nào; khi đó video sẽ tự ẩn khỏi web. Nếu bạn là chủ kênh và muốn gỡ video, hãy liên hệ: ${email}. Chúng tôi gỡ trong vòng 48 giờ.</p><p>Công thức (nguyên liệu, các bước) do chúng tôi tự viết, không sao chép phần mô tả của video.</p>`],
    ["chinh-sach-bao-mat", "Chính sách bảo mật", "Cách web xử lý dữ liệu của bạn.",
      `<h2>Dữ liệu trên máy</h2><p>Món đã lưu và danh sách đi chợ chỉ lưu trong trình duyệt trên máy của bạn. Chúng tôi không có máy chủ lưu những dữ liệu này.</p><h2>Thống kê và quảng cáo</h2><p>Web có thể dùng công cụ thống kê lượt truy cập và hiển thị quảng cáo của Google. Các dịch vụ này có thể dùng cookie theo chính sách của họ, xem tại <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">policies.google.com</a>.</p><h2>Video</h2><p>Video được nhúng từ YouTube ở chế độ hạn chế cookie và chỉ tải khi bạn bấm xem.</p>`],
    ["lien-he", "Liên hệ", `Liên hệ ${site.site_name}.`, `<p>Góp ý công thức, báo lỗi hoặc hợp tác: ${email}.</p>`],
  ];
  for (const [slug, title, description, html] of info) await page(site, { path: `/${slug}/`, title, description, crumbs: [[title, `/${slug}/`]], body: `<article class="prose"><h1>${title}</h1>${html}</article>` });
  await page(site, { path: "/404", title: "Không tìm thấy trang", noindex: true, description: "Trang không tồn tại.", body: `<h1>Không tìm thấy trang</h1><p>Trang bạn tìm không tồn tại. <a href="/">Về trang chủ</a> hoặc <a href="/tim-kiem/">tìm món</a>.</p>` });

  // ----- sitemap, robots, ads.txt, service worker, đường dẫn gốc -----
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${esc(site.site_url + p.path)}</loc>${p.lastmod ? `<lastmod>${esc(p.lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
  await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.site_url}/sitemap.xml\n`);
  if (site.adsense_client) await write("ads.txt", `google.com, ${site.adsense_client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
  const sw = await fs.readFile(path.join(DIST, "sw.js"), "utf8");
  await write("sw.js", sw.replace("__BUILD_ID__", site.build_id).replace("__BASE__", site.base));
  const mf = JSON.parse(await fs.readFile(path.join(DIST, "manifest.webmanifest"), "utf8"));
  mf.name = site.site_name; mf.description = site.tagline || mf.description;
  await write("manifest.webmanifest", JSON.stringify(mf, null, 2));
  if (site.base) await rebase(site.base);

  const src = process.env.SHEET_ID && !sampleOnly ? "Google Sheets" : process.env.DATA_DIR || "data/sample";
  console.log(`Xong: ${pages.length} trang → dist/  (nguồn: ${src}${site.base ? `, đường dẫn gốc ${site.base}` : ""})`);
  console.log(`Đã xuất bản: ${recipes.length} món (${withVideo.length} có video), ${cats.length} danh mục.`);
  if (report.warnings.length) console.log(`\nCẢNH BÁO:\n- ` + report.warnings.join("\n- "));
  if (report.skipped.length) console.log(`\nKHÔNG xuất bản ${report.skipped.length} dòng:\n- ` + report.skipped.join("\n- "));
}

function groupMap(list, key) {
  const m = new Map();
  for (const x of list) { const k = x[key] || ""; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
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

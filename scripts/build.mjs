#!/usr/bin/env node
// Dựng web tĩnh từ Google Sheets (hoặc CSV mẫu) ra thư mục dist/.
//   node scripts/build.mjs            → đọc Google Sheet nếu có SHEET_ID, không thì đọc data/sample
//   node scripts/build.mjs --sample   → luôn đọc data/sample
// Biến môi trường: SHEET_ID (ID file Google Sheets, chia sẻ "Bất kỳ ai có đường liên kết đều xem được").
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV, esc, fold, md, parseSources, isSlug } from "./lib.mjs";
import { layout, adSlot, sourcesBlock, emptyState, liteVideo, icon } from "./templates.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const TABS = ["settings", "stages", "checklist", "vaccines", "milestones", "diseases", "articles", "videos", "growth_ref"];
const MEDICAL = new Set(["vaccines", "milestones", "diseases", "articles"]);

const report = { skipped: [], errors: [] };
const skip = (tab, row, why) => report.skipped.push(`${tab} dòng ${row._row}: ${why}`);

// ---------- 1. Đọc dữ liệu ----------
async function loadTab(tab) {
  const sheetId = process.argv.includes("--sample") ? "" : process.env.SHEET_ID || "";
  if (sheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được tab "${tab}" từ Google Sheets (HTTP ${res.status}). Kiểm tra quyền chia sẻ và tên tab.`);
    return parseCSV(await res.text());
  }
  const file = path.join(process.env.DATA_DIR || path.join(ROOT, "data", "sample"), `${tab}.csv`);
  try { return parseCSV(await fs.readFile(file, "utf8")); } catch { return []; }
}

/** Dòng nội dung y tế chỉ được xuất bản khi có nguồn và người kiểm duyệt (bài viết: thêm trạng thái "duyệt"). */
function publishable(tab, r) {
  if (!MEDICAL.has(tab)) return true;
  if (!r.nguon) return skip(tab, r, "thiếu nguồn"), false;
  if (!r.reviewed_by) return skip(tab, r, "chưa có người kiểm duyệt"), false;
  if (tab === "articles" && fold(r.trang_thai) !== "duyet") return skip(tab, r, `trạng thái "${r.trang_thai || "trống"}", chưa duyệt`), false;
  return true;
}

const num = (v, d = 0) => (v === "" || v == null || isNaN(Number(v)) ? d : Number(v));
const byOrder = (a, b) => num(a.thu_tu, 999) - num(b.thu_tu, 999);

// ---------- 2. Ghi file ----------
async function write(rel, content) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}
const pages = []; // cho sitemap
async function page(site, p) {
  if (!p.noindex) pages.push({ path: p.path, lastmod: p.lastmod });
  await write(p.path === "/404" ? "404.html" : path.join(p.path, "index.html"), layout(site, p));
}

// ---------- 3. Dựng ----------
async function main() {
  const raw = {};
  for (const t of TABS) raw[t] = await loadTab(t);

  const site = { site_name: "Kiến thức làm mẹ", tagline: "", site_url: "https://kienthuclamme.pages.dev" };
  for (const r of raw.settings) if (r.key) site[r.key] = r.value;
  // BASE_PATH: chạy trong thư mục con (GitHub Pages: /kienthuclamme). SITE_URL: ghi đè địa chỉ web khi deploy nơi khác.
  site.base = (process.env.BASE_PATH || "").replace(/\/+$/, "");
  if (process.env.SITE_URL) site.site_url = process.env.SITE_URL.replace(/\/+$/, "");
  site.build_id = Date.now().toString(36);

  const stages = raw.stages.filter((r) => (isSlug(r.slug) ? true : (skip("stages", r, `slug "${r.slug}" không hợp lệ`), false))).sort(byOrder);
  const stageBySlug = Object.fromEntries(stages.map((s) => [s.slug, s]));
  const checklist = raw.checklist.filter((r) => r.ten);
  const vaccines = raw.vaccines.filter((r) => publishable("vaccines", r));
  const milestones = raw.milestones.filter((r) => publishable("milestones", r));
  const diseases = raw.diseases.filter((r) => (isSlug(r.slug) ? publishable("diseases", r) : (skip("diseases", r, "slug không hợp lệ"), false)));
  const articles = raw.articles.filter((r) => (isSlug(r.slug) ? publishable("articles", r) : (skip("articles", r, "slug không hợp lệ"), false)));
  const videos = raw.videos.filter((r) => (/^[\w-]{11}$/.test(r.youtube_id) ? true : (skip("videos", r, `youtube_id "${r.youtube_id}" không hợp lệ`), false))).sort(byOrder);

  for (const [tab, list, key] of [["stages", stages, "slug"], ["diseases", diseases, "slug"], ["articles", articles, "slug"], ["vaccines", vaccines, "ma"]]) {
    const seen = new Set();
    for (const r of list) { if (seen.has(r[key])) report.errors.push(`${tab}: trùng ${key} "${r[key]}" (dòng ${r._row})`); seen.add(r[key]); }
  }
  if (report.errors.length) { console.error("LỖI:\n- " + report.errors.join("\n- ")); process.exit(1); }

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.cp(path.join(SRC), DIST, { recursive: true });

  // JSON cho phía trình duyệt
  const slim = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k] ?? ""]));
  await write("data/stages.json", JSON.stringify(stages.map((s) => ({ ...slim(s, ["slug", "ten", "tom_tat"]), tu: num(s.tu_ngay), den: num(s.den_ngay) }))));
  await write("data/vaccines.json", JSON.stringify(vaccines.map((v) => ({ ...slim(v, ["ma", "ten_vaccine", "phong_benh", "mui_so", "loai", "luu_y"]), som: num(v.tuoi_ngay_som_nhat), muon: num(v.tuoi_ngay_muon_nhat, num(v.tuoi_ngay_som_nhat)) }))));
  await write("data/milestones.json", JSON.stringify(milestones.map((m) => slim(m, ["stage_slug", "linh_vuc", "mo_ta"]))));

  // ----- Trang chủ -----
  await page(site, {
    path: "/", page: "home", title: site.site_name,
    description: `${site.tagline}. Đồ cần chuẩn bị, sự phát triển theo giai đoạn, lịch tiêm chủng và các bệnh ba mẹ cần biết.`,
    jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: site.site_name, url: site.site_url,
      potentialAction: { "@type": "SearchAction", target: `${site.site_url}/tim-kiem/?q={q}`, "query-input": "required name=q" } }],
    body: `
<section class="hero">
  <h1>${esc(site.tagline || site.site_name)}</h1>
  <p class="lead">Nhập ngày sinh hoặc ngày dự sinh một lần, web tự cho bạn biết bé đang ở giai đoạn nào và cần chuẩn bị gì.</p>
</section>
<section id="today" class="card today" aria-live="polite">
  <form class="baby-quick" data-form="quick-baby">
    <h2>Bé nhà bạn</h2>
    <div class="seg" role="radiogroup" aria-label="Tình trạng">
      <label><input type="radio" name="kind" value="born" checked> Đã sinh</label>
      <label><input type="radio" name="kind" value="expecting"> Chưa sinh</label>
    </div>
    <label class="field"><span data-label-date>Ngày sinh</span><input type="date" name="date" required></label>
    <label class="field"><span>Tên gọi ở nhà (không bắt buộc)</span><input type="text" name="name" maxlength="30" placeholder="Ví dụ: Bin"></label>
    <button class="btn" type="submit">Xem nội dung cho bé</button>
    <p class="muted small">Thông tin chỉ lưu trên điện thoại của bạn.</p>
  </form>
</section>
<section>
  <h2 class="section-title">Theo giai đoạn</h2>
  <div class="stage-grid">${stages.map((s) => `<a class="stage-card" href="/giai-doan/${s.slug}/"><strong>${esc(s.ten)}</strong><span>${esc(s.tom_tat)}</span></a>`).join("")}</div>
</section>
<section class="quick">
  <a class="card link-card" href="/chuan-bi-di-sinh/"><strong>Chuẩn bị đi sinh</strong><span>Danh sách đồ dùng để tích dần</span></a>
  <a class="card link-card" href="/lich-tiem-chung/"><strong>Lịch tiêm chủng</strong><span>Tính theo ngày sinh của bé</span></a>
  <a class="card link-card" href="/benh/"><strong>Bệnh thường gặp</strong><span>Dấu hiệu cần đưa bé đi khám</span></a>
  <a class="card link-card" href="/video/"><strong>Video hướng dẫn</strong><span>Từ nguồn y tế uy tín</span></a>
</section>`,
  });

  // ----- Giai đoạn -----
  await page(site, {
    path: "/giai-doan/", title: "Các giai đoạn phát triển của bé", crumbs: [["Giai đoạn", "/giai-doan/"]],
    description: "Từ lúc chuẩn bị sinh đến 6 tuổi: bé phát triển thế nào và ba mẹ cần chú ý gì ở từng giai đoạn.",
    body: `<h1>Các giai đoạn của bé</h1><ol class="timeline">${stages.map((s) => `<li><a href="/giai-doan/${s.slug}/"><strong>${esc(s.ten)}</strong><span>${esc(s.tom_tat)}</span></a></li>`).join("")}</ol>`,
  });
  for (const [i, s] of stages.entries()) {
    const items = checklist.filter((c) => c.stage_slug === s.slug);
    const ms = milestones.filter((m) => m.stage_slug === s.slug);
    const vids = videos.filter((v) => v.stage_slug === s.slug);
    const arts = articles.filter((a) => a.stage_slug === s.slug);
    const dis = diseases.filter((d) => (d.stage_slugs || "").split(/[,\s]+/).includes(s.slug));
    const prev = stages[i - 1], next = stages[i + 1];
    const parts = [];
    if (ms.length) parts.push(`<section><h2>Bé làm được gì</h2>${groupBy(ms, "linh_vuc").map(([k, list]) => `<h3>${esc(k)}</h3><ul>${list.map((m) => `<li>${esc(m.mo_ta)}${m.dau_hieu_can_kham ? `<div class="note warn">Nên hỏi bác sĩ nếu: ${esc(m.dau_hieu_can_kham)}</div>` : ""}</li>`).join("")}</ul>`).join("")}</section>`);
    if (items.length) parts.push(`<section><h2>Cần chuẩn bị</h2><p><a href="/chuan-bi-di-sinh/">Mở danh sách có ô tích →</a></p><ul>${items.map((c) => `<li>${esc(c.ten)}${c.so_luong ? ` <span class="muted">(${esc(c.so_luong)})</span>` : ""}</li>`).join("")}</ul></section>`);
    if (dis.length) parts.push(`<section><h2>Bệnh hay gặp</h2><ul>${dis.map((d) => `<li><a href="/benh/${d.slug}/">${esc(d.ten)}</a></li>`).join("")}</ul></section>`);
    if (vids.length) parts.push(`<section><h2>Video</h2><div class="video-grid">${vids.map((v, j) => liteVideo(v, vids.slice(j + 1).map((x) => x.youtube_id))).join("")}</div></section>`);
    if (arts.length) parts.push(`<section><h2>Bài viết</h2><ul>${arts.map((a) => `<li><a href="/bai-viet/${a.slug}/">${esc(a.tieu_de)}</a></li>`).join("")}</ul></section>`);
    await page(site, {
      path: `/giai-doan/${s.slug}/`, title: s.ten, crumbs: [["Giai đoạn", "/giai-doan/"], [s.ten, `/giai-doan/${s.slug}/`]],
      description: s.tom_tat,
      body: `<h1>${esc(s.ten)}</h1><p class="lead">${esc(s.tom_tat)}</p>
${adSlot(site, "top")}
${parts.join("\n") || emptyState("Nội dung đang được biên soạn", "Chúng tôi đang tổng hợp và kiểm duyệt nội dung cho giai đoạn này từ các nguồn y tế chính thống.")}
<nav class="pager">${prev ? `<a href="/giai-doan/${prev.slug}/">← ${esc(prev.ten)}</a>` : "<span></span>"}${next ? `<a href="/giai-doan/${next.slug}/">${esc(next.ten)} →</a>` : ""}</nav>`,
    });
  }

  // ----- Chuẩn bị đi sinh -----
  const prep = checklist.filter((c) => c.stage_slug === "chuan-bi-sinh");
  await page(site, {
    path: "/chuan-bi-di-sinh/", page: "checklist", title: "Danh sách đồ chuẩn bị đi sinh", crumbs: [["Chuẩn bị đi sinh", "/chuan-bi-di-sinh/"]],
    description: "Danh sách đồ cần mang khi đi sinh cho mẹ và bé, kèm giấy tờ, có ô tích để chuẩn bị dần.",
    body: `<h1>Chuẩn bị đi sinh</h1>
<p class="lead">Tích dần từng món khi đã chuẩn bị. Danh sách được lưu trên điện thoại của bạn.</p>
<div class="progress card" data-progress><div class="bar"><span style="width:0%"></span></div><p><strong data-progress-text>0/${prep.length}</strong> món đã chuẩn bị</p>
<div class="row"><button class="btn ghost" type="button" data-share>Chia sẻ danh sách</button><button class="btn ghost" type="button" onclick="print()">In ra giấy</button></div></div>
<div class="note">Mỗi bệnh viện có thể phát sẵn một số đồ. Hãy hỏi nơi bạn sinh để chuẩn bị cho gọn.</div>
${prep.length ? groupBy(prep, "nhom").map(([g, list]) => `<section class="checklist"><h2>${esc(g)}</h2><ul>${list.map((c) => {
      const id = "c" + fold(c.nhom + "-" + c.ten).replace(/[^a-z0-9]+/g, "-").slice(0, 60);
      return `<li><label><input type="checkbox" data-check="${id}"><span><strong>${esc(c.ten)}</strong>${c.so_luong ? ` <span class="muted">· ${esc(c.so_luong)}</span>` : ""}${fold(c.bat_buoc) === "co" ? ' <span class="tag">cần thiết</span>' : ""}${c.ghi_chu ? `<small>${esc(c.ghi_chu)}</small>` : ""}</span></label></li>`;
    }).join("")}</ul></section>`).join("") : emptyState("Danh sách đang cập nhật", "")}
${adSlot(site, "bottom")}`,
  });

  // ----- Lịch tiêm chủng -----
  const vRow = (v) => `<tr><td><strong>${esc(v.ten_vaccine)}</strong><small>${esc(v.phong_benh)}</small></td><td>${esc(v.mui_so)}</td><td>${ageText(num(v.tuoi_ngay_som_nhat))}${v.tuoi_ngay_muon_nhat && v.tuoi_ngay_muon_nhat !== v.tuoi_ngay_som_nhat ? ` – ${ageText(num(v.tuoi_ngay_muon_nhat))}` : ""}</td><td>${esc(v.luu_y)}</td></tr>`;
  const vTable = (list) => `<div class="table-wrap"><table><thead><tr><th>Vắc xin · phòng bệnh</th><th>Mũi</th><th>Tuổi tiêm</th><th>Lưu ý</th></tr></thead><tbody>${list.sort((a, b) => num(a.tuoi_ngay_som_nhat) - num(b.tuoi_ngay_som_nhat)).map(vRow).join("")}</tbody></table></div>`;
  const tcmr = vaccines.filter((v) => fold(v.loai) === "tcmr"), dv = vaccines.filter((v) => fold(v.loai) !== "tcmr");
  const vSources = dedupe(vaccines.flatMap((v) => parseSources(v.nguon)));
  const vUpdated = vaccines.map((v) => v.cap_nhat).filter(Boolean).sort().at(-1);
  await page(site, {
    path: "/lich-tiem-chung/", page: "vaccines", title: "Lịch tiêm chủng cho bé", crumbs: [["Tiêm chủng", "/lich-tiem-chung/"]],
    description: "Lịch tiêm chủng cho bé theo từng độ tuổi, tách tiêm chủng mở rộng miễn phí và tiêm dịch vụ; tính ngày tiêm theo ngày sinh của bé.",
    body: `<h1>Lịch tiêm chủng</h1>
<p class="lead">Nhập ngày sinh ở <a href="/be-cua-toi/">Bé của tôi</a> để xem ngày dự kiến từng mũi và thêm vào lịch điện thoại.</p>
<div class="note">Lịch có thể thay đổi theo từng thời điểm và từng cơ sở tiêm. Luôn hỏi lại cán bộ y tế nơi bé tiêm.</div>
<section id="my-vaccines" class="card" hidden></section>
${vaccines.length ? `${tcmr.length ? `<section><h2>Tiêm chủng mở rộng (miễn phí)</h2>${vTable(tcmr)}</section>` : ""}${dv.length ? `<section><h2>Tiêm dịch vụ</h2>${vTable(dv)}</section>` : ""}${sourcesBlock(vSources, vUpdated)}` : emptyState("Lịch tiêm đang được biên soạn", "Chúng tôi đang nhập lịch tiêm từ văn bản chính thức của Bộ Y tế và kiểm duyệt trước khi đăng.")}`,
  });

  // ----- Bệnh -----
  await page(site, {
    path: "/benh/", title: "Bệnh thường gặp ở trẻ ba mẹ cần biết", crumbs: [["Bệnh thường gặp", "/benh/"]],
    description: "Các bệnh thường gặp ở trẻ nhỏ: triệu chứng, dấu hiệu nguy hiểm cần đưa bé đi viện ngay và cách phòng ngừa.",
    body: `<h1>Bệnh thường gặp</h1>${diseases.length ? `<div class="list-cards">${diseases.map((d) => `<a class="card link-card" href="/benh/${d.slug}/"><strong>${esc(d.ten)}</strong><span>${esc(d.tom_tat || d.nhom_tuoi)}</span></a>`).join("")}</div>` : emptyState("Nội dung đang được biên soạn", "Mỗi bài về bệnh đều được kiểm duyệt trước khi đăng.")}`,
  });
  for (const d of diseases) {
    const src = parseSources(d.nguon);
    await page(site, {
      path: `/benh/${d.slug}/`, title: d.ten, ogType: "article", lastmod: d.cap_nhat, crumbs: [["Bệnh thường gặp", "/benh/"], [d.ten, `/benh/${d.slug}/`]],
      description: d.tom_tat || `${d.ten}: triệu chứng, dấu hiệu nguy hiểm, cách phòng ngừa và khi nào cần đưa bé đi khám.`,
      jsonld: [{ "@context": "https://schema.org", "@type": "MedicalWebPage", name: d.ten, about: { "@type": "MedicalCondition", name: d.ten },
        lastReviewed: d.cap_nhat || undefined, reviewedBy: d.reviewed_by ? { "@type": "Person", name: d.reviewed_by } : undefined, inLanguage: "vi" }],
      body: `<h1>${esc(d.ten)}</h1>${d.tom_tat ? `<p class="lead">${esc(d.tom_tat)}</p>` : ""}
${d.dau_hieu_nguy_hiem ? `<section class="alert danger"><h2>Đưa bé đến viện ngay nếu</h2>${md(d.dau_hieu_nguy_hiem)}</section>` : ""}
${d.trieu_chung ? `<section><h2>Triệu chứng</h2>${md(d.trieu_chung)}</section>` : ""}
${adSlot(site, "mid")}
${d.khi_nao_di_kham ? `<section class="alert warn"><h2>Khi nào cần đi khám</h2>${md(d.khi_nao_di_kham)}</section>` : ""}
${d.phong_ngua ? `<section><h2>Phòng ngừa</h2>${md(d.phong_ngua)}</section>` : ""}
${sourcesBlock(src, d.cap_nhat, d.reviewed_by)}`,
    });
  }

  // ----- Bài viết -----
  await page(site, {
    path: "/bai-viet/", title: "Bài viết", crumbs: [["Bài viết", "/bai-viet/"]],
    description: "Bài viết hướng dẫn chăm sóc bé và mẹ, đã được kiểm duyệt nguồn.",
    body: `<h1>Bài viết</h1>${articles.length ? `<div class="list-cards">${articles.map((a) => `<a class="card link-card" href="/bai-viet/${a.slug}/"><strong>${esc(a.tieu_de)}</strong><span>${esc(a.tom_tat)}</span></a>`).join("")}</div>` : emptyState("Chưa có bài viết", "")}`,
  });
  for (const a of articles) {
    const st = stageBySlug[a.stage_slug];
    await page(site, {
      path: `/bai-viet/${a.slug}/`, title: a.tieu_de, ogType: "article", lastmod: a.cap_nhat,
      crumbs: [["Bài viết", "/bai-viet/"], [a.tieu_de, `/bai-viet/${a.slug}/`]], description: a.tom_tat,
      jsonld: [{ "@context": "https://schema.org", "@type": "Article", headline: a.tieu_de, description: a.tom_tat, dateModified: a.cap_nhat || undefined,
        author: { "@type": "Organization", name: site.site_name }, inLanguage: "vi" }],
      body: `<article class="prose"><h1>${esc(a.tieu_de)}</h1><p class="lead">${esc(a.tom_tat)}</p>${st ? `<p><a class="tag" href="/giai-doan/${st.slug}/">${esc(st.ten)}</a></p>` : ""}
${a.anh ? `<img class="hero-img" src="${esc(a.anh)}" alt="${esc(a.tieu_de)}" loading="lazy">` : ""}
${md(a.noi_dung)}</article>${adSlot(site, "bottom")}${sourcesBlock(parseSources(a.nguon), a.cap_nhat, a.reviewed_by)}`,
    });
  }

  // ----- Video -----
  await page(site, {
    path: "/video/", title: "Video hướng dẫn chăm bé", crumbs: [["Video", "/video/"]],
    description: "Video hướng dẫn chăm sóc trẻ từ các kênh y tế uy tín, sắp theo chủ đề.",
    body: `<h1>Video hướng dẫn</h1><p class="lead">Bấm một video để xem; video sau trong cùng chủ đề sẽ tự phát tiếp.</p>${videos.length ? groupBy(videos, "chu_de").map(([topic, list]) => `<section><h2>${esc(topic || "Khác")}</h2><div class="video-grid">${list.map((v, j) => liteVideo(v, list.slice(j + 1).map((x) => x.youtube_id))).join("")}</div></section>`).join("") : emptyState("Video đang được tuyển chọn", "Chúng tôi chỉ chọn video từ các kênh y tế và bệnh viện uy tín.")}`,
  });

  // ----- Tra cứu, Bé của tôi -----
  const searchIndex = [
    ...stages.map((s) => ({ t: s.ten, d: s.tom_tat, u: `/giai-doan/${s.slug}/`, k: "Giai đoạn" })),
    ...diseases.map((d) => ({ t: d.ten, d: d.tom_tat || d.trieu_chung.slice(0, 140), u: `/benh/${d.slug}/`, k: "Bệnh", x: d.trieu_chung })),
    ...articles.map((a) => ({ t: a.tieu_de, d: a.tom_tat, u: `/bai-viet/${a.slug}/`, k: "Bài viết" })),
    ...vaccines.map((v) => ({ t: v.ten_vaccine, d: `Phòng ${v.phong_benh}`, u: "/lich-tiem-chung/", k: "Tiêm chủng" })),
    ...prep.map((c) => ({ t: c.ten, d: c.nhom, u: "/chuan-bi-di-sinh/", k: "Chuẩn bị đi sinh" })),
  ].map((o) => ({ ...o, f: fold([o.t, o.d, o.x || ""].join(" ")) }));
  await write("data/search.json", JSON.stringify(searchIndex.map(({ x, ...o }) => o)));
  await page(site, {
    path: "/tim-kiem/", page: "search", title: "Tra cứu", crumbs: [["Tra cứu", "/tim-kiem/"]],
    description: "Tìm nhanh bệnh, mũi tiêm, giai đoạn phát triển và đồ cần chuẩn bị cho bé. Gõ không dấu vẫn tìm được.",
    body: `<h1>Tra cứu</h1><form class="search" role="search" onsubmit="return false"><label class="sr-only" for="q">Tìm kiếm</label>${icon("search")}<input id="q" name="q" type="search" placeholder="Ví dụ: sốt, tiêm, bỉm…" autocomplete="off" autofocus></form><p class="muted small" data-search-hint>Gõ không dấu vẫn tìm được.</p><ul class="results" data-results></ul>`,
  });
  await page(site, {
    path: "/be-cua-toi/", page: "mybaby", title: "Bé của tôi", crumbs: [["Bé của tôi", "/be-cua-toi/"]],
    description: "Hồ sơ bé lưu trên điện thoại: ngày sinh, lịch tiêm đã tiêm, sao lưu và khôi phục.",
    body: `<h1>Bé của tôi</h1><p class="lead">Mọi thông tin ở đây chỉ lưu trên điện thoại này, không gửi đi đâu.</p>
<section id="babies"></section>
<section class="card"><h2>Thêm bé</h2>
<form data-form="add-baby">
<div class="seg" role="radiogroup" aria-label="Tình trạng"><label><input type="radio" name="kind" value="born" checked> Đã sinh</label><label><input type="radio" name="kind" value="expecting"> Chưa sinh</label></div>
<label class="field"><span data-label-date>Ngày sinh</span><input type="date" name="date" required></label>
<label class="field"><span>Tên gọi ở nhà</span><input type="text" name="name" maxlength="30" placeholder="Ví dụ: Bin"></label>
<label class="field"><span>Giới tính (dùng cho biểu đồ tăng trưởng)</span><select name="sex"><option value="">Chưa chọn</option><option value="nam">Bé trai</option><option value="nu">Bé gái</option></select></label>
<button class="btn" type="submit">Lưu</button></form></section>
<section class="card"><h2>Sao lưu</h2><p class="muted">Lưu file sao lưu để chuyển sang điện thoại khác hoặc phòng khi xoá trình duyệt.</p>
<div class="row"><button class="btn ghost" type="button" data-backup>Tải file sao lưu</button><label class="btn ghost file-btn">Khôi phục từ file<input type="file" accept="application/json" data-restore hidden></label></div></section>`,
  });

  // ----- Trang tin cậy -----
  for (const t of trustPages(site)) await page(site, { ...t, crumbs: [[t.title, t.path]] });
  await page(site, { path: "/404", title: "Không tìm thấy trang", noindex: true, description: "Trang không tồn tại.", body: `<h1>Không tìm thấy trang</h1><p>Trang bạn tìm không tồn tại hoặc đã được chuyển. <a href="/">Về trang chủ</a> hoặc <a href="/tim-kiem/">tra cứu</a>.</p>` });

  // ----- sitemap, robots, service worker -----
  const base = site.site_url.replace(/\/$/, "");
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${esc(base + p.path)}</loc>${p.lastmod ? `<lastmod>${esc(p.lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
  await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  if (site.adsense_client) await write("ads.txt", `google.com, ${site.adsense_client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
  const sw = await fs.readFile(path.join(DIST, "sw.js"), "utf8");
  await write("sw.js", sw.replace("__BUILD_ID__", site.build_id).replace("__BASE__", site.base));
  if (site.base) await rebase(site.base);

  console.log(`Xong: ${pages.length} trang → dist/  (nguồn: ${process.env.SHEET_ID && !process.argv.includes("--sample") ? "Google Sheets" : process.env.DATA_DIR || "data/sample"})`);
  console.log(`Đã xuất bản: ${stages.length} giai đoạn, ${prep.length} món chuẩn bị, ${vaccines.length} mũi tiêm, ${milestones.length} mốc, ${diseases.length} bệnh, ${articles.length} bài, ${videos.length} video.`);
  if (report.skipped.length) console.log(`\nKHÔNG xuất bản ${report.skipped.length} dòng:\n- ` + report.skipped.join("\n- "));
}

// ---------- Hỗ trợ ----------
/** Thêm đường dẫn gốc vào mọi link nội bộ ("/x" → "/kienthuclamme/x") trong HTML, manifest và chỉ mục tìm kiếm. */
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
    if (f.endsWith(".html")) {
      const s = await fs.readFile(f, "utf8");
      await fs.writeFile(f, s.replace(/(\s(?:href|src|action)=")\/(?!\/)/g, `$1${base}/`).replace('<html lang="vi">', `<html lang="vi" data-base="${base}">`));
    }
  }
  const mf = path.join(DIST, "manifest.webmanifest");
  const m = JSON.parse(await fs.readFile(mf, "utf8"));
  m.start_url = base + m.start_url; m.scope = base + "/";
  m.icons = m.icons.map((i) => ({ ...i, src: base + i.src }));
  await fs.writeFile(mf, JSON.stringify(m, null, 2));
}

function groupBy(list, key) {
  const m = new Map();
  for (const x of list) { const k = x[key] || ""; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return [...m];
}
function dedupe(sources) {
  const seen = new Set();
  return sources.filter((s) => { const k = s.url || s.name; if (seen.has(k)) return false; seen.add(k); return true; });
}
function ageText(days) {
  if (days < 0) return `${Math.round(-days / 7)} tuần trước sinh`;
  if (days === 0) return "Ngay sau sinh";
  if (days < 30) return `${days} ngày tuổi`;
  if (days < 730) return `${Math.round(days / 30.44)} tháng tuổi`;
  const y = days / 365.25;
  return `${Number.isInteger(Math.round(y * 2) / 2) ? Math.round(y) : (Math.round(y * 2) / 2).toString().replace(".", ",")} tuổi`;
}
function trustPages(site) {
  const name = esc(site.site_name);
  const email = site.contact_email ? `<a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a>` : "đang cập nhật";
  const mk = (slug, title, description, html) => ({ path: `/${slug}/`, title, description, body: `<article class="prose"><h1>${title}</h1>${html}</article>` });
  return [
    mk("ve-chung-toi", "Về chúng tôi", `${site.site_name} là nơi tổng hợp kiến thức chăm sóc bé từ các nguồn y tế chính thống.`,
      `<p>${name} giúp ba mẹ Việt tìm nhanh thông tin chăm bé từ lúc chuẩn bị sinh đến 6 tuổi: đồ cần chuẩn bị, sự phát triển theo giai đoạn, lịch tiêm chủng và các bệnh thường gặp.</p><p>Chúng tôi không phải cơ sở y tế. Nội dung được tổng hợp từ các nguồn chính thống và kiểm duyệt trước khi đăng, xem <a href="/quy-trinh-bien-tap/">quy trình biên tập</a>.</p>`),
    mk("quy-trinh-bien-tap", "Quy trình biên tập", "Cách chúng tôi chọn nguồn, viết và kiểm duyệt nội dung sức khoẻ.",
      `<ol><li><strong>Chọn nguồn:</strong> chỉ dùng Bộ Y tế, Chương trình Tiêm chủng mở rộng quốc gia, WHO, UNICEF và các bệnh viện nhi lớn.</li><li><strong>Biên soạn:</strong> viết lại dễ hiểu, giữ đúng ý của nguồn, ghi rõ nguồn trên từng trang.</li><li><strong>Kiểm duyệt:</strong> mỗi nội dung y tế phải có người kiểm duyệt trước khi đăng; tên người kiểm duyệt và ngày cập nhật hiển thị cuối trang.</li><li><strong>Cập nhật:</strong> khi nguồn chính thức thay đổi (ví dụ lịch tiêm), chúng tôi cập nhật và ghi ngày mới.</li></ol><p>Thấy thông tin chưa đúng? Báo cho chúng tôi qua trang <a href="/lien-he/">Liên hệ</a>.</p>`),
    mk("nguon-tham-khao", "Nguồn tham khảo", "Các nguồn y tế chính thống mà nội dung trên web dựa vào.",
      `<ul><li>Bộ Y tế Việt Nam</li><li>Chương trình Tiêm chủng mở rộng quốc gia</li><li>Tổ chức Y tế Thế giới (WHO)</li><li>Quỹ Nhi đồng Liên Hợp Quốc (UNICEF)</li><li>Các bệnh viện nhi tuyến trung ương và thành phố</li></ul><p>Nguồn cụ thể của từng nội dung được ghi ở cuối mỗi trang.</p>`),
    mk("mien-tru-trach-nhiem", "Miễn trừ trách nhiệm", "Nội dung chỉ để tham khảo, không thay thế tư vấn y tế.",
      `<p>Thông tin trên ${name} chỉ nhằm mục đích tham khảo và giáo dục, <strong>không thay thế chẩn đoán, điều trị hay tư vấn của bác sĩ</strong>.</p><p>Không tự ý dùng thuốc cho trẻ dựa trên thông tin ở đây. Khi bé có dấu hiệu bất thường, hãy đưa bé đến cơ sở y tế gần nhất. Trường hợp khẩn cấp, gọi <strong>115</strong>.</p>`),
    mk("chinh-sach-bao-mat", "Chính sách bảo mật", "Cách web xử lý dữ liệu của bạn và của bé.",
      `<h2>Dữ liệu của bé</h2><p>Hồ sơ bé, mũi tiêm đã đánh dấu và danh sách chuẩn bị chỉ lưu trong trình duyệt trên điện thoại của bạn. Chúng tôi không có máy chủ lưu những dữ liệu này và không nhận được chúng.</p><h2>Thống kê truy cập và quảng cáo</h2><p>Web có thể dùng công cụ thống kê lượt truy cập và hiển thị quảng cáo của Google. Các dịch vụ này có thể dùng cookie theo chính sách của họ. Bạn có thể tìm hiểu cách Google dùng dữ liệu tại <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">policies.google.com</a>.</p><h2>Video</h2><p>Video được nhúng từ YouTube ở chế độ hạn chế cookie và chỉ tải khi bạn bấm xem.</p>`),
    mk("lien-he", "Liên hệ", `Liên hệ ${site.site_name}.`, `<p>Góp ý nội dung, báo thông tin chưa chính xác hoặc hợp tác: ${email}.</p>`),
  ];
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });

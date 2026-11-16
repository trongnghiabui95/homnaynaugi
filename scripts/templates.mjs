// Khung HTML dùng chung cho mọi trang.
import { esc } from "./lib.mjs";

const ICON = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  stages: '<circle cx="6" cy="17" r="2.2"/><circle cx="12" cy="11" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M7.6 15.4l2.8-2.8M13.6 9.4l2.8-2.8"/>',
  vaccine: '<path d="m17 3 4 4"/><path d="m19 5-9.5 9.5"/><path d="M14 6l4 4-8.5 8.5H5.5v-4z"/><path d="M3 21l2.5-2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  baby: '<circle cx="12" cy="8.5" r="4.5"/><path d="M10.3 8.3h.01M13.7 8.3h.01"/><path d="M10.5 10.6c.9.7 2.1.7 3 0"/><path d="M5 20.5c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  text: '<path d="M4 18 8.5 6h1L14 18M5.6 14h6.8M15 18l2.7-7h.6L21 18M15.8 16h4.4"/>',
};
export const icon = (name, cls = "ic") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

const NAV = [
  ["/", "Hôm nay", "home"],
  ["/giai-doan/", "Giai đoạn", "stages"],
  ["/lich-tiem-chung/", "Tiêm chủng", "vaccine"],
  ["/tim-kiem/", "Tra cứu", "search"],
  ["/be-cua-toi/", "Bé của tôi", "baby"],
];

const TRUST = [
  ["/ve-chung-toi/", "Về chúng tôi"],
  ["/quy-trinh-bien-tap/", "Quy trình biên tập"],
  ["/nguon-tham-khao/", "Nguồn tham khảo"],
  ["/mien-tru-trach-nhiem/", "Miễn trừ trách nhiệm"],
  ["/chinh-sach-bao-mat/", "Chính sách bảo mật"],
  ["/lien-he/", "Liên hệ"],
];

/**
 * @param {object} site  cấu hình từ tab settings
 * @param {object} p     { path, title, description, body, page, jsonld[], crumbs[[name,path]], noindex }
 */
export function layout(site, p) {
  const url = site.site_url.replace(/\/$/, "") + p.path;
  const fullTitle = p.path === "/" ? `${site.site_name} – ${site.tagline}` : `${p.title} | ${site.site_name}`;
  const crumbs = p.crumbs?.length
    ? `<nav class="crumbs" aria-label="Đường dẫn"><a href="/">Trang chủ</a>${p.crumbs
        .map(([n, u], i) => (i === p.crumbs.length - 1 ? ` <span>›</span> <span aria-current="page">${esc(n)}</span>` : ` <span>›</span> <a href="${u}">${esc(n)}</a>`))
        .join("")}</nav>`
    : "";
  const ld = [...(p.jsonld || [])];
  if (p.crumbs?.length) {
    ld.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [["Trang chủ", "/"], ...p.crumbs].map(([n, u], i) => ({
        "@type": "ListItem", position: i + 1, name: n, item: site.site_url.replace(/\/$/, "") + u,
      })),
    });
  }
  const navActive = (u) => (u === "/" ? p.path === "/" : p.path.startsWith(u));
  const adsense = site.adsense_client
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(site.adsense_client)}" crossorigin="anonymous"></script>`
    : "";
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${esc(url)}">
${p.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="${p.ogType || "website"}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${esc(site.site_name)}">
<meta property="og:locale" content="vi_VN">
<meta name="theme-color" content="#f8f4ee" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16201d" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css?v=${site.build_id}">
<script>try{var s=JSON.parse(localStorage.getItem("klm-prefs")||"{}");if(s.theme)document.documentElement.dataset.theme=s.theme;if(s.big)document.documentElement.dataset.big="1"}catch(e){}</script>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n")}
${adsense}
</head>
<body data-page="${p.page || "content"}">
<a class="skip" href="#main">Bỏ qua đến nội dung</a>
<header class="topbar">
  <a class="brand" href="/"><img src="/assets/icons/icon.svg" alt="" width="28" height="28"><span>${esc(site.site_name)}</span></a>
  <div class="topbar-actions">
    <button class="icon-btn" type="button" data-toggle="big" aria-label="Chữ lớn" title="Chữ lớn">${icon("text")}</button>
    <button class="icon-btn" type="button" data-toggle="theme" aria-label="Chế độ đêm" title="Chế độ đêm">${icon("moon")}</button>
  </div>
</header>
<main id="main" class="wrap">
${crumbs}
${p.body}
</main>
<footer class="footer wrap">
  <p class="disclaimer">Thông tin trên ${esc(site.site_name)} chỉ để tham khảo, không thay thế tư vấn của bác sĩ. Khi bé có dấu hiệu bất thường, hãy đưa bé đến cơ sở y tế.</p>
  <nav class="footer-links">${TRUST.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
  <p class="muted">© ${new Date().getFullYear()} ${esc(site.site_name)}</p>
</footer>
<nav class="tabbar" aria-label="Điều hướng chính">
${NAV.map(([u, n, ic]) => `<a href="${u}"${navActive(u) ? ' aria-current="page"' : ""}>${icon(ic)}<span>${n}</span></a>`).join("\n")}
</nav>
<script type="module" src="/assets/app.js?v=${site.build_id}"></script>
</body>
</html>`;
}

/** Khung quảng cáo: chỉ hiện khi đã có mã AdSense trong settings. Giữ chỗ cố định để trang không giật. */
export function adSlot(site, slotKey) {
  const slot = site[`adsense_slot_${slotKey}`];
  if (!site.adsense_client || !slot) return "";
  return `<aside class="ad-slot" aria-label="Quảng cáo"><span class="ad-label">Quảng cáo</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(site.adsense_client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>`;
}

export function sourcesBlock(sources, updated, reviewer) {
  if (!sources.length && !updated) return "";
  return `<section class="sources">
  <h2>Nguồn tham khảo</h2>
  <ul>${sources.map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.name)}</a>` : esc(s.name)}</li>`).join("")}</ul>
  <p class="muted">${updated ? `Cập nhật: ${esc(updated)}` : ""}${reviewer ? ` · Kiểm duyệt: ${esc(reviewer)}` : ""}</p>
</section>`;
}

export const emptyState = (title, text) =>
  `<div class="empty"><p class="empty-title">${esc(title)}</p><p>${esc(text)}</p></div>`;

/** Video nhúng nhẹ: chỉ ảnh thu nhỏ, bấm mới tải trình phát. playlist = id các video phát tiếp. */
export function liteVideo(v, playlist = []) {
  const id = esc(v.youtube_id);
  return `<figure class="video">
  <button class="lite-yt" type="button" data-id="${id}" data-playlist="${esc(playlist.join(","))}" aria-label="Phát video: ${esc(v.tieu_de)}">
    <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
    <span class="play" aria-hidden="true"></span>
  </button>
  <figcaption><strong>${esc(v.tieu_de)}</strong>${v.kenh ? `<span class="muted"> · ${esc(v.kenh)}</span>` : ""}</figcaption>
</figure>`;
}

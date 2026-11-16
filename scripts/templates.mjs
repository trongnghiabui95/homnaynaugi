// Khung HTML dùng chung cho mọi trang.
import { esc } from "./lib.mjs";

const ICON = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6L20.5 7H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/>',
  people: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.8 14.2c2.4.2 4.2 1.8 4.7 4.8"/>',
  chef: '<path d="M7 14.5V19h10v-4.5"/><path d="M7 14.5A4 4 0 0 1 6.5 6.6 4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 5.5 2.6A4 4 0 0 1 17 14.5z"/><path d="M7 16.5h10"/>',
  play: '<circle cx="12" cy="12" r="8.5"/><path d="M10.2 8.8v6.4l5-3.2z"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.8l2.4 1.5M9.5 3.5h5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  text: '<path d="M4 18 8.5 6h1L14 18M5.6 14h6.8M15 18l2.7-7h.6L21 18M15.8 16h4.4"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/>',
  flame: '<path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.4-2.6-5.6-3.6-8.9-2 1.4-2.7 3.1-2.7 4.6-1-.7-1.8-1.9-2-3.3C8 9.6 6 12 6 15.4 6 18.6 8.4 21 12 21z"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19c3-4 6-7 10-9"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2.5"/><path d="M5 15.5V6a2 2 0 0 1 2-2h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/>',
};
export const icon = (name, cls = "ic") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

const NAV = [
  ["/", "Trang chủ", "home"],
  ["/danh-muc/", "Danh mục", "grid"],
  ["/tim-kiem/", "Tìm món", "search"],
  ["/di-cho/", "Đi chợ", "cart"],
  ["/da-luu/", "Sổ tay", "heart"],
];
// Khi đã có ít nhất 1 video: mục Video thay mục Danh mục ở thanh dưới (tối đa 5 mục); Danh mục chuyển xuống chân trang.
const NAV_VIDEO = ["/video/", "Video", "play"];
const FOOT = [
  ["/gioi-thieu/", "Giới thiệu"],
  ["/video/", "Tất cả video"],
  ["/ban-quyen-video/", "Bản quyền video"],
  ["/chinh-sach-bao-mat/", "Chính sách bảo mật"],
  ["/dieu-khoan/", "Điều khoản sử dụng"],
  ["/lien-he/", "Liên hệ"],
];

// Ảnh xem trước khi chia sẻ link (Zalo, Facebook, TikTok…): ảnh món nếu có, không thì ảnh mặc định của web 1200×630.
export const OG_MAC_DINH = { path: "/assets/og-mac-dinh.png", w: 1200, h: 630 };
function ogTags(site, p) {
  const img = p.ogImage || site.site_url + OG_MAC_DINH.path;
  const size = p.ogImage ? "" : `\n<meta property="og:image:width" content="${OG_MAC_DINH.w}">\n<meta property="og:image:height" content="${OG_MAC_DINH.h}">`;
  return `<meta property="og:image" content="${esc(img)}">${size}
<meta property="og:image:alt" content="${esc(p.ogImage ? p.title : site.site_name)}">
<meta name="twitter:card" content="summary_large_image">`;
}

/** @param p { path, title, description, body, page, jsonld[], crumbs[[name,path]], noindex, ogType, ogImage } */
export function layout(site, p) {
  const url = site.site_url + p.path;
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
      itemListElement: [["Trang chủ", "/"], ...p.crumbs].map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: site.site_url + u })),
    });
  }
  const active = (u) => (u === "/" ? p.path === "/" : p.path.startsWith(u));
  const nav = NAV.map((n) => (site.has_video && n[0] === "/danh-muc/" ? NAV_VIDEO : n));
  const foot = site.has_video ? [FOOT[0], ["/danh-muc/", "Danh mục"], ...FOOT.slice(1)] : FOOT;
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
${ogTags(site, p)}
<meta name="theme-color" content="#faf8f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1d1a17" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lora:wght@600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css?v=${site.build_id}">
<script>try{var s=JSON.parse(localStorage.getItem("hnng-prefs")||"{}");if(s.theme)document.documentElement.dataset.theme=s.theme;if(s.big)document.documentElement.dataset.big="1"}catch(e){}</script>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n")}
${adsense}
</head>
<body data-page="${p.page || "content"}">
<a class="skip" href="#main">Bỏ qua đến nội dung</a>
<header class="topbar">
  <a class="brand" href="/"><img src="/assets/icons/icon.svg" alt="" width="30" height="30"><span>${esc(site.site_name)}</span></a>
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
  <nav class="footer-links">${foot.filter(([u]) => u !== "/video/" || site.has_video).map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
  <p class="muted">Video thuộc bản quyền của các kênh YouTube được ghi tên, nhúng theo chức năng chia sẻ của YouTube.</p>
  <p class="muted">© ${new Date().getFullYear()} ${esc(site.site_name)}</p>
</footer>
<nav class="tabbar" aria-label="Điều hướng chính">
${nav.map(([u, n, ic]) => `<a href="${u}"${active(u) ? ' aria-current="page"' : ""}>${icon(ic)}<span>${n}</span><b class="badge" data-badge="${ic}" hidden></b></a>`).join("\n")}
</nav>
<div class="timer-chip" data-timer-chip hidden></div>
<script type="module" src="/assets/app.js?v=${site.build_id}"></script>
</body>
</html>`;
}

/** Khung quảng cáo: chỉ hiện khi đã có mã AdSense trong settings. Giữ chỗ cố định để trang không giật. */
export function adSlot(site, key) {
  const slot = site[`adsense_slot_${key}`];
  if (!site.adsense_client || !slot) return "";
  return `<aside class="ad-slot" aria-label="Quảng cáo"><span class="ad-label">Quảng cáo</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(site.adsense_client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>`;
}

export const emptyState = (title, text = "") =>
  `<div class="empty"><p class="empty-title">${esc(title)}</p>${text ? `<p>${esc(text)}</p>` : ""}</div>`;

export const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Thẻ món: ảnh 4:3 có badge thời gian, độ khó, calo, video. attrs = thêm data-* để lọc/sắp xếp phía trình duyệt. */
export function recipeCard(r, attrs = false) {
  const data = attrs ? ` data-k="${esc((r.do_kho || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())}" data-m="${r.total || 0}" data-cal="${r.cal || 0}" data-d="${esc(r.cap_nhat || "")}"` : "";
  return `<a class="rcard" href="/mon/${r.slug}/"${data}>
  <div class="rcard-img">${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" width="480" height="360">` : `<span class="rcard-emoji" aria-hidden="true">${esc(r.cat?.bieu_tuong || "🍽️")}</span>`}
    ${r.yt ? `<span class="badge-video">${icon("play")} Video</span>` : ""}
    <span class="badges">${r.total ? `<span>${icon("clock")} ${r.total} phút</span>` : ""}${r.do_kho ? `<span>${esc(r.do_kho)}</span>` : ""}${r.cal ? `<span>${r.cal} kcal</span>` : ""}</span>
  </div>
  <div class="rcard-body"><small class="rcard-cat">${esc(r.cat?.ten || "")}</small><strong>${esc(r.ten)}</strong></div>
</a>`;
}

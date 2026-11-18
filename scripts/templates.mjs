// Khung HTML dùng chung cho mọi trang.
import { esc } from "./lib.mjs";
import { tr, diffText, PREFIX, LOCALE, LANGS } from "./i18n.mjs";

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
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19c3-4 6-7 10-9"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2.5"/><path d="M5 15.5V6a2 2 0 0 1 2-2h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  loa: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/>',
};
export const icon = (name, cls = "ic") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

const NAV = [
  ["/", "nav_home", "home"],
  ["/danh-muc/", "nav_cats", "grid"],
  ["/tim-kiem/", "nav_search", "search"],
  ["/di-cho/", "nav_shop", "cart"],
  ["/da-luu/", "nav_saved", "heart"],
];
// Khi đã có ít nhất 1 video: mục Video thay mục Danh mục ở thanh dưới (tối đa 5 mục); Danh mục chuyển xuống chân trang.
const NAV_VIDEO = ["/video/", "nav_video", "play"];
const FOOT = [
  ["/gioi-thieu/", "foot_about"],
  ["/video/", "foot_videos"],
  ["/ban-quyen-video/", "foot_video_rights"],
  ["/chinh-sach-bao-mat/", "foot_privacy"],
  ["/dieu-khoan/", "foot_terms"],
  ["/lien-he/", "foot_contact"],
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

/** Đường dẫn tuyệt đối của một trang theo ngôn ngữ: abs(site, "en", "/mon/x/") → https://…/en/mon/x/ */
export const abs = (site, lang, path) => site.site_url + PREFIX[lang] + path;

/**
 * site.lang = "vi" | "en". Link nội bộ trong HTML vẫn viết "/x"; page() trong build.mjs đổi thành "/en/x" cho bản tiếng Anh.
 * Tên món, danh mục (nội dung chưa dịch) đặt trong phần tử lang="vi" để trình đọc màn hình đọc đúng giọng.
 * @param p { path, title, description, body, page, jsonld[], crumbs[[name,path,isContent]], noindex, ogType, ogImage, titleVi }
 */
/** Logo yendan (PA1, #88): chim yến màu primary + chữ "yendan" Nunito 900 đã chuyển thành nét; chữ theo màu chữ, tự đổi theo sáng/đêm. Bản màu cố định: src/assets/yendan.svg */
const YENDAN = `<svg viewBox="0 0 253 80" role="img" aria-labelledby="yd-t"><title id="yd-t">yendan</title><path style="fill:var(--primary)" transform="translate(2 6) scale(.64)" d="M95 27C89 23.5 82 23 76.5 26.5C68 20 52 12 14 8C32 17 46 26 55 36C45 39 33 45 14 60C30 56 41 53 49 51C44 60 39 70 33 85C46 72 55 61 61 52C69 48 77 41 82 34C86 31.5 90 29.5 95 27Z"/><circle style="fill:var(--bg)" cx="53.5" cy="24.3" r="1.3"/><path fill="currentColor" d="M80.1 67.8Q78.5 67.8 77.5 67Q76.6 66.2 76.3 64.8Q76.1 63.5 76.8 62L80.2 54.4V58.2L71.4 37.8Q70.7 36.3 70.9 34.9Q71.1 33.6 72.3 32.8Q73.4 31.9 75.4 31.9Q77.1 31.9 78.1 32.7Q79.1 33.5 79.9 35.6L85.1 49.2H83.4L88.9 35.6Q89.7 33.5 90.8 32.7Q91.8 31.9 93.7 31.9Q95.2 31.9 96.2 32.8Q97.1 33.6 97.3 34.9Q97.5 36.3 96.8 37.8L85 64.3Q84.1 66.4 83 67.1Q81.9 67.8 80.1 67.8ZM114.3 58.6Q109.6 58.6 106.2 56.9Q102.8 55.3 100.9 52.3Q99.1 49.3 99.1 45.2Q99.1 41.2 100.9 38.2Q102.6 35.2 105.6 33.5Q108.7 31.8 112.6 31.8Q115.4 31.8 117.8 32.8Q120.1 33.7 121.8 35.4Q123.5 37.1 124.3 39.6Q125.2 42 125.2 45.1Q125.2 46.1 124.6 46.6Q124 47.1 122.8 47.1H106.9V42.7H118.4L117.6 43.4Q117.6 41.5 117.1 40.3Q116.5 39.1 115.5 38.4Q114.5 37.8 113 37.8Q111.4 37.8 110.2 38.6Q109.1 39.3 108.4 40.8Q107.8 42.2 107.8 44.4V44.9Q107.8 48.6 109.4 50.2Q111.1 51.8 114.5 51.8Q115.7 51.8 117.1 51.5Q118.6 51.2 120 50.7Q121.3 50.1 122.3 50.5Q123.3 50.8 123.8 51.6Q124.4 52.4 124.4 53.5Q124.5 54.5 124 55.4Q123.5 56.4 122.3 56.9Q120.4 57.7 118.4 58.2Q116.3 58.6 114.3 58.6ZM133.2 58.5Q131 58.5 129.9 57.3Q128.7 56.1 128.7 53.8V36.6Q128.7 34.3 129.8 33.1Q131 31.9 133.2 31.9Q135.4 31.9 136.5 33.1Q137.7 34.3 137.7 36.6V39L137.1 36.9Q138.3 34.4 140.6 33.1Q143 31.8 145.9 31.8Q149 31.8 151 33Q152.9 34.2 153.9 36.7Q154.9 39.1 154.9 42.9V53.8Q154.9 56.1 153.7 57.3Q152.5 58.5 150.3 58.5Q148.1 58.5 146.9 57.3Q145.7 56.1 145.7 53.8V43.2Q145.7 40.9 144.9 39.9Q144 38.9 142.5 38.9Q140.4 38.9 139.2 40.2Q137.9 41.6 137.9 43.8V53.8Q137.9 58.5 133.2 58.5ZM169.6 58.6Q166.4 58.6 163.8 57Q161.3 55.3 159.9 52.3Q158.5 49.3 158.5 45.2Q158.5 41 159.9 38Q161.3 35.1 163.8 33.5Q166.4 31.8 169.6 31.8Q172.5 31.8 174.8 33.2Q177.1 34.5 177.8 36.7H177.3V25.6Q177.3 23.3 178.5 22.1Q179.7 20.9 181.9 20.9Q184.1 20.9 185.3 22.1Q186.5 23.3 186.5 25.6V53.8Q186.5 56.1 185.4 57.3Q184.2 58.5 182 58.5Q179.8 58.5 178.6 57.3Q177.4 56.1 177.4 53.8V50.8L178 53.4Q177.2 55.7 174.9 57.1Q172.6 58.6 169.6 58.6ZM172.6 51.8Q174 51.8 175.1 51.1Q176.2 50.4 176.8 48.9Q177.4 47.5 177.4 45.2Q177.4 41.7 176 40.2Q174.7 38.7 172.6 38.7Q171.2 38.7 170.1 39.3Q169 40 168.4 41.4Q167.8 42.9 167.8 45.2Q167.8 48.6 169.1 50.2Q170.5 51.8 172.6 51.8ZM200.3 58.6Q197.3 58.6 195 57.5Q192.8 56.4 191.5 54.5Q190.2 52.6 190.2 50.1Q190.2 47.3 191.7 45.7Q193.1 44.1 196.4 43.4Q199.6 42.7 204.9 42.7H207.8V47.1H204.9Q202.9 47.1 201.6 47.4Q200.3 47.7 199.6 48.2Q199 48.8 199 49.8Q199 51 199.9 51.8Q200.7 52.5 202.3 52.5Q203.6 52.5 204.7 52Q205.7 51.4 206.3 50.4Q206.9 49.4 206.9 48V42Q206.9 40.1 206 39.3Q205 38.6 202.7 38.6Q201.4 38.6 199.8 38.8Q198.3 39.1 196.4 39.9Q195 40.4 194 40Q193 39.6 192.4 38.8Q191.9 37.9 191.9 36.8Q191.9 35.8 192.6 34.9Q193.2 33.9 194.6 33.4Q197.1 32.5 199.2 32.2Q201.3 31.8 203.1 31.8Q207.3 31.8 210.1 33.1Q212.9 34.3 214.3 36.8Q215.7 39.3 215.7 43.3V53.8Q215.7 56.1 214.6 57.3Q213.5 58.5 211.4 58.5Q209.3 58.5 208.1 57.3Q207 56.1 207 53.8V52.4L207.3 53.2Q207.1 54.8 206.1 56Q205.2 57.2 203.7 57.9Q202.2 58.6 200.3 58.6ZM225 58.5Q222.8 58.5 221.6 57.3Q220.4 56.1 220.4 53.8V36.6Q220.4 34.3 221.6 33.1Q222.7 31.9 224.9 31.9Q227.1 31.9 228.2 33.1Q229.4 34.3 229.4 36.6V39L228.8 36.9Q230.1 34.4 232.4 33.1Q234.7 31.8 237.6 31.8Q240.7 31.8 242.7 33Q244.7 34.2 245.7 36.7Q246.6 39.1 246.6 42.9V53.8Q246.6 56.1 245.4 57.3Q244.3 58.5 242 58.5Q239.8 58.5 238.6 57.3Q237.4 56.1 237.4 53.8V43.2Q237.4 40.9 236.6 39.9Q235.8 38.9 234.2 38.9Q232.1 38.9 230.9 40.2Q229.6 41.6 229.6 43.8V53.8Q229.6 58.5 225 58.5Z"/></svg>`;

export function layout(site, p) {
  const lang = site.lang || "vi", t = tr(lang), other = LANGS.find((l) => l !== lang);
  const url = abs(site, lang, p.path);
  const fullTitle = p.path === "/" ? `${site.site_name} – ${site.tagline}` : `${p.title} | ${site.site_name}`;
  // Nút đổi ngôn ngữ: sang đúng trang tương ứng. Trang 404 không có bản tương ứng nên về trang chủ.
  // "/__vi__/…" là đánh dấu để build không thêm /en vào link trỏ về bản tiếng Việt.
  const altPath = p.path === "/404" ? "/" : p.path;
  const altHref = other === "en" ? "/en" + altPath : "/__vi__" + altPath;
  const vi = (n, on) => (on && lang !== "vi" ? `<span lang="vi">${esc(n)}</span>` : esc(n));
  const crumbs = p.crumbs?.length
    ? `<nav class="crumbs" aria-label="${t("crumbs")}"><a href="/">${t("nav_home")}</a>${p.crumbs
        .map(([n, u, c], i) => (i === p.crumbs.length - 1 ? ` <span>›</span> <span aria-current="page">${vi(n, c)}</span>` : ` <span>›</span> <a href="${u}">${vi(n, c)}</a>`))
        .join("")}</nav>`
    : "";
  const ld = [...(p.jsonld || [])];
  if (p.crumbs?.length) {
    ld.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [[t("nav_home"), "/"], ...p.crumbs].map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: abs(site, lang, u) })),
    });
  }
  const active = (u) => (u === "/" ? p.path === "/" : p.path.startsWith(u));
  const nav = NAV.map((n) => (site.has_video && n[0] === "/danh-muc/" ? NAV_VIDEO : n));
  const foot = site.has_video ? [FOOT[0], ["/danh-muc/", "nav_cats"], ...FOOT.slice(1)] : FOOT;
  const adsense = site.adsense_client
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(site.adsense_client)}" crossorigin="anonymous"></script>`
    : "";
  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${esc(url)}">
${p.path === "/404" ? "" : LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(abs(site, l, p.path))}">`).join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${esc(abs(site, "vi", p.path))}">`}
${p.noindex || site.preview ? '<meta name="robots" content="noindex">' : ""}${p.path === "/" && site.google_site_verification && !site.preview ? `\n<meta name="google-site-verification" content="${esc(site.google_site_verification)}">` : ""}
<meta property="og:type" content="${p.ogType || "website"}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${esc(site.site_name)}">
<meta property="og:locale" content="${LOCALE[lang]}">
<meta property="og:locale:alternate" content="${LOCALE[other]}">
${ogTags(site, p)}
<meta name="theme-color" content="#1a1210">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Nunito:wght@800;900&display=swap">
<link rel="stylesheet" href="/assets/basecoat.css?v=${site.build_id}">
<link rel="stylesheet" href="/assets/style.css?v=${site.build_id}">${{ home: 1, recipe: 1, video: 1, shop: 1, list: 1 }[p.page] ? `\n<link rel="stylesheet" href="/assets/${p.page}.css?v=${site.build_id}">` : ""}
<script>document.documentElement.classList.add("js");try{var s=JSON.parse(localStorage.getItem("hnng-prefs")||"{}");if(s.theme==="light"){document.documentElement.dataset.theme="light";document.querySelector('meta[name="theme-color"]').content="#fff8ef"}if(s.big)document.documentElement.dataset.big="1"${p.path === "/404" ? "" : `;var h=document.documentElement,b=h.dataset.base||"",q=location.pathname.slice(b.length);if(s.lang&&s.lang!==h.lang)location.replace(b+(s.lang==="en"?"/en"+q:q.replace(/^\\/en(\\/|$)/,"/"))+location.search+location.hash)`}}catch(e){}</script>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n")}
${adsense}
</head>
<body data-page="${p.page || "content"}">
<a class="skip" href="#main">${t("skip")}</a>
<header class="topbar">
  <a class="brand" href="/"><img src="/assets/icons/icon.svg" alt="" width="30" height="30"><span lang="vi">${esc(site.site_name)}</span></a>
  <div class="topbar-actions">
    <a class="icon-btn" href="${altHref}" hreflang="${other}" lang="${other}" data-lang="${other}" aria-label="${t("lang_switch_label")}" title="${t("lang_switch_title")}">${t("lang_switch_text")}</a>
    <button class="icon-btn" type="button" data-toggle="big" aria-label="${t("big_text")}" title="${t("big_text")}">${icon("text")}</button>
    <button class="icon-btn" type="button" data-toggle="theme" aria-label="${t("light_mode")}" title="${t("light_mode")}">${icon("moon")}</button>
  </div>
</header>
<main id="main" class="wrap">
${crumbs}
${p.body}
</main>
<footer class="footer wrap">
  <nav class="footer-links">${foot.filter(([u]) => u !== "/video/" || site.has_video).map(([u, n]) => `<a href="${u}">${t(n)}</a>`).join("")}</nav>
  <p class="muted">${t("foot_video_note")}</p>
  <p class="by"><span>${t("made_by")}</span> <span class="yendan">${YENDAN}</span></p>
  <p class="muted">© ${new Date().getFullYear()} <span lang="vi">${esc(site.site_name)}</span></p>
</footer>
<nav class="tabbar" aria-label="${t("main_nav")}">
${nav.map(([u, n, ic]) => `<a href="${u}"${active(u) ? ' aria-current="page"' : ""}>${icon(ic)}<span>${t(n)}</span><b class="badge" data-badge="${ic}" hidden></b></a>`).join("\n")}
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
  const t = tr(site.lang || "vi");
  return `<aside class="ad-slot" aria-label="${t("ad")}"><span class="ad-label">${t("ad")}</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(site.adsense_client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>`;
}

export const emptyState = (title, text = "") =>
  `<div class="empty"><p class="empty-title">${esc(title)}</p>${text ? `<p>${esc(text)}</p>` : ""}</div>`;

export const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Khung trung tính khi món chưa có ảnh (hoặc ảnh hỏng link): nền ấm + tên món chữ Be Vietnam Pro đậm, không giả làm ảnh. Ảnh thật nằm đè lên trên. */
export const noPhoto = (ten, l = "vi") => `<span class="ph" aria-hidden="true"><span${l ? ` lang="${l}"` : ""}>${esc(ten)}</span></span>`;

/** Thẻ món: ảnh 4:3 có badge thời gian, độ khó, calo, video. attrs = thêm data-* để lọc/sắp xếp phía trình duyệt. */
export function recipeCard(r, attrs = false, lang = "vi") {
  const t = tr(lang);
  // Chữ tiếng Việt chưa dịch (lv = "vi") hoặc không rõ (chưa qua localize) → lang="vi"; đã dịch → không đặt lang (theo trang).
  const L = (lv) => (lv === undefined || lv ? "vi" : "");
  const A = (l) => (l ? ` lang="${l}"` : "");
  const data = attrs ? ` data-k="${esc((r.do_kho || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())}" data-m="${r.total || 0}" data-cal="${r.cal || 0}" data-d="${esc(r.cap_nhat || "")}"` : "";
  const k = (r.do_kho || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return `<a class="rcard${["de", "vua", "kho"].includes(k) ? ` k-${k}` : ""}" href="/mon/${r.slug}/"${data}>
  <div class="rcard-img">${noPhoto(r.ten, L(r.lv?.ten))}${r.img ? `<img${r.imgDoc ? ' class="yt-doc"' : ""} src="${esc(r.img)}" alt="" loading="lazy" decoding="async" width="480" height="360">` : ""}
    ${r.yt ? `<span class="badge-video">${icon("play")} ${t("video")}</span>` : ""}
  </div>
  <div class="rcard-body"><small class="rcard-cat"${A(L(r.cat?.lv?.ten))}>${esc(r.cat?.ten || "")}</small><strong${A(L(r.lv?.ten))}>${esc(r.ten)}</strong>
    <span class="rcard-meta"><span>${r.total ? `${icon("clock")} ${t("min", r.total)}` : ""}</span>${r.do_kho ? `<b>${esc(diffText(t, k, r.do_kho))}</b>` : ""}</span></div>
</a>`;
}

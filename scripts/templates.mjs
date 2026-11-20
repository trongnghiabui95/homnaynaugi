// Khung HTML dùng chung cho mọi trang.
import { esc } from "./lib.mjs";
import { tr, diffText, PREFIX, LOCALE, LANGS, LANG_NAME, LANG_CODE } from "./i18n.mjs";

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
 * site.lang = "vi" | "en" | "ja" | "ko" | "fr". Link nội bộ trong HTML vẫn viết "/x"; page() trong build.mjs thêm tiền tố ngôn ngữ ("/en/x", "/ja/x"…).
 * Tên món, danh mục (nội dung chưa dịch) đặt trong phần tử lang="vi" để trình đọc màn hình đọc đúng giọng.
 * @param p { path, title, description, body, page, jsonld[], crumbs[[name,path,isContent]], noindex, ogType, ogImage, titleVi }
 */
/** Logo yendan (#88): theo tên bé Yên Đan, biệt danh Cherry. Bụng chữ d là quả cherry, thân chữ d là cuống, lá ở đỉnh. Chữ Nunito 900 đã chuyển thành nét, màu currentColor (CSS .yendan: đỏ garnet ban ngày, hồng nhạt ban đêm). Bản màu cố định: src/assets/yendan.svg, ops/logo/ */
const YENDAN = `<svg viewBox="0 0 213 80" role="img" aria-labelledby="yd-t"><title id="yd-t">yendan</title><path d="M14.9 74.6Q13.2 74.6 12.1 73.7Q11.1 72.8 10.8 71.3Q10.6 69.9 11.3 68.3L15 60.1V64.2L5.5 42.3Q4.7 40.6 5 39.1Q5.2 37.7 6.5 36.8Q7.7 35.9 9.8 35.9Q11.6 35.9 12.7 36.8Q13.8 37.6 14.7 39.9L20.3 54.5H18.4L24.3 39.9Q25.2 37.6 26.4 36.8Q27.5 35.9 29.5 35.9Q31.2 35.9 32.2 36.8Q33.2 37.7 33.4 39.1Q33.6 40.6 32.9 42.3L20.2 70.8Q19.2 73.1 18 73.8Q16.8 74.6 14.9 74.6ZM52.2 64.6Q47.2 64.6 43.5 62.9Q39.8 61.1 37.9 57.8Q35.9 54.6 35.9 50.2Q35.9 45.9 37.8 42.7Q39.7 39.5 42.9 37.7Q46.2 35.8 50.4 35.8Q53.5 35.8 56 36.8Q58.5 37.8 60.3 39.7Q62.1 41.5 63.1 44.2Q64 46.8 64 50.1Q64 51.2 63.4 51.7Q62.7 52.2 61.4 52.2H44.3V47.5H56.7L55.8 48.3Q55.8 46.2 55.2 44.9Q54.7 43.6 53.6 42.9Q52.5 42.3 50.9 42.3Q49.1 42.3 47.9 43.1Q46.6 43.9 45.9 45.5Q45.3 47 45.3 49.4V49.9Q45.3 53.9 47 55.6Q48.8 57.3 52.5 57.3Q53.7 57.3 55.3 57Q56.9 56.7 58.4 56.1Q59.8 55.5 60.9 55.9Q62 56.3 62.5 57.1Q63.1 58 63.2 59.1Q63.2 60.2 62.7 61.2Q62.1 62.3 60.8 62.8Q58.9 63.7 56.7 64.2Q54.5 64.6 52.2 64.6ZM73.2 64.5Q70.9 64.5 69.6 63.2Q68.3 61.9 68.3 59.5V40.9Q68.3 38.5 69.5 37.2Q70.8 35.9 73.2 35.9Q75.5 35.9 76.7 37.2Q78 38.5 78 40.9V43.6L77.4 41.3Q78.7 38.6 81.2 37.2Q83.7 35.8 86.9 35.8Q90.2 35.8 92.3 37.1Q94.4 38.4 95.5 41Q96.6 43.7 96.6 47.7V59.5Q96.6 61.9 95.3 63.2Q94 64.5 91.6 64.5Q89.2 64.5 87.9 63.2Q86.6 61.9 86.6 59.5V48.1Q86.6 45.6 85.7 44.5Q84.9 43.4 83.2 43.4Q80.9 43.4 79.6 44.9Q78.3 46.3 78.3 48.7V59.5Q78.3 64.5 73.2 64.5Z" fill="currentColor"/><path d="M134.3 64V20C134.3 12 139.3 8 145.3 6" style="stroke:var(--yd-cuong)" stroke-width="7.5" fill="none" stroke-linecap="round"/><path transform="translate(144.3 7) rotate(-25) scale(0.6)" d="M0 0C6 -12 22 -16 34 -10C26 2 12 6 0 0Z" fill="#16A34A"/><path transform="translate(144.3 7) rotate(-25) scale(0.6)" d="M2 -1C12 -6 22 -9 30 -9" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M118.3 34.7C124.3 30.7 135.3 33.5 135.3 48.9C135.3 60.8 126.8 65 118.3 65C109.8 65 101.3 60.8 101.3 48.9C101.3 33.5 112.4 30.7 118.3 34.7Z" fill="#D21F3C"/><ellipse cx="111.2" cy="43.8" rx="3.1" ry="5.1" transform="rotate(25 111.2 43.8)" fill="#fff" fill-opacity=".55"/><path d="M155.8 64.6Q152.6 64.6 150.2 63.4Q147.7 62.3 146.4 60.2Q145 58.2 145 55.5Q145 52.5 146.6 50.8Q148.1 49 151.6 48.3Q155.1 47.5 160.8 47.5H163.9V52.2H160.8Q158.7 52.2 157.2 52.5Q155.8 52.9 155.1 53.5Q154.5 54.1 154.5 55.2Q154.5 56.4 155.4 57.3Q156.3 58.1 158 58.1Q159.4 58.1 160.5 57.5Q161.6 56.9 162.3 55.8Q163 54.7 163 53.2V46.8Q163 44.7 161.9 43.9Q160.9 43.1 158.4 43.1Q157 43.1 155.4 43.4Q153.7 43.7 151.6 44.5Q150.1 45 149 44.6Q148 44.2 147.4 43.3Q146.8 42.3 146.8 41.2Q146.8 40.1 147.5 39.1Q148.2 38.1 149.7 37.5Q152.4 36.5 154.7 36.2Q156.9 35.8 158.8 35.8Q163.4 35.8 166.4 37.1Q169.4 38.5 170.9 41.2Q172.4 43.9 172.4 48.2V59.5Q172.4 61.9 171.2 63.2Q170 64.5 167.8 64.5Q165.5 64.5 164.3 63.2Q163.1 61.9 163.1 59.5V58L163.4 58.8Q163.1 60.6 162.1 61.9Q161.1 63.2 159.5 63.9Q157.9 64.6 155.8 64.6ZM183 64.5Q180.6 64.5 179.3 63.2Q178 61.9 178 59.5V40.9Q178 38.5 179.3 37.2Q180.6 35.9 182.9 35.9Q185.3 35.9 186.5 37.2Q187.7 38.5 187.7 40.9V43.6L187.1 41.3Q188.4 38.6 190.9 37.2Q193.4 35.8 196.6 35.8Q199.9 35.8 202.1 37.1Q204.2 38.4 205.2 41Q206.3 43.7 206.3 47.7V59.5Q206.3 61.9 205 63.2Q203.7 64.5 201.3 64.5Q198.9 64.5 197.6 63.2Q196.3 61.9 196.3 59.5V48.1Q196.3 45.6 195.5 44.5Q194.6 43.4 192.9 43.4Q190.7 43.4 189.3 44.9Q188 46.3 188 48.7V59.5Q188 64.5 183 64.5Z" fill="currentColor"/></svg>`;

export function layout(site, p) {
  const lang = site.lang || "vi", t = tr(lang), others = LANGS.filter((l) => l !== lang);
  const url = abs(site, lang, p.path);
  const fullTitle = p.path === "/" ? `${site.site_name} – ${site.tagline}` : `${p.title} | ${site.site_name}`;
  // Nút đổi ngôn ngữ: sang đúng trang tương ứng. Trang 404 không có bản tương ứng nên về trang chủ.
  // "/__l-xx__/…" là đánh dấu: build đổi thành đúng tiền tố của ngôn ngữ xx (vi → "/", en → "/en/"…), không thêm tiền tố trang hiện tại.
  const altPath = p.path === "/404" ? "/" : p.path;
  const altHref = (l) => `/__l-${l}__${altPath}`;
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
${others.map((l) => `<meta property="og:locale:alternate" content="${LOCALE[l]}">`).join("\n")}
${ogTags(site, p)}
<meta name="theme-color" content="#1a1210">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Nunito:wght@800;900&display=swap">
<link rel="stylesheet" href="/assets/basecoat.css?v=${site.build_id}">
<link rel="stylesheet" href="/assets/style.css?v=${site.build_id}">${{ home: 1, recipe: 1, video: 1, shop: 1, list: 1, search: 1 }[p.page] ? `\n<link rel="stylesheet" href="/assets/${p.page}.css?v=${site.build_id}">` : ""}
<script>document.documentElement.classList.add("js");try{var s=JSON.parse(localStorage.getItem("hnng-prefs")||"{}");if(s.theme==="light"){document.documentElement.dataset.theme="light";document.querySelector('meta[name="theme-color"]').content="#fff8ef"}if(s.big)document.documentElement.dataset.big="1"${p.path === "/404" ? "" : `;var h=document.documentElement,b=h.dataset.base||"",q=location.pathname.slice(b.length),P=${JSON.stringify(PREFIX)};if(s.lang&&s.lang!==h.lang&&s.lang in P)location.replace(b+P[s.lang]+q.replace(/^\\/(${LANGS.filter((l) => PREFIX[l]).join("|")})(\\/|$)/,"/")+location.search+location.hash)`}}catch(e){}</script>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n")}
${adsense}
</head>
<body data-page="${p.page || "content"}">
<a class="skip" href="#main">${t("skip")}</a>
<header class="topbar">
  <a class="brand" href="/"><img src="/assets/icons/icon.svg" alt="" width="30" height="30"><span lang="vi">${esc(site.site_name)}</span></a>
  <div class="topbar-actions">
    <details class="lang-menu"><summary class="icon-btn" aria-label="${t("lang_menu")}" title="${t("lang_menu")}">${LANG_CODE[lang]}</summary><ul>${LANGS.map((l) => `<li><a href="${altHref(l)}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === lang ? ' aria-current="true"' : ""}>${LANG_NAME[l]}</a></li>`).join("")}</ul></details>
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

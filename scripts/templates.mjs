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
${p.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="${p.ogType || "website"}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${esc(site.site_name)}">
<meta property="og:locale" content="${LOCALE[lang]}">
<meta property="og:locale:alternate" content="${LOCALE[other]}">
${ogTags(site, p)}
<meta name="theme-color" content="#1d1a17">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lora:wght@600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css?v=${site.build_id}">
<script>document.documentElement.classList.add("js");try{var s=JSON.parse(localStorage.getItem("hnng-prefs")||"{}");if(s.theme==="light"){document.documentElement.dataset.theme="light";document.querySelector('meta[name="theme-color"]').content="#faf8f5"}if(s.big)document.documentElement.dataset.big="1"${p.path === "/404" ? "" : `;var h=document.documentElement,b=h.dataset.base||"",q=location.pathname.slice(b.length);if(s.lang&&s.lang!==h.lang)location.replace(b+(s.lang==="en"?"/en"+q:q.replace(/^\\/en(\\/|$)/,"/"))+location.search+location.hash)`}}catch(e){}</script>
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
  <p class="by"><span>${t("made_by")}</span> <span class="yendan"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M2.5 9.5c4.2.2 7.6 1.9 10.2 5.1l2.6-4.4c1.3-2.2 3.6-3.6 6.2-3.6 1.9 0 3.6.7 4.9 2l-3 1.1 1.6 1.4c-.6 4.8-4.7 8.4-9.6 8.4h-2.6L7 27.5l2.3-7.6C5.4 17.8 3.2 14 2.5 9.5z"/><circle cx="21.8" cy="9.4" r="1" fill="var(--bg)"/></svg>yendan</span></p>
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

/** Khung trung tính khi món chưa có ảnh (hoặc ảnh hỏng link): nền ấm + tên món chữ Lora, không giả làm ảnh. Ảnh thật nằm đè lên trên. */
export const noPhoto = (ten) => `<span class="ph" aria-hidden="true"><span lang="vi">${esc(ten)}</span></span>`;

/** Thẻ món: ảnh 4:3 có badge thời gian, độ khó, calo, video. attrs = thêm data-* để lọc/sắp xếp phía trình duyệt. */
export function recipeCard(r, attrs = false, lang = "vi") {
  const t = tr(lang);
  const data = attrs ? ` data-k="${esc((r.do_kho || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())}" data-m="${r.total || 0}" data-cal="${r.cal || 0}" data-d="${esc(r.cap_nhat || "")}"` : "";
  const k = (r.do_kho || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return `<a class="rcard${["de", "vua", "kho"].includes(k) ? ` k-${k}` : ""}" href="/mon/${r.slug}/"${data}>
  <div class="rcard-img">${noPhoto(r.ten)}${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" decoding="async" width="480" height="360">` : ""}
    ${r.yt ? `<span class="badge-video">${icon("play")} ${t("video")}</span>` : ""}
  </div>
  <div class="rcard-body"><small class="rcard-cat" lang="vi">${esc(r.cat?.ten || "")}</small><strong lang="vi">${esc(r.ten)}</strong>
    <span class="rcard-meta"><span>${r.total ? `${icon("clock")} ${t("min", r.total)}` : ""}</span>${r.do_kho ? `<b>${esc(diffText(t, k, r.do_kho))}</b>` : ""}</span></div>
</a>`;
}

// Hôm Nay Nấu Gì — JS phía trình duyệt. Sổ tay món ngon, danh sách đi chợ, mâm cơm vừa quay chỉ lưu trên máy (IndexedDB).
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fold = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
// Đường dẫn gốc khi web chạy trong thư mục con (GitHub Pages: /ten-repo).
const BASE = document.documentElement.dataset.base || "";
// Ngôn ngữ trang (vi: "/", en: "/en/"). Link trang dùng LP; dữ liệu, tài nguyên tĩnh dùng BASE (chung cho 2 ngôn ngữ).
const LANG = document.documentElement.lang === "en" ? "en" : "vi";
const LP = BASE + (LANG === "en" ? "/en" : "");
const LV = LANG === "vi" ? "" : ' lang="vi"'; // tên món, nguyên liệu (tiếng Việt, chưa dịch) trong trang tiếng Anh
// Chữ giao diện phía trình duyệt. Chữ lúc build nằm ở scripts/i18n.mjs.
const S = {
  vi: {
    copyFail: "Không chép được, hãy thử lại", min: (n) => `${n} phút`, people: (n) => `${n} người`,
    diff: { de: "Dễ", vua: "Vừa", kho: "Khó" },
    stopTimer: "Tắt hẹn giờ", timerSet: (n) => `Đã hẹn ${n} phút`, timeUp: (l) => `Hết giờ: ${l}`, timer: "Hẹn giờ",
    drinkFor: "Đồ uống cho bạn", forYou: "Gợi ý cho bạn", waiting: "Chờ quay", howTo: "Cách nấu",
    lockA: (on, n) => `${on ? "Bỏ khoá" : "Khoá"} món ${n}`, kept: "Đã giữ", keep: "Giữ", picking: "Đang chọn…",
    addMam: "Thêm cả mâm vào Đi chợ", addShop: "Thêm vào Đi chợ", allLocked: "Bạn đã khoá hết món. Bỏ khoá món muốn đổi.",
    spinning: "Đang quay…", again: "Quay lại lần nữa", noMatch: "Chưa có món hợp bộ lọc cho một số ngăn. Thử nới bộ lọc.",
    soundOn: "Đang bật âm thanh", soundOff: "Đang tắt âm thanh", addedN: (n) => `Đã thêm ${n} món vào danh sách đi chợ`,
    saved: "Đã lưu", save: "Lưu sổ tay", unsaved: "Đã bỏ khỏi sổ tay", savedT: "Đã lưu vào sổ tay",
    shopText: (n, s) => `🛒 Đi chợ: ${n} (${s} người)`, shopTitle: "Danh sách đi chợ", copiedNote: "Đã chép danh sách, dán vào Zalo hoặc Ghi chú.",
    addedIng: (n) => `Đã thêm ${n} nguyên liệu vào Đi chợ`, videoGuide: "Video hướng dẫn",
    stepProg: (d, n) => `${d}/${n} bước`, stepPos: (i, n) => `Bước ${i}/${n}`,
    noVoice: "Máy chưa có giọng đọc tiếng Việt. Bạn cài thêm trong phần Giọng nói của máy.",
    prep: "Chuẩn bị", prepTitle: (n) => `Gom đủ nguyên liệu cho ${n} người`, prepHint: "Tích từng thứ khi đã để sẵn trên bếp.", prepReady: (d, n) => `Đã sẵn ${d}/${n}`,
    useHere: "Dùng ở bước này", upNext: (t) => `Tiếp theo: ${t}`, lastStep: "Đây là bước cuối", seePart: "Xem đoạn này", timerN: (n) => `Hẹn giờ ${n} phút`,
    startCook: "Bắt đầu bước 1 →", doneKicker: "Hoàn thành", doneTitle: "Xong món rồi!", doneText: "Chúc cả nhà ngon miệng. Chụp một tấm cho mọi người cùng xem nhé.",
    showOff: "Khoe món bạn nấu", saveIt: "Lưu vào sổ tay", saved: "Đã lưu vào sổ tay", closeCook: "Đóng", finish: "Hoàn thành", next: "Tiếp →", done: "Xong rồi! Chúc cả nhà ngon miệng.",
    nDishes: (n) => `${n} món`, noFilter: "Không có món nào hợp bộ lọc.", pickOne: "Chọn ít nhất một nguyên liệu.",
    have: (full, g, n) => `${full ? "✅ Đủ" : "Có"} ${g}/${n} nguyên liệu`, canCook: (n) => `${n} món nấu được với nguyên liệu bạn chọn`,
    noneIng: "Chưa có món nào dùng các nguyên liệu này.", notFound: "Không tìm thấy món phù hợp. Thử từ khác ngắn hơn.",
    shopEmpty: "Danh sách trống", shopEmptyP: "Ở trang công thức, bấm “Thêm vào Đi chợ”, hoặc quay mâm cơm ở trang chủ.", home: "Hôm nay nấu gì?",
    rm: (n) => `Bỏ món ${n}`, nothing: "Không còn gì cần mua", toBuy: (n) => `🛒 Cần mua (${n} món):`, copiedZalo: "Đã chép danh sách, dán vào Zalo để gửi.",
    unchecked: "Đã bỏ dấu các món đã mua", cleared: "Đã xoá danh sách",
    play: (t) => `Phát video ${t}`, vpos: (i, n) => `Video ${i}/${n}`, videoBy: (k) => (k ? `Video: kênh <strong>${k}</strong>` : "Video: YouTube"), watchYt: "Xem trên YouTube",
    light: "Chế độ sáng", dark: "Chế độ đêm",
  },
  en: {
    copyFail: "Could not copy, please try again", min: (n) => `${n} min`, people: (n) => `${n} ${n === 1 ? "person" : "people"}`,
    diff: { de: "Easy", vua: "Medium", kho: "Hard" },
    stopTimer: "Stop timer", timerSet: (n) => `Timer set for ${n} min`, timeUp: (l) => `Time's up: ${l}`, timer: "Timer",
    drinkFor: "A drink for you", forYou: "Picked for you", waiting: "Ready to spin", howTo: "How to cook",
    lockA: (on, n) => `${on ? "Unlock" : "Lock"} ${n}`, kept: "Kept", keep: "Keep", picking: "Picking…",
    addMam: "Add the whole meal to shopping", addShop: "Add to shopping list", allLocked: "All dishes are locked. Unlock the one you want to change.",
    spinning: "Spinning…", again: "Spin again", noMatch: "No dishes match the filters for some slots. Try loosening them.",
    soundOn: "Sound on", soundOff: "Sound off", addedN: (n) => `Added ${n} ${n === 1 ? "dish" : "dishes"} to the shopping list`,
    saved: "Saved", save: "Save", unsaved: "Removed from saved", savedT: "Saved",
    shopText: (n, s) => `🛒 Shopping: ${n} (${s} ${s === 1 ? "person" : "people"})`, shopTitle: "Shopping list", copiedNote: "List copied. Paste it into a chat or your notes.",
    addedIng: (n) => `Added ${n} ${n === 1 ? "ingredient" : "ingredients"} to shopping`, videoGuide: "Video guide",
    stepProg: (d, n) => `${d}/${n} steps`, stepPos: (i, n) => `Step ${i}/${n}`,
    noVoice: "Your device has no voice for this language. Add one in your device's speech settings.",
    prep: "Get ready", prepTitle: (n) => `Gather ingredients for ${n} ${n === 1 ? "person" : "people"}`, prepHint: "Tick each one once it is ready on the counter.", prepReady: (d, n) => `${d}/${n} ready`,
    useHere: "Used in this step", upNext: (t) => `Next: ${t}`, lastStep: "This is the last step", seePart: "Watch this part", timerN: (n) => `Timer ${n} min`,
    startCook: "Start step 1 →", doneKicker: "Finished", doneTitle: "Dish done!", doneText: "Enjoy your meal. Take a photo and share it with everyone.",
    showOff: "Share your dish", saveIt: "Save to cookbook", saved: "Saved to cookbook", closeCook: "Close", finish: "Finish", next: "Next →", done: "All done! Enjoy your meal.",
    nDishes: (n) => `${n} ${n === 1 ? "dish" : "dishes"}`, noFilter: "No dishes match the filters.", pickOne: "Pick at least one ingredient.",
    have: (full, g, n) => `${full ? "✅ All" : "Have"} ${g}/${n} ingredients`, canCook: (n) => `${n} ${n === 1 ? "dish" : "dishes"} you can cook with your ingredients`,
    noneIng: "No dishes use these ingredients yet.", notFound: "No matching dishes. Try a shorter word.",
    shopEmpty: "Your list is empty", shopEmptyP: "On a recipe page, tap “Add to shopping list”, or spin a meal on the home page.", home: "What should I cook today?",
    rm: (n) => `Remove ${n}`, nothing: "Nothing left to buy", toBuy: (n) => `🛒 To buy (${n} ${n === 1 ? "item" : "items"}):`, copiedZalo: "List copied. Paste it into a chat to send.",
    unchecked: "Cleared ticks on bought items", cleared: "List cleared",
    play: (t) => `Play video ${t}`, vpos: (i, n) => `Video ${i}/${n}`, videoBy: (k) => (k ? `Video: <strong lang="vi">${k}</strong> channel` : "Video: YouTube"), watchYt: "Watch on YouTube",
    light: "Light mode", dark: "Dark mode",
  },
}[LANG];
const diffText = (k) => S.diff[fold(k)] || k || "";

// ---------- Lưu trữ: IndexedDB, dự phòng localStorage, dự phòng bộ nhớ tạm ----------
const store = (() => {
  const mem = new Map();
  let dbp = null;
  const db = () => (dbp ??= new Promise((ok, no) => {
    const req = indexedDB.open("hnng", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => ok(req.result);
    req.onerror = () => no(req.error);
  }));
  const tx = async (mode, fn) => {
    const d = await db();
    return new Promise((ok, no) => {
      const t = d.transaction("kv", mode), r = fn(t.objectStore("kv"));
      t.oncomplete = () => ok(r?.result);
      t.onerror = () => no(t.error);
    });
  };
  return {
    async get(k, def) {
      try { const v = await tx("readonly", (s) => s.get(k)); return v === undefined ? def : v; }
      catch { try { const v = localStorage.getItem("hnng-" + k); return v == null ? (mem.has(k) ? mem.get(k) : def) : JSON.parse(v); } catch { return mem.has(k) ? mem.get(k) : def; } }
    },
    async set(k, v) {
      mem.set(k, v);
      try { await tx("readwrite", (s) => s.put(v, k)); }
      catch { try { localStorage.setItem("hnng-" + k, JSON.stringify(v)); } catch {} }
    },
  };
})();

const toast = (msg) => {
  const t = document.createElement("div");
  t.className = "toast"; t.role = "status"; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
};
let recipesCache;
// Trang tiếng Anh: dùng tên món (te), tên danh mục (ce) tiếng Anh khi có; chưa dịch thì giữ tiếng Việt, đánh dấu tl/cl = "vi".
const allRecipes = () => (recipesCache ??= fetch(BASE + "/data/recipes.json").then((r) => (r.ok ? r.json() : [])).catch(() => [])
  .then((a) => (LANG === "vi" ? a : a.map((r) => ({ ...r, t: r.te || r.t, tl: r.te ? "" : "vi", cn: r.ce || r.cn, cl: r.ce ? "" : "vi" })))));
/** lang="vi" cho chữ chưa dịch trong trang tiếng Anh. */
const LA = (l) => (LANG !== "vi" && l !== "" ? ' lang="vi"' : "");
const copyOrShare = async (title, text, okMsg) => {
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ title, text });
    else { await navigator.clipboard.writeText(text); toast(okMsg); }
  } catch (e) { if (e?.name !== "AbortError") toast(S.copyFail); }
};

/** 0.5 → "½", 1.5 → "1½"; số khác làm tròn 1 chữ số, dấu phẩy thập phân. */
function qtyText(q) {
  if (!q) return "";
  const whole = Math.floor(q), frac = Math.round((q - whole) * 100) / 100;
  const F = { 0.25: "¼", 0.33: "⅓", 0.5: "½", 0.67: "⅔", 0.75: "¾" };
  if (frac && F[frac]) return `${whole || ""}${F[frac]}`;
  return String(Math.round(q * 10) / 10).replace(".", ",");
}

const svg = (p) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  camera: svg('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>'),
  heart: svg('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>'),
  timer: svg('<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.8l2.4 1.5M9.5 3.5h5"/>'),
  loa: svg('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  tat: svg('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="m16 10 4 4m0-4-4 4"/>'),
  play: svg('<circle cx="12" cy="12" r="8.5"/><path d="M10.2 8.8v6.4l5-3.2z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>'),
  unlock: svg('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/>'),
};
/** Khung trung tính khi món chưa có ảnh hoặc ảnh hỏng link (giống noPhoto() lúc build). */
const noPhoto = (ten, l = "vi") => `<span class="ph" aria-hidden="true"><span${l ? ` lang="${l}"` : ""}>${esc(ten)}</span></span>`;
// Ảnh món: hiện mờ dần khi tải xong; hỏng link thì gỡ ảnh để lộ khung trung tính bên dưới.
// Ảnh bìa YouTube của video không tồn tại vẫn tải được nhưng chỉ rộng 120px: coi như hỏng.
const PHOTO = ".rcard-img img, .slot-img img, .hero-img, .step-img";
const photoOk = (img) => { if (/ytimg\.com/.test(img.src) && img.naturalWidth <= 120) photoBad(img); else img.classList.add("ok"); };
function photoBad(img) {
  if (img.classList.contains("hero-img")) {
    const fig = img.closest(".media");
    $$('[data-media-panel="photo"]', fig).forEach((e) => e.remove());
    const v = $('[data-media-panel="video"]', fig);
    if (v) { v.hidden = false; $(".seg", fig)?.remove(); } else fig?.remove();
  } else (img.closest(".step-fig") || img).remove();
}
document.addEventListener("load", (e) => e.target.matches?.(PHOTO) && photoOk(e.target), true);
document.addEventListener("error", (e) => e.target.matches?.(PHOTO) && photoBad(e.target), true);
const scanPhotos = (root = document) => $$(PHOTO, root).forEach((i) => i.complete && (i.naturalWidth ? photoOk(i) : photoBad(i)));
scanPhotos();

// v = 2: ảnh là ảnh bìa YouTube Shorts (khung dọc giữa nền đen) → class yt-doc phóng to cho kín khung.
const DOC = (r) => (r.v === 2 ? ' class="yt-doc"' : "");
/** Thẻ món phía trình duyệt, giống recipeCard() lúc build. */
function cardHTML(r, extra = "") {
  const k = fold(r.k);
  return `<a class="rcard${["de", "vua", "kho"].includes(k) ? ` k-${k}` : ""}" href="${LP}/mon/${r.s}/"><div class="rcard-img">${noPhoto(r.t, r.tl ?? "vi")}${r.img ? `<img${DOC(r)} src="${esc(r.img)}" alt="" loading="lazy" decoding="async" width="480" height="360">` : ""}
  ${r.v ? `<span class="badge-video">${IC.play} Video</span>` : ""}</div>
  <div class="rcard-body"><small class="rcard-cat"${LA(r.cl)}>${esc(r.cn)}</small><strong${LA(r.tl)}>${esc(r.t)}</strong>${extra}
  <span class="rcard-meta"><span>${r.m ? `${IC.clock} ${S.min(r.m)}` : ""}</span>${r.k ? `<b>${esc(diffText(r.k))}</b>` : ""}</span></div></a>`;
}

// ---------- Đi chợ: thêm món ----------
async function addToShop(entries) {
  const shop = await store.get("shop", { recipes: {}, checked: {} });
  for (const e of entries) shop.recipes[e.slug] = { name: e.name, serv: e.serv, items: e.items };
  await store.set("shop", shop);
  updateBadges();
}
async function updateBadges() {
  const shop = await store.get("shop", { recipes: {} }), saved = await store.get("saved", []);
  const set = (k, n) => { const b = $(`[data-badge="${k}"]`); if (b) { b.hidden = !n; b.textContent = n; } };
  set("cart", Object.keys(shop.recipes).length);
  set("heart", saved.length);
}

// ---------- Hẹn giờ ----------
const timers = [];
let audioCtx;
function beep() {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.2, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    o.start(); o.stop(audioCtx.currentTime + 0.6);
  } catch {}
}
function renderTimers() {
  const box = $("[data-timer-chip]");
  if (!box) return;
  box.hidden = !timers.length;
  box.innerHTML = timers.map((t, i) => {
    const left = Math.max(0, Math.round((t.end - Date.now()) / 1000));
    return `<div class="timer${left ? "" : " ring"}" role="timer"><span>${esc(t.label)}</span><b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</b><button type="button" data-timer-stop="${i}" aria-label="${S.stopTimer}">✕</button></div>`;
  }).join("");
}
function startTimer(min, label) {
  try { audioCtx ??= new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  timers.push({ end: Date.now() + min * 60000, label, rung: false });
  renderTimers();
  toast(S.timerSet(qtyText(min)));
}
setInterval(() => {
  if (!timers.length) return;
  for (const t of timers) if (!t.rung && Date.now() >= t.end) {
    t.rung = true; beep(); setTimeout(beep, 700); setTimeout(beep, 1400);
    navigator.vibrate?.([300, 150, 300, 150, 300]);
    toast(S.timeUp(t.label));
  }
  renderTimers();
}, 1000);
document.addEventListener("click", (e) => {
  const stop = e.target.closest("[data-timer-stop]");
  if (stop) { timers.splice(Number(stop.dataset.timerStop), 1); renderTimers(); }
  const tm = e.target.closest("[data-timer]");
  if (tm) startTimer(Number(tm.dataset.timer), tm.dataset.label || S.timer);
});

// ---------- Quay món: âm thanh tự tổng hợp (Web Audio, không tải file) và tung bông giấy khi chốt món ----------
// EASE trùng cubic-bezier của .reel và .hreel-track trong style.css: tính lúc từng ảnh lướt qua vạch để tiếng "tách" khớp hình.
const EASE = [0.15, 0.85, 0.15, 1];
const bz = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
const lucQua = (p) => { let lo = 0, hi = 1; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (bz(EASE[1], EASE[3], m) < p) lo = m; else hi = m; } return bz(EASE[0], EASE[2], lo); };
const amThanh = (() => {
  let ctx = null;
  const mo = () => {
    if (prefs.sound === false) return null;
    try { ctx ??= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } catch { ctx = null; }
    return ctx;
  };
  const not = (t, f, len, kieu, vol) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = kieu; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + len + 0.02);
  };
  return {
    mo,
    tach(n, ms) { if (!mo()) return; const t0 = ctx.currentTime + 0.03; for (let k = 1; k <= n; k++) not(t0 + (lucQua(k / n) * ms) / 1000, 1500 + Math.random() * 300, 0.03, "triangle", 0.07); },
    ting(k) { if (mo()) not(ctx.currentTime, 660 * 2 ** (k / 3), 0.35, "sine", 0.18); },
    keng() { if (!mo()) return; const t = ctx.currentTime; [523, 659, 784, 1047].forEach((f, i) => not(t + i * 0.09, f, 0.3, "triangle", 0.16)); [523, 659, 784].forEach((f) => not(t + 0.4, f, 0.9, "sine", 0.1)); },
  };
})();
/** Bông giấy màu của web bung ra từ khung kết quả, rơi xuống rồi tự xoá (~1,5 giây). Bỏ qua khi bật giảm chuyển động. */
function tungBong(el) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !el.animate) return;
  const r = el.getBoundingClientRect(), cs = getComputedStyle(document.documentElement);
  const mau = ["--accent", "--herb", "--k-vua", "--primary"].map((v) => cs.getPropertyValue(v).trim());
  const x0 = r.left + r.width / 2, y0 = r.top + Math.min(r.height / 2, 120);
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("i"), w = 8 + Math.random() * 7;
    s.className = "bong";
    s.style.cssText = `position:fixed;left:${x0}px;top:${y0}px;width:${w}px;height:${w * 0.45}px;background:${mau[i % mau.length]};border-radius:2px;pointer-events:none;z-index:60`;
    document.body.append(s);
    const a = Math.random() * Math.PI * 2, v = 110 + Math.random() * 220, dx = Math.cos(a) * v, dy = Math.sin(a) * v - 150, q = Math.random() * 720 - 360;
    s.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${q / 2}deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx * 1.3}px,${dy + 320}px) rotate(${q}deg)`, opacity: 0 }],
      { duration: 1200 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => s.remove();
  }
}

// ---------- Trang chủ: Hôm nay nấu gì? ----------
async function pageHome() {
  renderSaved();
  const box = $("[data-spin]");
  if (!box) return;
  const all = await allRecipes();
  const slotsEl = $("[data-spin-slots]", box), shopBtn = $("[data-spin-shop]", box);
  const MAM = JSON.parse(slotsEl.dataset.mam);
  const saved = await store.get("spin", null);
  const st = { kind: saved?.kind || "an", mode: saved?.mode || "one", picks: saved?.picks || {}, locks: saved?.locks || {} };

  const filters = () => Object.fromEntries($$("[data-spin-f]", box).map((s) => [s.dataset.spinF, s.value]));
  // Đồ uống: một ngăn riêng chỉ quay danh mục do-uong. Món ăn: mâm cơm 3 món hoặc 1 món, không lẫn đồ uống.
  const slotDefs = () => (st.kind === "uong" ? [{ key: "uong", cat: "do-uong", label: S.drinkFor }]
    : st.mode === "mam" ? MAM.map(([c, label], i) => ({ key: "m" + i, cat: c, label })) : [{ key: "one", cat: "", label: S.forYou }]);
  const pool = (def) => {
    const f = filters();
    return all.filter((r) => (!def.cat || r.c === def.cat)
      && (!f.b || r.b.includes(f.b))
      && (!f.m || (r.m && r.m <= Number(f.m)))
      && (!f.n || def.cat === "mon-canh" || def.cat === "mon-rau-xao" || fold(r.n) === fold(f.n))
      && (def.cat || r.c !== "do-uong"));
  };
  const bySlug = Object.fromEntries(all.map((r) => [r.s, r]));

  const goBtn = $("[data-spin-go]", box), goText = $("span", goBtn);
  const rand = (a) => a[(Math.random() * a.length) | 0];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pic = (r) => noPhoto(r.t, r.tl ?? "vi") + (r.img ? `<img${DOC(r)} src="${esc(r.img)}" alt="" width="240" height="180">` : "");
  // Ưu tiên món có ảnh: món có ảnh có 3 phần cơ hội, món chưa có ảnh 1 phần (vẫn ra để mâm cơm đa dạng).
  const pickFin = (p) => rand([...p].sort((a, b) => !!b.img - !!a.img).flatMap((r) => (r.img ? [r, r, r] : [r])));
  const slotHTML = (d) => {
    const r = bySlug[st.picks[d.key]];
    if (!r) return `<div class="slot empty-slot" data-slot="${d.key}"><div><div class="slot-label">${esc(d.label)}</div><p>${S.waiting}</p></div></div>`;
    const locked = !!st.locks[d.key];
    if (single(d)) return singleHTML(d, r, locked, around(r, d));
    return `<div class="slot${["de", "vua", "kho"].includes(fold(r.k)) ? ` k-${fold(r.k)}` : ""}" data-slot="${d.key}">
        <div class="slot-img">${pic(r)}</div>
        <div><div class="slot-label">${esc(d.label)}</div><strong${LA(r.tl)}>${esc(r.t)}</strong><span class="meta">${IC.clock} ${S.min(r.m)} · ${esc(diffText(r.k))}</span><br><a class="more" href="${LP}/mon/${r.s}/">${S.howTo}</a></div>
        <button class="lock" type="button" data-lock="${d.key}" aria-pressed="${locked}" aria-label="${esc(S.lockA(locked, r.t))}">${locked ? IC.lock : IC.unlock}<span>${locked ? S.kept : S.keep}</span></button>
      </div>`;
  };
  // Ngăn 1 món / đồ uống: dải thẻ nằm ngang, vạch chỉ ở giữa, hai mép mờ; tên món và nút nằm dưới dải.
  const single = (d) => d.key === "one" || d.key === "uong";
  const STEP = 120, HALF = 56; // rộng thẻ 112 + khe 8
  const around = (r, d) => { const p = pool(d).filter((x) => x.s !== r.s), q = p.length ? p : [r]; return [rand(q), rand(q), r, rand(q), rand(q)]; };
  const track = (cards, at, dur = 0) => `<div class="hreel" aria-hidden="true"><div class="hreel-track" style="--x:${-(at * STEP + HALF)}px;--d:${dur}ms">${cards.map((c, i) => `<div class="slot-img${i === at && !dur ? " on" : ""}">${pic(c)}</div>`).join("")}</div></div>`;
  const singleHTML = (d, r, locked, cards) => `<div class="slot single${["de", "vua", "kho"].includes(fold(r.k)) ? ` k-${fold(r.k)}` : ""}" data-slot="${d.key}">
        ${track(cards, 2)}
        <div class="single-info"><div class="slot-label">${esc(d.label)}</div><strong${LA(r.tl)}>${esc(r.t)}</strong><span class="meta">${IC.clock} ${S.min(r.m)} · ${esc(diffText(r.k))}</span></div>
        <div class="single-act"><a class="more" href="${LP}/mon/${r.s}/">${S.howTo}</a><button class="lock" type="button" data-lock="${d.key}" aria-pressed="${locked}" aria-label="${esc(S.lockA(locked, r.t))}">${locked ? IC.lock : IC.unlock}<span>${locked ? S.kept : S.keep}</span></button></div>
      </div>`;
  const sync = () => {
    const defs = slotDefs();
    $$("[data-spin-mode]", box).forEach((b) => b.setAttribute("aria-selected", b.dataset.spinMode === st.mode));
    $$("[data-spin-kind]", box).forEach((i) => (i.checked = i.value === st.kind));
    $("[data-spin-modes]", box).hidden = st.kind === "uong";
    const nf = Object.values(filters()).filter(Boolean).length;
    $("[data-spin-fcount]", box).textContent = nf ? ` (${nf})` : "";
    shopBtn.hidden = !defs.some((d) => bySlug[st.picks[d.key]]);
    shopBtn.querySelector("span").textContent = st.kind === "an" && st.mode === "mam" ? S.addMam : S.addShop;
  };
  const render = () => {
    slotsEl.classList.toggle("mam", st.kind === "an" && st.mode === "mam");
    slotsEl.innerHTML = slotDefs().map(slotHTML).join("");
    sync();
  };
  const save = () => store.set("spin", st);
  let busy = false;
  slotsEl.onclick = (e) => {
    const b = e.target.closest("[data-lock]");
    if (!b || busy) return;
    st.locks[b.dataset.lock] = !st.locks[b.dataset.lock]; save(); render();
  };

  // Hiệu ứng máy quay: mỗi ngăn cuộn một dải ảnh món, chậm dần rồi dừng lần lượt
  // Lâu và hồi hộp hơn: món lẻ ~4,5 giây; mâm cơm 3 ngăn dừng lần lượt ~3 / 4 / 5 giây.
  // Tên món dưới ngăn đổi nhanh lúc đầu rồi thưa dần theo nhịp dải ảnh chậm lại.
  const nhayTen = (el, p, dur) => {
    const t0 = performance.now(); let h;
    const f = () => { const k = Math.min(1, (performance.now() - t0) / dur); el.textContent = rand(p).t; h = setTimeout(f, 80 + 420 * k * k); };
    f(); return () => clearTimeout(h);
  };
  const roll = async ({ d, p, fin }, i, all) => {
    const el = $(`[data-slot="${d.key}"]`, slotsEl), cuoi = i === all.length - 1;
    const n = single(d) ? 32 : 18 + i * 8, dur = single(d) ? 4100 : 3000 + i * 1000;
    const strip = Array.from({ length: n }, () => rand(p)).concat(fin);
    if (single(d)) {
      const cards = [rand(p), rand(p), ...strip, rand(p), rand(p)], at = n + 2;
      el.className = "slot single rolling";
      el.innerHTML = track(cards, 2) + `<div class="single-info"><div class="slot-label">${esc(d.label)}</div><strong${LV}>${esc(rand(p).t)}</strong><span class="meta">${S.picking}</span></div>`;
      const tr = $(".hreel-track", el), nm = $("strong", el);
      tr.getBoundingClientRect();
      tr.style.setProperty("--d", dur + 400 + "ms");
      tr.style.setProperty("--x", -(at * STEP + HALF) + "px");
      if (cuoi) amThanh.tach(n, dur + 400);
      const dungTen = nhayTen(nm, p, dur + 400);
      await wait(dur + 400);
      dungTen();
      st.picks[d.key] = fin.s;
      el.outerHTML = singleHTML(d, fin, !!st.locks[d.key], cards.slice(at - 2, at + 3));
      $(`[data-slot="${d.key}"]`, slotsEl).classList.add("landed");
      amThanh.ting(i);
      try { navigator.vibrate && navigator.vibrate(12); } catch {}
      return;
    }
    el.className = "slot rolling";
    el.innerHTML = `<div class="slot-img"><div class="reel" style="--d:${dur}ms" aria-hidden="true">${strip.map((r) => `<div>${pic(r)}</div>`).join("")}</div></div><div><div class="slot-label">${esc(d.label)}</div><strong${LV}>${esc(rand(p).t)}</strong><span class="meta">${S.picking}</span></div>`;
    const reel = $(".reel", el), name = $("strong", el);
    reel.getBoundingClientRect();
    reel.style.transform = `translateY(-${n * 100}%)`;
    if (cuoi) amThanh.tach(n, dur);
    const dungTen = nhayTen(name, p, dur);
    await wait(dur);
    dungTen();
    st.picks[d.key] = fin.s;
    el.outerHTML = slotHTML(d);
    $(`[data-slot="${d.key}"]`, slotsEl).classList.add("landed");
    amThanh.ting(i);
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
  };

  const spin = async () => {
    if (busy) return;
    const defs = slotDefs().filter((d) => !st.locks[d.key] || !bySlug[st.picks[d.key]]);
    if (!defs.length) return toast(S.allLocked);
    const rolls = [], empties = [];
    for (const d of defs) {
      const p = pool(d);
      if (!p.length) { delete st.picks[d.key]; empties.push(d); continue; }
      rolls.push({ d, p, fin: pickFin(p.length > 1 ? p.filter((r) => r.s !== st.picks[d.key]) : p) });
    }
    amThanh.mo();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !rolls.length) {
      rolls.forEach(({ d, fin }) => (st.picks[d.key] = fin.s));
      render();
      if (rolls.length) amThanh.keng();
    } else {
      busy = true; goBtn.disabled = true; goBtn.classList.add("spinning"); goText.textContent = S.spinning;
      slotsEl.setAttribute("aria-busy", "true");
      empties.forEach((d) => ($(`[data-slot="${d.key}"]`, slotsEl).outerHTML = slotHTML(d)));
      await Promise.all(rolls.map(roll));
      amThanh.keng(); tungBong(slotsEl);
      busy = false; goBtn.disabled = false; goBtn.classList.remove("spinning"); goText.textContent = S.again;
      slotsEl.removeAttribute("aria-busy");
      sync();
    }
    save();
    if (empties.length) toast(S.noMatch);
  };

  $$("[data-spin-mode]", box).forEach((b) => (b.onclick = () => { if (busy) return; st.mode = b.dataset.spinMode; save(); render(); }));
  $$("[data-spin-kind]", box).forEach((i) => (i.onchange = () => { if (busy) return render(); st.kind = i.value; save(); render(); }));
  $$("[data-spin-f]", box).forEach((s) => s.addEventListener("change", sync));
  goBtn.onclick = spin;
  const amBtn = $("[data-spin-am]", box);
  const veAm = () => { const on = prefs.sound !== false; amBtn.setAttribute("aria-pressed", on); amBtn.innerHTML = on ? IC.loa : IC.tat; amBtn.title = on ? S.soundOn : S.soundOff; };
  amBtn.onclick = () => { prefs.sound = prefs.sound === false; savePrefs(); veAm(); amThanh.ting(0); };
  veAm();
  shopBtn.onclick = async () => {
    const rs = slotDefs().map((d) => bySlug[st.picks[d.key]]).filter(Boolean);
    await addToShop(rs.map((r) => ({ slug: r.s, name: r.t, serv: r.sv, items: r.ig.map(([ten, q, u]) => ({ ten, q, u })) })));
    toast(S.addedN(rs.length));
  };
  render();
}

// ---------- Trang công thức ----------
// ---------- Chế độ nấu: hàm thuần (kiểm thử trong e2e) ----------
/** Các số phút nhắc trong câu ("2–3 phút" → 3) để gợi ý hẹn giờ. */
const soPhut = (t) => [...t.matchAll(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:phút|min)/gi)].map((m) => Number(m[2] || m[1]));
/** Nạp CSS riêng của một màn khi cần (ví dụ cook.css lúc mở chế độ nấu). */
const napCss = (ten) => new Promise((ok) => {
  if (document.querySelector(`link[data-css="${ten}"]`)) return ok();
  const v = (document.querySelector('link[href*="style.css"]')?.href.split("?")[1]) || "";
  const l = Object.assign(document.createElement("link"), { rel: "stylesheet", href: `${BASE}/assets/${ten}.css${v ? `?${v}` : ""}` });
  l.dataset.css = ten; l.onload = l.onerror = () => ok(); document.head.append(l);
});

async function pageRecipe() {
  const art = $(".recipe"), slug = art.dataset.slug, base = Number(art.dataset.baseServ) || 1;
  let serv = base;

  // Số người ăn → nhân lượng nguyên liệu
  const out = $("[data-serv-out]");
  const applyServ = () => {
    out.textContent = serv;
    $$(".qty", art).forEach((q) => { const v = Number(q.dataset.q); if (v) q.textContent = qtyText((v * serv) / base); });
    $$("[data-serv]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.serv) === serv));
  };
  $("[data-serv-dec]").onclick = () => { if (serv > 1) { serv--; applyServ(); } };
  $("[data-serv-inc]").onclick = () => { if (serv < 50) { serv++; applyServ(); } };
  $$("[data-serv]").forEach((b) => (b.onclick = () => { serv = Number(b.dataset.serv); applyServ(); }));

  // Lưu vào sổ tay
  const fav = $("[data-fav]");
  const showFav = async () => {
    const on = (await store.get("saved", [])).includes(slug);
    fav.setAttribute("aria-pressed", on); fav.querySelector("span").textContent = on ? S.saved : S.save;
  };
  fav.onclick = async () => {
    let saved = await store.get("saved", []);
    const on = saved.includes(slug);
    saved = on ? saved.filter((s) => s !== slug) : [slug, ...saved];
    await store.set("saved", saved); showFav(); updateBadges();
    toast(on ? S.unsaved : S.savedT);
  };
  showFav();

  // Nguyên liệu: lấy món đã tích (không tích món nào thì lấy hết) theo số người đang chọn
  const pickItems = () => {
    const lis = $$(".ings li", art);
    const chosen = lis.filter((li) => li.querySelector("input").checked);
    return (chosen.length ? chosen : lis).map((li) => {
      const q = Number(li.querySelector(".qty").dataset.q) || 0;
      return { ten: li.querySelector("strong").textContent, q: q ? (q * serv) / base : 0, u: li.querySelector(".unit").textContent.trim(), note: li.querySelector("small")?.textContent.replace(/[()]/g, "") || "" };
    });
  };
  $("[data-copy-shop]").onclick = () => {
    const items = pickItems();
    const text = `${S.shopText(art.dataset.name, serv)}\n${items.map((i) => `☐ ${i.ten}${i.q ? `: ${qtyText(i.q)} ${i.u}` : i.note ? ` (${i.note})` : ""}`).join("\n")}`;
    copyOrShare(S.shopTitle, text, S.copiedNote);
  };
  $("[data-add-shop]").onclick = async () => {
    const items = pickItems();
    await addToShop([{ slug, name: art.dataset.name, serv, items }]);
    toast(S.addedIng(items.length));
  };

  // Ảnh / video
  $$("[data-media]").forEach((b) => (b.onclick = () => {
    $$("[data-media]").forEach((x) => x.setAttribute("aria-selected", x === b));
    $$("[data-media-panel]").forEach((p) => (p.hidden = p.dataset.mediaPanel !== b.dataset.media));
  }));
  const box = $("[data-player]");
  const play = (start = 0) => {
    if (!box) return;
    $('[data-media="video"]')?.click();
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.id}?autoplay=1&rel=0&playsinline=1${start ? `&start=${start}` : ""}" title="${S.videoGuide}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    // Video ngang dính trên đầu khi cuộn; video dọc (Shorts) quá cao nên không dính
    if (!box.classList.contains("vertical")) box.closest(".media").classList.add("sticky");
  };
  $("[data-play]")?.addEventListener("click", () => play(0));
  $$("[data-seek]").forEach((b) => b.addEventListener("click", () => { play(Number(b.dataset.seek)); box.scrollIntoView({ behavior: "smooth", block: "start" }); }));

  // Các bước: tích số bước để đánh dấu xong (bước xong thu gọn còn tiêu đề), thanh tiến độ, nhớ theo món trên máy.
  const steps = $$(".steps li"), prog = $("[data-step-prog]"), kStep = "steps-" + slug;
  const veBuoc = () => {
    const d = steps.filter((li) => li.classList.contains("done")).length, now = steps.find((li) => !li.classList.contains("done"));
    steps.forEach((li) => { li.classList.toggle("now", li === now); $("[data-step-done]", li).checked = li.classList.contains("done"); });
    $("[data-step-count]").textContent = S.stepProg(d, steps.length);
    $("[data-step-bar]").style.transform = `scaleX(${steps.length ? d / steps.length : 0})`;
    $("[data-step-reset]").hidden = !d;
  };
  const datXong = (i, on) => { steps[i].classList.toggle("done", on); veBuoc(); store.set(kStep, steps.map((li, k) => (li.classList.contains("done") ? k : -1)).filter((k) => k >= 0)); };
  steps.forEach((li, i) => ($("[data-step-done]", li).onchange = (e) => datXong(i, e.target.checked)));
  $("[data-step-reset]").onclick = () => { steps.forEach((li) => li.classList.remove("done")); veBuoc(); store.set(kStep, []); };
  (await store.get(kStep, [])).forEach((k) => steps[k]?.classList.add("done"));
  prog.hidden = false; $$(".steps").forEach((ol) => ol.classList.add("live")); veBuoc();
  // Ảnh bước: màn rộng là ảnh nhỏ bên phải, bấm để phóng to
  $$(".step-fig").forEach((f) => (f.onclick = () => f.classList.toggle("big")));

  // Chế độ đang nấu: màn Chuẩn bị → từng bước (nguyên liệu dùng ở bước, chữ quan trọng tô đậm, hẹn giờ tự động,
  // đoạn video của bước, xem trước bước sau, đọc to, vuốt để chuyển) → màn Hoàn thành. Giữ màn hình sáng.
  const view = $("[data-cook-view]"), body = $("[data-cook-body]"), extra = $("[data-cook-extra]");
  const lv = (el) => (el?.getAttribute("lang") ? ` lang="${el.getAttribute("lang")}"` : ""); // nội dung chưa dịch giữ lang="vi"
  const ings = $$(".ings li").map((li) => ({ lv: lv(li), ten: $("strong", li).textContent, q: Number($(".qty", li).dataset.q) || 0, dv: $(".unit", li).textContent, gc: ($("small", li)?.textContent || "").replace(/^\(|\)$/g, "") }));
  const luong = (g) => [g.q ? qtyText((g.q * serv) / base) : "", g.dv, g.q ? "" : g.gc].filter(Boolean).join(" ");
  const kPrep = "prep-" + slug, daSan = new Set(await store.get(kPrep, []));
  let idx = 0, lock = null;
  const say = (() => {
    const ok = "speechSynthesis" in window;
    const noi = (txt) => {
      if (!ok || !prefs.say) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt), l = LANG === "en" ? "en" : "vi";
      u.lang = l === "vi" ? "vi-VN" : "en-US"; u.rate = 0.95;
      const vs = speechSynthesis.getVoices(), v = vs.find((x) => x.lang.toLowerCase().startsWith(l));
      if (vs.length && !v) { prefs.say = false; savePrefs(); veSay(); return toast(S.noVoice); } // danh sách giọng có nhưng thiếu ngôn ngữ này
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    };
    return { ok, noi, dung: () => ok && speechSynthesis.cancel() };
  })();
  const sayBtn = $("[data-cook-say]");
  const veSay = () => { sayBtn.setAttribute("aria-pressed", !!prefs.say); sayBtn.innerHTML = prefs.say ? IC.loa : IC.tat; };
  sayBtn.hidden = !say.ok; veSay();
  const tiep = (li) => { const h = li?.querySelector("h3, h4"); $("[data-cook-upnext]").innerHTML = h ? `${esc(S.upNext(""))}<span${lv(h)}>${esc(h.textContent)}</span>` : ""; };
  const ytId = $("[data-player]")?.dataset.id, doc = $("[data-player]")?.classList.contains("vertical");
  // Ảnh món làm dải đầu chế độ nấu (ảnh bìa, hoặc ảnh bìa video); không có ảnh thì dải chỉ còn tên món
  const anhMon = $(".hero-img")?.src || $("[data-player] img")?.src, photo = $("[data-cook-photo]");
  if (anhMon) { photo.src = anhMon; photo.hidden = false; $("[data-cook-hero]").classList.add("has-photo"); }
  const show = () => {
    const n = steps.length, li = steps[idx], img = li?.querySelector(".step-img"), cimg = $("[data-cook-img]");
    const nut = (cls, txt, attr = "") => `<button class="btn${cls}" type="button" ${attr}>${txt}</button>`;
    $("[data-cook-pos]").textContent = idx < 0 ? S.prep : idx >= n ? S.doneKicker : S.stepPos(idx + 1, n);
    // Thanh bước: mỗi đoạn là một nút (bấm để nhảy bước); xong = xanh thảo mộc, đang làm = primary
    $("[data-cook-dots]").innerHTML = [-1, ...steps.keys()].map((k) => `<button type="button" data-go="${k}" aria-label="${k < 0 ? S.prep : S.stepPos(k + 1, n)}"${k === idx ? ' aria-current="step"' : ""}${(k < 0 ? idx >= 0 : steps[k].classList.contains("done")) ? ' class="xong"' : ""}><i></i></button>`).join("");
    $("[data-cook-dots] [aria-current]")?.scrollIntoView?.({ block: "nearest", inline: "center" });
    view.dataset.man = idx < 0 ? "prep" : idx >= n ? "done" : "step";
    $("[data-cook-num]").textContent = idx >= 0 && idx < n ? idx + 1 : "";
    const ph = li?.closest("ol")?.previousElementSibling, phc = $("[data-cook-phase]");
    phc.hidden = !ph?.matches(".phase") || idx < 0 || idx >= n; phc.innerHTML = phc.hidden ? "" : ph.querySelector("span").outerHTML;
    $("[data-cook-done]").closest("label").hidden = idx < 0 || idx >= n;
    $("[data-cook-prev]").disabled = idx < 0;
    $("[data-cook-next]").hidden = idx >= n;
    $("[data-cook-next]").textContent = idx < 0 ? S.startCook : idx === n - 1 ? S.finish : S.next;
    cimg.hidden = !img; if (img) cimg.src = img.src;
    $("[data-cook-tools]").innerHTML = "";
    body.scrollTop = 0;
    // "Đạt khi" và "Lưu ý" của bước (build sinh, đã thoát HTML); ẩn ở màn Chuẩn bị, Hoàn thành
    for (const [sel, src] of [["[data-cook-sign]", ".sign"], ["[data-cook-note]", ".step-note"]]) {
      const e = li?.querySelector(src), c = $(sel); c.hidden = !e || idx < 0 || idx >= n; c.innerHTML = e ? e.innerHTML : "";
    }
    let doc2 = "";
    if (idx < 0) {
      body.dataset.man = "prep";
      $("[data-cook-title]").textContent = S.prepTitle(serv);
      $("[data-cook-text]").textContent = S.prepHint;
      extra.innerHTML = `<ul class="cook-prep">${ings.map((g, k) => `<li${g.lv}><label><input type="checkbox" data-prep="${k}"${daSan.has(k) ? " checked" : ""}><span><strong>${esc(g.ten)}</strong> ${esc(luong(g))}</span></label></li>`).join("")}</ul><p class="muted" data-prep-count>${S.prepReady(daSan.size, ings.length)}</p>`;
      tiep(steps[0]);
      doc2 = `${S.prepTitle(serv)}. ${ings.map((g) => `${g.ten} ${luong(g)}`).join(", ")}`;
    } else if (idx >= n) {
      body.dataset.man = "done";
      $("[data-cook-title]").textContent = S.doneTitle;
      $("[data-cook-text]").textContent = S.doneText;
      const tq = $("[data-tq]:not([hidden]) [data-tq-mo]"), fav = $("[data-fav]");
      extra.innerHTML = `<div class="cook-end">${tq ? nut("", `${IC.camera} ${S.showOff}`, "data-cook-tq") : ""}${fav && fav.getAttribute("aria-pressed") !== "true" ? nut(" ghost", `${IC.heart} ${S.saveIt}`, "data-cook-fav") : `<p class="muted">${S.saved}</p>`}${nut(" ghost", S.closeCook, "data-cook-x")}</div>`;
      $("[data-cook-upnext]").textContent = "";
      tungBong(body); amThanh.keng();
      doc2 = `${S.doneTitle} ${S.doneText}`;
    } else {
      const p = li.querySelector("p").textContent, tit = li.querySelector("h3, h4")?.textContent || "";
      body.dataset.man = "step";
      $("[data-cook-title]").textContent = tit;
      $("[data-cook-text]").innerHTML = li.querySelector("p").innerHTML; // build đã thoát HTML và tô đậm (scripts/buoc.mjs)
      $("[data-cook-done]").checked = li.classList.contains("done");
      const dung = $$(".uses > span", li); // build dò sẵn (doNguyenLieu), lượng đã đổi theo khẩu phần
      const seek = $("[data-seek]", li)?.dataset.seek;
      extra.innerHTML = (dung.length ? `<p class="cook-lbl">${S.useHere}</p><ul class="cook-dung">${dung.map((x) => `<li${lv(x)}>${x.innerHTML}</li>`).join("")}</ul>` : "")
        + (ytId && seek != null ? `<div data-cook-vid>${nut(" ghost", `${IC.play} ${S.seePart}`, `data-cook-seek="${seek}"`)}</div>` : "");
      const phut = new Set([...$$("[data-timer]", li).map((b) => Number(b.dataset.timer)), ...soPhut(p)]);
      $("[data-cook-tools]").innerHTML = [...phut].filter((m) => m > 0 && m <= 180).map((m) => `<button class="mini" type="button" data-timer="${m}" data-label="${esc(tit || S.stepPos(idx + 1, n))}">${IC.timer} ${S.timerN(qtyText(m))}</button>`).join("");
      if (idx < n - 1) tiep(steps[idx + 1]); else $("[data-cook-upnext]").textContent = S.lastStep;
      doc2 = `${tit}. ${p}${dung.length ? `. ${S.useHere}: ${dung.map((x) => x.textContent.replace(/\s+/g, " ")).join(", ")}` : ""}`;
    }
    say.noi(doc2);
  };
  const close = () => { view.hidden = true; say.dung(); extra.innerHTML = ""; lock?.release?.(); lock = null; document.body.style.overflow = ""; };
  const di = (d) => { const n = steps.length; if (d > 0 && idx >= 0 && idx < n) datXong(idx, true); idx = Math.max(-1, Math.min(n, idx + d)); show(); };
  $("[data-cook]").onclick = async () => {
    await napCss("cook");
    const k = steps.findIndex((li) => !li.classList.contains("done"));
    idx = k <= 0 ? -1 : k; show();
    view.hidden = false; document.body.style.overflow = "hidden";
    try { lock = await navigator.wakeLock?.request("screen"); } catch {}
  };
  $("[data-cook-done]").onchange = (e) => datXong(idx, e.target.checked);
  $("[data-cook-dots]").onclick = (e) => { const b = e.target.closest("[data-go]"); if (b) { idx = +b.dataset.go; show(); } };
  $("[data-cook-close]").onclick = close;
  $("[data-cook-prev]").onclick = () => { if (idx > -1) di(-1); };
  $("[data-cook-next]").onclick = () => di(1);
  sayBtn.onclick = () => { prefs.say = !prefs.say; savePrefs(); veSay(); if (prefs.say) show(); else say.dung(); };
  extra.onclick = (e) => {
    const pr = e.target.closest("[data-prep]");
    if (pr) { pr.checked ? daSan.add(+pr.dataset.prep) : daSan.delete(+pr.dataset.prep); store.set(kPrep, [...daSan]); $("[data-prep-count]").textContent = S.prepReady(daSan.size, ings.length); return; }
    const sk = e.target.closest("[data-cook-seek]");
    if (sk) { sk.parentElement.innerHTML = `<div class="cook-player${doc ? " vertical" : ""}"><iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1&start=${sk.dataset.cookSeek}" title="${S.videoGuide}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`; say.dung(); return; }
    if (e.target.closest("[data-cook-tq]")) { close(); $("[data-tq-mo]").click(); }
    if (e.target.closest("[data-cook-fav]")) { $("[data-fav]").click(); e.target.closest("button").outerHTML = `<p class="muted">${S.saved}</p>`; }
    if (e.target.closest("[data-cook-x]")) close();
  };
  // Vuốt trái/phải trên phần nội dung để chuyển bước (tay ướt cũng dễ thao tác)
  let x0 = null, y0 = 0;
  body.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  body.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0 && idx < steps.length) di(1); if (dx > 0 && idx > -1) di(-1); }
  });
  document.addEventListener("visibilitychange", async () => { if (!view.hidden && document.visibilityState === "visible") { try { lock = await navigator.wakeLock?.request("screen"); } catch {} } });
  document.addEventListener("keydown", (e) => {
    if (view.hidden) return;
    if (e.key === "ArrowRight") $("[data-cook-next]").click();
    if (e.key === "ArrowLeft") $("[data-cook-prev]").click();
    if (e.key === "Escape") close();
  });
}

// ---------- Trang danh mục / tất cả món: lọc và sắp xếp ----------
function pageList() {
  const bar = $("[data-filters]"), grid = $(".rgrid");
  if (!bar || !grid) return;
  const st = {};
  const cards = $$(".rcard", grid);
  const run = () => {
    let n = 0;
    for (const c of cards) {
      const ok = (!st.k || c.dataset.k === st.k) && (!st.m || (Number(c.dataset.m) && Number(c.dataset.m) <= Number(st.m)))
        && (!st.cal || (Number(c.dataset.cal) && Number(c.dataset.cal) <= Number(st.cal)));
      c.hidden = !ok; if (ok) n++;
    }
    const sort = $("[data-sort]", bar).value;
    cards.sort((a, b) => (sort === "fast" ? (Number(a.dataset.m) || 999) - (Number(b.dataset.m) || 999) : b.dataset.d.localeCompare(a.dataset.d))).forEach((c) => grid.append(c));
    $("[data-fcount]").textContent = n ? S.nDishes(n) : S.noFilter;
  };
  $$("[data-f]", bar).forEach((g) => g.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    st[g.dataset.f] = b.dataset.v; $$(".chip", g).forEach((x) => x.setAttribute("aria-pressed", x === b)); run();
  }));
  $("[data-sort]", bar).onchange = run;
  run();
}

// ---------- Trang tìm món + Tủ lạnh có gì ----------
async function pageSearch() {
  const list = await allRecipes();
  const input = $("#q"), out = $("[data-results]"), count = $("[data-count]");
  const params = new URLSearchParams(location.search);
  const st = { mode: params.get("mode") === "nl" ? "nl" : "ten", tag: fold(params.get("tag") || ""), have: new Set() };
  input.value = params.get("q") || "";

  const run = () => {
    let html = "", n = 0;
    if (st.mode === "nl") {
      const have = [...st.have];
      if (!have.length) { out.innerHTML = ""; count.textContent = S.pickOne; return; }
      const hits = list.map((r) => {
        const got = r.g.filter((g) => have.some((h) => g.includes(h) || h.includes(g))).length;
        return { r, got, total: r.g.length || 1 };
      }).filter((x) => x.got).sort((a, b) => b.got / b.total - a.got / a.total || (a.total - a.got) - (b.total - b.got) || a.r.m - b.r.m);
      n = hits.length;
      html = hits.map(({ r, got, total }) => cardHTML(r, `<span class="meta">${S.have(got >= total, got, total)}</span>`)).join("");
      count.textContent = n ? S.canCook(n) : S.noneIng;
    } else {
      const q = fold(input.value), terms = q.split(/\s+/).filter(Boolean);
      const hits = list.filter((r) => (!st.tag || r.tg.includes(st.tag)) && terms.every((t) => r.f.includes(t) || r.g.some((g) => g.includes(t))))
        .sort((a, b) => Number(fold(b.t).includes(q)) - Number(fold(a.t).includes(q)));
      n = hits.length;
      html = hits.map((r) => cardHTML(r)).join("");
      count.textContent = n ? S.nDishes(n) : S.notFound;
    }
    out.innerHTML = html;
  };
  const setMode = (m) => {
    st.mode = m;
    $$("[data-mode]").forEach((b) => b.setAttribute("aria-selected", b.dataset.mode === m));
    $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== m));
    run();
  };
  $$("[data-mode]").forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  const tags = $("[data-tags]");
  if (tags) {
    $$(".chip", tags).forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === st.tag));
    tags.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; st.tag = b.dataset.v; $$(".chip", tags).forEach((x) => x.setAttribute("aria-pressed", x === b)); run(); });
  }
  const fridge = $("[data-fridge]");
  fridge.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on); on ? st.have.add(b.dataset.v) : st.have.delete(b.dataset.v); run();
  });
  $("#add-ing").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    for (const v of e.target.value.split(",").map(fold).filter(Boolean)) {
      st.have.add(v);
      if (!$(`.chip[data-v="${CSS.escape(v)}"]`, fridge)) fridge.insertAdjacentHTML("beforeend", `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="true"${LV}>${esc(e.target.value.split(",").find((x) => fold(x) === v).trim())}</button>`);
      else $(`.chip[data-v="${CSS.escape(v)}"]`, fridge).setAttribute("aria-pressed", "true");
    }
    e.target.value = ""; run();
  });
  input.addEventListener("input", run);
  setMode(st.mode);
}

// ---------- Trang đi chợ ----------
async function pageShop() {
  const box = $("[data-shop]");
  const render = async () => {
    const shop = await store.get("shop", { recipes: {}, checked: {} });
    shop.checked ??= {};
    const rs = Object.entries(shop.recipes);
    if (!rs.length) { box.innerHTML = `<div class="empty"><p class="empty-title">${S.shopEmpty}</p><p>${S.shopEmptyP}</p><p><a class="btn ghost" href="${LP}/">${S.home}</a></p></div>`; return; }
    // Gộp nguyên liệu trùng tên và đơn vị
    const merged = new Map();
    for (const [, r] of rs) for (const it of r.items) {
      const key = fold(it.ten) + "|" + fold(it.u);
      const m = merged.get(key) || { ten: it.ten, u: it.u, q: 0, from: [] };
      m.q += it.q || 0; m.from.push(r.name); merged.set(key, m);
    }
    box.innerHTML = `<div class="shop-recipes">${rs.map(([s, r]) => `<span class="chip"><a href="${LP}/mon/${s}/"${LV}>${esc(r.name)}</a> · ${S.people(r.serv)}<button type="button" data-rm="${s}" aria-label="${esc(S.rm(r.name))}">✕</button></span>`).join("")}</div>
      <ul class="shop-list"${LV}>${[...merged].sort((a, b) => a[1].ten.localeCompare(b[1].ten, "vi")).map(([k, m]) => `<li><label><input type="checkbox" data-k="${esc(k)}" ${shop.checked[k] ? "checked" : ""}><span><strong>${esc(m.ten)}</strong> <em>${m.q ? `${qtyText(m.q)} ${esc(m.u)}` : ""}</em><small>${esc([...new Set(m.from)].join(", "))}</small></span></label></li>`).join("")}</ul>`;
    $$("[data-k]", box).forEach((c) => (c.onchange = async () => { const s = await store.get("shop"); s.checked ??= {}; s.checked[c.dataset.k] = c.checked; await store.set("shop", s); }));
    $$("[data-rm]", box).forEach((b) => (b.onclick = async () => { const s = await store.get("shop"); delete s.recipes[b.dataset.rm]; await store.set("shop", s); updateBadges(); render(); }));
  };
  $("[data-shop-share]").onclick = () => {
    const items = $$(".shop-list li").filter((li) => !li.querySelector("input").checked).map((li) => `☐ ${li.querySelector("strong").textContent} ${li.querySelector("em").textContent}`.trim());
    if (!items.length) return toast(S.nothing);
    copyOrShare(S.shopTitle, `${S.toBuy(items.length)}\n${items.join("\n")}`, S.copiedZalo);
  };
  $("[data-shop-clear]").onclick = async () => {
    const s = await store.get("shop", { recipes: {}, checked: {} });
    const left = $$(".shop-list input").filter((c) => !c.checked).length;
    if (!left) { s.recipes = {}; s.checked = {}; } else { for (const k of Object.keys(s.checked || {})) if (s.checked[k]) delete s.checked[k]; }
    await store.set("shop", s); updateBadges(); render();
    toast(left ? S.unchecked : S.cleared);
  };
  render();
}

// ---------- Sổ tay món ngon (trang Sổ tay và trang chủ) ----------
async function renderSaved() {
  const grid = $("[data-saved-grid]");
  if (!grid) return;
  const saved = await store.get("saved", []);
  const byS = Object.fromEntries((await allRecipes()).map((r) => [r.s, r]));
  const rs = saved.map((s) => byS[s]).filter(Boolean);
  grid.innerHTML = rs.slice(0, document.body.dataset.page === "home" ? 4 : 999).map((r) => cardHTML(r)).join("");
  const home = $("[data-saved-home]"); if (home) home.hidden = !rs.length;
  const empty = $("[data-saved-empty]"); if (empty) empty.hidden = !!rs.length;
}

// ---------- Video: phát tại chỗ, xem liên tiếp ----------
const ytFrame = (id, title) => `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1" title="${esc(title || S.videoGuide)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
// Dải video ở trang chủ: bấm là phát ngay trong thẻ, mỗi lúc chỉ một video chạy.
{
  let cur = null, curHTML = "";
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-vplay]");
    if (!b) return;
    const card = b.closest("[data-vcard]"), media = b.parentElement;
    if (cur) { cur.innerHTML = curHTML; cur.closest("[data-vcard]").classList.remove("playing"); }
    cur = media; curHTML = media.innerHTML;
    media.innerHTML = ytFrame(card.dataset.id, $("strong", card)?.textContent);
    card.classList.add("playing");
    card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}
// Trang /video/: xem liên tiếp, bấm hoặc vuốt sang video kế. Đã bấm phát một lần thì video kế tự phát.
function pageVideo() {
  const st = $("[data-vstage]");
  if (!st) return;
  const vs = JSON.parse(st.dataset.videos), box = $("[data-vbox]", st);
  let i = 0, started = false;
  const want = new URLSearchParams(location.search).get("v");
  const show = (n, play = started) => {
    i = (n + vs.length) % vs.length;
    const v = vs[i];
    box.classList.toggle("vertical", !!v.sh);
    box.dataset.id = v.id;
    box.innerHTML = play ? ytFrame(v.id, v.t)
      : `<button class="lite-yt" type="button" data-vstart aria-label="${esc(S.play(v.t))}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" width="480" height="360"><span class="play" aria-hidden="true"></span></button>`;
    $("[data-vpos]", st).textContent = S.vpos(i + 1, vs.length);
    const vt = $("[data-vtitle]", st);
    vt.textContent = v.t;
    if (v.l) vt.setAttribute("lang", v.l); else vt.removeAttribute("lang");
    $("[data-vcredit]", st).innerHTML = `${S.videoBy(esc(v.k))} · <a href="${esc(v.w)}" rel="noopener" target="_blank">${S.watchYt}</a>`;
    $("[data-vrecipe]", st).href = `${LP}/mon/${v.s}/`;
  };
  box.addEventListener("click", (e) => { if (e.target.closest("[data-vstart]")) { started = true; show(i, true); } });
  $("[data-vprev]", st).onclick = () => show(i - 1);
  $("[data-vnext]", st).onclick = () => show(i + 1);
  if (vs.length < 2) { $("[data-vprev]", st).hidden = $("[data-vnext]", st).hidden = true; }
  let x0 = null;
  st.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  st.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60 && vs.length > 1) show(i + (dx < 0 ? 1 : -1));
  }, { passive: true });
  const k = vs.findIndex((v) => v.s === want);
  if (k > 0) show(k, false);
}

// ---------- Chế độ đêm, chữ lớn ----------
const prefs = (() => { try { return JSON.parse(localStorage.getItem("hnng-prefs") || "{}"); } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem("hnng-prefs", JSON.stringify(prefs)); } catch {} };
// Mặc định tối (data-theme="dark" có sẵn trong HTML); chỉ nhớ lựa chọn khi người dùng bấm nút.
const themeBtns = $$('[data-toggle="theme"]'); // header và chế độ nấu
const showTheme = () => {
  const dark = document.documentElement.dataset.theme !== "light";
  const label = dark ? S.light : S.dark;
  themeBtns.forEach((b) => { b.setAttribute("aria-label", label); b.setAttribute("title", label); });
  $('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0c0a09" : "#fafaf9");
};
showTheme();
themeBtns.forEach((b) => b.addEventListener("click", () => {
  prefs.theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = prefs.theme; savePrefs(); showTheme();
}));
$('[data-toggle="big"]')?.addEventListener("click", () => {
  prefs.big = !prefs.big;
  if (prefs.big) document.documentElement.dataset.big = "1"; else delete document.documentElement.dataset.big;
  savePrefs();
});
// Đổi ngôn ngữ: nhớ lựa chọn để lần sau mở web (kể cả link cũ) tự về đúng ngôn ngữ. Đoạn chuyển trang nằm trong <head> (templates.mjs).
$("[data-lang]")?.addEventListener("click", (e) => { prefs.lang = e.currentTarget.dataset.lang; savePrefs(); });

// ---------- Khởi động ----------
// Thành quả của bạn đọc (ảnh món đã nấu + bình luận): tải lười, chỉ khi trang có mục này.
const napThanhQua = () => import(BASE + "/assets/thanh-qua.js");
const PAGES = { home: pageHome, recipe: pageRecipe, list: pageList, search: pageSearch, shop: pageShop, saved: renderSaved, video: pageVideo,
  admin: () => napThanhQua().then((m) => m.quanTri({ $, esc, toast, BASE, LP })) };
if ($("[data-tq]")) napThanhQua().then((m) => m.thanhQua({ $, esc, store, toast, BASE })).catch(() => {});
PAGES[document.body.dataset.page]?.();
updateBadges();
if ("serviceWorker" in navigator && location.hostname !== "localhost") navigator.serviceWorker.register(BASE + "/sw.js", { scope: BASE + "/" }).catch(() => {});

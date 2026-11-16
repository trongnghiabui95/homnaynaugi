// Bếp Nhà Mình — JS phía trình duyệt. Món đã lưu và danh sách đi chợ chỉ lưu trên máy (IndexedDB).
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fold = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
// Đường dẫn gốc khi web chạy trong thư mục con (GitHub Pages: /ten-repo).
const BASE = document.documentElement.dataset.base || "";

// ---------- Lưu trữ: IndexedDB, dự phòng localStorage, dự phòng bộ nhớ tạm ----------
const store = (() => {
  const mem = new Map();
  let dbp = null;
  const db = () => (dbp ??= new Promise((ok, no) => {
    const req = indexedDB.open("bnm", 1);
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
      catch { try { const v = localStorage.getItem("bnm-" + k); return v == null ? (mem.has(k) ? mem.get(k) : def) : JSON.parse(v); } catch { return mem.has(k) ? mem.get(k) : def; } }
    },
    async set(k, v) {
      mem.set(k, v);
      try { await tx("readwrite", (s) => s.put(v, k)); }
      catch { try { localStorage.setItem("bnm-" + k, JSON.stringify(v)); } catch {} }
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
const allRecipes = () => (recipesCache ??= fetch(BASE + "/data/recipes.json").then((r) => (r.ok ? r.json() : [])).catch(() => []));

/** 0.5 → "½", 1.5 → "1½"; số khác làm tròn 1 chữ số, dấu phẩy thập phân. */
function qtyText(q) {
  if (!q) return "";
  const whole = Math.floor(q), frac = Math.round((q - whole) * 100) / 100;
  const F = { 0.25: "¼", 0.33: "⅓", 0.5: "½", 0.67: "⅔", 0.75: "¾" };
  if (frac && F[frac]) return `${whole || ""}${F[frac]}`;
  return String(Math.round(q * 10) / 10).replace(".", ",");
}

const ICON_PLAY = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M10.2 8.8v6.4l5-3.2z"/></svg>';
const ICON_CLOCK = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/></svg>';
function cardHTML(r, extra = "") {
  return `<a class="rcard" href="${BASE}/mon/${r.s}/"><div class="rcard-img">${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" width="480" height="360">` : `<span class="rcard-emoji" aria-hidden="true">🍽️</span>`}${r.v ? `<span class="has-video">${ICON_PLAY} Video</span>` : ""}</div>
  <div class="rcard-body"><strong>${esc(r.t)}</strong><span class="meta">${ICON_CLOCK} ${r.m} phút · ${esc(r.k || "")}</span>${extra}</div></a>`;
}

// ---------- Số trên thanh dưới ----------
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
  box.hidden = !timers.length;
  box.innerHTML = timers.map((t, i) => {
    const left = Math.max(0, Math.round((t.end - Date.now()) / 1000));
    return `<div class="timer${left ? "" : " ring"}" role="timer"><span>${esc(t.label)}</span><b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</b><button type="button" data-timer-stop="${i}" aria-label="Tắt hẹn giờ">✕</button></div>`;
  }).join("");
}
function startTimer(min, label) {
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  timers.push({ end: Date.now() + min * 60000, label, rung: false });
  renderTimers();
  toast(`Đã hẹn ${qtyText(min)} phút`);
}
setInterval(() => {
  if (!timers.length) return;
  for (const t of timers) if (!t.rung && Date.now() >= t.end) {
    t.rung = true; beep(); setTimeout(beep, 700); setTimeout(beep, 1400);
    navigator.vibrate?.([300, 150, 300, 150, 300]);
    toast(`Hết giờ: ${t.label}`);
  }
  renderTimers();
}, 1000);
document.addEventListener("click", (e) => {
  const stop = e.target.closest("[data-timer-stop]");
  if (stop) { timers.splice(Number(stop.dataset.timerStop), 1); renderTimers(); }
  const tm = e.target.closest("[data-timer]");
  if (tm) startTimer(Number(tm.dataset.timer), tm.dataset.label || "Hẹn giờ");
});

// ---------- Trang công thức ----------
async function pageRecipe() {
  const art = $(".recipe"), slug = art.dataset.slug, base = Number(art.dataset.serv) || 1;
  let serv = base;

  // Đổi số người ăn → nhân lượng nguyên liệu
  const out = $("[data-serv-out]");
  const applyServ = () => {
    out.textContent = serv;
    $$(".qty", art).forEach((q) => { const v = Number(q.dataset.q); if (v) q.textContent = qtyText((v * serv) / base); });
  };
  $("[data-serv-dec]").onclick = () => { if (serv > 1) { serv--; applyServ(); } };
  $("[data-serv-inc]").onclick = () => { if (serv < 50) { serv++; applyServ(); } };

  // Lưu món
  const fav = $("[data-fav]");
  const showFav = async () => {
    const on = (await store.get("saved", [])).includes(slug);
    fav.setAttribute("aria-pressed", on); fav.querySelector("span").textContent = on ? "Đã lưu" : "Lưu món";
  };
  fav.onclick = async () => {
    let saved = await store.get("saved", []);
    saved = saved.includes(slug) ? saved.filter((s) => s !== slug) : [slug, ...saved];
    await store.set("saved", saved); showFav(); updateBadges();
  };
  showFav();

  // Thêm vào đi chợ (theo số người ăn đang chọn)
  $("[data-add-shop]").onclick = async () => {
    const items = $$(".ings li", art).map((li) => {
      const q = Number(li.querySelector(".qty").dataset.q) || 0;
      const span = li.querySelector("span");
      return { ten: span.querySelector("strong").textContent, q: q ? (q * serv) / base : 0, u: span.childNodes[1]?.textContent.trim() || "", note: span.querySelector("small")?.textContent.replace(/[()]/g, "") || "" };
    });
    const shop = await store.get("shop", { recipes: {}, checked: {} });
    shop.recipes[slug] = { name: art.dataset.name, serv, items };
    await store.set("shop", shop); updateBadges();
    toast(`Đã thêm ${items.length} nguyên liệu vào danh sách đi chợ`);
  };

  // Video: bấm mới tải; bấm "Xem đoạn" nhảy đến giây tương ứng
  const box = $("[data-player]");
  const play = (start = 0) => {
    if (!box) return;
    const id = box.dataset.id;
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1${start ? `&start=${start}` : ""}" title="Video hướng dẫn" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    box.closest(".player").classList.add("sticky");
  };
  $("[data-play]")?.addEventListener("click", () => play(0));
  $$("[data-seek]").forEach((b) => b.addEventListener("click", () => { play(Number(b.dataset.seek)); box.scrollIntoView({ behavior: "smooth", block: "start" }); }));

  // Bấm vào bước để đánh dấu đã làm
  $$(".steps li").forEach((li, i) => {
    li.id = `buoc-${i + 1}`;
    li.querySelector("p").addEventListener("click", () => li.classList.toggle("done"));
  });

  // Chế độ nấu: từng bước chữ to, giữ màn hình sáng
  const view = $("[data-cook-view]"), steps = $$(".steps li");
  let idx = 0, lock = null;
  const show = () => {
    const li = steps[idx];
    $("[data-cook-pos]").textContent = `Bước ${idx + 1}/${steps.length}`;
    $("[data-cook-text]").textContent = li.querySelector("p").textContent;
    $("[data-cook-tools]").innerHTML = $$("[data-timer]", li).map((b) => b.outerHTML).join("");
    $("[data-cook-prev]").disabled = idx === 0;
    $("[data-cook-next]").textContent = idx === steps.length - 1 ? "Xong" : "Tiếp →";
  };
  const close = () => { view.hidden = true; lock?.release?.(); lock = null; document.body.style.overflow = ""; };
  $("[data-cook]").onclick = async () => {
    idx = 0; show(); view.hidden = false; document.body.style.overflow = "hidden";
    try { lock = await navigator.wakeLock?.request("screen"); } catch {}
  };
  $("[data-cook-close]").onclick = close;
  $("[data-cook-prev]").onclick = () => { if (idx > 0) { idx--; show(); } };
  $("[data-cook-next]").onclick = () => { if (idx < steps.length - 1) { idx++; show(); } else { close(); toast("Chúc ngon miệng!"); } };
  document.addEventListener("keydown", (e) => {
    if (view.hidden) return;
    if (e.key === "ArrowRight") $("[data-cook-next]").click();
    if (e.key === "ArrowLeft") $("[data-cook-prev]").click();
    if (e.key === "Escape") close();
  });
}

// ---------- Trang tìm món ----------
async function pageSearch() {
  const list = await allRecipes();
  const input = $("#q"), out = $("[data-results]"), count = $("[data-count]"), hint = $("[data-hint]");
  const params = new URLSearchParams(location.search);
  const state = { mode: params.get("mode") === "nl" ? "nl" : "ten", c: "", m: "" };
  input.value = params.get("q") || "";

  const run = () => {
    const q = fold(input.value);
    let hits = list.filter((r) => (!state.c || r.c === state.c) && (!state.m || (r.m && r.m <= Number(state.m))));
    let extra = () => "";
    if (state.mode === "nl" && q) {
      const want = q.split(/[,;]+|\s+va\s+/).map((s) => s.trim()).filter(Boolean);
      hits = hits.map((r) => ({ r, n: want.filter((w) => r.g.some((g) => g.includes(w))).length }))
        .filter((x) => x.n).sort((a, b) => b.n - a.n || a.r.m - b.r.m).map((x) => Object.assign(x.r, { _n: x.n }));
      extra = (r) => `<span class="meta">Có ${r._n}/${want.length} nguyên liệu</span>`;
    } else if (q) {
      const terms = q.split(/\s+/);
      hits = hits.filter((r) => terms.every((t) => r.f.includes(t) || r.g.some((g) => g.includes(t))))
        .sort((a, b) => Number(fold(b.t).includes(q)) - Number(fold(a.t).includes(q)));
    }
    out.innerHTML = hits.map((r) => cardHTML(r, extra(r))).join("");
    count.textContent = hits.length ? `${hits.length} món` : "Không tìm thấy món phù hợp. Thử từ khác ngắn hơn.";
  };
  const setMode = (m) => {
    state.mode = m;
    $$("[data-mode]").forEach((b) => b.setAttribute("aria-selected", b.dataset.mode === m));
    input.placeholder = m === "nl" ? "Nhập nguyên liệu, cách nhau dấu phẩy: trứng, cà chua" : "Ví dụ: trứng, mì, sinh tố…";
    hint.textContent = m === "nl" ? "Món nào dùng nhiều nguyên liệu bạn có nhất sẽ lên đầu." : "Gõ không dấu vẫn tìm được.";
    run();
  };
  $$("[data-mode]").forEach((b) => (b.onclick = () => { setMode(b.dataset.mode); input.focus(); }));
  $$("[data-filter]").forEach((g) => g.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    state[g.dataset.filter] = b.dataset.v;
    $$(".chip", g).forEach((x) => x.setAttribute("aria-pressed", x === b));
    run();
  }));
  input.addEventListener("input", run);
  setMode(state.mode);
}

// ---------- Trang đi chợ ----------
async function pageShop() {
  const box = $("[data-shop]");
  const render = async () => {
    const shop = await store.get("shop", { recipes: {}, checked: {} });
    shop.checked ??= {};
    const rs = Object.entries(shop.recipes);
    if (!rs.length) { box.innerHTML = `<div class="empty"><p class="empty-title">Danh sách trống</p><p>Ở trang công thức, bấm “Thêm vào danh sách đi chợ”.</p><p><a class="btn ghost" href="${BASE}/tim-kiem/">Tìm món</a></p></div>`; return; }
    // Gộp nguyên liệu trùng tên và đơn vị
    const merged = new Map();
    for (const [, r] of rs) for (const it of r.items) {
      const key = fold(it.ten) + "|" + fold(it.u);
      const m = merged.get(key) || { ten: it.ten, u: it.u, q: 0, from: [] };
      m.q += it.q || 0; m.from.push(r.name); merged.set(key, m);
    }
    box.innerHTML = `<div class="shop-recipes">${rs.map(([s, r]) => `<span class="chip"><a href="${BASE}/mon/${s}/">${esc(r.name)}</a> · ${r.serv} người<button type="button" data-rm="${s}" aria-label="Bỏ món ${esc(r.name)}">✕</button></span>`).join("")}</div>
      <ul class="shop-list">${[...merged].sort((a, b) => a[1].ten.localeCompare(b[1].ten, "vi")).map(([k, m]) => `<li><label><input type="checkbox" data-k="${esc(k)}" ${shop.checked[k] ? "checked" : ""}><span><strong>${esc(m.ten)}</strong> ${m.q ? `${qtyText(m.q)} ${esc(m.u)}` : ""}<small>${esc([...new Set(m.from)].join(", "))}</small></span></label></li>`).join("")}</ul>`;
    $$("[data-k]", box).forEach((c) => (c.onchange = async () => { const s = await store.get("shop"); s.checked ??= {}; s.checked[c.dataset.k] = c.checked; await store.set("shop", s); }));
    $$("[data-rm]", box).forEach((b) => (b.onclick = async () => { const s = await store.get("shop"); delete s.recipes[b.dataset.rm]; await store.set("shop", s); updateBadges(); render(); }));
  };
  $("[data-shop-share]").onclick = async () => {
    const items = $$(".shop-list li").filter((li) => !li.querySelector("input").checked).map((li) => "☐ " + li.querySelector("strong").textContent + " " + (li.querySelector("strong").nextSibling?.textContent || "").trim());
    if (!items.length) return toast("Không còn gì cần mua");
    const text = `Cần mua (${items.length} món):\n${items.join("\n")}`;
    try { if (navigator.share) await navigator.share({ title: "Danh sách đi chợ", text }); else { await navigator.clipboard.writeText(text); toast("Đã chép danh sách, dán vào Zalo để gửi."); } } catch {}
  };
  $("[data-shop-clear]").onclick = async () => {
    const s = await store.get("shop", { recipes: {}, checked: {} });
    const left = $$(".shop-list input").filter((c) => !c.checked).length;
    if (!left) { s.recipes = {}; s.checked = {}; } else { for (const k of Object.keys(s.checked || {})) if (s.checked[k]) delete s.checked[k]; }
    await store.set("shop", s); updateBadges(); render();
    toast(left ? "Đã bỏ dấu các món đã mua" : "Đã xoá danh sách");
  };
  render();
}

// ---------- Món đã lưu (trang Đã lưu và trang chủ) ----------
async function renderSaved() {
  const grid = $("[data-saved-grid]");
  if (!grid) return;
  const saved = await store.get("saved", []);
  const byS = Object.fromEntries((await allRecipes()).map((r) => [r.s, r]));
  const list = saved.map((s) => byS[s]).filter(Boolean);
  grid.innerHTML = list.slice(0, document.body.dataset.page === "home" ? 6 : 999).map((r) => cardHTML(r)).join("");
  const home = $("[data-saved-home]"); if (home) home.hidden = !list.length;
  const empty = $("[data-saved-empty]"); if (empty) empty.hidden = !!list.length;
}

// ---------- Chế độ đêm, chữ lớn ----------
const prefs = (() => { try { return JSON.parse(localStorage.getItem("bnm-prefs") || "{}"); } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem("bnm-prefs", JSON.stringify(prefs)); } catch {} };
$('[data-toggle="theme"]')?.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  prefs.theme = dark ? "light" : "dark";
  document.documentElement.dataset.theme = prefs.theme; savePrefs();
});
$('[data-toggle="big"]')?.addEventListener("click", () => {
  prefs.big = !prefs.big;
  if (prefs.big) document.documentElement.dataset.big = "1"; else delete document.documentElement.dataset.big;
  savePrefs();
});

// ---------- Khởi động ----------
const PAGES = { recipe: pageRecipe, search: pageSearch, shop: pageShop, home: renderSaved, saved: renderSaved };
PAGES[document.body.dataset.page]?.();
updateBadges();
if ("serviceWorker" in navigator && location.hostname !== "localhost") navigator.serviceWorker.register(BASE + "/sw.js", { scope: BASE + "/" }).catch(() => {});

// Hôm Nay Nấu Gì — JS phía trình duyệt. Sổ tay món ngon, danh sách đi chợ, mâm cơm vừa quay chỉ lưu trên máy (IndexedDB).
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
const allRecipes = () => (recipesCache ??= fetch(BASE + "/data/recipes.json").then((r) => (r.ok ? r.json() : [])).catch(() => []));
const copyOrShare = async (title, text, okMsg) => {
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ title, text });
    else { await navigator.clipboard.writeText(text); toast(okMsg); }
  } catch (e) { if (e?.name !== "AbortError") toast("Không chép được, hãy thử lại"); }
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
  play: svg('<circle cx="12" cy="12" r="8.5"/><path d="M10.2 8.8v6.4l5-3.2z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>'),
  unlock: svg('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/>'),
};
/** Khung trung tính khi món chưa có ảnh hoặc ảnh hỏng link (giống noPhoto() lúc build). */
const noPhoto = (ten) => `<span class="ph" aria-hidden="true"><span>${esc(ten)}</span></span>`;
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

/** Thẻ món phía trình duyệt, giống recipeCard() lúc build. */
function cardHTML(r, extra = "") {
  const k = fold(r.k);
  return `<a class="rcard${["de", "vua", "kho"].includes(k) ? ` k-${k}` : ""}" href="${BASE}/mon/${r.s}/"><div class="rcard-img">${noPhoto(r.t)}${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" decoding="async" width="480" height="360">` : ""}
  ${r.v ? `<span class="badge-video">${IC.play} Video</span>` : ""}</div>
  <div class="rcard-body"><small class="rcard-cat">${esc(r.cn)}</small><strong>${esc(r.t)}</strong>${extra}
  <span class="rcard-meta"><span>${r.m ? `${IC.clock} ${r.m} phút` : ""}</span>${r.k ? `<b>${esc(r.k)}</b>` : ""}</span></div></a>`;
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
    return `<div class="timer${left ? "" : " ring"}" role="timer"><span>${esc(t.label)}</span><b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</b><button type="button" data-timer-stop="${i}" aria-label="Tắt hẹn giờ">✕</button></div>`;
  }).join("");
}
function startTimer(min, label) {
  try { audioCtx ??= new (window.AudioContext || window.webkitAudioContext)(); } catch {}
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

// ---------- Trang chủ: Hôm nay nấu gì? ----------
async function pageHome() {
  renderSaved();
  const box = $("[data-spin]");
  if (!box) return;
  const all = await allRecipes();
  const slotsEl = $("[data-spin-slots]", box), shopBtn = $("[data-spin-shop]", box);
  const MAM = JSON.parse(slotsEl.dataset.mam);
  const saved = await store.get("spin", null);
  const st = { kind: saved?.kind || "an", mode: saved?.mode || "mam", picks: saved?.picks || {}, locks: saved?.locks || {} };

  const filters = () => Object.fromEntries($$("[data-spin-f]", box).map((s) => [s.dataset.spinF, s.value]));
  // Đồ uống: một ngăn riêng chỉ quay danh mục do-uong. Món ăn: mâm cơm 3 món hoặc 1 món, không lẫn đồ uống.
  const slotDefs = () => (st.kind === "uong" ? [{ key: "uong", cat: "do-uong", label: "Đồ uống cho bạn" }]
    : st.mode === "mam" ? MAM.map(([c, label], i) => ({ key: "m" + i, cat: c, label })) : [{ key: "one", cat: "", label: "Gợi ý cho bạn" }]);
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
  const pic = (r) => noPhoto(r.t) + (r.img ? `<img src="${esc(r.img)}" alt="" width="240" height="180">` : "");
  // Ưu tiên món có ảnh: món có ảnh có 3 phần cơ hội, món chưa có ảnh 1 phần (vẫn ra để mâm cơm đa dạng).
  const pickFin = (p) => rand([...p].sort((a, b) => !!b.img - !!a.img).flatMap((r) => (r.img ? [r, r, r] : [r])));
  const slotHTML = (d) => {
    const r = bySlug[st.picks[d.key]];
    if (!r) return `<div class="slot empty-slot" data-slot="${d.key}"><div><div class="slot-label">${esc(d.label)}</div><p>Chờ quay</p></div></div>`;
    const locked = !!st.locks[d.key];
    return `<div class="slot${["de", "vua", "kho"].includes(fold(r.k)) ? ` k-${fold(r.k)}` : ""}" data-slot="${d.key}">
        <div class="slot-img">${pic(r)}</div>
        <div><div class="slot-label">${esc(d.label)}</div><strong>${esc(r.t)}</strong><span class="meta">${IC.clock} ${r.m} phút · ${esc(r.k || "")}</span><br><a class="more" href="${BASE}/mon/${r.s}/">Cách nấu →</a></div>
        <button class="lock" type="button" data-lock="${d.key}" aria-pressed="${locked}" aria-label="${locked ? "Bỏ khoá" : "Khoá"} món ${esc(r.t)}">${locked ? IC.lock : IC.unlock}<span>${locked ? "Đã giữ" : "Giữ"}</span></button>
      </div>`;
  };
  const sync = () => {
    const defs = slotDefs();
    $$("[data-spin-mode]", box).forEach((b) => b.setAttribute("aria-selected", b.dataset.spinMode === st.mode));
    $$("[data-spin-kind]", box).forEach((i) => (i.checked = i.value === st.kind));
    $("[data-spin-modes]", box).hidden = st.kind === "uong";
    const nf = Object.values(filters()).filter(Boolean).length;
    $("[data-spin-fcount]", box).textContent = nf ? ` (${nf})` : "";
    shopBtn.hidden = !defs.some((d) => bySlug[st.picks[d.key]]);
    shopBtn.querySelector("span").textContent = st.kind === "an" && st.mode === "mam" ? "Thêm cả mâm vào Đi chợ" : "Thêm vào Đi chợ";
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
  const roll = async ({ d, p, fin }, i) => {
    const el = $(`[data-slot="${d.key}"]`, slotsEl);
    const n = 9 + i * 4, dur = 950 + i * 380;
    const strip = Array.from({ length: n }, () => rand(p)).concat(fin);
    el.className = "slot rolling";
    el.innerHTML = `<div class="slot-img"><div class="reel" style="--d:${dur}ms" aria-hidden="true">${strip.map((r) => `<div>${pic(r)}</div>`).join("")}</div></div><div><div class="slot-label">${esc(d.label)}</div><strong>${esc(rand(p).t)}</strong><span class="meta">Đang chọn…</span></div>`;
    const reel = $(".reel", el), name = $("strong", el);
    reel.getBoundingClientRect();
    reel.style.transform = `translateY(-${n * 100}%)`;
    const tick = setInterval(() => (name.textContent = rand(p).t), 90);
    await wait(dur);
    clearInterval(tick);
    st.picks[d.key] = fin.s;
    el.outerHTML = slotHTML(d);
    $(`[data-slot="${d.key}"]`, slotsEl).classList.add("landed");
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
  };

  const spin = async () => {
    if (busy) return;
    const defs = slotDefs().filter((d) => !st.locks[d.key] || !bySlug[st.picks[d.key]]);
    if (!defs.length) return toast("Bạn đã khoá hết món. Bỏ khoá món muốn đổi.");
    const rolls = [], empties = [];
    for (const d of defs) {
      const p = pool(d);
      if (!p.length) { delete st.picks[d.key]; empties.push(d); continue; }
      rolls.push({ d, p, fin: pickFin(p.length > 1 ? p.filter((r) => r.s !== st.picks[d.key]) : p) });
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !rolls.length) {
      rolls.forEach(({ d, fin }) => (st.picks[d.key] = fin.s));
      render();
    } else {
      busy = true; goBtn.disabled = true; goBtn.classList.add("spinning"); goText.textContent = "Đang quay…";
      slotsEl.setAttribute("aria-busy", "true");
      empties.forEach((d) => ($(`[data-slot="${d.key}"]`, slotsEl).outerHTML = slotHTML(d)));
      await Promise.all(rolls.map(roll));
      busy = false; goBtn.disabled = false; goBtn.classList.remove("spinning"); goText.textContent = "Quay lại lần nữa";
      slotsEl.removeAttribute("aria-busy");
      sync();
    }
    save();
    if (empties.length) toast("Chưa có món hợp bộ lọc cho một số ngăn. Thử nới bộ lọc.");
  };

  $$("[data-spin-mode]", box).forEach((b) => (b.onclick = () => { if (busy) return; st.mode = b.dataset.spinMode; save(); render(); }));
  $$("[data-spin-kind]", box).forEach((i) => (i.onchange = () => { if (busy) return render(); st.kind = i.value; save(); render(); }));
  $$("[data-spin-f]", box).forEach((s) => s.addEventListener("change", sync));
  goBtn.onclick = spin;
  shopBtn.onclick = async () => {
    const rs = slotDefs().map((d) => bySlug[st.picks[d.key]]).filter(Boolean);
    await addToShop(rs.map((r) => ({ slug: r.s, name: r.t, serv: r.sv, items: r.ig.map(([ten, q, u]) => ({ ten, q, u })) })));
    toast(`Đã thêm ${rs.length} món vào danh sách đi chợ`);
  };
  render();
}

// ---------- Trang công thức ----------
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
    fav.setAttribute("aria-pressed", on); fav.querySelector("span").textContent = on ? "Đã lưu" : "Lưu sổ tay";
  };
  fav.onclick = async () => {
    let saved = await store.get("saved", []);
    const on = saved.includes(slug);
    saved = on ? saved.filter((s) => s !== slug) : [slug, ...saved];
    await store.set("saved", saved); showFav(); updateBadges();
    toast(on ? "Đã bỏ khỏi sổ tay" : "Đã lưu vào sổ tay");
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
    const text = `🛒 Đi chợ: ${art.dataset.name} (${serv} người)\n${items.map((i) => `☐ ${i.ten}${i.q ? `: ${qtyText(i.q)} ${i.u}` : i.note ? ` (${i.note})` : ""}`).join("\n")}`;
    copyOrShare("Danh sách đi chợ", text, "Đã chép danh sách, dán vào Zalo hoặc Ghi chú.");
  };
  $("[data-add-shop]").onclick = async () => {
    const items = pickItems();
    await addToShop([{ slug, name: art.dataset.name, serv, items }]);
    toast(`Đã thêm ${items.length} nguyên liệu vào Đi chợ`);
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
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.id}?autoplay=1&rel=0&playsinline=1${start ? `&start=${start}` : ""}" title="Video hướng dẫn" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    // Video ngang dính trên đầu khi cuộn; video dọc (Shorts) quá cao nên không dính
    if (!box.classList.contains("vertical")) box.closest(".media").classList.add("sticky");
  };
  $("[data-play]")?.addEventListener("click", () => play(0));
  $$("[data-seek]").forEach((b) => b.addEventListener("click", () => { play(Number(b.dataset.seek)); box.scrollIntoView({ behavior: "smooth", block: "start" }); }));

  // Bấm vào nội dung bước để đánh dấu đã làm
  const steps = $$(".steps li");
  steps.forEach((li) => li.querySelector("p").addEventListener("click", () => li.classList.toggle("done")));

  // Chế độ đang nấu: từng bước chữ to, đánh dấu xong, giữ màn hình sáng
  const view = $("[data-cook-view]");
  let idx = 0, lock = null;
  const show = () => {
    const li = steps[idx], img = li.querySelector(".step-img"), cimg = $("[data-cook-img]");
    $("[data-cook-pos]").textContent = `Bước ${idx + 1}/${steps.length}`;
    $("[data-cook-bar]").style.width = `${((idx + 1) / steps.length) * 100}%`;
    $("[data-cook-title]").textContent = li.querySelector("h3")?.textContent || "";
    $("[data-cook-text]").textContent = li.querySelector("p").textContent;
    cimg.hidden = !img; if (img) cimg.src = img.src;
    $("[data-cook-done]").checked = li.classList.contains("done");
    $("[data-cook-tools]").innerHTML = $$("[data-timer]", li).map((b) => b.outerHTML).join("");
    $("[data-cook-prev]").disabled = idx === 0;
    $("[data-cook-next]").textContent = idx === steps.length - 1 ? "Hoàn thành" : "Tiếp →";
  };
  const close = () => { view.hidden = true; lock?.release?.(); lock = null; document.body.style.overflow = ""; };
  $("[data-cook]").onclick = async () => {
    idx = Math.max(0, steps.findIndex((li) => !li.classList.contains("done"))); show();
    view.hidden = false; document.body.style.overflow = "hidden";
    try { lock = await navigator.wakeLock?.request("screen"); } catch {}
  };
  $("[data-cook-done]").onchange = (e) => steps[idx].classList.toggle("done", e.target.checked);
  $("[data-cook-close]").onclick = close;
  $("[data-cook-prev]").onclick = () => { if (idx > 0) { idx--; show(); } };
  $("[data-cook-next]").onclick = () => {
    steps[idx].classList.add("done");
    if (idx < steps.length - 1) { idx++; show(); } else { close(); toast("Xong rồi! Chúc cả nhà ngon miệng."); }
  };
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
    $("[data-fcount]").textContent = n ? `${n} món` : "Không có món nào hợp bộ lọc.";
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
      if (!have.length) { out.innerHTML = ""; count.textContent = "Chọn ít nhất một nguyên liệu."; return; }
      const hits = list.map((r) => {
        const got = r.g.filter((g) => have.some((h) => g.includes(h) || h.includes(g))).length;
        return { r, got, total: r.g.length || 1 };
      }).filter((x) => x.got).sort((a, b) => b.got / b.total - a.got / a.total || (a.total - a.got) - (b.total - b.got) || a.r.m - b.r.m);
      n = hits.length;
      html = hits.map(({ r, got, total }) => cardHTML(r, `<span class="meta">${got >= total ? "✅ Đủ" : "Có"} ${got}/${total} nguyên liệu</span>`)).join("");
      count.textContent = n ? `${n} món nấu được với nguyên liệu bạn chọn` : "Chưa có món nào dùng các nguyên liệu này.";
    } else {
      const q = fold(input.value), terms = q.split(/\s+/).filter(Boolean);
      const hits = list.filter((r) => (!st.tag || r.tg.includes(st.tag)) && terms.every((t) => r.f.includes(t) || r.g.some((g) => g.includes(t))))
        .sort((a, b) => Number(fold(b.t).includes(q)) - Number(fold(a.t).includes(q)));
      n = hits.length;
      html = hits.map((r) => cardHTML(r)).join("");
      count.textContent = n ? `${n} món` : "Không tìm thấy món phù hợp. Thử từ khác ngắn hơn.";
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
      if (!$(`.chip[data-v="${CSS.escape(v)}"]`, fridge)) fridge.insertAdjacentHTML("beforeend", `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="true">${esc(e.target.value.split(",").find((x) => fold(x) === v).trim())}</button>`);
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
    if (!rs.length) { box.innerHTML = `<div class="empty"><p class="empty-title">Danh sách trống</p><p>Ở trang công thức, bấm “Thêm vào Đi chợ”, hoặc quay mâm cơm ở trang chủ.</p><p><a class="btn ghost" href="${BASE}/">Hôm nay nấu gì?</a></p></div>`; return; }
    // Gộp nguyên liệu trùng tên và đơn vị
    const merged = new Map();
    for (const [, r] of rs) for (const it of r.items) {
      const key = fold(it.ten) + "|" + fold(it.u);
      const m = merged.get(key) || { ten: it.ten, u: it.u, q: 0, from: [] };
      m.q += it.q || 0; m.from.push(r.name); merged.set(key, m);
    }
    box.innerHTML = `<div class="shop-recipes">${rs.map(([s, r]) => `<span class="chip"><a href="${BASE}/mon/${s}/">${esc(r.name)}</a> · ${r.serv} người<button type="button" data-rm="${s}" aria-label="Bỏ món ${esc(r.name)}">✕</button></span>`).join("")}</div>
      <ul class="shop-list">${[...merged].sort((a, b) => a[1].ten.localeCompare(b[1].ten, "vi")).map(([k, m]) => `<li><label><input type="checkbox" data-k="${esc(k)}" ${shop.checked[k] ? "checked" : ""}><span><strong>${esc(m.ten)}</strong> <em>${m.q ? `${qtyText(m.q)} ${esc(m.u)}` : ""}</em><small>${esc([...new Set(m.from)].join(", "))}</small></span></label></li>`).join("")}</ul>`;
    $$("[data-k]", box).forEach((c) => (c.onchange = async () => { const s = await store.get("shop"); s.checked ??= {}; s.checked[c.dataset.k] = c.checked; await store.set("shop", s); }));
    $$("[data-rm]", box).forEach((b) => (b.onclick = async () => { const s = await store.get("shop"); delete s.recipes[b.dataset.rm]; await store.set("shop", s); updateBadges(); render(); }));
  };
  $("[data-shop-share]").onclick = () => {
    const items = $$(".shop-list li").filter((li) => !li.querySelector("input").checked).map((li) => `☐ ${li.querySelector("strong").textContent} ${li.querySelector("em").textContent}`.trim());
    if (!items.length) return toast("Không còn gì cần mua");
    copyOrShare("Danh sách đi chợ", `🛒 Cần mua (${items.length} món):\n${items.join("\n")}`, "Đã chép danh sách, dán vào Zalo để gửi.");
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
const ytFrame = (id, title) => `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1" title="${esc(title || "Video hướng dẫn")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
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
      : `<button class="lite-yt" type="button" data-vstart aria-label="Phát video ${esc(v.t)}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" width="480" height="360"><span class="play" aria-hidden="true"></span></button>`;
    $("[data-vpos]", st).textContent = `Video ${i + 1}/${vs.length}`;
    $("[data-vtitle]", st).textContent = v.t;
    $("[data-vcredit]", st).innerHTML = `Video: ${v.k ? `kênh <strong>${esc(v.k)}</strong>` : "YouTube"} · <a href="${esc(v.w)}" rel="noopener" target="_blank">Xem trên YouTube</a>`;
    $("[data-vrecipe]", st).href = `${BASE}/mon/${v.s}/`;
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
const PAGES = { home: pageHome, recipe: pageRecipe, list: pageList, search: pageSearch, shop: pageShop, saved: renderSaved, video: pageVideo };
PAGES[document.body.dataset.page]?.();
updateBadges();
if ("serviceWorker" in navigator && location.hostname !== "localhost") navigator.serviceWorker.register(BASE + "/sw.js", { scope: BASE + "/" }).catch(() => {});

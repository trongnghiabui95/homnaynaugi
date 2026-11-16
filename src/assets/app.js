// Kiến thức làm mẹ — JS phía trình duyệt. Dữ liệu của bé chỉ lưu trên máy (IndexedDB), không gửi đi đâu.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fold = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const DAY = 864e5;

// ---------- Lưu trữ: IndexedDB, dự phòng localStorage, dự phòng bộ nhớ tạm ----------
const store = (() => {
  const mem = new Map();
  let dbp = null;
  const db = () => (dbp ??= new Promise((ok, no) => {
    const req = indexedDB.open("klm", 1);
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
      catch { try { const v = localStorage.getItem("klm-" + k); return v == null ? (mem.has(k) ? mem.get(k) : def) : JSON.parse(v); } catch { return mem.has(k) ? mem.get(k) : def; } }
    },
    async set(k, v) {
      mem.set(k, v);
      try { await tx("readwrite", (s) => s.put(v, k)); }
      catch { try { localStorage.setItem("klm-" + k, JSON.stringify(v)); } catch {} }
    },
    async all() {
      const keys = ["babies", "activeBaby", "checks"];
      const babies = await this.get("babies", []);
      const out = {};
      for (const k of keys) out[k] = await this.get(k);
      for (const b of babies) out["vx:" + b.id] = await this.get("vx:" + b.id, {});
      return out;
    },
  };
})();

const toast = (msg) => {
  const t = document.createElement("div");
  t.className = "toast"; t.role = "status"; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
};
const getJSON = (u) => fetch(u).then((r) => (r.ok ? r.json() : [])).catch(() => []);

// ---------- Tuổi ----------
const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const fmt = (d) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const iso = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

/** Số ngày tuổi; âm khi chưa sinh (tính lùi từ ngày dự sinh). */
function ageDays(b) {
  const diff = Math.round((today() - parseDate(b.date)) / DAY);
  return b.kind === "expecting" ? Math.min(diff, -1) : diff;
}
function ageLabel(b) {
  const days = ageDays(b);
  if (b.kind === "expecting") {
    const left = -days, week = Math.max(0, 40 - Math.ceil(left / 7));
    return { big: left <= 0 ? "Đã đến ngày dự sinh" : `Còn ${left} ngày`, small: left > 0 ? `đến ngày dự sinh · khoảng tuần ${week} của thai kỳ` : "" };
  }
  if (days < 0) return { big: "Ngày sinh ở tương lai", small: "Hãy kiểm tra lại ngày sinh" };
  if (days < 31) return { big: `${days} ngày tuổi`, small: `${Math.floor(days / 7)} tuần ${days % 7} ngày` };
  const dob = parseDate(b.date), t = today();
  let months = (t.getFullYear() - dob.getFullYear()) * 12 + t.getMonth() - dob.getMonth();
  if (t.getDate() < dob.getDate()) months--;
  if (months < 24) return { big: `${months} tháng tuổi`, small: `${Math.floor(days / 7)} tuần tuổi` };
  return { big: `${Math.floor(months / 12)} tuổi${months % 12 ? ` ${months % 12} tháng` : ""}`, small: "" };
}

// ---------- Hồ sơ bé ----------
async function babies() { return store.get("babies", []); }
async function activeBaby() {
  const list = await babies();
  const id = await store.get("activeBaby");
  return list.find((b) => b.id === id) || list[0] || null;
}
async function addBaby(form) {
  const f = new FormData(form);
  const b = { id: Date.now().toString(36), kind: f.get("kind"), date: f.get("date"), name: (f.get("name") || "").trim() || "Bé", sex: f.get("sex") || "" };
  if (!b.date) return null;
  const list = await babies();
  list.push(b);
  await store.set("babies", list);
  await store.set("activeBaby", b.id);
  return b;
}
function bindKindLabel(form) {
  const lab = $("[data-label-date]", form);
  const upd = () => { lab.textContent = form.kind.value === "expecting" ? "Ngày dự sinh" : "Ngày sinh"; };
  $$('input[name="kind"]', form).forEach((r) => r.addEventListener("change", upd));
  upd();
}

// ---------- Lịch tiêm cá nhân ----------
async function vaccinePlan(b) {
  const list = await getJSON("/data/vaccines.json");
  const done = await store.get("vx:" + b.id, {});
  const dob = parseDate(b.date), t = today();
  return list.map((v) => {
    const due = new Date(dob.getTime() + v.som * DAY), last = new Date(dob.getTime() + v.muon * DAY);
    const isDone = !!done[v.ma];
    const status = isDone ? "done" : t > last ? "late" : t >= due ? "due" : (due - t) / DAY <= 14 ? "soon" : "later";
    return { ...v, due, last, isDone, status };
  }).sort((a, b) => a.due - b.due);
}
const ST = { done: ["done", "đã tiêm"], due: ["soon", "đến hạn"], soon: ["soon", "sắp đến"], late: ["late", "quá hạn"] };
const stBadge = (s) => (ST[s] ? `<span class="st ${ST[s][0]}">${ST[s][1]}</span>` : "");

function downloadICS(b, plan) {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//kienthuclamme//vi", "CALSCALE:GREGORIAN"];
  for (const v of plan.filter((p) => !p.isDone)) {
    lines.push("BEGIN:VEVENT", `UID:${v.ma}-${b.id}@kienthuclamme`, `DTSTAMP:${now}`, `DTSTART;VALUE=DATE:${iso(v.due)}`,
      `SUMMARY:Tiêm ${v.ten_vaccine} (mũi ${v.mui_so}) – ${b.name}`.replace(/[,;]/g, "\\$&"),
      `DESCRIPTION:Phòng ${v.phong_benh}. ${v.luu_y || ""} Hỏi lại cán bộ y tế nơi tiêm.`.replace(/[,;]/g, "\\$&"),
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Nhắc lịch tiêm cho bé", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" })), download: `lich-tiem-${b.name}.ics` });
  a.click();
  toast("Đã tạo file lịch. Mở file để thêm vào lịch điện thoại.");
}

// ---------- Trang: Hôm nay ----------
async function pageHome() {
  const box = $("#today");
  const render = async () => {
    const b = await activeBaby();
    if (!b) { bindKindLabel($("[data-form=quick-baby]")); return; }
    const days = ageDays(b), age = ageLabel(b);
    const stages = await getJSON("/data/stages.json");
    const st = stages.find((s) => days >= s.tu && days <= s.den);
    const ms = st ? (await getJSON("/data/milestones.json")).filter((m) => m.stage_slug === st.slug).slice(0, 3) : [];
    const plan = b.kind === "born" ? (await vaccinePlan(b)).filter((v) => !v.isDone).slice(0, 2) : [];
    const items = [];
    if (st) items.push(`<li><strong>Giai đoạn: ${esc(st.ten)}</strong>${esc(st.tom_tat)} <a href="/giai-doan/${st.slug}/">Xem chi tiết →</a></li>`);
    if (b.kind === "expecting") items.push(`<li><strong>Chuẩn bị đi sinh</strong>Kiểm tra danh sách đồ cần mang. <a href="/chuan-bi-di-sinh/">Mở danh sách →</a></li>`);
    for (const m of ms) items.push(`<li><strong>${esc(m.linh_vuc)}</strong>${esc(m.mo_ta)}</li>`);
    for (const v of plan) items.push(`<li><strong>Mũi tiêm: ${esc(v.ten_vaccine)} ${stBadge(v.status)}</strong>Dự kiến ${fmt(v.due)}. <a href="/lich-tiem-chung/">Lịch tiêm →</a></li>`);
    box.innerHTML = `<div class="today-head"><h2>${esc(b.name)}</h2><a class="small" href="/be-cua-toi/">Đổi bé</a></div>
      <p class="today-age">${esc(age.big)}</p>${age.small ? `<p class="muted">${esc(age.small)}</p>` : ""}
      <ul class="today-list">${items.join("") || "<li>Nội dung cho giai đoạn này đang được biên soạn.</li>"}</ul>`;
  };
  const form = $("[data-form=quick-baby]");
  form?.addEventListener("submit", async (e) => { e.preventDefault(); if (await addBaby(form)) render(); });
  render();
}

// ---------- Trang: Chuẩn bị đi sinh ----------
async function pageChecklist() {
  const checks = await store.get("checks", {});
  const boxes = $$("[data-check]");
  const upd = () => {
    const n = boxes.filter((c) => c.checked).length;
    $("[data-progress] .bar span").style.width = `${boxes.length ? (n / boxes.length) * 100 : 0}%`;
    $("[data-progress-text]").textContent = `${n}/${boxes.length}`;
  };
  boxes.forEach((c) => {
    c.checked = !!checks[c.dataset.check];
    c.addEventListener("change", async () => { checks[c.dataset.check] = c.checked; await store.set("checks", checks); upd(); });
  });
  upd();
  $("[data-share]")?.addEventListener("click", async () => {
    const left = boxes.filter((c) => !c.checked).map((c) => "☐ " + c.closest("label").querySelector("strong").textContent);
    const text = `Đồ đi sinh còn thiếu (${left.length} món):\n${left.join("\n")}\n\n${location.href}`;
    try { if (navigator.share) await navigator.share({ title: "Đồ chuẩn bị đi sinh", text }); else { await navigator.clipboard.writeText(text); toast("Đã chép danh sách, dán vào Zalo để gửi."); } } catch {}
  });
}

// ---------- Trang: Tiêm chủng ----------
async function pageVaccines() {
  const b = await activeBaby(), box = $("#my-vaccines");
  if (!b) { box.hidden = false; box.innerHTML = `<p>Thêm bé ở <a href="/be-cua-toi/">Bé của tôi</a> để xem ngày tiêm dự kiến của riêng bé.</p>`; return; }
  if (b.kind === "expecting") { box.hidden = false; box.innerHTML = `<p>Sau khi bé chào đời, cập nhật ngày sinh ở <a href="/be-cua-toi/">Bé của tôi</a> để tính lịch tiêm.</p>`; return; }
  const render = async () => {
    const plan = await vaccinePlan(b);
    box.hidden = false;
    if (!plan.length) { box.innerHTML = `<p>Lịch tiêm đang được biên soạn. Khi có dữ liệu, ngày tiêm của ${esc(b.name)} sẽ hiện ở đây.</p>`; return; }
    box.innerHTML = `<h2>Lịch của ${esc(b.name)}</h2><p class="muted small">Đánh dấu mũi đã tiêm. Ngày là dự kiến theo ngày sinh.</p>
      <ul class="vx-list">${plan.map((v) => `<li><input type="checkbox" data-vx="${esc(v.ma)}" ${v.isDone ? "checked" : ""} aria-label="Đã tiêm ${esc(v.ten_vaccine)} mũi ${esc(v.mui_so)}">
      <div><span class="vx-date">${fmt(v.due)}</span>${stBadge(v.status)}<br><strong>${esc(v.ten_vaccine)}</strong> · mũi ${esc(v.mui_so)}<br><span class="muted small">Phòng ${esc(v.phong_benh)}</span></div></li>`).join("")}</ul>
      <div class="row"><button class="btn" type="button" data-ics>Thêm vào lịch điện thoại</button></div>`;
    $$("[data-vx]", box).forEach((c) => c.addEventListener("change", async () => {
      const done = await store.get("vx:" + b.id, {});
      if (c.checked) done[c.dataset.vx] = new Date().toISOString().slice(0, 10); else delete done[c.dataset.vx];
      await store.set("vx:" + b.id, done);
      render();
    }));
    $("[data-ics]", box).addEventListener("click", () => downloadICS(b, plan));
  };
  render();
}

// ---------- Trang: Bé của tôi ----------
async function pageMyBaby() {
  const box = $("#babies");
  const render = async () => {
    const list = await babies(), act = await activeBaby();
    box.innerHTML = list.length ? list.map((b) => {
      const a = ageLabel(b);
      return `<div class="card baby"${act?.id === b.id ? ' aria-current="true"' : ""}><h2>${esc(b.name)}</h2>
        <p><strong>${esc(a.big)}</strong>${a.small ? ` <span class="muted">· ${esc(a.small)}</span>` : ""}</p>
        <p class="muted small">${b.kind === "expecting" ? "Ngày dự sinh" : "Ngày sinh"}: ${fmt(parseDate(b.date))}</p>
        <div class="row">${act?.id === b.id ? '<span class="tag">Đang xem</span>' : `<button class="btn small ghost" data-act="${b.id}">Xem bé này</button>`}
        ${b.kind === "expecting" ? `<button class="btn small ghost" data-born="${b.id}">Bé đã chào đời</button>` : ""}
        <button class="btn small ghost" data-del="${b.id}">Xoá</button></div></div>`;
    }).join("") : `<p class="muted">Chưa có bé nào. Thêm bé ở dưới.</p>`;
    $$("[data-act]", box).forEach((x) => x.onclick = async () => { await store.set("activeBaby", x.dataset.act); render(); });
    $$("[data-del]", box).forEach((x) => x.onclick = async () => {
      if (!confirm("Xoá hồ sơ bé này khỏi điện thoại?")) return;
      await store.set("babies", (await babies()).filter((b) => b.id !== x.dataset.del)); render();
    });
    $$("[data-born]", box).forEach((x) => x.onclick = async () => {
      const d = prompt("Ngày sinh của bé (năm-tháng-ngày, ví dụ 2026-11-20):", new Date().toISOString().slice(0, 10));
      if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      const list = await babies(); const b = list.find((y) => y.id === x.dataset.born); b.kind = "born"; b.date = d;
      await store.set("babies", list); render(); toast("Chúc mừng gia đình!");
    });
  };
  const form = $("[data-form=add-baby]");
  bindKindLabel(form);
  form.addEventListener("submit", async (e) => { e.preventDefault(); if (await addBaby(form)) { form.reset(); bindKindLabel(form); render(); toast("Đã lưu"); } });
  $("[data-backup]").onclick = async () => {
    const data = { app: "kienthuclamme", version: 1, at: new Date().toISOString(), data: await store.all() };
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })), download: `kienthuclamme-saoluu-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
  };
  $("[data-restore]").onchange = async (e) => {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (j.app !== "kienthuclamme") throw 0;
      for (const [k, v] of Object.entries(j.data)) if (v !== undefined && v !== null) await store.set(k, v);
      render(); toast("Đã khôi phục dữ liệu");
    } catch { toast("File sao lưu không hợp lệ"); }
  };
  render();
}

// ---------- Trang: Tra cứu ----------
async function pageSearch() {
  const idx = await getJSON("/data/search.json");
  const input = $("#q"), out = $("[data-results]");
  const run = () => {
    const terms = fold(input.value).split(/\s+/).filter(Boolean);
    if (!terms.length) { out.innerHTML = ""; return; }
    const hits = idx.map((o) => {
      if (!terms.every((t) => o.f.includes(t))) return null;
      const title = fold(o.t);
      return { o, score: terms.reduce((s, t) => s + (title.includes(t) ? 2 : 1), 0) };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 30);
    out.innerHTML = hits.length ? hits.map(({ o }) => `<li><a href="${o.u}"><small>${esc(o.k)}</small><strong>${esc(o.t)}</strong><span>${esc(o.d)}</span></a></li>`).join("") : `<li class="muted">Không tìm thấy. Thử từ khác ngắn hơn.</li>`;
  };
  input.addEventListener("input", run);
  const q = new URLSearchParams(location.search).get("q");
  if (q) { input.value = q; run(); }
}

// ---------- Video nhúng nhẹ ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".lite-yt");
  if (!btn || btn.querySelector("iframe")) return;
  const pl = btn.dataset.playlist ? `&playlist=${btn.dataset.playlist}` : "";
  btn.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1&rel=0${pl}" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
});

// ---------- Chế độ đêm, chữ lớn ----------
const prefs = (() => { try { return JSON.parse(localStorage.getItem("klm-prefs") || "{}"); } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem("klm-prefs", JSON.stringify(prefs)); } catch {} };
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
const PAGES = { home: pageHome, checklist: pageChecklist, vaccines: pageVaccines, mybaby: pageMyBaby, search: pageSearch };
PAGES[document.body.dataset.page]?.();
if ("serviceWorker" in navigator && location.hostname !== "localhost") navigator.serviceWorker.register("/sw.js").catch(() => {});

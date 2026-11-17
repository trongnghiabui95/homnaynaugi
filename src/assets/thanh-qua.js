// Thành quả của bạn đọc: xem ảnh món đã nấu + bình luận theo từng món, gửi bài, báo cáo; trang quản trị /quan-tri/.
// app.js tải lười file này khi trang có [data-tq] (hoặc là trang quản trị). Máy chủ: functions/api/[[path]].js.
// Không có API (bản xem thử GitHub Pages) thì mục giữ nguyên trạng thái ẩn.

const CAM = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>';

// Chữ giao diện theo ngôn ngữ trang (vi: "/", en: "/en/"). Bài của bạn đọc giữ nguyên chữ người viết.
const EN = document.documentElement.lang === "en";
const S = EN ? {
  now: "just now", ago: (n, u) => `${n} ${u}${n === 1 ? "" : "s"} ago`, u: ["minute", "hour", "day"], date: "en-GB",
  imgAlt: (n) => `${n}, cooked by a reader`, reported: "You reported this post", report: "Report", empty: "No one has shared this dish yet. Be the first!",
  askReport: "Report this post as inappropriate?", thanks: "Thank you. We will review this post.", reportFail: "Could not send the report, please try again",
  title: "Show your dish", pick: "Take or choose a photo", feel: "Your thoughts", feelPh: "For example: We added a little chili, great with rice.",
  name: "Display name", public: "Your photo and comment will appear publicly under this dish.", later: "Not now", send: "Send",
  preparing: "Preparing the photo…", chosen: "Your chosen photo", change: "Change photo", badImg: "Could not read this photo. Please choose another one.",
  noTs: "Could not load the spam check. Please check your connection and try again.", needSome: "Please add a photo or a few words.",
  needName: "Please enter a display name.", sending: "Sending…", sendFail: "Could not send. Please try again.", posted: "Posted. Thank you!",
  filter: "Filter posts", hidden: "Hidden", all: "All", isHidden: "Hidden", isShown: "Visible", reports: (n) => `${n} report${n === 1 ? "" : "s"}`,
  show: "Show again", hide: "Hide", del: "Delete", noPosts: "No posts.", wrongCode: "Wrong admin code.", noServer: "Could not reach the server.",
  askDel: "Delete this post for good? It cannot be restored.", updated: "Updated", failed: "That did not work, please try again",
} : {
  now: "vừa xong", ago: (n, u) => `${n} ${u} trước`, u: ["phút", "giờ", "ngày"], date: "vi-VN",
  imgAlt: (n) => `Món ${n} đã nấu`, reported: "Bạn đã báo cáo bài này", report: "Báo cáo", empty: "Chưa có ai khoe món này. Bạn là người đầu tiên nhé!",
  askReport: "Báo cáo bài này là không phù hợp?", thanks: "Cảm ơn bạn. Chúng tôi sẽ xem lại bài này.", reportFail: "Chưa gửi được báo cáo, bạn thử lại nhé",
  title: "Khoe món bạn nấu", pick: "Chụp hoặc chọn ảnh", feel: "Cảm nhận của bạn", feelPh: "Ví dụ: Nhà mình thêm ít ớt, ăn rất đưa cơm.",
  name: "Tên hiển thị", public: "Ảnh và bình luận sẽ hiện công khai dưới món này.", later: "Để sau", send: "Gửi",
  preparing: "Đang chuẩn bị ảnh…", chosen: "Ảnh bạn chọn", change: "Đổi ảnh", badImg: "Không đọc được ảnh này. Bạn chọn ảnh khác nhé.",
  noTs: "Chưa tải được phần chống spam. Bạn kiểm tra mạng rồi thử lại nhé.", needSome: "Bạn thêm ảnh hoặc vài dòng cảm nhận nhé.",
  needName: "Bạn nhập tên hiển thị nhé.", sending: "Đang gửi…", sendFail: "Chưa gửi được. Bạn thử lại nhé.", posted: "Đã đăng. Cảm ơn bạn!",
  filter: "Lọc bài", hidden: "Bị ẩn", all: "Tất cả", isHidden: "Đang ẩn", isShown: "Đang hiện", reports: (n) => `${n} báo cáo`,
  show: "Hiện lại", hide: "Ẩn", del: "Xoá hẳn", noPosts: "Không có bài nào.", wrongCode: "Sai mã quản trị.", noServer: "Chưa kết nối được máy chủ.",
  askDel: "Xoá hẳn bài này? Không khôi phục được.", updated: "Đã cập nhật", failed: "Chưa làm được, bạn thử lại nhé",
};

const luc = (t) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return S.now;
  if (s < 3600) return S.ago(Math.floor(s / 60), S.u[0]);
  if (s < 86400) return S.ago(Math.floor(s / 3600), S.u[1]);
  if (s < 86400 * 30) return S.ago(Math.floor(s / 86400), S.u[2]);
  return new Date(t).toLocaleDateString(S.date);
};

const napCss = (BASE) => {
  if (document.querySelector("link[data-tq-css]")) return;
  const l = Object.assign(document.createElement("link"), { rel: "stylesheet", href: BASE + "/assets/thanh-qua.css" });
  l.dataset.tqCss = "";
  document.head.append(l);
};

/** Nén ảnh trên máy: cạnh dài ≤ 1080px, JPEG ≤ 450KB. Vẽ lại qua canvas nên mất hết EXIF (vị trí GPS, máy chụp). */
async function nenAnh(file) {
  let src = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!src) src = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 1080 / Math.max(src.width, src.height));
  const c = Object.assign(document.createElement("canvas"), { width: Math.round(src.width * k), height: Math.round(src.height * k) });
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  for (const q of [0.82, 0.72, 0.62, 0.5]) {
    const b = await new Promise((ok) => c.toBlob(ok, "image/jpeg", q));
    if (b && b.size <= 450 * 1024) return b;
  }
  throw new Error("anh-qua-lon");
}

let tsNap = null;
const napTurnstile = () => (tsNap ??= new Promise((ok, no) => {
  if (window.turnstile) return ok(window.turnstile);
  const s = Object.assign(document.createElement("script"), { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", async: true });
  s.onload = () => ok(window.turnstile);
  s.onerror = () => { tsNap = null; no(new Error("turnstile")); };
  document.head.append(s);
}));

export async function thanhQua({ $, esc, store, toast, BASE }) {
  const box = $("[data-tq]"), mon = box.dataset.mon, key = box.dataset.key, ds = $("[data-tq-ds]", box);
  const api = BASE + "/api/thanh-qua";
  let bai;
  try {
    const r = await fetch(`${api}?mon=${encodeURIComponent(mon)}`);
    if (!r.ok) return;
    bai = (await r.json()).bai;
  } catch { return; }
  napCss(BASE);
  box.hidden = false;

  const daBao = new Set(await store.get("tq-bao", []));
  const the = (b) => `<figure class="tq-the">${b.co_anh ? `<img src="${api}/anh/${b.id}" alt="${esc(S.imgAlt(b.ten))}" loading="lazy" width="400" height="300">` : ""}<figcaption><p class="tq-ai"><strong>${esc(b.ten)}</strong> <span class="muted">${luc(b.tao_luc)}</span></p>${b.noi_dung ? `<p class="tq-chu">${esc(b.noi_dung)}</p>` : ""}${daBao.has(b.id) ? `<p class="muted small">${S.reported}</p>` : `<button type="button" class="tq-bao" data-bao="${b.id}">${S.report}</button>`}</figcaption></figure>`;
  const ve = () => {
    ds.innerHTML = bai.length ? bai.map(the).join("") : `<p class="muted">${S.empty}</p>`;
    ds.classList.toggle("trong", !bai.length);
  };
  ve();

  ds.onclick = async (e) => {
    const b = e.target.closest("[data-bao]");
    if (!b || !confirm(S.askReport)) return;
    const id = Number(b.dataset.bao);
    b.disabled = true;
    try {
      const r = await fetch(`${api}/${id}/bao-cao`, { method: "POST" });
      if (!r.ok) throw 0;
      daBao.add(id); store.set("tq-bao", [...daBao]);
      b.outerHTML = `<p class="muted small">${S.reported}</p>`;
      toast(S.thanks);
    } catch { b.disabled = false; toast(S.reportFail); }
  };

  // Hộp gửi bài: ảnh (chụp hoặc chọn), một dòng cảm nhận, tên (máy nhớ cho lần sau). Không đăng nhập.
  const dlg = document.createElement("dialog");
  dlg.className = "tq-dlg";
  dlg.setAttribute("aria-labelledby", "tq-dlg-tieu-de");
  dlg.innerHTML = `<form class="tq-form" novalidate>
  <h2 id="tq-dlg-tieu-de">${S.title}</h2>
  <label class="tq-anh"><input type="file" accept="image/*" data-tq-file><span class="tq-xem" data-tq-xem>${CAM}<span>${S.pick}</span></span></label>
  <label class="tq-o"><span>${S.feel}</span><textarea data-tq-noi maxlength="500" rows="3" placeholder="${S.feelPh}"></textarea></label>
  <label class="tq-o"><span>${S.name}</span><input data-tq-ten maxlength="40" autocomplete="nickname"></label>
  <div data-tq-ts></div>
  <p class="muted small">${S.public}</p>
  <p class="tq-loi" data-tq-loi role="alert" hidden></p>
  <div class="row tq-nut"><button type="button" class="btn ghost" data-tq-huy>${S.later}</button><button type="submit" class="btn" data-tq-gui>${S.send}</button></div>
</form>`;
  box.append(dlg);
  const f = $("form", dlg), file = $("[data-tq-file]", dlg), xem = $("[data-tq-xem]", dlg), noi = $("[data-tq-noi]", dlg),
    ten = $("[data-tq-ten]", dlg), loi = $("[data-tq-loi]", dlg), gui = $("[data-tq-gui]", dlg);
  let anh = null, token = "", wid = null;
  const baoLoi = (m) => { loi.textContent = m; loi.hidden = !m; };
  const datLai = () => {
    f.reset(); anh = null; baoLoi("");
    xem.innerHTML = `${CAM}<span>${S.pick}</span>`;
  };

  file.onchange = async () => {
    const fi = file.files[0];
    if (!fi) return;
    baoLoi(""); xem.innerHTML = `<span>${S.preparing}</span>`;
    try {
      anh = await nenAnh(fi);
      xem.innerHTML = `<img src="${URL.createObjectURL(anh)}" alt="${S.chosen}"><span class="tq-doi">${S.change}</span>`;
    } catch { anh = null; datLai(); baoLoi(S.badImg); }
  };
  $("[data-tq-huy]", dlg).onclick = () => dlg.close();

  $("[data-tq-mo]", box).onclick = async () => {
    ten.value ||= await store.get("tq-ten", "");
    dlg.showModal();
    try {
      const ts = await napTurnstile();
      if (wid === null) wid = ts.render($("[data-tq-ts]", dlg), { sitekey: key, appearance: "interaction-only", language: EN ? "en" : "vi", callback: (t) => (token = t), "expired-callback": () => (token = ""), "error-callback": () => (token = "") });
    } catch { baoLoi(S.noTs); }
  };

  f.onsubmit = async (e) => {
    e.preventDefault();
    const t = ten.value.trim(), n = noi.value.trim();
    if (!anh && !n) return baoLoi(S.needSome);
    if (!t) { ten.focus(); return baoLoi(S.needName); }
    gui.disabled = true; gui.textContent = S.sending; baoLoi("");
    try {
      for (let i = 0; !token && i < 40; i++) await new Promise((ok) => setTimeout(ok, 200)); // chờ xác minh chống bot (thường xong ngay)
      const fd = new FormData();
      fd.append("mon", mon); fd.append("ten", t); fd.append("noi_dung", n); fd.append("cf-turnstile-response", token);
      if (anh) fd.append("anh", anh, "anh.jpg");
      const r = await fetch(api, { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      // Máy chủ báo lỗi bằng tiếng Việt; trang tiếng Anh hiện câu chung.
      if (!r.ok) throw new Error((!EN && d.loi) || S.sendFail);
      store.set("tq-ten", t);
      bai.unshift(d.bai); ve();
      dlg.close(); datLai(); ten.value = t;
      toast(S.posted);
    } catch (err) {
      baoLoi((!EN && err.message) || S.sendFail);
    } finally {
      gui.disabled = false; gui.textContent = S.send; token = "";
      try { window.turnstile?.reset(wid); } catch {}
    }
  };
}

// ---------- Trang quản trị /quan-tri/: xem bài bị ẩn hoặc tất cả, ẩn, hiện lại, xoá. Mã quản trị chỉ giữ trong phiên. ----------
export async function quanTri({ $, esc, toast, BASE, LP = BASE }) {
  napCss(BASE);
  const root = $("[data-qt]"), ds = $("[data-qt-ds]", root), ma = $("[data-qt-ma]", root);
  const api = BASE + "/api/quan-tri";
  let tk = sessionStorage.getItem("hnng-qt") || "", loc = "an";
  const goi = (p, o = {}) => fetch(api + p, { ...o, headers: { ...(o.headers || {}), authorization: `Bearer ${tk}` } });
  const anhCo = async (id) => { try { const r = await goi(`/anh/${id}`); return r.ok ? URL.createObjectURL(await r.blob()) : ""; } catch { return ""; } };

  const tai = async () => {
    const r = await goi(`/thanh-qua${loc === "an" ? "?loc=an" : ""}`).catch(() => null);
    if (!r || r.status === 401) { sessionStorage.removeItem("hnng-qt"); ds.innerHTML = `<p class="tq-loi">${S.wrongCode}</p>`; return; }
    if (!r.ok) { ds.innerHTML = `<p class="tq-loi">${S.noServer}</p>`; return; }
    sessionStorage.setItem("hnng-qt", tk);
    $("[data-qt-dang-nhap]", root).hidden = true;
    const { bai } = await r.json();
    ds.innerHTML = `<div class="seg" role="tablist" aria-label="${S.filter}"><button type="button" role="tab" data-loc="an" aria-selected="${loc === "an"}">${S.hidden}</button><button type="button" role="tab" data-loc="tat-ca" aria-selected="${loc !== "an"}">${S.all}</button></div>`
      + (bai.length ? `<div class="tq-ds">${bai.map((b) => `<figure class="tq-the" data-id="${b.id}">${b.co_anh ? `<img data-anh="${b.id}" alt="" width="400" height="300">` : ""}<figcaption><p class="tq-ai"><strong>${esc(b.ten)}</strong> <span class="muted">${luc(b.tao_luc)} · <a href="${LP}/mon/${esc(b.mon)}/">${esc(b.mon)}</a></span></p>${b.noi_dung ? `<p class="tq-chu">${esc(b.noi_dung)}</p>` : ""}<p class="muted small">${b.an ? S.isHidden : S.isShown} · ${S.reports(b.bao_cao)}</p><div class="row">${b.an ? `<button type="button" class="btn ghost" data-hd="hien">${S.show}</button>` : `<button type="button" class="btn ghost" data-hd="an">${S.hide}</button>`}<button type="button" class="btn ghost" data-hd="xoa">${S.del}</button></div></figcaption></figure>`).join("")}</div>`
        : `<p class="muted">${S.noPosts}</p>`);
    for (const img of ds.querySelectorAll("[data-anh]")) anhCo(img.dataset.anh).then((u) => (u ? (img.src = u) : img.remove()));
  };

  $("[data-qt-dang-nhap]", root).onsubmit = (e) => { e.preventDefault(); tk = ma.value.trim(); tai(); };
  ds.onclick = async (e) => {
    const l = e.target.closest("[data-loc]");
    if (l) { loc = l.dataset.loc; return tai(); }
    const b = e.target.closest("[data-hd]");
    if (!b) return;
    const hd = b.dataset.hd, id = b.closest("[data-id]").dataset.id;
    if (hd === "xoa" && !confirm(S.askDel)) return;
    const r = await goi(`/thanh-qua/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hanh_dong: hd }) }).catch(() => null);
    toast(r?.ok ? S.updated : S.failed);
    tai();
  };
  if (tk) tai();
}

// Thành quả của bạn đọc: xem ảnh món đã nấu + bình luận theo từng món, gửi bài, báo cáo; trang quản trị /quan-tri/.
// app.js tải lười file này khi trang có [data-tq] (hoặc là trang quản trị). Máy chủ: functions/api/[[path]].js.
// Không có API (bản xem thử GitHub Pages) thì mục giữ nguyên trạng thái ẩn.

const CAM = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>';

const luc = (t) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return new Date(t).toLocaleDateString("vi-VN");
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
  const the = (b) => `<figure class="tq-the">${b.co_anh ? `<img src="${api}/anh/${b.id}" alt="Món ${esc(b.ten)} đã nấu" loading="lazy" width="400" height="300">` : ""}<figcaption><p class="tq-ai"><strong>${esc(b.ten)}</strong> <span class="muted">${luc(b.tao_luc)}</span></p>${b.noi_dung ? `<p class="tq-chu">${esc(b.noi_dung)}</p>` : ""}${daBao.has(b.id) ? '<p class="muted small">Bạn đã báo cáo bài này</p>' : `<button type="button" class="tq-bao" data-bao="${b.id}">Báo cáo</button>`}</figcaption></figure>`;
  const ve = () => {
    ds.innerHTML = bai.length ? bai.map(the).join("") : '<p class="muted">Chưa có ai khoe món này. Bạn là người đầu tiên nhé!</p>';
    ds.classList.toggle("trong", !bai.length);
  };
  ve();

  ds.onclick = async (e) => {
    const b = e.target.closest("[data-bao]");
    if (!b || !confirm("Báo cáo bài này là không phù hợp?")) return;
    const id = Number(b.dataset.bao);
    b.disabled = true;
    try {
      const r = await fetch(`${api}/${id}/bao-cao`, { method: "POST" });
      if (!r.ok) throw 0;
      daBao.add(id); store.set("tq-bao", [...daBao]);
      b.outerHTML = '<p class="muted small">Bạn đã báo cáo bài này</p>';
      toast("Cảm ơn bạn. Chúng tôi sẽ xem lại bài này.");
    } catch { b.disabled = false; toast("Chưa gửi được báo cáo, bạn thử lại nhé"); }
  };

  // Hộp gửi bài: ảnh (chụp hoặc chọn), một dòng cảm nhận, tên (máy nhớ cho lần sau). Không đăng nhập.
  const dlg = document.createElement("dialog");
  dlg.className = "tq-dlg";
  dlg.setAttribute("aria-labelledby", "tq-dlg-tieu-de");
  dlg.innerHTML = `<form class="tq-form" novalidate>
  <h2 id="tq-dlg-tieu-de">Khoe món bạn nấu</h2>
  <label class="tq-anh"><input type="file" accept="image/*" data-tq-file><span class="tq-xem" data-tq-xem>${CAM}<span>Chụp hoặc chọn ảnh</span></span></label>
  <label class="tq-o"><span>Cảm nhận của bạn</span><textarea data-tq-noi maxlength="500" rows="3" placeholder="Ví dụ: Nhà mình thêm ít ớt, ăn rất đưa cơm."></textarea></label>
  <label class="tq-o"><span>Tên hiển thị</span><input data-tq-ten maxlength="40" autocomplete="nickname"></label>
  <div data-tq-ts></div>
  <p class="muted small">Ảnh và bình luận sẽ hiện công khai dưới món này.</p>
  <p class="tq-loi" data-tq-loi role="alert" hidden></p>
  <div class="row tq-nut"><button type="button" class="btn ghost" data-tq-huy>Để sau</button><button type="submit" class="btn" data-tq-gui>Gửi</button></div>
</form>`;
  box.append(dlg);
  const f = $("form", dlg), file = $("[data-tq-file]", dlg), xem = $("[data-tq-xem]", dlg), noi = $("[data-tq-noi]", dlg),
    ten = $("[data-tq-ten]", dlg), loi = $("[data-tq-loi]", dlg), gui = $("[data-tq-gui]", dlg);
  let anh = null, token = "", wid = null;
  const baoLoi = (m) => { loi.textContent = m; loi.hidden = !m; };
  const datLai = () => {
    f.reset(); anh = null; baoLoi("");
    xem.innerHTML = `${CAM}<span>Chụp hoặc chọn ảnh</span>`;
  };

  file.onchange = async () => {
    const fi = file.files[0];
    if (!fi) return;
    baoLoi(""); xem.innerHTML = "<span>Đang chuẩn bị ảnh…</span>";
    try {
      anh = await nenAnh(fi);
      xem.innerHTML = `<img src="${URL.createObjectURL(anh)}" alt="Ảnh bạn chọn"><span class="tq-doi">Đổi ảnh</span>`;
    } catch { anh = null; datLai(); baoLoi("Không đọc được ảnh này. Bạn chọn ảnh khác nhé."); }
  };
  $("[data-tq-huy]", dlg).onclick = () => dlg.close();

  $("[data-tq-mo]", box).onclick = async () => {
    ten.value ||= await store.get("tq-ten", "");
    dlg.showModal();
    try {
      const ts = await napTurnstile();
      if (wid === null) wid = ts.render($("[data-tq-ts]", dlg), { sitekey: key, appearance: "interaction-only", language: "vi", callback: (t) => (token = t), "expired-callback": () => (token = ""), "error-callback": () => (token = "") });
    } catch { baoLoi("Chưa tải được phần chống spam. Bạn kiểm tra mạng rồi thử lại nhé."); }
  };

  f.onsubmit = async (e) => {
    e.preventDefault();
    const t = ten.value.trim(), n = noi.value.trim();
    if (!anh && !n) return baoLoi("Bạn thêm ảnh hoặc vài dòng cảm nhận nhé.");
    if (!t) { ten.focus(); return baoLoi("Bạn nhập tên hiển thị nhé."); }
    gui.disabled = true; gui.textContent = "Đang gửi…"; baoLoi("");
    try {
      for (let i = 0; !token && i < 40; i++) await new Promise((ok) => setTimeout(ok, 200)); // chờ xác minh chống bot (thường xong ngay)
      const fd = new FormData();
      fd.append("mon", mon); fd.append("ten", t); fd.append("noi_dung", n); fd.append("cf-turnstile-response", token);
      if (anh) fd.append("anh", anh, "anh.jpg");
      const r = await fetch(api, { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.loi || "Chưa gửi được. Bạn thử lại nhé.");
      store.set("tq-ten", t);
      bai.unshift(d.bai); ve();
      dlg.close(); datLai(); ten.value = t;
      toast("Đã đăng. Cảm ơn bạn!");
    } catch (err) {
      baoLoi(err.message || "Chưa gửi được. Bạn thử lại nhé.");
    } finally {
      gui.disabled = false; gui.textContent = "Gửi"; token = "";
      try { window.turnstile?.reset(wid); } catch {}
    }
  };
}

// ---------- Trang quản trị /quan-tri/: xem bài bị ẩn hoặc tất cả, ẩn, hiện lại, xoá. Mã quản trị chỉ giữ trong phiên. ----------
export async function quanTri({ $, esc, toast, BASE }) {
  napCss(BASE);
  const root = $("[data-qt]"), ds = $("[data-qt-ds]", root), ma = $("[data-qt-ma]", root);
  const api = BASE + "/api/quan-tri";
  let tk = sessionStorage.getItem("hnng-qt") || "", loc = "an";
  const goi = (p, o = {}) => fetch(api + p, { ...o, headers: { ...(o.headers || {}), authorization: `Bearer ${tk}` } });
  const anhCo = async (id) => { try { const r = await goi(`/anh/${id}`); return r.ok ? URL.createObjectURL(await r.blob()) : ""; } catch { return ""; } };

  const tai = async () => {
    const r = await goi(`/thanh-qua${loc === "an" ? "?loc=an" : ""}`).catch(() => null);
    if (!r || r.status === 401) { sessionStorage.removeItem("hnng-qt"); ds.innerHTML = '<p class="tq-loi">Sai mã quản trị.</p>'; return; }
    if (!r.ok) { ds.innerHTML = '<p class="tq-loi">Chưa kết nối được máy chủ.</p>'; return; }
    sessionStorage.setItem("hnng-qt", tk);
    $("[data-qt-dang-nhap]", root).hidden = true;
    const { bai } = await r.json();
    ds.innerHTML = `<div class="seg" role="tablist" aria-label="Lọc bài"><button type="button" role="tab" data-loc="an" aria-selected="${loc === "an"}">Bị ẩn</button><button type="button" role="tab" data-loc="tat-ca" aria-selected="${loc !== "an"}">Tất cả</button></div>`
      + (bai.length ? `<div class="tq-ds">${bai.map((b) => `<figure class="tq-the" data-id="${b.id}">${b.co_anh ? `<img data-anh="${b.id}" alt="" width="400" height="300">` : ""}<figcaption><p class="tq-ai"><strong>${esc(b.ten)}</strong> <span class="muted">${luc(b.tao_luc)} · <a href="${BASE}/mon/${esc(b.mon)}/">${esc(b.mon)}</a></span></p>${b.noi_dung ? `<p class="tq-chu">${esc(b.noi_dung)}</p>` : ""}<p class="muted small">${b.an ? "Đang ẩn" : "Đang hiện"} · ${b.bao_cao} báo cáo</p><div class="row">${b.an ? '<button type="button" class="btn ghost" data-hd="hien">Hiện lại</button>' : '<button type="button" class="btn ghost" data-hd="an">Ẩn</button>'}<button type="button" class="btn ghost" data-hd="xoa">Xoá hẳn</button></div></figcaption></figure>`).join("")}</div>`
        : '<p class="muted">Không có bài nào.</p>');
    for (const img of ds.querySelectorAll("[data-anh]")) anhCo(img.dataset.anh).then((u) => (u ? (img.src = u) : img.remove()));
  };

  $("[data-qt-dang-nhap]", root).onsubmit = (e) => { e.preventDefault(); tk = ma.value.trim(); tai(); };
  ds.onclick = async (e) => {
    const l = e.target.closest("[data-loc]");
    if (l) { loc = l.dataset.loc; return tai(); }
    const b = e.target.closest("[data-hd]");
    if (!b) return;
    const hd = b.dataset.hd, id = b.closest("[data-id]").dataset.id;
    if (hd === "xoa" && !confirm("Xoá hẳn bài này? Không khôi phục được.")) return;
    const r = await goi(`/thanh-qua/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hanh_dong: hd }) }).catch(() => null);
    toast(r?.ok ? "Đã cập nhật" : "Chưa làm được, bạn thử lại nhé");
    tai();
  };
  if (tk) tai();
}

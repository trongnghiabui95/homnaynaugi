// Thành quả của bạn đọc: xem ảnh món đã nấu + bình luận theo từng món, gửi bài, báo cáo; trang quản trị /quan-tri/.
// app.js tải lười file này khi trang có [data-tq] (hoặc là trang quản trị). Máy chủ: functions/api/[[path]].js.
// Không có API (bản xem thử GitHub Pages) thì mục giữ nguyên trạng thái ẩn.

const CAM = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>';

// Chữ giao diện theo ngôn ngữ trang (vi: "/", en: "/en/"). Bài của bạn đọc giữ nguyên chữ người viết.
const EN = (document.documentElement.lang || "vi") !== "vi"; // trang không phải tiếng Việt: không hiện lỗi tiếng Việt từ máy chủ
const S_en = {
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
};
const S_vi = {
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
const S_ja = {
  now: "たった今", ago: (n, u) => `${n}${u}前`, u: ["分", "時間", "日"], date: "ja-JP",
  imgAlt: (n) => `読者が作った${n}`, reported: "この投稿を報告しました", report: "報告", empty: "この料理はまだ誰もシェアしていません。最初の一人になりましょう！",
  askReport: "この投稿を不適切として報告しますか？", thanks: "ありがとうございます。この投稿を確認します。", reportFail: "報告を送信できませんでした。もう一度お試しください",
  title: "作った料理を見せる", pick: "写真を撮る・選ぶ", feel: "感想", feelPh: "例：唐辛子を少し足したら、ご飯がすすみました。",
  name: "表示名", public: "写真とコメントは、この料理の下に公開されます。", later: "今はしない", send: "送信",
  preparing: "写真を準備しています…", chosen: "選んだ写真", change: "写真を変更", badImg: "この写真を読み込めませんでした。別の写真を選んでください。",
  noTs: "スパム対策を読み込めませんでした。接続を確認して、もう一度お試しください。", needSome: "写真か、ひとことを入れてください。",
  needName: "表示名を入力してください。", sending: "送信中…", sendFail: "送信できませんでした。もう一度お試しください。", posted: "投稿しました。ありがとうございます！",
  filter: "投稿を絞り込む", hidden: "非表示", all: "すべて", isHidden: "非表示", isShown: "表示中", reports: (n) => `報告${n}件`,
  show: "再表示", hide: "非表示にする", del: "削除", noPosts: "投稿はありません。", wrongCode: "管理コードが違います。", noServer: "サーバーに接続できませんでした。",
  askDel: "この投稿を完全に削除しますか？元に戻せません。", updated: "更新しました", failed: "うまくいきませんでした。もう一度お試しください",
};
const S_ko = {
  now: "방금 전", ago: (n, u) => `${n}${u} 전`, u: ["분", "시간", "일"], date: "ko-KR",
  imgAlt: (n) => `독자가 만든 ${n}`, reported: "이 게시물을 신고했어요", report: "신고", empty: "아직 이 요리를 공유한 사람이 없어요. 첫 번째로 올려 보세요!",
  askReport: "이 게시물을 부적절한 게시물로 신고할까요?", thanks: "감사해요. 이 게시물을 검토할게요.", reportFail: "신고를 보내지 못했어요. 다시 시도해 주세요",
  title: "내 요리 자랑하기", pick: "사진 찍기 또는 고르기", feel: "한마디", feelPh: "예: 고추를 조금 넣었더니 밥이랑 잘 어울려요.",
  name: "표시 이름", public: "사진과 댓글이 이 요리 아래에 공개돼요.", later: "나중에", send: "보내기",
  preparing: "사진 준비 중…", chosen: "고른 사진", change: "사진 바꾸기", badImg: "이 사진을 읽지 못했어요. 다른 사진을 골라 주세요.",
  noTs: "스팸 확인을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.", needSome: "사진이나 몇 마디를 남겨 주세요.",
  needName: "표시 이름을 입력해 주세요.", sending: "보내는 중…", sendFail: "보내지 못했어요. 다시 시도해 주세요.", posted: "올렸어요. 감사해요!",
  filter: "게시물 필터", hidden: "숨김", all: "전체", isHidden: "숨김", isShown: "표시 중", reports: (n) => `신고 ${n}건`,
  show: "다시 표시", hide: "숨기기", del: "삭제", noPosts: "게시물이 없어요.", wrongCode: "관리자 코드가 틀렸어요.", noServer: "서버에 연결하지 못했어요.",
  askDel: "이 게시물을 완전히 삭제할까요? 복구할 수 없어요.", updated: "업데이트했어요", failed: "잘 안 됐어요. 다시 시도해 주세요",
};
const S_fr = {
  now: "à l’instant", ago: (n, u) => `il y a ${n} ${u}${n > 1 ? "s" : ""}`, u: ["minute", "heure", "jour"], date: "fr-FR",
  imgAlt: (n) => `${n}, cuisiné par un lecteur`, reported: "Vous avez signalé cette publication", report: "Signaler", empty: "Personne n’a encore partagé ce plat. Soyez le premier !",
  askReport: "Signaler cette publication comme inappropriée ?", thanks: "Merci. Nous allons examiner cette publication.", reportFail: "Impossible d’envoyer le signalement, veuillez réessayer",
  title: "Montrez votre plat", pick: "Prendre ou choisir une photo", feel: "Votre avis", feelPh: "Par exemple : on a ajouté un peu de piment, parfait avec du riz.",
  name: "Nom affiché", public: "Votre photo et votre commentaire apparaîtront publiquement sous ce plat.", later: "Plus tard", send: "Envoyer",
  preparing: "Préparation de la photo…", chosen: "Votre photo", change: "Changer de photo", badImg: "Impossible de lire cette photo. Veuillez en choisir une autre.",
  noTs: "Impossible de charger la vérification anti-spam. Vérifiez votre connexion et réessayez.", needSome: "Ajoutez une photo ou quelques mots.",
  needName: "Veuillez saisir un nom affiché.", sending: "Envoi…", sendFail: "Envoi impossible. Veuillez réessayer.", posted: "Publié. Merci !",
  filter: "Filtrer les publications", hidden: "Masquées", all: "Toutes", isHidden: "Masquée", isShown: "Visible", reports: (n) => `${n} ${n > 1 ? "signalements" : "signalement"}`,
  show: "Afficher à nouveau", hide: "Masquer", del: "Supprimer", noPosts: "Aucune publication.", wrongCode: "Code administrateur incorrect.", noServer: "Impossible de joindre le serveur.",
  askDel: "Supprimer définitivement cette publication ? Elle ne pourra pas être restaurée.", updated: "Mis à jour", failed: "Cela n’a pas fonctionné, veuillez réessayer",
};
const S = { en: S_en, ja: S_ja, ko: S_ko, fr: S_fr }[document.documentElement.lang] || S_vi;

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
      if (wid === null) wid = ts.render($("[data-tq-ts]", dlg), { sitekey: key, appearance: "interaction-only", language: S === S_vi ? "vi" : document.documentElement.lang, callback: (t) => (token = t), "expired-callback": () => (token = ""), "error-callback": () => (token = "") });
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

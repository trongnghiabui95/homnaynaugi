// Kiểm thử API "Thành quả của bạn đọc" (functions/api/[[path]].js) trên Node, D1 giả lập. Chạy: node --test tests/thanh-qua.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { taoD1 } from "./d1-gia.mjs";
import { xuLy, _noi } from "../functions/api/[[path]].js";

// Turnstile giả: mã "ok" là người thật, mã khác là bot.
const fetchGoc = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (String(u).includes("challenges.cloudflare.com")) return new Response(JSON.stringify({ success: o.body.get("response") === "ok" }));
  return fetchGoc(u, o);
};

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
const taoEnv = (them = {}) => ({
  DB: taoD1(),
  ASSETS: { fetch: async () => new Response(JSON.stringify([{ s: "canh-chua-ca" }, { s: "mon-thu" }])) },
  TURNSTILE_SECRET: "bi-mat-thu", ADMIN_TOKEN: "ma-quan-tri-thu", MUOI: "muoi-thu", ...them,
});
const goi = (env, path, { method = "GET", form, json, ip = "1.2.3.4", token } = {}) => {
  const headers = { "cf-connecting-ip": ip };
  if (token) headers.authorization = `Bearer ${token}`;
  let body;
  if (form) { body = new FormData(); for (const [k, v] of Object.entries(form)) body.append(k, v); }
  if (json) { body = JSON.stringify(json); headers["content-type"] = "application/json"; }
  return xuLy(new Request("https://web-thu.example" + path, { method, headers, body }), env);
};
const gui = (env, them = {}, ip) => goi(env, "/api/thanh-qua", { method: "POST", ip, form: { mon: "canh-chua-ca", ten: "Người thử", noi_dung: "Ngon lắm", "cf-turnstile-response": "ok", ...them } });

test.beforeEach(() => _noi.datLai());

test("gửi bình luận rồi xem lại theo món, mới nhất trước", async () => {
  const env = taoEnv();
  assert.equal((await gui(env)).status, 201);
  const r = await gui(env, { noi_dung: "Lần hai\n\n\n\nnhiều   dòng" });
  assert.equal(r.status, 201);
  const ds = await (await goi(env, "/api/thanh-qua?mon=canh-chua-ca")).json();
  assert.deepEqual(ds.bai.map((b) => b.noi_dung), ["Lần hai\n\nnhiều dòng", "Ngon lắm"]);
  assert.equal(ds.bai[0].ten, "Người thử");
  assert.equal("ip" in ds.bai[0], false, "không lộ mã IP");
  assert.deepEqual((await (await goi(env, "/api/thanh-qua?mon=mon-thu")).json()).bai, []);
});

test("gửi ảnh JPEG, lấy lại đúng ảnh", async () => {
  const env = taoEnv();
  const r = await (await gui(env, { noi_dung: "", anh: new Blob([JPEG], { type: "image/jpeg" }) })).json();
  assert.equal(r.bai.co_anh, 1);
  const a = await goi(env, `/api/thanh-qua/anh/${r.bai.id}`);
  assert.equal(a.headers.get("content-type"), "image/jpeg");
  assert.deepEqual(new Uint8Array(await a.arrayBuffer()), JPEG);
});

test("chặn: thiếu tên, trống cả ảnh lẫn chữ, có link, món không có, ảnh lạ, ảnh còn EXIF, bot", async () => {
  const env = taoEnv();
  assert.equal((await gui(env, { ten: "  " })).status, 400);
  assert.equal((await gui(env, { noi_dung: "" })).status, 400);
  assert.equal((await gui(env, { noi_dung: "Mua ở shopthu.vn nhé" })).status, 400);
  assert.equal((await gui(env, { noi_dung: "xem https://thu.example" })).status, 400);
  assert.equal((await gui(env, { mon: "khong-co" })).status, 404);
  assert.equal((await gui(env, { anh: new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4])]) })).status, 415);
  const exif = new Uint8Array([...JPEG.slice(0, 4), 0x45, 0x78, 0x69, 0x66, 0, 0, 1, 2]);
  assert.equal((await gui(env, { anh: new Blob([exif]) })).status, 400);
  assert.equal((await gui(env, { "cf-turnstile-response": "bot" })).status, 403);
  assert.equal((await (await goi(env, "/api/thanh-qua?mon=canh-chua-ca")).json()).bai.length, 0);
});

test("mỗi IP tối đa 5 bài mỗi giờ; IP khác vẫn gửi được", async () => {
  const env = taoEnv();
  for (let i = 0; i < 5; i++) assert.equal((await gui(env, { noi_dung: `bài ${i}` })).status, 201);
  assert.equal((await gui(env)).status, 429);
  assert.equal((await gui(env, {}, "5.6.7.8")).status, 201);
});

test("3 người báo cáo thì bài tự ẩn; một người báo nhiều lần chỉ tính 1", async () => {
  const env = taoEnv();
  const id = (await (await gui(env, { anh: new Blob([JPEG]) })).json()).bai.id;
  const bao = (ip) => goi(env, `/api/thanh-qua/${id}/bao-cao`, { method: "POST", ip });
  await bao("9.9.9.1"); await bao("9.9.9.1"); await bao("9.9.9.2");
  assert.equal((await (await goi(env, "/api/thanh-qua?mon=canh-chua-ca")).json()).bai.length, 1);
  await bao("9.9.9.3");
  assert.equal((await (await goi(env, "/api/thanh-qua?mon=canh-chua-ca")).json()).bai.length, 0);
  assert.equal((await goi(env, `/api/thanh-qua/anh/${id}`)).status, 404, "ảnh bài đã ẩn không xem được");
});

test("quản trị: cần mã; xem bài ẩn, hiện lại, xoá", async () => {
  const env = taoEnv();
  const id = (await (await gui(env)).json()).bai.id;
  assert.equal((await goi(env, "/api/quan-tri/thanh-qua")).status, 401);
  assert.equal((await goi(env, "/api/quan-tri/thanh-qua", { token: "sai" })).status, 401);
  const qt = (hd) => goi(env, `/api/quan-tri/thanh-qua/${id}`, { method: "POST", token: "ma-quan-tri-thu", json: { hanh_dong: hd } });
  assert.equal((await qt("an")).status, 200);
  const an = await (await goi(env, "/api/quan-tri/thanh-qua?loc=an", { token: "ma-quan-tri-thu" })).json();
  assert.deepEqual(an.bai.map((b) => [b.id, b.mon, b.an]), [[id, "canh-chua-ca", 1]]);
  await qt("hien");
  assert.equal((await (await goi(env, "/api/thanh-qua?mon=canh-chua-ca")).json()).bai.length, 1);
  await qt("xoa");
  assert.equal((await (await goi(env, "/api/quan-tri/thanh-qua", { token: "ma-quan-tri-thu" })).json()).bai.length, 0);
  assert.equal((await qt("bay-ba")).status, 400);
});

test("chưa cấu hình: không có D1 hoặc chưa có khoá Turnstile thì báo chưa bật", async () => {
  assert.equal((await goi({}, "/api/thanh-qua?mon=canh-chua-ca")).status, 503);
  const env = taoEnv({ TURNSTILE_SECRET: "" });
  assert.equal((await gui(env)).status, 503);
  assert.equal((await goi(env, "/api/quan-tri/thanh-qua", { token: "" })).status, 401);
});

test("làm sạch chữ: bỏ ký tự điều khiển và ký tự đảo chiều, cắt độ dài", () => {
  assert.equal(_noi.sach("a\u0000b‮c  \t d", 100), "abc d");
  assert.equal(_noi.sach("x".repeat(600), 500).length, 500);
});

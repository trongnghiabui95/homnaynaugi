// Kiểm thử hàm tô đậm và hàm dò nguyên liệu trong từng bước (scripts/buoc.mjs). Chạy: node --test tests/buoc.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { toDam, doNguyenLieu } from "../scripts/buoc.mjs";

const B = (s) => `<strong>${s.replace(/ /g, "&nbsp;")}</strong>`;

test("tô đậm thời gian, khoảng thời gian, nhiệt độ, kích cỡ, mức lửa", () => {
  assert.equal(toDam("Kho 30 phút rồi đảo"), `Kho ${B("30 phút")} rồi đảo`);
  assert.equal(toDam("Chiên 2–3 phút mỗi mặt"), `Chiên ${B("2–3 phút")} mỗi mặt`);
  assert.equal(toDam("Nướng 180°C trong 1,5 giờ"), `Nướng ${B("180°C")} trong ${B("1,5 giờ")}`);
  assert.equal(toDam("Cắt khúc 3 cm"), `Cắt khúc ${B("3 cm")}`);
  assert.equal(toDam("Hạ lửa nhỏ, đun lửa liu riu"), `Hạ ${B("lửa nhỏ")}, đun ${B("lửa liu riu")}`);
  assert.equal(toDam("Simmer over low heat for 20 minutes"), `Simmer over ${B("low heat")} for ${B("20 minutes")}`);
});

test("không đổi câu chữ, không tô số không có đơn vị, vẫn thoát HTML", () => {
  assert.equal(toDam("Cho 2 quả trứng vào"), "Cho 2 quả trứng vào");
  assert.equal(toDam("Đun 10 phútt"), "Đun 10 phútt"); // không cắt giữa chữ
  assert.equal(toDam("A < B & 5 phút"), `A &lt; B &amp; ${B("5 phút")}`);
  assert.equal(toDam("").length, 0);
  const goc = "Ướp thịt 15 phút với lửa vừa, cắt 2 cm.";
  assert.equal(toDam(goc).replace(/<\/?strong>/g, "").replace(/&nbsp;/g, " "), goc);
});

test("trứng và trứng cút: tên dài hơn được ưu tiên", () => {
  const names = ["Trứng", "Trứng cút"];
  assert.deepEqual(doNguyenLieu("Luộc trứng cút rồi bóc vỏ", names), [1]);
  assert.deepEqual(doNguyenLieu("Đập trứng vào bát, thêm trứng cút", names), [0, 1]);
});

test("hành và hành tím", () => {
  const names = ["Hành", "Hành tím"];
  assert.deepEqual(doNguyenLieu("Phi thơm hành tím băm", names), [1]);
  assert.deepEqual(doNguyenLieu("Rắc hành lên trên", names), [0]);
});

test("chữ trong bước viết không dấu vẫn nhận ra, nhưng không nhận nhầm chữ khác dấu", () => {
  const names = ["Thịt ba chỉ", "Muối", "Nước mắm"];
  assert.deepEqual(doNguyenLieu("Uop thit ba chi voi nuoc mam", names), [0, 2]);
  assert.deepEqual(doNguyenLieu("Đun mười phút", names), []); // "mười" không phải "muối"
  assert.deepEqual(doNguyenLieu("Nêm MUỐI vừa ăn", names), [1]);
});

test("chỉ khớp nguyên từ, không dò được thì trả mảng rỗng", () => {
  assert.deepEqual(doNguyenLieu("Thêm gừng", ["Gừng non"]), []);
  assert.deepEqual(doNguyenLieu("Cho đường vào", ["Đường phèn", "Đường"]), [1]);
  assert.deepEqual(doNguyenLieu("Tỏi phi vàng", ["Ớt"]), []);
  assert.deepEqual(doNguyenLieu("Cho tiêu", ["Tiêu (xay)"]), [0]);
});

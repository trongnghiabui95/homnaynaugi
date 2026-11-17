// Kiểm thử phần ảnh Wikimedia Commons, không cần mạng. Chạy: node --test tests/commons.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { commonsFile, plain, parseResponses, creditText } from "../scripts/commons.mjs";

test("nhận các kiểu link ảnh Commons", () => {
  const F = "File:Thit kho thu.jpg";
  for (const u of [
    "https://commons.wikimedia.org/wiki/File:Thit_kho_thu.jpg",
    "https://commons.m.wikimedia.org/wiki/File:Thit_kho_thu.jpg?uselang=vi",
    "https://vi.wikipedia.org/wiki/Th%E1%BB%8Bt_kho#/media/File:Thit_kho_thu.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/ab/Thit_kho_thu.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Thit_kho_thu.jpg/640px-Thit_kho_thu.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Thit_kho_thu.jpg/640px-Thit_kho_thu.jpg",
    "File:Thit_kho_thu.jpg",
    "Tập tin:thit kho thu.jpg",
  ]) assert.equal(commonsFile(u), F, u);
  assert.equal(commonsFile("https://commons.wikimedia.org/wiki/File:C%C6%A1m_th%E1%BB%AD.jpg"), "File:Cơm thử.jpg");
});

test("link không phải Commons giữ nguyên đường cũ", () => {
  for (const u of ["", "https://drive.google.com/file/d/1ThuNghiemAnhDriveABCDEFGHIJKLmnop/view", "https://example.com/File:a.jpg", "https://commons.wikimedia.org/wiki/Category:Food"])
    assert.equal(commonsFile(u), "", u);
});

test("bỏ thẻ HTML và mã ký tự trong tên tác giả", () => {
  assert.equal(plain('<a href="//x">Tác giả&nbsp;thử</a> &amp; <span>bạn</span>'), "Tác giả thử & bạn");
  assert.equal(plain("Ng&#432;&#x1EDD;i thử"), "Người thử");
});

test("đọc trả lời API: đủ nguồn thì dùng, thiếu thì bỏ", () => {
  const resp = JSON.parse(fs.readFileSync(new URL("./fixtures/commons.json", import.meta.url), "utf8"));
  const info = parseResponses(["File:Thit kho thu.jpg", "File:Canh thu.jpg", "File:Anh da xoa thu.jpg", "File:Khong hoi.jpg"], resp);
  const a = info.get("File:Thit kho thu.jpg");
  assert.equal(a.src, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Thit_kho_thu.jpg/1280px-Thit_kho_thu.jpg");
  assert.equal(creditText(a), "Tác giả thử, CC BY-SA 4.0 https://commons.wikimedia.org/wiki/File:Thit_kho_thu.jpg");
  assert.equal(creditText(info.get("File:Canh thu.jpg")), "Public domain https://commons.wikimedia.org/wiki/File:Canh_thu.jpg");
  assert.ok(info.get("File:Anh da xoa thu.jpg").why);
  assert.ok(info.get("File:Khong hoi.jpg").why);
});

test("tên đã được API chuẩn hoá vẫn khớp; thiếu giấy phép hoặc tác giả thì bỏ", () => {
  const ii = (meta) => [{ thumburl: "https://upload.wikimedia.org/x/1280px-a.jpg", descriptionurl: "https://commons.wikimedia.org/wiki/File:A.jpg", extmetadata: meta }];
  const info = parseResponses(["File:a.jpg", "File:B.jpg", "File:C.jpg"], [{ query: {
    normalized: [{ from: "File:a.jpg", to: "File:A.jpg" }],
    pages: [
      { title: "File:A.jpg", imageinfo: ii({ Artist: { value: "Thử" }, LicenseShortName: { value: "CC BY 4.0" } }) },
      { title: "File:B.jpg", imageinfo: ii({ Artist: { value: "Thử" } }) },
      { title: "File:C.jpg", imageinfo: ii({ LicenseShortName: { value: "CC BY-SA 3.0" } }) },
    ] } }]);
  assert.equal(info.get("File:a.jpg").author, "Thử");
  const tl = parseResponses(["File:P.jpg"], [{ query: { pages: [{ title: "File:P.jpg", imageinfo: ii({ Artist: { value: '<a href="//x">Người thử</a> (<a href="//y">thảo luận</a>)' }, LicenseShortName: { value: "CC BY-SA 4.0" } }) }] } }]);
  assert.equal(tl.get("File:P.jpg").author, "Người thử");
  // Ảnh thu nhỏ ở máy chủ thumb.wikimedia.org cũng được nhận
  const t = parseResponses(["File:T.jpg"], [{ query: { pages: [{ title: "File:T.jpg", imageinfo: [{ thumburl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/T.jpg/1280px-T.jpg?utm_source=commons.wikimedia.org&utm_content=thumbnail", descriptionurl: "https://commons.wikimedia.org/wiki/File:T.jpg", extmetadata: { Artist: { value: "Thử" }, LicenseShortName: { value: "CC0" } } }] }] } }]);
  assert.equal(t.get("File:T.jpg").src, "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/T.jpg/1280px-T.jpg");
  assert.equal(parseResponses(["File:X.jpg"], [{ query: { pages: [{ title: "File:X.jpg", imageinfo: [{ thumburl: "https://example.com/x.jpg", extmetadata: { LicenseShortName: { value: "CC0" } } }] }] } }]).get("File:X.jpg").why, "link ảnh lạ");
  assert.match(info.get("File:B.jpg").why, /giấy phép/);
  assert.match(info.get("File:C.jpg").why, /tác giả/);
});

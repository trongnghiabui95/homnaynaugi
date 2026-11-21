// Kiểm thử SEO (Issue #68): mô tả trang ≤ 160 ký tự, không trùng; trình kiểm tra Recipe; bản xem thử noindex + canonical về bản chính;
// thẻ xác minh Google Search Console. Không cần mạng (build bằng tests/fixtures ra thư mục tạm). Chạy: node --test tests/seo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { moTaNgan, thieuTruongRecipe } from "../scripts/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = path.join(ROOT, "tests", "fixtures");
const CHINH = "https://cookwhattoday.com";

function build(env, settingsThem = "") {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seo-thu-"));
  const data = path.join(tmp, "data"), out = path.join(tmp, "dist");
  fs.cpSync(FIX, data, { recursive: true });
  if (settingsThem) fs.appendFileSync(path.join(data, "settings.csv"), settingsThem);
  const e = { ...process.env, DATA_DIR: data, OUT_DIR: out, ...env };
  for (const k of ["SHEET_ID", "BASE_PATH", "PREVIEW", "CANONICAL_URL", "SITE_URL"]) if (!(k in env)) delete e[k];
  execFileSync("node", [path.join(ROOT, "scripts", "build.mjs")], { env: e, stdio: "pipe" });
  return (rel) => fs.readFileSync(path.join(out, rel), "utf8");
}
const moTa = (h) => h.match(/<meta name="description" content="([^"]*)"/)[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

test("moTaNgan: ngắn thì giữ nguyên, dài thì cắt ở ranh giới từ, giữ phần đuôi, ≤ 160", () => {
  assert.equal(moTaNgan("Canh chua cá lóc.", "30 phút, 4 người ăn."), "Canh chua cá lóc. 30 phút, 4 người ăn.");
  const dai = "Thịt ba chỉ mềm, trứng thấm vị, nước kho sánh vàng ".repeat(6).trim();
  const r = moTaNgan(dai, "75 phút, 4 người ăn.");
  assert.ok(r.length <= 160, r.length);
  assert.ok(r.endsWith("… 75 phút, 4 người ăn."), r);
  assert.ok(dai.startsWith(r.split("…")[0]), "cắt ở ranh giới từ");
  assert.ok(moTaNgan("x".repeat(300)).length <= 160);
});

test("thieuTruongRecipe: báo đúng trường thiếu", () => {
  const du = { name: "A", image: ["u"], recipeIngredient: ["1 quả trứng"], recipeInstructions: [{ text: "Chiên" }], totalTime: "PT10M" };
  assert.deepEqual(thieuTruongRecipe(du), []);
  assert.deepEqual(thieuTruongRecipe({ ...du, image: undefined, recipeIngredient: [], totalTime: "" }), ["image", "recipeIngredient", "totalTime"]);
});

test("bản chính: không noindex, robots cho phép, có sitemap; mô tả món ≤ 160 và không trùng; Recipe đủ trường (3 món)", () => {
  const doc = build({ SITE_URL: CHINH });
  for (const p of ["index.html", "mon/thit-kho-trung/index.html", "en/index.html"]) {
    const h = doc(p);
    assert.ok(!h.includes('name="robots" content="noindex"'), p);
    assert.ok(h.includes(`<link rel="canonical" href="${CHINH}/`), p);
  }
  assert.match(doc("robots.txt"), /Allow: \/\nSitemap: https:\/\/cookwhattoday\.com\/sitemap\.xml/);
  assert.ok(!doc("index.html").includes("google-site-verification"), "chưa điền khoá thì không in thẻ");
  const slugs = fs.readFileSync(path.join(FIX, "recipes.csv"), "utf8").split("\n").slice(1).map((l) => l.split(",")[0]).filter((s) => s && s !== "mon-thu-nhap");
  for (const lang of ["", "en/"]) {
    const ds = slugs.map((s) => moTa(doc(`${lang}mon/${s}/index.html`)));
    for (const d of ds) assert.ok(d.length > 0 && d.length <= 160, `${lang} ${d.length}: ${d}`);
    assert.equal(new Set(ds).size, ds.length, `${lang}: mô tả trùng`);
  }
  for (const s of ["thit-kho-trung", "mon-thu-video", "mon-thu-video-ngang"]) {
    const ld = JSON.parse(doc(`mon/${s}/index.html`).match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const recipe = [].concat(ld).find((x) => x["@type"] === "Recipe");
    assert.deepEqual(thieuTruongRecipe(recipe), [], s);
  }
});

test("bản xem thử (PREVIEW=1): mọi trang noindex, canonical + hreflang + sitemap về bản chính, robots chặn hết", () => {
  const doc = build({ PREVIEW: "1", CANONICAL_URL: CHINH, SITE_URL: "https://ai-do.github.io/homnaynaugi", BASE_PATH: "/homnaynaugi" }, "google_site_verification,MaThu123\n");
  for (const p of ["index.html", "mon/thit-kho-trung/index.html", "en/mon/thit-kho-trung/index.html", "danh-muc/index.html"]) {
    const h = doc(p);
    assert.ok(h.includes('<meta name="robots" content="noindex">'), p);
    assert.ok(!h.includes("github.io"), `${p} không còn link github.io`);
  }
  const h = doc("mon/thit-kho-trung/index.html");
  assert.ok(h.includes(`<link rel="canonical" href="${CHINH}/mon/thit-kho-trung/">`));
  assert.ok(h.includes(`<link rel="alternate" hreflang="en" href="${CHINH}/en/mon/thit-kho-trung/">`));
  assert.ok(h.includes('href="/homnaynaugi/mon/'), "link nội bộ vẫn chạy trong thư mục con");
  assert.match(doc("robots.txt"), /User-agent: \*\nDisallow: \/\n/);
  assert.ok(!doc("index.html").includes("google-site-verification"), "bản xem thử không in thẻ xác minh");
});

test("thẻ xác minh Google: điền mã hoặc dán nguyên thẻ đều ra đúng, chỉ ở trang chủ", () => {
  for (const v of ["MaThu123", '"<meta name=""google-site-verification"" content=""MaThu123"" />"']) {
    const doc = build({ SITE_URL: CHINH }, `google_site_verification,${v}\n`);
    assert.ok(doc("index.html").includes('<meta name="google-site-verification" content="MaThu123">'), v);
    assert.ok(!doc("mon/thit-kho-trung/index.html").includes("google-site-verification"));
  }
});

test("bản chính thiếu cả SITE_URL lẫn site_url: canonical, sitemap, robots, og:url dùng tên miền chính, không có example.com (#99)", () => {
  const doc = build({});
  for (const p of ["index.html", "mon/thit-kho-trung/index.html", "en/index.html", "sitemap.xml", "robots.txt"]) {
    assert.ok(!doc(p).includes("example.com"), p);
  }
  assert.ok(doc("mon/thit-kho-trung/index.html").includes(`<link rel="canonical" href="${CHINH}/mon/thit-kho-trung/"`));
  assert.match(doc("robots.txt"), /Sitemap: https:\/\/cookwhattoday\.com\/sitemap\.xml/);
  assert.match(doc("sitemap.xml"), /<loc>https:\/\/cookwhattoday\.com\/mon\/thit-kho-trung\/<\/loc>/);
});

test("site_url trong Sheet có dấu cách hoặc / ở cuối vẫn ra địa chỉ sạch", () => {
  const tmp = build({}, "site_url, https://cookwhattoday.com/ \n");
  assert.ok(tmp("mon/thit-kho-trung/index.html").includes(`<link rel="canonical" href="${CHINH}/mon/thit-kho-trung/"`));
});

test("VideoObject có uploadDate từ cột ngay_video; thiếu ngày thì không khai báo video (Search Console: thiếu uploadDate)", () => {
  const doc = build({ SITE_URL: CHINH });
  const ld = (s) => [].concat(JSON.parse(doc(`mon/${s}/index.html`).match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])).find((x) => x["@type"] === "Recipe");
  const co = ld("mon-thu-video");
  assert.equal(co.video["@type"], "VideoObject");
  assert.equal(co.video.uploadDate, "2024-03-15");
  for (const k of ["name", "description", "thumbnailUrl", "uploadDate"]) assert.ok(co.video[k], `video.${k}`);
  assert.equal(ld("mon-thu-video-ngang").video, undefined, "thiếu ngay_video thì không có VideoObject");
  assert.ok(doc("mon/mon-thu-video-ngang/index.html").includes("NGANGthu001"), "video vẫn nhúng trên trang");
});

# Kiểm thử trên trình duyệt (Playwright).
# Chạy: DATA_DIR=tests/fixtures node scripts/build.mjs && python3 tests/e2e.py
# Ảnh chụp lưu ở $SHOTS (mặc định /tmp/shots). Dùng Chrome hệ thống: CHROME=/usr/bin/google-chrome
# Đạt: mọi dòng bắt đầu bằng "OK" và dòng cuối "errors: []".
import asyncio, os, subprocess, time
from playwright.async_api import async_playwright

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
OUT = os.environ.get("SHOTS", "/tmp/shots")
os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(["python3", "-m", "http.server", "8099", "-d", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
B = "http://localhost:8099"
fails = []

def check(name, cond, detail=""):
    print(("OK   " if cond else "SAI  ") + name + (f"  ({detail})" if detail and not cond else ""))
    if not cond: fails.append(name)

async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**({"executable_path": os.environ["CHROME"]} if os.environ.get("CHROME") else {}))
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="vi-VN")
        await ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=B)
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)

        # Hôm nay nấu gì: mâm cơm 3 món đúng ngăn, khoá giữ món
        await pg.goto(B + "/"); await pg.wait_for_timeout(500)
        await pg.click("[data-spin-go]"); await pg.wait_for_timeout(900)
        names = await pg.eval_on_selector_all("[data-spin-slots] .slot strong", "els=>els.map(e=>e.textContent)")
        labels = await pg.eval_on_selector_all("[data-spin-slots] .slot-label", "els=>els.map(e=>e.textContent)")
        check("mâm cơm có đủ 3 ngăn mặn/canh/rau", len(names) == 3 and labels == ["Món mặn", "Món canh", "Món rau / xào"], f"{labels} {names}")
        canh = ["Canh bí đỏ thịt bằm", "Canh rau ngót thịt bằm"]
        check("ngăn canh chỉ ra món canh", names and names[1] in canh, str(names))
        await pg.click('[data-lock="m0"]'); await pg.wait_for_timeout(200)
        locked = names[0]
        same = True
        for _ in range(4):
            await pg.click("[data-spin-go]"); await pg.wait_for_timeout(800)
            same &= (await pg.text_content('[data-slot="m0"] strong')) == locked
        check("khoá giữ nguyên món khi quay lại", same)
        await pg.screenshot(path=f"{OUT}/1-trang-chu.png", full_page=True)
        await pg.select_option('[data-spin-f="b"]', "sang")
        await pg.click('[data-spin-mode="one"]'); await pg.click("[data-spin-go]"); await pg.wait_for_timeout(900)
        one = await pg.text_content('[data-slot="one"] strong')
        check("gợi ý 1 món theo bữa sáng", one in ["Bánh mì ốp la", "Sinh tố bơ"], one)
        await pg.click("[data-spin-shop]"); await pg.wait_for_timeout(300)
        check("thêm món gợi ý vào đi chợ", await pg.text_content('[data-badge="cart"]') == "1")
        await pg.reload(); await pg.wait_for_timeout(600)
        check("nhớ kết quả quay sau khi tải lại", await pg.text_content('[data-slot="one"] strong') == one)

        # Trang công thức: khẩu phần, chép danh sách, sổ tay, chế độ nấu
        await pg.goto(B + "/mon/trung-chien-hanh/"); await pg.wait_for_timeout(500)
        await pg.click("[data-serv-inc]")
        q = await pg.text_content(".ings li:first-child .qty")
        check("đổi khẩu phần 2 → 3 người: 3 quả → 4½", q == "4½", q)
        await pg.click('[data-serv="4"]')
        check("nút nhanh 4 người: 3 quả → 6", await pg.text_content(".ings li:first-child .qty") == "6")
        await pg.click(".ings li:nth-child(2) label"); await pg.click("[data-copy-shop]"); await pg.wait_for_timeout(300)
        clip = await pg.evaluate("navigator.clipboard.readText()")
        check("chép danh sách chỉ món đã tích", "Hành lá: 4 nhánh" in clip and "Trứng gà" not in clip, clip)
        await pg.click("[data-fav]"); await pg.wait_for_timeout(300)
        check("lưu vào sổ tay", await pg.text_content('[data-badge="heart"]') == "1")
        await pg.click("[data-add-shop]"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f"{OUT}/2-cong-thuc.png", full_page=True)
        await pg.click("[data-cook]"); await pg.wait_for_timeout(300)
        check("chế độ nấu có tiêu đề bước", await pg.text_content("[data-cook-title]") == "Đánh trứng")
        await pg.click("[data-cook-next]")
        check("chuyển bước và đánh dấu bước trước đã xong", (await pg.text_content("[data-cook-pos]")) == "Bước 2/5" and await pg.eval_on_selector(".steps li", "e=>e.classList.contains('done')"))
        await pg.screenshot(path=f"{OUT}/3-che-do-nau.png")
        await pg.click("[data-cook-close]")

        # Ảnh Drive, video Shorts, xem đoạn, hẹn giờ, calo
        await pg.goto(B + "/mon/mon-thu-video/"); await pg.wait_for_timeout(400)
        hero = await pg.get_attribute(".hero-img", "src")
        check("link Google Drive đổi sang ảnh trực tiếp", hero == "https://lh3.googleusercontent.com/d/1ThuNghiemAnhDriveABCDEFGHIJKLmnop", hero)
        check("ảnh bước từ Drive", (await pg.get_attribute(".step-img", "src") or "").startswith("https://lh3.googleusercontent.com/d/"))
        check("có calo và chi phí", "420 kcal" in await pg.text_content(".facts") and "85.000đ" in await pg.text_content(".facts"))
        await pg.click("[data-seek='95']"); await pg.wait_for_timeout(300)
        src = await pg.get_attribute("[data-player] iframe", "src")
        check("xem đoạn mở tab video, nhảy giây 95", src and "start=95" in src and await pg.is_visible("[data-player]"), src)
        check("video Shorts hiện khung dọc", await pg.eval_on_selector("[data-player]", "e=>e.classList.contains('vertical')"))
        await pg.click("[data-timer]"); await pg.wait_for_timeout(1200)
        check("hẹn giờ hiện trên màn hình", await pg.is_visible(".timer"))
        r = await pg.goto(B + "/mon/mon-thu-nhap/")
        check("món chưa duyệt không xuất bản", r.status == 404)

        # Danh mục: lọc và sắp xếp
        await pg.goto(B + "/danh-muc/mon-man/"); await pg.wait_for_timeout(400)
        await pg.click('[data-f="m"] [data-v="15"]')
        vis = await pg.eval_on_selector_all(".rgrid .rcard:not([hidden]) strong", "els=>els.map(e=>e.textContent)")
        check("lọc danh mục ≤ 15 phút", vis == ["Trứng chiên hành"], str(vis))
        await pg.screenshot(path=f"{OUT}/4-danh-muc.png", full_page=True)

        # Tủ lạnh có gì
        await pg.goto(B + "/tim-kiem/?mode=nl"); await pg.wait_for_timeout(500)
        for v in ["trung ga", "hanh la"]:
            await pg.click(f'[data-fridge] [data-v="{v}"]')
        await pg.wait_for_timeout(200)
        first = await pg.text_content("[data-results] .rcard:first-child")
        check("tủ lạnh: món đủ nguyên liệu lên đầu", "Trứng chiên hành" in first and "Đủ 2/2" in first, first)
        await pg.screenshot(path=f"{OUT}/5-tu-lanh.png", full_page=True)
        await pg.goto(B + "/tim-kiem/?tag=" + "Món chay"); await pg.wait_for_timeout(500)
        tagged = await pg.eval_on_selector_all("[data-results] strong", "els=>els.map(e=>e.textContent)")
        check("lọc theo chủ đề", set(tagged) == {"Đậu hũ sốt cà chua", "Rau muống xào tỏi"}, str(tagged))

        # Đi chợ gộp nguyên liệu
        await pg.goto(B + "/di-cho/"); await pg.wait_for_timeout(500)
        rows = await pg.eval_on_selector_all(".shop-list li", "els=>els.map(e=>e.textContent)")
        check("đi chợ có món từ trang công thức và từ vòng quay", len(await pg.query_selector_all(".shop-recipes .chip")) == 2, str(rows))
        await pg.screenshot(path=f"{OUT}/6-di-cho.png", full_page=True)
        await pg.goto(B + "/da-luu/"); await pg.wait_for_timeout(400)
        check("sổ tay hiện món đã lưu", len(await pg.query_selector_all("[data-saved-grid] .rcard")) == 1)
        await pg.goto(B + "/mon/thit-kho-trung/"); await pg.click('[data-toggle="theme"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f"{OUT}/7-dem.png")
        await b.close()
    print("errors:", errs)
    if fails or errs: raise SystemExit(1)

try:
    asyncio.run(main())
finally:
    srv.terminate()

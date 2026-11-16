# Kiểm thử trên trình duyệt (Playwright).
# Chạy: DATA_DIR=tests/fixtures node scripts/build.mjs && python3 tests/e2e.py
# Ảnh chụp lưu ở $SHOTS (mặc định /tmp/shots). Dùng Chrome hệ thống: CHROME=/usr/bin/google-chrome
# Kết quả đạt: mọi dòng bắt đầu bằng "OK" và dòng cuối "errors: []".
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
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)

        await pg.goto(B + "/"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f"{OUT}/1-trang-chu.png", full_page=True)

        # Đổi khẩu phần: 2 → 3 người, 3 quả trứng → 4½
        await pg.goto(B + "/mon/trung-chien-hanh/"); await pg.wait_for_timeout(500)
        await pg.click("[data-serv-inc]")
        q = await pg.text_content(".ings li:first-child .qty")
        check("đổi khẩu phần nhân đúng lượng", q == "4½", q)
        await pg.click("[data-fav]"); await pg.wait_for_timeout(300)
        check("lưu món hiện số trên thanh dưới", await pg.text_content('[data-badge="heart"]') == "1")
        await pg.click("[data-add-shop]"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f"{OUT}/2-cong-thuc.png", full_page=True)

        # Chế độ nấu
        await pg.click("[data-cook]"); await pg.wait_for_timeout(300)
        t1 = await pg.text_content("[data-cook-text]")
        await pg.click("[data-cook-next]")
        check("chế độ nấu chuyển bước", (await pg.text_content("[data-cook-pos]")).startswith("Bước 2") and "Đập trứng" in t1)
        await pg.screenshot(path=f"{OUT}/3-che-do-nau.png")
        await pg.click("[data-cook-close]")

        # Đi chợ: gộp "Dầu ăn" 1½ (trứng, 3 người) + 2 (rau muống) = 3½ thìa canh
        await pg.goto(B + "/mon/rau-muong-xao-toi/"); await pg.wait_for_timeout(400)
        await pg.click("[data-add-shop]"); await pg.wait_for_timeout(300)
        await pg.goto(B + "/di-cho/"); await pg.wait_for_timeout(500)
        oil = await pg.eval_on_selector_all(".shop-list li", "els=>els.map(e=>e.textContent).filter(t=>t.includes('Dầu ăn'))")
        check("đi chợ gộp nguyên liệu trùng", len(oil) == 1 and "3½ thìa canh" in oil[0], str(oil))
        await pg.screenshot(path=f"{OUT}/4-di-cho.png", full_page=True)

        # Tìm theo tên và theo nguyên liệu
        await pg.goto(B + "/tim-kiem/?q=trung"); await pg.wait_for_timeout(500)
        names = await pg.eval_on_selector_all("[data-results] strong", "els=>els.map(e=>e.textContent)")
        check("tìm không dấu", "Trứng chiên hành" in names, str(names))
        await pg.goto(B + "/tim-kiem/?mode=nl&q=" + "trứng, hành lá"); await pg.wait_for_timeout(500)
        first = await pg.text_content("[data-results] .rcard:first-child strong")
        check("tìm theo nguyên liệu xếp món khớp nhiều nhất lên đầu", first == "Trứng chiên hành", first)
        await pg.screenshot(path=f"{OUT}/5-tim-mon.png", full_page=True)

        # Video theo bước và hẹn giờ
        await pg.goto(B + "/mon/mon-thu-video/"); await pg.wait_for_timeout(400)
        await pg.click("[data-seek='95']"); await pg.wait_for_timeout(300)
        src = await pg.get_attribute("[data-player] iframe", "src")
        check("xem đoạn video nhảy đúng giây", src and "start=95" in src and "youtube-nocookie.com" in src, src)
        await pg.click("[data-timer]"); await pg.wait_for_timeout(1200)
        check("hẹn giờ hiện trên màn hình", await pg.is_visible(".timer"))

        # Món nháp không được lên web
        r = await pg.goto(B + "/mon/mon-thu-nhap/")
        check("món chưa duyệt không xuất bản", r.status == 404)

        await pg.goto(B + "/da-luu/"); await pg.wait_for_timeout(500)
        check("trang đã lưu", len(await pg.query_selector_all("[data-saved-grid] .rcard")) == 1)
        await pg.goto(B + "/mon/trung-chien-hanh/"); await pg.click('[data-toggle="theme"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f"{OUT}/6-dem.png")
        await b.close()
    print("errors:", errs)
    if fails or errs: raise SystemExit(1)

try:
    asyncio.run(main())
finally:
    srv.terminate()

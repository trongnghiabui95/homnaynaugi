# Kiểm thử trên trình duyệt (Playwright).
# Chạy: DATA_DIR=tests/fixtures node scripts/build.mjs && python3 tests/e2e.py
# Ảnh chụp lưu ở $SHOTS (mặc định /tmp/shots). Dùng Chrome hệ thống: CHROME=/usr/bin/google-chrome
# Đạt: mọi dòng bắt đầu bằng "OK" và dòng cuối "errors: []".
import asyncio, os, re, subprocess, time
from playwright.async_api import async_playwright

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
OUT = os.environ.get("SHOTS", "/tmp/shots")
os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(["python3", "-m", "http.server", "8099", "-d", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# Máy chủ thử có API "Thành quả của bạn đọc" (giống Cloudflare Pages + D1), xem tests/may-chu-thu.mjs
api_srv = subprocess.Popen(["node", "--no-warnings", os.path.join(os.path.dirname(os.path.abspath(__file__)), "may-chu-thu.mjs"), "8098"])
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
        # Ảnh Drive, ảnh Commons và ảnh bìa YouTube trong fixtures là link giả: trả về một ảnh thật để kiểm thử ảnh tải được
        PNG = open(os.path.join(DIST, "assets", "og-mac-dinh.png"), "rb").read()
        async def anh_that(route): await route.fulfill(status=200, content_type="image/png", body=PNG)
        for host in ("lh3.googleusercontent.com", "i.ytimg.com", "upload.wikimedia.org"):
            await ctx.route(f"https://{host}/**", anh_that)
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        # Bỏ qua lỗi tải tài nguyên và "Permissions policy violation" do trình phát YouTube nhúng tự sinh (không phải lỗi của web)
        BO_QUA = ("Failed to load resource", "Permissions policy violation")
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and not any(x in m.text for x in BO_QUA) else None)

        # Lần đầu vào: khung quay mặc định "Gợi ý 1 món", HTML dựng sẵn đúng chế độ nên không nhảy bố cục
        await pg.add_init_script("window.__cls=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__cls+=e.value})).observe({type:'layout-shift',buffered:true})")
        r = await pg.goto(B + "/")
        html = await r.text()
        check("HTML dựng sẵn: 'Gợi ý 1 món' được chọn, một ngăn chờ quay", re.search(r'data-spin-mode="one" aria-selected="true"', html) is not None and 'data-slot="one"' in html and "Thêm cả mâm" not in html)
        await pg.wait_for_timeout(500)
        dau = await pg.evaluate("[document.querySelector('[data-spin-mode=one]').getAttribute('aria-selected'), document.querySelectorAll('[data-spin-slots] .slot').length, document.querySelector('[data-spin-slots]').classList.contains('mam'), document.querySelector('[data-spin-go] span').textContent]")
        check("lần đầu vào: chế độ 1 món, một ngăn, nút Quay món", dau == ["true", 1, False, "Quay món"], str(dau))
        cls = await pg.evaluate("window.__cls")
        check("không nhảy bố cục khi tải trang chủ (CLS < 0.1)", cls < 0.1, str(cls))
        await pg.screenshot(path=f"{OUT}/1b-mot-mon-truoc-quay.png")
        async def quay():
            await pg.click("[data-spin-go]")
            await pg.wait_for_selector("[data-spin-go]:not([disabled])"); await pg.wait_for_timeout(60)
        await quay()
        check("lần đầu bấm quay: ra 1 món", len(await pg.query_selector_all("[data-spin-slots] .slot")) == 1 and bool(await pg.text_content('[data-slot="one"] strong')))
        check("1 món: nút ghi 'Thêm vào Đi chợ'", await pg.text_content("[data-spin-shop] span") == "Thêm vào Đi chợ")
        await pg.screenshot(path=f"{OUT}/1c-mot-mon-sau-quay.png")
        # Chọn mâm cơm, tải lại vẫn là mâm cơm
        await pg.click('[data-spin-mode="mam"]'); await pg.wait_for_timeout(200)
        await pg.reload(); await pg.wait_for_timeout(500)
        check("chọn mâm cơm rồi tải lại: vẫn là mâm cơm 3 món", await pg.get_attribute('[data-spin-mode="mam"]', "aria-selected") == "true" and len(await pg.query_selector_all("[data-spin-slots] .slot")) == 3)

        # Hôm nay nấu gì: mâm cơm 3 món đúng ngăn, khoá giữ món
        await pg.click("[data-spin-go]"); await pg.wait_for_timeout(250)
        dang = await pg.evaluate("[document.querySelectorAll('.slot.rolling .reel').length, document.querySelector('[data-spin-go]').disabled]")
        check("đang quay: 3 ngăn cuộn, nút bị khoá", dang == [3, True], str(dang))
        await pg.screenshot(path=f"{OUT}/1a-dang-quay.png")
        await pg.wait_for_selector("[data-spin-go]:not([disabled])")
        check("quay xong: ngăn nảy, không còn dải cuộn", await pg.evaluate("document.querySelectorAll('.slot.landed').length === 3 && !document.querySelector('.reel')"))
        names = await pg.eval_on_selector_all("[data-spin-slots] .slot strong", "els=>els.map(e=>e.textContent)")
        labels = await pg.eval_on_selector_all("[data-spin-slots] .slot-label", "els=>els.map(e=>e.textContent)")
        check("mâm cơm có đủ 3 ngăn mặn/canh/rau", len(names) == 3 and labels == ["Món mặn", "Món canh", "Món rau / xào"], f"{labels} {names}")
        canh = ["Canh bí đỏ thịt bằm", "Canh rau ngót thịt bằm"]
        check("ngăn canh chỉ ra món canh", names and names[1] in canh, str(names))
        check("mâm cơm: nút ghi 'Thêm cả mâm vào Đi chợ'", await pg.text_content("[data-spin-shop] span") == "Thêm cả mâm vào Đi chợ")
        await pg.click('[data-lock="m0"]'); await pg.wait_for_timeout(200)
        locked = names[0]
        same = True
        for _ in range(4):
            await quay()
            same &= (await pg.text_content('[data-slot="m0"] strong')) == locked
        check("khoá giữ nguyên món khi quay lại", same)
        await pg.screenshot(path=f"{OUT}/1-trang-chu.png", full_page=True)
        check("bộ lọc thu gọn, mặc định đóng", not await pg.is_visible('[data-spin-f="b"]'))
        await pg.click(".spin-more summary")
        await pg.select_option('[data-spin-f="b"]', "sang")
        check("tiêu đề Bộ lọc đếm số lọc đang bật", await pg.text_content(".spin-more summary") == "Bộ lọc (1)")
        await pg.click('[data-spin-mode="one"]'); await quay()
        one = await pg.text_content('[data-slot="one"] strong')
        check("gợi ý 1 món theo bữa sáng, không lẫn đồ uống", one == "Bánh mì ốp la", one)
        await pg.click("[data-spin-shop]"); await pg.wait_for_timeout(300)
        check("thêm món gợi ý vào đi chợ", await pg.text_content('[data-badge="cart"]') == "1")
        await pg.reload(); await pg.wait_for_timeout(600)
        check("nhớ kết quả quay sau khi tải lại", await pg.text_content('[data-slot="one"] strong') == one)

        # Radio Món ăn / Đồ uống: đồ uống quay riêng một ngăn, chỉ ra món trong danh mục Đồ uống
        check("có radio Món ăn / Đồ uống, mặc định Món ăn", await pg.is_checked('[data-spin-kind][value="an"]') and len(await pg.query_selector_all('.kind input[type=radio]')) == 2)
        await pg.check('[data-spin-kind][value="uong"]'); await pg.wait_for_timeout(100)
        check("chọn Đồ uống: ẩn Mâm cơm / 1 món, còn một ngăn", not await pg.is_visible("[data-spin-modes]") and len(await pg.query_selector_all("[data-spin-slots] .slot")) == 1)
        await quay()
        check("quay đồ uống chỉ ra đồ uống", await pg.text_content('[data-slot="uong"] strong') == "Sinh tố bơ")
        await pg.reload(); await pg.wait_for_timeout(600)
        check("nhớ lựa chọn Đồ uống sau khi tải lại", await pg.is_checked('[data-spin-kind][value="uong"]') and await pg.text_content('[data-slot="uong"] strong') == "Sinh tố bơ")
        await pg.check('[data-spin-kind][value="an"]'); await pg.wait_for_timeout(100)
        check("về Món ăn: giữ món đã quay trước đó", await pg.text_content('[data-slot="one"] strong') == one)

        # Nút "Quay món" nằm trong màn hình đầu (trên thanh điều hướng đáy), ô chọn không bị cắt chữ
        for w in (390, 360):
            await pg.set_viewport_size({"width": w, "height": 844})
            await pg.goto(B + "/"); await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(300)
            pos = await pg.evaluate("[document.querySelector('[data-spin-go]').getBoundingClientRect().bottom, document.querySelector('.tabbar').getBoundingClientRect().top]")
            check(f"nút Quay món trong màn hình đầu ở khung {w}px", pos[0] <= pos[1], str(pos))
            await pg.click(".spin-more summary")
            cut = await pg.evaluate("""()=>[...document.querySelectorAll('.spin select')].flatMap(s=>{const cs=getComputedStyle(s),c=document.createElement('canvas').getContext('2d');c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const room=s.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);return [...s.options].filter(o=>c.measureText(o.text).width>room).map(o=>o.text)})""")
            check(f"ô chọn quay món không cắt chữ ở khung {w}px", not cut, str(cut))
        await pg.set_viewport_size({"width": 390, "height": 844})

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
        cr = [await pg.text_content(".media .credit"), await pg.get_attribute(".media .credit a", "href")]
        nho = await pg.evaluate("(()=>{const c=document.querySelector('.media .credit');const cs=getComputedStyle(c);return [cs.fontSize, c.getBoundingClientRect().height < parseFloat(cs.lineHeight)*1.5]})()")
        check("ghi nguồn ảnh: chữ nhỏ 13px, một dòng", nho == ["13px", True], str(nho))
        check("ghi nguồn ảnh dưới ảnh món", cr == ["Nguồn: Người thử, CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Anh_thu.jpg"], str(cr))
        check("ảnh bước từ Drive", (await pg.get_attribute(".step-img", "src") or "").startswith("https://lh3.googleusercontent.com/d/"))
        check("có calo và chi phí", "420 kcal" in await pg.text_content(".facts") and "85.000đ" in await pg.text_content(".facts"))
        await pg.click("[data-seek='95']"); await pg.wait_for_timeout(300)
        src = await pg.get_attribute("[data-player] iframe", "src")
        check("xem đoạn mở tab video, nhảy giây 95", src and "start=95" in src and await pg.is_visible("[data-player]"), src)
        check("video Shorts hiện khung dọc", await pg.eval_on_selector("[data-player]", "e=>e.classList.contains('vertical')"))
        await pg.click("[data-timer]"); await pg.wait_for_timeout(1200)
        check("hẹn giờ hiện trên màn hình", await pg.is_visible(".timer"))
        # Ảnh Wikimedia Commons (trả lời API mẫu: tests/fixtures/commons.json): ảnh cỡ vừa, tự ghi tác giả + giấy phép
        await pg.goto(B + "/mon/thit-kho-trung/"); await pg.wait_for_timeout(400)
        cm = await pg.evaluate("""()=>{const q=(s)=>document.querySelector(s);return [q('.hero-img')?.getAttribute('src'), q('.media .credit')?.textContent, q('.media .credit a')?.href, q('.step-fig .step-img')?.getAttribute('src'), q('.step-fig .credit')?.textContent]}""")
        check("ảnh Commons: ảnh món cỡ 1280px, ghi tác giả, giấy phép, link trang ảnh", cm[:3] == ["https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Thit_kho_thu.jpg/1280px-Thit_kho_thu.jpg", "Nguồn: Tác giả thử, CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Thit_kho_thu.jpg"], str(cm))
        check("ảnh Commons ở bước: dùng link upload.wikimedia.org, có ghi nguồn", cm[3:] == ["https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Buoc_kho_thu.jpg/1280px-Buoc_kho_thu.jpg", "Nguồn: Người & bếp thử, CC BY 4.0"], str(cm))
        h = open(os.path.join(DIST, "mon", "thit-kho-trung", "index.html"), encoding="utf-8").read()
        check("ảnh Commons làm og:image", 'og:image" content="https://upload.wikimedia.org/' in h)
        await pg.goto(B + "/mon/rau-muong-xao-toi/")
        check("ảnh Commons không tra được (đã xoá): không hiện ảnh, không hiện ghi nguồn", not await pg.query_selector(".hero-img") and not await pg.query_selector(".credit"))
        await pg.goto(B + "/danh-muc/mon-canh/")
        check("ảnh danh mục từ Commons có ghi nguồn", (await pg.text_content(".cat-head .credit") or "") == "Nguồn: Public domain")
        await pg.goto(B + "/mon/thit-kho-trung/"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f"{OUT}/8-anh-commons.png")
        r = await pg.goto(B + "/mon/mon-thu-nhap/")
        check("món chưa duyệt không xuất bản", r.status == 404)

        # Ảnh xem trước khi chia sẻ: mọi trang có og:image là URL tuyệt đối
        import glob
        thieu = [f for f in glob.glob(os.path.join(DIST, "**", "index.html"), recursive=True)
                 if not re.search(r'<meta property="og:image" content="https?://', open(f, encoding="utf-8").read())]
        check("mọi trang có og:image tuyệt đối", not thieu, str(thieu[:3]))
        h = open(os.path.join(DIST, "mon", "mon-thu-video", "index.html"), encoding="utf-8").read()
        check("món có ảnh: og:image và Recipe.image là ảnh món", 'og:image" content="https://lh3.googleusercontent.com/d/' in h and '"image":["https://lh3.googleusercontent.com/d/' in h)
        h = open(os.path.join(DIST, "mon", "trung-chien-hanh", "index.html"), encoding="utf-8").read()
        check("món chưa có ảnh: dùng ảnh mặc định để chia sẻ, Recipe không gắn ảnh không phải món", "og-mac-dinh.png" in h and '"@type":"Recipe"' in h and '"image"' not in h.split('"@type":"Recipe"')[1].split("</script>")[0])

        # Món chưa có ảnh: khung trung tính có tên món, không còn emoji lớn; món có ảnh xếp trước
        await pg.goto(B + "/"); await pg.wait_for_timeout(600)
        check("không còn emoji lớn thay ảnh món", await pg.evaluate("!document.querySelector('.rcard-emoji') && ![...document.querySelectorAll('.rcard-img, .slot-img')].some(e=>/\\p{Extended_Pictographic}/u.test(e.textContent))"))
        moi = await pg.evaluate("""()=>{const g=[...document.querySelectorAll('section')].find(s=>s.querySelector('h2')?.textContent==='Công thức mới');return [...g.querySelectorAll('.rcard')].map(c=>[c.querySelector('strong').textContent,!!c.querySelector('.rcard-img img')])}""")
        co_anh = [co for _, co in moi]
        check("trang chủ: món có ảnh xếp trước món chưa có ảnh", co_anh[0] and co_anh == sorted(co_anh, reverse=True) and not all(co_anh), str(moi[:3]))
        co = await pg.evaluate("""()=>{const i=document.querySelector('.rcard[href$="/mon/mon-thu-video/"] .rcard-img img');return i&&[i.classList.contains('ok'),getComputedStyle(i).opacity,i.loading]}""")
        check("món có ảnh: ảnh tải lười, hiện rõ sau khi tải", co == [True, "1", "lazy"], str(co))
        kh = await pg.evaluate("""()=>{const c=document.querySelector('.rcard[href$="/mon/trung-chien-hanh/"] .rcard-img');return [!!c.querySelector('img'),c.querySelector('.ph').textContent,getComputedStyle(c.querySelector('.ph')).fontFamily.includes('Lora')]}""")
        check("món không ảnh: khung trung tính ghi tên món chữ Lora", kh == [False, "Trứng chiên hành", True], str(kh))
        await pg.screenshot(path=f"{OUT}/8-khung-trung-tinh.png")
        await pg.goto(B + "/danh-muc/mon-man/"); await pg.wait_for_timeout(300)
        check("danh mục: không emoji lớn, có khung trung tính", await pg.evaluate("!document.querySelector('.rcard-emoji') && document.querySelectorAll('.rcard .ph').length === document.querySelectorAll('.rcard').length"))
        # Vòng quay ưu tiên món có ảnh; ảnh hỏng link tự về khung trung tính (ngữ cảnh riêng, chặn ảnh)
        c2 = await b.new_context(viewport={"width": 390, "height": 844}, locale="vi-VN")
        async def anh_hong(route): await route.abort()
        for host in ("lh3.googleusercontent.com", "i.ytimg.com", "upload.wikimedia.org"):
            await c2.route(f"https://{host}/**", anh_hong)
        p2 = await c2.new_page()
        p2.on("pageerror", lambda e: errs.append(str(e)))
        await p2.add_init_script("Math.random = () => 0")
        await p2.goto(B + "/"); await p2.wait_for_timeout(500)
        await p2.click('[data-spin-mode="one"]'); await p2.click("[data-spin-go]")
        await p2.wait_for_selector("[data-spin-go]:not([disabled])")
        ten_co_anh = await p2.evaluate("fetch((document.documentElement.dataset.base || '') + '/data/recipes.json').then(r=>r.json()).then(a=>a.filter(r=>r.img).map(r=>r.t))")
        ra = await p2.text_content('[data-slot="one"] strong')
        check("vòng quay ưu tiên món có ảnh", ra in ten_co_anh and len(ten_co_anh) < 10, f"{ra} {ten_co_anh}")
        hong = await p2.evaluate("""()=>{const c=document.querySelector('.rcard[href$="/mon/mon-thu-video/"] .rcard-img');return [!!c.querySelector('img'),c.querySelector('.ph').offsetHeight>0]}""")
        check("ảnh hỏng link: thẻ món về khung trung tính", hong == [False, True], str(hong))
        await p2.goto(B + "/mon/mon-thu-video/"); await p2.wait_for_timeout(600)
        check("ảnh hỏng link ở trang món: bỏ ảnh, hiện video", await p2.evaluate("!document.querySelector('.hero-img') && !document.querySelector('.media .credit') && !document.querySelector('[data-media-panel=video]').hidden"))
        await p2.goto(B + "/mon/thit-kho-trung/"); await p2.wait_for_timeout(300)
        # Ảnh bước tải lười: cuộn tới để ảnh tải (máy nhanh có thể đã tải hỏng và gỡ xong trước khi cuộn)
        await p2.evaluate("document.querySelector('.step-fig')?.scrollIntoView()"); await p2.wait_for_timeout(600)
        check("ảnh bước hỏng link: bỏ cả ảnh lẫn dòng ghi nguồn", await p2.evaluate("!document.querySelector('.step-fig') && !document.querySelector('.credit')"))
        await c2.close()

        # Danh mục: lọc và sắp xếp
        await pg.goto(B + "/danh-muc/mon-man/"); await pg.wait_for_timeout(400)
        await pg.click('[data-f="m"] [data-v="15"]')
        vis = await pg.eval_on_selector_all(".rgrid .rcard:not([hidden]) strong", "els=>els.map(e=>e.textContent)")
        check("lọc danh mục ≤ 15 phút", vis == ["Trứng chiên hành"], str(vis))
        await pg.screenshot(path=f"{OUT}/4-danh-muc.png", full_page=True)

        # Video: khối trang chủ phát tại chỗ, mục Video ở thanh dưới, trang /video/ xem liên tiếp
        await pg.goto(B + "/"); await pg.wait_for_timeout(400)
        vc = await pg.evaluate("[...document.querySelectorAll('[data-vstrip] [data-vcard]')].map(c=>[c.querySelector('strong').textContent, c.classList.contains('doc')])")
        check("trang chủ có khối video: 1 Shorts dọc, 1 video ngang", sorted(vc) == [["Món thử có video", True], ["Món thử video ngang", False]], str(vc))
        await pg.click('[data-vcard][data-id="abcdefghijk"] [data-vplay]'); await pg.wait_for_timeout(200)
        src = await pg.get_attribute('[data-vcard][data-id="abcdefghijk"] iframe', "src")
        check("bấm thẻ video là phát tại chỗ, nhúng youtube-nocookie", bool(src) and src.startswith("https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1"), str(src))
        await pg.screenshot(path=f"{OUT}/9-video-trang-chu.png")
        await pg.click('[data-vcard][data-id="NGANGthu001"] [data-vplay]'); await pg.wait_for_timeout(200)
        check("mỗi lúc chỉ một video chạy", await pg.evaluate("document.querySelectorAll('[data-vstrip] iframe').length === 1 && !!document.querySelector('[data-vcard][data-id=\"abcdefghijk\"] [data-vplay]')"))
        credit = await pg.evaluate("(()=>{const c=document.querySelector('[data-vcard][data-id=\"abcdefghijk\"]');return [c.querySelector('small').textContent, c.querySelector('small a').href, c.querySelector('.vcard-link').getAttribute('href')]})()")
        check("thẻ video ghi kênh, link YouTube, link công thức", credit == ["Video: kênh Kênh thử · Xem trên YouTube", "https://www.youtube.com/shorts/abcdefghijk", "/mon/mon-thu-video/"], str(credit))
        tab = await pg.eval_on_selector_all(".tabbar a", "els=>els.map(e=>e.textContent.trim())")
        check("thanh dưới có mục Video, tối đa 5 mục", "Video" in tab and len(tab) == 5 and await pg.query_selector('.footer-links a[href$="/danh-muc/"]') is not None, str(tab))
        check("thẻ món có video có nút phát giữa ảnh", await pg.evaluate("(()=>{const e=document.querySelector('.rcard-img:has(.badge-video)');const s=getComputedStyle(e,'::after');return s.content!=='none'&&parseFloat(s.width)>=48})()"))
        await pg.click('.tabbar a[href$="/video/"]'); await pg.wait_for_timeout(400)
        check("trang video: mục Video đang chọn, chưa tự phát", await pg.get_attribute('.tabbar a[href$="/video/"]', "aria-current") == "page" and not await pg.query_selector("[data-vbox] iframe"))
        t1 = await pg.text_content("[data-vtitle]")
        await pg.click("[data-vstart]"); await pg.wait_for_timeout(200)
        s1 = await pg.get_attribute("[data-vbox] iframe", "src")
        await pg.click("[data-vnext]"); await pg.wait_for_timeout(200)
        t2, s2, pos = await pg.text_content("[data-vtitle]"), await pg.get_attribute("[data-vbox] iframe", "src"), await pg.text_content("[data-vpos]")
        href = await pg.get_attribute("[data-vrecipe]", "href")
        ids = {"Món thử có video": ("abcdefghijk", "mon-thu-video"), "Món thử video ngang": ("NGANGthu001", "mon-thu-video-ngang")}
        check("phát video rồi chuyển video kế: tự phát video kế", t1 != t2 and ids[t1][0] in s1 and ids[t2][0] in s2 and pos == "Video 2/2", f"{t1} {t2} {s2} {pos}")
        check("nút Xem công thức về đúng trang món", href.endswith(f"/mon/{ids[t2][1]}/"), href)
        check("khung dọc cho Shorts, khung ngang cho video thường", await pg.eval_on_selector("[data-vbox]", "e=>e.classList.contains('vertical')") == (t2 == "Món thử có video"))
        await pg.evaluate("""()=>{const s=document.querySelector('[data-vstage]');const t=(n,x)=>s.dispatchEvent(new TouchEvent(n,{bubbles:true,touches:n==='touchend'?[]:[new Touch({identifier:1,target:s,clientX:x,clientY:300})],changedTouches:[new Touch({identifier:1,target:s,clientX:x,clientY:300})]}));t('touchstart',300);t('touchend',80)}""")
        await pg.wait_for_timeout(200)
        check("vuốt ngang sang video kế", await pg.text_content("[data-vtitle]") == t1)
        await pg.screenshot(path=f"{OUT}/10-video-lien-tiep.png")

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

        # Vùng bấm ≥ 44px và chữ ≥ 13px trên các trang chính (bỏ qua link nằm trong đoạn văn và link "Bỏ qua đến nội dung")
        DO = """()=>{
          const vis=e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!='hidden'&&cs.display!='none'};
          const inText=e=>e.tagName=='A'&&e.closest('p,li,figcaption,small')&&!e.closest('.footer-links,.crumbs,.tags,.kicker');
          const nho=[...document.querySelectorAll('a,button,select,input:not([type=checkbox]):not([type=radio]),label:has(input[type=checkbox],input[type=radio])')].filter(e=>vis(e)&&!inText(e)&&!e.classList.contains('skip')&&e.getBoundingClientRect().height<43.5).map(e=>(e.innerText||e.getAttribute('aria-label')||e.tagName).trim().slice(0,20)+' '+Math.round(e.getBoundingClientRect().height)+'px');
          const chu=[...document.querySelectorAll('body *')].filter(e=>vis(e)&&!e.closest('.ad-slot')&&[...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<12.95).map(e=>e.innerText.trim().slice(0,15)+' '+getComputedStyle(e).fontSize);
          return [[...new Set(nho)],[...new Set(chu)]]}"""
        for u in ["/", "/mon/trung-chien-hanh/", "/mon/mon-thu-video/", "/danh-muc/", "/danh-muc/mon-man/", "/tim-kiem/", "/video/", "/di-cho/", "/da-luu/", "/gioi-thieu/"]:
            await pg.goto(B + u); await pg.wait_for_timeout(300)
            nho, chu = await pg.evaluate(DO)
            check(f"vùng bấm ≥ 44px, chữ ≥ 13px: {u}", not nho and not chu, f"{nho[:4]} {chu[:4]}")

        # Đi chợ gộp nguyên liệu
        await pg.goto(B + "/di-cho/"); await pg.wait_for_timeout(500)
        rows = await pg.eval_on_selector_all(".shop-list li", "els=>els.map(e=>e.textContent)")
        check("đi chợ có món từ trang công thức và từ vòng quay", len(await pg.query_selector_all(".shop-recipes .chip")) == 2, str(rows))
        await pg.screenshot(path=f"{OUT}/6-di-cho.png", full_page=True)
        await pg.goto(B + "/da-luu/"); await pg.wait_for_timeout(400)
        check("sổ tay hiện món đã lưu", len(await pg.query_selector_all("[data-saved-grid] .rcard")) == 1)
        # Danh mục trống (an-vat trong fixtures): ẩn ở trang chủ, trang Danh mục, sitemap; trang vẫn có nhưng noindex
        await pg.goto(B + "/"); await pg.wait_for_timeout(300)
        check("trang chủ không hiện danh mục trống", not await pg.query_selector('.cat-row a[href$="/danh-muc/an-vat/"]'))
        await pg.goto(B + "/danh-muc/")
        check("trang Danh mục không hiện danh mục trống", not await pg.query_selector('.cat-grid a[href$="/danh-muc/an-vat/"]') and await pg.query_selector('.cat-grid a[href$="/danh-muc/mon-man/"]'))
        r = await pg.goto(B + "/danh-muc/an-vat/")
        check("trang danh mục trống vẫn mở được, có noindex", r.status == 200 and await pg.query_selector('meta[name="robots"][content="noindex"]'))
        sm = open(os.path.join(DIST, "sitemap.xml"), encoding="utf-8").read()
        check("sitemap bỏ danh mục trống, giữ trang video khi có video", "/danh-muc/an-vat/" not in sm and "/video/" in sm)
        check("chân trang có link video khi đã có video", await pg.query_selector('.footer-links a[href$="/video/"]') is not None)

        await pg.goto(B + "/mon/thit-kho-trung/"); await pg.click('[data-toggle="theme"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f"{OUT}/7-dem.png")
        # Thành quả của bạn đọc: không có API (GitHub Pages) thì ẩn; có API thì gửi ảnh + bình luận, xem, báo cáo, quản trị
        await pg.goto(B + "/mon/trung-chien-hanh/"); await pg.wait_for_timeout(400)
        check("không có API: mục Thành quả ẩn", await pg.query_selector("[data-tq]") is not None and not await pg.is_visible("[data-tq]"))
        BA = "http://localhost:8098"
        c4 = await b.new_context(viewport={"width": 390, "height": 844}, locale="vi-VN")
        TS = "window.turnstile={render:(el,o)=>{setTimeout(()=>o.callback('token-thu'),20);return 1},reset(){}};"
        async def ts_gia(route): await route.fulfill(status=200, content_type="text/javascript", body=TS)
        await c4.route("https://challenges.cloudflare.com/**", ts_gia)
        p4 = await c4.new_page()
        p4.on("pageerror", lambda e: errs.append(str(e)))
        p4.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p4.goto(BA + "/mon/trung-chien-hanh/"); await p4.wait_for_selector("[data-tq]:not([hidden])", timeout=5000)
        check("có API: hiện mục Thành quả, lời mời khi chưa có bài", "người đầu tiên" in await p4.text_content("[data-tq-ds]"))
        await p4.click("[data-tq-mo]"); await p4.wait_for_selector(".tq-dlg[open]")
        check("bấm Khoe món: mở hộp gửi, có ô ảnh, cảm nhận, tên", await p4.is_visible(".tq-dlg") and await p4.is_visible("[data-tq-ten]"))
        await p4.click("[data-tq-gui]")
        check("gửi trống: báo cần ảnh hoặc cảm nhận", "ảnh hoặc vài dòng" in (await p4.text_content("[data-tq-loi]") or ""))
        await p4.set_input_files("[data-tq-file]", os.path.join(DIST, "assets", "og-mac-dinh.png"))
        await p4.wait_for_selector(".tq-xem img", timeout=5000)
        await p4.fill("[data-tq-noi]", "Nhà mình làm thử, ngon lắm")
        await p4.fill("[data-tq-ten]", "Bạn đọc thử")
        await p4.screenshot(path=f"{OUT}/9-khoe-mon.png")
        await p4.click("[data-tq-gui]"); await p4.wait_for_selector(".tq-the img", timeout=8000)
        the = await p4.evaluate("(()=>{const t=document.querySelector('.tq-the');return [t.querySelector('strong').textContent,t.querySelector('.tq-chu').textContent,!document.querySelector('.tq-dlg').open]})()")
        check("gửi xong: bài hiện ngay đầu danh sách, hộp đóng", the == ["Bạn đọc thử", "Nhà mình làm thử, ngon lắm", True], str(the))
        anh = await p4.evaluate("fetch(document.querySelector('.tq-the img').src).then(async r=>{const b=new Uint8Array(await r.arrayBuffer());const s=new TextDecoder('latin1').decode(b.slice(0,65536));return [r.headers.get('content-type'),b[0]===0xff&&b[1]===0xd8,s.includes('Exif'),b.length<460*1024]})")
        check("ảnh lưu dạng JPEG đã nén, không còn EXIF", anh == ["image/jpeg", True, False, True], str(anh))
        await p4.reload(); await p4.wait_for_selector(".tq-the", timeout=5000)
        check("tải lại: người khác vẫn thấy bài", await p4.text_content(".tq-the strong") == "Bạn đọc thử")
        await p4.click("[data-tq-mo]"); await p4.wait_for_selector(".tq-dlg[open]")
        check("lần sau: máy nhớ tên hiển thị", await p4.input_value("[data-tq-ten]") == "Bạn đọc thử")
        await p4.click("[data-tq-huy]"); await p4.wait_for_selector(".tq-dlg:not([open])", state="attached")
        await p4.screenshot(path=f"{OUT}/10-thanh-qua.png", full_page=False)
        nho, chu = await p4.evaluate(DO)
        check("Thành quả: vùng bấm ≥ 44px, chữ ≥ 13px", not nho and not chu, f"{nho[:4]} {chu[:4]}")
        await p4.click("[data-bao]"); await p4.wait_for_timeout(400)
        check("báo cáo: ghi nhận, không cho báo lại", not await p4.query_selector("[data-bao]") and "đã báo cáo" in await p4.text_content(".tq-the"))
        await p4.goto(BA + "/quan-tri/"); await p4.fill("[data-qt-ma]", "sai"); await p4.click("[data-qt-dang-nhap] button"); await p4.wait_for_timeout(300)
        check("quản trị: sai mã thì báo lỗi", "Sai mã" in await p4.text_content("[data-qt-ds]"))
        await p4.fill("[data-qt-ma]", "ma-quan-tri-thu"); await p4.click("[data-qt-dang-nhap] button"); await p4.wait_for_selector("[data-loc]")
        await p4.click('[data-loc="tat-ca"]'); await p4.wait_for_selector('[data-hd="an"]')
        await p4.click('[data-hd="an"]'); await p4.wait_for_timeout(400)
        await p4.goto(BA + "/mon/trung-chien-hanh/"); await p4.wait_for_selector("[data-tq]:not([hidden])")
        check("quản trị ẩn bài: trang món không còn bài đó", "người đầu tiên" in await p4.text_content("[data-tq-ds]"))
        await c4.close()

        # Service worker: sau khi web cập nhật, người dùng cũ nhận ngay CSS mới (không kẹt bản lưu); mất mạng vẫn mở được
        c3 = await b.new_context(viewport={"width": 390, "height": 844}, locale="vi-VN")
        p3 = await c3.new_page()
        B3 = B.replace("localhost", "127.0.0.1")  # app.js không đăng ký service worker trên "localhost"
        await p3.goto(B3 + "/"); await p3.wait_for_function("navigator.serviceWorker.controller !== null", timeout=10000)
        await p3.reload(); await p3.wait_for_timeout(300)
        css = os.path.join(DIST, "assets", "style.css"); goc = open(css, encoding="utf-8").read()
        try:
            open(css, "w", encoding="utf-8").write(goc + "\n/*ban-moi-thu*/")
            await p3.reload(); await p3.wait_for_timeout(300)
            moi = await p3.evaluate("fetch((document.documentElement.dataset.base || '') + '/assets/style.css').then(r=>r.text()).then(t=>t.includes('ban-moi-thu'))")
            check("cập nhật web: người dùng cũ nhận CSS mới ngay", moi)
        finally:
            open(css, "w", encoding="utf-8").write(goc)
        await c3.set_offline(True)
        await p3.reload(); await p3.wait_for_timeout(300)
        check("mất mạng: trang chủ vẫn mở, có giao diện", await p3.evaluate("getComputedStyle(document.body).fontFamily.includes('Be Vietnam Pro') && !!document.querySelector('[data-spin]')"))
        await c3.close()
        await b.close()
    print("errors:", errs)
    if fails or errs: raise SystemExit(1)

try:
    asyncio.run(main())
finally:
    srv.terminate(); api_srv.terminate()

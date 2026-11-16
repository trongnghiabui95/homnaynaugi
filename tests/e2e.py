# Kiểm thử trên trình duyệt (Playwright). Chạy: DATA_DIR=tests/fixtures node scripts/build.mjs && python3 tests/e2e.py
# Ảnh chụp lưu ở $SHOTS (mặc định /tmp/shots). Dùng Chrome hệ thống: CHROME=/usr/bin/google-chrome
import asyncio, datetime, subprocess, time, json, os
from playwright.async_api import async_playwright
srv = subprocess.Popen(["python3","-m","http.server","8099","-d",os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist")],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
B="http://localhost:8099"
out=os.environ.get("SHOTS","/tmp/shots")
import os; os.makedirs(out,exist_ok=True)
async def main():
  errs=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(**({"executable_path":os.environ["CHROME"]} if os.environ.get("CHROME") else {}))
    ctx=await b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,locale="vi-VN")
    pg=await ctx.new_page()
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(B+"/"); await pg.wait_for_timeout(800)
    await pg.screenshot(path=f"{out}/1-home-empty.png", full_page=True)
    dob=(datetime.date.today()-datetime.timedelta(days=70)).isoformat()
    await pg.fill("[data-form=quick-baby] input[name=date]", dob)
    await pg.fill("[data-form=quick-baby] input[name=name]", "Bin")
    await pg.click("[data-form=quick-baby] button[type=submit]"); await pg.wait_for_timeout(800)
    await pg.screenshot(path=f"{out}/2-home-baby.png")
    await pg.goto(B+"/lich-tiem-chung/"); await pg.wait_for_timeout(800)
    dates=await pg.eval_on_selector_all(".vx-date","els=>els.map(e=>e.textContent)")
    stats=await pg.eval_on_selector_all(".vx-list .st","els=>els.map(e=>e.textContent)")
    print("dob",dob,"dates",dates,"status",stats)
    await pg.screenshot(path=f"{out}/3-vaccines.png", full_page=True)
    await pg.goto(B+"/chuan-bi-di-sinh/"); await pg.wait_for_timeout(500)
    boxes=await pg.query_selector_all("[data-check]")
    await boxes[0].check(); await boxes[1].check()
    await pg.reload(); await pg.wait_for_timeout(600)
    print("progress", await pg.text_content("[data-progress-text]"))
    await pg.screenshot(path=f"{out}/4-checklist.png")
    await pg.goto(B+"/tim-kiem/?q=bim"); await pg.wait_for_timeout(600)
    print("search", await pg.eval_on_selector_all("[data-results] strong","els=>els.map(e=>e.textContent)"))
    await pg.goto(B+"/benh/benh-thu/"); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f"{out}/5-disease.png", full_page=True)
    await pg.goto(B+"/"); await pg.click('[data-toggle="theme"]'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f"{out}/6-home-dark.png")
    await pg.goto(B+"/giai-doan/1-3-thang/"); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f"{out}/7-stage.png", full_page=True)
    # 3 ngày sinh mẫu: kiểm ngày dự kiến
    for d in ["2026-01-31","2025-02-28","2026-11-16"]:
      await pg.goto(B+"/be-cua-toi/"); await pg.wait_for_timeout(300)
      await pg.fill("[data-form=add-baby] input[name=date]", d); await pg.click("[data-form=add-baby] button[type=submit]"); await pg.wait_for_timeout(300)
      await pg.goto(B+"/lich-tiem-chung/"); await pg.wait_for_timeout(500)
      got=await pg.eval_on_selector_all(".vx-date","els=>els.map(e=>e.textContent)")
      base=datetime.date.fromisoformat(d)
      exp=[(base+datetime.timedelta(days=k)).strftime("%d/%m/%Y") for k in [0,60,90,270]]
      print(d, "OK" if got==exp else f"SAI {got} vs {exp}")
    await pg.goto(B+"/be-cua-toi/"); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f"{out}/8-mybaby.png", full_page=True)
    await b.close()
  print("errors:", errs)
asyncio.run(main()); srv.terminate()

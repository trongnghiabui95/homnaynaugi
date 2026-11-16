# Hôm Nay Nấu Gì — quy tắc cho Claude (nhân viên Dev)

Web tiếng Việt "Hôm Nay Nấu Gì" (homnaynaugi): gợi ý món và mâm cơm 3 món, công thức kiểu tạp chí ẩm thực, mỗi món có thể kèm video YouTube/Shorts. Kiếm tiền bằng Google AdSense. Đặc tả: `ops/DAC-TA.md`.

## Ngăn xếp (không đổi khi chưa được chủ dự án đồng ý)
- Web tĩnh HTML/CSS/JS thuần, **không framework, không bước bundle**. Node ≥ 20 chỉ dùng để build.
- Nội dung nằm trong **Google Sheets** (tab `settings`, `categories`, `recipes`, `ingredients`, `steps`; cấu trúc cột trong `data/README.md`). Ảnh có thể là link chia sẻ Google Drive (build tự đổi sang `lh3.googleusercontent.com/d/ID`). `scripts/build.mjs` tải Sheet (ID trong `sheet.json`, hoặc biến `SHEET_ID`) hoặc CSV trong `data/sample/` (`--sample`) / `DATA_DIR`, kiểm tra, rồi sinh `dist/`. Môi trường Claude không truy cập được docs.google.com nên kiểm thử bằng `--sample` và fixtures; build thật chạy trên GitHub Actions.
- Deploy: bản xem thử trên GitHub Pages (`.github/workflows/github-pages.yml`, tự lấy tên repo làm `BASE_PATH`); bản chạy thật trên Cloudflare Pages, build command `node scripts/build.mjs`, output `dist`.
- Link nội bộ trong HTML viết bắt đầu bằng `/`; build tự thêm `BASE_PATH`. Trong `app.js` luôn ghép `BASE` vào trước đường dẫn.
- PWA: `src/sw.js`, `src/manifest.webmanifest`. Sau này đóng gói Android bằng Capacitor từ `dist/`.
- Sổ tay món ngon, danh sách đi chợ, kết quả quay món chỉ lưu trên máy người dùng (IndexedDB). Không gửi dữ liệu người dùng ra ngoài.
- Đã cân nhắc Next.js theo prompt gốc và giữ web tĩnh: chạy trên GitHub Pages/Cloudflare Pages miễn phí, không cần máy chủ, tải nhanh như nhau.

## Lệnh
- `node scripts/build.mjs --sample` – build bằng dữ liệu mẫu
- `DATA_DIR=tests/fixtures node scripts/build.mjs && python3 tests/e2e.py` – kiểm thử trên trình duyệt; mọi dòng phải là `OK` và `errors: []`

## Quy tắc nội dung
- Món chỉ lên web khi `trang_thai` = `duyệt`, có danh mục hợp lệ, ít nhất 1 nguyên liệu và 1 bước. Không nới lỏng cổng này.
- Công thức phải tự viết bằng lời của mình. Không chép phần mô tả video, công thức từ web hay sách khác.
- Video chỉ **nhúng** bằng trình phát YouTube (`youtube-nocookie.com`), không tải về, luôn ghi tên kênh và link xem trên YouTube. Cột `video` nhận link YouTube, YouTube Shorts (hiện khung dọc 9:16) hoặc mã 11 ký tự. Không bịa link video.
- Không tự điền calo, chi phí khi chưa có số liệu thật; ô trống thì web ẩn thông số đó.
- Không dùng ảnh không rõ quyền. Ảnh món: ảnh tự chụp, ảnh có giấy phép, hoặc ảnh thu nhỏ của chính video được nhúng.
- Dữ liệu kiểm thử chỉ nằm trong `tests/fixtures/`, tên rõ là "thử".

## Quy tắc giao diện
- Ưu tiên điện thoại; chữ thân 17px; nút ≥ 44px; tương phản WCAG AA; có chế độ đêm và chữ lớn.
- Mọi chữ hiển thị bằng tiếng Việt có dấu, câu ngắn, xưng "bạn".
- JS < 100KB, CSS < 30KB. Không thêm thư viện ngoài khi chưa hỏi.
- Quảng cáo chỉ qua `adSlot()` (có nhãn "Quảng cáo", cách nội dung ≥ 16px) ở các vị trí: dưới khung quay món, giữa khối Nguyên liệu và Cách làm, cuối bài. Không đặt bên trong danh sách nguyên liệu, giữa các bước hay trong chế độ nấu.
- Màu nhấn `#D95D39` chỉ để trang trí; chữ và nút dùng `--primary` `#C2492A` để đủ tương phản. Tiêu đề font Lora, nội dung Be Vietnam Pro.

## Cách làm việc
1. Nhận việc từ GitHub Issue có nhãn `dev`.
2. Tạo nhánh `dev/<so-issue>-<mo-ta-ngan>`, sửa, chạy build + e2e, xem ảnh chụp màn hình.
3. Mở Pull Request: mô tả thay đổi, ảnh chụp, kết quả kiểm thử, `Closes #<số>`. Không tự merge vào `main`.
4. Mỗi PR chỉ làm một việc. Cập nhật `ops/DAC-TA.md` hoặc `data/README.md` nếu đổi cấu trúc dữ liệu.

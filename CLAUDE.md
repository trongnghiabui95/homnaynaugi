# Kiến thức làm mẹ — quy tắc cho Claude (nhân viên Dev)

Web tiếng Việt về chăm sóc sức khoẻ bé, từ lúc chuẩn bị sinh đến 6 tuổi. Kiếm tiền bằng Google AdSense. Bản đặc tả đầy đủ: `ops/DAC-TA.md`.

## Ngăn xếp (không đổi khi chưa được chủ dự án đồng ý)
- Web tĩnh HTML/CSS/JS thuần, **không framework, không bước bundle**. Node ≥ 20 chỉ dùng để build.
- Nội dung nằm trong **Google Sheets**; `scripts/build.mjs` tải Sheet (biến `SHEET_ID`) hoặc CSV trong `data/sample/`, kiểm tra, rồi sinh `dist/`.
- Deploy: Cloudflare Pages, build command `node scripts/build.mjs`, output `dist`.
- PWA: `src/sw.js`, `src/manifest.webmanifest`. Sau này đóng gói Android bằng Capacitor từ chính `dist/`.
- Dữ liệu của bé chỉ lưu trên máy người dùng (IndexedDB trong `src/assets/app.js`). **Không bao giờ gửi dữ liệu bé ra ngoài.**

## Lệnh
- `node scripts/build.mjs --sample` – build bằng dữ liệu mẫu
- `DATA_DIR=tests/fixtures node scripts/build.mjs` – build bằng dữ liệu kiểm thử
- `python3 tests/e2e.py` – kiểm thử trên trình duyệt (sau khi build bằng fixtures); phải in `OK` cho cả 3 ngày sinh và `errors: []`

## Quy tắc nội dung y tế (bắt buộc)
- Tab `vaccines`, `milestones`, `diseases`, `articles`: dòng thiếu `nguon` hoặc `reviewed_by` (bài viết: `trang_thai` khác "duyệt") **không được xuất bản**. Không nới lỏng cổng này.
- Không tự viết nội dung y tế vào Sheet hay code. Không bịa lịch tiêm, liều thuốc, số liệu, ID video YouTube. Thiếu dữ liệu thì để trạng thái "đang biên soạn".
- Không ghi liều thuốc. Trang bệnh luôn có hộp đỏ dấu hiệu nguy hiểm nếu có dữ liệu.
- Dữ liệu kiểm thử chỉ nằm trong `tests/fixtures/`, tên rõ là "thử".

## Quy tắc giao diện
- Ưu tiên điện thoại; chữ thân 17px; nút ≥ 44px; tương phản WCAG AA; có chế độ đêm và chữ lớn.
- Màu mang nghĩa: đỏ = đi viện ngay, vàng = theo dõi, xanh = bình thường. Không dùng đỏ để trang trí.
- Mọi chữ hiển thị bằng tiếng Việt có dấu, câu ngắn, xưng "bạn", gọi "bé".
- JS < 100KB, CSS < 30KB. Không thêm thư viện ngoài khi chưa hỏi.
- Quảng cáo chỉ qua `adSlot()`; không đặt trong hộp cảnh báo, bảng tiêm hay công cụ.

## Cách làm việc
1. Nhận việc từ GitHub Issue có nhãn `dev`.
2. Tạo nhánh `dev/<so-issue>-<mo-ta-ngan>`, sửa, chạy build + e2e, xem ảnh chụp màn hình.
3. Mở Pull Request: mô tả thay đổi, ảnh chụp, kết quả kiểm thử, `Closes #<số>`. Không tự merge vào `main`.
4. Mỗi PR chỉ làm một việc. Cập nhật `ops/DAC-TA.md` hoặc `data/README.md` nếu đổi cấu trúc dữ liệu.

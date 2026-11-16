# Đặc tả: Bếp Nhà Mình

## Mục tiêu
- Web tiếng Việt chia sẻ công thức nấu ăn đủ loại món (Việt, Á, Âu, bánh, đồ uống, chay), mỗi món có thể kèm video YouTube.
- Người dùng chính: người nấu ăn ở nhà, dùng điện thoại, thường xem ngay trong bếp.
- Kiếm tiền: Google AdSense (cần domain riêng), sau là AdMob khi đóng gói app.
- Chi phí máy chủ 0đ: GitHub + GitHub Pages/Cloudflare Pages + Google Sheets.

## Kiến trúc
Google Sheets → `scripts/build.mjs` (chỉ lấy món đã duyệt) → `dist/` HTML tĩnh + `data/recipes.json` → GitHub Pages (xem thử) / Cloudflare Pages (chạy thật). Video nhúng nhẹ: chỉ ảnh thu nhỏ, bấm mới tải trình phát YouTube.

## Trang
| Trang | Đường dẫn |
| --- | --- |
| Trang chủ: tìm món, danh mục, món nhanh, món mới, món đã lưu | `/` |
| Danh mục | `/danh-muc/`, `/danh-muc/<slug>/` |
| Công thức | `/mon/<slug>/`, tất cả: `/mon/` |
| Tìm món theo tên hoặc theo nguyên liệu, lọc danh mục và thời gian | `/tim-kiem/` |
| Đi chợ, Đã lưu (dữ liệu trên máy) | `/di-cho/`, `/da-luu/` |
| Tất cả video | `/video/` |
| Thông tin | `/ve-chung-toi/`, `/ban-quyen-video/`, `/chinh-sach-bao-mat/`, `/lien-he/` |

## Tính năng trang công thức
- Đổi số người ăn → lượng nguyên liệu tự nhân (hiển thị ½, ¼…).
- Tích nguyên liệu đã chuẩn bị; thêm vào danh sách đi chợ (gộp nguyên liệu trùng giữa các món, chia sẻ qua Zalo).
- Video: bấm phát; mỗi bước có thể có nút "Xem đoạn mm:ss" nhảy đúng giây; video dính trên đầu màn hình khi cuộn trên điện thoại.
- Hẹn giờ theo bước, kêu và rung khi hết giờ.
- Chế độ nấu: từng bước chữ to, giữ màn hình sáng.
- Dữ liệu có cấu trúc schema.org `Recipe` + `VideoObject` để Google hiện kết quả công thức.

## Lộ trình
1. **Chặng 1 – khung** (PR này): toàn bộ trang và tính năng trên, 4 món mẫu.
2. **Chặng 2 – nội dung**: 30–50 món đầu tiên có video, ảnh món.
3. **Chặng 3 – tăng trưởng**: clip TikTok dẫn về từng món, trang tổng hợp ("món ngon cuối tuần", "thực đơn tuần").
4. **Chặng 4 – kiếm tiền**: domain riêng, Search Console, AdSense, app Android.

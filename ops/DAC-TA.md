# Đặc tả: Hôm Nay Nấu Gì (homnaynaugi)

## Mục tiêu
- Trả lời câu hỏi mỗi ngày "hôm nay nấu gì?": gợi ý 1 món hoặc mâm cơm 3 món, kèm công thức kiểu tạp chí ẩm thực và video YouTube/Shorts.
- Người dùng chính: người nấu cơm gia đình, dùng điện thoại, thường xem ngay trong bếp.
- Kiếm tiền: Google AdSense (cần domain riêng, ví dụ homnaynaugi.vn), sau là AdMob khi đóng gói app.
- Chi phí máy chủ 0đ: GitHub + GitHub Pages/Cloudflare Pages + Google Sheets + Google Drive (ảnh).

## Kiến trúc
Google Sheets → `scripts/build.mjs` (chỉ lấy món đã duyệt, đổi link Drive/YouTube) → `dist/` HTML tĩnh + `data/recipes.json` → GitHub Pages (xem thử) / Cloudflare Pages (chạy thật). Không dùng Next.js để không cần máy chủ; web tĩnh tải nhanh tương đương.

## Giao diện
Phong cách tạp chí ẩm thực: nền kem `#FAF8F5`, thẻ trắng đổ bóng mềm, màu nhấn cam đất `#D95D39` (chữ và nút dùng bản đậm `#C2492A` cho đủ tương phản), xanh thảo mộc `#4A7C59`, chữ `#2D2A26`. Tiêu đề Lora, nội dung Be Vietnam Pro. Ảnh 4:3 bo góc, phóng nhẹ khi rê chuột; thời gian và độ khó nằm dưới tên món. Thẻ món và ngăn quay có viền trên màu theo độ khó: Dễ xanh `#4A7C59`, Vừa vàng đất `#96610F`, Khó cam đậm `#C2492A`. Mâm cơm 3 món hiện thành 3 ô nằm ngang trong một khay.

## Trang
| Trang | Đường dẫn |
| --- | --- |
| Trang chủ: tìm món, chủ đề, **Quay món** (1 món / mâm cơm 3 món, lọc bữa, thời gian, nguyên liệu chính, khoá món), danh mục, Tủ lạnh có gì, sổ tay, món nhanh, món mới | `/` |
| Danh mục (lọc độ khó, thời gian, calo; sắp xếp mới nhất / nấu nhanh nhất) | `/danh-muc/`, `/danh-muc/<slug>/` |
| Công thức | `/mon/<slug>/`, tất cả: `/mon/` |
| Tìm món theo tên, chủ đề; **Tủ lạnh có gì** (chọn nguyên liệu, hiện "Đủ 2/2 nguyên liệu") | `/tim-kiem/` |
| Đi chợ, Sổ tay món ngon (dữ liệu trên máy) | `/di-cho/`, `/da-luu/` |
| Video | `/video/` |
| Giới thiệu, Liên hệ, Chính sách bảo mật, Điều khoản sử dụng, Bản quyền video | `/gioi-thieu/`, `/lien-he/`, `/chinh-sach-bao-mat/`, `/dieu-khoan/`, `/ban-quyen-video/` |

## Trang công thức
- Thông số: sơ chế, nấu, độ khó, calo/phần, chi phí ước tính (chỉ hiện khi có số liệu), khẩu phần.
- Chuyển giữa ảnh món và video (Shorts khung dọc); bấm "Xem đoạn mm:ss" ở bước để nhảy đúng giây.
- Nguyên liệu: nút −/+ và chọn nhanh 1/2/4/6 người; tích món cần mua → "Chép danh sách đi chợ" hoặc "Thêm vào Đi chợ".
- Từng bước có tiêu đề, ảnh minh hoạ, hẹn giờ.
- Chế độ đang nấu: chữ to, thanh tiến độ, đánh dấu bước xong, giữ màn hình sáng.
- Bí quyết nấu ngon (hộp xanh thảo mộc), Ăn kèm hợp vị (3 món, tự gợi ý theo mâm cơm nếu Sheet không ghi).
- schema.org `Recipe` + `VideoObject` + `NutritionInformation`.

## Quảng cáo
Khung `adSlot()` có nhãn "Quảng cáo": dưới khung quay món, giữa Nguyên liệu và Cách làm, cuối bài. Chỉ hiện khi có mã AdSense trong tab settings.

## Lộ trình
1. **Chặng 1 – khung** (PR #2): toàn bộ trang và tính năng trên, 9 món mẫu.
2. **Chặng 2 – nội dung**: 30–50 món đầu tiên có video Shorts, ảnh món từ Drive.
3. **Chặng 3 – tăng trưởng**: clip TikTok dẫn về từng món, bài tổng hợp "thực đơn tuần".
4. **Chặng 4 – kiếm tiền**: domain riêng, Search Console, AdSense, app Android.

# Bộ máy vận hành

Ba "nhân viên AI" làm việc qua GitHub Issues. Chủ dự án chỉ duyệt.

| Nhãn Issue | Ai làm | Đầu ra | Chủ dự án làm gì |
| --- | --- | --- | --- |
| `dev` | Dev | Pull Request | Bấm xem, rồi Merge |
| `noi-dung` | Biên tập | Món mới trong Google Sheets, trạng thái `nháp` | Kiểm tra, đổi thành `duyệt` |
| `marketing` | Marketing | Clip TikTok dọc + caption + link về món | Đăng lên TikTok |

## Vận hành mỗi sáng
1. 6:10: workflow **Cập nhật nội dung từ Google Sheets** dựng lại web.
2. 6:40: workflow **Báo cáo vận hành** chạy `scripts/bao-cao.mjs`, ghi tình trạng nội dung (món đã lên web, nháp, lỗi, thiếu video/ảnh, danh mục trống) vào Issue nhãn `bao-cao`.
3. Sau đó skill `/van-hanh` của Claude đọc Issue `bao-cao`, các Issue/PR đang mở, kết quả workflow và `ops/ke-hoach.md`, rồi tạo tối đa 2 Issue mỗi loại; mỗi Issue có mục tiêu, việc cần làm, tiêu chí xong, và không trùng việc đang mở.
4. Khi có domain thật: thêm số liệu lượt truy cập (Cloudflare Web Analytics), từ khoá trên Google (Search Console), thu nhập AdSense, view clip.

## Quy tắc
- Món không bao giờ tự lên web: luôn cần chủ dự án đổi sang `duyệt`.
- Công thức tự viết; video chỉ nhúng, ghi tên kênh.
- Clip TikTok dùng hình tự quay hoặc tự dựng, không cắt lại video của kênh khác.

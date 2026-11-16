# Bộ máy vận hành

Ba "nhân viên AI" làm việc qua GitHub Issues. Chủ dự án chỉ duyệt.

| Nhãn Issue | Ai làm | Đầu ra | Chủ dự án làm gì |
| --- | --- | --- | --- |
| `dev` | Dev | Pull Request + link xem trước của Cloudflare | Bấm xem, rồi Merge |
| `noi-dung` | Biên tập | Dòng mới trong Google Sheets, trạng thái nháp | Duyệt, điền `reviewed_by` |
| `marketing` | Marketing | Clip TikTok dọc + caption + link về trang | Đăng lên TikTok |

## Vận hành (chạy mỗi sáng)
1. Đọc số liệu: lượt truy cập, trang được tìm trên Google, clip nhiều view.
2. Đọc `ops/ke-hoach.md`.
3. Tạo 1–2 Issue `dev`, 1–2 Issue `noi-dung`, 1–2 Issue `marketing`; mỗi Issue có mục tiêu, việc cần làm, tiêu chí xong.
4. Ghi tóm tắt ngày vào `ops/nhat-ky/YYYY-MM.md`.

## Quy tắc
- Nội dung y tế không bao giờ tự lên web: luôn cần người duyệt.
- Clip TikTok không đưa lời khuyên y tế cụ thể; luôn dẫn về trang web có nguồn.
- Mỗi Issue nhỏ, làm xong trong một phiên.

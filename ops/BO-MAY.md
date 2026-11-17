# Bộ máy vận hành

Bốn "nhân viên AI" làm việc qua GitHub Issues: Dev, BA, Checker, Marketing. Chủ dự án duyệt code và clip, còn món ăn do Checker duyệt.

| Nhãn Issue | Ai làm | Đầu ra | Chủ dự án làm gì |
| --- | --- | --- | --- |
| `dev` | Dev | Pull Request | Bấm xem, rồi Merge |
| `noi-dung` | BA | Mỗi ngày 3 món mới tự viết trong Google Sheets, trạng thái `nháp`, kèm Issue "BA – món mới <ngày>" | Không cần làm gì; Checker duyệt |
| `noi-dung` | Checker | Kiểm tra món của BA theo bảng tiêu chí: đạt thì đổi sang `duyệt`, chưa đạt thì trả về BA | Xem danh sách món mới duyệt trong báo cáo 7:00; món nào chưa ổn thì đổi về `nháp` |
| `marketing` | Marketing | Clip TikTok dọc + caption + link về món | Đăng lên TikTok |

## Lịch chạy mỗi ngày
| Giờ | Ai | Việc |
| --- | --- | --- |
| 13:30 | BA | Tham khảo nguồn, tự viết 3 món mới vào Sheet ở trạng thái `nháp`, tạo Issue `noi-dung` "BA – món mới <ngày>" |
| 16:40 | Checker | Kiểm tra món BA vừa viết: dữ liệu đủ, tự viết, an toàn thực phẩm, nấu được, video/ảnh, không bịa số. Đạt thì đổi sang `duyệt`, chưa đạt thì trả về BA kèm lý do |
| 6:10–6:20 sáng hôm sau | GitHub Actions | Web tự dựng lại từ Sheet; món đã `duyệt` lên web |

## Vận hành mỗi sáng
1. 6:10: workflow **Cập nhật nội dung từ Google Sheets** dựng lại web.
2. 6:40: workflow **Báo cáo vận hành** chạy `scripts/bao-cao.mjs`, ghi tình trạng nội dung (món đã lên web, nháp, lỗi, thiếu video/ảnh, danh mục trống) vào Issue nhãn `bao-cao`.
3. Sau đó skill `/van-hanh` của Claude đọc Issue `bao-cao`, các Issue/PR đang mở, kết quả workflow và `ops/ke-hoach.md`, rồi tạo tối đa 2 Issue mỗi loại; mỗi Issue có mục tiêu, việc cần làm, tiêu chí xong, và không trùng việc đang mở.
4. Khi có domain thật: thêm số liệu lượt truy cập (Cloudflare Web Analytics), từ khoá trên Google (Search Console), thu nhập AdSense, view clip.

## Quy tắc
- Món chỉ lên web khi được Checker (theo bảng tiêu chí) hoặc chủ dự án đổi sang `duyệt`. BA không tự duyệt món của mình.
- Chủ dự án gỡ một món bằng cách đổi `trang_thai` về `nháp`; món rời web ở lần dựng kế tiếp.
- Cổng kỹ thuật không đổi: món chỉ lên web khi `trang_thai` = `duyệt`, có danh mục hợp lệ, có ít nhất 1 nguyên liệu và 1 bước.
- Công thức tự viết; video chỉ nhúng, ghi tên kênh.
- Clip TikTok dùng hình tự quay hoặc tự dựng, không cắt lại video của kênh khác.

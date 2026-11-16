# Hướng dẫn Google Sheets (kho công thức)

Toàn bộ công thức nằm trong **một file Google Sheets**. Bạn thêm, sửa món trong Sheet; web tự cập nhật ở lần build kế tiếp (mỗi sáng, hoặc bấm tay ở tab Actions trên GitHub).

## Tạo Sheet lần đầu
1. Vào sheets.google.com, tạo file mới, đặt tên "Bếp Nhà Mình – công thức".
2. Tạo 5 tab, **tên tab viết đúng như dưới**: `settings`, `categories`, `recipes`, `ingredients`, `steps`.
3. Ở mỗi tab: **Tệp → Nhập → Tải lên** file CSV cùng tên trong thư mục `data/sample/`, chọn "Thay thế trang tính hiện tại". Bạn sẽ có sẵn 4 món mẫu.
4. Bấm **Chia sẻ** → "Bất kỳ ai có đường liên kết" → **Người xem**.
5. Lấy **ID** của Sheet: đoạn giữa `/d/` và `/edit` trên thanh địa chỉ.
6. Thêm ID vào GitHub: repo → Settings → Secrets and variables → Actions → New repository secret → tên `SHEET_ID`.

## Thêm một món
1. Tab `recipes`: thêm một dòng, đặt `slug` (tên không dấu nối gạch ngang, ví dụ `ca-kho-to`), để `trang_thai` = `nháp`.
2. Tab `ingredients`: mỗi nguyên liệu một dòng, cột `recipe_slug` ghi đúng slug của món.
3. Tab `steps`: mỗi bước một dòng, đánh số `buoc` 1, 2, 3…
4. Kiểm tra lại rồi đổi `trang_thai` thành `duyệt`. Món sẽ lên web ở lần build kế tiếp.

## Lấy mã video YouTube
Mở video trên YouTube, bấm **Chia sẻ**. Trong link `https://youtu.be/AbCdEfGhIjK`, mã là 11 ký tự sau dấu `/` (ví dụ `AbCdEfGhIjK`). Dán vào cột `youtube_id`, ghi tên kênh vào cột `kenh`.

Muốn một bước có nút "Xem đoạn này": ghi số giây của đoạn đó trong video vào cột `giay_video` của bước (2 phút 15 giây = `135`).

## Các tab
| Tab | Một dòng là | Cột |
| --- | --- | --- |
| `settings` | Một cài đặt | key, value — `site_name`, `tagline`, `site_url` (địa chỉ web thật), `contact_email`; khi có AdSense: `adsense_client`, `adsense_slot_bottom` |
| `categories` | Một danh mục | slug, ten, mo_ta, bieu_tuong (một emoji), thu_tu |
| `recipes` | Một món | slug, ten, danh_muc (slug danh mục), tom_tat, khau_phan (số người), phut_chuan_bi, phut_nau, do_kho (Dễ / Vừa / Khó), anh (link ảnh, có thể bỏ trống), youtube_id, kenh, tags (cách nhau dấu phẩy), meo, trang_thai (nháp / duyệt), cap_nhat (2026-11-16) |
| `ingredients` | Một nguyên liệu | recipe_slug, nhom (ví dụ "Nước sốt", có thể trống), ten, so_luong (số, ½ ghi `0.5`), don_vi, ghi_chu |
| `steps` | Một bước | recipe_slug, buoc, noi_dung, giay_video (giây trong video, có thể trống), hen_gio_phut (hiện nút hẹn giờ, có thể trống) |

## Quy tắc nội dung
- Tự viết công thức bằng lời của mình, không chép phần mô tả video hay công thức từ web khác.
- Ưu tiên video cho phép nhúng; nếu chủ kênh tắt nhúng, video sẽ không phát trên web.
- Không ghi thông tin cá nhân hay mật khẩu vào Sheet: ai có link cũng xem được.

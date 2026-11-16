# Hướng dẫn Google Sheets (kho công thức)

Toàn bộ công thức của **Hôm Nay Nấu Gì** nằm trong **một file Google Sheets**. Bạn thêm, sửa món trong Sheet; web tự cập nhật ở lần build kế tiếp (mỗi sáng, hoặc bấm tay ở tab Actions trên GitHub).

## Tạo Sheet lần đầu
1. Vào sheets.google.com, tạo file mới, đặt tên "Hôm Nay Nấu Gì – công thức".
2. Tạo 5 tab, **tên tab viết đúng như dưới**: `settings`, `categories`, `recipes`, `ingredients`, `steps`.
3. Ở mỗi tab: **Tệp → Nhập → Tải lên** file CSV cùng tên trong thư mục `data/sample/`, chọn "Thay thế trang tính hiện tại". Bạn có sẵn 9 món mẫu.
4. Bấm **Chia sẻ** → "Bất kỳ ai có đường liên kết" → **Người xem**.
5. Lấy **ID** của Sheet: đoạn giữa `/d/` và `/edit` trên thanh địa chỉ.
6. Thêm ID vào GitHub: repo → Settings → Secrets and variables → Actions → New repository secret → tên `SHEET_ID`.

## Thêm một món
1. Tab `recipes`: thêm một dòng, đặt `slug` (tên không dấu nối gạch ngang, ví dụ `ca-kho-to`), để `trang_thai` = `nháp`.
2. Tab `ingredients`: mỗi nguyên liệu một dòng, cột `recipe_slug` ghi đúng slug của món.
3. Tab `steps`: mỗi bước một dòng, đánh số `buoc` 1, 2, 3…
4. Kiểm tra lại rồi đổi `trang_thai` thành `duyệt`. Món sẽ lên web ở lần build kế tiếp.

Để vòng quay **Mâm cơm 3 món** chạy, cần có món trong cả 3 danh mục `mon-man`, `mon-canh`, `mon-rau-xao`.

## Video YouTube và YouTube Shorts
Dán **link** vào cột `video` của món, ví dụ `https://youtube.com/shorts/AbCdEfGhIjK` hoặc `https://youtu.be/AbCdEfGhIjK`. Link Shorts hiện khung dọc 9:16. Ghi tên kênh vào cột `kenh`.

Không có ảnh riêng thì web lấy ảnh bìa của video làm ảnh món.

Muốn một bước có nút "Xem đoạn này": ghi số giây của đoạn đó trong video vào cột `giay_video` của bước (2 phút 15 giây = `135`).

## Ảnh từ Google Drive
1. Tạo một thư mục trên Drive, bấm **Chia sẻ** → "Bất kỳ ai có đường liên kết" → **Người xem**.
2. Tải ảnh lên, bấm chuột phải vào ảnh → **Chia sẻ → Sao chép đường liên kết**.
3. Dán nguyên link vào cột `anh` (món, bước hoặc danh mục). Web tự đổi sang link ảnh tải nhanh.

## Các tab
| Tab | Một dòng là | Cột |
| --- | --- | --- |
| `settings` | Một cài đặt | key, value — `site_name`, `tagline`, `site_url` (địa chỉ web thật), `contact_email`, `chu_de` (chủ đề nổi bật, cách nhau dấu phẩy, phải trùng với tags của món); khi có AdSense: `adsense_client`, `adsense_slot_home`, `adsense_slot_mid`, `adsense_slot_bottom` |
| `categories` | Một danh mục | slug, ten, mo_ta, bieu_tuong (một emoji), anh (link ảnh tròn, có thể trống), thu_tu |
| `recipes` | Một món | slug, ten, danh_muc (slug danh mục), tom_tat, khau_phan (số người), phut_chuan_bi, phut_nau, do_kho (Dễ / Vừa / Khó), bua (sáng, trưa, tối – cách nhau dấu phẩy), nguyen_lieu_chinh (Thịt heo, Gà, Cá, Trứng…), calo (kcal mỗi phần, để trống nếu chưa biết), chi_phi (đồng, để trống nếu chưa biết), anh, video, kenh, tags (cách nhau dấu phẩy), meo (bí quyết), an_kem (slug món ăn kèm, cách nhau dấu phẩy), trang_thai (nháp / duyệt), cap_nhat (2026-11-16) |
| `ingredients` | Một nguyên liệu | recipe_slug, nhom (ví dụ "Ướp thịt", có thể trống), ten, so_luong (số; ½ ghi `0.5`), don_vi, ghi_chu |
| `steps` | Một bước | recipe_slug, buoc, tieu_de, noi_dung, anh (ảnh bước, có thể trống), giay_video (có thể trống), hen_gio_phut (hiện nút hẹn giờ, có thể trống) |

## Quy tắc nội dung
- Tự viết công thức bằng lời của mình, không chép phần mô tả video hay công thức từ web khác.
- Calo và chi phí chỉ điền khi có số liệu thật; để trống thì web không hiện.
- Không ghi thông tin cá nhân hay mật khẩu vào Sheet: ai có link cũng xem được.

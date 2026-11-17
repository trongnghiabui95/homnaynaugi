# Hướng dẫn Google Sheets (kho công thức)

Toàn bộ công thức của **Hôm Nay Nấu Gì** nằm trong **một file Google Sheets**. Bạn thêm, sửa món trong Sheet; web tự cập nhật ở lần build kế tiếp (mỗi sáng, hoặc bấm tay ở tab Actions trên GitHub).

## Sheet đang dùng
[Hôm Nay Nấu Gì – công thức](https://docs.google.com/spreadsheets/d/1c1jpTB0ckqe3YuDkrl4UK6P48c6xv7pDZHFDpxCd--Q/edit) (chủ sở hữu: tài khoản Google của chủ dự án, chế độ "ai có link đều xem được"). ID của Sheet ghi trong `sheet.json` ở thư mục gốc repo. Sheet có sẵn 5 tab và 9 món mẫu; mọi ô để định dạng văn bản để Google Sheets không tự đổi số thành ngày.

Muốn dùng Sheet khác: tạo 5 tab đúng tên `settings`, `categories`, `recipes`, `ingredients`, `steps` (nhập từ các file CSV trong `data/sample/`), chia sẻ "Bất kỳ ai có đường liên kết → Người xem", rồi sửa ID trong `sheet.json`.

## Thêm một món
1. Tab `recipes`: thêm một dòng, đặt `slug` (tên không dấu nối gạch ngang, ví dụ `ca-kho-to`), để `trang_thai` = `nháp`.
2. Tab `ingredients`: mỗi nguyên liệu một dòng, cột `recipe_slug` ghi đúng slug của món.
3. Tab `steps`: mỗi bước một dòng, đánh số `buoc` 1, 2, 3…
4. Để nguyên `nháp`. Checker kiểm tra theo bảng tiêu chí (16:40 mỗi ngày), đạt thì đổi `trang_thai` thành `duyệt`, chưa đạt thì trả về BA. Món đã `duyệt` lên web ở lần build kế tiếp (6:10–6:20 sáng hôm sau). Chủ dự án muốn gỡ món thì đổi lại thành `nháp`. Xem `ops/BO-MAY.md`.

Để vòng quay **Mâm cơm 3 món** chạy, cần có món trong cả 3 danh mục `mon-man`, `mon-canh`, `mon-rau-xao`.

## Video YouTube và YouTube Shorts
Dán **link** vào cột `video` của món, ví dụ `https://youtube.com/shorts/AbCdEfGhIjK` hoặc `https://youtu.be/AbCdEfGhIjK`. Link Shorts hiện khung dọc 9:16. Ghi tên kênh vào cột `kenh`.

Không có ảnh riêng thì web lấy ảnh bìa của video làm ảnh món.

Muốn một bước có nút "Xem đoạn này": ghi số giây của đoạn đó trong video vào cột `giay_video` của bước (2 phút 15 giây = `135`).

## Ảnh từ Google Drive
1. Tạo một thư mục trên Drive, bấm **Chia sẻ** → "Bất kỳ ai có đường liên kết" → **Người xem**.
2. Tải ảnh lên, bấm chuột phải vào ảnh → **Chia sẻ → Sao chép đường liên kết**.
3. Dán nguyên link vào cột `anh` (món, bước hoặc danh mục). Web tự đổi sang link ảnh tải nhanh.

## Ảnh từ Wikimedia Commons
1. Tìm ảnh trên [commons.wikimedia.org](https://commons.wikimedia.org/wiki/Category:Cuisine_of_Vietnam), mở trang của ảnh (địa chỉ có dạng `.../wiki/File:Ten_anh.jpg`).
2. Sao chép địa chỉ trang đó, dán vào cột `anh` (món, bước hoặc danh mục). Cũng nhận link ảnh `upload.wikimedia.org/...` hoặc chỉ `File:Ten_anh.jpg`.
3. Khi build, web tự lấy ảnh cỡ vừa (1280px) và **tự ghi** tác giả, giấy phép, link trang ảnh dưới ảnh. Không cần tải ảnh về, không cần điền `anh_nguon`. Nếu điền `anh_nguon` thì web dùng phần bạn ghi.
4. Ảnh bị xoá, sai tên hoặc thiếu thông tin giấy phép thì web **không hiện ảnh đó** và ghi cảnh báo trong log build. Lúc build không kết nối được Commons thì các ảnh Commons tạm ẩn, lần build sau tự hiện lại.

## Bản dịch tiếng Anh (trang `/en/`)
Mỗi cột nội dung có thể thêm một cột cùng tên kèm đuôi `_en` (tuỳ chọn, để trống được). Thêm cột vào cuối tab; build tự nhận theo tên cột.

| Tab | Cột bản dịch |
| --- | --- |
| `recipes` | `ten_en`, `tom_tat_en`, `meo_en` |
| `ingredients` | `ten_en`, `ghi_chu_en`, `don_vi_en` (đơn vị, ví dụ `cloves`), `nhom_en` (tên nhóm) |
| `steps` | `tieu_de_en`, `noi_dung_en`, `giai_doan_en`, `dau_hieu_en`, `luu_y_en` |

- Trang `/en/mon/<slug>/` dùng bản `_en` khi có; ô nào chưa dịch thì hiện tiếng Việt (đánh dấu `lang="vi"`).
- Món **đã dịch** khi có đủ `ten_en`, `tom_tat_en`, mọi nguyên liệu có `ten_en` (và `ghi_chu_en` nếu có ghi chú), mọi bước có `noi_dung_en` (và `tieu_de_en` nếu có tiêu đề). Khi đó trang không còn dòng "This recipe is not translated yet." và dữ liệu Google (`Recipe`) ghi `inLanguage: "en"`. Mẹo, nhóm, đơn vị không bắt buộc.
- Số lượng giữ nguyên. Đơn vị: dùng `don_vi_en`; trống thì tra từ điển trong `scripts/i18n.mjs` (thìa canh → tbsp, thìa cà phê → tsp, quả → bỏ trống…); không có thì giữ tiếng Việt.
- Tên danh mục và độ khó tiếng Anh lấy từ từ điển giao diện (`cat_name`, `diff_*` trong `scripts/i18n.mjs`). Danh mục mới chưa có trong từ điển thì giữ tên tiếng Việt.
- Bản dịch không đổi cổng duyệt: món vẫn chỉ lên web khi `trang_thai` = `duyệt`. Báo cáo vận hành có dòng "Món đã dịch tiếng Anh: X/Y".
- Dịch bằng lời của mình, câu ngắn, xưng "you".

## Các tab
| Tab | Một dòng là | Cột |
| --- | --- | --- |
| `settings` | Một cài đặt | key, value — `site_name`, `tagline`, `tagline_en` (câu giới thiệu ở trang tiếng Anh `/en/`, có thể trống), `site_url` (địa chỉ web thật), `contact_email`, `chu_de` (chủ đề nổi bật, cách nhau dấu phẩy, phải trùng với tags của món); khi có AdSense: `adsense_client`, `adsense_slot_home`, `adsense_slot_mid`, `adsense_slot_bottom`; `turnstile_site_key` (Site Key Cloudflare Turnstile, bật mục "Thành quả của bạn đọc", xem `ops/BAT-THANH-QUA.md`); `google_site_verification` (mã xác minh Google Search Console, xem mục SEO trong `ops/DAC-TA.md`) |
| `categories` | Một danh mục | slug, ten, mo_ta, bieu_tuong (một emoji), anh (link ảnh tròn, có thể trống), thu_tu |
| `recipes` | Một món | slug, ten, danh_muc (slug danh mục), tom_tat, khau_phan (số người), phut_chuan_bi, phut_nau, do_kho (Dễ / Vừa / Khó), bua (sáng, trưa, tối – cách nhau dấu phẩy), nguyen_lieu_chinh (Thịt heo, Gà, Cá, Trứng…), calo (kcal mỗi phần, để trống nếu chưa biết), chi_phi (đồng, để trống nếu chưa biết), anh, video, kenh, tags (cách nhau dấu phẩy), meo (bí quyết), an_kem (slug món ăn kèm, cách nhau dấu phẩy), trang_thai (nháp / duyệt), cap_nhat (2026-11-16), anh_nguon (ghi công ảnh không tự chụp: tên tác giả, giấy phép, link trang ảnh; ảnh tự chụp thì để trống) |
| `ingredients` | Một nguyên liệu | recipe_slug, nhom (ví dụ "Ướp thịt", có thể trống), ten, so_luong (số; ½ ghi `0.5`), don_vi, ghi_chu |
| `steps` | Một bước | recipe_slug, buoc, tieu_de, noi_dung, anh (ảnh bước, có thể trống), giay_video (có thể trống), hen_gio_phut (hiện nút hẹn giờ, có thể trống), giai_doan (ví dụ Sơ chế / Nấu / Hoàn thiện, có thể trống), dau_hieu (nấu tới đâu là được, có thể trống), luu_y (lỗi hay gặp hoặc mẹo riêng của bước, có thể trống) |

### Giai đoạn, dấu hiệu đạt, lưu ý (tab `steps`, tuỳ chọn)
- `giai_doan`: các bước **liền nhau** cùng giai đoạn được gom dưới một tiêu đề nhỏ, kèm số bước ("Sơ chế · 2 bước"). Ghi đúng cùng một chữ cho các bước trong một giai đoạn.
- `dau_hieu`: hiện thành dòng "Đạt khi: …" có icon con mắt. Ví dụ "thịt săn lại, nước sánh màu cánh gián".
- `luu_y`: hiện thành ghi chú nền xanh nhạt "Lưu ý: …". Ví dụ "đừng đậy vung kẻo nước đục".
- Cả ba cột để trống thì trang món hiển thị như cũ. Sheet cũ chưa có các cột này vẫn build được. Chế độ nấu hiện "Đạt khi" và "Lưu ý" của bước đang xem.
- Dữ liệu Google: có giai đoạn thì các bước được gom bằng `HowToSection`.
- Bản dịch `_en` của ba cột không bắt buộc để món được tính là "đã dịch" (giống mẹo); ô chưa dịch hiện tiếng Việt.

## Quy tắc nội dung
- Tự viết công thức bằng lời của mình, không chép phần mô tả video hay công thức từ web khác.
- Calo và chi phí chỉ điền khi có số liệu thật; để trống thì web không hiện.
- Không ghi thông tin cá nhân hay mật khẩu vào Sheet: ai có link cũng xem được.

## Ghi nguồn ảnh

Ảnh không phải tự chụp phải có giấy phép rõ và ghi vào cột `anh_nguon`, ví dụ:
`Nguyễn Văn A, CC BY-SA 4.0 https://commons.wikimedia.org/wiki/File:Ten_anh.jpg`
Web hiện một dòng nhỏ "Nguồn: tác giả, giấy phép" ngay dưới ảnh, bấm vào là tới trang ảnh. Ảnh Wikimedia Commons dán link trang ảnh thì web tự ghi nguồn (xem mục trên). Xem thêm `ops/NGUON-NOI-DUNG.md`.

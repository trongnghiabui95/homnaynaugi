# Hướng dẫn Google Sheets (kho nội dung)

Toàn bộ nội dung web nằm trong **một file Google Sheets**. Bạn sửa Sheet, web tự cập nhật ở lần build kế tiếp (mỗi sáng hoặc khi bấm tay).

## Tạo Sheet lần đầu
1. Vào sheets.google.com → tạo file mới, đặt tên "Kiến thức làm mẹ – nội dung".
2. Tạo đủ 9 tab, **tên tab viết đúng như dưới** (chữ thường, không dấu): `settings`, `stages`, `checklist`, `vaccines`, `milestones`, `diseases`, `articles`, `videos`, `growth_ref`.
3. Mở từng file CSV trong `data/sample/`, chép dòng tiêu đề (và các dòng mẫu nếu muốn) vào tab cùng tên. Cách nhanh: trong mỗi tab chọn **Tệp → Nhập → Tải lên** file CSV tương ứng, chọn "Thay thế trang tính hiện tại".
4. Bấm **Chia sẻ** → "Bất kỳ ai có đường liên kết" → **Người xem**.
5. Lấy **ID** của Sheet: đoạn giữa `/d/` và `/edit` trên thanh địa chỉ.
6. Gửi ID cho Claude, hoặc tự thêm vào: GitHub repo → Settings → Secrets and variables → Actions → `SHEET_ID`; và Cloudflare Pages → Settings → Environment variables → `SHEET_ID`.

Không ghi thông tin cá nhân, mật khẩu hay dữ liệu của bé vào Sheet: Sheet ở chế độ ai có link cũng xem được.

## Quy tắc chung
- **Tuổi tính bằng số ngày**: 0 = ngày sinh, 30 ≈ 1 tháng, 365 = 1 tuổi; số âm = trước sinh (−280 ≈ đầu thai kỳ).
- **slug**: chữ thường không dấu, nối bằng gạch ngang (`sot-o-tre`). Đã đăng thì không đổi.
- **nguon**: mỗi nguồn dạng `Tên nguồn | https://link`, nhiều nguồn cách nhau dấu `;`.
- **cap_nhat**: ngày dạng `2026-11-16`.
- Ô có nhiều đoạn (triệu chứng, nội dung bài) viết Markdown: dòng bắt đầu bằng `- ` là gạch đầu dòng, `## ` là tiêu đề nhỏ, `**chữ**` là in đậm.

## Cổng kiểm duyệt
Các tab `vaccines`, `milestones`, `diseases`, `articles` là nội dung y tế. Một dòng **chỉ lên web** khi có `nguon` **và** `reviewed_by` (bài viết thêm `trang_thai` = `duyệt`). Dòng chưa đủ vẫn nằm trong Sheet, script build liệt kê lại để bạn biết.

## Các tab
| Tab | Một dòng là | Cột |
| --- | --- | --- |
| `settings` | Một cài đặt | key, value — `site_name`, `tagline`, `site_url`, `contact_email`; khi có AdSense: `adsense_client`, `adsense_slot_top`, `adsense_slot_mid`, `adsense_slot_bottom` |
| `stages` | Một giai đoạn | slug, ten, tu_ngay, den_ngay, tom_tat, thu_tu |
| `checklist` | Một món/việc cần chuẩn bị | stage_slug, nhom, ten, so_luong, bat_buoc (có/không), ghi_chu |
| `vaccines` | Một mũi tiêm | ma, ten_vaccine, phong_benh, mui_so, tuoi_ngay_som_nhat, tuoi_ngay_muon_nhat, loai (TCMR / Dịch vụ), luu_y, nguon, reviewed_by, cap_nhat |
| `milestones` | Một mốc phát triển | stage_slug, linh_vuc, mo_ta, dau_hieu_can_kham, nguon, reviewed_by |
| `diseases` | Một bệnh | slug, ten, nhom_tuoi, stage_slugs (cách nhau dấu phẩy), tom_tat, trieu_chung, dau_hieu_nguy_hiem, phong_ngua, khi_nao_di_kham, nguon, reviewed_by, cap_nhat |
| `articles` | Một bài viết | slug, tieu_de, stage_slug, tom_tat, noi_dung, anh, nguon, reviewed_by, trang_thai (nháp / duyệt), cap_nhat |
| `videos` | Một video YouTube | youtube_id (11 ký tự sau `v=`), tieu_de, kenh, chu_de, stage_slug, thu_tu |
| `growth_ref` | Một mốc chuẩn tăng trưởng WHO | gioi_tinh, tuoi_thang, chi_so, p3, p15, p50, p85, p97 |

Chỉ chọn video từ kênh y tế uy tín (Bộ Y tế, bệnh viện nhi, UNICEF, WHO) và cho phép nhúng.

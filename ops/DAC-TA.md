# Đặc tả web Kiến thức làm mẹ

Bản đầy đủ có sơ đồ: [Prompt dựng web Chăm sóc sức khoẻ bé](https://claude.ai/artifact/2fo7p7LSerhGvStWN7iiSh). File này là bản tóm tắt để nhân viên Dev đọc nhanh.

## Mục tiêu
- Web tiếng Việt chăm sóc sức khoẻ bé từ lúc chuẩn bị sinh đến 6 tuổi, cho ba mẹ trẻ dùng chủ yếu trên điện thoại.
- Kiếm tiền: AdSense trên web, AdMob khi đóng gói app.
- Chi phí máy chủ 0đ: GitHub + Cloudflare Pages + Google Sheets.
- Một mã nguồn cho web, PWA và app Android (Capacitor).

## Kiến trúc
Google Sheets → `scripts/build.mjs` (lọc dòng chưa duyệt) → `dist/` HTML tĩnh + JSON → Cloudflare Pages → điện thoại. Dữ liệu riêng của bé chỉ nằm trong IndexedDB trên máy. Video nhúng nhẹ từ YouTube, chỉ tải khi bấm.

## Trang
| Trang | Đường dẫn |
| --- | --- |
| Hôm nay (cá nhân theo tuổi bé) | `/` |
| Giai đoạn | `/giai-doan/`, `/giai-doan/<slug>/` |
| Chuẩn bị đi sinh (checklist) | `/chuan-bi-di-sinh/` |
| Lịch tiêm chủng (+ lịch cá nhân, xuất .ics) | `/lich-tiem-chung/` |
| Bệnh thường gặp | `/benh/`, `/benh/<slug>/` |
| Bài viết | `/bai-viet/`, `/bai-viet/<slug>/` |
| Video | `/video/` |
| Tra cứu (gõ không dấu) | `/tim-kiem/` |
| Bé của tôi (hồ sơ, sao lưu) | `/be-cua-toi/` |
| Trang tin cậy | `/ve-chung-toi/`, `/quy-trinh-bien-tap/`, `/nguon-tham-khao/`, `/mien-tru-trach-nhiem/`, `/chinh-sach-bao-mat/`, `/lien-he/` |

## Lộ trình
1. **Chặng 1 – khung kỹ thuật** (xong trong PR đầu tiên): build từ Sheet/CSV, các trang trên, PWA, kiểm thử.
2. **Chặng 2 – tính năng**: biểu đồ tăng trưởng theo chuẩn WHO, tra theo triệu chứng, trang giai đoạn giàu hơn, hình minh hoạ SVG.
3. **Chặng 3 – nội dung**: 30–50 trang đã duyệt, video theo giai đoạn.
4. **Chặng 4 – ra mắt**: domain riêng, Search Console, Analytics, AdSense, app Android.

## Tiêu chí nghiệm thu
- [ ] Sửa một ô trong Sheet → web cập nhật sau lần build kế tiếp, không sửa code.
- [ ] Dòng thiếu nguồn hoặc chưa duyệt không lên web, script báo rõ dòng nào.
- [ ] 3 ngày sinh mẫu → lịch tiêm cá nhân khớp bảng gốc (`tests/e2e.py`).
- [ ] Tắt mạng vẫn mở được trang đã xem và lịch tiêm của bé.
- [ ] Không dữ liệu nào của bé rời khỏi điện thoại.
- [ ] Mọi trang y tế có nguồn, ngày cập nhật, người kiểm duyệt.
- [ ] Lighthouse mobile ≥ 90 cả 4 mục.

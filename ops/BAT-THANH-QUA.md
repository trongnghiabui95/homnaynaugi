# Bật mục "Thành quả của bạn đọc" (ảnh món đã nấu + bình luận)

Người dùng bấm **"Khoe món bạn nấu"** dưới mỗi công thức để chụp hoặc chọn ảnh, viết một dòng cảm nhận, nhập tên rồi gửi. Không cần đăng nhập. Bài hiện ngay cho mọi người cùng xem. Bài bị 3 người báo cáo thì tự ẩn; bạn gỡ hoặc hiện lại ở trang `/quan-tri/`.

**Chi phí: 0đ, không cần gắn thẻ.**
- Cloudflare Pages Functions: gói Free, 100.000 lượt gọi mỗi ngày.
- Cloudflare D1: gói Free, 5GB. Ảnh đã nén khoảng 150–300KB, nên đủ cho hàng chục nghìn ảnh.
- Cloudflare Turnstile: miễn phí.

Mục này **chỉ chạy trên bản thật (Cloudflare Pages)**. Bản xem thử trên GitHub Pages không có máy chủ nên mục tự ẩn.

## Các bước (làm một lần, khoảng 10 phút)

1. **Dự án Cloudflare Pages.** Nếu chưa có: Cloudflare → Workers & Pages → Create → Pages → Connect to Git → chọn repo `homnaynaugi`.
   - Build command: `node scripts/build.mjs`
   - Build output: `dist`
   - Thư mục `functions/` ở gốc repo được Cloudflare tự nhận.
2. **Tạo cơ sở dữ liệu.** Workers & Pages → D1 SQL Database → Create → đặt tên `homnaynaugi`. Không cần tạo bảng: web tự tạo ở lần gọi đầu.
3. **Gắn cơ sở dữ liệu vào web.** Vào dự án Pages → Settings → Bindings → Add → D1 database.
   - Variable name: `DB`
   - Database: `homnaynaugi`
   - Làm cho cả Production và Preview.
4. **Tạo ô chống bot.** Cloudflare → Turnstile → Add widget.
   - Tên: Hôm Nay Nấu Gì.
   - Hostname: tên miền của web: `cookwhattoday.com`, `www.cookwhattoday.com` và `homnaynaugi.pages.dev`.
   - Widget mode: **Managed**.
   - Chép **Site Key** và **Secret Key**.
5. **Khoá bí mật cho web.** Dự án Pages → Settings → Variables and Secrets → Add, chọn loại **Secret**:
   - `TURNSTILE_SECRET` = Secret Key ở bước 4
   - `ADMIN_TOKEN` = một chuỗi dài, khó đoán, tự đặt (đây là mật khẩu trang quản trị)
   - `MUOI` = một chuỗi ngẫu nhiên khác, dùng để băm IP; đặt một lần rồi không đổi
6. **Bật mục trên web.** Mở Google Sheet, tab `settings`, thêm dòng `turnstile_site_key` = Site Key ở bước 4.
7. **Build lại.** Cloudflare Pages → Deployments → Retry deployment, hoặc đợi lần cập nhật mỗi sáng.

Xong: mở một trang món, cuộn xuống dưới phần cách làm là thấy mục **"Thành quả của bạn đọc"**.

## Quản trị
- Vào `https://<tên-miền>/quan-tri/` rồi nhập `ADMIN_TOKEN`. Trang này không hiện trên Google (noindex).
- Thẻ **"Bị ẩn"** liệt kê bài bị 3 người báo cáo. Bấm **Hiện lại** nếu bài không vi phạm, hoặc **Xoá hẳn**.
- Thẻ **"Tất cả"** hiện 200 bài mới nhất. Có thể ẩn hoặc xoá bất kỳ bài nào.
- Khi có người yêu cầu gỡ bài của họ qua email liên hệ: tìm bài theo tên và món ở thẻ "Tất cả" rồi xoá.

## Chống lạm dụng có sẵn
- Turnstile chặn máy tự động gửi bài. Người thật thường không phải bấm gì.
- Mỗi người (theo mã băm IP) gửi tối đa 5 bài mỗi giờ.
- Không cho chèn đường link. Tên tối đa 40 ký tự, cảm nhận tối đa 500 ký tự.
- Ảnh được nén ngay trên máy người dùng (cạnh dài ≤ 1080px) và xoá thông tin máy chụp, vị trí GPS. Máy chủ chỉ nhận JPEG/WebP ≤ 600KB và từ chối ảnh còn EXIF.
- Không lưu IP thật, chỉ lưu mã băm SHA-256 của IP cộng `MUOI`.

## Kỹ thuật
- Máy chủ: `functions/api/[[path]].js` (Cloudflare Pages Function cho `/api/*`). Bảng `bai` và `bao_cao` trong D1.
- Giao diện: `src/assets/thanh-qua.js` và `src/assets/thanh-qua.css`, chỉ tải trên trang món và trang quản trị.
- Kiểm thử:
  - `node --test tests/thanh-qua.test.mjs` chạy API trên D1 giả lập bằng `node:sqlite`.
  - `tests/e2e.py` tự bật `tests/may-chu-thu.mjs` và thử cả luồng gửi, xem, báo cáo, quản trị trên trình duyệt.

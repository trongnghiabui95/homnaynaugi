# Đăng bài ảnh TikTok bằng API

Công cụ `ops/tiktok/tiktok.py` để nhân viên Marketing (Claude) đăng bài ảnh lên kênh TikTok qua Content Posting API. Chỉ đăng khi AI vận hành ra lệnh **sau khi chủ dự án đã duyệt bài trong chat**. Công cụ chỉ thực hiện, không tự quyết.

Cần chuẩn bị trước (Issue #61): app TikTok có Login Kit + Content Posting API (Direct Post), repo ảnh `homnaynaugi-media` bật GitHub Pages và đã xác minh trong *URL properties*, mạng của Claude mở `open.tiktokapis.com`.

Chỉ dùng thư viện chuẩn Python 3, không cần cài gì.

## File khoá
File JSON nằm **ngoài repo** (ví dụ trong Google Drive của chủ dự án, chép vào phiên khi cần), đặt tên `tiktok-khoa.json` (`.gitignore` đã chặn `tiktok-khoa*.json`). Lúc đầu chỉ có:

```json
{ "client_key": "…", "client_secret": "…" }
```

Sau khi kết nối, công cụ tự ghi thêm `access_token`, `refresh_token`, `expires_at`, `refresh_expires_at`, `open_id`, `scope`. File được ghi với quyền 600. Mỗi lần đăng có thể làm mới token và ghi lại file, nên **chép file đã cập nhật về chỗ cất** sau khi đăng.

Không bao giờ dán nội dung file khoá vào Issue, PR, commit hay log. Công cụ không in token/secret ra màn hình.

## Kết nối tài khoản (làm 1 lần, hoặc khi báo "cần kết nối lại")
1. `python3 ops/tiktok/tiktok.py lien-ket --key-file tiktok-khoa.json` → in một link đăng nhập TikTok.
2. Gửi link cho chủ dự án. Chủ dự án mở link, đăng nhập bằng tài khoản kênh, bấm đồng ý.
3. TikTok chuyển về `https://trongnghiabui95.github.io/homnaynaugi/?code=…&state=…`. Chủ dự án chép **nguyên địa chỉ** trên thanh trình duyệt gửi lại trong chat (mã chỉ dùng được vài phút).
4. `python3 ops/tiktok/tiktok.py ket-noi --key-file tiktok-khoa.json "<địa chỉ đó>"` → in `{"ket_noi": "ok", …}`.

Link ở bước 1 chỉ dùng được một lần: chạy `lien-ket` lại thì link cũ hết tác dụng (`state` không khớp).

Access token sống 24 giờ, công cụ tự làm mới khi còn dưới 10 phút. Refresh token sống khoảng 1 năm; hết hạn hoặc chủ dự án gỡ quyền app thì công cụ báo "cần kết nối lại" → làm lại từ bước 1.

## Định dạng `post.json`
```json
{
  "title": "Canh chua cá lóc 20 phút",
  "description": "Chua thanh, ngọt cá… Công thức: https://… #homnaynaugi #nauan",
  "images": [
    "https://trongnghiabui95.github.io/homnaynaugi-media/2026-11-20/canh-chua/1.jpg",
    "https://trongnghiabui95.github.io/homnaynaugi-media/2026-11-20/canh-chua/2.jpg"
  ],
  "cover_index": 0
}
```

| Trường | Bắt buộc | Giới hạn |
| --- | --- | --- |
| `title` | có | ≤ 90 ký tự |
| `description` | không | ≤ 4000 ký tự, chứa hashtag và link |
| `images` | có | 1–35 link, mọi link bắt đầu bằng `https://trongnghiabui95.github.io/homnaynaugi-media/` |
| `cover_index` | không | số thứ tự ảnh bìa, đếm từ 0 (mặc định 0) |

Ảnh: **JPG**, cạnh dài **tối đa 1080px** (nên dùng 1080×1920 dọc hoặc 1080×1350), đã đẩy lên repo `homnaynaugi-media` và mở được công khai **trước** khi đăng. Công cụ kiểm tra file bài trước khi gọi TikTok; sai thì dừng và không gọi API.

Nhạc nền: công cụ luôn bật `auto_add_music` để TikTok tự gắn nhạc.

## Đăng bài
```
python3 ops/tiktok/tiktok.py dang --key-file tiktok-khoa.json --bai post.json
```

Công cụ gọi `creator_info/query`, chọn chế độ hiển thị, gọi `content/init` (`PHOTO`, `DIRECT_POST`, `PULL_FROM_URL`), rồi hỏi trạng thái tới khi xong (tối đa 3 phút). Kết quả in ra một dòng JSON:

```json
{"publish_id": "p_pub_…", "trang_thai": "PUBLISH_COMPLETE", "privacy": "PUBLIC_TO_EVERYONE", "post_id": [73…]}
```

- Lỗi → mã thoát 1, câu tiếng Việt ở stderr (hoặc trường `loi` nếu TikTok xử lý ảnh thất bại).
- Quá 3 phút vẫn đang xử lý → trường `ghi_chu`; xem lại trong app TikTok.
- `--rieng-tu`: luôn đăng ở chế độ riêng tư (dùng cho lần chạy thử).

## Chế độ hiển thị (riêng tư → công khai)
- Công cụ đăng **công khai** (`PUBLIC_TO_EVERYONE`) nếu tài khoản cho phép, không thì **riêng tư** (`SELF_ONLY`).
- Khi app **chưa được TikTok duyệt (audit)**, mọi bài qua API chỉ ở chế độ riêng tư. Công cụ tự thử lại ở chế độ riêng tư và ghi chú trong kết quả.
- Đổi sang công khai: mở app TikTok → Hồ sơ → chọn bài (biểu tượng khoá) → `…` → *Cài đặt quyền riêng tư* → *Ai có thể xem bài đăng này* → **Mọi người**.

## Lỗi thường gặp
| Thông báo | Làm gì |
| --- | --- |
| cần kết nối lại | Làm lại mục "Kết nối tài khoản" |
| Ảnh sai kích thước | Thu ảnh về JPG, cạnh dài ≤ 1080px |
| Địa chỉ ảnh chưa được xác minh | Kiểm tra URL prefix trong app TikTok (URL properties) |
| hạn mức số bài đăng trong ngày | Chờ ngày mai |
| Gọi TikTok quá nhanh | Chờ 1 phút |
| Không kết nối được TikTok | Kiểm tra mạng của Claude đã mở `open.tiktokapis.com` |

## Kiểm thử
`python3 tests/tiktok.test.py` chạy với API TikTok giả lập trên máy (không cần mạng, không cần khoá thật), gồm cả các nhánh lỗi.

# Kiến thức làm mẹ

Web tiếng Việt về chăm sóc sức khoẻ bé, từ lúc chuẩn bị sinh đến 6 tuổi. Web tĩnh dựng từ Google Sheets, chạy trên Cloudflare Pages, dùng được như app (PWA).

- **Sửa nội dung:** trong Google Sheets, xem [data/README.md](data/README.md).
- **Đặc tả:** [ops/DAC-TA.md](ops/DAC-TA.md) · **Bộ máy vận hành:** [ops/BO-MAY.md](ops/BO-MAY.md)
- **Quy tắc cho Claude:** [CLAUDE.md](CLAUDE.md)

## Chạy trên máy
```
node scripts/build.mjs --sample
python3 -m http.server 8080 -d dist
```
Mở http://localhost:8080.

## Deploy lên Cloudflare Pages
Workers & Pages → Create → Pages → Connect to Git → chọn repo này.
- Build command: `node scripts/build.mjs`
- Build output directory: `dist`
- Environment variable: `SHEET_ID` (khi đã có Google Sheet), `NODE_VERSION` = `22`

Để web tự cập nhật nội dung mỗi sáng: Cloudflare Pages → Settings → Builds → **Deploy hooks** → tạo hook, rồi thêm URL vào GitHub repo → Settings → Secrets → Actions → `CF_DEPLOY_HOOK`.

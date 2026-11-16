# Hôm Nay Nấu Gì

Web "hôm nay nấu gì?": gợi ý món và mâm cơm 3 món, công thức có video YouTube/Shorts hướng dẫn từng bước. Web tĩnh dựng từ Google Sheets, dùng được như app trên điện thoại (PWA).

- **Thêm, sửa món:** trong [Google Sheet công thức](https://docs.google.com/spreadsheets/d/1c1jpTB0ckqe3YuDkrl4UK6P48c6xv7pDZHFDpxCd--Q/edit), hướng dẫn ở [data/README.md](data/README.md)
- **Đặc tả:** [ops/DAC-TA.md](ops/DAC-TA.md) · **Bộ máy vận hành:** [ops/BO-MAY.md](ops/BO-MAY.md) · **Quy tắc cho Claude:** [CLAUDE.md](CLAUDE.md)

## Bản xem thử trên GitHub Pages
Bật một lần: repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**. Web nằm ở `https://<tài-khoản>.github.io/<tên-repo>/`, tự cập nhật khi `main` thay đổi và mỗi sáng. Đổi tên repo thì link đổi theo, không cần sửa code.

AdSense không duyệt tên miền `github.io`; khi chạy thật hãy gắn domain riêng.

## Chạy trên máy
```
node scripts/build.mjs --sample
python3 -m http.server 8080 -d dist
```

## Chạy thật trên Cloudflare Pages (khi có domain)
Workers & Pages → Create → Pages → Connect to Git → chọn repo. Build command `node scripts/build.mjs`, output `dist`, `NODE_VERSION=22` (ID Sheet đã có trong `sheet.json`). Ghi địa chỉ web vào `site_url` trong tab `settings`.

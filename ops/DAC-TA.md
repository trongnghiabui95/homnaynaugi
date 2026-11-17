# Đặc tả: Hôm Nay Nấu Gì (homnaynaugi)

## Mục tiêu
- Trả lời câu hỏi mỗi ngày "hôm nay nấu gì?": gợi ý 1 món hoặc mâm cơm 3 món, kèm công thức kiểu tạp chí ẩm thực và video YouTube/Shorts.
- Người dùng chính: người nấu cơm gia đình, dùng điện thoại, thường xem ngay trong bếp.
- Kiếm tiền: Google AdSense (cần domain riêng, ví dụ homnaynaugi.vn), sau là AdMob khi đóng gói app.
- Chi phí máy chủ 0đ: GitHub + GitHub Pages/Cloudflare Pages + Google Sheets + Google Drive (ảnh).

## Kiến trúc
Google Sheets → `scripts/build.mjs` (chỉ lấy món đã duyệt, đổi link Drive/YouTube, tra ảnh Wikimedia Commons kèm tác giả + giấy phép) → `dist/` HTML tĩnh + `data/recipes.json` → GitHub Pages (xem thử) / Cloudflare Pages (chạy thật). Không dùng Next.js để không cần máy chủ; web tĩnh tải nhanh tương đương.

## Giao diện
Giao diện **khối màu + clay** (#82) theo hồ sơ "Recipe & Cooking App" của ui-ux-pro-max, khung nút/tab từ thư viện Basecoat: nền kem `#FFF8EF`, cam đất tươi `#C2410C` (nút, link, khối khung quay), xanh lá `#047857` (Tủ lạnh, Dễ), vàng bơ (Bí quyết, nút trên khối màu), tiêu đề Nunito tròn đậm, nội dung Be Vietnam Pro, thẻ bo 24px bóng clay nhiều lớp, nút ấn lún và nảy. Độ khó là chấm màu (Dễ xanh, Vừa vàng đất `#A16207`, Khó cam). Đầu trang chủ có cụm 3 ảnh món tròn, các phần tử hiện lần lượt khi mở. Mâm cơm 3 món hiện thành 3 ô nằm ngang trong một khay.

## Trang
| Trang | Đường dẫn |
| --- | --- |
| Trang chủ: tìm món, chủ đề, **Quay món** (radio Món ăn / Đồ uống; món ăn: 1 món hoặc mâm cơm 3 món, không lẫn đồ uống; đồ uống: 1 ngăn chỉ quay danh mục `do-uong`; bộ lọc bữa, thời gian, nguyên liệu chính thu gọn trong "Bộ lọc"; khoá món; quay ~3 giây có tiếng tách, ting, "ta-da", tung bông giấy, nút loa bật/tắt), danh mục, sổ tay, món nhanh (hàng vuốt ngang), Tủ lạnh có gì, món mới (không lặp món nhanh) | `/` |
| **Thành quả của bạn đọc** (dưới mỗi công thức): người dùng chụp hoặc chọn ảnh món đã nấu, viết cảm nhận, nhập tên rồi gửi. Không đăng nhập, có Turnstile chống bot. Bài hiện ngay; 3 báo cáo thì tự ẩn. Quản trị tại `/quan-tri/`. Chỉ chạy trên Cloudflare Pages (D1); GitHub Pages tự ẩn. Bật theo `ops/BAT-THANH-QUA.md` | `/mon/<slug>/`, `/quan-tri/` |
| Danh mục (lọc độ khó, thời gian, calo; sắp xếp mới nhất / nấu nhanh nhất) | `/danh-muc/`, `/danh-muc/<slug>/` |
| Công thức. Phần **Cách làm** là dòng thời gian: tóm tắt số bước và thời gian chờ, nhãn thời gian ở bước phải chờ, tích số bước để đánh dấu xong (bước xong thu gọn), thanh tiến độ, nhớ theo món trên máy, nút "Làm lại từ đầu". **Chế độ nấu**: màn Chuẩn bị (nguyên liệu theo khẩu phần) → từng bước (nguyên liệu dùng ở bước kèm lượng, chữ quan trọng tô đậm, hẹn giờ tự động, xem đoạn video của bước, tiếp theo, đọc to, vuốt để chuyển) → màn Hoàn thành | `/mon/<slug>/`, tất cả: `/mon/` |
| Tìm món theo tên, chủ đề; **Tủ lạnh có gì** (chọn nguyên liệu, hiện "Đủ 2/2 nguyên liệu") | `/tim-kiem/` |
| Đi chợ, Sổ tay món ngon (dữ liệu trên máy) | `/di-cho/`, `/da-luu/` |
| Video | `/video/` |
| Giới thiệu, Liên hệ, Chính sách bảo mật, Điều khoản sử dụng, Bản quyền video | `/gioi-thieu/`, `/lien-he/`, `/chinh-sach-bao-mat/`, `/dieu-khoan/`, `/ban-quyen-video/` |
| Mọi trang trên bằng **tiếng Anh** (giao diện; nội dung món vẫn tiếng Việt tới khi có bản dịch) | `/en/…` cùng slug, ví dụ `/en/mon/<slug>/` |

## Ngôn ngữ (Tiếng Việt / English)
- Build dựng 2 bộ trang: `/` (tiếng Việt, đường dẫn cũ giữ nguyên) và `/en/` (tiếng Anh). Chữ giao diện lấy từ `scripts/i18n.mjs` (lúc build) và object `S` đầu `app.js`, `thanh-qua.js` (trên trình duyệt).
- Nút **EN / VI** ở đầu trang chuyển sang đúng trang tương ứng ở ngôn ngữ kia; lựa chọn lưu ở `hnng-prefs.lang`. Lần sau mở link của ngôn ngữ kia, web tự chuyển về ngôn ngữ đã chọn (trừ trang 404).
- Mỗi trang có `lang`, `<link rel="alternate" hreflang="vi|en|x-default">`, `og:locale` + `og:locale:alternate`; `sitemap.xml` có cả 2 ngôn ngữ kèm `xhtml:link` hreflang. `manifest.webmanifest` giữ tiếng Việt.
- Sổ tay, Đi chợ, kết quả quay món dùng chung giữa 2 ngôn ngữ (cùng IndexedDB).
- Trang công thức tiếng Anh: dùng cột bản dịch `*_en` trong Sheet (xem `data/README.md`). Món dịch đủ hiện tiếng Anh, `Recipe` ghi `inLanguage: "en"`; phần chưa dịch hiện tiếng Việt (trong phần tử `lang="vi"`) kèm dòng "This recipe is not translated yet."
- Câu giới thiệu trang chủ tiếng Anh: khoá `tagline_en` trong tab `settings`; để trống thì dùng câu mặc định trong `scripts/i18n.mjs`.

## SEO
- **Bản chính**: `https://homnaynaugi.pages.dev` (Cloudflare Pages). Mọi `canonical`, `hreflang`, `og:url`, `og:image`, sitemap dùng địa chỉ này (`SITE_URL` hoặc `site_url` trong tab `settings`). `robots.txt` cho phép tất cả và trỏ tới `sitemap.xml`.
- **Bản xem thử** GitHub Pages build với `PREVIEW=1` + `CANONICAL_URL=https://homnaynaugi.pages.dev`: mọi trang có `<meta name="robots" content="noindex">`, canonical/hreflang/sitemap trỏ về bản chính, `robots.txt` là `Disallow: /`. Link nội bộ vẫn chạy trong thư mục con (`BASE_PATH`).
- **Xác minh Search Console**: điền khoá `google_site_verification` trong tab `settings` (mã, hoặc dán nguyên thẻ `<meta name="google-site-verification" …>`). Build in thẻ ở trang chủ `/` và `/en/` của bản chính.
- **Mô tả trang món** (`meta description`) ≤ 160 ký tự: tóm tắt + thời gian + khẩu phần (+ "có video hướng dẫn"). Tóm tắt dài thì cắt ở ranh giới từ. Tóm tắt trống hoặc trùng món khác thì thêm tên món ở đầu cho khỏi trùng.
- **Dữ liệu có cấu trúc `Recipe`**: build tự kiểm tra `name`, `image`, `recipeIngredient`, `recipeInstructions`, `totalTime` và in CẢNH BÁO khi thiếu. `image` lấy từ cột `anh`, không có thì lấy ảnh bìa video. Món không có cả hai thì thiếu `image`: cần bổ sung ảnh hoặc video.
- **Gửi sitemap lên Search Console** (chủ dự án làm một lần):
  1. Vào https://search.google.com/search-console → *Thêm tài sản* → chọn **Tiền tố URL** → nhập `https://homnaynaugi.pages.dev/`. (Không chọn *Miền* vì pages.dev không sửa được DNS.)
  2. Chọn cách xác minh **Thẻ HTML**, chép mã trong `content="…"` (hoặc cả thẻ), dán vào tab `settings` dòng `google_site_verification`.
  3. Chờ bản chính build lại (Cloudflare Pages tự build khi `main` đổi, hoặc bấm *Retry deployment*). Mở trang chủ, xem nguồn trang và kiểm tra có thẻ `google-site-verification`, rồi bấm **Xác minh**.
  4. Vào *Sơ đồ trang web* → nhập `sitemap.xml` → *Gửi*. Sau vài ngày xem *Trang* và *Công thức nấu ăn* (kết quả nhiều định dạng) để biết lỗi.
  5. Không thêm bản GitHub Pages vào Search Console vì bản đó đã đặt noindex.

## Trang công thức
- Thông số: sơ chế, nấu, độ khó, calo/phần, chi phí ước tính (chỉ hiện khi có số liệu), khẩu phần.
- Chuyển giữa ảnh món và video (Shorts khung dọc); bấm "Xem đoạn mm:ss" ở bước để nhảy đúng giây.
- Nguyên liệu: nút −/+ và chọn nhanh 1/2/4/6 người; tích món cần mua → "Chép danh sách đi chợ" hoặc "Thêm vào Đi chợ".
- Từng bước có tiêu đề, ảnh minh hoạ, hẹn giờ. Tuỳ chọn: gom bước theo giai đoạn (`giai_doan`), dòng "Đạt khi" (`dau_hieu`), ghi chú "Lưu ý" (`luu_y`).
- Chế độ đang nấu: dải ảnh món + tên món ở đầu, thanh bước bấm để nhảy bước, thẻ nội dung có số bước lớn và chip giai đoạn, chữ to, đánh dấu bước xong, nút sáng/tối tại chỗ, giữ màn hình sáng; hiện "Đạt khi" và "Lưu ý" của bước.
- Bí quyết nấu ngon (hộp xanh thảo mộc), Ăn kèm hợp vị (3 món, tự gợi ý theo mâm cơm nếu Sheet không ghi).
- schema.org `Recipe` + `VideoObject` + `NutritionInformation`.

## Quảng cáo
Khung `adSlot()` có nhãn "Quảng cáo": dưới khung quay món, giữa Nguyên liệu và Cách làm, cuối bài. Chỉ hiện khi có mã AdSense trong tab settings.

## Lộ trình
1. **Chặng 1 – khung** (PR #2): toàn bộ trang và tính năng trên, 9 món mẫu.
2. **Chặng 2 – nội dung**: 30–50 món đầu tiên có video Shorts, ảnh món từ Drive.
3. **Chặng 3 – tăng trưởng**: clip TikTok dẫn về từng món, bài tổng hợp "thực đơn tuần".
4. **Chặng 4 – kiếm tiền**: domain riêng, Search Console, AdSense, app Android.

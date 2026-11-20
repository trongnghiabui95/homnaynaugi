---
version: alpha
name: Hôm Nay Nấu Gì
description: Web công thức nấu ăn tiếng Việt trên điện thoại, phong cách khối màu + clay (hồ sơ Recipe & Cooking App của ui-ux-pro-max), khung nút/tab từ Basecoat. Nền kem, cam đất tươi, xanh lá, vàng bơ, tiêu đề Nunito tròn đậm, bóng clay, nút ấn lún và nảy.
colors:
  # Hồ sơ "Recipe & Cooking App" (ui-ux-pro-max): khối màu + clay, tông đồ ăn ấm. Tên trong CSS: token shadcn cho Basecoat
  primary: "#C2410C"          # cam đất tươi: nút chính, link, vòng focus, khối khung quay (--khoi)
  on-primary: "#FFFFFF"
  primary-soft: "#FFECE0"     # khối cam nhạt (ô danh mục, thông số) — primary trên nền này 4.5:1
  secondary: "#FDEBDC"        # nút phụ, link "Tất cả", số bước
  on-secondary: "#7C2D12"
  accent: "#F97316"           # CHỈ trang trí
  herb: "#047857"             # xanh lá: Tủ lạnh (--khoi-xanh), độ khó Dễ, tag
  herb-soft: "#D9F2E6"
  bo-soft: "#FEF0C7"          # vàng bơ nhạt: Bí quyết, chữ nhấn tiêu đề, ô danh mục thứ 3
  bo-button: "#FDE68A"        # nút bơ trên khối màu (chữ #2B1D16), cố định cả sáng và đêm
  neutral: "#FFF8EF"          # nền kem
  surface: "#FFFFFF"
  surface-2: "#F8ECE0"
  on-surface: "#2B1D16"
  muted: "#6B5A50"            # chữ phụ (≥ 5.6:1 trên mọi nền nhạt ở trên)
  line: "#F0DFD0"
  level-easy: "#047857"
  level-medium: "#A16207"
  level-hard: "#C2410C"
  dark-neutral: "#1A1210"
  dark-surface: "#261B17"
  dark-surface-2: "#33251F"
  dark-on-surface: "#FBEFE6"
  dark-muted: "#D0BCAE"
  dark-line: "#3D2C24"
  dark-primary: "#FB923C"
  dark-on-primary: "#2A1208"
  dark-khoi: "#7C2D12"        # khối khung quay ban đêm (chữ trắng)
  dark-khoi-xanh: "#065F46"
  dark-herb: "#6EE7B7"
typography:
  headline-lg:
    fontFamily: Nunito
    fontSize: 2.1em
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Nunito
    fontSize: 1.5em
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 1em
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.6
  body-lg-big-mode:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.6
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 0.85em
    fontWeight: 600
    lineHeight: 1.3
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: 10px
  md: 14px
  lg: 24px                    # thẻ (--r-card); nút 16px, nút lớn 20px, chip/ô tìm/radio tròn hẳn
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  gutter: 18px
  max-width: 1040px
  touch: 44px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: 44px
    typography: "{typography.label-md}"
  button-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-on-primary}"
  button-ghost:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    height: 44px
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    height: 44px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 20px
  recipe-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  recipe-card-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-on-surface}"
  tip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
  page-dark:
    backgroundColor: "{colors.dark-neutral}"
    textColor: "{colors.dark-on-surface}"
  muted-text:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted}"
  muted-text-dark:
    backgroundColor: "{colors.dark-neutral}"
    textColor: "{colors.dark-muted}"
  herb-button:
    backgroundColor: "{colors.herb}"
    textColor: "{colors.on-primary}"
  herb-text-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-herb}"
  surface-alt:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.on-surface}"
  surface-alt-dark:
    backgroundColor: "{colors.dark-surface-2}"
    textColor: "{colors.dark-on-surface}"
  divider:
    backgroundColor: "{colors.line}"
  divider-dark:
    backgroundColor: "{colors.dark-line}"
  accent-mark:
    backgroundColor: "{colors.accent}"
  level-badge-easy:
    textColor: "{colors.level-easy}"
    backgroundColor: "{colors.surface}"
  level-badge-medium:
    textColor: "{colors.level-medium}"
    backgroundColor: "{colors.surface}"
  level-badge-hard:
    textColor: "{colors.level-hard}"
    backgroundColor: "{colors.surface}"
---

# Hôm Nay Nấu Gì — hệ thống thiết kế

File này mô tả giao diện cho mọi AI agent (Claude Code, Codex…) và người làm web. Phần token ở đầu file là giá trị chuẩn; phần chữ bên dưới giải thích **khi nào và vì sao** dùng. Giá trị thật nằm ở `:root` trong `src/assets/style.css`; hai nơi phải khớp nhau. Định dạng theo [google-labs-code/design.md](https://github.com/google-labs-code/design.md).

**Đọc file này trước khi sửa bất cứ thứ gì nhìn thấy được.** Sau khi sửa, chạy mục [Kiểm tra giao diện](#kiểm-tra-giao-diện).

## Overview

Hình mẫu: **một cuốn sổ công thức của gia đình được in đẹp như tạp chí**, mở trên bàn bếp. Người đọc đứng cạnh bếp, tay ướt, nhìn điện thoại từ xa nửa mét. Họ cần biết nhanh: nấu gì, mất bao lâu, cần mua gì, bước tiếp theo là gì.

Đặc điểm nhận diện:
- **Thư viện: Basecoat 1.1.0** (MIT, shadcn/ui cho HTML thuần, https://basecoat.ui). Chỉ lấy một phần vào `src/assets/basecoat.css` (nút, thẻ, tab và token) bằng `scripts/basecoat-tach.py`, vì bản đủ 237 KB. Biến thể đổi sang lớp sẵn có: `.btn` = primary, `.btn.ghost` = secondary, `.btn.outline`, `.btn.plain` = ghost, `.btn.big` = lg, `.seg` = tablist. Không sửa tay `basecoat.css`; muốn đổi thì ghi đè trong `style.css` (không nằm trong `@layer` nên luôn thắng).
- **Phong cách: khối màu + clay** theo hồ sơ "Recipe & Cooking App" của ui-ux-pro-max (products/ui-reasoning/colors.csv #97): Claymorphism + Vibrant & Block-based, tông terracotta/sage/kem, chữ tròn thân thiện, bóng nhiều lớp, nảy kiểu lò xo, ấn mềm 200ms. **Điều cấm của hồ sơ: màu nhạt, thiếu năng lượng** (vì vậy bỏ kiểu shadcn trung tính của #79).
- Chữ: tiêu đề **Nunito 800/900** (tròn, đậm, có tiếng Việt); nội dung Be Vietnam Pro.
- Màu: cam đất tươi (nút, link, khối khung quay), xanh lá (Tủ lạnh, Dễ, tag), vàng bơ (Bí quyết, nút trên khối màu, chữ nhấn tiêu đề). Khối màu đậm luôn chữ trắng; khối nhạt luôn chữ `on-surface`.
- Ảnh món thật là nhân vật chính. Khi chưa có ảnh: khung nền phẳng ghi tên món bằng chữ đậm màu `muted`, không emoji, không hình minh hoạ giả.
- Một màu nhấn cam đất. Màn hình phải 90–95% là màu trung tính; màu nhấn dưới 5% diện tích.
- Chuyển động hiếm và ngắn. "Khoảnh khắc vui" duy nhất là vòng quay món.

Trang công thức là trang **để đọc**: ưu tiên rõ ràng, chính xác và tiết chế hơn gây ấn tượng. Trang chủ được phép sinh động hơn một chút ở khung quay món.

Bộ ba "nền kem + serif + cam đất" bị nhiều bộ kiểm tra coi là giao diện AI mặc định. Ở đây nó là lựa chọn có chủ đích của dự án nên được giữ, nhưng **không được cộng thêm** các dấu hiệu rập khuôn khác (xem Do's and Don'ts).

## Colors

- `{colors.primary}` cho mọi chữ có màu, link, nút chính, vòng focus. Đây là bản đậm của màu nhấn để chữ đạt 4.5:1.
- `{colors.accent}` chỉ để trang trí: viền mảnh, chấm, viền trên của khung quay. Không bao giờ dùng cho chữ hay nền chứa chữ.
- `{colors.herb}` cho thông tin "tích cực, nhẹ nhàng": mẹo nấu, Tủ lạnh có gì, độ khó Dễ.
- Ba màu độ khó (`level-*`) luôn đi kèm chữ "Dễ / Vừa / Khó". Không truyền thông tin chỉ bằng màu.
- Chữ phụ dùng `{colors.muted}`. Không đặt chữ xám lên nền có màu: trên nền `herb-soft` hay `primary-soft` dùng chữ `on-surface` hoặc chữ đậm cùng sắc.
- Mọi màu phải là biến CSS trên `:root`. Không viết hex hay rgba trực tiếp trong quy tắc thành phần (ngoại lệ: lớp phủ đen mờ trên ảnh, có ghi chú).
- Chế độ đêm (`dark-*`) là **mặc định** khi mở web lần đầu (`<html data-theme="dark">` dựng sẵn, không theo cài đặt máy); người dùng bấm nút để chuyển sáng, lựa chọn lưu ở `hnng-prefs`. Nền tối ấm, các tầng nổi sáng dần lên, **tắt bóng đổ**, màu nhấn nhạt và bớt bão hoà để đạt tương phản. Mỗi màu sáng phải có bản đêm tương ứng.

## Typography

- Chữ thân 17px, giãn dòng 1.6. Chế độ chữ lớn (`data-big`) nâng lên 20px; mọi cỡ khác dùng `em` để tự lớn theo.
- Thang chữ: h1 2.1em (trang chủ 2.6em; trang món 2.2em), h2 1.5em, cả hai Nunito 900; h3 1em đậm sans, thân 1em, nhãn 0.85em, chữ nhỏ nhất 13px. Không thêm cỡ mới; mỗi loại phần tử chỉ một cỡ trên toàn web.
- Chỉ một `h1` mỗi trang; tiêu đề không nhảy cấp.
- Đoạn văn dài tối đa ~65 ký tự mỗi dòng (`max-width: 65ch`).
- Tiêu đề dùng `text-wrap: balance`, đoạn văn `text-wrap: pretty`. Tên món dài phải xuống dòng gọn, không tràn khung (`overflow-wrap: anywhere` trên thẻ).
- Số thay đổi được (phút, khẩu phần, định lượng, đồng hồ hẹn giờ) dùng `font-variant-numeric: tabular-nums`. Không để số tách dòng khỏi đơn vị.
- Không dùng nhãn chữ IN HOA giãn chữ cho chữ nhỏ. Nhãn viết thường như câu, đậm hơn hoặc màu phụ.
- Văn bản: tiếng Việt có dấu, câu ngắn, xưng "bạn" (bản `/en/`: tiếng Anh câu ngắn, xưng "you"; menu đổi ngôn ngữ ở đầu trang là `<details class="lang-menu">`: nút `summary.icon-btn` 44×44px ghi mã ngôn ngữ hiện tại (VI/EN/JA/KO/FR) chữ 15px đậm, mở ra thẻ nổi bo 18px với 5 link 44px (tên ngôn ngữ viết bằng chính ngôn ngữ đó, mục hiện tại nền `secondary`) đậm). Không từ rỗng ("tuyệt vời", "hoàn hảo", "đỉnh cao"), không câu hỏi rồi tự trả lời, không bịa số liệu.

## Layout

- Ưu tiên điện thoại 360–390px, rồi mới mở rộng. Khung nội dung tối đa `{spacing.max-width}`, lề hai bên `{spacing.gutter}`.
- Khoảng cách lấy từ thang `4 / 8 / 12 / 16 / 24 / 32 / 48px`. Không dùng số lẻ tuỳ hứng.
- Khoảng trên tiêu đề khối ≥ 2 lần khoảng dưới, để tiêu đề "thuộc về" nội dung nó dẫn.
- Chữ trong hộp có nền hoặc viền cách mép ≥ 8px; chữ thân cách mép màn hình ≥ 16px.
- Không cuộn ngang ở bất kỳ độ rộng 320–1920px nào. Hàng vuốt ngang (danh mục, Nhanh gọn, video) là ngoại lệ có chủ đích, nằm trong khung riêng.
- Thanh tab dưới cố định: nội dung phải chừa đệm dưới, tính cả `safe-area-inset-bottom`.
- Lưới thẻ: 2 cột trên điện thoại, 3 cột từ 700px, 4 cột từ 1000px. Ô lưới dùng `minmax(0, 1fr)`.
- Quảng cáo chỉ qua `adSlot()` ở 3 vị trí đã định (CLAUDE.md), cách nội dung ≥ 16px, có nhãn "Quảng cáo". Không đặt hiệu ứng gần quảng cáo.

## Elevation & Depth

- Chỉ hai tầng: trang (`neutral`) và thẻ (`surface`). `surface-2` là nền phụ bên trong thẻ hoặc khung chờ ảnh, không phải tầng thứ ba.
- Bóng clay `--shadow` (4 lớp: viền sáng trong ở trên, gờ tối trong ở dưới, bóng đổ ấm, bóng gần) cho thẻ, chip, ô tìm, radio, tab đang chọn. Nút: gờ tối trong 4px + bóng màu. Đêm: chỉ viền sáng mờ + bóng đen.
- Chế độ đêm: không bóng; phân tầng bằng màu nền sáng dần.
- Không lồng thẻ trong thẻ (ngoại lệ: ngăn món trắng trong khối khung quay). Không kính mờ, quầng sáng, gradient trang trí.
- Không viền 1px cho thẻ: thẻ tách nền bằng bóng clay.
- Chuyển trang: `@view-transition { navigation: auto; }` (trình duyệt tự làm mờ dần, không cần thư viện; trình duyệt chưa hỗ trợ thì chuyển trang như thường).

## Shapes

- Bo góc theo thang: `sm` 10px (ô nhỏ, ảnh bước), `md` 14px (ô chọn, seg), `lg` 22px (thẻ, khung lớn), `full` (nút, chip, ô tìm, thanh tab, ảnh danh mục, "đĩa").
- Ảnh trong thẻ món vuông 1:1, lồng trong thẻ cách mép 6px, bo 17px; ảnh trang món 16:10. Ảnh món `object-fit: cover`, luôn có `width`/`height` hoặc `aspect-ratio` để không nhảy bố cục.
- Icon: SVG cùng một bộ nét (`icon()` trong `templates.mjs`), cùng độ dày nét. Không dùng emoji làm icon tính năng.

## Components

- **Nút chính** (`.btn`, Basecoat primary): tô đầy `primary`, chữ trắng 700, bo 16px (`.big` 20px, cao ≥ 54px), gờ tối dưới 4px. Ấn: lún 2px + thu 97% (`--nay` = `cubic-bezier(.34,1.56,.64,1)`, 200ms). Rê chuột: đậm lên 12%. Phải đặt lại màu chữ trong `style.css` vì `button { color: inherit }` ngoài `@layer` thắng Basecoat.
- **Nút phụ** (`.btn.ghost`): nền `secondary`, chữ `on-secondary`. **Nút bơ** (trong khung quay, Tủ lạnh): nền `bo-button`, chữ `#2B1D16`, cố định cả sáng và đêm.
- **Chip** (`.chip`): bo `full`, cao ≥ 44px; `aria-pressed` cho chip bật/tắt.
- **Seg / radio**: nhóm lựa chọn loại trừ dùng `role="radiogroup"` hoặc `<input type=radio>` thật; ô được chọn có viền `primary` (radio Món ăn / Đồ uống là viên thuốc nền `surface`); seg trong khung quay: ô chọn nền `on-surface`, chữ `neutral`. Vùng bấm là cả nhãn.
- **Thẻ món** (`recipeCard()`): thẻ trắng bo 24px, bóng clay, ảnh 4:3 lồng cách mép 8px bo 18px, danh mục 700 màu `on-secondary`, tên Nunito 800. Rê chuột: nhấc 4px, nghiêng .4°, nảy.
- **Đầu trang chủ**: h1 Nunito 900 2.6em, chữ cuối màu `primary` trên nền `bo-soft` bo góc; cụm 3 "đĩa" (ảnh tròn 66px, 104px từ 700px, viền 4px trắng). Khi mở trang: các phần tử hiện lần lượt cách 50ms (nảy, 600ms), tắt khi `prefers-reduced-motion`.
- **Ô danh mục**: khối màu xen kẽ `primary-soft` / `herb-soft` / `bo-soft`, bóng clay, ảnh tròn 84px viền 4px trắng, tên Nunito 800.
- **Tiêu đề mục** (`.sec-head`): h2 Nunito 900 1.5em bên trái, link "Tất cả" là viên thuốc nền `secondary` chữ `on-secondary`.
- **Thanh tab dưới**: nổi, cách mép 8px, bo 26px, bóng clay + bóng lớn; icon tab đang chọn là viên thuốc `primary` icon trắng.
- **Khung quay món**: **khối màu `khoi`** (cam đậm, đêm `dark-khoi`) chữ trắng, tiêu đề 1.7em; radio Món ăn / Đồ uống là viên thuốc trắng (chọn: viền 3px bơ); tab nền trắng 16% (tab chọn nền sáng); nút Quay là nút bơ; khay ngăn nền đen 14%, ngăn món là thẻ trắng.
- **Ngăn 1 món / đồ uống** (`.slot.single`): dải thẻ ảnh nằm ngang cao 108px, hai mép mờ bằng `mask-image` (che bớt, không phải gradient trang trí), tam giác chỉ ở giữa phía trên. Khi quay: dải trượt ngang bằng `transform` và có vạch dọc 2px `primary` ở giữa. Khi dừng: vạch ẩn, thẻ giữa rõ và có viền `primary`, thẻ hai bên mờ 55%. Dưới dải: nhãn, tên món, thời gian và độ khó, rồi hàng "Cách nấu" | "Giữ".
- **Mẹo / Bí quyết** (`.tip`): khối `bo-soft`, bóng clay, tiêu đề `on-secondary`. **Tủ lạnh có gì**: khối `khoi-xanh` chữ trắng, nút bơ. **Thông số trang món**: 4 ô màu (cam, xanh, bơ, secondary) số Nunito 900.
- **Ô nhập**: nhãn hiển thị phía trên, không lấy placeholder làm nhãn; viền không đổi độ dày giữa các trạng thái; lỗi nằm ngay dưới ô, gắn `aria-describedby`.
- **Trạng thái** của mọi thành phần tương tác: mặc định, hover (chỉ chuột), focus (`:focus-visible`, viền 3px `primary`, hiện ngay), nhấn (`:active` thu nhẹ), tắt (`disabled` thật + mờ + `cursor: not-allowed`), đang tải (spinner chỉ trong nút).
- **Trạng thái rỗng** (`emptyState()`): nói cái gì đang trống, vì sao nó có ích, và một hành động. Ví dụ: "Sổ tay còn trống. Bấm Lưu ở món bạn thích để xem lại nhanh. [Quay món hôm nay]".
- **Lỗi**: nói chuyện gì xảy ra, cách khắc phục, có nút thử lại. Mất mạng thì báo đang ngoại tuyến.
- **Thành quả của bạn đọc** (`thanh-qua.css`, chỉ tải trên trang món): nút chính "Khoe món bạn nấu" có icon máy ảnh; lưới thẻ 2 cột (3 cột từ 700px), ảnh 4:3 trên, tên + thời gian + cảm nhận dưới; "Báo cáo" là nút chữ phụ, vùng bấm 44px. Hộp gửi là `<dialog>`: ô ảnh lớn khung đứt nét, cảm nhận, tên (máy nhớ), một nút Gửi. Chỉ một ô bắt buộc là tên.
- **Logo yendan** (thương hiệu chủ quản, #88): theo tên bé **Yên Đan, biệt danh Cherry** (không liên quan chim yến). Chữ "yendan" Nunito 900 đã chuyển thành nét; **bụng chữ d là quả cherry** đỏ `#D21F3C` có đốm sáng, thân chữ d là cuống nâu, lá xanh ở đỉnh. Chữ màu đỏ ngọc hồng lựu `#7A1530` (đá tháng 1, tháng sinh của bé), ban đêm `#FFE9EE`. Cao 32px ở chân trang ("Một sản phẩm của yendan"). SVG nội tuyến (`YENDAN` trong `templates.mjs`), chữ `currentColor`, có `<title>`. Không ghi ngày sinh trong logo. Header chỉ dùng logo "Hôm Nay Nấu Gì". Bản màu cố định: `src/assets/yendan.svg`; `ops/logo/`: nền sáng, nền tối, con dấu cánh cẩm chướng, huy hiệu YĐ (cho avatar), ảnh các phương án.
- **Các bước nấu** (`recipe.css`): dòng thời gian dọc, không viền hộp. Số bước là ô tích (vùng bấm 44px); đường mảnh 2px màu `line` nối các số.
  - Đầu khối: dòng tóm tắt "6 bước · 3 bước cần chờ · chờ lâu nhất 45 phút" (tính từ `hen_gio_phut`), thanh tiến độ "2/6 bước", nút "Làm lại từ đầu".
  - Bước phải chờ có nhãn đồng hồ + số phút cạnh tiêu đề.
  - Bước đang làm (bước đầu chưa xong): số nền `primary`; bước khác chữ `muted`; bước xong: số nền `herb` có dấu tích, thu gọn còn tiêu đề.
  - Tiến độ lưu theo món trên máy. Ảnh bước trên màn rộng là ảnh nhỏ bên phải, bấm để phóng to.
- **Chế độ nấu** (`cook.css`, chỉ tải khi mở): màn **Chuẩn bị** (nguyên liệu theo khẩu phần, tích khi đã sẵn) → từng bước → màn **Hoàn thành** (tung bông, Khoe món, Lưu sổ tay).
  - Mỗi bước: chữ to; thời gian, nhiệt độ, mức lửa, kích cỡ tô đậm màu `primary`; khối "Dùng ở bước này" là các chip nền `surface-2` (tên đậm + lượng màu `primary`), chỉ hiện nguyên liệu dò được, không đoán; nút hẹn giờ cho mọi "N phút" trong câu; "Xem đoạn này" khi bước có `giay_video`; dòng "Tiếp theo: …".
  - Nút loa ở góc trên: đọc to từng bước bằng giọng có sẵn trên máy, nhớ lựa chọn. Vuốt trái/phải để chuyển bước.
  - **Dải đầu**: ảnh món (ảnh bìa, không có thì ảnh bìa video) tràn ngang, lớp che phẳng `rgb(20 16 12 / .6)` (không gradient) để chữ trắng đủ tương phản; tên món đậm + vị trí bước; nút sáng/tối, loa, thoát màu trắng. Màn Chuẩn bị, Hoàn thành ảnh cao 34vh; màn bước cao 132px. Món không có ảnh: dải nền `surface`, chữ thường.
  - **Thanh bước**: mỗi đoạn là một nút ≥ 44×44px (nhiều bước thì cuộn ngang) (Chuẩn bị + từng bước), vạch 6px: xong `herb`, đang làm `primary` (dày hơn bằng `scaleY`), còn lại `line`. Bấm để nhảy bước (không tự đánh dấu xong).
  - **Thẻ nội dung**: nền `surface`, viền `line`, bo `lg`. Số bước 3em đậm màu `primary`; giai đoạn (cột `giai_doan`) là chip `herb-soft`/`herb` cạnh số.
  - Nút sáng/tối có cả trong chế độ nấu (bếp sáng thì đọc nền sáng dễ hơn).
- **Chế độ nấu, ảnh bước**: chữ hướng dẫn là chính; ảnh bước là khung 4:3 nhỏ (cao ≤ 190px và ≤ 22% màn hình), canh trái.
- **Ghi nguồn**: dưới ảnh không tự chụp luôn có một dòng nhỏ 13px màu `muted` "Nguồn: tác giả, giấy phép", cả dòng là link tới trang ảnh, quá dài thì cắt "…" (không bỏ tên tác giả: CC BY/BY-SA bắt buộc); dưới video luôn có tên kênh ("Video: kênh X"), không có link ra YouTube (#86).

## Do's and Don'ts

Nên:
- Dùng token và thang có sẵn; thiếu thì thêm token trước, rồi mới dùng.
- Thử với dữ liệu xấu nhất: tên món rất dài, 0 hoặc 1 món, ảnh hỏng link, khung 320px, chữ lớn, chế độ đêm.
- Giữ nội dung đọc được khi JS lỗi: không ẩn nội dung bằng `opacity: 0` chờ script.
- Mỗi PR giao diện kèm ảnh chụp 390px sáng và tối.

Không được (đây là các dấu hiệu "giao diện AI rập khuôn" mà các bộ kiểm tra bắt):
- Dòng chữ nhỏ IN HOA giãn chữ đặt trên tiêu đề (eyebrow/kicker).
- Sọc màu dày (> 1px) ở cạnh trái thẻ, ghi chú hay tiêu đề.
- Nền sọc lặp hoặc hoạ tiết trang trí không mang thông tin.
- Gradient tím xanh, chữ gradient, quầng sáng, kính mờ, bóng cứng không mờ. Màu nhạt toàn trang, thiếu năng lượng (điều cấm của hồ sơ Recipe & Cooking App).
- Lưới ô bằng nhau "icon trong ô vuông + tiêu đề + mô tả"; dải 3–4 con số lớn kèm nhãn nhỏ.
- Emoji làm icon; chữ nghiêng tô điểm một từ trong tiêu đề.
- Nối mọi thông tin bằng dấu "·" hoặc gắn "→" vào nhãn nút cho có vẻ hiện đại.
- Toast ăn mừng cho việc người dùng đã tự thấy; thông báo "đã lưu" khi không có thao tác thật.
- Thêm thư viện (React, GSAP, motion, Lenis, Three.js…) hay font mới khi chủ dự án chưa đồng ý.

## Motion

```yaml
motion:
  ease-out: cubic-bezier(0.23, 1, 0.32, 1)      # phần tử vào/ra
  ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)  # di chuyển giữa hai chỗ trên màn
  duration-press: 120ms                          # phản hồi khi nhấn
  duration-state: 200ms                          # đổi trạng thái, hover
  duration-enter: 280ms                          # phần tử hiện ra
  duration-overlay: 320ms                        # mở lớp phủ, chế độ nấu
  stagger: 40ms                                  # tổng trễ tối đa 300ms
```

- Trước khi thêm chuyển động, hỏi: thao tác này lặp bao nhiêu lần mỗi ngày? Lặp nhiều (tick nguyên liệu, lọc, chuyển tab) thì gần như không động. Thỉnh thoảng (mở chế độ nấu, toast) thì động nhẹ. Hiếm (kết quả quay món) mới được vui.
- **Quay món** là khoảnh khắc vui duy nhất, được phép dài và có âm thanh:
  - Món lẻ quay khoảng 4,5 giây. Mâm cơm 3 ngăn dừng lần lượt sau khoảng 3 / 4 / 5 giây. Tên món dưới ngăn đổi nhanh lúc đầu, thưa dần khi dải ảnh chậm lại.
  - Đường cong `cubic-bezier(.15,.85,.15,1)`, trùng hằng `EASE` trong `app.js`.
  - Âm thanh tự tạo bằng Web Audio, không tải file: tiếng "tách" khớp từng ảnh lướt qua vạch, "ting" khi mỗi ngăn dừng, "ta-da" khi chốt món. Có nút loa bật/tắt, máy nhớ lựa chọn.
  - Tung 90 mảnh bông giấy màu token, chạy 1,2–1,7 giây, mỗi lượt quay một lần rồi tự xoá.
  - Bật giảm chuyển động: không cuộn, không bông, chỉ hiện kết quả kèm "ta-da".
- Chỉ animate `transform` và `opacity`. Không `transition: all`, không animate `width/height/top/left/filter` trên nhiều phần tử.
- Dùng ease-out cho phần tử vào/ra; không dùng `ease-in` cho giao diện. Không nảy, không vượt đích, trừ khoảnh khắc ngăn quay "rơi" vào món.
- Ưu tiên `transition` (ngắt được giữa chừng) hơn `@keyframes`; điều khiển bằng JS thì dùng `element.animate()`.
- Phản hồi khi nhấn: `:active { transform: scale(0.97) }`. Không bao giờ bắt đầu từ `scale(0)`.
- Không làm thẻ hiện dần khi cuộn, không ghim khi cuộn, không cuộn mượt giả, không hiệu ứng theo con trỏ.
- `prefers-reduced-motion`: bỏ dịch chuyển và phóng to, **giữ** đổi màu/độ mờ ngắn để người dùng vẫn thấy trạng thái thay đổi. Vòng quay hiện kết quả ngay.
- Thứ gì chuyển động quá 5 giây phải dừng được; không nhấp nháy quá 3 lần mỗi giây.

## Kiểm tra giao diện

Chạy sau mỗi thay đổi nhìn thấy được. Cổng **Floor** sai là chưa được mở PR; **Reflex** sai thì sửa hoặc ghi lý do trong PR; **Finish** soi bằng mắt.

Ma trận: độ rộng 320, 390, 768, 1280 · chế độ sáng, đêm (`data-theme="dark"`), chữ lớn (`data-big`) · trang chủ, danh mục, trang món, sổ tay rỗng, đi chợ rỗng, tìm không có kết quả.

**Floor**
1. Không cuộn ngang: `document.documentElement.scrollWidth <= innerWidth`.
2. Vùng bấm ≥ 44×44px cho mọi `a, button, select, input` (trừ link trong đoạn văn). Đã có trong `tests/e2e.py`.
3. Tương phản chữ ≥ 4.5:1 (chữ ≥ 24px hoặc đậm ≥ 18.66px: ≥ 3:1), ở cả sáng và đêm (đêm là mặc định; bật sáng bằng `localStorage` `hnng-prefs` = `{"theme":"light"}`). Vòng focus và viền ô nhập ≥ 3:1. Chữ đặt trên lớp nền trong suốt đè lên ảnh (nhãn Video) phải tính màu nền sau khi trộn, đừng tin kết quả quét tự động.
4. Nhấn Tab: mọi phần tử nhận focus đều thấy rõ vòng focus.
5. Cỡ chữ tính toán ≥ 13px (riêng nhãn "Quảng cáo" ≥ 11px); chữ thân ≥ 17px, ≥ 20px khi bật chữ lớn.
6. Ảnh có `alt`, có kích thước giữ chỗ; ảnh hỏng thì tự ẩn.
7. Đúng một `h1`, tiêu đề không nhảy cấp.
8. Giả lập reduced-motion: bấm quay vẫn ra kết quả, không còn chuyển động dịch chuyển.
9. Tắt JS: trang món vẫn đọc được tên món, nguyên liệu, các bước.
10. Quảng cáo đúng vị trí, có nhãn, cách nội dung ≥ 16px.
11. Ngân sách: **mỗi trang** tải CSS < 35 KB (tính cả `cook.css` khi mở chế độ nấu; nâng từ 30 KB khi dùng Basecoat, #79), JS < 100 KB. CSS chia theo trang: `basecoat.css` + `style.css` (mọi trang) + `home.css` (trang chủ), `recipe.css` + `thanh-qua.css` + `cook.css` (trang món), `list.css` (danh mục), `video.css`, `shop.css`. Thành phần chỉ vài trang dùng (ô danh mục) đặt ở CSS của các trang đó, không ở `style.css`. Đo bằng `wc -c dist/assets/*.css dist/assets/*.js` (CSS đã nén lúc build) rồi cộng theo trang.
12. `tests/e2e.py`: mọi dòng `OK`, `errors: []`.

**Reflex** (dò nhanh trong `style.css`)
- `transition: all`; transition `width|height|top|left`.
- `text-transform: uppercase` trên chữ ≤ 15px.
- `border-left` dày hơn 1px.
- `repeating-linear-gradient`.
- Hex/rgba nằm ngoài khối `:root`.
- `:hover` không nằm trong `@media (hover: hover)`.
- Nhãn nút xuống dòng ở 320px; đoạn văn rộng hơn 75ch.

**Finish**
- Chụp 390px sáng và đêm (`deviceScaleFactor` 2), so với ảnh trước trong `ops/anh/`.
- Phép thử nheo mắt: vẫn nhận ra phần chính, phần phụ, các nhóm.
- Chấm 5 mặt, mỗi mặt 0–4: Truy cập · Hiệu năng · Token và chế độ đêm · Responsive · Nhất quán hệ thống. Ghi tổng /20 và lỗi P0–P3 vào mô tả PR. Mục tiêu ≥ 16/20, không còn P0/P1.

## Known Gaps

Những chỗ hiện tại còn lệch hệ thống này (đo ngày 2026-11-17). Sửa dần, mỗi PR một nhóm:

1. `.kicker` (tên danh mục trên tên món) là chữ IN HOA giãn chữ (màu đã sửa sang `primary`): đổi thành link chữ thường. Tương tự `.slot-label`, `.rcard-meta b`, `.ing-box h3`, `.ad-label`, chữ nút quay.
2. `.sec-head h2` có sọc trái 4px, `.tip` có sọc trái 5px: bỏ sọc, dùng khoảng trắng và cỡ chữ để phân cấp.
3. `.rcard:hover img` phóng to ảnh, `.cat-card:hover` chưa bọc `@media (hover: hover)`.
4. `@media (prefers-reduced-motion)` đang tắt sạch mọi transition: giữ lại chuyển màu/độ mờ ngắn.
5. (Đã sửa) `.cook-bar` bỏ hẳn, thay bằng thanh bước bấm được `.cook-dots`.
6. Khung ảnh chờ `.rcard-img` dùng sọc chéo lặp: đổi thành nền phẳng `surface-2`.
7. Các nút chưa có phản hồi `:active`.
8. Bo góc đang có 7 giá trị (10, 12, 14, 16, 18, 50%, 999px) và khoảng 15 cỡ chữ đặt tay: gom về thang ở trên.
9. Khoảng 30 màu viết trực tiếp ngoài `:root`.
10. `.cat-emoji` dùng emoji khi danh mục chưa có ảnh.
11. (Cập nhật #82) CSS chia theo trang và nén lúc build: `basecoat.css` 6,5 KB (chỉ nút, tab) + `style.css` dùng chung; trang chủ 31,5 KB, trang món + chế độ nấu + Thành quả 34,7 KB, danh mục 23,3 KB, Đi chợ 22,7 KB. Trần 35 KB.

Đã sửa ngày 2026-11-17 (PR khung quay ngang): mục 1 (bỏ IN HOA giãn chữ ở `.kicker`, `.slot-label`, `.rcard-meta b`, `.ing-box h3`, `.ad-label`, nút quay), mục 2 (bỏ sọc trái `.sec-head h2`, `.tip`), mục 3 (hover nhấc thẻ trong `@media (hover: hover)`, bỏ phóng ảnh), mục 6 (khung chờ ảnh nền phẳng). Bỏ thêm lớp phủ gradient và hiệu ứng `filter` khi quay.

Đã sửa ngày 2026-11-17 (quét tương phản 9 trang × sáng/đêm):
- `primary` `#C2492A` → `#B4421F`: chữ màu chính chỉ đạt 4.08–4.25:1 trên nền nhạt (nút phụ, radio đang chọn, định lượng đã tích, link trong mẹo).
- `herb` `#4A7C59` → `#437352`: thẻ "#tag" chỉ đạt 4.17:1.
- Nhãn danh mục trên tên món và nhãn ngăn quay dùng `accent` cho chữ (3.55–3.77:1): đổi sang `primary`.
- Chế độ đêm: nút "Chọn nguyên liệu" chữ trắng trên nền xanh nhạt (1.80:1): đổi sang `primary-ink` (9.82:1).

## Nguồn tham khảo

Quy tắc trong file này được chọn lọc và viết lại từ các repo dưới đây (đọc ngày 2026-11-17). Không chép mã.

| Repo | Giấy phép | Đã dùng |
|---|---|---|
| google-labs-code/design.md | Apache-2.0 | Định dạng file này, thứ tự mục, cách đặt tên token |
| VoltAgent/awesome-design-md | MIT | Cách viết mục Overview, Known Gaps, mô tả thẻ ảnh |
| pbakaus/impeccable | Apache-2.0 | Trang "để đọc", sàn tay nghề, chấm 5 mặt /20, dấu hiệu rập khuôn |
| nutlope/hallmark | MIT | Ba bậc Floor/Reflex/Finish, ngưỡng đo được |
| Leonxlnx/taste-skill | MIT | Một hệ thống duy nhất, dấu hiệu chữ do AI viết; một chuyển động đặc trưng (đầu trang hiện lần lượt) + phản hồi trên mọi nút |
| nextlevelbuilder/ui-ux-pro-max-skill | MIT | Ưu tiên truy cập → chạm → hiệu năng; **hồ sơ "Recipe & Cooking App" (#97): phong cách Claymorphism + Vibrant & Block-based, bảng màu terracotta/sage/kem, chữ tròn, hiệu ứng nảy — nền của giao diện #82** |
| emilkowalski/skills | MIT | Có nên động không, easing, thời lượng, `:active`, reduced-motion |
| nexu-io/open-design | Apache-2.0 | `craft/`: kỷ luật chuyển động, nền tảng truy cập, chống "AI slop" |
| greensock/gsap-skills | MIT (thư viện GSAP có giấy phép riêng) | Nguyên tắc thời lượng, stagger; làm lại bằng CSS/WAAPI, không dùng GSAP |
| DavidHDev/react-bits | MIT + Commons Clause | Chỉ ý tưởng hiệu ứng nhỏ; không chép, không dùng React |
| DavidHDev/canvas-ui | MIT + Commons Clause | Không dùng (WebGL, nặng) |
| oso95/scroll-world | MIT | Không dùng (video AI, chiếm cuộn) |

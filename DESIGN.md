---
version: alpha
name: Hôm Nay Nấu Gì
description: Tạp chí ẩm thực tiếng Việt trên điện thoại. Nền kem ấm, tiêu đề serif, ảnh món là nhân vật chính, đọc được khi tay đang nấu.
colors:
  primary: "#B4421F"          # chữ nhấn, nút chính, vòng focus (≥ 4.67:1 trên mọi nền sáng, kể cả primary-soft, surface-2, herb-soft)
  on-primary: "#FFFFFF"
  primary-soft: "#FBE6DD"     # nền nút phụ, ô đã chọn
  accent: "#D95D39"           # CHỈ trang trí (viền, chấm), không dùng cho chữ
  herb: "#437352"             # xanh thảo mộc: mẹo, nút Tủ lạnh, độ khó Dễ
  herb-soft: "#E6F0E8"
  neutral: "#FAF8F5"          # nền trang
  surface: "#FFFFFF"          # thẻ
  surface-2: "#F3EEE7"        # nền phụ, khung ảnh chờ
  on-surface: "#2D2A26"       # chữ thân
  muted: "#6B645C"            # chữ phụ (5.6:1 trên nền kem)
  line: "#EBE4DA"             # viền 1px
  level-easy: "#437352"
  level-medium: "#96610F"
  level-hard: "#B4421F"
  dark-neutral: "#1D1A17"
  dark-surface: "#27231F"
  dark-surface-2: "#322C27"
  dark-on-surface: "#F3EDE6"
  dark-muted: "#BDB3A8"
  dark-line: "#3E3730"
  dark-primary: "#F39A74"
  dark-on-primary: "#2A1208"
  dark-herb: "#92CFA2"
typography:
  headline-lg:
    fontFamily: Lora
    fontSize: 1.9em
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Lora
    fontSize: 1.35em
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
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
  lg: 18px
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
    height: 48px
    typography: "{typography.label-md}"
  button-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-on-primary}"
  button-ghost:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    height: 48px
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
    backgroundColor: "{colors.herb-soft}"
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
- Nền kem ấm, thẻ trắng, đổ bóng rất mềm. Chế độ đêm là bản dựng lại từng màu, không đảo màu.
- Tiêu đề serif Lora; nội dung, nhãn và số dùng Be Vietnam Pro.
- Ảnh món thật là nhân vật chính. Khi chưa có ảnh: khung nền phẳng ghi tên món bằng Lora, không emoji, không hình minh hoạ giả.
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
- Chế độ đêm (`dark-*`): nền tối ấm, các tầng nổi sáng dần lên, **tắt bóng đổ**, màu nhấn nhạt và bớt bão hoà để đạt tương phản. Mỗi màu sáng phải có bản đêm tương ứng.

## Typography

- Chữ thân 17px, giãn dòng 1.6. Chế độ chữ lớn (`data-big`) nâng lên 20px; mọi cỡ khác dùng `em` để tự lớn theo.
- Thang chữ: h1 1.9em Lora, h2 1.35em Lora, h3 1em đậm sans, thân 1em, nhãn 0.85em, chữ nhỏ nhất 13px. Không thêm cỡ mới; mỗi loại phần tử chỉ một cỡ trên toàn web.
- Chỉ một `h1` mỗi trang; tiêu đề không nhảy cấp.
- Đoạn văn dài tối đa ~65 ký tự mỗi dòng (`max-width: 65ch`).
- Tiêu đề dùng `text-wrap: balance`, đoạn văn `text-wrap: pretty`. Tên món dài phải xuống dòng gọn, không tràn khung (`overflow-wrap: anywhere` trên thẻ).
- Số thay đổi được (phút, khẩu phần, định lượng, đồng hồ hẹn giờ) dùng `font-variant-numeric: tabular-nums`. Không để số tách dòng khỏi đơn vị.
- Không dùng nhãn chữ IN HOA giãn chữ cho chữ nhỏ. Nhãn viết thường như câu, đậm hơn hoặc màu phụ.
- Văn bản: tiếng Việt có dấu, câu ngắn, xưng "bạn". Không từ rỗng ("tuyệt vời", "hoàn hảo", "đỉnh cao"), không câu hỏi rồi tự trả lời, không bịa số liệu.

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
- Bóng đổ duy nhất là `--shadow` (hai lớp mềm). Không thêm bóng mới, không bóng cứng không mờ.
- Chế độ đêm: không bóng; phân tầng bằng màu nền sáng dần.
- Không lồng thẻ trong thẻ. Không kính mờ, quầng sáng, gradient trang trí.

## Shapes

- Bo góc theo thang: `sm` 10px (ô nhỏ, ảnh bước), `md` 14px (nút, ô chọn, seg), `lg` 18px (thẻ, khung lớn), `full` (chip, nút tròn, ảnh danh mục).
- Ảnh món tỉ lệ 4:3, `object-fit: cover`, luôn có `width`/`height` hoặc `aspect-ratio` để không nhảy bố cục.
- Icon: SVG cùng một bộ nét (`icon()` trong `templates.mjs`), cùng độ dày nét. Không dùng emoji làm icon tính năng.

## Components

- **Nút chính** (`.btn`): tô đầy `primary`, cao ≥ 48px, chữ đậm. Mỗi màn hình chỉ một nút chính tô đầy. Nhãn nút không xuống dòng ở 320px, không có mũi tên dính chữ.
- **Nút phụ** (`.btn.ghost`): nền `primary-soft`, chữ `primary`. Chỉ một kiểu nút phụ.
- **Chip** (`.chip`): bo `full`, cao ≥ 44px; `aria-pressed` cho chip bật/tắt.
- **Seg / radio**: nhóm lựa chọn loại trừ dùng `role="radiogroup"` hoặc `<input type=radio>` thật; ô được chọn có viền `primary` và nền `surface-2`. Vùng bấm là cả nhãn.
- **Thẻ món** (`recipeCard()`): ảnh 4:3 trên, tên món, dòng phụ (thời gian, độ khó). Viền trên 3px theo độ khó. Chỉ **một** hiệu ứng hover đặt trên thẻ (nhấc nhẹ), không phóng to ảnh bên trong; hover nằm trong `@media (hover: hover) and (pointer: fine)`.
- **Khung quay món**: radio Món ăn / Đồ uống → kiểu (Mâm cơm 3 món / 1 món) → Bộ lọc thu gọn → nút Quay → các ngăn. Ngăn mâm cơm nằm ngang trong một khay.
- **Mẹo** (`.tip`): nền `herb-soft`, bo `lg`. Không dùng sọc màu dày ở cạnh trái.
- **Ô nhập**: nhãn hiển thị phía trên, không lấy placeholder làm nhãn; viền không đổi độ dày giữa các trạng thái; lỗi nằm ngay dưới ô, gắn `aria-describedby`.
- **Trạng thái** của mọi thành phần tương tác: mặc định, hover (chỉ chuột), focus (`:focus-visible`, viền 3px `primary`, hiện ngay), nhấn (`:active` thu nhẹ), tắt (`disabled` thật + mờ + `cursor: not-allowed`), đang tải (spinner chỉ trong nút).
- **Trạng thái rỗng** (`emptyState()`): nói cái gì đang trống, vì sao nó có ích, và một hành động. Ví dụ: "Sổ tay còn trống. Bấm Lưu ở món bạn thích để xem lại nhanh. [Quay món hôm nay]".
- **Lỗi**: nói chuyện gì xảy ra, cách khắc phục, có nút thử lại. Mất mạng thì báo đang ngoại tuyến.
- **Thành quả của bạn đọc** (`thanh-qua.css`, chỉ tải trên trang món): nút chính "Khoe món bạn nấu" có icon máy ảnh; lưới thẻ 2 cột (3 cột từ 700px), ảnh 4:3 trên, tên + thời gian + cảm nhận dưới; "Báo cáo" là nút chữ phụ, vùng bấm 44px. Hộp gửi là `<dialog>`: ô ảnh lớn khung đứt nét, cảm nhận, tên (máy nhớ), một nút Gửi. Chỉ một ô bắt buộc là tên.
- **Ghi nguồn**: dưới ảnh không tự chụp luôn có một dòng nhỏ 13px màu `muted` "Nguồn: tác giả, giấy phép", cả dòng là link tới trang ảnh, quá dài thì cắt "…" (không bỏ tên tác giả: CC BY/BY-SA bắt buộc); dưới video luôn có tên kênh và link YouTube.

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
- Gradient tím xanh, chữ gradient, quầng sáng, kính mờ, bóng cứng.
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
3. Tương phản chữ ≥ 4.5:1 (chữ ≥ 24px hoặc đậm ≥ 18.66px: ≥ 3:1), ở cả sáng và đêm (bật đêm bằng `localStorage` `hnng-prefs` = `{"theme":"dark"}`). Vòng focus và viền ô nhập ≥ 3:1. Chữ đặt trên lớp nền trong suốt đè lên ảnh (nhãn Video) phải tính màu nền sau khi trộn, đừng tin kết quả quét tự động.
4. Nhấn Tab: mọi phần tử nhận focus đều thấy rõ vòng focus.
5. Cỡ chữ tính toán ≥ 13px (riêng nhãn "Quảng cáo" ≥ 11px); chữ thân ≥ 17px, ≥ 20px khi bật chữ lớn.
6. Ảnh có `alt`, có kích thước giữ chỗ; ảnh hỏng thì tự ẩn.
7. Đúng một `h1`, tiêu đề không nhảy cấp.
8. Giả lập reduced-motion: bấm quay vẫn ra kết quả, không còn chuyển động dịch chuyển.
9. Tắt JS: trang món vẫn đọc được tên món, nguyên liệu, các bước.
10. Quảng cáo đúng vị trí, có nhãn, cách nội dung ≥ 16px.
11. Ngân sách: CSS < 30 KB, JS < 100 KB (`wc -c src/assets/*.css src/assets/*.js`).
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
5. `.cook-bar span` animate `width`: đổi sang `transform: scaleX`.
6. Khung ảnh chờ `.rcard-img` dùng sọc chéo lặp: đổi thành nền phẳng `surface-2`.
7. Các nút chưa có phản hồi `:active`.
8. Bo góc đang có 7 giá trị (10, 12, 14, 16, 18, 50%, 999px) và khoảng 15 cỡ chữ đặt tay: gom về thang ở trên.
9. Khoảng 30 màu viết trực tiếp ngoài `:root`.
10. `.cat-emoji` dùng emoji khi danh mục chưa có ảnh.
11. `style.css` 30.536 byte, sát trần 30 KB: các sửa ở trên phải cắt bớt nhiều hơn thêm vào; cân nhắc bước nén CSS khi build.

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
| Leonxlnx/taste-skill | MIT | Một hệ thống duy nhất, dấu hiệu chữ do AI viết |
| nextlevelbuilder/ui-ux-pro-max-skill | MIT | Ưu tiên truy cập → chạm → hiệu năng, gợi ý cho app nấu ăn |
| emilkowalski/skills | MIT | Có nên động không, easing, thời lượng, `:active`, reduced-motion |
| nexu-io/open-design | Apache-2.0 | `craft/`: kỷ luật chuyển động, nền tảng truy cập, chống "AI slop" |
| greensock/gsap-skills | MIT (thư viện GSAP có giấy phép riêng) | Nguyên tắc thời lượng, stagger; làm lại bằng CSS/WAAPI, không dùng GSAP |
| DavidHDev/react-bits | MIT + Commons Clause | Chỉ ý tưởng hiệu ứng nhỏ; không chép, không dùng React |
| DavidHDev/canvas-ui | MIT + Commons Clause | Không dùng (WebGL, nặng) |
| oso95/scroll-world | MIT | Không dùng (video AI, chiếm cuộn) |

// Từ điển chuỗi giao diện lúc build: tiếng Việt (/) và tiếng Anh (/en/).
// Nội dung món (tên, nguyên liệu, các bước, danh mục) lấy từ Google Sheet, không nằm ở đây.
// Chuỗi giao diện phía trình duyệt nằm ở đầu src/assets/app.js và src/assets/thanh-qua.js.
// Thêm khoá mới thì thêm ở cả hai ngôn ngữ: build dừng nếu thiếu.

export const LANGS = ["vi", "en"];
/** Tiền tố đường dẫn của từng ngôn ngữ. Slug món, danh mục giữ nguyên: /mon/x/ ↔ /en/mon/x/. */
export const PREFIX = { vi: "", en: "/en" };
export const LOCALE = { vi: "vi_VN", en: "en_US" };

/** Thời lượng: dưới 60 phút giữ "45 phút"; từ 60 phút "6 giờ 20 phút", tròn giờ "2 giờ". Giá trị không phải số nguyên (ví dụ "1,5") giữ nguyên. */
const gioPhut = (n, gio, phut) => {
  const v = Number(n);
  if (!Number.isInteger(v) || v < 60) return `${n} ${phut}`;
  const h = Math.floor(v / 60), m = v % 60;
  return m ? `${h} ${gio} ${m} ${phut}` : `${h} ${gio}`;
};

const vi = {
  // Khung trang
  nav_home: "Trang chủ", nav_cats: "Danh mục", nav_search: "Tìm món", nav_shop: "Đi chợ", nav_saved: "Sổ tay", nav_video: "Video",
  foot_about: "Giới thiệu", foot_videos: "Tất cả video", foot_video_rights: "Bản quyền video", foot_privacy: "Chính sách bảo mật",
  foot_terms: "Điều khoản sử dụng", foot_contact: "Liên hệ",
  crumbs: "Đường dẫn", skip: "Bỏ qua đến nội dung", big_text: "Chữ lớn", light_mode: "Chế độ sáng", main_nav: "Điều hướng chính",
  foot_video_note: "Video thuộc bản quyền của các kênh YouTube được ghi tên, nhúng theo chức năng chia sẻ của YouTube.",
  made_by: "Một sản phẩm của", ad: "Quảng cáo",
  lang_switch_label: "EN, Switch to English", lang_switch_text: "EN", lang_switch_title: "English",
  // Thẻ món, thông số
  min: (n) => gioPhut(n, "giờ", "phút"), people: (n) => `${n} người`, video: "Video", n_dishes: (n) => `${n} món`,
  diff_de: "Dễ", diff_vua: "Vừa", diff_kho: "Khó",
  source: "Nguồn", photo: "Ảnh",
  // Mâm cơm
  mam_man: "Món mặn", mam_canh: "Món canh", mam_rau: "Món rau / xào",
  // Trang chủ
  tagline_default: "",
  home_desc: (tag, n) => `${tag ? `${tag}. ` : ""}${n} công thức có hướng dẫn từng bước, gợi ý mâm cơm 3 món mỗi ngày.`,
  hero_h1: "Hôm nay nấu gì?", search_label: "Tìm món", search_ph: "Tìm món, nguyên liệu: gà, cá, trứng…", themes: "Chủ đề",
  spin_h2: "Quay món cho hôm nay", spin_sound: "Âm thanh khi quay", spin_kind: "Quay món ăn hay đồ uống", kind_food: "Món ăn", kind_drink: "Đồ uống",
  spin_modes: "Kiểu gợi ý", mode_one: "Gợi ý 1 món", mode_mam: "Mâm cơm 3 món", filters: "Bộ lọc",
  f_meal: "Bữa", f_meal_any: "Mọi bữa", meal_sang: "Bữa sáng", meal_trua: "Bữa trưa", meal_toi: "Bữa tối",
  f_time: "Thời gian", f_time_any: "Mọi thời gian", under_min: (n) => `Dưới ${n} phút`,
  f_main: "Nguyên liệu chính", f_main_any: "Mọi nguyên liệu",
  spin_go: "Quay món", for_you: "Gợi ý cho bạn", waiting: "Chờ quay", add_shop: "Thêm vào Đi chợ",
  spin_hint: "Bấm “Giữ” để giữ món ưng ý. Lần quay sau chỉ đổi món còn lại.",
  vstrip_h2: "Xem video nấu ăn", all_n_videos: (n) => `Tất cả ${n} video`,
  by_category: "Chọn theo loại món", all: "Tất cả", my_saved: "Sổ tay món ngon của tôi", see_all: "Xem hết",
  quick_h2: "Nhanh gọn dưới 20 phút", fridge_h2: "Tủ lạnh có gì?", fridge_p: "Chọn nguyên liệu bạn đang có, web gợi ý món nấu được ngay.",
  fridge_btn: "Chọn nguyên liệu", new_h2: "Công thức mới", all_n_dishes: (n) => `Tất cả ${n} món`,
  no_recipes: "Chưa có công thức", no_recipes_p: "Thêm công thức trong Google Sheets, web sẽ tự cập nhật.",
  // Video
  play_video: (t) => `Phát video ${t}`, video_by: (k) => (k ? `Video: kênh <strong lang="vi">${k}</strong>` : "Video: YouTube"), thumb_by: (k) => (k ? `Ảnh và video từ kênh <strong lang="vi">${k}</strong>` : "Ảnh và video từ YouTube"),
  see_recipe_arrow: "Xem công thức →",
  // Danh sách, lọc
  difficulty: "Độ khó", any_diff: "Mọi độ khó", time: "Thời gian", any_time: "Mọi thời gian", le_min: (n) => `≤ ${n} phút`,
  calories: "Calo", any_cal: "Mọi mức calo", sort: "Sắp xếp", sort_new: "Mới nhất", sort_fast: "Nấu nhanh nhất",
  all_recipes: "Tất cả công thức", all_dishes: "Tất cả món", all_desc: (n) => `Tất cả ${n} công thức nấu ăn, lọc theo độ khó, thời gian nấu.`,
  cats_title: "Danh mục món ăn", cats_h1: "Danh mục", cats_desc: (l) => `Chọn món theo loại: ${l}.`,
  cat_title: (c) => `${c} – công thức dễ làm`, cat_desc: (c) => `Công thức ${c} có video hướng dẫn.`,
  cat_empty: "Danh mục đang được bổ sung", cat_empty_p: "Công thức mới sẽ sớm có ở đây.",
  // Trang công thức
  steps_sum: (n, w, m) => `${n} bước${w ? ` · ${w} bước cần chờ · chờ lâu nhất ${m} phút` : ""}`,
  step_prog: (d, n) => `${d}/${n} bước`, step_reset: "Làm lại từ đầu", step_mark: (n) => `Đã xong bước ${n}`, step_hint: "Chạm vào số để đánh dấu bước đã xong.",
  need_buy: (x) => `Cần mua ${x}`, see_part: (t) => `Xem đoạn ${t}`, step_n: (n) => `Bước ${n}`, n_steps: (n) => `${n} bước`, step_sign: "Đạt khi", step_note: "Lưu ý", timer_min: (n) => `Hẹn giờ ${n} phút`,
  servings: (n) => `${n} người`, servings_unit: "người", recipe_yield: (n) => `${n} người`, cuisine: "Việt Nam",
  f_prep: "sơ chế", f_cook: "nấu", f_diff: "độ khó", f_cal: "mỗi phần", f_cost: "chi phí ước tính", f_serv: "khẩu phần gốc",
  play_guide: (t) => `Phát video hướng dẫn ${t}`, photo_or_video: "Ảnh hoặc video", tab_photo: "Ảnh món",
  recipe_desc: (sum, tot, n, v) => `${sum} ${tot ? `${tot} phút, ` : ""}${n} người ăn${v ? ", có video hướng dẫn" : ""}.`,
  save: "Lưu sổ tay", start_cook: "Bắt đầu nấu", ingredients: "Nguyên liệu", n_people: "Số người ăn", less_one: "Bớt một người", more_one: "Thêm một người",
  quick_people: "Chọn nhanh số người", ing_hint: "Tích những món cần mua, rồi chép hoặc thêm vào danh sách đi chợ.",
  copy_shop: "Chép danh sách đi chợ", steps: "Cách làm", tip: "Bí quyết nấu ngon", pair: "Ăn kèm hợp vị", updated: (d) => `Cập nhật: ${d}`,
  more_in: (c) => `Thêm món trong ${c}`, not_translated: "",
  // Tên danh mục, đơn vị đo theo ngôn ngữ. Tiếng Việt lấy từ Sheet nên ở đây trả về "" (giữ nguyên).
  cat_name: () => "", unit: () => "",
  tq_h2: "Thành quả của bạn đọc", tq_p: "Nấu xong rồi? Chụp một tấm cho mọi người cùng xem nhé.", tq_btn: "Khoe món bạn nấu",
  cook_dlg: "Chế độ đang nấu", cook_exit: "Thoát chế độ nấu", cook_done: "Đã xong bước này", cook_say: "Đọc to từng bước", cook_dots: "Các bước, bấm để chuyển", step_uses: "Dùng ở bước này", prev: "← Trước", next: "Tiếp →",
  // Video, tìm kiếm, đi chợ, sổ tay
  video_title: "Video hướng dẫn nấu ăn", video_desc: "Video hướng dẫn nấu ăn, mỗi video đi kèm công thức chi tiết.", video_h1: "Video hướng dẫn",
  video_lead: "Mỗi video có công thức chi tiết đi kèm: nguyên liệu, từng bước, hẹn giờ.", video_stage: "Xem video liên tiếp",
  video_pos: (i, n) => `Video ${i}/${n}`, video_prev: "Video trước", video_next: "Video kế", see_recipe: "Xem công thức", next_short: "Kế →",
  video_swipe: "Vuốt ngang trên khung video hoặc bấm “Kế” để sang video tiếp theo.", video_all: "Tất cả công thức có video",
  video_empty: "Video đang được chuẩn bị", video_empty_p: "Chúng tôi đang chọn video hướng dẫn cho từng món. Trong lúc chờ, bạn xem công thức từng bước nhé.",
  see_all_recipes: "Xem tất cả công thức",
  search_title: "Tìm món và Tủ lạnh có gì", search_desc: "Tìm công thức theo tên món, chủ đề, hoặc chọn nguyên liệu đang có trong tủ lạnh để biết nấu được món gì.",
  search_h1: "Tìm món", by_name: "Theo tên món", search_q: "Tìm kiếm", search_q_ph: "Ví dụ: trứng, canh, sinh tố…", no_accent: "Gõ không dấu vẫn tìm được.",
  any_theme: "Mọi chủ đề", fridge_have: "Chọn nguyên liệu bạn đang có. Gia vị cơ bản (muối, đường, nước mắm, dầu ăn…) được tính là có sẵn.",
  add_ing: "Thêm nguyên liệu khác", add_ing_ph: "Nguyên liệu khác, gõ rồi Enter",
  shop_title: "Danh sách đi chợ", shop_desc: "Danh sách nguyên liệu cần mua, gom từ các món bạn chọn.", shop_h1: "Đi chợ",
  shop_lead: "Nguyên liệu gom từ các món bạn đã thêm. Tích khi đã mua.", shop_share: "Chép / chia sẻ qua Zalo", shop_clear: "Xoá món đã mua",
  saved_title: "Sổ tay món ngon của tôi", saved_desc: "Các công thức bạn đã lưu trên máy này, không cần đăng nhập.", saved_h1: "Sổ tay món ngon",
  saved_lead: "Món bạn lưu nằm ngay trên máy này, không cần tài khoản.", saved_empty: "Sổ tay còn trống",
  saved_empty_p: "Bấm “Lưu vào sổ tay” ở trang công thức để xem lại nhanh ở đây.",
  // Quản trị, 404
  admin_title: "Quản trị thành quả", admin_desc: "Gỡ hoặc hiện lại ảnh, bình luận của bạn đọc.", admin_code: "Mã quản trị", admin_open: "Mở",
  nf_title: "Không tìm thấy trang", nf_desc: "Trang không tồn tại.",
  nf_body: `<p>Trang bạn tìm không tồn tại. <a href="/">Về trang chủ</a> hoặc <a href="/tim-kiem/">tìm món</a>.</p>`,
  // Trang thông tin: [slug, tiêu đề, mô tả, HTML]. email = link email đã escape (hoặc chữ "đang cập nhật"), name = tên web đã escape.
  email_none: "đang cập nhật",
  info: (name, email) => [
    ["gioi-thieu", "Giới thiệu", `${name} giúp bạn trả lời câu hỏi mỗi ngày: hôm nay nấu gì?`,
      `<p>${name} giúp bạn trả lời câu hỏi quen thuộc mỗi ngày: hôm nay nấu gì? Web gợi ý món và mâm cơm 3 món, có công thức rõ ràng, nguyên liệu tính theo số người ăn, hẹn giờ từng bước và video hướng dẫn từ các kênh YouTube được ghi tên.</p><p>Công thức do chúng tôi tự viết. Nếu bạn thấy chỗ chưa đúng, hãy <a href="/lien-he/">báo cho chúng tôi</a>.</p>`],
    ["ban-quyen-video", "Bản quyền video", "Cách chúng tôi dùng video YouTube và cách yêu cầu gỡ.",
      `<p>Video trên web được nhúng bằng trình phát chính thức của YouTube, không tải về hay sao chép. Lượt xem được tính cho kênh gốc, mỗi video đều ghi tên kênh và đường dẫn xem trên YouTube.</p><p>Chủ kênh có thể tắt chức năng nhúng trên YouTube bất cứ lúc nào. Nếu bạn là chủ kênh và muốn gỡ video, hãy liên hệ: ${email}. Chúng tôi gỡ trong vòng 48 giờ.</p><p>Công thức (nguyên liệu, các bước) do chúng tôi tự viết, không sao chép phần mô tả của video.</p>`],
    ["chinh-sach-bao-mat", "Chính sách bảo mật", "Cách web xử lý dữ liệu của bạn.",
      `<h2>Dữ liệu trên máy</h2><p>Sổ tay món ngon và danh sách đi chợ chỉ lưu trong trình duyệt trên máy của bạn. Chúng tôi không có máy chủ lưu những dữ liệu này và không yêu cầu đăng nhập.</p><h2>Thống kê và quảng cáo</h2><p>Web có thể dùng công cụ thống kê lượt truy cập và hiển thị quảng cáo của Google. Các dịch vụ này có thể dùng cookie theo chính sách của họ, xem tại <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">policies.google.com</a>.</p><h2>Video</h2><p>Video được nhúng từ YouTube ở chế độ hạn chế cookie và chỉ tải khi bạn bấm xem.</p>`],
    ["dieu-khoan", "Điều khoản sử dụng", `Điều khoản khi sử dụng ${name}.`,
      `<ol><li>Nội dung công thức thuộc ${name}. Bạn được dùng cho mục đích cá nhân; khi chia sẻ lại vui lòng dẫn link về trang gốc.</li><li>Video thuộc bản quyền của các kênh YouTube được ghi tên.</li><li>Lượng calo, chi phí và thời gian (nếu có) chỉ là ước tính, có thể khác tuỳ nguyên liệu và cách nấu.</li><li>Nếu bạn có bệnh lý hoặc dị ứng thực phẩm, hãy kiểm tra kỹ nguyên liệu trước khi nấu.</li><li>Chúng tôi có thể cập nhật điều khoản này; ngày cập nhật ghi ở cuối trang.</li></ol>`],
    ["lien-he", "Liên hệ", `Liên hệ ${name}.`, `<p>Góp ý công thức, báo lỗi hoặc hợp tác: ${email}.</p>`],
  ],
  info_updated: (d) => `Cập nhật: ${d}`,
  tq_privacy: (email) => `<h2>Ảnh và bình luận bạn đăng</h2><p>Khi bạn bấm "Khoe món bạn nấu", ảnh, cảm nhận và tên hiển thị bạn nhập sẽ hiện công khai dưới món đó. Web tự nén ảnh và xoá thông tin máy chụp, vị trí trong ảnh trước khi gửi. Chúng tôi không lưu địa chỉ IP của bạn, chỉ lưu một mã băm không đảo ngược được để chống spam. Muốn gỡ bài, hãy liên hệ: ${email}.</p><p>Để chống máy tự động gửi bài, web dùng Cloudflare Turnstile, xem chính sách tại <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener" target="_blank">cloudflare.com</a>.</p>`,
  tq_terms: "<li>Ảnh và bình luận bạn đăng phải do bạn tự chụp, tự viết, không chứa nội dung xúc phạm, quảng cáo hay đường link. Chúng tôi có thể gỡ bài vi phạm mà không cần báo trước.</li>",
};

const en = {
  nav_home: "Home", nav_cats: "Categories", nav_search: "Search", nav_shop: "Shopping", nav_saved: "Saved", nav_video: "Videos",
  foot_about: "About", foot_videos: "All videos", foot_video_rights: "Video copyright", foot_privacy: "Privacy policy",
  foot_terms: "Terms of use", foot_contact: "Contact",
  crumbs: "Breadcrumb", skip: "Skip to content", big_text: "Large text", light_mode: "Light mode", main_nav: "Main navigation",
  foot_video_note: "Videos belong to the YouTube channels named with them and are embedded with YouTube's sharing feature.",
  made_by: "A product of", ad: "Advertisement",
  lang_switch_label: "VI, Chuyển sang tiếng Việt", lang_switch_text: "VI", lang_switch_title: "Tiếng Việt",
  min: (n) => gioPhut(n, "hr", "min"), people: (n) => `${n} ${n === 1 ? "person" : "people"}`, video: "Video", n_dishes: (n) => `${n} ${n === 1 ? "dish" : "dishes"}`,
  diff_de: "Easy", diff_vua: "Medium", diff_kho: "Hard",
  source: "Source", photo: "Photo",
  mam_man: "Main dish", mam_canh: "Soup", mam_rau: "Greens / stir-fry",
  tagline_default: "Daily dish ideas, 3-dish family meals and step-by-step recipes with video",
  home_desc: (tag, n) => `${tag ? `${tag}. ` : ""}${n} Vietnamese home recipes with step-by-step guides and a 3-dish meal idea every day.`,
  hero_h1: "What should I cook today?", search_label: "Search recipes", search_ph: "Dishes or ingredients: chicken, egg…", themes: "Themes",
  spin_h2: "Spin for today's dish", spin_sound: "Sound while spinning", spin_kind: "Spin for food or drinks", kind_food: "Food", kind_drink: "Drinks",
  spin_modes: "Suggestion type", mode_one: "One dish", mode_mam: "3-dish meal", filters: "Filters",
  f_meal: "Meal", f_meal_any: "Any meal", meal_sang: "Breakfast", meal_trua: "Lunch", meal_toi: "Dinner",
  f_time: "Time", f_time_any: "Any time", under_min: (n) => `Under ${n} min`,
  f_main: "Main ingredient", f_main_any: "Any ingredient",
  spin_go: "Spin", for_you: "Picked for you", waiting: "Ready to spin", add_shop: "Add to shopping list",
  spin_hint: "Tap “Keep” to hold a dish you like. The next spin only changes the others.",
  vstrip_h2: "Cooking videos", all_n_videos: (n) => `All ${n} videos`,
  by_category: "Browse by type", all: "All", my_saved: "My saved recipes", see_all: "See all",
  quick_h2: "Quick, under 20 minutes", fridge_h2: "What's in your fridge?", fridge_p: "Pick the ingredients you have and see what you can cook right now.",
  fridge_btn: "Pick ingredients", new_h2: "New recipes", all_n_dishes: (n) => `All ${n} dishes`,
  no_recipes: "No recipes yet", no_recipes_p: "Add recipes in Google Sheets and the site updates itself.",
  play_video: (t) => `Play video ${t}`, video_by: (k) => (k ? `Video: <strong lang="vi">${k}</strong> channel` : "Video: YouTube"), thumb_by: (k) => (k ? `Photo and video from the <strong lang="vi">${k}</strong> channel` : "Photo and video from YouTube"),
  see_recipe_arrow: "See the recipe →",
  difficulty: "Difficulty", any_diff: "Any difficulty", time: "Time", any_time: "Any time", le_min: (n) => `≤ ${n} min`,
  calories: "Calories", any_cal: "Any calories", sort: "Sort", sort_new: "Newest", sort_fast: "Quickest",
  all_recipes: "All recipes", all_dishes: "All dishes", all_desc: (n) => `All ${n} recipes, filter by difficulty and cooking time.`,
  cats_title: "Recipe categories", cats_h1: "Categories", cats_desc: (l) => `Browse dishes by type: ${l}.`,
  cat_title: (c) => `${c} – easy recipes`, cat_desc: (c) => `${c} recipes with video guides.`,
  cat_empty: "More recipes coming", cat_empty_p: "New recipes will be here soon.",
  steps_sum: (n, w, m) => `${n} ${n === 1 ? "step" : "steps"}${w ? ` · ${w} with waiting · longest wait ${m} min` : ""}`,
  step_prog: (d, n) => `${d}/${n} steps`, step_reset: "Start over", step_mark: (n) => `Step ${n} done`, step_hint: "Tap a number to mark the step as done.",
  need_buy: (x) => `Need to buy ${x}`, see_part: (t) => `Watch from ${t}`, step_n: (n) => `Step ${n}`, n_steps: (n) => `${n} ${n === 1 ? "step" : "steps"}`, step_sign: "Done when", step_note: "Watch out", timer_min: (n) => `Timer ${n} min`,
  servings: (n) => `${n} ${n === 1 ? "person" : "people"}`, servings_unit: "people", recipe_yield: (n) => `${n} servings`, cuisine: "Vietnamese",
  f_prep: "prep", f_cook: "cook", f_diff: "difficulty", f_cal: "per serving", f_cost: "estimated cost", f_serv: "base servings",
  play_guide: (t) => `Play the video guide for ${t}`, photo_or_video: "Photo or video", tab_photo: "Photo",
  recipe_desc: (sum, tot, n, v) => `${sum} ${tot ? `${tot} minutes, ` : ""}serves ${n}${v ? ", with a video guide" : ""}.`,
  save: "Save", start_cook: "Cook now", ingredients: "Ingredients", n_people: "Servings", less_one: "One person fewer", more_one: "One person more",
  quick_people: "Quick servings", ing_hint: "Tick what you need to buy, then copy it or add it to your shopping list.",
  copy_shop: "Copy shopping list", steps: "Method", tip: "Cooking tips", pair: "Goes well with", updated: (d) => `Updated: ${d}`,
  more_in: (c) => `More in ${c}`, not_translated: "This recipe is not translated yet.",
  // Danh mục chưa có trong từ điển thì giữ tên tiếng Việt (đặt trong lang="vi").
  cat_name: (slug) => ({ "mon-man": "Savory mains", "mon-canh": "Soups", "mon-rau-xao": "Greens & stir-fries", "bua-sang": "Breakfast",
    "mon-mot-dia": "Rice, noodles & pasta", "an-vat": "Snacks", "do-uong": "Drinks" })[slug] || "",
  // Đơn vị thường gặp (khoá: đơn vị bỏ dấu, chữ thường). Đơn vị đếm (quả, cái) bỏ trống: "3 eggs". Không có trong từ điển thì giữ tiếng Việt.
  unit: (k) => ({ "thia canh": "tbsp", "muong canh": "tbsp", "thia ca phe": "tsp", "muong ca phe": "tsp", "chen": "bowl", "bat": "bowl",
    "ly": "cup", "coc": "cup", "lat": "slices", "gram": "g", "g": "g", "kg": "kg", "ml": "ml", "l": "l", "lit": "l", "qua": "", "trai": "", "cai": "" })[k],
  tq_h2: "Readers' dishes", tq_p: "Cooked it? Share a photo for everyone to see.", tq_btn: "Show your dish",
  cook_dlg: "Cooking mode", cook_exit: "Exit cooking mode", cook_done: "Done with this step", cook_say: "Read steps aloud", cook_dots: "Steps, tap to jump", step_uses: "Used in this step", prev: "← Back", next: "Next →",
  video_title: "Cooking video guides", video_desc: "Cooking videos, each one with a detailed recipe.", video_h1: "Video guides",
  video_lead: "Every video comes with a detailed recipe: ingredients, steps and timers.", video_stage: "Watch videos in a row",
  video_pos: (i, n) => `Video ${i}/${n}`, video_prev: "Previous video", video_next: "Next video", see_recipe: "See the recipe", next_short: "Next →",
  video_swipe: "Swipe across the video or tap “Next” for the next one.", video_all: "All recipes with video",
  video_empty: "Videos are on the way", video_empty_p: "We are picking a video guide for each dish. Meanwhile, try the step-by-step recipes.",
  see_all_recipes: "See all recipes",
  search_title: "Search recipes and fridge finder", search_desc: "Find recipes by name or theme, or pick what's in your fridge to see what you can cook.",
  search_h1: "Search", by_name: "By dish name", search_q: "Search", search_q_ph: "Dish name, e.g. trung (egg), canh (soup)…", no_accent: "Typing without Vietnamese accents works too.",
  any_theme: "All themes", fridge_have: "Pick the ingredients you have. Basic seasonings (salt, sugar, fish sauce, oil…) count as already there.",
  add_ing: "Add another ingredient", add_ing_ph: "Another ingredient, type and press Enter",
  shop_title: "Shopping list", shop_desc: "Ingredients to buy, gathered from the dishes you picked.", shop_h1: "Shopping",
  shop_lead: "Ingredients gathered from the dishes you added. Tick them off as you buy.", shop_share: "Copy / share the list", shop_clear: "Clear bought items",
  saved_title: "My saved recipes", saved_desc: "Recipes you saved on this device, no sign-in needed.", saved_h1: "Saved recipes",
  saved_lead: "Your saved dishes stay on this device. No account needed.", saved_empty: "Nothing saved yet",
  saved_empty_p: "Tap “Save” on a recipe page to find it quickly here.",
  admin_title: "Manage reader posts", admin_desc: "Hide or show readers' photos and comments.", admin_code: "Admin code", admin_open: "Open",
  nf_title: "Page not found", nf_desc: "This page does not exist.",
  nf_body: `<p>The page you are looking for does not exist. <a href="/">Go to the home page</a> or <a href="/tim-kiem/">search recipes</a>.</p>`,
  email_none: "coming soon",
  info: (name, email) => [
    ["gioi-thieu", "About", `${name} answers a daily question: what should I cook today?`,
      `<p>${name} answers a question many families ask every day: what should we cook today? The site suggests a dish or a 3-dish Vietnamese family meal, with clear recipes, ingredients scaled to the number of people, step timers and video guides from YouTube channels named with each video.</p><p>We write the recipes ourselves. Most recipes are in Vietnamese for now; English translations are on the way. If you spot a mistake, please <a href="/lien-he/">let us know</a>.</p>`],
    ["ban-quyen-video", "Video copyright", "How we use YouTube videos and how to ask us to remove one.",
      `<p>Videos on this site are embedded with YouTube's official player. We never download or copy them. Views count for the original channel, and every video shows the channel name and a link to watch it on YouTube.</p><p>Channel owners can turn off embedding on YouTube at any time. If you own a channel and want a video removed, contact us: ${email}. We remove it within 48 hours.</p><p>We write the recipes (ingredients and steps) ourselves and do not copy video descriptions.</p>`],
    ["chinh-sach-bao-mat", "Privacy policy", "How this site handles your data.",
      `<h2>Data on your device</h2><p>Your saved recipes and shopping list stay in the browser on your device. We have no server storing them and no sign-in.</p><h2>Analytics and ads</h2><p>The site may use visitor analytics and show Google ads. These services may use cookies under their own policies, see <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">policies.google.com</a>.</p><h2>Video</h2><p>Videos are embedded from YouTube in privacy-enhanced mode and only load when you tap play.</p>`],
    ["dieu-khoan", "Terms of use", `Terms for using ${name}.`,
      `<ol><li>Recipe content belongs to ${name}. You may use it for personal purposes; when sharing, please link back to the original page.</li><li>Videos belong to the YouTube channels named with them.</li><li>Calories, cost and time (where shown) are estimates and may vary with ingredients and cooking.</li><li>If you have a medical condition or food allergy, check the ingredients carefully before cooking.</li><li>We may update these terms; the update date is shown at the bottom of this page.</li></ol>`],
    ["lien-he", "Contact", `Contact ${name}.`, `<p>Recipe feedback, bug reports or partnerships: ${email}.</p>`],
  ],
  info_updated: (d) => `Updated: ${d}`,
  tq_privacy: (email) => `<h2>Photos and comments you post</h2><p>When you tap "Show your dish", the photo, comment and display name you enter appear publicly under that dish. The site compresses the photo and removes camera and location data before sending it. We do not store your IP address, only a one-way hash to fight spam. To remove a post, contact us: ${email}.</p><p>To stop automated posting, the site uses Cloudflare Turnstile, see its policy at <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener" target="_blank">cloudflare.com</a>.</p>`,
  tq_terms: "<li>Photos and comments you post must be your own, with no offensive content, ads or links. We may remove posts that break these rules without notice.</li>",
};

export const T = { vi, en };
const thieu = Object.keys(vi).filter((k) => !(k in en)).concat(Object.keys(en).filter((k) => !(k in vi)));
if (thieu.length) throw new Error(`i18n: khoá có ở một ngôn ngữ mà thiếu ở ngôn ngữ kia: ${thieu.join(", ")}`);

/** t = tr("en"); t("min", 5) → "5 min". Chuỗi là hàm thì truyền tham số. */
export const tr = (lang) => (k, ...a) => {
  const v = T[lang][k];
  if (v === undefined) throw new Error(`i18n: không có khoá "${k}"`);
  return typeof v === "function" ? v(...a) : v;
};

/** Độ khó trong Sheet (Dễ / Vừa / Khó) → chữ theo ngôn ngữ; giá trị lạ giữ nguyên. */
export const diffText = (t, k, raw) => (["de", "vua", "kho"].includes(k) ? t(`diff_${k}`) : raw || "");

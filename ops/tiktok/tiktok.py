#!/usr/bin/env python3
"""Đăng bài ảnh lên TikTok qua Content Posting API (Direct Post).

Công cụ cho nhân viên Marketing (Claude). Chỉ dùng thư viện chuẩn của Python 3.
Không bao giờ in token hay secret. Xem ops/TIKTOK.md.

Lệnh:
  tiktok.py lien-ket --key-file F
  tiktok.py ket-noi  --key-file F "<URL sau khi đăng nhập>"
  tiktok.py dang     --key-file F --bai post.json [--rieng-tu]
"""

import argparse
import json
import os
import re
import secrets
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

API = os.environ.get("TIKTOK_API_BASE", "https://open.tiktokapis.com").rstrip("/")
AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
REDIRECT_URI = "https://trongnghiabui95.github.io/homnaynaugi/"
SCOPES = "user.info.basic,video.publish"
MEDIA_PREFIX = "https://trongnghiabui95.github.io/homnaynaugi-media/"
POLL_INTERVAL = float(os.environ.get("TIKTOK_POLL_INTERVAL", "3"))
POLL_TIMEOUT = float(os.environ.get("TIKTOK_POLL_TIMEOUT", "180"))
REFRESH_MARGIN = 600  # làm mới token khi còn dưới 10 phút
SECRET_KEYS = ("client_secret", "access_token", "refresh_token")

# Lỗi TikTok -> câu tiếng Việt dễ hiểu.
LOI = {
    "access_token_invalid": "Token TikTok không còn dùng được, cần kết nối lại (chạy lệnh lien-ket).",
    "invalid_grant": "Mã đăng nhập hoặc token làm mới đã hết hạn, cần kết nối lại (chạy lệnh lien-ket).",
    "invalid_client": "Client key hoặc client secret trong file khoá không đúng.",
    "scope_not_authorized": "Tài khoản chưa cấp quyền video.publish, cần kết nối lại và đồng ý đủ quyền.",
    "scope_permission_missed": "Tài khoản chưa cấp quyền video.publish, cần kết nối lại và đồng ý đủ quyền.",
    "rate_limit_exceeded": "Gọi TikTok quá nhanh, chờ 1 phút rồi thử lại.",
    "spam_risk_too_many_posts": "Đã chạm hạn mức số bài đăng trong ngày của TikTok, thử lại ngày mai.",
    "spam_risk_too_many_pending_share": "Còn quá nhiều bài đang chờ xử lý, chờ các bài trước xong rồi thử lại.",
    "spam_risk_user_banned_from_posting": "Tài khoản đang bị TikTok chặn đăng bài.",
    "reached_active_user_cap": "App đã chạm hạn mức người dùng trong ngày của TikTok, thử lại ngày mai.",
    "unaudited_client_can_only_post_to_private_accounts": "App chưa được TikTok duyệt nên chỉ đăng được bài riêng tư.",
    "url_ownership_unverified": "Địa chỉ ảnh chưa được xác minh trong app TikTok (URL properties).",
    "privacy_level_option_mismatch": "Chế độ hiển thị không nằm trong các lựa chọn TikTok cho phép.",
    "invalid_params": "Thông tin bài đăng không hợp lệ (tiêu đề, mô tả hoặc danh sách ảnh).",
    "picture_size_check_failed": "Ảnh sai kích thước: dùng JPG, cạnh dài tối đa 1080px.",
    "file_format_check_failed": "Ảnh sai định dạng: dùng JPG.",
    "photo_pull_failed": "TikTok không tải được ảnh: kiểm tra link ảnh mở được công khai.",
    "frequency_limit": "Đăng quá dày, chờ một lúc rồi thử lại.",
    "internal": "TikTok đang lỗi phía máy chủ, thử lại sau.",
}


class Loi(Exception):
    """Lỗi đã có câu tiếng Việt cho người dùng."""


# ---------- file khoá ----------

def doc_khoa(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise Loi(f"Không thấy file khoá: {path}")
    except json.JSONDecodeError:
        raise Loi(f"File khoá không phải JSON hợp lệ: {path}")


def ghi_khoa(path, data):
    """Ghi file khoá an toàn: file tạm quyền 600 rồi đổi tên."""
    d = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".tiktok-", suffix=".tmp")
    try:
        os.chmod(tmp, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def can_co(khoa, *keys):
    thieu = [k for k in keys if not khoa.get(k)]
    if thieu:
        raise Loi("File khoá thiếu: " + ", ".join(thieu))


def che(text, khoa):
    """Xoá mọi giá trị bí mật khỏi một chuỗi trước khi in."""
    text = str(text)
    for k in SECRET_KEYS:
        v = khoa.get(k) if khoa else None
        if v and len(str(v)) >= 4:
            text = text.replace(str(v), "***")
    return text


# ---------- HTTP ----------

def goi(method, url, khoa, *, form=None, body=None, token=None):
    headers = {}
    data = None
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json; charset=UTF-8"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
    except urllib.error.HTTPError as e:
        raw = e.read()
        if not raw:
            raise Loi(f"TikTok trả lỗi HTTP {e.code}.")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise Loi("Không kết nối được TikTok (" + che(getattr(e, "reason", e), khoa)
                  + "). Kiểm tra mạng và tên miền open.tiktokapis.com đã được mở.")
    try:
        return json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise Loi("TikTok trả về dữ liệu không đọc được.")


def ma_loi(res):
    """Lấy mã lỗi từ phản hồi TikTok; None nếu thành công."""
    if isinstance(res.get("error"), dict):
        code = res["error"].get("code")
        return None if code in (None, "", "ok") else code
    if isinstance(res.get("error"), str) and res["error"]:
        return res["error"]
    return None


def bao_loi(code, res, khoa, mac_dinh="TikTok báo lỗi"):
    msg = LOI.get(code)
    if not msg:
        chi_tiet = ""
        if isinstance(res.get("error"), dict):
            chi_tiet = res["error"].get("message", "")
        else:
            chi_tiet = res.get("error_description", "")
        msg = f"{mac_dinh}: {code}" + (f" ({chi_tiet})" if chi_tiet else "")
    return Loi(che(msg, khoa))


# ---------- token ----------

def luu_token(khoa, res, now):
    khoa["access_token"] = res["access_token"]
    khoa["refresh_token"] = res.get("refresh_token", khoa.get("refresh_token"))
    khoa["expires_at"] = int(now + int(res.get("expires_in", 0)))
    if res.get("refresh_expires_in"):
        khoa["refresh_expires_at"] = int(now + int(res["refresh_expires_in"]))
    if res.get("open_id"):
        khoa["open_id"] = res["open_id"]
    if res.get("scope"):
        khoa["scope"] = res["scope"]


def lay_token(khoa, path):
    """Trả access token còn hạn, tự làm mới và ghi lại file khoá khi cần."""
    can_co(khoa, "client_key", "client_secret")
    if not khoa.get("access_token") or not khoa.get("refresh_token"):
        raise Loi("Chưa kết nối tài khoản TikTok, cần kết nối (chạy lệnh lien-ket).")
    now = time.time()
    if khoa.get("expires_at", 0) - now > REFRESH_MARGIN:
        return khoa["access_token"]
    if khoa.get("refresh_expires_at") and khoa["refresh_expires_at"] <= now:
        raise Loi("Token TikTok đã hết hạn hẳn, cần kết nối lại (chạy lệnh lien-ket).")
    res = goi("POST", API + "/v2/oauth/token/", khoa, form={
        "client_key": khoa["client_key"],
        "client_secret": khoa["client_secret"],
        "grant_type": "refresh_token",
        "refresh_token": khoa["refresh_token"],
    })
    code = ma_loi(res)
    if code or not res.get("access_token"):
        if code in ("invalid_grant", "invalid_request", "access_token_invalid", None):
            raise Loi("Không làm mới được token TikTok, cần kết nối lại (chạy lệnh lien-ket).")
        raise bao_loi(code, res, khoa, "Không làm mới được token")
    luu_token(khoa, res, now)
    ghi_khoa(path, khoa)
    return khoa["access_token"]


# ---------- lệnh ----------

def lien_ket(args):
    khoa = doc_khoa(args.key_file)
    can_co(khoa, "client_key")
    state = secrets.token_urlsafe(24)
    khoa["state"] = state
    ghi_khoa(args.key_file, khoa)
    q = urllib.parse.urlencode({
        "client_key": khoa["client_key"],
        "scope": SCOPES,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "state": state,
    })
    print(AUTH_URL + "?" + q)
    return 0


def ket_noi(args):
    khoa = doc_khoa(args.key_file)
    can_co(khoa, "client_key", "client_secret")
    q = urllib.parse.parse_qs(urllib.parse.urlparse(args.url.strip()).query)
    if q.get("error"):
        raise Loi("Đăng nhập TikTok không thành công ("
                  + q["error"][0] + "). Chạy lại lệnh lien-ket để lấy link mới.")
    code = (q.get("code") or [""])[0]
    state = (q.get("state") or [""])[0]
    if not code:
        raise Loi("URL không có mã đăng nhập (code). Dán đúng địa chỉ trên thanh trình duyệt sau khi đăng nhập.")
    if not khoa.get("state") or not secrets.compare_digest(state, khoa["state"]):
        raise Loi("Mã state không khớp: link đăng nhập cũ hoặc không phải do lệnh lien-ket tạo. Chạy lại lien-ket.")
    now = time.time()
    res = goi("POST", API + "/v2/oauth/token/", khoa, form={
        "client_key": khoa["client_key"],
        "client_secret": khoa["client_secret"],
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    })
    err = ma_loi(res)
    if err or not res.get("access_token"):
        raise bao_loi(err or "khong_co_token", res, khoa, "Không đổi được mã đăng nhập lấy token")
    luu_token(khoa, res, now)
    khoa.pop("state", None)
    ghi_khoa(args.key_file, khoa)
    print(json.dumps({"ket_noi": "ok", "open_id": khoa.get("open_id"),
                      "scope": khoa.get("scope")}, ensure_ascii=False))
    return 0


def doc_bai(path):
    try:
        with open(path, encoding="utf-8") as f:
            bai = json.load(f)
    except FileNotFoundError:
        raise Loi(f"Không thấy file bài: {path}")
    except json.JSONDecodeError:
        raise Loi(f"File bài không phải JSON hợp lệ: {path}")
    loi = []
    title = str(bai.get("title", "")).strip()
    desc = str(bai.get("description", "")).strip()
    anh = bai.get("images") or []
    cover = bai.get("cover_index", 0)
    if not title:
        loi.append("thiếu title")
    elif len(title) > 90:
        loi.append(f"title dài {len(title)} ký tự, tối đa 90")
    if len(desc) > 4000:
        loi.append(f"description dài {len(desc)} ký tự, tối đa 4000")
    if not isinstance(anh, list) or not 1 <= len(anh) <= 35:
        loi.append("images phải có từ 1 đến 35 link ảnh")
    else:
        for u in anh:
            if not isinstance(u, str) or not u.startswith(MEDIA_PREFIX):
                loi.append(f"ảnh không nằm trong {MEDIA_PREFIX}: {u}")
            elif not re.search(r"\.jpe?g$", urllib.parse.urlparse(u).path, re.I):
                loi.append(f"ảnh phải là JPG: {u}")
        if not isinstance(cover, int) or not 0 <= cover < len(anh):
            loi.append(f"cover_index phải từ 0 đến {len(anh) - 1}")
    if loi:
        raise Loi("File bài chưa đúng: " + "; ".join(loi) + ".")
    return {"title": title, "description": desc, "images": anh, "cover_index": cover}


def dang(args):
    bai = doc_bai(args.bai)
    khoa = doc_khoa(args.key_file)
    token = lay_token(khoa, args.key_file)

    res = goi("POST", API + "/v2/post/publish/creator_info/query/", khoa, body={}, token=token)
    err = ma_loi(res)
    if err:
        raise bao_loi(err, res, khoa, "Không đọc được thông tin tài khoản")
    info = res.get("data") or {}
    options = info.get("privacy_level_options") or []
    if not args.rieng_tu and "PUBLIC_TO_EVERYONE" in options:
        privacy = "PUBLIC_TO_EVERYONE"
    elif "SELF_ONLY" in options or not options:
        privacy = "SELF_ONLY"
    else:
        raise Loi("Tài khoản không cho đăng công khai hay riêng tư (lựa chọn: "
                  + ", ".join(options) + ").")

    def khoi_tao(privacy):
        return goi("POST", API + "/v2/post/publish/content/init/", khoa, token=token, body={
            "post_info": {
                "title": bai["title"],
                "description": bai["description"],
                "privacy_level": privacy,
                "disable_comment": bool(info.get("comment_disabled", False)),
                "auto_add_music": True,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "photo_cover_index": bai["cover_index"],
                "photo_images": bai["images"],
            },
            "post_mode": "DIRECT_POST",
            "media_type": "PHOTO",
        })

    res = khoi_tao(privacy)
    err = ma_loi(res)
    if err == "unaudited_client_can_only_post_to_private_accounts" and privacy != "SELF_ONLY":
        privacy = "SELF_ONLY"
        res = khoi_tao(privacy)
        err = ma_loi(res)
    if err:
        raise bao_loi(err, res, khoa, "Không tạo được bài đăng")
    publish_id = (res.get("data") or {}).get("publish_id")
    if not publish_id:
        raise Loi("TikTok không trả về mã bài đăng (publish_id).")

    ket_qua = {"publish_id": publish_id, "trang_thai": "PROCESSING", "privacy": privacy}
    het_gio = time.time() + POLL_TIMEOUT
    while True:
        res = goi("POST", API + "/v2/post/publish/status/fetch/", khoa, token=token,
                  body={"publish_id": publish_id})
        err = ma_loi(res)
        if err:
            raise bao_loi(err, res, khoa, "Không hỏi được trạng thái bài")
        data = res.get("data") or {}
        status = data.get("status", "")
        ket_qua["trang_thai"] = status
        if status == "PUBLISH_COMPLETE":
            ids = data.get("publicaly_available_post_id") or data.get("publicly_available_post_id") or []
            if ids:
                ket_qua["post_id"] = ids
            break
        if status == "FAILED":
            reason = data.get("fail_reason", "")
            ket_qua["loi"] = che(LOI.get(reason, f"TikTok không đăng được bài ({reason})."), khoa)
            print(json.dumps(ket_qua, ensure_ascii=False))
            return 1
        if time.time() >= het_gio:
            ket_qua["ghi_chu"] = "TikTok vẫn đang xử lý; xem lại trong app TikTok sau ít phút."
            break
        time.sleep(POLL_INTERVAL)
    if privacy == "SELF_ONLY":
        ket_qua["ghi_chu_rieng_tu"] = "Bài đang ở chế độ riêng tư: mở app TikTok, chọn bài, đổi sang 'Mọi người'."
    print(json.dumps(ket_qua, ensure_ascii=False))
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(prog="tiktok.py", description="Đăng bài ảnh lên TikTok.")
    sub = p.add_subparsers(dest="lenh", required=True)
    a = sub.add_parser("lien-ket", help="In link đăng nhập TikTok")
    a.add_argument("--key-file", required=True)
    a.set_defaults(fn=lien_ket)
    b = sub.add_parser("ket-noi", help="Đổi mã đăng nhập lấy token")
    b.add_argument("--key-file", required=True)
    b.add_argument("url")
    b.set_defaults(fn=ket_noi)
    c = sub.add_parser("dang", help="Đăng một bài ảnh")
    c.add_argument("--key-file", required=True)
    c.add_argument("--bai", required=True)
    c.add_argument("--rieng-tu", action="store_true", help="Luôn đăng ở chế độ riêng tư")
    c.set_defaults(fn=dang)
    args = p.parse_args(argv)
    try:
        return args.fn(args)
    except Loi as e:
        print("Lỗi: " + str(e), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

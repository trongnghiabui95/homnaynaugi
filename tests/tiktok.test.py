"""Kiểm thử ops/tiktok/tiktok.py với API TikTok giả lập (không cần mạng).

Chạy: python3 tests/tiktok.test.py
"""

import contextlib
import importlib.util
import io
import json
import os
import pathlib
import stat
import sys
import tempfile
import threading
import time
import unittest
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

GOC = pathlib.Path(__file__).resolve().parent.parent
MEDIA = "https://trongnghiabui95.github.io/homnaynaugi-media/"
TOKEN_THU = "tok-thu-ACCESS-9f8e7d"
REFRESH_THU = "tok-thu-REFRESH-1a2b3c"
SECRET_THU = "secret-thu-XYZ123"


class Gia:
    """Trạng thái API giả lập; mỗi test đặt lại."""

    def reset(self):
        self.calls = []
        self.token = {"access_token": TOKEN_THU, "expires_in": 86400, "open_id": "open-thu",
                      "refresh_token": REFRESH_THU, "refresh_expires_in": 31536000,
                      "scope": "user.info.basic,video.publish", "token_type": "Bearer"}
        self.token_loi = None
        self.creator = {"privacy_level_options": ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"],
                        "comment_disabled": False, "creator_username": "thu"}
        self.creator_loi = None
        self.init_loi = []  # danh sách mã lỗi lần lượt cho các lần init
        self.statuses = ["PROCESSING_DOWNLOAD", "PUBLISH_COMPLETE"]
        self.fail_reason = ""


GIA = Gia()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def tra(self, obj, code=200):
        raw = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def ok(self, data):
        self.tra({"data": data, "error": {"code": "ok", "message": "", "log_id": "thu"}})

    def loi(self, code, http=400):
        self.tra({"data": {}, "error": {"code": code, "message": "thu " + code, "log_id": "thu"}}, http)

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n).decode()
        if self.headers.get("Content-Type", "").startswith("application/x-www-form-urlencoded"):
            body = {k: v[0] for k, v in urllib.parse.parse_qs(raw).items()}
        else:
            body = json.loads(raw or "{}")
        GIA.calls.append((self.path, body, self.headers.get("Authorization")))
        auth_ok = self.headers.get("Authorization") == "Bearer " + TOKEN_THU
        if self.path == "/v2/oauth/token/":
            if GIA.token_loi:
                return self.tra({"error": GIA.token_loi, "error_description": "thu", "log_id": "thu"}, 400)
            return self.tra(GIA.token)
        if not auth_ok:
            return self.loi("access_token_invalid", 401)
        if self.path == "/v2/post/publish/creator_info/query/":
            if GIA.creator_loi:
                return self.loi(GIA.creator_loi)
            return self.ok(GIA.creator)
        if self.path == "/v2/post/publish/content/init/":
            if GIA.init_loi:
                return self.loi(GIA.init_loi.pop(0))
            return self.ok({"publish_id": "p_pub_thu_001"})
        if self.path == "/v2/post/publish/status/fetch/":
            st = GIA.statuses.pop(0) if len(GIA.statuses) > 1 else GIA.statuses[0]
            data = {"status": st}
            if st == "FAILED":
                data["fail_reason"] = GIA.fail_reason
            if st == "PUBLISH_COMPLETE":
                data["publicaly_available_post_id"] = [7300000000000000001]
            return self.ok(data)
        self.loi("not_found", 404)


def nap_cong_cu(base):
    os.environ["TIKTOK_API_BASE"] = base
    os.environ["TIKTOK_POLL_INTERVAL"] = "0"
    os.environ["TIKTOK_POLL_TIMEOUT"] = "1"
    os.environ["NO_PROXY"] = os.environ["no_proxy"] = "127.0.0.1,localhost"
    spec = importlib.util.spec_from_file_location("tiktok", GOC / "ops" / "tiktok" / "tiktok.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class TikTokTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.tt = nap_cong_cu(f"http://127.0.0.1:{cls.srv.server_address[1]}")

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def setUp(self):
        GIA.reset()
        self.dir = tempfile.mkdtemp(prefix="tiktok-thu-")
        self.key = os.path.join(self.dir, "khoa.json")
        self.bai = os.path.join(self.dir, "post.json")
        self.ghi(self.key, {"client_key": "key-thu", "client_secret": SECRET_THU})
        self.ghi(self.bai, {"title": "Thử: canh chua cá lóc", "description": "Bài thử #homnaynaugi",
                            "images": [MEDIA + "thu/1.jpg", MEDIA + "thu/2.jpg"], "cover_index": 0})

    def ghi(self, path, obj):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False)

    def doc(self, path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def chay(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = self.tt.main(list(argv))
        o, e = out.getvalue(), err.getvalue()
        for bi_mat in (TOKEN_THU, REFRESH_THU, SECRET_THU):
            self.assertNotIn(bi_mat, o + e, "lộ token/secret ra màn hình")
        return code, o, e

    def da_ket_noi(self, **them):
        k = self.doc(self.key)
        k.update({"access_token": TOKEN_THU, "refresh_token": REFRESH_THU,
                  "expires_at": int(time.time()) + 86400,
                  "refresh_expires_at": int(time.time()) + 3e7, "open_id": "open-thu"})
        k.update(them)
        self.ghi(self.key, k)

    # ---------- lien-ket / ket-noi ----------

    def test_lien_ket_va_ket_noi(self):
        code, out, _ = self.chay("lien-ket", "--key-file", self.key)
        self.assertEqual(code, 0)
        url = urllib.parse.urlparse(out.strip())
        q = urllib.parse.parse_qs(url.query)
        self.assertEqual(url.netloc, "www.tiktok.com")
        self.assertEqual(q["scope"], ["user.info.basic,video.publish"])
        self.assertEqual(q["redirect_uri"], ["https://trongnghiabui95.github.io/homnaynaugi/"])
        state = q["state"][0]
        self.assertEqual(self.doc(self.key)["state"], state)

        back = f"https://trongnghiabui95.github.io/homnaynaugi/?code=ma-thu&scopes=video.publish&state={state}"
        code, out, _ = self.chay("ket-noi", "--key-file", self.key, back)
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["open_id"], "open-thu")
        k = self.doc(self.key)
        self.assertEqual(k["access_token"], TOKEN_THU)
        self.assertEqual(k["refresh_token"], REFRESH_THU)
        self.assertNotIn("state", k)
        self.assertGreater(k["expires_at"], time.time() + 80000)
        self.assertEqual(stat.S_IMODE(os.stat(self.key).st_mode), 0o600)
        path, body, _ = GIA.calls[-1]
        self.assertEqual(body["grant_type"], "authorization_code")
        self.assertEqual(body["code"], "ma-thu")

    def test_ket_noi_sai_state(self):
        self.chay("lien-ket", "--key-file", self.key)
        code, _, err = self.chay("ket-noi", "--key-file", self.key,
                                 "https://trongnghiabui95.github.io/homnaynaugi/?code=x&state=gia-mao")
        self.assertEqual(code, 1)
        self.assertIn("state không khớp", err)
        self.assertEqual(GIA.calls, [])

    def test_ket_noi_nguoi_dung_tu_choi(self):
        self.chay("lien-ket", "--key-file", self.key)
        code, _, err = self.chay("ket-noi", "--key-file", self.key,
                                 "https://trongnghiabui95.github.io/homnaynaugi/?error=access_denied&state=x")
        self.assertEqual(code, 1)
        self.assertIn("không thành công", err)

    def test_ket_noi_ma_het_han(self):
        self.chay("lien-ket", "--key-file", self.key)
        state = self.doc(self.key)["state"]
        GIA.token_loi = "invalid_grant"
        code, _, err = self.chay("ket-noi", "--key-file", self.key,
                                 f"https://x/?code=cu&state={state}")
        self.assertEqual(code, 1)
        self.assertIn("cần kết nối lại", err)

    # ---------- dang ----------

    def test_dang_cong_khai(self):
        self.da_ket_noi()
        code, out, _ = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 0)
        kq = json.loads(out)
        self.assertEqual(kq["publish_id"], "p_pub_thu_001")
        self.assertEqual(kq["trang_thai"], "PUBLISH_COMPLETE")
        self.assertEqual(kq["privacy"], "PUBLIC_TO_EVERYONE")
        init = [b for p, b, _ in GIA.calls if p.endswith("/content/init/")][0]
        self.assertEqual(init["media_type"], "PHOTO")
        self.assertEqual(init["post_mode"], "DIRECT_POST")
        self.assertEqual(init["source_info"]["source"], "PULL_FROM_URL")
        self.assertEqual(init["source_info"]["photo_images"], [MEDIA + "thu/1.jpg", MEDIA + "thu/2.jpg"])
        self.assertEqual(init["source_info"]["photo_cover_index"], 0)
        self.assertTrue(init["post_info"]["auto_add_music"])
        self.assertEqual(init["post_info"]["title"], "Thử: canh chua cá lóc")
        self.assertEqual([p for p, _, _ in GIA.calls if "oauth" in p], [], "không cần làm mới token")

    def test_dang_rieng_tu_khi_khong_duoc_cong_khai(self):
        self.da_ket_noi()
        GIA.creator["privacy_level_options"] = ["SELF_ONLY"]
        code, out, _ = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 0)
        kq = json.loads(out)
        self.assertEqual(kq["privacy"], "SELF_ONLY")
        self.assertIn("Mọi người", kq["ghi_chu_rieng_tu"])

    def test_dang_co_co_rieng_tu(self):
        self.da_ket_noi()
        code, out, _ = self.chay("dang", "--key-file", self.key, "--bai", self.bai, "--rieng-tu")
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["privacy"], "SELF_ONLY")

    def test_app_chua_duyet_tu_ve_rieng_tu(self):
        self.da_ket_noi()
        GIA.init_loi = ["unaudited_client_can_only_post_to_private_accounts"]
        code, out, _ = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["privacy"], "SELF_ONLY")
        inits = [b for p, b, _ in GIA.calls if p.endswith("/content/init/")]
        self.assertEqual([b["post_info"]["privacy_level"] for b in inits],
                         ["PUBLIC_TO_EVERYONE", "SELF_ONLY"])

    def test_tu_lam_moi_token(self):
        self.da_ket_noi(access_token="tok-thu-CU", expires_at=int(time.time()) + 60)
        code, out, _ = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 0, out)
        refresh = [b for p, b, _ in GIA.calls if p == "/v2/oauth/token/"]
        self.assertEqual(len(refresh), 1)
        self.assertEqual(refresh[0]["grant_type"], "refresh_token")
        self.assertEqual(refresh[0]["refresh_token"], REFRESH_THU)
        k = self.doc(self.key)
        self.assertEqual(k["access_token"], TOKEN_THU)
        self.assertGreater(k["expires_at"], time.time() + 80000)

    def test_lam_moi_that_bai_can_ket_noi_lai(self):
        self.da_ket_noi(expires_at=int(time.time()) + 60)
        GIA.token_loi = "invalid_grant"
        code, _, err = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        self.assertIn("cần kết nối lại", err)

    def test_refresh_het_han_han(self):
        self.da_ket_noi(expires_at=0, refresh_expires_at=int(time.time()) - 1)
        code, _, err = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        self.assertIn("cần kết nối lại", err)
        self.assertEqual(GIA.calls, [])

    def test_token_bi_thu_hoi(self):
        self.da_ket_noi(access_token="tok-thu-BI-THU-HOI")
        code, _, err = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        self.assertIn("cần kết nối lại", err)
        self.assertNotIn("tok-thu-BI-THU-HOI", err)

    def test_chua_ket_noi(self):
        code, _, err = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        self.assertIn("Chưa kết nối", err)

    def test_loi_quota(self):
        self.da_ket_noi()
        GIA.init_loi = ["spam_risk_too_many_posts"]
        code, _, err = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        self.assertIn("hạn mức", err)

    def test_url_chua_xac_minh(self):
        self.da_ket_noi()
        GIA.init_loi = ["url_ownership_unverified"]
        code, _, err = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        self.assertIn("chưa được xác minh", err)

    def test_anh_sai_kich_thuoc(self):
        self.da_ket_noi()
        GIA.statuses = ["PROCESSING_DOWNLOAD", "FAILED"]
        GIA.fail_reason = "picture_size_check_failed"
        code, out, _ = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        kq = json.loads(out)
        self.assertEqual(kq["trang_thai"], "FAILED")
        self.assertIn("1080px", kq["loi"])

    def test_het_gio_cho(self):
        self.da_ket_noi()
        GIA.statuses = ["PROCESSING_UPLOAD"]
        code, out, _ = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 0)
        self.assertIn("vẫn đang xử lý", json.loads(out)["ghi_chu"])

    def test_bai_sai(self):
        self.da_ket_noi()
        self.ghi(self.bai, {"title": "x" * 91, "images": ["https://example.com/a.jpg", MEDIA + "b.png"],
                            "cover_index": 5})
        code, _, err = self.chay("dang", "--key-file", self.key, "--bai", self.bai)
        self.assertEqual(code, 1)
        for y in ("tối đa 90", "example.com", "phải là JPG", "cover_index"):
            self.assertIn(y, err)
        self.assertEqual(GIA.calls, [], "bài sai thì không gọi TikTok")

    def test_khong_co_file_khoa(self):
        code, _, err = self.chay("dang", "--key-file", os.path.join(self.dir, "khong-co.json"),
                                 "--bai", self.bai)
        self.assertEqual(code, 1)
        self.assertIn("Không thấy file khoá", err)

    def test_khong_co_token_trong_repo(self):
        """File khoá không được nằm trong repo; .gitignore chặn tên mặc định."""
        gi = (GOC / ".gitignore").read_text(encoding="utf-8")
        self.assertIn("tiktok-khoa*.json", gi)


if __name__ == "__main__":
    unittest.main(verbosity=2)

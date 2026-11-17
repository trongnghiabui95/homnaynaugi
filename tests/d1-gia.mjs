// D1 giả lập bằng node:sqlite (Node ≥ 22.5) để kiểm thử functions/api/[[path]].js không cần Cloudflare.
// Chỉ làm phần API mà Function dùng: prepare().bind().first()/all()/run(), exec(), batch().
import { DatabaseSync } from "node:sqlite";

const doiThamSo = (v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v === undefined ? null : v);

export function taoD1(file = ":memory:") {
  const db = new DatabaseSync(file);
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a.map(doiThamSo)),
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args), success: true }; },
    async run() { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
  });
  return {
    prepare: (sql) => stmt(sql),
    async exec(sql) { db.exec(sql); return { count: sql.split("\n").length }; },
    async batch(list) { const out = []; db.exec("BEGIN"); try { for (const s of list) out.push(await s.run()); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; } return out; },
    _db: db,
  };
}

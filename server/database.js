import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

export const now = () => new Date().toISOString();
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, encoded) {
  const [salt, hash] = String(encoded || "").split(":");
  if (!salt || !/^[a-f0-9]{128}$/i.test(hash || "")) return false;
  const actual = scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const publicUser = ({ password_hash, ...safe }) => safe;

export async function openDatabase(options = {}) {
  if (typeof options === "string") options = { filename: options };
  // An explicit SQLite filename keeps tests isolated from a user's SQL Server.
  const driver = options.filename
    ? "sqlite"
    : options.driver || process.env.DB_DRIVER || "sqlite";
  if (driver === "mssql") {
    const { openSqlServer } = await import("./sqlserver-store.js");
    return openSqlServer(options);
  }
  if (driver !== "sqlite")
    throw new Error("DB_DRIVER phải là mssql hoặc sqlite.");
  const { openDatabase: openSqlite } = await import("./sqlite-store.js");
  const base = openSqlite(options.filename);
  const scope = new AsyncLocalStorage();
  let pending = Promise.resolve();
  async function exclusive(fn) {
    if (scope.getStore()) return fn();
    const previous = pending;
    let release;
    pending = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }
  const store = { driver: "sqlite", db: base.db };
  for (const method of ["all", "get", "run", "insert", "update"])
    store[method] = (...args) => exclusive(() => base[method](...args));
  store.transaction = (fn) =>
    exclusive(async () => {
      if (scope.getStore()) return fn();
      base.db.exec("BEGIN IMMEDIATE");
      try {
        const result = await scope.run(true, fn);
        base.db.exec("COMMIT");
        return result;
      } catch (error) {
        base.db.exec("ROLLBACK");
        throw error;
      }
    });
  store.remove = (table, id) =>
    store.run(`DELETE FROM ${table} WHERE id=?`, id);
  return store;
}

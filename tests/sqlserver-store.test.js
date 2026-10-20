import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSqlStore,
  connectionConfig,
  parameterize,
  connectionHint,
} from "../server/sqlserver-store.js";
import { openDatabase, verifyPassword } from "../server/database.js";

function fakePool(handler = () => ({ recordset: [], rowsAffected: [1] })) {
  const events = [];
  let transactions = 0;
  const request = (scope) => {
    const values = {};
    return {
      input(name, type, value) {
        values[name] = { type, value };
        return this;
      },
      async query(statement) {
        const call = { scope, statement, values };
        events.push(call);
        return handler(call);
      },
      async execute(procedure) {
        const call = { scope, procedure, values };
        events.push(call);
        return handler(call);
      },
    };
  };
  return {
    events,
    request: () => request("pool"),
    transaction() {
      const id = `tx${++transactions}`;
      return {
        async begin() {
          events.push({ scope: id, event: "begin" });
        },
        request: () => request(id),
        async commit() {
          events.push({ scope: id, event: "commit" });
        },
        async rollback() {
          events.push({ scope: id, event: "rollback" });
        },
      };
    },
    async close() {},
  };
}

test("SQL values are bound separately, including Unicode and SQL-like text", async () => {
  const pool = fakePool(() => ({
    recordset: [
      { id: 7, is_active: true, created_at: new Date("2026-01-01T00:00:00Z") },
    ],
    rowsAffected: [1],
  }));
  const store = createSqlStore(pool, "test");
  const name = "Nguyễn An'); DROP TABLE users;--";
  const row = await store.insert("users", {
    full_name: name,
    is_active: true,
    phone: null,
  });
  assert.equal(
    pool.events[0].statement,
    "INSERT INTO dbo.[users] ([full_name],[is_active],[phone]) OUTPUT INSERTED.* VALUES (@p0,@p1,@p2)",
  );
  assert.equal(pool.events[0].values.p0.value, name);
  assert.equal(pool.events[0].values.p2.value, null);
  assert.equal(row.is_active, 1);
  assert.equal(row.created_at, "2026-01-01T00:00:00.000Z");
  assert(!pool.events[0].statement.includes(name));
  await assert.rejects(
    store.insert("users;DROP TABLE users", {}),
    /Unknown application table/,
  );
});
test("placeholder scanner skips strings, escaped quotes, identifiers and comments", () => {
  const input = `SELECT '?', 'a''?b', [name?], "other?", ? -- ?\n/* ? */ WHERE id=?`;
  assert.equal(
    parameterize(input, [1, 2]),
    `SELECT '?', 'a''?b', [name?], "other?", @p0 -- ?\n/* ? */ WHERE id=@p1`,
  );
  assert.throws(() => parameterize("SELECT ?", [1, 2]), /parameter count/);
});
test("SQL transaction awaits work, shares nested context and rolls back failures", async () => {
  const pool = fakePool(),
    store = createSqlStore(pool, "test");
  await assert.rejects(
    store.transaction(async () => {
      await store.run("UPDATE users SET full_name=? WHERE id=?", "Tên mới", 7);
      await store.transaction(async () => {
        await store.run("DELETE FROM sessions WHERE user_id=?", 7);
      });
      throw new Error("failed validation");
    }),
    /failed validation/,
  );
  assert.deepEqual(
    pool.events.map((e) => e.event || e.scope),
    ["begin", "tx1", "tx1", "rollback"],
  );
  await store.get("SELECT 1 AS ready");
  assert.equal(pool.events.at(-1).scope, "pool");
});
test("unrelated requests cannot inherit another request transaction", async () => {
  const pool = fakePool(),
    store = createSqlStore(pool, "test");
  let entered, release;
  const ready = new Promise((r) => {
      entered = r;
    }),
    continueTx = new Promise((r) => {
      release = r;
    });
  const tx = store.transaction(async () => {
    entered();
    await continueTx;
    await store.get("SELECT 2 AS value");
  });
  await ready;
  await store.get("SELECT 1 AS value");
  release();
  await tx;
  assert.equal(
    pool.events.find((e) => e.statement === "SELECT 1 AS value").scope,
    "pool",
  );
  assert.equal(
    pool.events.find((e) => e.statement === "SELECT 2 AS value").scope,
    "tx1",
  );
});
test("deadlock retry starts a fresh SQL transaction without committing the victim", async () => {
  let calls = 0;
  const pool = fakePool(() => {
    if (++calls === 1)
      throw Object.assign(new Error("deadlock"), { number: 1205 });
    return { recordset: [], rowsAffected: [1] };
  });
  const store = createSqlStore(pool, "test");
  await store.transaction(() =>
    store.run("UPDATE users SET is_active=? WHERE id=?", 1, 7),
  );
  assert.deepEqual(
    pool.events.filter((e) => e.event).map((e) => [e.scope, e.event]),
    [
      ["tx1", "begin"],
      ["tx1", "rollback"],
      ["tx2", "begin"],
      ["tx2", "commit"],
    ],
  );
});
test("deleting an exercise with submissions preserves required attempt source IDs", async () => {
  const pool = fakePool(() => ({ recordset: [{ id: 9 }], rowsAffected: [] }));
  const store = createSqlStore(pool, "test");
  await assert.rejects(
    store.remove("exercises", 3),
    (error) => error.status === 409,
  );
  assert(!pool.events.some((e) => e.statement?.includes("DELETE")));
  assert.equal(pool.events.at(-1).event, "rollback");
});
test("progress uses the procedure already installed by the supplied SQL script", async () => {
  const pool = fakePool(() => ({
    recordset: [{ is_completed: true, time_spent: 120 }],
    rowsAffected: [1],
  }));
  const store = createSqlStore(pool, "test");
  const result = await store.recordProgress({
    studentId: 13,
    lessonId: 1,
    sessionId: "3e741914-6f95-4d74-9f70-d8eb26a3e468",
    seconds: 120,
    complete: 1,
  });
  const call = pool.events[0];
  assert.equal(call.procedure, "dbo.usp_RecordLessonProgress");
  assert.equal(call.values.StudentId.value, 13);
  assert.equal(call.values.Seconds.value, 120);
  assert.equal(result.is_completed, 1);
});
test("connection supports fixed TCP port and named instances, with explicit TLS settings", (t) => {
  const keys = [
    "DB_SERVER",
    "DB_PORT",
    "DB_DATABASE",
    "DB_USER",
    "DB_PASSWORD",
    "DB_INSTANCE",
    "DB_ENCRYPT",
    "DB_TRUST_SERVER_CERTIFICATE",
  ];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  t.after(() => {
    for (const [key, value] of Object.entries(saved))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  });
  for (const k of keys) delete process.env[k];
  assert.throws(() => connectionConfig(), /DB_PASSWORD/);
  process.env.DB_PASSWORD = "unit-test-placeholder";
  assert.equal(connectionConfig().database, "ELearningEnglish_Demo");
  assert.equal(connectionConfig().port, 1433);
  assert.equal(connectionConfig().options.encrypt, true);
  assert.equal(connectionConfig().options.trustServerCertificate, false);
  process.env.DB_SERVER = "my-machine\\SQLEXPRESS";
  process.env.DB_TRUST_SERVER_CERTIFICATE = "true";
  assert.equal(connectionConfig().options.instanceName, "SQLEXPRESS");
  assert.equal(connectionConfig().options.trustServerCertificate, true);
  assert(!("port" in connectionConfig()));
});
test("an invalid SQL configuration never falls back to a new SQLite database", async () => {
  const previous = process.env.DB_PASSWORD;
  delete process.env.DB_PASSWORD;
  try {
    await assert.rejects(openDatabase({ driver: "mssql" }), /DB_PASSWORD/);
  } finally {
    if (previous !== undefined) process.env.DB_PASSWORD = previous;
  }
  assert.equal(verifyPassword("EnglishDemo!2026", "broken hash"), false);
  assert.match(connectionHint({ code: "ETIMEOUT" }), /TCP/);
});

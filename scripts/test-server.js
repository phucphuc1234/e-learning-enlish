import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../server/app.js";
import { seedDemo } from "../server/seed.js";

const dir = mkdtempSync(join(tmpdir(), "english-browser-"));
const app = createApp({
  filename: join(dir, "test.sqlite"),
  disableRateLimit: true,
});
seedDemo(app.locals.store);
const server = app.listen(4173, "127.0.0.1");
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      app.locals.store.db.close();
      rmSync(dir, { recursive: true, force: true });
      process.exit(0);
    }),
  );

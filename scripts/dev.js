import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["--watch", "server/index.js"], {
    stdio: "inherit",
    env: { ...process.env, PORT: process.env.PORT || "5000" },
  }),
  spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"],
    { stdio: "inherit" },
  ),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((p) => p.kill("SIGTERM"));
  setTimeout(() => process.exit(code), 300).unref();
}
children.forEach((p) => p.on("exit", (code) => stop(code || 0)));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

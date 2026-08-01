/**
 * Local Android build wrapper.
 * Uses a short GRADLE_USER_HOME to avoid Windows MAX_PATH failures
 * during native CMake/ninja builds.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const gradleHome = "C:\\g";
fs.mkdirSync(gradleHome, { recursive: true });

const expoCli = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo",
  "bin",
  "cli",
);

const child = spawn(
  process.execPath,
  ["--require", path.join(__dirname, "patch-node-style-text.cjs"), expoCli, "run:android", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      GRADLE_USER_HOME: gradleHome,
    },
    shell: false,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

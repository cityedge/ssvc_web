import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline";
import { once } from "node:events";
import { startLocalServer } from "./local-server.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
// Release packages serve their prebuilt index.html directly, without npm or build tools.
const packaged = args.includes("--packaged");
const directory = packaged ? root : join(root, "dist");
const port = args.includes("--port")
  ? Number(args[args.indexOf("--port") + 1])
  : 5178;
const origin = `http://127.0.0.1:${port}`;
const instance = createHash("sha256").update(root.toLowerCase()).digest("hex");
const run = (script, ...args) =>
  execFileSync(process.execPath, [join(root, script), ...args], {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
async function buildIfNeeded() {
  const hash = createHash("sha256");
  async function add(path) {
    const entries = await readdir(join(root, path), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const name = join(path, entry.name);
      if (entry.isDirectory()) await add(name);
      else {
        hash.update(name);
        hash.update(await readFile(join(root, name)));
      }
    }
  }
  for (const folder of ["src", "public", "vendor"]) await add(folder);
  for (const name of [
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
  ])
    hash.update(await readFile(join(root, name)));
  const digest = hash.digest("hex");
  const stamp = join(root, "dist/.ssvc-build");
  if (
    existsSync(join(root, "dist/index.html")) &&
    (await readFile(stamp, "utf8").catch(() => null)) === digest
  )
    return;
  console.log("Building SSVC / SSVCをビルドしています…");
  run("node_modules/typescript/bin/tsc", "--noEmit");
  run("node_modules/vite/bin/vite.js", "build");
  await writeFile(stamp, digest);
}
function openBrowser() {
  if (args.includes("--no-open")) return;
  const browsers = [
    join(
      process.env.ProgramFiles || "",
      "Google/Chrome/Application/chrome.exe",
    ),
    join(
      process.env["ProgramFiles(x86)"] || "",
      "Microsoft/Edge/Application/msedge.exe",
    ),
    join(
      process.env.LOCALAPPDATA || "",
      "Google/Chrome/Application/chrome.exe",
    ),
  ];
  const exe = browsers.find(existsSync);
  const child = exe
    ? spawn(exe, [origin], { stdio: "ignore", windowsHide: true })
    : spawn(
        process.env.ComSpec || "cmd.exe",
        ["/d", "/c", "start", "", origin],
        { stdio: "ignore", windowsHide: true },
      );
  child.on("error", (e) =>
    console.error(`Browser: ${e.message}. Open ${origin}`),
  );
  child.unref();
}
async function main() {
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid port");
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error("Node.js 22.12 or later is required.");
  let existing;
  let occupied = false;
  try {
    const response = await fetch(origin + "/__ssvc_local__/status", {
      signal: AbortSignal.timeout(1200),
    });
    occupied = true;
    existing = await response.json();
  } catch {}
  if (
    occupied &&
    (existing?.app !== "ssvc-web-local" || existing?.instance !== instance)
  )
    throw new Error(
      `Port ${port} is used by another application. Close its server first.`,
    );
  let local;
  if (!existing) {
    if (!packaged && !args.includes("--no-build")) await buildIfNeeded();
    if (!existsSync(join(directory, "index.html")))
      throw new Error("index.html is missing. Extract the entire SSVC package first.");
    local = await startLocalServer({
      directory,
      port,
      instance,
    });
  }
  console.log(
    `\nSSVC ${origin}\n画面の「ローカルサーバーを停止」、またはこの画面で Q + Enter / Ctrl+C で終了します。\nStop using the app button, Q + Enter, or Ctrl+C. Closing a browser tab does not stop the server.\n${existing ? "起動済みのSSVCを開きます / Reusing the running SSVC server." : ""}`,
  );
  openBrowser();
  const input = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const stop = async () => {
    if (local) {
      local.server.close();
      local.server.closeIdleConnections();
      setTimeout(() => local.server.closeAllConnections(), 100).unref();
    } else {
      await fetch(origin + "/__ssvc_local__/stop", {
        method: "POST",
        headers: { Origin: origin, "X-SSVC-Token": existing.token },
      }).catch(() => {});
      input.close();
      process.stdin.pause();
    }
  };
  input.on("line", (line) => {
    if (line.trim().toLowerCase() === "q") void stop();
  });
  input.on("SIGINT", () => void stop());
  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
  if (local) {
    await once(local.server, "close");
    input.close();
    process.stdin.pause();
    console.log("SSVCサーバーを停止しました / SSVC server stopped.");
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

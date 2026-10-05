import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat, realpath } from "node:fs/promises";
import { resolve, relative, extname, isAbsolute } from "node:path";
import { randomBytes } from "node:crypto";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};
export async function startLocalServer({
  directory,
  port = 5178,
  instance = "ssvc-web",
}) {
  const root = await realpath(directory);
  const token = randomBytes(32).toString("hex");
  let origin;
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const reply = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    // Loopback binding plus an exact Host/Origin check prevents remote sites from controlling this server.
    if (req.headers.host !== new URL(origin).host)
      return reply(403, { error: "Host rejected" });
    if (req.headers.origin && req.headers.origin !== origin)
      return reply(403, { error: "Origin rejected" });
    if (req.headers["sec-fetch-site"] === "cross-site")
      return reply(403, { error: "Cross-site request rejected" });
    const pathname = new URL(req.url, origin).pathname;
    if (pathname === "/__ssvc_local__/status" && req.method === "GET")
      return reply(200, { app: "ssvc-web-local", instance, token });
    if (pathname === "/__ssvc_local__/stop" && req.method === "POST") {
      if (
        req.headers.origin !== origin ||
        req.headers["x-ssvc-token"] !== token
      )
        return reply(403, { error: "Token rejected" });
      res.once("finish", () => {
        server.close();
        server.closeIdleConnections();
        // Chrome may preconnect without sending a request; those sockets are not "idle" HTTP connections.
        setTimeout(() => server.closeAllConnections(), 100).unref();
      });
      return reply(200, { stopped: true });
    }
    if (!["GET", "HEAD"].includes(req.method))
      return reply(405, { error: "Method not allowed" });
    try {
      const decoded = decodeURIComponent(pathname);
      if (
        decoded.includes("\\") ||
        decoded.includes("\0") ||
        decoded.split("/").some((p) => p.startsWith("."))
      )
        return reply(404, { error: "Not found" });
      const file = await realpath(
        resolve(root, "." + (decoded === "/" ? "/index.html" : decoded)),
      );
      const rel = relative(root, file);
      if (rel.startsWith("..") || isAbsolute(rel))
        return reply(404, { error: "Not found" });
      const info = await stat(file);
      if (!info.isFile()) return reply(404, { error: "Not found" });
      res.writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
        "Content-Length": info.size,
      });
      if (req.method === "HEAD") return res.end();
      const stream = createReadStream(file);
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } catch {
      reply(404, { error: "Not found" });
    }
  });
  await new Promise((yes, no) => {
    server.once("error", no);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", no);
      yes();
    });
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  return { server, origin, token };
}

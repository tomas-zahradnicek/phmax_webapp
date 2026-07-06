/**
 * Statický preview server pro Playwright E2E – stejná logika servírování dist/
 * jako verify-seo-routing.mjs (nested index.html, 404.html, legacy ?view= redirecty).
 *
 *   node scripts/e2e-static-preview.mjs
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLegacyViewRedirect } from "../legacy-view-redirect.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? "4173");

const MIME_BY_EXT = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function contentTypeFor(filePath) {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function resolveDistFile(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") {
    return path.join(distDir, "index.html");
  }

  const relative = normalized.slice(1);
  const directPath = path.join(distDir, relative);
  if (existsSync(directPath) && statSync(directPath).isFile()) {
    return directPath;
  }

  const indexPath = path.join(distDir, relative, "index.html");
  if (existsSync(indexPath)) {
    return indexPath;
  }

  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${host}:${port}`);
  const legacyRedirect = resolveLegacyViewRedirect(url.href);
  if (legacyRedirect) {
    res.statusCode = 308;
    res.setHeader("Location", legacyRedirect);
    res.end("Redirect");
    return;
  }

  const filePath = resolveDistFile(url.pathname);
  if (filePath) {
    res.statusCode = 200;
    res.setHeader("Content-Type", contentTypeFor(filePath));
    createReadStream(filePath).pipe(res);
    return;
  }

  const notFoundPath = path.join(distDir, "404.html");
  if (existsSync(notFoundPath)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    createReadStream(notFoundPath).pipe(res);
    return;
  }

  res.statusCode = 404;
  res.end("Not Found");
});

server.listen(port, host, () => {
  console.log(`E2E static preview: http://${host}:${port}`);
});

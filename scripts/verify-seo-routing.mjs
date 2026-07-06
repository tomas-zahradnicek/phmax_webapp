import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
let origin = "http://127.0.0.1:4175";

const legacyRedirectMap = new Map([
  ["pv", "/phmax-predskolni-vzdelavani"],
  ["sd", "/phmax-skolni-druzina"],
  ["zs", "/phmax-zakladni-skola"],
  ["ss", "/phmax-stredni-skola"],
  ["nv75", "/banka-odpoctu-zastupcu-reditele"],
  ["dash", "/prehled"],
]);

const expected200Routes = [
  "/prehled",
  "/phmax-predskolni-vzdelavani",
  "/phmax-skolni-druzina",
  "/phmax-zakladni-skola",
  "/phmax-stredni-skola",
  "/banka-odpoctu-zastupcu-reditele",
  "/navod",
  "/vyrocni-zprava",
  "/profil-skoly",
  "/phmax-predskolni-vzdelavani/rychly",
  "/phmax-skolni-druzina/rychly",
  "/phmax-zakladni-skola/rychly",
  "/vyrocni-zprava/nahled",
];

function resolveFile(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const candidates =
    normalized === "/"
      ? [path.join(distDir, "index.html")]
      : [path.join(distDir, normalized.slice(1), "index.html"), path.join(distDir, normalized.slice(1))];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function keepQueryWithoutView(searchParams) {
  const copy = new URLSearchParams(searchParams);
  copy.delete("view");
  const raw = copy.toString();
  return raw ? `?${raw}` : "";
}

function startsWithKnownRoute(pathname) {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return expected200Routes.some((route) => norm === route || norm.startsWith(`${route}/`));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", origin);
  const pathname = url.pathname;

  if (url.searchParams.has("view")) {
    const target = legacyRedirectMap.get(url.searchParams.get("view"));
    if (target) {
      res.statusCode = 308;
      res.setHeader("Location", `${target}${keepQueryWithoutView(url.searchParams)}`);
      res.end("Redirect");
      return;
    }
  }

  if (pathname === "/") {
    res.statusCode = 308;
    res.setHeader("Location", "/prehled");
    res.end("Redirect");
    return;
  }

  const filePath = resolveFile(pathname);
  if (filePath) {
    res.statusCode = 200;
    res.setHeader("Content-Type", filePath.endsWith(".xml") ? "application/xml" : "text/html; charset=utf-8");
    createReadStream(filePath).pipe(res);
    return;
  }

  // Explicit 404 page for unknown routes (no silent fallback to /prehled).
  const notFoundPath = path.join(distDir, "404.html");
  if (existsSync(notFoundPath)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    createReadStream(notFoundPath).pipe(res);
    return;
  }

  res.statusCode = startsWithKnownRoute(pathname) ? 200 : 404;
  res.end(res.statusCode === 404 ? "Not Found" : "OK");
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") {
  throw new Error("Unable to resolve local verification server address.");
}
origin = `http://127.0.0.1:${address.port}`;

async function fetchOne(pathname, { redirect = "manual" } = {}) {
  const response = await fetch(`${origin}${pathname}`, { redirect });
  const text = await response.text();
  const robots = text.match(/name="robots"\s+content="([^"]+)"/i)?.[1] ?? "-";
  const canonical = text.match(/rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? "-";
  return { status: response.status, location: response.headers.get("location") ?? "-", robots, canonical, text };
}

const checks = [];

checks.push({
  url: "/",
  expectedStatus: "308/301",
  expectedLocation: "/prehled",
  ...(await fetchOne("/", { redirect: "manual" })),
});

for (const route of expected200Routes) {
  checks.push({
    url: route,
    expectedStatus: "200",
    expectedLocation: "-",
    ...(await fetchOne(route)),
  });
}

const notFound = await fetchOne("/neexistuje-seo-route-404");
checks.push({
  url: "/neexistuje-seo-route-404",
  expectedStatus: "404",
  expectedLocation: "-",
  ...notFound,
});

const legacyChecks = [
  ["/?view=zs", "/phmax-zakladni-skola"],
  ["/prehled?view=zs", "/phmax-zakladni-skola"],
  ["/?view=pv", "/phmax-predskolni-vzdelavani"],
  ["/?view=sd", "/phmax-skolni-druzina"],
  ["/?view=ss", "/phmax-stredni-skola"],
  ["/?view=nv75", "/banka-odpoctu-zastupcu-reditele"],
  ["/?view=dash", "/prehled"],
];

for (const [source, destination] of legacyChecks) {
  const redirectResult = await fetchOne(source, { redirect: "manual" });
  checks.push({
    url: source,
    expectedStatus: "308/301",
    expectedLocation: destination,
    ...redirectResult,
  });
  const target = await fetchOne(destination);
  checks.push({
    url: `${destination} (target)`,
    expectedStatus: "200",
    expectedLocation: "-",
    ...target,
  });
}

server.close();

let hasFailure = false;
for (const check of checks) {
  const statusOk =
    check.expectedStatus === "200"
      ? check.status === 200
      : check.expectedStatus === "404"
        ? check.status === 404
        : check.status === 308 || check.status === 301;
  const locationOk =
    check.expectedLocation === "-" ? true : check.location.startsWith(check.expectedLocation);
  const noCanonicalToPrehled = check.url.includes("neexistuje") ? !check.canonical.includes("/prehled") : true;
  const noindexOn404 =
    check.url.includes("neexistuje") || check.url === "/vyrocni-zprava/nahled"
      ? check.robots.includes("noindex")
      : true;
  const pass = statusOk && locationOk && noCanonicalToPrehled && noindexOn404;
  hasFailure ||= !pass;
  console.log(
    [
      check.url,
      check.expectedStatus,
      String(check.status),
      check.location,
      check.robots,
      pass ? "OK" : "FAIL",
    ].join(" | "),
  );
}

if (hasFailure) {
  console.error("SEO routing verification failed.");
  process.exit(1);
}

const notFoundStat = await stat(path.join(distDir, "404.html"));
if (notFoundStat.size < 300) {
  console.error("404 page looks too small.");
  process.exit(1);
}

console.log("SEO routing verification passed.");

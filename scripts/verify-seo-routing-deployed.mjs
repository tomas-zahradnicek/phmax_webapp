/**
 * Read-only production SEO / routing smoke checks.
 *
 * Required env:
 *   SEO_SMOKE_BASE_URL=https://app.reditelskypruvodce.cz
 *
 * Does not deploy, mutate production, or write application data.
 */

function fail(details) {
  const lines = [
    "Deployed SEO smoke check failed.",
    `URL: ${details.url}`,
    `Expected status: ${details.expectedStatus}`,
    `Actual status: ${details.actualStatus}`,
    `Location: ${details.location ?? "-"}`,
    `Reason: ${details.reason}`,
  ];
  console.error(lines.join("\n"));
  process.exit(1);
}

function extractCanonical(html) {
  return html.match(/rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? "";
}

function extractRobots(html) {
  return html.match(/name="robots"\s+content="([^"]+)"/i)?.[1] ?? "";
}

function includesNoindex(html) {
  return extractRobots(html).toLowerCase().includes("noindex");
}

function extractH1(html) {
  return html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function isTargetLocation(locationHeader, expectedPath) {
  if (!locationHeader) return false;
  if (locationHeader.startsWith(expectedPath)) return true;
  try {
    const parsed = new URL(locationHeader);
    return parsed.pathname === expectedPath;
  } catch {
    return false;
  }
}

const baseUrlRaw = process.env.SEO_SMOKE_BASE_URL;
if (!baseUrlRaw) {
  console.error("Missing required environment variable SEO_SMOKE_BASE_URL.");
  process.exit(1);
}

const baseUrl = new URL(baseUrlRaw);
const expectedModulePath = "/phmax-zakladni-skola";
const missingRoutePath = "/__seo-smoke-route-that-does-not-exist__";

/** Indexable public pages (must match sitemap canonical set). */
const INDEXABLE_PAGES = [
  {
    path: "/kalkulacky-phmax",
    canonicalPath: "/kalkulacky-phmax",
    h1: "Kalkulačky PHmax a nástroje pro ředitele škol",
  },
  {
    path: "/phmax-predskolni-vzdelavani",
    canonicalPath: "/phmax-predskolni-vzdelavani",
    h1: "Kalkulačka PHmax a PHAmax pro mateřskou školu",
  },
  {
    path: "/phmax-skolni-druzina",
    canonicalPath: "/phmax-skolni-druzina",
    h1: "Kalkulačka PHmax pro školní družinu",
  },
  {
    path: "/phmax-zakladni-skola",
    canonicalPath: "/phmax-zakladni-skola",
    h1: "Kalkulačka PHmax, PHAmax a PHPmax pro základní školu",
  },
  {
    path: "/phmax-stredni-skola",
    canonicalPath: "/phmax-stredni-skola",
    h1: "Kalkulačka PHmax pro střední školu",
  },
  {
    path: "/banka-odpoctu-zastupcu-reditele",
    canonicalPath: "/banka-odpoctu-zastupcu-reditele",
    h1: "Výpočet banky odpočtů zástupců ředitele školy",
  },
  {
    path: "/navod",
    canonicalPath: "/navod",
    h1: "Návod k použití",
  },
  {
    path: "/vyrocni-zprava",
    canonicalPath: "/vyrocni-zprava",
    h1: "Výroční zpráva školy – příprava po kapitolách",
  },
];

const LITE_PAGES = [
  {
    path: "/phmax-predskolni-vzdelavani/rychly",
    canonicalPath: "/phmax-predskolni-vzdelavani",
  },
  {
    path: "/phmax-skolni-druzina/rychly",
    canonicalPath: "/phmax-skolni-druzina",
  },
  {
    path: "/phmax-zakladni-skola/rychly",
    canonicalPath: "/phmax-zakladni-skola",
  },
];

const EXPECTED_SITEMAP_PATHS = INDEXABLE_PAGES.map((page) => page.path);

async function fetchCheck(path, options = {}) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, options);
  const body = await response.text();
  return { url: url.toString(), response, body };
}

function assertStatus(result, expectedStatus, reason) {
  if (result.response.status !== expectedStatus) {
    fail({
      url: result.url,
      expectedStatus: String(expectedStatus),
      actualStatus: String(result.response.status),
      location: result.response.headers.get("location"),
      reason,
    });
  }
}

{
  const { url, response } = await fetchCheck("/", { redirect: "manual" });
  const location = response.headers.get("location");
  if (response.status !== 308 && response.status !== 301) {
    fail({
      url,
      expectedStatus: "308 or 301",
      actualStatus: String(response.status),
      location,
      reason: "Root path must redirect to /kalkulacky-phmax.",
    });
  }
  if (!isTargetLocation(location, "/kalkulacky-phmax")) {
    fail({
      url,
      expectedStatus: "Location /kalkulacky-phmax",
      actualStatus: String(response.status),
      location,
      reason: "Root redirect location is not /kalkulacky-phmax.",
    });
  }
}

for (const page of INDEXABLE_PAGES) {
  const result = await fetchCheck(page.path, { redirect: "follow" });
  assertStatus(result, 200, `Indexable page ${page.path} must return 200.`);
  const finalPath = new URL(result.response.url).pathname.replace(/\/+$/, "") || "/";
  if (finalPath === "/prehled") {
    fail({
      url: result.url,
      expectedStatus: "200 without redirect to /prehled",
      actualStatus: String(result.response.status),
      location: result.response.headers.get("location"),
      reason: `Valid page ${page.path} redirected to /prehled.`,
    });
  }
  if (includesNoindex(result.body)) {
    fail({
      url: result.url,
      expectedStatus: "indexable robots (no noindex)",
      actualStatus: String(result.response.status),
      reason: `Indexable page ${page.path} unexpectedly contains noindex.`,
    });
  }
  const canonical = extractCanonical(result.body);
  const expectedCanonical = new URL(page.canonicalPath, baseUrl).href;
  if (canonical !== expectedCanonical) {
    fail({
      url: result.url,
      expectedStatus: `canonical ${expectedCanonical}`,
      actualStatus: String(result.response.status),
      reason: `Canonical mismatch on ${page.path}: got "${canonical}".`,
    });
  }
  const h1 = extractH1(result.body);
  if (h1 !== page.h1) {
    fail({
      url: result.url,
      expectedStatus: `H1 ${page.h1}`,
      actualStatus: String(result.response.status),
      reason: `H1 mismatch on ${page.path}: got "${h1}".`,
    });
  }
}

for (const page of LITE_PAGES) {
  const result = await fetchCheck(page.path, { redirect: "follow" });
  assertStatus(result, 200, `Lite page ${page.path} must return 200.`);
  if (!includesNoindex(result.body)) {
    fail({
      url: result.url,
      expectedStatus: "noindex",
      actualStatus: String(result.response.status),
      reason: `Lite page ${page.path} must include noindex.`,
    });
  }
  const canonical = extractCanonical(result.body);
  const expectedCanonical = new URL(page.canonicalPath, baseUrl).href;
  if (canonical !== expectedCanonical) {
    fail({
      url: result.url,
      expectedStatus: `canonical ${expectedCanonical}`,
      actualStatus: String(result.response.status),
      reason: `Lite canonical mismatch on ${page.path}: got "${canonical}".`,
    });
  }
}

{
  const { url, response, body } = await fetchCheck(missingRoutePath, { redirect: "manual" });
  const canonical = extractCanonical(body);
  if (response.status !== 404) {
    fail({
      url,
      expectedStatus: "404",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "Missing route must return 404.",
    });
  }
  if (!includesNoindex(body)) {
    fail({
      url,
      expectedStatus: "404 page containing noindex",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "404 page does not include noindex robots directive.",
    });
  }
  if (canonical.includes("/prehled")) {
    fail({
      url,
      expectedStatus: "404 page without canonical /prehled",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "404 page contains canonical pointing to /prehled.",
    });
  }
}

{
  const robots = await fetchCheck("/robots.txt", { redirect: "follow" });
  assertStatus(robots, 200, "robots.txt must return 200.");
  const sitemap = await fetchCheck("/sitemap.xml", { redirect: "follow" });
  assertStatus(sitemap, 200, "sitemap.xml must return 200.");

  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    try {
      return new URL(match[1]).pathname.replace(/\/+$/, "") || "/";
    } catch {
      return match[1];
    }
  });

  if (locs.length !== EXPECTED_SITEMAP_PATHS.length) {
    fail({
      url: sitemap.url,
      expectedStatus: `${EXPECTED_SITEMAP_PATHS.length} canonical URLs`,
      actualStatus: String(sitemap.response.status),
      reason: `Sitemap contains ${locs.length} URLs; expected ${EXPECTED_SITEMAP_PATHS.length}.`,
    });
  }

  for (const expectedPath of EXPECTED_SITEMAP_PATHS) {
    if (!locs.includes(expectedPath)) {
      fail({
        url: sitemap.url,
        expectedStatus: `include ${expectedPath}`,
        actualStatus: String(sitemap.response.status),
        reason: `Sitemap is missing canonical path ${expectedPath}.`,
      });
    }
  }

  if (locs.some((path) => path.includes("/rychly"))) {
    fail({
      url: sitemap.url,
      expectedStatus: "no /rychly URLs",
      actualStatus: String(sitemap.response.status),
      reason: "Sitemap must not include /rychly paths.",
    });
  }

  if (sitemap.body.includes("?view=")) {
    fail({
      url: sitemap.url,
      expectedStatus: "no ?view= URLs",
      actualStatus: String(sitemap.response.status),
      reason: "Sitemap must not include legacy ?view= URLs.",
    });
  }
}

{
  const sourcePath = "/?view=zs";
  const manual = await fetchCheck(sourcePath, { redirect: "manual" });
  const location = manual.response.headers.get("location");
  if (manual.response.status !== 308 && manual.response.status !== 301) {
    fail({
      url: manual.url,
      expectedStatus: "308 or 301",
      actualStatus: String(manual.response.status),
      location,
      reason: "Legacy query route must redirect.",
    });
  }
  if (!isTargetLocation(location, expectedModulePath)) {
    fail({
      url: manual.url,
      expectedStatus: `Location to ${expectedModulePath}`,
      actualStatus: String(manual.response.status),
      location,
      reason: "Redirect location does not match expected target path.",
    });
  }
  if (location && location.includes("view=")) {
    fail({
      url: manual.url,
      expectedStatus: "Location without view query param",
      actualStatus: String(manual.response.status),
      location,
      reason: "Redirect location still contains view query parameter.",
    });
  }

  const followed = await fetchCheck(sourcePath, { redirect: "follow" });
  const finalPath = new URL(followed.response.url).pathname;
  if (followed.response.status !== 200) {
    fail({
      url: followed.url,
      expectedStatus: "200 after following redirect",
      actualStatus: String(followed.response.status),
      location: followed.response.headers.get("location"),
      reason: "Final response after redirect is not 200.",
    });
  }
  if (finalPath !== expectedModulePath) {
    fail({
      url: followed.url,
      expectedStatus: `Final URL path ${expectedModulePath}`,
      actualStatus: String(followed.response.status),
      location: followed.response.headers.get("location"),
      reason: `Final URL path is ${finalPath}.`,
    });
  }
  const finalSearch = new URL(followed.response.url).search;
  if (finalSearch.includes("view=")) {
    fail({
      url: followed.url,
      expectedStatus: "Final URL without view query param",
      actualStatus: String(followed.response.status),
      location: followed.response.headers.get("location"),
      reason: "Final URL still contains view query parameter.",
    });
  }
}

console.log(`Deployed SEO smoke checks passed for ${baseUrl.origin}`);

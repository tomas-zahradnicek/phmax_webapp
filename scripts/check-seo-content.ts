import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPhmaxSitemapXml,
  listPhmaxSitemapUrls,
  PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD,
} from "../src/phmax-document-head";
import { KALKULACKY_PHMAX_PATH } from "../src/phmax-landing-paths";
import {
  getRouteSeoContent,
  SEO_PRERENDER_CONTENT_PATHS,
} from "../src/phmax-route-seo-content";
import { VYROCNI_ZPRAVA_SEO_FAQ, VYROCNI_ZPRAVA_SEO_H1 } from "../src/vyrocni-zprava-seo-content";
import { USER_GUIDE_PATH, VYROCNI_ZPRAVA_PATH } from "../src/calculator-ui-constants";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");

function readBuiltHtml(routePath: string): string {
  const filePath = path.join(distDir, routePath.replace(/^\//, ""), "index.html");
  return readFileSync(filePath, "utf8");
}

function countMatches(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractRobots(html: string): string {
  const match = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
  return match?.[1] ?? "";
}

function hasJsonLdType(html: string, type: string): boolean {
  return new RegExp(`"@type"\\s*:\\s*"${type}"`).test(html);
}

function hasDashFaqQuestion(html: string): boolean {
  return html.includes("Proč se liší součet a modul ZŠ?");
}

function extractCanonical(html: string): string {
  const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return match?.[1] ?? "";
}

function parseJsonLdBlocks(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks.push(JSON.parse(match[1]!));
  }
  return blocks;
}

let failures = 0;

function fail(label: string): void {
  failures += 1;
  console.error(`FAIL ${label}`);
}

function ok(label: string): void {
  console.log(`OK ${label}`);
}

for (const routePath of SEO_PRERENDER_CONTENT_PATHS) {
  const html = readBuiltHtml(routePath);
  const content = getRouteSeoContent(routePath);
  if (!content) {
    fail(`${routePath} | missing route SEO content config`);
    continue;
  }

  const noscriptMatch = html.match(/<noscript>([\s\S]*?)<\/noscript>/i);
  const noscriptHasH1 = noscriptMatch ? /<h1\b/i.test(noscriptMatch[1]) : false;

  const checks: [string, boolean][] = [
    ["#seo-prerender-content present", html.includes('id="seo-prerender-content"')],
    ["single H1 in document", countMatches(html, /<h1\b/gi) === 1],
    ["H1 not in noscript", !noscriptHasH1],
    ["route H1 present", html.includes(`<h1>${escapeHtml(content.h1)}</h1>`)],
    ["<main> present", /<main\b/i.test(html)],
    ["breadcrumb nav", /aria-label="Drobečková navigace"/i.test(html)],
    ["at least three internal links", countMatches(html, /<a\s+href="\/[^"]*"/gi) >= 3],
    ["#root present", html.includes('id="root"')],
    ["title present", /<title>[\s\S]*?<\/title>/i.test(html)],
    ["description present", /<meta\s+name="description"/i.test(html)],
    ["canonical present", /<link\s+rel="canonical"/i.test(html)],
    ["robots present", /<meta\s+name="robots"/i.test(html)],
    ["no localStorage data", !/localStorage/i.test(html)],
  ];

  if (routePath === VYROCNI_ZPRAVA_PATH) {
    checks.push(
      ["at least four H2", countMatches(html, /<h2\b/gi) >= 4],
      ["route-specific FAQ present", /Nejčastější otázky/i.test(html)],
      ["vyrocni FAQ question", html.includes(escapeHtml(VYROCNI_ZPRAVA_SEO_FAQ[0]!.question))],
      ["no dash FAQ", !hasDashFaqQuestion(html)],
    );
  } else if (routePath === KALKULACKY_PHMAX_PATH) {
    checks.push(
      ["WebSite schema", hasJsonLdType(html, "WebSite")],
      ["no SoftwareApplication", !hasJsonLdType(html, "SoftwareApplication")],
      ["links to ZS calculator", html.includes('href="/phmax-zakladni-skola"')],
      ["links to PV calculator", html.includes('href="/phmax-predskolni-vzdelavani"')],
    );
  } else {
    checks.push(
      ["at least two H2", countMatches(html, /<h2\b/gi) >= 2],
      ["FAQ present when configured", content.faq.length === 0 || /Nejčastější otázky/i.test(html)],
      ["breadcrumb root to landing", html.includes('href="/kalkulacky-phmax"')],
    );
  }

  let routeFailed = false;
  for (const [label, pass] of checks) {
    if (!pass) {
      routeFailed = true;
      fail(`${routePath} | ${label}`);
    }
  }

  if (!routeFailed) {
    ok(`${routePath} | H1: ${content.h1}`);
  }
}

const indexingChecks: [string, string, { robots: string; inSitemap: boolean; noDashFaq?: boolean; noSoftware?: boolean }][] =
  [
    ["/prehled", "noindex dashboard", { robots: "noindex, follow", inSitemap: false, noDashFaq: false }],
    ["/profil-skoly", "noindex profile", { robots: "noindex, follow", inSitemap: false, noSoftware: true, noDashFaq: true }],
    ["/vyrocni-zprava", "index vyrocni", { robots: "index, follow", inSitemap: true, noDashFaq: true }],
    ["/vyrocni-zprava/nahled", "noindex preview", { robots: "noindex, follow", inSitemap: false, noSoftware: true, noDashFaq: true }],
    [KALKULACKY_PHMAX_PATH, "index landing", { robots: "index, follow", inSitemap: true }],
    ["/phmax-zakladni-skola/rychly", "noindex zs lite", { robots: "noindex, follow", inSitemap: false, noSoftware: true }],
    ["/phmax-predskolni-vzdelavani/rychly", "noindex pv lite", { robots: "noindex, follow", inSitemap: false, noSoftware: true }],
    ["/phmax-skolni-druzina/rychly", "noindex sd lite", { robots: "noindex, follow", inSitemap: false, noSoftware: true }],
  ];

const sitemapXml = buildPhmaxSitemapXml();
const sitemapUrls = listPhmaxSitemapUrls();

for (const [routePath, label, expected] of indexingChecks) {
  const html = readBuiltHtml(routePath);
  const robots = extractRobots(html);
  const canonicalPath = routePath;
  const inSitemap = sitemapUrls.some((url) => new URL(url).pathname.replace(/\/+$/, "") === canonicalPath);

  if (!robots.includes(expected.robots)) {
    fail(`${label} | robots expected "${expected.robots}", got "${robots}"`);
  } else {
    ok(`${label} | robots ${expected.robots}`);
  }

  if (inSitemap !== expected.inSitemap) {
    fail(`${label} | sitemap expected ${expected.inSitemap}, got ${inSitemap}`);
  } else {
    ok(`${label} | sitemap ${expected.inSitemap ? "present" : "absent"}`);
  }

  if (expected.noDashFaq && hasDashFaqQuestion(html)) {
    fail(`${label} | must not contain dash FAQ JSON-LD`);
  }

  if (expected.noSoftware && hasJsonLdType(html, "SoftwareApplication")) {
    fail(`${label} | must not contain SoftwareApplication JSON-LD`);
  }

  if (routePath.endsWith("/rychly")) {
    const parentPath = routePath.replace(/\/rychly$/, "");
    const canonical = extractCanonical(html);
    if (!canonical.endsWith(parentPath)) {
      fail(`${label} | canonical should point to ${parentPath}, got ${canonical}`);
    } else {
      ok(`${label} | canonical → ${parentPath}`);
    }
  }
}

if (!sitemapXml.includes(KALKULACKY_PHMAX_PATH)) {
  fail("sitemap | missing landing page");
} else {
  ok("sitemap | contains landing page");
}

if (
  sitemapXml.includes("/prehled") ||
  sitemapXml.includes("/profil-skoly") ||
  sitemapXml.includes("/vyrocni-zprava/nahled") ||
  sitemapXml.includes("/rychly")
) {
  fail("sitemap | contains excluded URLs");
} else {
  ok("sitemap | excludes dashboard, profile, preview and /rychly");
}

const vyrocniHtml = readBuiltHtml(VYROCNI_ZPRAVA_PATH);
for (const item of VYROCNI_ZPRAVA_SEO_FAQ) {
  if (!vyrocniHtml.includes(escapeHtml(item.question))) {
    fail(`vyrocni-zprava | visible FAQ missing question: ${item.question}`);
  }
}

if (!vyrocniHtml.includes(`<h1>${escapeHtml(VYROCNI_ZPRAVA_SEO_H1)}</h1>`)) {
  fail(`vyrocni-zprava | missing H1 ${VYROCNI_ZPRAVA_SEO_H1}`);
}

if (!vyrocniHtml.includes(PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD.title.replace(/&/g, "&amp;"))) {
  fail("vyrocni-zprava | title mismatch");
}

const navodHtml = readBuiltHtml(USER_GUIDE_PATH);
const navodCanonical = `https://app.reditelskypruvodce.cz${USER_GUIDE_PATH}`;
const navodContent = getRouteSeoContent(USER_GUIDE_PATH);
const navodJsonLd = parseJsonLdBlocks(navodHtml);

const navodChecks: [string, boolean][] = [
  ["no SoftwareApplication", !hasJsonLdType(navodHtml, "SoftwareApplication")],
  ["WebPage schema", hasJsonLdType(navodHtml, "WebPage")],
  ["BreadcrumbList schema", hasJsonLdType(navodHtml, "BreadcrumbList")],
  ["robots index,follow", extractRobots(navodHtml).includes("index, follow")],
  ["canonical /navod", extractCanonical(navodHtml) === navodCanonical],
  ["in sitemap", sitemapUrls.some((url) => new URL(url).pathname.replace(/\/+$/, "") === USER_GUIDE_PATH)],
  ["valid JSON-LD blocks", navodJsonLd.length >= 2],
];

for (const [label, pass] of navodChecks) {
  if (!pass) fail(`/navod | ${label}`);
  else ok(`/navod | ${label}`);
}

const navodFaqBlock = navodJsonLd.find((block) => block["@type"] === "FAQPage") as
  | { mainEntity?: Array<{ name: string; acceptedAnswer?: { text: string } }> }
  | undefined;

if (navodContent?.faq.length) {
  if (!navodFaqBlock?.mainEntity?.length) {
    fail("/navod | missing FAQPage JSON-LD");
  } else {
    for (const item of navodContent.faq) {
      const visible = navodHtml.includes(`<summary>${escapeHtml(item.question)}</summary>`);
      const inJsonLd = navodFaqBlock.mainEntity.some((entry) => entry.name === item.question);
      if (!visible) fail(`/navod | visible FAQ missing: ${item.question}`);
      if (!inJsonLd) fail(`/navod | FAQ JSON-LD missing: ${item.question}`);
      else ok(`/navod | FAQ matched: ${item.question}`);
    }
  }
}

if (failures > 0) {
  console.error(`SEO content verification failed (${failures} checks).`);
  process.exit(1);
}

console.log(`SEO content verification passed for ${SEO_PRERENDER_CONTENT_PATHS.length} prerender routes and indexing policy.`);

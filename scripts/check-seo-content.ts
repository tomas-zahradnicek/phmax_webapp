import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_C_SEO_CONTENT_PATHS, getRouteSeoContent } from "../src/phmax-route-seo-content";

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

let failures = 0;

for (const routePath of PHASE_C_SEO_CONTENT_PATHS) {
  const html = readBuiltHtml(routePath);
  const content = getRouteSeoContent(routePath);
  if (!content) {
    failures += 1;
    console.error(`FAIL ${routePath} | missing route SEO content config`);
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
    ["at least two H2", countMatches(html, /<h2\b/gi) >= 2],
    ["FAQ present", /Nejčastější otázky/i.test(html)],
    ["breadcrumb nav", /aria-label="Drobečková navigace"/i.test(html)],
    ["at least three internal links", countMatches(html, /<a\s+href="\/[^"]*"/gi) >= 3],
    ["link to /navod", html.includes('href="/navod"')],
    ["#root present", html.includes('id="root"')],
    ["title present", /<title>[\s\S]*?<\/title>/i.test(html)],
    ["description present", /<meta\s+name="description"/i.test(html)],
    ["canonical present", /<link\s+rel="canonical"/i.test(html)],
    ["robots present", /<meta\s+name="robots"/i.test(html)],
    ["no localStorage data", !/localStorage/i.test(html)],
  ];

  let routeFailed = false;
  for (const [label, ok] of checks) {
    if (!ok) {
      routeFailed = true;
      failures += 1;
      console.error(`FAIL ${routePath} | ${label}`);
    }
  }

  if (!routeFailed) {
    console.log(`OK ${routePath} | H1: ${content.h1}`);
  }
}

if (failures > 0) {
  console.error(`SEO content verification failed (${failures} checks).`);
  process.exit(1);
}

console.log(`SEO content verification passed for ${PHASE_C_SEO_CONTENT_PATHS.length} routes.`);

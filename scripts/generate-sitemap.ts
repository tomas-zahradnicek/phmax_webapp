/**
 * Přegeneruje public/sitemap.xml a public/robots.txt pro PHMAX_SITE_ORIGIN_FALLBACK.
 *
 *   npm run docs:sitemap
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhmaxSitemapXml } from "../src/phmax-document-head";
import { PHMAX_SITE_ORIGIN_FALLBACK } from "../src/phmax-site-origin";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemapPath = path.join(repoRoot, "public", "sitemap.xml");
const robotsPath = path.join(repoRoot, "public", "robots.txt");

writeFileSync(sitemapPath, buildPhmaxSitemapXml(PHMAX_SITE_ORIGIN_FALLBACK), "utf8");

writeFileSync(
  robotsPath,
  `User-agent: *
Allow: /

Sitemap: ${PHMAX_SITE_ORIGIN_FALLBACK}/sitemap.xml
`,
  "utf8",
);

console.log(`Sitemap: ${sitemapPath}`);
console.log(`Robots: ${robotsPath}`);
console.log(`Origin: ${PHMAX_SITE_ORIGIN_FALLBACK}`);

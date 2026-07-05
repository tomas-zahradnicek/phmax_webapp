/**
 * Po `vite build` vloží route-specific SEO head do dist podadresářů.
 * Crawlery tak dostanou správný title, meta, canonical a JSON-LD bez čekání na JS.
 *
 *   npm run build
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPhmaxHeadHtmlTags,
  listPhmaxPrerenderRoutes,
  PHMAX_DOCUMENT_HEAD,
} from "../src/phmax-document-head";
import { PHMAX_SITE_ORIGIN_FALLBACK } from "../src/phmax-site-origin";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
const templatePath = path.join(distDir, "index.html");

function stripExistingSeoHead(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "")
    .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<script[^>]*id="phmax-[^"]*"[^>]*>[\s\S]*?<\/script>\s*/gi, "");
}

function injectSeoHead(html: string, headTags: string, noscriptHtml: string): string {
  const cleaned = stripExistingSeoHead(html);
  const withHead = cleaned.replace(
    /(<meta\s+name="viewport"[^>]*>)/i,
    `$1\n    ${headTags}`,
  );
  return withHead.replace(
    /<div id="root"><\/div>/,
    `${noscriptHtml}\n    <div id="root"></div>`,
  );
}

function buildNoscript(metaDescription: string, canonical: string): string {
  const safeDescription = metaDescription
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<noscript>
      <main>
        <h1>Ředitelský průvodce – kalkulačky PHmax</h1>
        <p>${safeDescription}</p>
        <p><a href="${canonical}">Pokračovat na stránku</a> · <a href="/prehled">Přehled modulů</a> · <a href="/navod">Návod</a></p>
      </main>
    </noscript>`;
}

const template = readFileSync(templatePath, "utf8");
const origin = PHMAX_SITE_ORIGIN_FALLBACK;
const routes = listPhmaxPrerenderRoutes(origin);

for (const route of routes) {
  const canonical = new URL(route.pathname, origin).href;
  const headTags = buildPhmaxHeadHtmlTags(route.meta, origin, {
    canonical,
    faqView: route.faqView,
    indexable: route.indexable,
    breadcrumbLabel: route.breadcrumbLabel,
    includeWebSite: route.includeWebSite,
  });
  const html = injectSeoHead(template, headTags, buildNoscript(route.meta.description, canonical));
  const outDir = path.join(distDir, route.pathname.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), html, "utf8");
}

const overview = PHMAX_DOCUMENT_HEAD.dash;
const overviewCanonical = new URL("/prehled", origin).href;
const overviewHead = buildPhmaxHeadHtmlTags(overview, origin, {
  canonical: overviewCanonical,
  faqView: "dash",
  breadcrumbLabel: overview.applicationName,
  includeWebSite: true,
});
writeFileSync(
  templatePath,
  injectSeoHead(template, overviewHead, buildNoscript(overview.description, overviewCanonical)),
  "utf8",
);

console.log(`Prerender SEO head: ${routes.length} routes + dist/index.html`);
console.log(`Origin: ${origin}`);

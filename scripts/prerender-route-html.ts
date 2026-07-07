/**
 * Po `vite build` vloží route-specific SEO head a (pro fázi C) body obsah do dist.
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
import { getRouteSeoContent, isSeoPrerenderContentPath } from "../src/phmax-route-seo-content";
import { PHMAX_SITE_ORIGIN_FALLBACK } from "../src/phmax-site-origin";
import { PRODUCT_VIEW_PATH } from "../src/product-view-paths";
import { renderRouteSeoHtml, SEO_PRERENDER_NOSCRIPT_HTML } from "../src/render-route-seo-html";

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

function buildLegacyNoscript(metaDescription: string, canonical: string): string {
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

function injectSeoHtml(
  html: string,
  headTags: string,
  options: { pathname: string; metaDescription: string; canonical: string },
): string {
  const cleaned = stripExistingSeoHead(html);
  const withHead = cleaned.replace(/(<meta\s+name="viewport"[^>]*>)/i, `$1\n    ${headTags}`);

  const routeContent = isSeoPrerenderContentPath(options.pathname) ? getRouteSeoContent(options.pathname) : null;
  const noscriptHtml = routeContent ? SEO_PRERENDER_NOSCRIPT_HTML : buildLegacyNoscript(options.metaDescription, options.canonical);
  const prerenderHtml = routeContent ? renderRouteSeoHtml(routeContent) : "";

  const bodyInjection = [noscriptHtml, prerenderHtml, '<div id="root"></div>'].filter(Boolean).join("\n    ");
  return withHead.replace(/<div id="root"><\/div>/, bodyInjection);
}

function build404Html(template: string, origin: string): string {
  const canonical = new URL("/404", origin).href;
  const headTags = [
    `<title>Stránka nebyla nalezena | Ředitelský průvodce</title>`,
    `<meta name="description" content="Požadovaná stránka nebyla nalezena. Pokračujte na přehled modulů kalkulaček PHmax." />`,
    `<meta name="robots" content="noindex, follow" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="Stránka nebyla nalezena | Ředitelský průvodce" />`,
    `<meta property="og:description" content="Požadovaná stránka nebyla nalezena. Pokračujte na přehled modulů kalkulaček PHmax." />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="cs_CZ" />`,
    `<meta property="og:site_name" content="Ředitelský průvodce" />`,
  ].join("\n    ");

  const notFoundBody = `<main class="container" style="max-width:900px;margin:40px auto;padding:0 16px;">
      <h1>Stránka nebyla nalezena</h1>
      <p>Požadovaná adresa v aplikaci Ředitelský průvodce neexistuje nebo byla změněna.</p>
      <p><a href="/prehled">Přejít na přehled modulů</a></p>
      <h2>Hlavní kalkulačky</h2>
      <ul>
        <li><a href="${PRODUCT_VIEW_PATH.pv}">PHmax předškolní vzdělávání</a></li>
        <li><a href="${PRODUCT_VIEW_PATH.sd}">PHmax školní družina</a></li>
        <li><a href="${PRODUCT_VIEW_PATH.zs}">PHmax základní škola</a></li>
        <li><a href="${PRODUCT_VIEW_PATH.ss}">PHmax střední škola</a></li>
        <li><a href="${PRODUCT_VIEW_PATH.nv75}">Banka odpočtů NV75</a></li>
      </ul>
    </main>`;

  const cleaned = stripExistingSeoHead(template);
  const withHead = cleaned.replace(/(<meta\s+name="viewport"[^>]*>)/i, `$1\n    ${headTags}`);
  return withHead.replace(/<div id="root"><\/div>/, notFoundBody);
}

const template = readFileSync(templatePath, "utf8");
const origin = PHMAX_SITE_ORIGIN_FALLBACK;
const routes = listPhmaxPrerenderRoutes(origin);

for (const route of routes) {
  const canonical = new URL(route.pathname, origin).href;
  const headTags = buildPhmaxHeadHtmlTags(route.meta, origin, {
    canonical,
    ...route.head,
  });
  const html = injectSeoHtml(template, headTags, {
    pathname: route.pathname,
    metaDescription: route.meta.description,
    canonical,
  });
  const outDir = path.join(distDir, route.pathname.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), html, "utf8");
}

const overview = PHMAX_DOCUMENT_HEAD.dash;
const overviewCanonical = new URL("/prehled", origin).href;
const overviewHead = buildPhmaxHeadHtmlTags(overview, origin, {
  canonical: overviewCanonical,
  faqView: "dash",
  indexable: false,
  breadcrumbLabel: overview.applicationName,
  includeWebSite: false,
});
writeFileSync(
  templatePath,
  injectSeoHtml(template, overviewHead, {
    pathname: "/prehled",
    metaDescription: overview.description,
    canonical: overviewCanonical,
  }),
  "utf8",
);
writeFileSync(path.join(distDir, "404.html"), build404Html(template, origin), "utf8");

const phaseCCount = routes.filter((route) => isSeoPrerenderContentPath(route.pathname)).length;
console.log(`Prerender SEO head: ${routes.length} routes + dist/index.html`);
console.log(`Prerender SEO body: ${phaseCCount} routes`);
console.log(`Origin: ${origin}`);

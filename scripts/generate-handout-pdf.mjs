/**
 * Tisk handoutu do PDF přes Playwright (Chromium).
 * Výstup: docs/phmax-handout-reditel-zrizovatel.pdf
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const htmlPath = path.join(repoRoot, "docs", "phmax-handout-reditel-zrizovatel.html");
const pdfPath = path.join(repoRoot, "docs", "phmax-handout-reditel-zrizovatel.pdf");
const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(fileUrl, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", right: "14mm", bottom: "14mm", left: "14mm" },
  });
  console.log(`Handout PDF: ${pdfPath}`);
} finally {
  await browser.close();
}

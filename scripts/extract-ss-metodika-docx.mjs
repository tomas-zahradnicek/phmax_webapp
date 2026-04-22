/**
 * Extrahuje prostý text z prvního vhodného .docx v docs/zdroje/ (včetně podadresářů)
 * → docs/zdroje/_extracted_ss_metodika_plain.txt
 *
 * Použití: npm run extract:ss-metodika
 * (vyžaduje dev závislost jszip)
 *
 * Máte jen .md podklady? → npm run docs:concat-md
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { findPreferredDocx } from "./lib/walk-docs-zdroje.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const zdroje = join(root, "docs", "zdroje");

function xmlToPlain(xml) {
  let t = xml.replace(/<w:tab[^/>]*\/>/gi, "\t");
  t = t.replace(/<\/w:p>/gi, "\n");
  t = t.replace(/<w:br[^/>]*\/>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");
  t = t
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
  t = t.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  t = t.replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

const docxPath = findPreferredDocx(zdroje);
if (!docxPath) {
  console.error(
    "Nenalezen žádný .docx v docs/zdroje/ (ani v podadresářích). " +
      "Vložte např. Metodika_vypoctu_PHmax_pro_SS_2026_final_verze_3.docx kamkoli pod docs/zdroje/, nebo pro sloučení markdown podkladů spusťte: npm run docs:concat-md",
  );
  process.exit(1);
}

let JSZip;
try {
  ({ default: JSZip } = await import("jszip"));
} catch {
  console.error("Chybí balíček jszip. Spusťte: npm install");
  process.exit(1);
}

const buf = readFileSync(docxPath);
const zip = await JSZip.loadAsync(buf);
const file = zip.file("word/document.xml");
if (!file) {
  console.error("V souboru DOCX chybí word/document.xml");
  process.exit(1);
}
const xml = await file.async("string");
const plain = xmlToPlain(xml);
const out = join(zdroje, "_extracted_ss_metodika_plain.txt");
writeFileSync(out, plain, "utf8");
console.log("Uloženo:", out);
console.log("Zdroj DOCX:", docxPath, `(${relative(zdroje, docxPath).replace(/\\/g, "/")})`);
console.log("Text slouží k ručnímu sladění popisků v src/ss/phmax-ss-constants.ts (1:1 s metodikou).");

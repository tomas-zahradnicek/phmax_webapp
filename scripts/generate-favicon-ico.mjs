/**
 * Vygeneruje public/favicon.ico z favicon-32.png (spusť po změně loga).
 * Vyžaduje: npm install --no-save to-ico
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const png32 = join(publicDir, "favicon-32.png");

const { default: toIco } = await import("to-ico");
const ico = await toIco([readFileSync(png32)]);
writeFileSync(join(publicDir, "favicon.ico"), ico);
console.log(`favicon.ico (${ico.length} B)`);

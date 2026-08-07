import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), "package.json");
const pkgVersion = JSON.parse(readFileSync(pkgPath, "utf-8")).version as string;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkgVersion),
  },
  plugins: [react()],
  optimizeDeps: {
    // Dev prebundle only. Do NOT force exceljs into a manual production chunk:
    // that co-locates Vite's CJS interop helper with exceljs and makes the entry
    // statically import the ~900 kB chunk (modulepreload on every route).
    include: ["exceljs"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});

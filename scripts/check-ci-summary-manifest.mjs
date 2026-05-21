import fs from "node:fs";

const workflow = fs.readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

const requiredSnippets = [
  "npm run check:golden-manifest",
  "npm run test:golden",
  "npm run test",
  "npm run check:no-legacy-root-pages",
];

const missing = requiredSnippets.filter((snippet) => !workflow.includes(snippet));

if (missing.length > 0) {
  console.error("CI workflow is missing required steps:");
  for (const snippet of missing) {
    console.error(`- ${snippet}`);
  }
  process.exit(1);
}

console.log("CI summary manifest check passed.");

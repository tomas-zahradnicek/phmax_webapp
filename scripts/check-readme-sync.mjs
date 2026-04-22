import fs from "node:fs";

const readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");

const requiredSnippets = [
  "npm run test:golden",
  "Test summary",
];

const missing = requiredSnippets.filter((snippet) => !readme.includes(snippet));

if (missing.length > 0) {
  console.error("README is missing required CI/testing snippets:");
  for (const snippet of missing) {
    console.error(`- ${snippet}`);
  }
  process.exit(1);
}

console.log("README sync check passed.");

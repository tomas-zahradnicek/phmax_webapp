import fs from "node:fs";

const releaseWorkflow = fs.readFileSync(
  new URL("../.github/workflows/release.yml", import.meta.url),
  "utf8",
);

const requiredSnippets = [
  "softprops/action-gh-release",
  ".github/release-notes/",
  "workflow_dispatch",
];

const missing = requiredSnippets.filter((snippet) => !releaseWorkflow.includes(snippet));

if (missing.length > 0) {
  console.error("Release workflow is missing required snippets:");
  for (const snippet of missing) {
    console.error(`- ${snippet}`);
  }
  process.exit(1);
}

console.log("Release manifest check passed.");

import fs from "node:fs";

const workflow = fs.readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

const requiredSnippets = [
  'echo "## Test summary"',
  'echo "- Unit tests: ${{ steps.unit_tests.outcome }}"',
  'echo "- Golden tests: ${{ steps.golden_tests.outcome }}"',
  '>> "$GITHUB_STEP_SUMMARY"',
];

const missing = requiredSnippets.filter((snippet) => !workflow.includes(snippet));

if (missing.length > 0) {
  console.error("CI summary manifest is missing required snippets:");
  for (const snippet of missing) {
    console.error(`- ${snippet}`);
  }
  process.exit(1);
}

console.log("CI summary manifest check passed.");

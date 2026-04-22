import fs from "node:fs";

const checksDir = new URL("./", import.meta.url);
const checkFiles = fs
  .readdirSync(checksDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^check-.*\.mjs$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const workflow = fs.readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

const requiredScripts = checkFiles.map((fileName) =>
  `check:${fileName.replace(/^check-/, "").replace(/\.mjs$/, "")}`,
);

const missingScripts = requiredScripts.filter(
  (scriptName) => typeof packageJson?.scripts?.[scriptName] !== "string",
);
if (missingScripts.length > 0) {
  console.error("package.json is missing required CI guard scripts:");
  for (const scriptName of missingScripts) {
    console.error(`- ${scriptName}`);
  }
  process.exit(1);
}

const requiredWorkflowSnippets = requiredScripts.map((scriptName) => `npm run ${scriptName}`);

const missingWorkflowSnippets = requiredWorkflowSnippets.filter(
  (snippet) => !workflow.includes(snippet),
);
if (missingWorkflowSnippets.length > 0) {
  console.error("CI workflow is missing required guard invocations:");
  for (const snippet of missingWorkflowSnippets) {
    console.error(`- ${snippet}`);
  }
  process.exit(1);
}

console.log("CI guards manifest check passed.");

import fs from "node:fs";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const goldenScript = packageJson?.scripts?.["test:golden"];
if (typeof goldenScript !== "string") {
  console.error('Missing script "test:golden" in package.json.');
  process.exit(1);
}

const requiredGoldenBoundaryEntries = [
  "src/phmax-pv-golden-boundary.test.ts",
  "src/phmax-sd-golden-boundary.test.ts",
  "src/phmax-zs-golden-boundary.test.ts",
  "src/ss/phmax-ss-golden-boundary.test.ts",
];

const requiredContractEntries = [
  "src/phmax-compare-contract.test.ts",
  "src/phmax-export-contract.test.ts",
  "src/export-metadata-contract.test.ts",
  "src/export-time-freeze.test.ts",
  "src/phmax-audit-schema-contract.test.ts",
  "src/snapshot-restore-contract.test.ts",
];

const requiredUiFlowEntries = [
  "src/phmax-pv-ui-flow.test.ts",
  "src/phmax-sd-ui-flow.test.ts",
  "src/phmax-zs-ui-flow.test.ts",
  "src/ss/phmax-ss-ui-flow.test.ts",
];

const requiredPropertyEntries = [
  "src/phmax-zs-property-boundaries.test.ts",
  "src/phmax-pv-sd-property-boundaries.test.ts",
  "src/ss/phmax-ss-property-boundaries.test.ts",
];

const requiredEntries = [
  ...requiredGoldenBoundaryEntries,
  ...requiredContractEntries,
  ...requiredUiFlowEntries,
  ...requiredPropertyEntries,
];

const missing = requiredEntries.filter((entry) => !goldenScript.includes(entry));
if (missing.length > 0) {
  console.error("test:golden is missing required contract entries:");
  for (const entry of missing) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

const requiredOrder = [
  "src/phmax-export-contract.test.ts",
  "src/export-metadata-contract.test.ts",
  "src/export-time-freeze.test.ts",
];
const positions = requiredOrder.map((entry) => goldenScript.indexOf(entry));
const orderValid =
  positions.every((position) => position >= 0) &&
  positions.every((position, index) => index === 0 || positions[index - 1] < position);
if (!orderValid) {
  console.error(
    "test:golden export contract entries must stay ordered: phmax-export-contract -> export-metadata-contract -> export-time-freeze.",
  );
  process.exit(1);
}

console.log("Golden manifest check passed.");

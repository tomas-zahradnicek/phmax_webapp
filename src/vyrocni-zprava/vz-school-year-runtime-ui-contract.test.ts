import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED } from "./vz-school-year-persist-binding";

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("VZ SchoolYear runtime binding UI contract (0G-2)", () => {
  const hookSource = readSource("src/vyrocni-zprava/use-vyrocni-zprava-report.ts");
  const pageSource = readSource("src/VyrocniZpravaPage.tsx");
  const setupSource = readSource("src/vyrocni-zprava/VyrocniZpravaSetupForm.tsx");
  const appSource = readSource("src/App.tsx");

  it("jediný produkční orchestration path je persist() → serialized VZ year runner", () => {
    expect(hookSource).toContain("createSerializedVzSchoolYearBindingRunner");
    expect(hookSource).toContain("runner.afterPersist(result)");
    expect(hookSource).toContain("bindingGenerationRef");
    expect(hookSource).toContain("shouldApplyVzSchoolYearBindingUiOutcome");
    expect(hookSource).not.toContain("ensureVzSchoolYearPlatformBinding(");
    expect(hookSource).not.toContain("onMount()");
  });

  it("SetupForm / App nemají přímý helper call", () => {
    expect(setupSource).not.toContain("ensureVzSchoolYearPlatformBinding");
    expect(setupSource).not.toContain("createSerializedVzSchoolYearBindingRunner");
    expect(appSource).not.toContain("ensureVzSchoolYearPlatformBinding");
    expect(appSource).not.toContain("createSerializedVzSchoolYearBindingRunner");
  });

  it("page zobrazuje oddělený schoolYearMetadataNotice se soft status role", () => {
    expect(pageSource).toContain("schoolYearMetadataNotice");
    expect(pageSource).toContain('role="status"');
    expect(pageSource).toContain("saveIssue");
    expect(MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED).toContain("uložena");
    expect(MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED).not.toMatch(
      /Identity|AppContext|schoolYearId|localStorage/i,
    );
  });

  it("failed persist branch nevolá afterPersist", () => {
    const failBranch = hookSource.match(
      /if \(!result\.ok\) \{\s*setSaveIssue\(result\.saveIssue\);\s*return;\s*\}/,
    );
    expect(failBranch?.[0]).toBeTruthy();
    expect(failBranch?.[0]).not.toContain("afterPersist");
  });
});

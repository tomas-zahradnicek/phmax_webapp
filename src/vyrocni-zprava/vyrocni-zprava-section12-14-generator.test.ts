import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import { applyGeneratedDraft } from "./vyrocni-zprava-generated-text-logic";
import {
  createDefaultSection12Data,
  getSection12Readiness,
} from "./vyrocni-zprava-section12-data-logic";
import { buildSection12GeneratorInput } from "./vyrocni-zprava-section12-generator-input";
import {
  SECTION12_INCOMPLETE_DRAFT_PREFIX,
  generateSection12Draft,
  isSection12IncompleteDraft,
} from "./vyrocni-zprava-section12-local-generator";
import { shouldUseSection12Generator } from "./vyrocni-zprava-section12-generator-service";
import {
  createDefaultSection13Data,
  getSection13Readiness,
} from "./vyrocni-zprava-section13-data-logic";
import { buildSection13GeneratorInput } from "./vyrocni-zprava-section13-generator-input";
import {
  SECTION13_INCOMPLETE_DRAFT_PREFIX,
  generateSection13Draft,
  isSection13IncompleteDraft,
} from "./vyrocni-zprava-section13-local-generator";
import { shouldUseSection13Generator } from "./vyrocni-zprava-section13-generator-service";
import {
  createDefaultSection14Data,
  getSection14Readiness,
} from "./vyrocni-zprava-section14-data-logic";
import { buildSection14GeneratorInput } from "./vyrocni-zprava-section14-generator-input";
import {
  SECTION14_INCOMPLETE_DRAFT_PREFIX,
  generateSection14Draft,
  isSection14IncompleteDraft,
} from "./vyrocni-zprava-section14-local-generator";
import { shouldUseSection14Generator } from "./vyrocni-zprava-section14-generator-service";

function sectionById(id: string) {
  const definition = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === id);
  if (!definition) throw new Error(`Missing section ${id}`);
  return createSectionFromDefinition(definition);
}

function createProfile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
    schoolType: "ZAKLADNI_SKOLA",
  };
}

describe("vyrocni-zprava-section12-generator", () => {
  const profile = createProfile();

  it("shouldUseSection12Generator rozpozná kapitolu 12", () => {
    expect(shouldUseSection12Generator("12")).toBe(true);
    expect(shouldUseSection12Generator("11")).toBe(false);
  });

  it("prázdná kapitola 12 vrátí neúplný návrh", () => {
    const input = buildSection12GeneratorInput({
      schoolProfile: profile,
      schoolYear: "2024/2025",
      section12Data: createDefaultSection12Data(),
    });
    const result = generateSection12Draft(input);
    expect(result.ready).toBe(false);
    expect(result.text.startsWith(SECTION12_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
    expect(getSection12Readiness({ section12Data: createDefaultSection12Data(), schoolProfile: profile }).status).toBe(
      "CHYBI_UDAJE",
    );
  });

  it("projekt vygeneruje kapitolu 12 s podkapitolami", () => {
    const result = generateSection12Draft(
      buildSection12GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section12Data: {
          ...createDefaultSection12Data(),
          projects: [
            {
              title: "Projekt Digitální škola",
              description: "Modernizace ICT vybavení.",
              provider: "MŠMT",
              amount: "500 000 Kč",
              focusAreas: "digitální kompetence",
            },
          ],
          otherPrograms: "Škola se zapojila do programu Čtenářská gramotnost.",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("12 Projekty a granty");
    expect(result.text).toContain("12.1 Projekt Digitální škola");
    expect(result.text).toContain("12.2 Další programy");
    expect(result.text).toContain("Čtenářská gramotnost");
  });

  it("neúplný návrh kapitoly 12 ponechá stav CHYBI_UDAJE", () => {
    const section = applyGeneratedDraft(sectionById("12"), `${SECTION12_INCOMPLETE_DRAFT_PREFIX}\n- projekt`);
    expect(isSection12IncompleteDraft(section.generatedText ?? "")).toBe(true);
    expect(computeSectionStatus(section, profile)).toBe("CHYBI_UDAJE");
  });
});

describe("vyrocni-zprava-section13-generator", () => {
  const profile = createProfile();

  it("shouldUseSection13Generator rozpozná kapitolu 13", () => {
    expect(shouldUseSection13Generator("13")).toBe(true);
    expect(shouldUseSection13Generator("12")).toBe(false);
  });

  it("prázdná kapitola 13 vrátí neúplný návrh", () => {
    const result = generateSection13Draft(
      buildSection13GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section13Data: createDefaultSection13Data(),
      }),
    );
    expect(result.ready).toBe(false);
    expect(result.text.startsWith(SECTION13_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
    expect(getSection13Readiness({ section13Data: createDefaultSection13Data(), schoolProfile: profile }).status).toBe(
      "CHYBI_UDAJE",
    );
  });

  it("vyplněná spolupráce vygeneruje kapitolu 13", () => {
    const result = generateSection13Draft(
      buildSection13GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section13Data: {
          ...createDefaultSection13Data(),
          parentCooperation: "Pravidelná setkání s rodiči probíhala formou třídních schůzek.",
          founderCooperation: "Zřizovatel projednal výroční zprávu na zasedání zastupitelstva.",
          partners: "Škola spolupracovala s knihovnou a sportovním klubem.",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("13 Spolupráce s rodiči a partnery");
    expect(result.text).toContain("13.1 Spolupráce se zákonnými zástupci");
    expect(result.text).toContain("13.2 Spolupráce se zřizovatelem");
    expect(result.text).toContain("13.3 Další partneři školy");
    expect(result.text).toContain("třídních schůzek");
  });
});

describe("vyrocni-zprava-section14-generator", () => {
  const profile = createProfile();

  it("shouldUseSection14Generator rozpozná kapitolu 14", () => {
    expect(shouldUseSection14Generator("14")).toBe(true);
    expect(shouldUseSection14Generator("13")).toBe(false);
  });

  it("prázdná kapitola 14 vrátí neúplný návrh", () => {
    const result = generateSection14Draft(
      buildSection14GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section14Data: createDefaultSection14Data(),
      }),
    );
    expect(result.ready).toBe(false);
    expect(result.text.startsWith(SECTION14_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
    expect(getSection14Readiness({ section14Data: createDefaultSection14Data(), schoolProfile: profile }).status).toBe(
      "CHYBI_UDAJE",
    );
  });

  it("celkové zhodnocení vygeneruje kapitolu 14 Závěr", () => {
    const result = generateSection14Draft(
      buildSection14GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section14Data: {
          ...createDefaultSection14Data(),
          overallEvaluation:
            "Ve školním roce 2024/2025 škola plnila cíle ŠVP, podporovala rozvoj žáků a spolupracovala s rodiči i partnery.",
          futurePlans: "Další rozvoj digitálních kompetencí a podpora prevence rizikového chování.",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("14 Závěr");
    expect(result.text).toContain("Ve školním roce 2024/2025");
    expect(result.text).toContain("V následujícím období bude škola nadále usilovat o:");
    expect(result.text).toContain("digitálních kompetencí");
  });

  it("neúplný návrh kapitoly 14 ponechá stav CHYBI_UDAJE", () => {
    const section = applyGeneratedDraft(sectionById("14"), `${SECTION14_INCOMPLETE_DRAFT_PREFIX}\n- zhodnocení`);
    expect(isSection14IncompleteDraft(section.generatedText ?? "")).toBe(true);
    expect(computeSectionStatus(section, profile)).toBe("CHYBI_UDAJE");
  });
});

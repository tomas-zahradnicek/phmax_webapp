import type { CalculatorMode, FormSection } from "../config/calculator-config";
import { MODE_CONFIG } from "../config/calculator-config";
import { DEFAULT_MODE } from "../config/default-form-state";
import { getVisibleSections } from "../config/field-visibility";
import type { GymRow, MixedRow, PhaRow } from "../phmax-zs-logic";
import type { ZsHeroExampleKey } from "../zs-hero-example-groups";
import type { ZsFormSnapshotSetters, ZsWizardChoice } from "./zs-form-snapshot";

export function getZsInitialPreferredMode(): CalculatorMode {
  const preferred = Object.values(MODE_CONFIG).find(
    (item) =>
      item.group === "phmax" &&
      item.label.toLowerCase().includes("úplná zš") &&
      !item.label.includes("§ 16"),
  );
  return (preferred?.id ?? DEFAULT_MODE) as CalculatorMode;
}

export function getZsInitialPhaMode(): CalculatorMode {
  const preferred = Object.values(MODE_CONFIG).find((item) => item.group === "phamax");
  return (preferred?.id ?? DEFAULT_MODE) as CalculatorMode;
}

export function findZsModeBySections(...sections: FormSection[]): CalculatorMode {
  const candidate = Object.values(MODE_CONFIG).find(
    (item) =>
      item.group === "phmax" && sections.every((section) => getVisibleSections(item.id).includes(section)),
  );
  return (candidate?.id ?? DEFAULT_MODE) as CalculatorMode;
}

export type ZsHeroExampleLoadCtx = {
  setters: ZsFormSnapshotSetters;
  createEmptyGymRow: (id: number) => GymRow;
  createEmptyMixedRow: (id: number) => MixedRow;
  createEmptyPhaRow: (id: number) => PhaRow;
  applyResetPhmax: () => void;
  applyResetPha: () => void;
  applyResetPhp: () => void;
  resetNv75: () => void;
};

export function loadZsDemoData(ctx: ZsHeroExampleLoadCtx): void {
  const { setters: s } = ctx;
  s.setMode(getZsInitialPreferredMode());
  s.setTab("phmax");

  s.setBasicType("full_more_than_2");
  s.setBasic1Classes(10);
  s.setBasic1Pupils(250);
  s.setBasic2Classes(8);
  s.setBasic2Pupils(225);

  s.setIncl1Classes(0);
  s.setIncl1Pupils(0);
  s.setIncl2Classes(0);
  s.setIncl2Pupils(0);

  s.setPsychRows([
    {
      id: 1,
      kind: "psych1",
      mode: "higher_of_two",
      currentPupils: 7,
      currentClasses: 1,
      prevPupils: 6,
      prevClasses: 1,
    },
  ]);

  s.setMinorityType("minority1");
  s.setMinority1Classes(0);
  s.setMinority1Pupils(0);
  s.setMinority2Classes(0);
  s.setMinority2Pupils(0);

  s.setGymRows([ctx.createEmptyGymRow(1)]);
  s.setMixedRows([ctx.createEmptyMixedRow(1)]);

  s.setSpecial1Classes(0);
  s.setSpecial1Pupils(0);
  s.setSpecial2Classes(0);
  s.setSpecial2Pupils(0);
  s.setSpecialIIClasses(0);
  s.setSpecialIIPupils(0);

  s.setPrepClasses(0);
  s.setPrepChildren(0);
  s.setPrepSpecialClasses(0);
  s.setPrepSpecialChildren(0);
  s.setP38First(0);
  s.setP38Second(0);
  s.setP41First(0);
  s.setP41Second(0);

  s.setPhaRows([ctx.createEmptyPhaRow(1)]);

  s.setPhpWizardStep("a");
  s.setPhpMethodMode("three_year_avg");
  s.setPhpYear1(260);
  s.setPhpYear2(272);
  s.setPhpYear3(281);
  s.setPhpExcludedAbroad(0);
  s.setPhpExcludedForeignSchoolCz(0);
  s.setPhpExcludedIndividual(0);
  s.setPhpExcludedSchool(false);

  ctx.resetNv75();
}

export function loadZsHeroExample(example: ZsHeroExampleKey | "", ctx: ZsHeroExampleLoadCtx): void {
  const { setters: s } = ctx;

  if (!example) {
    s.setSelectedExample("");
    s.setDataMode("own");
    return;
  }

  ctx.applyResetPhmax();
  ctx.applyResetPha();
  ctx.applyResetPhp();
  ctx.resetNv75();
  s.setWizardChoice("");
  s.setDataMode("example");
  s.setSelectedExample(example);
  s.setTab("phmax");

  if (example === "priloha_uplna_zs_sec16") {
    s.setMode(findZsModeBySections("basic_first", "basic_second", "sec16_first", "sec16_second"));
    s.setBasicType("full_more_than_2");
    s.setBasic1Classes(10);
    s.setBasic1Pupils(250);
    s.setBasic2Classes(8);
    s.setBasic2Pupils(225);
    s.setIncl1Classes(5);
    s.setIncl1Pupils(40);
    s.setIncl2Classes(4);
    s.setIncl2Pupils(32);
    return;
  }

  if (example === "priloha_zs_1st_sec16") {
    s.setMode(findZsModeBySections("school_variant_first_stage_only", "sec16_first"));
    s.setBasicType("first_only_3");
    s.setBasic1Classes(3);
    s.setBasic1Pupils(30);
    s.setIncl1Classes(1);
    s.setIncl1Pupils(6);
    return;
  }

  if (example === "phmax_bezna_zs") {
    s.setMode(getZsInitialPreferredMode());
    s.setBasicType("full_more_than_2");
    s.setBasic1Classes(10);
    s.setBasic1Pupils(250);
    s.setBasic2Classes(8);
    s.setBasic2Pupils(225);
    return;
  }

  if (example === "priloha_phamax_uplna_zs_sec16_zss") {
    s.setMode(getZsInitialPhaMode());
    s.setTab("pha");
    s.setPhaRows([
      { id: 1, kind: "zs1", classes: 2, pupils: 15 },
      { id: 2, kind: "zs1Heavy", classes: 1, pupils: 7 },
      { id: 3, kind: "zs2", classes: 3, pupils: 21 },
      { id: 4, kind: "zss1Heavy", classes: 1, pupils: 6 },
      { id: 5, kind: "zss2Heavy", classes: 2, pupils: 11 },
      { id: 6, kind: "zssII", classes: 1, pupils: 6 },
    ]);
    return;
  }

  if (example === "pha_zss_prep_b45") {
    s.setMode(getZsInitialPhaMode());
    s.setTab("pha");
    s.setPhaRows([{ id: 1, kind: "zssPrep", classes: 1, pupils: 4 }]);
    return;
  }

  if (example === "phpmax_tri_roky") {
    s.setMode(getZsInitialPreferredMode());
    s.setTab("php");
    s.setPhpWizardStep("a");
    s.setPhpMethodMode("three_year_avg");
    s.setPhpYear1(260);
    s.setPhpYear2(272);
    s.setPhpYear3(281);
    s.setPhpExcludedAbroad(5);
    s.setPhpExcludedForeignSchoolCz(3);
    s.setPhpExcludedIndividual(2);
    return;
  }

  if (example === "psychiatricka_nemocnice") {
    s.setMode(findZsModeBySections("psych_groups"));
    s.setPsychRows([
      {
        id: 1,
        kind: "psych1",
        mode: "higher_of_two",
        currentPupils: 7,
        currentClasses: 1,
        prevPupils: 6,
        prevClasses: 1,
      },
    ]);
    return;
  }

  if (example === "zdravotnicke_zs") {
    s.setMode(findZsModeBySections("health_groups"));
    s.setHealthRows([
      {
        id: 1,
        kind: "health1",
        mode: "higher_of_two",
        currentPupils: 8,
        currentClasses: 1,
        prevPupils: 7,
        prevClasses: 1,
      },
    ]);
    return;
  }

  if (example === "gymnazium_phmax") {
    s.setMode("phmax_multiyear_gym");
    s.setGymRows([
      { id: 1, kind: "gym8", classes: 2, pupils: 20 },
      { id: 2, kind: "sport6", classes: 1, pupils: 12 },
    ]);
    return;
  }

  if (example === "mensina_phmax") {
    s.setMode("phmax_minority_language");
    s.setMinorityType("minority1");
    s.setMinority1Classes(2);
    s.setMinority1Pupils(14);
    s.setMinority2Classes(0);
    s.setMinority2Pupils(0);
    return;
  }

  if (example === "smisene_tridy") {
    s.setMode(findZsModeBySections("dominant_c_first"));
    s.setMixedMethodFirstZsPupils(47);
    s.setMixedMethodFirstZsClasses(4);
    s.setMixedMethodFirstSpecialPupils(26);
    s.setMixedMethodFirstSpecialClasses(3);
    s.setMixedMethodSecondZsPupils(38);
    s.setMixedMethodSecondZsClasses(3);
    s.setMixedMethodSecondSpecialPupils(31);
    s.setMixedMethodSecondSpecialClasses(4);
    return;
  }

  if (example === "mala_skola_pod_limitem") {
    s.setMode(getZsInitialPreferredMode());
    s.setTab("php");
    s.setPhpWizardStep("a");
    s.setPhpMethodMode("three_year_avg");
    s.setPhpYear1(120);
    s.setPhpYear2(130);
    s.setPhpYear3(125);
    s.setPhpExcludedAbroad(0);
    s.setPhpExcludedForeignSchoolCz(0);
    s.setPhpExcludedIndividual(0);
    return;
  }

  if (example === "skola_s_odecty_phpmax") {
    s.setMode(DEFAULT_MODE);
    s.setTab("php");
    s.setPhpWizardStep("a");
    s.setPhpMethodMode("three_year_avg");
    s.setPhpYear1(300);
    s.setPhpYear2(310);
    s.setPhpYear3(305);
    s.setPhpExcludedAbroad(15);
    s.setPhpExcludedForeignSchoolCz(10);
    s.setPhpExcludedIndividual(5);
    return;
  }

  if (example === "inkluzivni_skola") {
    s.setMode(findZsModeBySections("basic_first", "sec16_first"));
    s.setBasic1Classes(6);
    s.setBasic1Pupils(120);
    s.setBasic2Classes(5);
    s.setBasic2Pupils(110);
    s.setIncl1Classes(2);
    s.setIncl1Pupils(20);
    s.setIncl2Classes(1);
    s.setIncl2Pupils(10);
    return;
  }

  if (example === "pripravna_trida") {
    s.setMode(findZsModeBySections("prep_class"));
    s.setPrepClasses(1);
    s.setPrepChildren(12);
    s.setPrepSpecialClasses(1);
    s.setPrepSpecialChildren(4);
  }
}

/** Mapování volby průvodce na klíč ukázky v hero selectu. */
export const ZS_WIZARD_CHOICE_TO_EXAMPLE: Record<Exclude<ZsWizardChoice, "">, ZsHeroExampleKey> = {
  php_small: "mala_skola_pod_limitem",
  php_deductions: "skola_s_odecty_phpmax",
  ph_inclusion: "inkluzivni_skola",
  ph_psych: "psychiatricka_nemocnice",
  ph_health: "zdravotnicke_zs",
  ph_mixed: "smisene_tridy",
  ph_prep: "pripravna_trida",
  ph_gym: "gymnazium_phmax",
  ph_minority: "mensina_phmax",
};

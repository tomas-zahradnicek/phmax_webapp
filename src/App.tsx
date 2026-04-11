import React, { useEffect, useMemo, useState } from "react";
import {
  B13_MORE_THAN_2,
  B34_MAX_2,
  B5,
  B6,
  B7,
  B8,
  B9_B10,
  B14_B16,
  B17_B21,
  B22_B25,
  B26_B28,
  PHA_TABLE,
  PHP_TABLE,
  pickBand,
  round2,
  exportCsv,
  BasicType,
  MixedRow,
  PhaRow,
  PsychRow,
  GymRow,
} from "./phmax-zs-logic";
import { NumberField, ResultCard } from "./phmax-zs-ui";
import type { CalculatorMode, FormSection } from "./config/calculator-config";
import { MODE_CONFIG } from "./config/calculator-config";
import { getVisibleSections } from "./config/field-visibility";
import { DEFAULT_MODE } from "./config/default-form-state";

function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type TabKey = "phmax" | "pha" | "php";

type PhpWizardStep = "a" | "b" | "c" | "d";
type PhpMethodMode = "three_year_avg" | "short_period";
type Nv75Role = "ucitel" | "reditel";
type Nv75School = "plavecka_skola";
type ExampleKey = "" | "phmax_bezna_zs" | "phpmax_tri_roky" | "psychiatricka_nemocnice" | "smisene_tridy" | "pripravna_trida";

function clampNonNegative(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function sumNumbers(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function getNv75Reference(role: Nv75Role, school: Nv75School) {
  if (school === "plavecka_skola" && role === "ucitel") {
    return {
      label: "Učitel plavecké školy",
      value: "22 až 30 hodin týdně",
      note: "Rozpětí pro učitele plavecké školy.",
    };
  }

  return {
    label: "Ředitel plavecké školy",
    value: "nejméně 3 hodiny týdně",
    note: "Minimum pro ředitele plavecké školy.",
  };
}

function HelpHint({ text }: { text: string }) {
  return (
    <span
      title={text}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        marginLeft: 6,
        borderRadius: "50%",
        background: "#e2e8f0",
        color: "#0f172a",
        fontSize: 12,
        fontWeight: 700,
        cursor: "help",
        verticalAlign: "middle",
      }}
      aria-label={text}
    >
      i
    </span>
  );
}

function createEmptyPsychRow(id: number): PsychRow {
  return { id, kind: "psych1", mode: "higher_of_two", currentPupils: 0, currentClasses: 0, prevPupils: 0, prevClasses: 0 };
}

function createEmptyGymRow(id: number): GymRow {
  return { id, kind: "gym8", classes: 0, pupils: 0 };
}

function createEmptyMixedRow(id: number): MixedRow {
  return { id, stage: "first", majority: "zs", classes: 0, pupils: 0 };
}

function createEmptyPhaRow(id: number): PhaRow {
  return { id, kind: "zs1", classes: 0, pupils: 0 };
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("phmax");
  const [mode, setMode] = useState<CalculatorMode>(DEFAULT_MODE);

  const modeOptions = useMemo(() => {
    return Object.values(MODE_CONFIG).filter((item) => {
      if (tab === "phmax") return item.group === "phmax" || item.group === "nv75";
      if (tab === "pha") return item.group === "phamax";
      return item.group === "phpmax";
    });
  }, [tab]);

  useEffect(() => {
    if (!modeOptions.some((item) => item.id === mode)) {
      setMode(modeOptions[0]?.id ?? DEFAULT_MODE);
    }
  }, [mode, modeOptions]);

  const visibleSections = useMemo(() => getVisibleSections(mode), [mode]);
  const hasSection = (section: FormSection) => visibleSections.includes(section);

  const [basicType, setBasicType] = useState<BasicType>("full_more_than_2");
  const [basic1Classes, setBasic1Classes] = useState(0);
  const [basic1Pupils, setBasic1Pupils] = useState(0);
  const [basic2Classes, setBasic2Classes] = useState(0);
  const [basic2Pupils, setBasic2Pupils] = useState(0);

  const [incl1Classes, setIncl1Classes] = useState(0);
  const [incl1Pupils, setIncl1Pupils] = useState(0);
  const [incl2Classes, setIncl2Classes] = useState(0);
  const [incl2Pupils, setIncl2Pupils] = useState(0);

  const [psychRows, setPsychRows] = useState<PsychRow[]>([]);

  const [minorityType, setMinorityType] = useState<keyof typeof B17_B21>("minority1");
  const [minority1Classes, setMinority1Classes] = useState(0);
  const [minority1Pupils, setMinority1Pupils] = useState(0);
  const [minority2Classes, setMinority2Classes] = useState(0);
  const [minority2Pupils, setMinority2Pupils] = useState(0);

  const [gymRows, setGymRows] = useState<GymRow[]>([]);

  const [mixedRows, setMixedRows] = useState<MixedRow[]>([]);

  const [special1Classes, setSpecial1Classes] = useState(0);
  const [special1Pupils, setSpecial1Pupils] = useState(0);
  const [special2Classes, setSpecial2Classes] = useState(0);
  const [special2Pupils, setSpecial2Pupils] = useState(0);
  const [specialIIClasses, setSpecialIIClasses] = useState(0);
  const [specialIIPupils, setSpecialIIPupils] = useState(0);

  const [prepClasses, setPrepClasses] = useState(0);
  const [prepChildren, setPrepChildren] = useState(0);
  const [prepSpecialClasses, setPrepSpecialClasses] = useState(0);
  const [prepSpecialChildren, setPrepSpecialChildren] = useState(0);
  const [p38First, setP38First] = useState(0);
  const [p38Second, setP38Second] = useState(0);
  const [p41First, setP41First] = useState(0);
  const [p41Second, setP41Second] = useState(0);

  const [phaRows, setPhaRows] = useState<PhaRow[]>([]);

  const [phpYear1, setPhpYear1] = useState(0);
  const [phpYear2, setPhpYear2] = useState(0);
  const [phpYear3, setPhpYear3] = useState(0);

  const [phpWizardStep, setPhpWizardStep] = useState<PhpWizardStep>("a");
  const [phpMethodMode, setPhpMethodMode] = useState<PhpMethodMode>("three_year_avg");

  const [phpExcludedAbroad, setPhpExcludedAbroad] = useState(0);
  const [phpExcludedForeignSchoolCz, setPhpExcludedForeignSchoolCz] = useState(0);
  const [phpExcludedIndividual, setPhpExcludedIndividual] = useState(0);

  const [phpExcludedSchool, setPhpExcludedSchool] = useState(false);

  const [nv75Role, setNv75Role] = useState<Nv75Role>("ucitel");
  const [nv75School, setNv75School] = useState<Nv75School>("plavecka_skola");
  const [nv75TeacherMin, setNv75TeacherMin] = useState(22);
  const [nv75TeacherMax, setNv75TeacherMax] = useState(30);
  const [selectedExample, setSelectedExample] = useState<ExampleKey>("");

  const isFull = basicType === "full_more_than_2" || basicType === "full_max_2";

  const basic1Avg = basic1Classes > 0 ? basic1Pupils / basic1Classes : 0;
  const basic2Avg = basic2Classes > 0 ? basic2Pupils / basic2Classes : 0;
  const incl1Avg = incl1Classes > 0 ? incl1Pupils / incl1Classes : 0;
  const incl2Avg = incl2Classes > 0 ? incl2Pupils / incl2Classes : 0;
  const special1Avg = special1Classes > 0 ? special1Pupils / special1Classes : 0;
  const special2Avg = special2Classes > 0 ? special2Pupils / special2Classes : 0;
  const specialIIAvg = specialIIClasses > 0 ? specialIIPupils / specialIIClasses : 0;

  const basicFirstBand = useMemo(() => {
    if (basicType === "full_more_than_2") return pickBand(basic1Avg, B13_MORE_THAN_2.first);
    if (basicType === "full_max_2") return pickBand(basic1Avg, B34_MAX_2.first);
    if (basicType === "first_only_1") return pickBand(basic1Avg, B5);
    if (basicType === "first_only_2") return pickBand(basic1Avg, B6);
    if (basicType === "first_only_3") return pickBand(basic1Avg, B7);
    return pickBand(basic1Avg, B8);
  }, [basicType, basic1Avg]);

  const basicSecondBand = useMemo(() => {
    if (basicType === "full_more_than_2") return pickBand(basic2Avg, B13_MORE_THAN_2.second);
    if (basicType === "full_max_2") return pickBand(basic2Avg, B34_MAX_2.second);
    return { label: "—", value: 0, test: () => false };
  }, [basicType, basic2Avg]);

  const incl1Band = pickBand(incl1Avg, B9_B10.first);
  const incl2Band = pickBand(incl2Avg, B9_B10.second);

  const sec16FirstClasses = incl1Classes;
  const sec16FirstPupils = incl1Pupils;
  const sec16SecondClasses = incl2Classes;
  const sec16SecondPupils = incl2Pupils;

  const setSec16FirstClasses = setIncl1Classes;
  const setSec16FirstPupils = setIncl1Pupils;
  const setSec16SecondClasses = setIncl2Classes;
  const setSec16SecondPupils = setIncl2Pupils;

  const sec16FirstBand = incl1Band;
  const sec16SecondBand = incl2Band;

  const psychComputedRows = psychRows.map((row) => {
    const avgCurrent = row.currentClasses > 0 ? row.currentPupils / row.currentClasses : 0;
    const avgPrev = row.prevClasses > 0 ? row.prevPupils / row.prevClasses : 0;
    const usedAvg = row.mode === "current_only" ? avgCurrent : Math.max(avgCurrent, avgPrev);
    const band = pickBand(usedAvg, B14_B16[row.kind]);
    return {
      ...row,
      avgCurrent: round2(avgCurrent),
      avgPrev: round2(avgPrev),
      usedAvg: round2(usedAvg),
      bandLabel: band.label,
      perClass: band.value,
      subtotal: round2(row.currentClasses * band.value),
    };
  });

  const minority1Avg = minority1Classes > 0 ? minority1Pupils / minority1Classes : 0;
  const minority1Band = pickBand(minority1Avg, B17_B21[minorityType]);
  const minority2Avg = minority2Classes > 0 ? minority2Pupils / minority2Classes : 0;
  const minority2Band = pickBand(minority2Avg, B17_B21.minorityFull2);

  const gymComputedRows = gymRows.map((row) => {
    const avg = row.classes > 0 ? row.pupils / row.classes : 0;
    const band = pickBand(avg, B22_B25[row.kind]);
    return { ...row, avg: round2(avg), bandLabel: band.label, perClass: band.value, subtotal: round2(row.classes * band.value) };
  });

  const special1Band = pickBand(special1Avg, B26_B28.special1);
  const special2Band = pickBand(special2Avg, B26_B28.special2);
  const specialIIBand = pickBand(specialIIAvg, B26_B28.specialII);

  const prepAvg = prepClasses > 0 ? prepChildren / prepClasses : 0;
  const prepPh = prepAvg < 10 ? 14 : 22;
  const prepSpecialAvg = prepSpecialClasses > 0 ? prepSpecialChildren / prepSpecialClasses : 0;
  const prepSpecialPh = prepSpecialAvg < 4 ? 10 : 40;

  const basicPhmax = round2(basic1Classes * basicFirstBand.value + (isFull ? basic2Classes * basicSecondBand.value : 0));
  const inclPhmax = round2(incl1Classes * incl1Band.value + incl2Classes * incl2Band.value);
  const psychPhmax = round2(psychComputedRows.reduce((s, r) => s + r.subtotal, 0));
  const minorityPhmax = round2(minority1Classes * minority1Band.value + (minorityType === "minorityFull1" ? minority2Classes * minority2Band.value : 0));
  const gymPhmax = round2(gymComputedRows.reduce((s, r) => s + r.subtotal, 0));
  const specialPhmax = round2(special1Classes * special1Band.value + special2Classes * special2Band.value + specialIIClasses * specialIIBand.value);
  const mixedPhmax = round2(
    mixedRows.reduce((sum, row) => {
      const avg = row.classes > 0 ? row.pupils / row.classes : 0;
      const band =
        row.majority === "zs"
          ? pickBand(avg, row.stage === "first" ? B9_B10.first : B9_B10.second)
          : pickBand(avg, row.stage === "first" ? B26_B28.special1 : B26_B28.special2);
      return sum + row.classes * band.value;
    }, 0)
  );
  const extrasPhmax = round2(prepClasses * prepPh + prepSpecialClasses * prepSpecialPh + p38First * 0.25 + p38Second * 0.5 + p41First * 0.25 + p41Second * 0.5);
  const totalPhmax = round2(basicPhmax + inclPhmax + psychPhmax + minorityPhmax + gymPhmax + specialPhmax + mixedPhmax + extrasPhmax);

  const phaComputedRows = phaRows.map((row) => {
    const avg = row.classes > 0 ? row.pupils / row.classes : 0;
    const band = pickBand(avg, PHA_TABLE[row.kind]);
    return { ...row, avg: round2(avg), bandLabel: band.label, perClass: band.value, subtotal: round2(row.classes * band.value) };
  });
  const totalPha = round2(phaComputedRows.reduce((s, r) => s + r.subtotal, 0));

  const phpBaseValue = round2(
    phpMethodMode === "short_period"
      ? Math.max(phpYear1, phpYear2, phpYear3)
      : (phpYear1 + phpYear2 + phpYear3) / 3
  );
  const phpExcludedTotal = round2(
    sumNumbers([
      clampNonNegative(phpExcludedAbroad),
      clampNonNegative(phpExcludedForeignSchoolCz),
      clampNonNegative(phpExcludedIndividual),
    ])
  );
  const phpAdjustedValue = round2(Math.max(0, phpBaseValue - phpExcludedTotal));
  const phpBand = phpExcludedSchool ? { label: "bez nároku", value: 0 } : pickBand(phpAdjustedValue, PHP_TABLE);
  const totalPhp = round2(phpBand.value);

  const nv75Reference = getNv75Reference(nv75Role, nv75School);
  const nv75TeacherRangeValid = nv75TeacherMin <= nv75TeacherMax;

  const warnings: string[] = [];
  if (basicType === "full_max_2" && basic1Classes > 0 && basic1Classes < 5) warnings.push("U úplné ZŠ s nejvýše 2 třídami v každém ročníku bývá obvykle na 1. stupni nejméně 5 běžných tříd.");
  if (basicType.startsWith("first_only_") && basic2Classes > 0) warnings.push("U neúplné ZŠ tvořené jen 1. stupněm se 2. stupeň do výpočtu běžných tříd nezadává.");
  if (phpExcludedTotal > phpBaseValue && !phpExcludedSchool) warnings.push("Součet nezapočítávaných žáků je vyšší než rozhodná hodnota pro PHPmax – metodický výpočet.");
  if (phpAdjustedValue > 0 && phpAdjustedValue < 180 && !phpExcludedSchool) warnings.push("PHPmax – metodický výpočet vychází 0, protože očištěný rozhodný počet žáků je pod hranicí 180.");
  if (phpExcludedSchool) warnings.push("Škola je označena jako vyloučená z PHPmax – metodický výpočet, proto je výsledek 0.");
  if (MODE_CONFIG[mode].group === "nv75" && nv75Role === "ucitel" && !nv75TeacherRangeValid) warnings.push("U NV 75/2005 musí být horní hranice učitele větší nebo rovna dolní hranici.");
  if (minorityType !== "minorityFull1" && minority2Classes > 0) warnings.push("U menšinové školy zadané jen pro 1. stupeň se 2. stupeň nezapočítá.");

  const addMixed = () => setMixedRows((prev) => [...prev, createEmptyMixedRow(Date.now())]);
  const updateMixed = (id: number, key: keyof MixedRow, value: string | number) => setMixedRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const removeMixed = (id: number) => setMixedRows((prev) => prev.filter((r) => r.id !== id));

  const addPha = () => setPhaRows((prev) => [...prev, createEmptyPhaRow(Date.now())]);
  const updatePha = (id: number, key: keyof PhaRow, value: string | number) => setPhaRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const removePha = (id: number) => setPhaRows((prev) => prev.filter((r) => r.id !== id));

  const addPsych = () => setPsychRows((prev) => [...prev, createEmptyPsychRow(Date.now())]);
  const updatePsych = (id: number, key: keyof PsychRow, value: string | number) => setPsychRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const removePsych = (id: number) => setPsychRows((prev) => prev.filter((r) => r.id !== id));

  const addGym = () => setGymRows((prev) => [...prev, createEmptyGymRow(Date.now())]);
  const updateGym = (id: number, key: keyof GymRow, value: string | number) => setGymRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const removeGym = (id: number) => setGymRows((prev) => prev.filter((r) => r.id !== id));


  const resetPhmax = () => {
    setBasicType("full_more_than_2");
    setBasic1Classes(0);
    setBasic1Pupils(0);
    setBasic2Classes(0);
    setBasic2Pupils(0);

    setIncl1Classes(0);
    setIncl1Pupils(0);
    setIncl2Classes(0);
    setIncl2Pupils(0);

    setPsychRows([]);
    setMinorityType("minority1");
    setMinority1Classes(0);
    setMinority1Pupils(0);
    setMinority2Classes(0);
    setMinority2Pupils(0);

    setGymRows([]);
    setMixedRows([]);

    setSpecial1Classes(0);
    setSpecial1Pupils(0);
    setSpecial2Classes(0);
    setSpecial2Pupils(0);
    setSpecialIIClasses(0);
    setSpecialIIPupils(0);

    setPrepClasses(0);
    setPrepChildren(0);
    setPrepSpecialClasses(0);
    setPrepSpecialChildren(0);
    setP38First(0);
    setP38Second(0);
    setP41First(0);
    setP41Second(0);
  };

  const resetPha = () => {
    setPhaRows([]);
  };

  const resetPhp = () => {
    setPhpWizardStep("a");
    setPhpMethodMode("three_year_avg");
    setPhpYear1(0);
    setPhpYear2(0);
    setPhpYear3(0);
    setPhpExcludedAbroad(0);
    setPhpExcludedForeignSchoolCz(0);
    setPhpExcludedIndividual(0);
    setPhpExcludedSchool(false);
  };

  const resetNv75 = () => {
    setNv75Role("ucitel");
    setNv75School("plavecka_skola");
    setNv75TeacherMin(22);
    setNv75TeacherMax(30);
  };

  const resetAll = () => {
    resetPhmax();
    resetPha();
    resetPhp();
    resetNv75();
    setTab("phmax");
  };

  const loadDemoData = () => {
    setMode(DEFAULT_MODE);
    setTab("phmax");

    setBasicType("full_more_than_2");
    setBasic1Classes(10);
    setBasic1Pupils(250);
    setBasic2Classes(8);
    setBasic2Pupils(225);

    setIncl1Classes(0);
    setIncl1Pupils(0);
    setIncl2Classes(0);
    setIncl2Pupils(0);

    setPsychRows([
      { id: 1, kind: "psych1", mode: "higher_of_two", currentPupils: 7, currentClasses: 1, prevPupils: 6, prevClasses: 1 },
    ]);

    setMinorityType("minority1");
    setMinority1Classes(0);
    setMinority1Pupils(0);
    setMinority2Classes(0);
    setMinority2Pupils(0);

    setGymRows([createEmptyGymRow(1)]);
    setMixedRows([createEmptyMixedRow(1)]);

    setSpecial1Classes(0);
    setSpecial1Pupils(0);
    setSpecial2Classes(0);
    setSpecial2Pupils(0);
    setSpecialIIClasses(0);
    setSpecialIIPupils(0);

    setPrepClasses(0);
    setPrepChildren(0);
    setPrepSpecialClasses(0);
    setPrepSpecialChildren(0);
    setP38First(0);
    setP38Second(0);
    setP41First(0);
    setP41Second(0);

    setPhaRows([createEmptyPhaRow(1)]);

    setPhpWizardStep("a");
    setPhpMethodMode("three_year_avg");
    setPhpYear1(260);
    setPhpYear2(272);
    setPhpYear3(281);
    setPhpExcludedAbroad(0);
    setPhpExcludedForeignSchoolCz(0);
    setPhpExcludedIndividual(0);
    setPhpExcludedSchool(false);

    resetNv75();
  };


  const loadExample = (example: ExampleKey) => {
    setSelectedExample(example);
    if (!example) return;

    resetAll();

    if (example === "phmax_bezna_zs") {
      setTab("phmax");
      setBasicType("full_more_than_2");
      setBasic1Classes(10);
      setBasic1Pupils(250);
      setBasic2Classes(8);
      setBasic2Pupils(225);
      return;
    }

    if (example === "phpmax_tri_roky") {
      setTab("php");
      setPhpWizardStep("a");
      setPhpMethodMode("three_year_avg");
      setPhpYear1(260);
      setPhpYear2(272);
      setPhpYear3(281);
      setPhpExcludedAbroad(5);
      setPhpExcludedForeignSchoolCz(3);
      setPhpExcludedIndividual(2);
      return;
    }

    if (example === "psychiatricka_nemocnice") {
      setTab("phmax");
      setPsychRows([
        { id: 1, kind: "psych1", mode: "higher_of_two", currentPupils: 7, currentClasses: 1, prevPupils: 6, prevClasses: 1 },
      ]);
      return;
    }

    if (example === "smisene_tridy") {
      setTab("phmax");
      setMixedRows([
        { id: 1, stage: "first", majority: "zs", classes: 2, pupils: 18 },
      ]);
      return;
    }

    if (example === "pripravna_trida") {
      setTab("phmax");
      setPrepClasses(1);
      setPrepChildren(12);
      setPrepSpecialClasses(1);
      setPrepSpecialChildren(4);
      return;
    }
  };

  const summaryRows = [
    ["Běžné třídy ZŠ", basicPhmax],
    ["Třídy podle § 16 odst. 9", inclPhmax],
    ["Škola při psychiatrické nemocnici", psychPhmax],
    ["ZŠ s jazykem národnostní menšiny", minorityPhmax],
    ["Nižší ročníky víceletých gymnázií", gymPhmax],
    ["Smíšené třídy § 16 odst. 9 a ZŠ speciální", mixedPhmax],
    ["Základní škola speciální", specialPhmax],
    ["Samostatné položky PHmax – výpočet podle typu tříd", extrasPhmax],
    ["PHmax – výpočet podle typu tříd celkem", totalPhmax],
    ["PHAmax – asistenti pedagoga", totalPha],
    ["PHPmax – metodický výpočet – rozhodná hodnota", phpBaseValue],
    ["PHPmax – metodický výpočet – vyloučené třídy", phpExcludedTotal],
    ["PHPmax – metodický výpočet – očištěná hodnota", phpAdjustedValue],
    ["PHPmax – metodický výpočet celkem", totalPhp],
  ] as const;

  const handleExportJson = () => {
    const payload = {
      module: "ZŠ",
      generatedAt: new Date().toISOString(),
      mode,
      tab,
      summary: Object.fromEntries(summaryRows.map(([label, value]) => [label, value])),
      phpmaxMethodika: {
        wizardStep: phpWizardStep,
        methodMode: phpMethodMode,
        years: {
          year1: phpYear1,
          year2: phpYear2,
          year3: phpYear3,
        },
        excluded: {
          abroad: phpExcludedAbroad,
          foreignSchoolInCz: phpExcludedForeignSchoolCz,
          individual: phpExcludedIndividual,
        },
        excludedSchool: phpExcludedSchool,
        baseValue: phpBaseValue,
        excludedTotal: phpExcludedTotal,
        adjustedValue: phpAdjustedValue,
        result: totalPhp,
      },
      nv75: MODE_CONFIG[mode].group === "nv75"
        ? {
            school: nv75School,
            role: nv75Role,
            teacherMin: nv75TeacherMin,
            teacherMax: nv75TeacherMax,
            reference: nv75Reference,
          }
        : null,
    };
    downloadTextFile("kalkulacka-zs-vypocet.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  };

  const handleExportCsv = () => {
    downloadTextFile("kalkulacka-zs-souhrn.csv", exportCsv(summaryRows), "text/csv;charset=utf-8");
  };

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <div className="pill">PHmax – výpočet podle typu tříd kalkulačka ZŠ</div>
          <h1>Hotová webová aplikace ke spuštění</h1>
          <p>
            Vite + React + TypeScript. Aplikace obsahuje formuláře pro běžné třídy, § 16 odst. 9,
            ZŠ speciální, menšinové školy, psychiatrickou nemocnici, víceletá gymnázia, PHAmax – asistenti pedagoga,
            PHPmax – metodický výpočet v metodickém rozpadu A–D, samostatné mazání údajů po jednotlivých záložkách a samostatný orientační panel pro NV 75/2005.
          </p>
          <div className="toolbar">
            <button className="btn ghost" onClick={() => window.print()}>Tisk</button>
            <div className="field" style={{ minWidth: 320 }}>
              <span>Ukázkový příklad</span>
              <select value={selectedExample} onChange={(e) => loadExample(e.target.value as ExampleKey)}>
                <option value="">Vyberte ukázkový příklad…</option>
                <option value="phmax_bezna_zs">PHmax – běžná úplná ZŠ</option>
                <option value="phpmax_tri_roky">PHPmax – tříletý průměr a odečty</option>
                <option value="psychiatricka_nemocnice">PHmax – škola při psychiatrické nemocnici</option>
                <option value="smisene_tridy">PHmax – smíšené třídy</option>
                <option value="pripravna_trida">PHmax – přípravná třída a přípravný stupeň ZŠS</option>
              </select>
            </div>
            <button className="btn ghost" onClick={resetAll}>Vymazat všechny údaje</button>
            <button className="btn ghost" onClick={handleExportCsv}>Export CSV</button>
            <button className="btn" onClick={handleExportJson}>Export JSON</button>
          </div>
          <p className="muted-text">
            Ukázkové příklady vycházejí z typických situací v metodice a z logiky jednotlivých výpočtů. Po načtení je můžete upravit podle vlastní školy.
          </p>
        </header>

        <section className="card">
          <h2>Typ školy / režim výpočtu</h2>
          <div className="grid two">
            <div className="field">
              <span>Vyberte režim</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as CalculatorMode)}
              >
                {modeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="subcard">
              <h3>{MODE_CONFIG[mode].label}</h3>
              <p className="muted-text">{MODE_CONFIG[mode].description}</p>
            </div>
          </div>
        </section>

        {MODE_CONFIG[mode].group === "nv75" && (
          <section className="card">
            <h2>NV 75/2005 – orientační přehled</h2>
            <p className="muted-text">
              Tento režim slouží k orientačnímu ověření rozsahu přímé pedagogické činnosti.
            </p>

            <div className="grid two">
              <div className="field">
                <span>Typ školy</span>
                <select value={nv75School} onChange={(e) => setNv75School(e.target.value as Nv75School)}>
                  <option value="plavecka_skola">Plavecká škola</option>
                </select>
              </div>

              <div className="field">
                <span>Role</span>
                <select value={nv75Role} onChange={(e) => setNv75Role(e.target.value as Nv75Role)}>
                  <option value="ucitel">Učitel</option>
                  <option value="reditel">Ředitel</option>
                </select>
              </div>
            </div>

            {nv75Role === "ucitel" && (
              <div className="grid two">
                <NumberField label="Dolní hranice" value={nv75TeacherMin} onChange={setNv75TeacherMin} />
                <NumberField label="Horní hranice" value={nv75TeacherMax} onChange={setNv75TeacherMax} />
              </div>
            )}

            <div className="toolbar">
              <button className="btn ghost" onClick={resetNv75}>Vymazat údaje NV 75/2005</button>
            </div>

            <div className="grid three">
              <ResultCard label="Reference" value={nv75Reference.label} />
              <ResultCard
                label="Rozsah"
                value={nv75Role === "ucitel" ? `${nv75TeacherMin} až ${nv75TeacherMax} hodin týdně` : nv75Reference.value}
              />
              <ResultCard label="Poznámka" value={nv75Reference.note} />
            </div>
          </section>
        )}

        {warnings.length > 0 && (
          <section className="card warning">
            <h2>Kontrola vstupů</h2>
            {warnings.map((w, i) => <div key={i}>• {w}</div>)}
          </section>
        )}

        <div className="tabs">
          <button className={tab === "phmax" ? "tab active" : "tab"} onClick={() => setTab("phmax")}>PHmax – výpočet podle typu tříd</button>
          <button className={tab === "pha" ? "tab active" : "tab"} onClick={() => setTab("pha")}>PHAmax – asistenti pedagoga</button>
          <button className={tab === "php" ? "tab active" : "tab"} onClick={() => setTab("php")}>PHPmax – metodický výpočet</button>
        </div>

        {tab === "phmax" && (
          <div className="stack">
            {(hasSection("basic_first") || hasSection("basic_second") || hasSection("school_variant_first_stage_only")) && (
              <section className="card">
                <h2>Běžné třídy ZŠ</h2>

                {hasSection("school_variant_first_stage_only") ? (
                  <select value={basicType} onChange={(e) => setBasicType(e.target.value as BasicType)}>
                    <option value="first_only_1">Neúplná ZŠ – 1 třída 1. stupně</option>
                    <option value="first_only_2">Neúplná ZŠ – 2 třídy 1. stupně</option>
                    <option value="first_only_3">Neúplná ZŠ – 3 třídy 1. stupně</option>
                    <option value="first_only_4">Neúplná ZŠ – 4 a více tříd 1. stupně</option>
                  </select>
                ) : (
                  <select value={basicType} onChange={(e) => setBasicType(e.target.value as BasicType)}>
                    <option value="full_more_than_2">Úplná ZŠ – více než 2 třídy v některém ročníku</option>
                    <option value="full_max_2">Úplná ZŠ – nejvýše 2 třídy v každém ročníku</option>
                  </select>
                )}

                <div className="grid two">
                  {hasSection("basic_first") && (
                    <div className="subcard">
                      <h3>1. stupeň</h3>
                      <div className="grid two">
                        <NumberField label="Počet tříd" value={basic1Classes} onChange={setBasic1Classes} />
                        <NumberField label="Počet žáků" value={basic1Pupils} onChange={setBasic1Pupils} />
                        <ResultCard label="Průměr" value={round2(basic1Avg)} />
                        <ResultCard label="Pásmo / PHmax – výpočet podle typu tříd" value={`${basicFirstBand.label} / ${basicFirstBand.value}`} />
                      </div>
                    </div>
                  )}

                  {hasSection("basic_second") && (
                    <div className="subcard">
                      <h3>2. stupeň</h3>
                      <div className="grid two">
                        <NumberField label="Počet tříd" value={basic2Classes} onChange={setBasic2Classes} />
                        <NumberField label="Počet žáků" value={basic2Pupils} onChange={setBasic2Pupils} />
                        <ResultCard label="Průměr" value={round2(basic2Avg)} />
                        <ResultCard label="Pásmo / PHmax – výpočet podle typu tříd" value={`${basicSecondBand.label} / ${basicSecondBand.value}`} />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="grid two">
              {(hasSection("sec16_first") || hasSection("sec16_second")) && (
                <section className="card">
                  <h2>Třídy podle § 16 odst. 9</h2>
                  <div className="grid two">
                    {hasSection("sec16_first") && (
                      <>
                        <NumberField label="1. stupeň – třídy" value={sec16FirstClasses} onChange={setSec16FirstClasses} />
                        <NumberField label="1. stupeň – žáci" value={sec16FirstPupils} onChange={setSec16FirstPupils} />
                        <ResultCard label="1. stupeň – průměr" value={round2(incl1Avg)} />
                        <ResultCard label="1. stupeň – PHmax – výpočet podle typu tříd" value={`${sec16FirstBand.label} / ${sec16FirstBand.value}`} />
                      </>
                    )}

                    {hasSection("sec16_second") && (
                      <>
                        <NumberField label="2. stupeň – třídy" value={sec16SecondClasses} onChange={setSec16SecondClasses} />
                        <NumberField label="2. stupeň – žáci" value={sec16SecondPupils} onChange={setSec16SecondPupils} />
                        <ResultCard label="2. stupeň – průměr" value={round2(incl2Avg)} />
                        <ResultCard label="2. stupeň – PHmax – výpočet podle typu tříd" value={`${sec16SecondBand.label} / ${sec16SecondBand.value}`} />
                      </>
                    )}
                  </div>
                </section>
              )}

              {(hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) && (
              <section className="card">
                <h2>ZŠ speciální</h2>
                <div className="grid two">
                  <NumberField label="I. díl 1. stupeň – třídy" value={special1Classes} onChange={setSpecial1Classes} />
                  <NumberField label="I. díl 1. stupeň – žáci" value={special1Pupils} onChange={setSpecial1Pupils} />
                  <ResultCard label="I. díl 1. stupeň" value={`${special1Band.label} / ${special1Band.value}`} />
                  <ResultCard label="Průměr" value={round2(special1Avg)} />
                  <NumberField label="I. díl 2. stupeň – třídy" value={special2Classes} onChange={setSpecial2Classes} />
                  <NumberField label="I. díl 2. stupeň – žáci" value={special2Pupils} onChange={setSpecial2Pupils} />
                  <ResultCard label="I. díl 2. stupeň" value={`${special2Band.label} / ${special2Band.value}`} />
                  <ResultCard label="Průměr" value={round2(special2Avg)} />
                  <NumberField label="II. díl – třídy" value={specialIIClasses} onChange={setSpecialIIClasses} />
                  <NumberField label="II. díl – žáci" value={specialIIPupils} onChange={setSpecialIIPupils} />
                  <ResultCard label="II. díl" value={`${specialIIBand.label} / ${specialIIBand.value}`} />
                  <ResultCard label="Průměr" value={round2(specialIIAvg)} />
                </div>
              </section>
              )}
            </div>

            <div className="grid two">
              {hasSection("psych_groups") && (
                <section className="card">
                  <h2>Škola při psychiatrické nemocnici <HelpHint text="U této části se pracuje s aktuálním údajem nebo s vyšší hodnotou z aktuálního a předchozího údaje podle zvoleného režimu. Výsledek se pak určí podle příslušného pásma pro 1. stupeň, 2. stupeň nebo společnou výuku." /></h2>
                  <p className="muted-text">Najeďte na ikonu „i“ u nadpisu pro stručnou metodickou nápovědu.</p>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Typ</th><th>Zdroj</th><th>Akt. žáci</th><th>Akt. třídy</th><th>Před. žáci</th><th>Před. třídy</th><th>Průměr</th><th>Výsledek</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {psychComputedRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="muted-text">Zatím nemáte zadané žádné údaje. Klikněte na „Přidat třídu / řádek“.</td>
                        </tr>
                      ) : psychComputedRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <select value={row.kind} onChange={(e) => updatePsych(row.id, "kind", e.target.value)}>
                              <option value="psych1">1. stupeň</option>
                              <option value="psych2">2. stupeň</option>
                              <option value="psychMix">1. a 2. stupeň společně</option>
                            </select>
                          </td>
                          <td>
                            <select value={row.mode} onChange={(e) => updatePsych(row.id, "mode", e.target.value)}>
                              <option value="higher_of_two">Vyšší z obou údajů</option>
                              <option value="current_only">Jen aktuální rok</option>
                            </select>
                          </td>
                          <td><input type="number" value={row.currentPupils} onChange={(e) => updatePsych(row.id, "currentPupils", Number(e.target.value) || 0)} /></td>
                          <td><input type="number" value={row.currentClasses} onChange={(e) => updatePsych(row.id, "currentClasses", Number(e.target.value) || 0)} /></td>
                          <td><input type="number" value={row.prevPupils} onChange={(e) => updatePsych(row.id, "prevPupils", Number(e.target.value) || 0)} /></td>
                          <td><input type="number" value={row.prevClasses} onChange={(e) => updatePsych(row.id, "prevClasses", Number(e.target.value) || 0)} /></td>
                          <td>{row.usedAvg}</td>
                          <td>{row.bandLabel} / {row.perClass}</td>
                          <td><button className="icon-btn" onClick={() => removePsych(row.id)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn ghost" onClick={addPsych}>Přidat třídu / řádek</button>
                </section>
              )}

              {hasSection("minority_first") && (
                <section className="card">
                  <h2>ZŠ s jazykem národnostní menšiny</h2>
                  <select value={minorityType} onChange={(e) => setMinorityType(e.target.value as keyof typeof B17_B21)}>
                    <option value="minority1">1 třída 1. stupně</option>
                    <option value="minority2">2 třídy 1. stupně</option>
                    <option value="minority3">3 a více tříd 1. stupně</option>
                    <option value="minorityFull1">Ročníky 1. i 2. stupně</option>
                  </select>
                  <div className="grid two">
                    <div className="subcard">
                      <h3>1. stupeň</h3>
                      <div className="grid two">
                        <NumberField label="Počet tříd" value={minority1Classes} onChange={setMinority1Classes} />
                        <NumberField label="Počet žáků" value={minority1Pupils} onChange={setMinority1Pupils} />
                        <ResultCard label="Průměr" value={round2(minority1Avg)} />
                        <ResultCard label="PHmax – výpočet podle typu tříd" value={`${minority1Band.label} / ${minority1Band.value}`} />
                      </div>
                    </div>
                    {minorityType === "minorityFull1" && hasSection("minority_second") && (
                      <div className="subcard">
                        <h3>2. stupeň</h3>
                        <div className="grid two">
                          <NumberField label="Počet tříd" value={minority2Classes} onChange={setMinority2Classes} />
                          <NumberField label="Počet žáků" value={minority2Pupils} onChange={setMinority2Pupils} />
                          <ResultCard label="Průměr" value={round2(minority2Avg)} />
                          <ResultCard label="PHmax – výpočet podle typu tříd" value={`${minority2Band.label} / ${minority2Band.value}`} />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="grid two">
              {hasSection("gym_groups") && (
                <section className="card">
                  <h2>Nižší ročníky víceletých gymnázií</h2>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Typ</th><th>Třídy</th><th>Žáci</th><th>Průměr</th><th>Pásmo</th><th>PHmax – výpočet podle typu tříd / třída</th><th>Mezisoučet</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gymComputedRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="muted-text">Zatím nemáte zadané žádné údaje. Klikněte na „Přidat třídu / řádek“.</td>
                        </tr>
                      ) : gymComputedRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <select value={row.kind} onChange={(e) => updateGym(row.id, "kind", e.target.value)}>
                              <option value="gym6">Gymnázium šestileté</option>
                              <option value="gym8">Gymnázium osmileté</option>
                              <option value="sport8">Gymnázium sportovní 8leté</option>
                              <option value="sport6">Gymnázium sportovní 6leté</option>
                            </select>
                          </td>
                          <td><input type="number" value={row.classes} onChange={(e) => updateGym(row.id, "classes", Number(e.target.value) || 0)} /></td>
                          <td><input type="number" value={row.pupils} onChange={(e) => updateGym(row.id, "pupils", Number(e.target.value) || 0)} /></td>
                          <td>{row.avg}</td>
                          <td>{row.bandLabel}</td>
                          <td>{row.perClass}</td>
                          <td>{row.subtotal}</td>
                          <td><button className="icon-btn" onClick={() => removeGym(row.id)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn ghost" onClick={addGym}>Přidat třídu / řádek</button>
                </section>
              )}

              {(hasSection("dominant_c_first") || hasSection("dominant_b_first")) && (
                <section className="card">
                  <h2>Smíšené třídy § 16 odst. 9 a ZŠ speciální <HelpHint text="U smíšených tříd záleží na tom, který obor ve třídě převažuje. Podle převažujícího oboru se vybere odpovídající pásmo pro výpočet PHmax." /></h2>
                  <p className="muted-text">Najeďte na ikonu „i“ u nadpisu pro stručnou metodickou nápovědu.</p>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Stupeň</th><th>Převažující obor</th><th>Třídy</th><th>Žáci</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mixedRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="muted-text">Zatím nemáte zadané žádné údaje. Klikněte na „Přidat třídu / řádek“.</td>
                        </tr>
                      ) : mixedRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <select value={row.stage} onChange={(e) => updateMixed(row.id, "stage", e.target.value)}>
                              <option value="first">1. stupeň</option>
                              <option value="second">2. stupeň</option>
                            </select>
                          </td>
                          <td>
                            <select value={row.majority} onChange={(e) => updateMixed(row.id, "majority", e.target.value)}>
                              <option value="zs">79-01-C/01</option>
                              <option value="special">79-01-B/01 nebo shoda</option>
                            </select>
                          </td>
                          <td><input type="number" value={row.classes} onChange={(e) => updateMixed(row.id, "classes", Number(e.target.value) || 0)} /></td>
                          <td><input type="number" value={row.pupils} onChange={(e) => updateMixed(row.id, "pupils", Number(e.target.value) || 0)} /></td>
                          <td><button className="icon-btn" onClick={() => removeMixed(row.id)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn ghost" onClick={addMixed}>Přidat třídu / řádek</button>
                </section>
              )}
            </div>

            {(hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) && (
              <section className="card">
                <h2>Samostatné položky PHmax – výpočet podle typu tříd</h2>
                <div className="grid four">
                  {hasSection("prep_class") && (
                    <>
                      <NumberField label="Přípravné třídy – počet tříd" value={prepClasses} onChange={setPrepClasses} />
                      <NumberField label="Přípravné třídy – počet dětí" value={prepChildren} onChange={setPrepChildren} />
                      <ResultCard label="Přípravná třída" value={`${prepAvg < 10 ? "méně než 10 dětí" : "10 a více dětí"} / ${prepPh}`} />
                      <ResultCard label="Mezisoučet" value={round2(prepClasses * prepPh)} />
                    </>
                  )}

                  {hasSection("prep_special") && (
                    <>
                      <NumberField label="Přípravný stupeň ZŠS – počet tříd" value={prepSpecialClasses} onChange={setPrepSpecialClasses} />
                      <NumberField label="Přípravný stupeň ZŠS – počet dětí" value={prepSpecialChildren} onChange={setPrepSpecialChildren} />
                      <ResultCard label="Přípravný stupeň" value={`${prepSpecialAvg < 4 ? "méně než 4 žáci" : "4 a více žáků"} / ${prepSpecialPh}`} />
                      <ResultCard label="Mezisoučet" value={round2(prepSpecialClasses * prepSpecialPh)} />
                    </>
                  )}

                  {hasSection("par38") && (
                    <>
                      <NumberField label="§ 38 – 1. stupeň" value={p38First} onChange={setP38First} />
                      <NumberField label="§ 38 – 2. stupeň" value={p38Second} onChange={setP38Second} />
                    </>
                  )}

                  {hasSection("par41") && (
                    <>
                      <NumberField label="§ 41 – 1. stupeň" value={p41First} onChange={setP41First} />
                      <NumberField label="§ 41 – 2. stupeň" value={p41Second} onChange={setP41Second} />
                    </>
                  )}
                </div>
              </section>
            )}

            {hasSection("nv75_teacher_type") && (
              <section className="card">
                <h2>NV 75/2005 Sb. – učitel</h2>
                <p className="muted-text">Formulář pro učitele doplníme v dalším kroku.</p>
              </section>
            )}

            {hasSection("nv75_headteacher_type") && (
              <section className="card">
                <h2>NV 75/2005 Sb. – ředitel školy</h2>
                <p className="muted-text">Formulář pro ředitele doplníme v dalším kroku.</p>
              </section>
            )}

            {hasSection("nv75_deputy_units") && (
              <section className="card">
                <h2>NV 75/2005 Sb. – zástupce ředitele</h2>
                <p className="muted-text">Formulář pro zástupce ředitele doplníme v dalším kroku.</p>
              </section>
            )}

            {hasSection("nv75_other_staff_type") && (
              <section className="card">
                <h2>NV 75/2005 Sb. – ostatní pedagogičtí pracovníci</h2>
                <p className="muted-text">Formulář pro další role doplníme v dalším kroku.</p>
              </section>
            )}

            <div className="toolbar">
              <button className="btn ghost" onClick={resetPhmax}>Vymazat údaje PHmax – výpočet podle typu tříd</button>
            </div>

            <section className="card muted">
              <h2>Souhrn výsledků výsledků PHmax – výpočet podle typu tříd</h2>
              <div className="grid four">
                <ResultCard label="Běžné třídy" value={basicPhmax} />
                <ResultCard label="§ 16 odst. 9" value={inclPhmax} />
                <ResultCard label="Psychiatrická nemocnice" value={psychPhmax} />
                <ResultCard label="Jazyk menšiny" value={minorityPhmax} />
                <ResultCard label="Víceletá gymnázia" value={gymPhmax} />
                <ResultCard label="Smíšené třídy" value={mixedPhmax} />
                <ResultCard label="ZŠ speciální" value={specialPhmax} />
                <ResultCard label="Samostatné položky" value={extrasPhmax} />
                <ResultCard label="PHmax – výpočet podle typu tříd celkem" value={totalPhmax} />
              </div>
            </section>
          </div>
        )}

        {tab === "pha" && (
          <section className="card">
            <h2>PHAmax – asistenti pedagoga</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Typ třídy</th><th>Třídy</th><th>Žáci</th><th>Průměr</th><th>Pásmo</th><th>PHAmax – asistenti pedagoga / třída</th><th>Mezisoučet</th><th></th>
                </tr>
              </thead>
              <tbody>
                {phaComputedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="muted-text">Zatím nemáte zadané žádné údaje. Klikněte na „Přidat třídu / řádek“.</td>
                  </tr>
                ) : phaComputedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select value={row.kind} onChange={(e) => updatePha(row.id, "kind", e.target.value)}>
                        <option value="zs1">ZŠ §16/9 – 1. stupeň</option>
                        <option value="zs1Heavy">ZŠ §16/9 – 1. stupeň, těžší varianty</option>
                        <option value="zs2">ZŠ §16/9 – 2. stupeň</option>
                        <option value="zs2Heavy">ZŠ §16/9 – 2. stupeň, těžší varianty</option>
                        <option value="zss1">ZŠ speciální I. díl – 1. stupeň</option>
                        <option value="zss1Heavy">ZŠ speciální I. díl – 1. stupeň, těžší varianty</option>
                        <option value="zss2">ZŠ speciální I. díl – 2. stupeň</option>
                        <option value="zss2Heavy">ZŠ speciální I. díl – 2. stupeň, těžší varianty</option>
                        <option value="zssII">ZŠ speciální II. díl</option>
                        <option value="zssIIHeavy">ZŠ speciální II. díl, těžší varianty</option>
                      </select>
                    </td>
                    <td><input type="number" value={row.classes} onChange={(e) => updatePha(row.id, "classes", Number(e.target.value) || 0)} /></td>
                    <td><input type="number" value={row.pupils} onChange={(e) => updatePha(row.id, "pupils", Number(e.target.value) || 0)} /></td>
                    <td>{row.avg}</td>
                    <td>{row.bandLabel}</td>
                    <td>{row.perClass}</td>
                    <td>{row.subtotal}</td>
                    <td><button className="icon-btn" onClick={() => removePha(row.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="toolbar">
              <button className="btn ghost" onClick={addPha}>Přidat třídu / řádek</button>
              <button className="btn ghost" onClick={resetPha}>Vymazat údaje PHAmax – asistenti pedagoga</button>
              <ResultCard label="PHAmax – asistenti pedagoga celkem" value={totalPha} />
            </div>
          </section>
        )}

        {tab === "php" && (
          <section className="card">
            <h2>PHPmax – metodický výpočet <HelpHint text="PHPmax se stanoví podle průměrného počtu žáků za předcházející tři roky. Do tohoto počtu se nezapočítávají žáci vzdělávaní v zahraničí, v zahraniční škole v ČR a v individuálním vzdělávání." /></h2>
            <p className="muted-text">
              Postup výpočtu (kroky A–D): rozhodné počty, očištění dat, výpočet a interpretace. Najeďte na ikonu „i“ u nadpisů pro stručnou metodickou nápovědu.
            </p>

            <div className="tabs" style={{ marginBottom: 16 }}>
              <button className={phpWizardStep === "a" ? "tab active" : "tab"} onClick={() => setPhpWizardStep("a")}>
                A. Vstupy
              </button>
              <button className={phpWizardStep === "b" ? "tab active" : "tab"} onClick={() => setPhpWizardStep("b")}>
                B. Očištění
              </button>
              <button className={phpWizardStep === "c" ? "tab active" : "tab"} onClick={() => setPhpWizardStep("c")}>
                C. Výpočet
              </button>
              <button className={phpWizardStep === "d" ? "tab active" : "tab"} onClick={() => setPhpWizardStep("d")}>
                D. Výklad
              </button>
            </div>

            <div className="toolbar">
              <button className="btn ghost" onClick={resetPhp}>Vymazat údaje PHPmax – metodický výpočet</button>
            </div>

            <div className="checks">
              <label>
                <input
                  type="radio"
                  checked={phpMethodMode === "three_year_avg"}
                  onChange={() => setPhpMethodMode("three_year_avg")}
                />
                Použít průměr za 3 roky
              </label>

              <label>
                <input
                  type="radio"
                  checked={phpMethodMode === "short_period"}
                  onChange={() => setPhpMethodMode("short_period")}
                />
                Použít kratší období než 3 roky
              </label>
            </div>

            {phpWizardStep === "a" && (
              <>
                <h3>Zadání počtu žáků <HelpHint text="Rozhodná hodnota pro PHPmax vychází zpravidla z průměru za tři předcházející roky." /></h3>
                <div className="grid three">
                  <NumberField label="Počet žáků – rok 1" value={phpYear1} onChange={setPhpYear1} />
                  <NumberField label="Počet žáků – rok 2" value={phpYear2} onChange={setPhpYear2} />
                  <NumberField label="Počet žáků – rok 3" value={phpYear3} onChange={setPhpYear3} />
                </div>
                <div className="grid three">
                  <ResultCard label="Metoda" value={phpMethodMode === "three_year_avg" ? "Průměr za 3 roky" : "Kratší období"} />
                  <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
                  <ResultCard label="Stav školy" value={phpExcludedSchool ? "Vyloučená z PHPmax – metodický výpočet" : "Standardní posouzení"} />
                </div>
              </>
            )}

            {phpWizardStep === "b" && (
              <>
                <h3>Žáci nezapočítávaní do výpočtu <HelpHint text="Do rozhodného počtu se nezapočítávají žáci vzdělávaní v zahraničí, v zahraniční škole v ČR a v individuálním vzdělávání." /></h3>
                <div className="grid three">
                  <NumberField label="Vzdělávání v zahraničí" value={phpExcludedAbroad} onChange={setPhpExcludedAbroad} />
                  <NumberField label="Zahraniční škola v ČR" value={phpExcludedForeignSchoolCz} onChange={setPhpExcludedForeignSchoolCz} />
                  <NumberField label="Individuální vzdělávání" value={phpExcludedIndividual} onChange={setPhpExcludedIndividual} />
                </div>
                <div className="checks">
                  <label>
                    <input
                      type="checkbox"
                      checked={phpExcludedSchool}
                      onChange={(e) => setPhpExcludedSchool(e.target.checked)}
                    />
                    Tato škola se do PHPmax – metodický výpočet nezapočítává
                  </label>
                </div>
                <div className="grid three">
                  <ResultCard label="Součet vyloučených žáků" value={phpExcludedTotal} />
                  <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
                  <ResultCard label="Očištěná hodnota" value={phpAdjustedValue} />
                </div>
              </>
            )}

            {phpWizardStep === "c" && (
              <>
                <h3>Výpočet výsledné hodnoty PHPmax – metodický výpočet</h3>
                <div className="grid three">
                  <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
                  <ResultCard label="Součet nezapočítávaných žáků" value={phpExcludedTotal} />
                  <ResultCard label="Očištěná hodnota" value={phpAdjustedValue} />
                </div>
                <div className="grid three">
                  <ResultCard label="Zařazení do pásma" value={phpBand.label} />
                  <ResultCard label="PHPmax – metodický výpočet" value={phpBand.value} />
                  <ResultCard label="PHPmax – metodický výpočet celkem" value={totalPhp} />
                </div>
              </>
            )}

            {phpWizardStep === "d" && (
              <>
                <h3>Jak výsledek interpretovat v praxi <HelpHint text="Výsledkem je týdenní rozsah financované přímé pedagogické činnosti podle příslušného pásma PHPmax." /></h3>
                <div className="subcard">
                  <p className="muted-text">
                    1. Nejprve se určí rozhodná hodnota podle zvolené metody.
                  </p>
                  <p className="muted-text">
                    2. Poté se odečtou žáci, kteří se do výpočtu nezapočítávají.
                  </p>
                  <p className="muted-text">
                    3. Očištěná hodnota se porovná s pásmy PHP_TABLE.
                  </p>
                  <p className="muted-text">
                    4. Pokud je škola vyloučená z PHPmax – metodický výpočet, výsledek je 0 bez ohledu na počty žáků.
                  </p>
                </div>
                <div className="grid three">
                  <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
                  <ResultCard label="Očištěná hodnota" value={phpAdjustedValue} />
                  <ResultCard label="Výsledek PHPmax – metodický výpočet" value={totalPhp} />
                </div>
              </>
            )}
          </section>
        )}

        <section className="card muted">
          <h2>Celkový přehled</h2>
          <p className="muted-text">Výsledky PHmax, PHAmax a PHPmax se stanovují samostatně. Součet níže slouží jen pro orientaci.</p>
          <p className="muted-text">PHmax – výpočet podle typu tříd, PHAmax – asistenti pedagoga a PHPmax – metodický výpočet se stanovují odděleně. Součet níže je přehledový.</p>
          <div className="grid four">
            <ResultCard label="PHmax – výpočet podle typu tříd" value={totalPhmax} />
            <ResultCard label="PHAmax – asistenti pedagoga" value={totalPha} />
            <ResultCard label="PHPmax – metodický výpočet" value={totalPhp} />
            <ResultCard label="Přehledový součet" value={round2(totalPhmax + totalPha + totalPhp)} />
          </div>
        </section>
      </div>
    </div>
  );
}
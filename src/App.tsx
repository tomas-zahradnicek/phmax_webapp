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

function exportCsvLocalized(rows: readonly (readonly [string, string | number])[]) {
  const escapeCell = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;
  const body = rows.map(([label, value]) => [escapeCell(label), escapeCell(value)].join(";")).join("\r\n");
  return "\ufeff" + ["Položka;Hodnota", body].join("\r\n");
}


type TabKey = "phmax" | "pha" | "php";

type PhpWizardStep = "a" | "b" | "c" | "d";
type PhpMethodMode = "three_year_avg" | "short_period";
type Nv75Role = "ucitel" | "reditel";
type Nv75School = "plavecka_skola";
type ExampleKey = "" | "phmax_bezna_zs" | "phpmax_tri_roky" | "psychiatricka_nemocnice" | "smisene_tridy" | "pripravna_trida" | "mala_skola_pod_limitem" | "skola_s_odecty_phpmax" | "inkluzivni_skola";
type WizardChoice = "" | "php_small" | "php_deductions" | "ph_inclusion" | "ph_psych" | "ph_mixed" | "ph_prep";
type DataMode = "own" | "example";

function clampNonNegative(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function sumNumbers(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function getInitialPreferredMode(): CalculatorMode {
  const preferred = Object.values(MODE_CONFIG).find(
    (item) =>
      item.group === "phmax" &&
      item.label.toLowerCase().includes("úplná zš") &&
      !item.label.includes("§ 16")
  );

  return (preferred?.id ?? DEFAULT_MODE) as CalculatorMode;
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
    <span title={text} className="help-hint" aria-label={text}>
      i
    </span>
  );
}



function GlossaryIconButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="glossary-icon-btn"
      onClick={onClick}
      title="Otevřít slovníček pojmů"
      aria-label="Otevřít slovníček pojmů"
    >
      <span className="glossary-icon-btn__book" aria-hidden="true">📘</span>
      <span className="glossary-icon-btn__label">Slovníček</span>
    </button>
  );
}

function HeroStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat__label">{label}</div>
      <div className="hero-stat__value">{value}</div>
    </div>
  );
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return <p className="section-lead muted-text">{children}</p>;
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


const GLOSSARY_TERMS = [
  {
    term: "PHmax",
    description:
      "Hodnota PHmax představuje maximální týdenní počet hodin vyučování v rozsahu podle rámcového vzdělávacího programu financovaný ze státního rozpočtu.",
  },
  {
    term: "PHAmax",
    description:
      "Hodnota PHAmax představuje maximální týdenní počet hodin přímé pedagogické činnosti asistenta pedagoga financovaný ze státního rozpočtu ve školách a třídách zřízených podle § 16 odst. 9 školského zákona, speciálních a ve třídách přípravného stupně základní školy speciální.",
  },
  {
    term: "PHPmax",
    description:
      "Hodnota PHPmax představuje maximální týdenní počet hodin přímé pedagogické činnosti zajišťované psychologem, speciálním pedagogem nebo sociálním pedagogem financovaný ze státního rozpočtu v základní škole v závislosti na průměrném počtu žáků.",
  },
  {
    term: "Průměrný počet žáků ve třídě",
    description:
      "Základní vstup pro výpočet PHmax. Určuje se samostatně pro příslušnou charakteristiku třídy a podle něj se přiřazuje hodnota PHmax na 1 třídu.",
  },
  {
    term: "Pásmo pro určení PHmax",
    description:
      "Pásmo se přiřadí podle průměrného počtu žáků ve třídě. Na jeho základě se určí hodnota PHmax pro danou charakteristiku třídy.",
  },
  {
    term: "Třída zřízená podle § 16 odst. 9 školského zákona",
    description:
      "Pro třídy 16/9 se hodnota PHmax i PHAmax stanoví odděleně od ostatních tříd. V případě společné výuky žáků 1. a 2. stupně v jedné třídě se použijí hodnoty pro 2. stupeň.",
  },
  {
    term: "Přípravná třída základní školy",
    description:
      "Hodnoty PHmax pro přípravnou třídu základní školy se počítají samostatně. Při více přípravných třídách se vypočte průměrný počet dětí v přípravné třídě a podle něj se stanoví hodnota PHmax.",
  },
  {
    term: "Třída přípravného stupně základní školy speciální",
    description:
      "Hodnoty PHmax a PHAmax pro třídy přípravného stupně základní školy speciální se počítají samostatně. Při více třídách se vychází z průměrného počtu dětí v těchto třídách.",
  },
  {
    term: "Žák vzdělávaný podle § 38 školského zákona",
    description:
      "Žák vzdělávaný podle § 38 školského zákona se nezapočítává do počtu žáků ve třídě rozhodného pro stanovení výše PHmax. Celková výše PHmax školy se však za každého takového žáka zvyšuje samostatně.",
  },
  {
    term: "Žák vzdělávaný podle § 41 školského zákona",
    description:
      "Žák vzdělávaný podle § 41 školského zákona se nezapočítává do počtu žáků ve třídě rozhodného pro stanovení výše PHmax. Celková výše PHmax školy se za každého takového žáka zvyšuje samostatně.",
  },
] as const;

function buildShareText(data: {
  modeLabel: string;
  tab: string;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  warnings: string[];
  inputMode: DataMode;
}) {
  const rows = [
    "Shrnutí kalkulačky ZŠ",
    "",
    `Režim: ${data.modeLabel}`,
    `Aktivní modul: ${data.tab}`,
    `Práce s údaji: ${data.inputMode === "example" ? "ukázkový příklad" : "vlastní škola"}`,
    "",
    `Výsledek PHmax: ${data.totalPhmax}`,
    `Výsledek PHAmax: ${data.totalPha}`,
    `Výsledek PHPmax: ${data.totalPhp}`,
  ];
  if (data.warnings.length) {
    rows.push("", "Upozornění:");
    data.warnings.forEach((item) => rows.push(`- ${item}`));
  }
  return rows.join("\n");
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("phmax");
  const [mode, setMode] = useState<CalculatorMode>(getInitialPreferredMode());

  const modeOptions = useMemo(() => {
    return Object.values(MODE_CONFIG).filter((item) => {
      if (tab === "phmax") return item.group === "phmax";
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

  const findModeBySections = (...sections: FormSection[]): CalculatorMode => {
    const candidate = Object.values(MODE_CONFIG).find((item) =>
      item.group === "phmax" && sections.every((section) => getVisibleSections(item.id).includes(section))
    );
    return (candidate?.id ?? DEFAULT_MODE) as CalculatorMode;
  };


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

  const [mixedMethodFirstZsPupils, setMixedMethodFirstZsPupils] = useState(0);
  const [mixedMethodFirstZsClasses, setMixedMethodFirstZsClasses] = useState(0);
  const [mixedMethodFirstSpecialPupils, setMixedMethodFirstSpecialPupils] = useState(0);
  const [mixedMethodFirstSpecialClasses, setMixedMethodFirstSpecialClasses] = useState(0);
  const [mixedMethodSecondZsPupils, setMixedMethodSecondZsPupils] = useState(0);
  const [mixedMethodSecondZsClasses, setMixedMethodSecondZsClasses] = useState(0);
  const [mixedMethodSecondSpecialPupils, setMixedMethodSecondSpecialPupils] = useState(0);
  const [mixedMethodSecondSpecialClasses, setMixedMethodSecondSpecialClasses] = useState(0);


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
  const [wizardChoice, setWizardChoice] = useState<WizardChoice>("");
  const [dataMode, setDataMode] = useState<DataMode>("own");
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [uiNotice, setUiNotice] = useState<string>("");

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

  const basic1Phmax = round2(basic1Classes * basicFirstBand.value);
  const basic2Phmax = round2(isFull ? basic2Classes * basicSecondBand.value : 0);
  const incl1Phmax = round2(incl1Classes * incl1Band.value);
  const incl2Phmax = round2(incl2Classes * incl2Band.value);
  const minority1Phmax = round2(minority1Classes * minority1Band.value);
  const minority2Phmax = round2(minorityType === "minorityFull1" ? minority2Classes * minority2Band.value : 0);
  const special1PhmaxPart = round2(special1Classes * special1Band.value);
  const special2PhmaxPart = round2(special2Classes * special2Band.value);
  const specialIIPhmaxPart = round2(specialIIClasses * specialIIBand.value);
  const prepClassPhmax = round2(prepClasses * prepPh);
  const prepSpecialPhmax = round2(prepSpecialClasses * prepSpecialPh);
  const par38Phmax = round2(p38First * 0.25 + p38Second * 0.5);
  const par41Phmax = round2(p41First * 0.25 + p41Second * 0.5);


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

  const mixedMethodFirstZsAvg = mixedMethodFirstZsClasses > 0 ? mixedMethodFirstZsPupils / mixedMethodFirstZsClasses : 0;
  const mixedMethodSecondZsAvg = mixedMethodSecondZsClasses > 0 ? mixedMethodSecondZsPupils / mixedMethodSecondZsClasses : 0;
  const mixedMethodFirstSpecialAvg = mixedMethodFirstSpecialClasses > 0 ? mixedMethodFirstSpecialPupils / mixedMethodFirstSpecialClasses : 0;
  const mixedMethodSecondSpecialAvg = mixedMethodSecondSpecialClasses > 0 ? mixedMethodSecondSpecialPupils / mixedMethodSecondSpecialClasses : 0;

  const mixedMethodFirstZsBand = pickBand(mixedMethodFirstZsAvg, B9_B10.first);
  const mixedMethodSecondZsBand = pickBand(mixedMethodSecondZsAvg, B9_B10.second);
  const mixedMethodFirstSpecialBand = pickBand(mixedMethodFirstSpecialAvg, B26_B28.special1);
  const mixedMethodSecondSpecialBand = pickBand(mixedMethodSecondSpecialAvg, B26_B28.special2);

  const mixedMethodFirstZsResult = round2(mixedMethodFirstZsClasses * mixedMethodFirstZsBand.value);
  const mixedMethodSecondZsResult = round2(mixedMethodSecondZsClasses * mixedMethodSecondZsBand.value);
  const mixedMethodFirstSpecialResult = round2(mixedMethodFirstSpecialClasses * mixedMethodFirstSpecialBand.value);
  const mixedMethodSecondSpecialResult = round2(mixedMethodSecondSpecialClasses * mixedMethodSecondSpecialBand.value);
  const mixedMethodFirstTotal = round2(mixedMethodFirstZsResult + mixedMethodFirstSpecialResult);
  const mixedMethodSecondTotal = round2(mixedMethodSecondZsResult + mixedMethodSecondSpecialResult);
  const mixedMethodTotal = round2(mixedMethodFirstTotal + mixedMethodSecondTotal);

  const extrasPhmax = round2(prepClassPhmax + prepSpecialPhmax + par38Phmax + par41Phmax);
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
    setMixedMethodFirstZsPupils(0);
    setMixedMethodFirstZsClasses(0);
    setMixedMethodFirstSpecialPupils(0);
    setMixedMethodFirstSpecialClasses(0);
    setMixedMethodSecondZsPupils(0);
    setMixedMethodSecondZsClasses(0);
    setMixedMethodSecondSpecialPupils(0);
    setMixedMethodSecondSpecialClasses(0);

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
    setSelectedExample("");
    setWizardChoice("");
    setDataMode("own");
    setTab("phmax");
  };

  const loadDemoData = () => {
    setMode(getInitialPreferredMode());
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
    setDataMode("example");

    resetAll();

    if (example === "phmax_bezna_zs") {
      setMode(getInitialPreferredMode());
      setTab("phmax");
      setBasicType("full_more_than_2");
      setBasic1Classes(10);
      setBasic1Pupils(250);
      setBasic2Classes(8);
      setBasic2Pupils(225);
      return;
    }

    if (example === "phpmax_tri_roky") {
      setMode(getInitialPreferredMode());
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
      setMode(findModeBySections("psych_groups"));
      setTab("phmax");
      setPsychRows([
        { id: 1, kind: "psych1", mode: "higher_of_two", currentPupils: 7, currentClasses: 1, prevPupils: 6, prevClasses: 1 },
      ]);
      return;
    }

    if (example === "smisene_tridy") {
      setMode(findModeBySections("dominant_c_first"));
      setTab("phmax");
      setMixedMethodFirstZsPupils(47);
      setMixedMethodFirstZsClasses(4);
      setMixedMethodFirstSpecialPupils(26);
      setMixedMethodFirstSpecialClasses(3);
      setMixedMethodSecondZsPupils(38);
      setMixedMethodSecondZsClasses(3);
      setMixedMethodSecondSpecialPupils(31);
      setMixedMethodSecondSpecialClasses(4);
      return;
    }


    if (example === "mala_skola_pod_limitem") {
      setMode(getInitialPreferredMode());
      setTab("php");
      setPhpWizardStep("a");
      setPhpMethodMode("three_year_avg");
      setPhpYear1(120);
      setPhpYear2(130);
      setPhpYear3(125);
      setPhpExcludedAbroad(0);
      setPhpExcludedForeignSchoolCz(0);
      setPhpExcludedIndividual(0);
      return;
    }

    if (example === "skola_s_odecty_phpmax") {
      setMode(DEFAULT_MODE);
      setTab("php");
      setPhpWizardStep("a");
      setPhpMethodMode("three_year_avg");
      setPhpYear1(300);
      setPhpYear2(310);
      setPhpYear3(305);
      setPhpExcludedAbroad(15);
      setPhpExcludedForeignSchoolCz(10);
      setPhpExcludedIndividual(5);
      return;
    }

    if (example === "inkluzivni_skola") {
      setMode(findModeBySections("basic_first", "sec16_first"));
      setTab("phmax");
      setBasic1Classes(6);
      setBasic1Pupils(120);
      setBasic2Classes(5);
      setBasic2Pupils(110);

      setIncl1Classes(2);
      setIncl1Pupils(20);
      setIncl2Classes(1);
      setIncl2Pupils(10);
      return;
    }

    if (example === "pripravna_trida") {
      setMode(findModeBySections("prep_class"));
      setTab("phmax");
      setPrepClasses(1);
      setPrepChildren(12);
      setPrepSpecialClasses(1);
      setPrepSpecialChildren(4);
      return;
    }
  };


  const applyWizardChoice = (choice: WizardChoice) => {
    setWizardChoice(choice);
    if (!choice) return;

    if (choice === "php_small") {
      loadExample("mala_skola_pod_limitem");
      return;
    }

    if (choice === "php_deductions") {
      loadExample("skola_s_odecty_phpmax");
      return;
    }

    if (choice === "ph_inclusion") {
      loadExample("inkluzivni_skola");
      return;
    }

    if (choice === "ph_psych") {
      loadExample("psychiatricka_nemocnice");
      return;
    }

    if (choice === "ph_mixed") {
      loadExample("smisene_tridy");
      return;
    }

    if (choice === "ph_prep") {
      loadExample("pripravna_trida");
      return;
    }
  };


  const buildSnapshot = () => ({
    tab,
    mode,
    basicType,
    basic1Classes,
    basic1Pupils,
    basic2Classes,
    basic2Pupils,
    incl1Classes,
    incl1Pupils,
    incl2Classes,
    incl2Pupils,
    psychRows,
    minorityType,
    minority1Classes,
    minority1Pupils,
    minority2Classes,
    minority2Pupils,
    gymRows,
    mixedRows,
    special1Classes,
    special1Pupils,
    special2Classes,
    special2Pupils,
    specialIIClasses,
    specialIIPupils,
    prepClasses,
    prepChildren,
    prepSpecialClasses,
    prepSpecialChildren,
    p38First,
    p38Second,
    p41First,
    p41Second,
    phaRows,
    phpYear1,
    phpYear2,
    phpYear3,
    phpWizardStep,
    phpMethodMode,
    phpExcludedAbroad,
    phpExcludedForeignSchoolCz,
    phpExcludedIndividual,
    phpExcludedSchool,
    selectedExample,
    wizardChoice,
    dataMode,
  });

  const restoreSnapshot = () => {
    try {
      const raw = localStorage.getItem("edu-cz-zs-calculator-state");
      if (!raw) {
        setUiNotice("Nebyla nalezena žádná uložená data.");
        return;
      }
      const s = JSON.parse(raw);
      if (s.tab) setTab(s.tab);
      if (s.mode) setMode(s.mode);
      if (s.basicType) setBasicType(s.basicType);
      setBasic1Classes(s.basic1Classes ?? 0);
      setBasic1Pupils(s.basic1Pupils ?? 0);
      setBasic2Classes(s.basic2Classes ?? 0);
      setBasic2Pupils(s.basic2Pupils ?? 0);
      setIncl1Classes(s.incl1Classes ?? 0);
      setIncl1Pupils(s.incl1Pupils ?? 0);
      setIncl2Classes(s.incl2Classes ?? 0);
      setIncl2Pupils(s.incl2Pupils ?? 0);
      setPsychRows(s.psychRows ?? []);
      if (s.minorityType) setMinorityType(s.minorityType);
      setMinority1Classes(s.minority1Classes ?? 0);
      setMinority1Pupils(s.minority1Pupils ?? 0);
      setMinority2Classes(s.minority2Classes ?? 0);
      setMinority2Pupils(s.minority2Pupils ?? 0);
      setGymRows(s.gymRows ?? []);
      setMixedRows(s.mixedRows ?? []);
      setSpecial1Classes(s.special1Classes ?? 0);
      setSpecial1Pupils(s.special1Pupils ?? 0);
      setSpecial2Classes(s.special2Classes ?? 0);
      setSpecial2Pupils(s.special2Pupils ?? 0);
      setSpecialIIClasses(s.specialIIClasses ?? 0);
      setSpecialIIPupils(s.specialIIPupils ?? 0);
      setPrepClasses(s.prepClasses ?? 0);
      setPrepChildren(s.prepChildren ?? 0);
      setPrepSpecialClasses(s.prepSpecialClasses ?? 0);
      setPrepSpecialChildren(s.prepSpecialChildren ?? 0);
      setP38First(s.p38First ?? 0);
      setP38Second(s.p38Second ?? 0);
      setP41First(s.p41First ?? 0);
      setP41Second(s.p41Second ?? 0);
      setPhaRows(s.phaRows ?? []);
      setPhpYear1(s.phpYear1 ?? 0);
      setPhpYear2(s.phpYear2 ?? 0);
      setPhpYear3(s.phpYear3 ?? 0);
      if (s.phpWizardStep) setPhpWizardStep(s.phpWizardStep);
      if (s.phpMethodMode) setPhpMethodMode(s.phpMethodMode);
      setPhpExcludedAbroad(s.phpExcludedAbroad ?? 0);
      setPhpExcludedForeignSchoolCz(s.phpExcludedForeignSchoolCz ?? 0);
      setPhpExcludedIndividual(s.phpExcludedIndividual ?? 0);
      setPhpExcludedSchool(Boolean(s.phpExcludedSchool));
      setSelectedExample(s.selectedExample ?? "");
      setWizardChoice(s.wizardChoice ?? "");
      setDataMode(s.dataMode ?? "own");
      setUiNotice("Uložená data byla obnovena.");
    } catch (error) {
      console.error("Nepodařilo se obnovit uložená data.", error);
      setUiNotice("Obnovení uložených dat se nepodařilo.");
    }
  };

  const clearStoredSnapshot = () => {
    localStorage.removeItem("edu-cz-zs-calculator-state");
    setLastSavedAt("");
    setUiNotice("Uložená data byla vymazána.");
  };

  const saveSnapshotManually = () => {
    localStorage.setItem("edu-cz-zs-calculator-state", JSON.stringify(buildSnapshot()));
    setLastSavedAt(new Date().toLocaleString("cs-CZ"));
    setUiNotice("Rozpracované údaje byly uloženy.");
  };

  const copySummaryToClipboard = async () => {
    const text = buildShareText({
      modeLabel: MODE_CONFIG[mode].label,
      tab: tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax",
      totalPhmax,
      totalPha,
      totalPhp,
      warnings,
      inputMode: dataMode,
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Nepodařilo se zkopírovat shrnutí.", error);
    }
  };

  const printSummaryWindow = () => {
    const text = buildShareText({
      modeLabel: MODE_CONFIG[mode].label,
      tab: tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax",
      totalPhmax,
      totalPha,
      totalPhp,
      warnings,
      inputMode: dataMode,
    }).replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>Shrnutí kalkulačky ZŠ</title>` +
        `<style>` +
        `@page{margin:10mm 12mm;size:A4}` +
        `body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;padding:0;font-size:9pt;line-height:1.4;color:#0f172a}` +
        `h1{font-size:12pt;margin:0 0 8px;font-weight:800}` +
        `.box{border:1px solid #94a3b8;border-radius:6px;padding:10px 12px;background:#fff}` +
        `</style></head><body><h1>Shrnutí kalkulačky ZŠ</h1><div class="box">${text}</div></body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  const goToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const validationIssues = (() => {
    const issues: { section: string; label: string }[] = [];
    if (tab === "phmax") {
      if (basic1Classes === 0 && basic2Classes === 0 && incl1Classes === 0 && incl2Classes === 0 && psychRows.length === 0 && minority1Classes === 0 && gymRows.length === 0 && mixedRows.length === 0 && special1Classes === 0 && special2Classes === 0 && specialIIClasses === 0 && prepClasses === 0 && prepSpecialClasses === 0) {
        issues.push({ section: "basic", label: "Vyplňte alespoň jednu relevantní sekci v PHmax." });
      }
    }
    if (tab === "pha" && phaRows.length === 0) {
      issues.push({ section: "pha", label: "Přidejte alespoň jeden řádek do PHAmax." });
    }
    if (tab === "php") {
      if (phpYear1 === 0 && phpYear2 === 0 && phpYear3 === 0) {
        issues.push({ section: "php", label: "Zadejte počty žáků pro PHPmax." });
      }
    }
    return issues;
  })();

  const incompleteSections = new Set(validationIssues.map((item) => item.section)).size;
  const firstIssueSection = validationIssues[0]?.section ?? "";
  const hasIssue = (sectionId: string) => validationIssues.some((item) => item.section === sectionId);

  useEffect(() => {
    try {
      localStorage.setItem("edu-cz-zs-calculator-state", JSON.stringify(buildSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
    } catch (error) {
      console.error("Nepodařilo se uložit průběžná data.", error);
    }
  }, [
    tab, mode, basicType, basic1Classes, basic1Pupils, basic2Classes, basic2Pupils,
    incl1Classes, incl1Pupils, incl2Classes, incl2Pupils, psychRows, minorityType,
    minority1Classes, minority1Pupils, minority2Classes, minority2Pupils, gymRows, mixedRows,
    special1Classes, special1Pupils, special2Classes, special2Pupils, specialIIClasses,
    specialIIPupils, prepClasses, prepChildren, prepSpecialClasses, prepSpecialChildren,
    p38First, p38Second, p41First, p41Second, phaRows, phpYear1, phpYear2, phpYear3,
    phpWizardStep, phpMethodMode, phpExcludedAbroad, phpExcludedForeignSchoolCz,
    phpExcludedIndividual, phpExcludedSchool, selectedExample, wizardChoice, dataMode
  ]);

  const summaryRows = [
    ["Běžné třídy ZŠ – 1. stupeň", basic1Phmax],
    ["Běžné třídy ZŠ – 2. stupeň", basic2Phmax],
    ["Běžné třídy ZŠ – celkem", basicPhmax],
    ["Třídy podle § 16 odst. 9 – 1. stupeň", incl1Phmax],
    ["Třídy podle § 16 odst. 9 – 2. stupeň", incl2Phmax],
    ["Třídy podle § 16 odst. 9 – celkem", inclPhmax],
    ["Škola při psychiatrické nemocnici", psychPhmax],
    ["ZŠ s jazykem národnostní menšiny – 1. stupeň", minority1Phmax],
    ["ZŠ s jazykem národnostní menšiny – 2. stupeň", minority2Phmax],
    ["ZŠ s jazykem národnostní menšiny – celkem", minorityPhmax],
    ["Nižší ročníky víceletých gymnázií", gymPhmax],
    ["Smíšené třídy § 16 odst. 9 a ZŠ speciální – 1. stupeň", mixedMethodFirstTotal || mixedRows.filter((row) => row.stage === "first").reduce((sum, row) => { const avg = row.classes > 0 ? row.pupils / row.classes : 0; const band = row.majority === "zs" ? pickBand(avg, B9_B10.first) : pickBand(avg, B26_B28.special1); return sum + row.classes * band.value; }, 0)],
    ["Smíšené třídy § 16 odst. 9 a ZŠ speciální – 2. stupeň", mixedMethodSecondTotal || mixedRows.filter((row) => row.stage === "second").reduce((sum, row) => { const avg = row.classes > 0 ? row.pupils / row.classes : 0; const band = row.majority === "zs" ? pickBand(avg, B9_B10.second) : pickBand(avg, B26_B28.special2); return sum + row.classes * band.value; }, 0)],
    ["Smíšené třídy § 16 odst. 9 a ZŠ speciální – celkem", mixedMethodTotal || mixedPhmax],
    ["ZŠ speciální – I. díl 1. stupeň", special1PhmaxPart],
    ["ZŠ speciální – I. díl 2. stupeň", special2PhmaxPart],
    ["ZŠ speciální – II. díl", specialIIPhmaxPart],
    ["ZŠ speciální – celkem", specialPhmax],
    ["Samostatné položky – přípravná třída", prepClassPhmax],
    ["Samostatné položky – přípravný stupeň ZŠS", prepSpecialPhmax],
    ["Samostatné položky – § 38", par38Phmax],
    ["Samostatné položky – § 41", par41Phmax],
    ["Samostatné položky PHmax – celkem", extrasPhmax],
    ["Výsledek PHmax", totalPhmax],
    ["Výsledek PHAmax", totalPha],
    ["PHPmax – rozhodná hodnota", phpBaseValue],
    ["PHPmax – nezapočítávaní žáci", phpExcludedTotal],
    ["PHPmax – očištěná hodnota", phpAdjustedValue],
    ["Výsledek PHPmax", totalPhp],
  ] as const;


  const handleExportCsv = () => {
    downloadTextFile("kalkulacka-zs-souhrn.csv", exportCsvLocalized(summaryRows), "text/csv;charset=utf-8");
    setUiNotice("Souhrn byl exportován do CSV ve formátu vhodném pro české prostředí.");
  };

  return (
    <div className="app-shell app-shell--gradient">
      <div className="container container--app">
        <header className="hero hero--feature">
          <div className="hero__orb hero__orb--one" />
          <div className="hero__orb hero__orb--two" />

          <div className="pill pill--hero">
            Kalkulačka pro základní školy
          </div>

          <div className="grid two hero__grid">
            <div>
              <h1 className="hero__title">
                Přehledný průvodce výpočtem PHmax, PHAmax a PHPmax
              </h1>
              <p className="hero__text">
                Aplikace spojuje rozcestník, ukázkové situace, metodické nápovědy a samotný výpočet.
                Soustředí se na PHmax, PHAmax a PHPmax.
                Hodí se zejména ředitelům a vedení škol.
              </p>
            </div>

            <div className="hero__stats">
              <HeroStat label="Aktivní modul" value={tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax"} />
              <HeroStat label="Zvolený režim" value={MODE_CONFIG[mode].label} />
              <HeroStat label="Výsledek PHmax" value={totalPhmax} />
              <HeroStat label="Výsledek PHPmax" value={totalPhp} />
            </div>
          </div>

          <div className="hero-actions">
            <div className="field field--hero-select hero-actions__example">
              <span className="field__label field__label--hero">Ukázkový příklad</span>
              <select
                value={selectedExample}
                onChange={(e) => loadExample(e.target.value as ExampleKey)}
              >
                <option value="">Vyberte ukázkový příklad…</option>
                <option value="phmax_bezna_zs">PHmax – běžná úplná ZŠ</option>
                <option value="psychiatricka_nemocnice">PHmax – škola při psychiatrické nemocnici</option>
                <option value="smisene_tridy">PHmax – smíšené třídy</option>
                <option value="pripravna_trida">PHmax – přípravná třída</option>
              </select>
            </div>
            <div className="hero-actions__group hero-actions__group--primary">
              <button type="button" className="btn btn--light" onClick={() => window.print()}>Tisk</button>
              <button type="button" className="btn ghost" onClick={saveSnapshotManually}>Uložit</button>
              <button type="button" className="btn ghost" onClick={restoreSnapshot}>Obnovit</button>
              <GlossaryIconButton onClick={() => setGlossaryOpen(true)} />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions__group hero-actions__group--meta">
              <button type="button" className="btn ghost" onClick={clearStoredSnapshot}>
                Vymazat uložená data
              </button>
              <button type="button" className="btn ghost" onClick={resetAll}>
                Vymazat všechny údaje
              </button>
            </div>
            <div className="hero-actions__group hero-actions__group--exports">
              <button type="button" className="btn ghost" onClick={handleExportCsv}>CSV</button>
              <button type="button" className="btn ghost" onClick={copySummaryToClipboard}>
                Kopírovat shrnutí
              </button>
              <button type="button" className="btn ghost" onClick={printSummaryWindow}>
                Tisk shrnutí
              </button>
            </div>
          </div>

          <p className="muted-text hero__note">
            Ukázkové příklady vycházejí z typických situací v metodice a z logiky jednotlivých výpočtů.
            Po načtení je můžete upravit podle vlastní školy.
          </p>
          <p className="muted-text hero__legal-note">
            Právní a metodický podklad aplikace: Metodika stanovení PHmax, PHAmax a PHPmax pro základní vzdělávání, nařízení vlády č. 123/2018 Sb. a vyhláška č. 48/2005 Sb.
          </p>
          <div className="hero-status">
            <div className="hero-status__item"><strong>Automatické ukládání:</strong> probíhá průběžně v tomto prohlížeči.</div>
            <div className="hero-status__item"><strong>Poslední uložení:</strong> {lastSavedAt || "zatím neproběhlo"}</div>
            {uiNotice ? <div className="hero-status__item hero-status__item--notice">{uiNotice}</div> : null}
          </div>
        </header>

        <section className="card card--onboarding section-card section-card--onboarding">
          <div className="onboarding">
            <div className="onboarding__intro">
              <div className="pill pill--step">Začněte tady</div>
              <h2 className="section-title">Jak postupovat krok za krokem</h2>
              <p className="muted-text">
                Pokud aplikaci otevíráte poprvé, držte se tohoto pořadí. V každém kroku můžete použít ukázkový příklad nebo zadat vlastní údaje.
              </p>
            </div>

            <div className="onboarding__steps">
              <div className="onboarding-step">
                <div className="onboarding-step__number">1</div>
                <div className="onboarding-step__body">
                  <div className="onboarding-step__title">Vyberte situaci školy</div>
                  <div className="onboarding-step__text">Použijte rychlý rozcestník nebo ukázkový příklad v horní liště.</div>
                </div>
              </div>

              <div className="onboarding-step">
                <div className="onboarding-step__number">2</div>
                <div className="onboarding-step__body">
                  <div className="onboarding-step__title">Zvolte režim a modul</div>
                  <div className="onboarding-step__text">Vyberte typ školy a potom přepněte na PHmax, PHAmax nebo PHPmax.</div>
                </div>
              </div>

              <div className="onboarding-step">
                <div className="onboarding-step__number">3</div>
                <div className="onboarding-step__body">
                  <div className="onboarding-step__title">Vyplňte údaje v kartách</div>
                  <div className="onboarding-step__text">Zadávejte počty tříd a žáků v příslušných sekcích. Nápovědu najdete pod ikonou „i“.</div>
                </div>
              </div>

              <div className="onboarding-step">
                <div className="onboarding-step__number">4</div>
                <div className="onboarding-step__body">
                  <div className="onboarding-step__title">Zkontrolujte průběžný a závěrečný výsledek</div>
                  <div className="onboarding-step__text">Sledujte „Aktuální přehled výsledků“, souhrn modulu a celkový přehled dole na stránce.</div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section className="card card--accent section-card section-card--guide" data-section="guide">
          <h2 className="section-title">Rychlý rozcestník</h2>
          <SectionLead>
            Nejste si jistí, kde začít? Vyberte situaci, která se nejvíc blíží vaší škole. Aplikace vás přesměruje na správnou část kalkulačky a vyplní odpovídající ukázkový příklad.
          </SectionLead>

          <div className="grid two">
            <div className="field">
              <span>Jakou situaci chcete řešit?</span>
              <select value={wizardChoice} onChange={(e) => applyWizardChoice(e.target.value as WizardChoice)}>
                <option value="">Vyberte situaci…</option>
                <option value="php_small">Máme menší školu a chceme zjistit PHPmax</option>
                <option value="php_deductions">Máme žáky, kteří se do PHPmax nezapočítávají</option>
                <option value="ph_inclusion">Jsme škola s inkluzí a třídami podle § 16</option>
                <option value="ph_psych">Jsme škola při psychiatrické nemocnici</option>
                <option value="ph_mixed">Máme smíšené třídy</option>
                <option value="ph_prep">Máme přípravnou třídu nebo přípravný stupeň ZŠS</option>
              </select>
            </div>

            <div className="subcard">
              <h3>Co rozcestník udělá</h3>
              <p className="muted-text">
                Vybere vhodnou záložku a načte příklad, který odpovídá zvolené situaci. Potom můžete všechna data ručně upravit podle vlastní školy.
              </p>
            </div>
          </div>
        </section>

        <section className="card card--elevated section-card section-card--setup" data-section="setup">
          <h2 className="section-title">Typ školy a režim výpočtu</h2>
          <SectionLead>
            Tady vyberete, jaký typ výpočtu chcete zobrazit. Rozcestník výše vám může s výběrem pomoci.
          </SectionLead>
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

        {warnings.length > 0 && (
          <section className="card warning card--warning">
            <h2>Kontrola vstupů</h2>
            {validationIssues.map((item, i) => (
              <div key={`v-${i}`} className="warning-row">
                • {item.label} <button type="button" className="status-link" onClick={() => goToSection(item.section)}>Přejít</button>
              </div>
            ))}
            {warnings.map((w, i) => <div key={`w-${i}`}>• {w}</div>)}
          </section>
        )}

        <div className="tabs tabs--sticky">
          <button className={tab === "phmax" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("phmax")}>PHmax</button>
          <button className={tab === "pha" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("pha")}>PHAmax</button>
          <button className={tab === "php" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("php")}>PHPmax</button>
        </div>

                <section className="card card--summary section-card section-card--live-results">
          <h2 className="section-title">Aktuální přehled výsledků</h2>
          <SectionLead>
            Výsledky navazují na metodický postup A–D: vstupní údaje, výpočet průměru, určení pásma a výsledná hodnota. Každý modul se stanovuje samostatně.
          </SectionLead>
          <div className="results-panel__meta">
            <span className="status-badge status-badge--neutral">Aktivní modul: {tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax"}</span>
            <span className={`status-badge ${incompleteSections > 0 ? "status-badge--warning" : "status-badge--ok"}`}>
              {incompleteSections > 0 ? `Nevyplněné části: ${incompleteSections}` : "Všechny hlavní části jsou vyplněné"}
            </span>
            {firstIssueSection ? (
              <button type="button" className="status-link" onClick={() => goToSection(firstIssueSection)}>
                Přejít na první nevyplněnou část
              </button>
            ) : null}
          </div>
          <div className="grid four">
            <HeroStat label="Výsledek PHmax" value={totalPhmax} />
            <HeroStat label="Výsledek PHAmax" value={totalPha} />
            <HeroStat label="Výsledek PHPmax" value={totalPhp} />
            <HeroStat label="Přehledový součet" value={round2(totalPhmax + totalPha + totalPhp)} />
          </div>
        </section>

{tab === "phmax" && (
          <div className="stack">
            {(hasSection("basic_first") || hasSection("basic_second") || hasSection("school_variant_first_stage_only")) && (
              <section className={`card section-card section-card--module section-card--module-basic${hasIssue("basic") ? " card--needs-attention" : ""}`} data-section="basic">
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
                        <ResultCard label="Průměrný počet žáků ve třídě" value={round2(basic1Avg)} tone="primary" />
                        <ResultCard label="Pásmo a PHmax na 1 třídu" value={`${basicFirstBand.label} / ${basicFirstBand.value}`} tone="primary" />
                        <ResultCard label="Výsledek PHmax – 1. stupeň" value={basic1Phmax} tone="success" />
                        <ResultCard label="Počet tříd × PHmax" value={`${basic1Classes} × ${basicFirstBand.value}`} tone="success" />
                      </div>
                    </div>
                  )}

                  {hasSection("basic_second") && (
                    <div className="subcard">
                      <h3>2. stupeň</h3>
                      <div className="grid two">
                        <NumberField label="Počet tříd" value={basic2Classes} onChange={setBasic2Classes} />
                        <NumberField label="Počet žáků" value={basic2Pupils} onChange={setBasic2Pupils} />
                        <ResultCard label="Průměrný počet žáků ve třídě" value={round2(basic2Avg)} tone="primary" />
                        <ResultCard label="Pásmo a PHmax na 1 třídu" value={`${basicSecondBand.label} / ${basicSecondBand.value}`} tone="primary" />
                        <ResultCard label="Výsledek PHmax – 2. stupeň" value={basic2Phmax} tone="success" />
                        <ResultCard label="Počet tříd × PHmax" value={`${basic2Classes} × ${basicSecondBand.value}`} tone="success" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid four section-results">
                  {hasSection("prep_class") && <ResultCard label="Přípravná třída – výsledek" value={prepClassPhmax} tone="success" />}
                  {hasSection("prep_special") && <ResultCard label="Přípravný stupeň ZŠS – výsledek" value={prepSpecialPhmax} tone="success" />}
                  {hasSection("par38") && <ResultCard label="§ 38 – výsledek" value={par38Phmax} tone="success" />}
                  {hasSection("par41") && <ResultCard label="§ 41 – výsledek" value={par41Phmax} tone="success" />}
                </div>

                {(hasSection("basic_first") || hasSection("basic_second")) && (
                  <div className="grid three section-results-strip">
                    {hasSection("basic_first") ? <ResultCard label="PHmax – 1. stupeň" value={basic1Phmax} tone="success" /> : null}
                    {hasSection("basic_second") ? <ResultCard label="PHmax – 2. stupeň" value={basic2Phmax} tone="success" /> : null}
                    <ResultCard label="PHmax – běžné třídy celkem" value={basicPhmax} tone="success" />
                  </div>
                )}
              </section>
            )}

            <div className="grid two">
              {(hasSection("sec16_first") || hasSection("sec16_second")) && (
                <section className="card section-card section-card--module section-card--module-support">
                  <h2>Třídy podle § 16 odst. 9</h2>
                  <div className="grid two">
                    {hasSection("sec16_first") && (
                      <>
                        <NumberField label="1. stupeň – třídy" value={sec16FirstClasses} onChange={setSec16FirstClasses} />
                        <NumberField label="1. stupeň – žáci" value={sec16FirstPupils} onChange={setSec16FirstPupils} />
                        <ResultCard label="1. stupeň – průměrný počet žáků" value={round2(incl1Avg)} tone="primary" />
                        <ResultCard label="1. stupeň – pásmo a PHmax na 1 třídu" value={`${sec16FirstBand.label} / ${sec16FirstBand.value}`} tone="primary" />
                        <ResultCard label="1. stupeň – výsledek PHmax" value={incl1Phmax} tone="success" />
                        <ResultCard label="1. stupeň – počet tříd × PHmax" value={`${incl1Classes} × ${incl1Band.value}`} tone="success" />
                      </>
                    )}

                    {hasSection("sec16_second") && (
                      <>
                        <NumberField label="2. stupeň – třídy" value={sec16SecondClasses} onChange={setSec16SecondClasses} />
                        <NumberField label="2. stupeň – žáci" value={sec16SecondPupils} onChange={setSec16SecondPupils} />
                        <ResultCard label="2. stupeň – průměrný počet žáků" value={round2(incl2Avg)} tone="primary" />
                        <ResultCard label="2. stupeň – pásmo a PHmax na 1 třídu" value={`${sec16SecondBand.label} / ${sec16SecondBand.value}`} tone="primary" />
                        <ResultCard label="2. stupeň – výsledek PHmax" value={incl2Phmax} tone="success" />
                        <ResultCard label="2. stupeň – počet tříd × PHmax" value={`${incl2Classes} × ${incl2Band.value}`} tone="success" />
                      </>
                    )}
                  </div>
                  <div className="grid three section-results-strip">
                    {hasSection("sec16_first") ? <ResultCard label="PHmax § 16/9 – 1. stupeň" value={incl1Phmax} tone="success" /> : null}
                    {hasSection("sec16_second") ? <ResultCard label="PHmax § 16/9 – 2. stupeň" value={incl2Phmax} tone="success" /> : null}
                    <ResultCard label="PHmax § 16/9 – celkem" value={inclPhmax} tone="success" />
                  </div>
                </section>
              )}

              {(hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) && (
              <section className="card section-card section-card--module section-card--module-special">
                <h2>ZŠ speciální</h2>
                <div className="grid two">
                  <NumberField label="I. díl 1. stupeň – třídy" value={special1Classes} onChange={setSpecial1Classes} />
                  <NumberField label="I. díl 1. stupeň – žáci" value={special1Pupils} onChange={setSpecial1Pupils} />
                  <ResultCard label="I. díl 1. stupeň – průměrný počet žáků" value={round2(special1Avg)} tone="primary" />
                  <ResultCard label="I. díl 1. stupeň – pásmo a PHmax na 1 třídu" value={`${special1Band.label} / ${special1Band.value}`} tone="primary" />
                  <NumberField label="I. díl 2. stupeň – třídy" value={special2Classes} onChange={setSpecial2Classes} />
                  <NumberField label="I. díl 2. stupeň – žáci" value={special2Pupils} onChange={setSpecial2Pupils} />
                  <ResultCard label="I. díl 2. stupeň – průměrný počet žáků" value={round2(special2Avg)} tone="primary" />
                  <ResultCard label="I. díl 2. stupeň – pásmo a PHmax na 1 třídu" value={`${special2Band.label} / ${special2Band.value}`} tone="primary" />
                  <NumberField label="II. díl – třídy" value={specialIIClasses} onChange={setSpecialIIClasses} />
                  <NumberField label="II. díl – žáci" value={specialIIPupils} onChange={setSpecialIIPupils} />
                  <ResultCard label="II. díl – průměrný počet žáků" value={round2(specialIIAvg)} tone="primary" />
                  <ResultCard label="II. díl – pásmo a PHmax na 1 třídu" value={`${specialIIBand.label} / ${specialIIBand.value}`} tone="primary" />
                </div>
                <div className="grid four section-results-strip">
                  <ResultCard label="PHmax ZŠ speciální – I. díl 1. stupeň" value={special1PhmaxPart} tone="success" />
                  <ResultCard label="PHmax ZŠ speciální – I. díl 2. stupeň" value={special2PhmaxPart} tone="success" />
                  <ResultCard label="PHmax ZŠ speciální – II. díl" value={specialIIPhmaxPart} tone="success" />
                  <ResultCard label="PHmax ZŠ speciální – celkem" value={specialPhmax} tone="success" />
                </div>
              </section>
              )}
            </div>

            <div className="grid two">
              {hasSection("psych_groups") && (
                <section className="card section-card section-card--module section-card--module-psych">
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
                        <ResultCard label="Průměrný počet žáků ve třídě" value={round2(minority1Avg)} tone="primary" />
                        <ResultCard label="Pásmo a PHmax na 1 třídu" value={`${minority1Band.label} / ${minority1Band.value}`} tone="primary" />
                        <ResultCard label="Výsledek PHmax – 1. stupeň" value={minority1Phmax} tone="success" />
                        <ResultCard label="Počet tříd × PHmax" value={`${minority1Classes} × ${minority1Band.value}`} tone="success" />
                      </div>
                    </div>
                    {minorityType === "minorityFull1" && hasSection("minority_second") && (
                      <div className="subcard">
                        <h3>2. stupeň</h3>
                        <div className="grid two">
                          <NumberField label="Počet tříd" value={minority2Classes} onChange={setMinority2Classes} />
                          <NumberField label="Počet žáků" value={minority2Pupils} onChange={setMinority2Pupils} />
                          <ResultCard label="Průměrný počet žáků ve třídě" value={round2(minority2Avg)} tone="primary" />
                          <ResultCard label="Pásmo a PHmax na 1 třídu" value={`${minority2Band.label} / ${minority2Band.value}`} tone="primary" />
                          <ResultCard label="Výsledek PHmax – 2. stupeň" value={minority2Phmax} tone="success" />
                          <ResultCard label="Počet tříd × PHmax" value={`${minority2Classes} × ${minority2Band.value}`} tone="success" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid three section-results-strip">
                    <ResultCard label="PHmax – jazyk menšiny 1. stupeň" value={minority1Phmax} tone="success" />
                    {minorityType === "minorityFull1" && hasSection("minority_second") ? <ResultCard label="PHmax – jazyk menšiny 2. stupeň" value={minority2Phmax} tone="success" /> : <ResultCard label="PHmax – jazyk menšiny 2. stupeň" value="—" tone="primary" />}
                    <ResultCard label="PHmax – jazyk menšiny celkem" value={minorityPhmax} tone="success" />
                  </div>
                </section>
              )}
            </div>

            <div className="grid two">
              {hasSection("gym_groups") && (
                <section className="card section-card section-card--module section-card--module-gym">
                  <h2>Nižší ročníky víceletých gymnázií</h2>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Typ</th><th>Třídy</th><th>Žáci</th><th>Průměr</th><th>Pásmo</th><th>PHmax / třída</th><th>Mezisoučet</th><th></th>
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
                <section className="card section-card section-card--module section-card--module-mixed">
                  <h2>Smíšené třídy § 16 odst. 9 a ZŠ speciální <HelpHint text="Podle metodiky se tyto třídy posuzují samostatně podle převažujícího oboru vzdělání. Pokud ve třídě převažuje obor 79-01-C/01, použijí se řádky B9 až B10. Pokud převažuje 79-01-B/01 nebo je počet žáků shodný, použijí se řádky B26 až B28." /></h2>
                  <p className="muted-text">Modelový postup odpovídá schématu metodiky: A. vstupní údaje, B. průměrný počet žáků, C. přiřazení pásma, D. dílčí a celkový výsledek.</p>

                  <div className="grid two">
                    <div className="subcard subcard--input">
                      <h3>1. stupeň</h3>
                      <div className="grid two">
                        <NumberField label="Počet žáků ve třídách s převažujícím oborem 79-01-C/01" value={mixedMethodFirstZsPupils} onChange={setMixedMethodFirstZsPupils} />
                        <NumberField label="Počet tříd s převažujícím oborem 79-01-C/01" value={mixedMethodFirstZsClasses} onChange={setMixedMethodFirstZsClasses} />
                        <NumberField label="Počet žáků ve třídách s převažujícím oborem 79-01-B/01" value={mixedMethodFirstSpecialPupils} onChange={setMixedMethodFirstSpecialPupils} />
                        <NumberField label="Počet tříd s převažujícím oborem 79-01-B/01" value={mixedMethodFirstSpecialClasses} onChange={setMixedMethodFirstSpecialClasses} />
                      </div>

                      <div className="grid two section-results-strip">
                        <ResultCard label="Průměr žáků/třídu · obor 79-01-C/01" value={round2(mixedMethodFirstZsAvg)} tone="primary" />
                        <ResultCard label="Pásmo a PHmax na 1 třídu · 1. st. (B9)" value={`${mixedMethodFirstZsBand.label} / ${mixedMethodFirstZsBand.value}`} tone="primary" />
                        <ResultCard label="Průměr žáků/třídu · obor 79-01-B/01" value={round2(mixedMethodFirstSpecialAvg)} tone="primary" />
                        <ResultCard label="Pásmo a PHmax na 1 třídu · 1. st. ZŠ spec. (B26)" value={`${mixedMethodFirstSpecialBand.label} / ${mixedMethodFirstSpecialBand.value}`} tone="primary" />
                      </div>

                      <div className="grid three section-results-strip">
                        <ResultCard label="Výsledek – 1. stupeň, 79-01-C/01" value={mixedMethodFirstZsResult} tone="success" />
                        <ResultCard label="Výsledek – 1. stupeň, 79-01-B/01" value={mixedMethodFirstSpecialResult} tone="success" />
                        <ResultCard label="PHmax – 1. stupeň celkem" value={mixedMethodFirstTotal} tone="success" />
                      </div>
                    </div>

                    <div className="subcard subcard--input">
                      <h3>2. stupeň</h3>
                      <div className="grid two">
                        <NumberField label="Počet žáků ve třídách s převažujícím oborem 79-01-C/01" value={mixedMethodSecondZsPupils} onChange={setMixedMethodSecondZsPupils} />
                        <NumberField label="Počet tříd s převažujícím oborem 79-01-C/01" value={mixedMethodSecondZsClasses} onChange={setMixedMethodSecondZsClasses} />
                        <NumberField label="Počet žáků ve třídách s převažujícím oborem 79-01-B/01" value={mixedMethodSecondSpecialPupils} onChange={setMixedMethodSecondSpecialPupils} />
                        <NumberField label="Počet tříd s převažujícím oborem 79-01-B/01" value={mixedMethodSecondSpecialClasses} onChange={setMixedMethodSecondSpecialClasses} />
                      </div>

                      <div className="grid two section-results-strip">
                        <ResultCard label="Průměr žáků/třídu · obor 79-01-C/01" value={round2(mixedMethodSecondZsAvg)} tone="primary" />
                        <ResultCard label="Pásmo a PHmax na 1 třídu · 2. st. (B10)" value={`${mixedMethodSecondZsBand.label} / ${mixedMethodSecondZsBand.value}`} tone="primary" />
                        <ResultCard label="Průměr žáků/třídu · obor 79-01-B/01" value={round2(mixedMethodSecondSpecialAvg)} tone="primary" />
                        <ResultCard label="Pásmo a PHmax na 1 třídu · 2. st. ZŠ spec. (B27)" value={`${mixedMethodSecondSpecialBand.label} / ${mixedMethodSecondSpecialBand.value}`} tone="primary" />
                      </div>

                      <div className="grid three section-results-strip">
                        <ResultCard label="Výsledek – 2. stupeň, 79-01-C/01" value={mixedMethodSecondZsResult} tone="success" />
                        <ResultCard label="Výsledek – 2. stupeň, 79-01-B/01" value={mixedMethodSecondSpecialResult} tone="success" />
                        <ResultCard label="PHmax – 2. stupeň celkem" value={mixedMethodSecondTotal} tone="success" />
                      </div>
                    </div>
                  </div>

                  <div className="grid two section-results-strip">
                    <ResultCard label="PHmax – smíšené třídy 1. stupeň" value={mixedMethodFirstTotal} tone="success" />
                    <ResultCard label="PHmax – smíšené třídy 2. stupeň" value={mixedMethodSecondTotal} tone="success" />
                  </div>

                  <div className="grid one section-results-strip">
                    <ResultCard label="PHmax – smíšené třídy celkem" value={mixedMethodTotal} tone="success" />
                  </div>
                </section>
              )}
            </div>

            {(hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) && (
              <section className="card section-card section-card--module section-card--module-extras">
                <h2>Samostatné položky PHmax</h2>
                <div className="grid four">
                  {hasSection("prep_class") && (
                    <>
                      <NumberField label="Přípravné třídy – počet tříd" value={prepClasses} onChange={setPrepClasses} />
                      <NumberField label="Přípravné třídy – počet dětí" value={prepChildren} onChange={setPrepChildren} />
                      <ResultCard label="Přípravná třída – pásmo a PHmax na 1 třídu" value={`${prepAvg < 10 ? "méně než 10 dětí" : "10 a více dětí"} / ${prepPh}`} tone="primary" />
                      <ResultCard label="Výsledek – přípravná třída" value={round2(prepClasses * prepPh)} tone="success" />
                    </>
                  )}

                  {hasSection("prep_special") && (
                    <>
                      <NumberField label="Přípravný stupeň ZŠS – počet tříd" value={prepSpecialClasses} onChange={setPrepSpecialClasses} />
                      <NumberField label="Přípravný stupeň ZŠS – počet dětí" value={prepSpecialChildren} onChange={setPrepSpecialChildren} />
                      <ResultCard label="Přípravný stupeň – pásmo a PHmax na 1 třídu" value={`${prepSpecialAvg < 4 ? "méně než 4 žáci" : "4 a více žáků"} / ${prepSpecialPh}`} tone="primary" />
                      <ResultCard label="Výsledek – přípravný stupeň ZŠS" value={round2(prepSpecialClasses * prepSpecialPh)} tone="success" />
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
                <div className="grid four section-results-strip">
                  {hasSection("prep_class") ? <ResultCard label="PHmax – přípravná třída" value={prepClassPhmax} tone="success" /> : null}
                  {hasSection("prep_special") ? <ResultCard label="PHmax – přípravný stupeň ZŠS" value={prepSpecialPhmax} tone="success" /> : null}
                  {hasSection("par38") ? <ResultCard label="PHmax – § 38" value={par38Phmax} tone="success" /> : null}
                  {hasSection("par41") ? <ResultCard label="PHmax – § 41" value={par41Phmax} tone="success" /> : null}
                </div>
              </section>
            )}

            <div className="toolbar">
              <button className="btn ghost" onClick={resetPhmax}>Vymazat údaje PHmax</button>
            </div>

            <section className="card muted card--summary section-card section-card--summary-phmax">
              <h2 className="section-title">Souhrn výsledků PHmax</h2>
              <div className="grid four">
                <ResultCard label="Běžné třídy" value={basicPhmax} />
                <ResultCard label="§ 16 odst. 9" value={inclPhmax} />
                <ResultCard label="Škola při psychiatrické nemocnici" value={psychPhmax} />
                <ResultCard label="Jazyk menšiny" value={minorityPhmax} />
                <ResultCard label="Víceletá gymnázia" value={gymPhmax} />
                <ResultCard label="Smíšené třídy" value={mixedPhmax} />
                <ResultCard label="ZŠ speciální" value={specialPhmax} />
                <ResultCard label="Samostatné položky" value={extrasPhmax} />
                <ResultCard label="Výsledek PHmax" tone="success" value={totalPhmax} />
              </div>
            </section>
          </div>
        )}

        {tab === "pha" && (
          <section className={`card section-card section-card--pha${hasIssue("pha") ? " card--needs-attention" : ""}`} data-section="pha">
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
          <section className={`card section-card section-card--php${hasIssue("php") ? " card--needs-attention" : ""}`} data-section="php">
            <h2>PHPmax – metodický výpočet <HelpHint text="PHPmax se stanoví podle průměrného počtu žáků za předcházející tři roky. Do tohoto počtu se nezapočítávají žáci vzdělávaní v zahraničí, v zahraniční škole v ČR a v individuálním vzdělávání." /></h2>
            <p className="muted-text">
              Postup výpočtu (kroky A–D): rozhodné počty, očištění dat, výpočet a interpretace. Najeďte na ikonu „i“ u nadpisů pro stručnou metodickou nápovědu.
            </p>

            <div className="tabs tabs--compact">
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

        <section className="card muted card--summary section-card section-card--overview">
          <h2 className="section-title">Celkový přehled</h2>
          <p className="muted-text">Výsledky PHmax, PHAmax a PHPmax se stanovují samostatně. Součet níže slouží jen pro orientaci.</p>
          <p className="muted-text">PHmax, PHAmax – asistenti pedagoga a PHPmax – metodický výpočet se stanovují odděleně. Součet níže je přehledový.</p>
          <div className="grid four">
            <ResultCard label="PHmax" value={totalPhmax} />
            <ResultCard label="PHAmax – asistenti pedagoga" value={totalPha} />
            <ResultCard label="PHPmax – metodický výpočet" value={totalPhp} />
            <ResultCard label="Přehledový součet" tone="success" value={round2(totalPhmax + totalPha + totalPhp)} />
          </div>
        </section>
        {glossaryOpen && (
          <div className="glossary-modal" role="dialog" aria-modal="true">
            <div className="glossary-modal__backdrop" onClick={() => setGlossaryOpen(false)} />
            <div className="glossary-modal__panel">
              <div className="glossary-modal__head">
                <div>
                  <h2 className="section-title">Slovníček pojmů</h2>
                  <p className="muted-text">Pojmy jsou popsány podle metodiky a navazujících právních předpisů, ze kterých kalkulačka vychází.</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setGlossaryOpen(false)}>✕</button>
              </div>
              <div className="glossary-list">
                {GLOSSARY_TERMS.map((item) => (
                  <div key={item.term} className="glossary-item">
                    <div className="glossary-item__term">{item.term}</div>
                    <div className="glossary-item__desc">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
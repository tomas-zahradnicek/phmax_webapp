import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  B11_B13,
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
  B29_PREP_CLASS,
  B30_PREP_SPECIAL,
  PHA_TABLE,
  PHA_TABLE_ROW_IDS,
  PHP_TABLE,
  GYM_KIND_TO_ROW,
  pickBand,
  round2,
  BasicType,
  HealthRow,
  MixedRow,
  PhaRow,
  PsychRow,
  GymRow,
} from "./phmax-zs-logic";
import type { ZsHeroExampleKey } from "./zs-hero-example-groups";
import type { CalculatorMode, FormSection } from "./config/calculator-config";
import { MODE_CONFIG } from "./config/calculator-config";
import { getVisibleSections } from "./config/field-visibility";
import { DEFAULT_MODE } from "./config/default-form-state";
import { GlossaryDialog } from "./GlossaryDialog";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductLegisContextPanel } from "./PhmaxProductLegisUi";
import { useQuickOnboarding } from "./useQuickOnboarding";
import { useUiNotice } from "./useUiNotice";
import { useFocusExampleOnMount } from "./useFocusExampleOnMount";
import { useFocusInputsOnMount } from "./useFocusInputsOnMount";
import type { ModuleInputsFocusHint } from "./phmax-focus-inputs-hint";
import type { ProductView } from "./ProductViewPills";
import {
  type PhmaxZsMethodologyHighlights,
} from "./phmax-zs-methodology-tables";
import { buildZsConnectedBlocks } from "./phmax-zs-connected-blocks";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { HeroStatusBar } from "./HeroStatusBar";
import { useCalculatorFocusMode } from "./useCalculatorFocusMode";
import type { PageTocSection } from "./PageTableOfContents";
import { CalculatorInputIssueBanner } from "./CalculatorInputIssueBanner";
import { calculatorInputIssueBannerFromVerdict } from "./calculator-verdict-ui";
import {
  buildZsValidationIssues,
  buildZsVerdict,
  buildZsWorkflow,
} from "./zs/zs-form-validation";
import {
  applyZsFormSnapshot,
  buildZsFormSnapshot,
  ZS_AUTOSAVE_STORAGE_KEY,
  type ZsFormSnapshotSetters,
} from "./zs/zs-form-snapshot";
import { useZsFormAutosave } from "./zs/use-zs-form-autosave";
import { createZsRowHandlers } from "./zs/zs-row-handlers";
import { buildZsPageComparePreview, createZsPageHandlers } from "./zs/zs-page-handlers";
import { ZsExpertWizardGuideSection } from "./zs/ZsExpertWizardGuideSection";
import { buildZsPhmaxTabPanelProps } from "./zs/build-zs-phmax-tab-panel-props";
import { ZsPhmaxTabPanel } from "./zs/ZsPhmaxTabPanel";
import { ZsSetupSection } from "./zs/ZsSetupSection";
import { ZsHeroHeader } from "./zs/ZsHeroHeader";
import { ZsQuickOnboardingGuide } from "./zs/ZsQuickOnboardingGuide";
import { ZsWizardShell } from "./zs/ZsWizardShell";
import { ZsPhaPhpTabPanels } from "./zs/ZsPhaPhpTabPanels";
import { ZsExpertOnboardingCard } from "./zs/ZsExpertOnboardingCard";
import { useZsSectionScroll } from "./zs/use-zs-section-scroll";
import { useZsWizardNavigation } from "./zs/use-zs-wizard-navigation";
import { buildZsSummaryRows } from "./zs/zs-summary-rows";
import {
  applyZsResetAll,
  applyZsResetNv75,
  applyZsResetPhmax,
  applyZsResetPha,
  applyZsResetPhp,
} from "./zs/zs-form-reset";
import {
  getZsInitialPreferredMode,
  loadZsHeroExample,
  ZS_WIZARD_CHOICE_TO_EXAMPLE,
} from "./zs/zs-hero-example-load";
import { buildZsShareText } from "./zs/zs-share-text";
import { buildZsWarnings } from "./zs/zs-warnings";
import { buildZsExportBuildInput } from "./zs/zs-export-build";
import { ZsCalculatorShell } from "./zs/ZsCalculatorShell";
import { useDisplayDensity } from "./useDisplayDensity";
import { calculatorShellClassName } from "./calculator-view-mode";
import type { PhmaxZsPhmaxPane } from "./PhmaxZsPhmaxSubNav";
import {
  readZsBasicWizardStep,
  ZS_BASIC_WIZARD_LS_KEY,
  type ZsBasicWizardStep,
} from "./zs-basic-wizard";
import {
  BROWSER_ERROR_NEXT_STEP_HINT,
  MSG_NO_LOCAL_AUTOSAVE_DATA,
  CALCULATOR_WORKSPACE_DOCK_LABEL,
  PHMAX_ZS_ONBOARDING_LS_KEY,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import {
  confirmDestructive,
  MSG_CONFIRM_CLEAR_BROWSER_STORAGE,
  MSG_CONFIRM_ZS_RESET_ALL,
  MSG_CONFIRM_ZS_RESET_PHA,
  MSG_CONFIRM_ZS_RESET_PHMAX,
  MSG_CONFIRM_ZS_RESET_PHP,
} from "./confirm-destructive";
import {
  APP_AUTHOR_PRINT_SUMMARY_DOC_STYLES,
  getAppAuthorPrintFooterHtml,
  stripAppAuthorCreditFromPlainSummary,
} from "./app-author-print";
import { useZsNamedSnapshots } from "./useZsNamedSnapshots";
const ZS_VIEW_MODE_LS_KEY = "phmax-zs-view-mode";

type TabKey = "phmax" | "pha" | "php";

type PhpWizardStep = "a" | "b" | "c" | "d";
type PhpMethodMode = "three_year_avg" | "short_period";
type Nv75Role = "ucitel" | "reditel";
type Nv75School = "plavecka_skola";
type ExampleKey = ZsHeroExampleKey;
import type { ZsWizardChoice } from "./zs/zs-form-snapshot";

type WizardChoice = ZsWizardChoice;
type DataMode = "own" | "example";

/** Viditelná legenda + doplněk k nativním tooltipům (`title`) u řádků v seznamech. */
const ZS_GUIDE_NATIVE_TOOLTIP_LEGEND =
  "U řádků s předpisy najděte myší na položku v seznamu – prohlížeč zobrazí krátký text (atribut title). U tečkovaných citací § v textu stránky použijte stejný postup jako v záložce „Legislativa a výklad (ZŠ)“ (hover nebo Tab).";

function clampNonNegative(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function sumNumbers(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return <p className="section-lead muted-text">{children}</p>;
}

function createEmptyPsychRow(id: number): PsychRow {
  return { id, kind: "psych1", mode: "higher_of_two", currentPupils: 0, currentClasses: 0, prevPupils: 0, prevClasses: 0 };
}

function createEmptyHealthRow(id: number): HealthRow {
  return { id, kind: "health1", mode: "higher_of_two", currentPupils: 0, currentClasses: 0, prevPupils: 0, prevClasses: 0 };
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
    description: (
      <>
        Žák podle § 38 se nezapočítává do počtu žáků ve třídě rozhodné pro PHmax těchto tříd; celkové PHmax školy se za každého žáka{" "}
        <strong>1. stupně navýší o 0,25 h</strong> a <strong>2. stupně o 0,5 h</strong> týdně (zadání v sekci Samostatné položky PHmax). Aplikace
        počítá jen toto číselné navýšení – neřeší nerovnoměrné rozvržení přímé pedagogické činnosti v průběhu roku; k úvazku a PČ viz{" "}
        <a
          href="https://www.msmt.cz/dokumenty/pravni-vyklad-k-23-zakona-opedagogickych-pracovnicich"
          target="_blank"
          rel="noopener noreferrer"
          className="status-link"
        >
          výklad MŠMT k § 23 zákona o pedagogických pracovnících
        </a>
        .
      </>
    ),
  },
  {
    term: "Žák vzdělávaný podle § 41 školského zákona",
    description: (
      <>
        Stejně jako u § 38 se žák nezapočítává do průměru rozhodné třídy; celkové PHmax školy se za každého žáka{" "}
        <strong>1. stupně navýší o 0,25 h</strong> a <strong>2. stupně o 0,5 h</strong> týdně. Platí stejná poznámka k rozvržení PČ a odkaz na{" "}
        <a
          href="https://www.msmt.cz/dokumenty/pravni-vyklad-k-23-zakona-opedagogickych-pracovnicich"
          target="_blank"
          rel="noopener noreferrer"
          className="status-link"
        >
          výklad MŠMT k § 23 zákona o pedagogických pracovnících
        </a>
        .
      </>
    ),
  },
];

export type PhmaxZsPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export function PhmaxZsPage({ productView, setProductView }: PhmaxZsPageProps) {
  const [tab, setTab] = useState<TabKey>("phmax");
  const [mode, setMode] = useState<CalculatorMode>(getZsInitialPreferredMode());
  const [displayDensity, setDisplayDensity] = useDisplayDensity();
  const [focusMode, setFocusMode] = useCalculatorFocusMode();
  const heroHeaderRef = useRef<HTMLElement>(null);
  const [viewMode, setViewMode] = useState<"basic" | "expert">(() => {
    try {
      const stored = localStorage.getItem(ZS_VIEW_MODE_LS_KEY);
      return stored === "expert" ? "expert" : "basic";
    } catch {
      return "basic";
    }
  });

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

  useEffect(() => {
    try {
      localStorage.setItem(ZS_VIEW_MODE_LS_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const [zsWizardStep, setZsWizardStep] = useState<ZsBasicWizardStep>(readZsBasicWizardStep);
  const [phmaxSubTab, setPhmaxSubTab] = useState<PhmaxZsPhmaxPane>("classes");

  useEffect(() => {
    try {
      localStorage.setItem(ZS_BASIC_WIZARD_LS_KEY, String(zsWizardStep));
    } catch {
      /* ignore */
    }
  }, [zsWizardStep]);

  const visibleSections = useMemo(() => getVisibleSections(mode), [mode]);
  const hasSection = useCallback(
    (section: FormSection) => visibleSections.includes(section),
    [visibleSections],
  );

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
  const [healthRows, setHealthRows] = useState<HealthRow[]>([]);

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
  const glossaryTriggerRef = useRef<HTMLButtonElement>(null);
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const [uiNotice, setUiNotice] = useUiNotice();
  useFocusExampleOnMount("zs-hero-example-select");
  const [exportLabel, setExportLabel] = useState("");
  const { guideOpen: zsGuideOpen, dismissGuide: dismissZsGuide, toggleGuide: toggleZsGuideFromHero, helpButtonRef: zsHelpButtonRef } =
    useQuickOnboarding(PHMAX_ZS_ONBOARDING_LS_KEY, { scrollAnchorId: "zs-quick-guide" });

  const zsSnapshotSetters = useMemo<ZsFormSnapshotSetters>(
    () => ({
      setTab,
      setMode,
      setBasicType,
      setBasic1Classes,
      setBasic1Pupils,
      setBasic2Classes,
      setBasic2Pupils,
      setIncl1Classes,
      setIncl1Pupils,
      setIncl2Classes,
      setIncl2Pupils,
      setPsychRows,
      setHealthRows,
      setExportLabel,
      setMinorityType,
      setMinority1Classes,
      setMinority1Pupils,
      setMinority2Classes,
      setMinority2Pupils,
      setGymRows,
      setMixedRows,
      setSpecial1Classes,
      setSpecial1Pupils,
      setSpecial2Classes,
      setSpecial2Pupils,
      setSpecialIIClasses,
      setSpecialIIPupils,
      setPrepClasses,
      setPrepChildren,
      setPrepSpecialClasses,
      setPrepSpecialChildren,
      setP38First,
      setP38Second,
      setP41First,
      setP41Second,
      setPhaRows,
      setPhpYear1,
      setPhpYear2,
      setPhpYear3,
      setPhpWizardStep,
      setPhpMethodMode,
      setPhpExcludedAbroad,
      setPhpExcludedForeignSchoolCz,
      setPhpExcludedIndividual,
      setPhpExcludedSchool,
      setSelectedExample,
      setWizardChoice,
      setZsWizardStep,
      setDataMode,
      setNv75Role,
      setNv75School,
      setNv75TeacherMin,
      setNv75TeacherMax,
      setMixedMethodFirstZsPupils,
      setMixedMethodFirstZsClasses,
      setMixedMethodFirstSpecialPupils,
      setMixedMethodFirstSpecialClasses,
      setMixedMethodSecondZsPupils,
      setMixedMethodSecondZsClasses,
      setMixedMethodSecondSpecialPupils,
      setMixedMethodSecondSpecialClasses,
    }),
    [],
  );

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
    return { label: "–", value: 0, test: () => false };
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

  const healthComputedRows = healthRows.map((row) => {
    const avgCurrent = row.currentClasses > 0 ? row.currentPupils / row.currentClasses : 0;
    const avgPrev = row.prevClasses > 0 ? row.prevPupils / row.prevClasses : 0;
    const usedAvg = row.mode === "current_only" ? avgCurrent : Math.max(avgCurrent, avgPrev);
    const band = pickBand(usedAvg, B11_B13[row.kind]);
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
  const healthPhmax = round2(healthComputedRows.reduce((s, r) => s + r.subtotal, 0));
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

  const hasMixedMethodTableData =
    mixedMethodFirstZsPupils > 0 ||
    mixedMethodFirstZsClasses > 0 ||
    mixedMethodFirstSpecialPupils > 0 ||
    mixedMethodFirstSpecialClasses > 0 ||
    mixedMethodSecondZsPupils > 0 ||
    mixedMethodSecondZsClasses > 0 ||
    mixedMethodSecondSpecialPupils > 0 ||
    mixedMethodSecondSpecialClasses > 0;

  const mixedForTotal = round2(hasMixedMethodTableData ? mixedMethodTotal : mixedPhmax);

  const extrasPhmax = round2(prepClassPhmax + prepSpecialPhmax + par38Phmax + par41Phmax);
  const totalPhmax = round2(
    basicPhmax + inclPhmax + psychPhmax + healthPhmax + minorityPhmax + gymPhmax + specialPhmax + mixedForTotal + extrasPhmax
  );

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

  const zsMethodologyHighlights: PhmaxZsMethodologyHighlights = useMemo(() => {
    const activeColumnByRowId: Partial<Record<string, string>> = {};
    const hasMixedLegacyInput = mixedRows.some((r) => r.classes > 0 || r.pupils > 0);
    const hasPhaUi = visibleSections.some((s) => s.startsWith("pha_rvp") || s === "pha_disability_flags");
    const hasPhaSec16Row = phaComputedRows.some(
      (r) =>
        r.classes > 0 &&
        (r.kind === "zs1" || r.kind === "zs1Heavy" || r.kind === "zs2" || r.kind === "zs2Heavy"),
    );
    const hasPhaZssRow = phaComputedRows.some(
      (r) =>
        r.classes > 0 &&
        (r.kind === "zss1" ||
          r.kind === "zss1Heavy" ||
          r.kind === "zss2" ||
          r.kind === "zss2Heavy" ||
          r.kind === "zssII" ||
          r.kind === "zssIIHeavy" ||
          r.kind === "zssPrep"),
    );
    const { connectedBlocks, mixedReferenceNote } = buildZsConnectedBlocks({
      hasSection,
      basicType,
      basic1Classes,
      basic2Classes,
      incl1Classes,
      incl2Classes,
      hasHealthRows: healthRows.some((r) => r.currentClasses > 0 || r.prevClasses > 0),
      hasPsychRows: psychRows.some((r) => r.currentClasses > 0 || r.prevClasses > 0),
      minorityType,
      minority1Classes,
      hasGymRows: gymRows.some((r) => r.classes > 0),
      special1Classes,
      special2Classes,
      specialIIClasses,
      hasMixedLegacyInput,
      hasMixedMethodTableData,
      mixedForTotal,
      prepClasses,
      prepSpecialClasses,
      p38First,
      p38Second,
      p41First,
      p41Second,
      hasPhaUi,
      hasPhaSec16Row,
      hasPhaZssRow,
      hasPhpUi: hasSection("php_years") || hasSection("php_options"),
      phpExcludedSchool,
    });

    const visibleGymRowIds = gymComputedRows
      .filter((r) => r.classes > 0)
      .map((r) => GYM_KIND_TO_ROW[r.kind]);

    if (basicType === "full_more_than_2") {
      if (basic1Classes > 0) activeColumnByRowId.B1 = basicFirstBand.label;
      if (basic2Classes > 0) activeColumnByRowId.B2 = basicSecondBand.label;
    } else if (basicType === "full_max_2") {
      if (basic1Classes > 0) activeColumnByRowId.B3 = basicFirstBand.label;
      if (basic2Classes > 0) activeColumnByRowId.B4 = basicSecondBand.label;
    } else if (basicType === "first_only_1" && basic1Classes > 0) {
      activeColumnByRowId.B5 = basicFirstBand.label;
    } else if (basicType === "first_only_2" && basic1Classes > 0) {
      activeColumnByRowId.B6 = basicFirstBand.label;
    } else if (basicType === "first_only_3" && basic1Classes > 0) {
      activeColumnByRowId.B7 = basicFirstBand.label;
    } else if (basicType === "first_only_4" && basic1Classes > 0) {
      activeColumnByRowId.B8 = basicFirstBand.label;
    }

    if (incl1Classes > 0) activeColumnByRowId.B9 = incl1Band.label;
    if (incl2Classes > 0) activeColumnByRowId.B10 = incl2Band.label;

    for (const r of psychComputedRows) {
      if (r.currentClasses > 0 || r.prevClasses > 0) {
        const bid = r.kind === "psych1" ? "B14" : r.kind === "psych2" ? "B15" : "B16";
        activeColumnByRowId[bid] = r.bandLabel;
      }
    }
    for (const r of healthComputedRows) {
      if (r.currentClasses > 0 || r.prevClasses > 0) {
        const bid = r.kind === "health1" ? "B11" : r.kind === "health2" ? "B12" : "B13";
        activeColumnByRowId[bid] = r.bandLabel;
      }
    }

    if (minority1Classes > 0) {
      const rowMap: Partial<Record<keyof typeof B17_B21, "B17" | "B18" | "B19" | "B20">> = {
        minority1: "B17",
        minority2: "B18",
        minority3: "B19",
        minorityFull1: "B20",
      };
      const bid = rowMap[minorityType];
      if (bid) activeColumnByRowId[bid] = minority1Band.label;
    }
    if (minorityType === "minorityFull1" && minority2Classes > 0) {
      activeColumnByRowId.B21 = minority2Band.label;
    }

    for (const r of gymComputedRows) {
      if (r.classes > 0) {
        activeColumnByRowId[GYM_KIND_TO_ROW[r.kind]] = r.bandLabel;
      }
    }

    if (special1Classes > 0) activeColumnByRowId.B26 = special1Band.label;
    if (special2Classes > 0) activeColumnByRowId.B27 = special2Band.label;
    if (specialIIClasses > 0) activeColumnByRowId.B28 = specialIIBand.label;

    for (const r of phaComputedRows) {
      if (r.classes > 0) {
        activeColumnByRowId[PHA_TABLE_ROW_IDS[r.kind]] = r.bandLabel;
      }
    }

    if (!phpExcludedSchool) {
      activeColumnByRowId.B46 = phpBand.label;
    }

    const zsspCombo =
      special1Classes > 0 || special2Classes > 0 || specialIIClasses > 0
        ? { i1: special1Classes > 0, i2: special2Classes > 0, ii: specialIIClasses > 0 }
        : null;

    return {
      connectedBlocks,
      visibleGymRowIds,
      mixedReferenceNote,
      activeColumnByRowId,
      zsspCombo,
      prepClassLabel: prepClasses > 0 ? pickBand(prepAvg, B29_PREP_CLASS).label : undefined,
      prepSpecialLabel: prepSpecialClasses > 0 ? pickBand(prepSpecialAvg, B30_PREP_SPECIAL).label : undefined,
      par38: { first: p38First > 0, second: p38Second > 0 },
      par41: { first: p41First > 0, second: p41Second > 0 },
      phpBandLabel: phpExcludedSchool ? null : phpBand.label,
    };
  }, [
    visibleSections,
    basicType,
    basic1Classes,
    basic2Classes,
    basicFirstBand.label,
    basicSecondBand.label,
    incl1Classes,
    incl2Classes,
    incl1Band.label,
    incl2Band.label,
    psychComputedRows,
    psychRows,
    healthComputedRows,
    healthRows,
    minority1Classes,
    minority2Classes,
    minorityType,
    minority1Band.label,
    minority2Band.label,
    gymComputedRows,
    gymRows,
    mixedRows,
    mixedForTotal,
    hasMixedMethodTableData,
    special1Classes,
    special2Classes,
    specialIIClasses,
    special1Band.label,
    special2Band.label,
    specialIIBand.label,
    phaComputedRows,
    phpExcludedSchool,
    phpBand.label,
    prepClasses,
    prepAvg,
    prepSpecialClasses,
    prepSpecialAvg,
    p38First,
    p38Second,
    p41First,
    p41Second,
    hasSection,
  ]);

  const warnings = useMemo(
    () =>
      buildZsWarnings({
        basicType,
        basic1Classes,
        basic2Classes,
        phpExcludedTotal,
        phpBaseValue,
        phpExcludedSchool,
        phpAdjustedValue,
        minorityType,
        minority2Classes,
      }),
    [
      basicType,
      basic1Classes,
      basic2Classes,
      phpExcludedTotal,
      phpBaseValue,
      phpExcludedSchool,
      phpAdjustedValue,
      minorityType,
      minority2Classes,
    ],
  );

  const { add: addPha, update: updatePha, remove: removePha } = createZsRowHandlers(setPhaRows, createEmptyPhaRow);
  const { add: addPsych, update: updatePsych, remove: removePsych } = createZsRowHandlers(setPsychRows, createEmptyPsychRow);
  const { add: addHealth, update: updateHealth, remove: removeHealth } = createZsRowHandlers(setHealthRows, createEmptyHealthRow);
  const { add: addGym, update: updateGym, remove: removeGym } = createZsRowHandlers(setGymRows, createEmptyGymRow);

  const applyResetPhmax = () => applyZsResetPhmax(zsSnapshotSetters);

  const resetPhmax = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_PHMAX)) return;
    applyResetPhmax();
  };

  const applyResetPha = () => applyZsResetPha(zsSnapshotSetters);

  const resetPha = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_PHA)) return;
    applyResetPha();
  };

  const applyResetPhp = () => applyZsResetPhp(zsSnapshotSetters);

  const resetPhp = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_PHP)) return;
    applyResetPhp();
  };

  const resetNv75 = () => applyZsResetNv75(zsSnapshotSetters);

  const resetAll = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_ALL)) return;
    applyZsResetAll(zsSnapshotSetters);
  };

  const zsHeroExampleCtx = {
    setters: zsSnapshotSetters,
    createEmptyGymRow,
    createEmptyMixedRow,
    createEmptyPhaRow,
    applyResetPhmax,
    applyResetPha,
    applyResetPhp,
    resetNv75,
  };

  const loadExample = (example: ExampleKey) => loadZsHeroExample(example, zsHeroExampleCtx);

  const applyWizardChoice = (choice: WizardChoice) => {
    setWizardChoice(choice);
    if (choice === "") return;
    loadExample(ZS_WIZARD_CHOICE_TO_EXAMPLE[choice]);
  };


  const buildSnapshot = useCallback(
    () =>
      buildZsFormSnapshot({
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
        healthRows,
        exportLabel,
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
        zsWizardStep,
        dataMode,
        nv75Role,
        nv75School,
        nv75TeacherMin,
        nv75TeacherMax,
        mixedMethodFirstZsPupils,
        mixedMethodFirstZsClasses,
        mixedMethodFirstSpecialPupils,
        mixedMethodFirstSpecialClasses,
        mixedMethodSecondZsPupils,
        mixedMethodSecondZsClasses,
        mixedMethodSecondSpecialPupils,
        mixedMethodSecondSpecialClasses,
        auditTotals: { totalPhmax, totalPha, totalPhp, tab },
      }),
    [
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
      healthRows,
      exportLabel,
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
      zsWizardStep,
      dataMode,
      nv75Role,
      nv75School,
      nv75TeacherMin,
      nv75TeacherMax,
      mixedMethodFirstZsPupils,
      mixedMethodFirstZsClasses,
      mixedMethodFirstSpecialPupils,
      mixedMethodFirstSpecialClasses,
      mixedMethodSecondZsPupils,
      mixedMethodSecondZsClasses,
      mixedMethodSecondSpecialPupils,
      mixedMethodSecondSpecialClasses,
      totalPhmax,
      totalPha,
      totalPhp,
    ],
  );

  const applySnapshotPayload = useCallback(
    (s: Record<string, unknown>, notice: string) => {
      applyZsFormSnapshot(s, zsSnapshotSetters, notice, setUiNotice);
    },
    [zsSnapshotSetters, setUiNotice],
  );

  const { lastSavedAt, setLastSavedAt, persistSnapshot } = useZsFormAutosave(buildSnapshot, [
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
    healthRows,
    exportLabel,
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
    zsWizardStep,
    dataMode,
    nv75Role,
    nv75School,
    nv75TeacherMin,
    nv75TeacherMax,
    mixedMethodFirstZsPupils,
    mixedMethodFirstZsClasses,
    mixedMethodFirstSpecialPupils,
    mixedMethodFirstSpecialClasses,
    mixedMethodSecondZsPupils,
    mixedMethodSecondZsClasses,
    mixedMethodSecondSpecialPupils,
    mixedMethodSecondSpecialClasses,
    totalPhmax,
    totalPha,
    totalPhp,
  ]);

  const {
    namedSnapshots,
    selectedNamedId,
    setSelectedNamedId,
    namedSaveName,
    setNamedSaveName,
    saveNamedSnapshot,
    restoreNamedSnapshot,
    deleteNamedSnapshot,
  } = useZsNamedSnapshots({ buildSnapshot, applySnapshotPayload, setUiNotice });

  const restoreSnapshot = () => {
    try {
      const raw = localStorage.getItem(ZS_AUTOSAVE_STORAGE_KEY);
      if (!raw) {
        setUiNotice(MSG_NO_LOCAL_AUTOSAVE_DATA);
        return;
      }
      const s = JSON.parse(raw) as Record<string, unknown>;
      applySnapshotPayload(s, "Uložená data byla obnovena.");
    } catch (error) {
      console.error("Nepodařilo se obnovit uložená data.", error);
      setUiNotice(`Obnovení uložených dat se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  };

  const clearStoredSnapshot = () => {
    if (!confirmDestructive(MSG_CONFIRM_CLEAR_BROWSER_STORAGE)) return;
    localStorage.removeItem(ZS_AUTOSAVE_STORAGE_KEY);
    setLastSavedAt("");
    setUiNotice("Uložená data byla vymazána.");
  };

  const saveSnapshotManually = () => {
    persistSnapshot();
    setUiNotice("Rozpracované údaje byly uloženy.");
  };

  const copySummaryToClipboard = async () => {
    const text = buildZsShareText({
      modeLabel: MODE_CONFIG[mode].label,
      tab: tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax",
      totalPhmax,
      totalPha,
      totalPhp,
      warnings,
      inputMode: dataMode,
      exportLabel,
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Nepodařilo se zkopírovat shrnutí.", error);
    }
  };

  const printSummaryWindow = () => {
    const plain = stripAppAuthorCreditFromPlainSummary(
      buildZsShareText({
        modeLabel: MODE_CONFIG[mode].label,
        tab: tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax",
        totalPhmax,
        totalPha,
        totalPhp,
        warnings,
        inputMode: dataMode,
        exportLabel,
      }),
    );
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>Shrnutí kalkulačky ZŠ</title>` +
        `<style>${APP_AUTHOR_PRINT_SUMMARY_DOC_STYLES}` +
        `h1{font-size:12pt;margin:0 0 8px;font-weight:800}` +
        `.box{border:1px solid #94a3b8;border-radius:6px;padding:10px 12px;background:#fff}` +
        `</style></head><body class="print-summary-doc"><main class="print-summary-doc__main">` +
        `<h1>Shrnutí kalkulačky ZŠ</h1><div class="box">${text}</div></main>${getAppAuthorPrintFooterHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  const validationIssues = useMemo(
    () =>
      buildZsValidationIssues({
        tab,
        basic1Classes,
        basic1Pupils,
        basic2Classes,
        basic2Pupils,
        incl1Classes,
        incl2Classes,
        psychRowCount: psychRows.length,
        healthRowCount: healthRows.length,
        minority1Classes,
        gymRowCount: gymRows.length,
        mixedRowCount: mixedRows.length,
        special1Classes,
        special2Classes,
        specialIIClasses,
        prepClasses,
        prepSpecialClasses,
        phaRowCount: phaRows.length,
        phpYear1,
        phpYear2,
        phpYear3,
        phpMethodMode,
      }),
    [
      tab,
      basic1Classes,
      basic1Pupils,
      basic2Classes,
      basic2Pupils,
      incl1Classes,
      incl2Classes,
      psychRows.length,
      healthRows.length,
      minority1Classes,
      gymRows.length,
      mixedRows.length,
      special1Classes,
      special2Classes,
      specialIIClasses,
      prepClasses,
      prepSpecialClasses,
      phaRows.length,
      phpYear1,
      phpYear2,
      phpYear3,
      phpMethodMode,
    ],
  );

  const incompleteSections = new Set(validationIssues.map((item) => item.section)).size;
  const zsVerdict = useMemo(
    () => buildZsVerdict(incompleteSections, warnings.length),
    [incompleteSections, warnings.length],
  );
  const zsWorkflow = useMemo(
    () => buildZsWorkflow(incompleteSections, warnings.length),
    [incompleteSections, warnings.length],
  );
  const firstIssueSection = validationIssues[0]?.section ?? "";
  const hasIssue = (sectionId: string) => validationIssues.some((item) => item.section === sectionId);

  const { workspaceStickyRef, goToSection } = useZsSectionScroll(tab);

  const zsNeedsInputBanner = zsVerdict.tone !== "ok";
  const zsScrollToInputs = useCallback(
    (hint?: ModuleInputsFocusHint) => {
      const sectionId = hint?.sectionId ?? firstIssueSection;
      if (sectionId) goToSection(sectionId);
    },
    [firstIssueSection, goToSection],
  );
  const zsDockIssueSummaries = useMemo(
    () =>
      warnings.length > 0
        ? warnings.slice(0, 4).map((w) => (w.length > 80 ? `${w.slice(0, 77)}…` : w))
        : [],
    [warnings],
  );
  const validationHighlight = zsNeedsInputBanner;
  const zsInputBannerItems = useMemo(
    () => [
      ...validationIssues.map((item) => ({
        label: item.label,
        onFix: () => goToSection(item.section),
      })),
      ...warnings.map((w) => ({ label: w })),
    ],
    [validationIssues, warnings, goToSection],
  );
  const showZsInputBanner = zsInputBannerItems.length > 0;

  const summaryRows = useMemo(
    () =>
      buildZsSummaryRows({
        basic1Phmax,
        basic2Phmax,
        basicPhmax,
        incl1Phmax,
        incl2Phmax,
        inclPhmax,
        psychPhmax,
        healthPhmax,
        minority1Phmax,
        minority2Phmax,
        minorityPhmax,
        gymPhmax,
        mixedRows,
        mixedMethodFirstTotal,
        mixedMethodSecondTotal,
        mixedMethodTotal,
        mixedPhmax,
        special1PhmaxPart,
        special2PhmaxPart,
        specialIIPhmaxPart,
        specialPhmax,
        prepClassPhmax,
        prepSpecialPhmax,
        par38Phmax,
        par41Phmax,
        extrasPhmax,
        totalPhmax,
        totalPha,
        phpBaseValue,
        phpExcludedTotal,
        phpAdjustedValue,
        totalPhp,
      }),
    [
      basic1Phmax,
      basic2Phmax,
      basicPhmax,
      incl1Phmax,
      incl2Phmax,
      inclPhmax,
      psychPhmax,
      healthPhmax,
      minority1Phmax,
      minority2Phmax,
      minorityPhmax,
      gymPhmax,
      mixedRows,
      mixedMethodFirstTotal,
      mixedMethodSecondTotal,
      mixedMethodTotal,
      mixedPhmax,
      special1PhmaxPart,
      special2PhmaxPart,
      specialIIPhmaxPart,
      specialPhmax,
      prepClassPhmax,
      prepSpecialPhmax,
      par38Phmax,
      par41Phmax,
      extrasPhmax,
      totalPhmax,
      totalPha,
      phpBaseValue,
      phpExcludedTotal,
      phpAdjustedValue,
      totalPhp,
    ],
  );

  const zsExportBuildInput = useMemo(
    () =>
      buildZsExportBuildInput({
      tab,
      mode,
      exportLabel,
      wizardChoice,
      dataMode,
      selectedExample,
      warnings,
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
      healthRows,
      minorityType,
      minority1Classes,
      minority1Pupils,
      minority2Classes,
      minority2Pupils,
      gymRows,
      mixedRows,
      mixedMethodFirstZsPupils,
      mixedMethodFirstZsClasses,
      mixedMethodFirstSpecialPupils,
      mixedMethodFirstSpecialClasses,
      mixedMethodSecondZsPupils,
      mixedMethodSecondZsClasses,
      mixedMethodSecondSpecialPupils,
      mixedMethodSecondSpecialClasses,
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
      phpMethodMode,
      phpYear1,
      phpYear2,
      phpYear3,
      phpExcludedAbroad,
      phpExcludedForeignSchoolCz,
      phpExcludedIndividual,
      phpExcludedSchool,
      phaRows,
      psychComputedRows,
      healthComputedRows,
      gymComputedRows,
      summaryRows,
      }),
    [
      tab,
      mode,
      exportLabel,
      wizardChoice,
      dataMode,
      selectedExample,
      warnings,
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
      healthRows,
      minorityType,
      minority1Classes,
      minority1Pupils,
      minority2Classes,
      minority2Pupils,
      gymRows,
      mixedRows,
      mixedMethodFirstZsPupils,
      mixedMethodFirstZsClasses,
      mixedMethodFirstSpecialPupils,
      mixedMethodFirstSpecialClasses,
      mixedMethodSecondZsPupils,
      mixedMethodSecondZsClasses,
      mixedMethodSecondSpecialPupils,
      mixedMethodSecondSpecialClasses,
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
      phpMethodMode,
      phpYear1,
      phpYear2,
      phpYear3,
      phpExcludedAbroad,
      phpExcludedForeignSchoolCz,
      phpExcludedIndividual,
      phpExcludedSchool,
      phaRows,
      psychComputedRows,
      healthComputedRows,
      gymComputedRows,
      summaryRows,
    ],
  );

  const {
    handleExportCsv,
    handleExportXlsx,
    handleExportZsAuditJson,
    handleCompareZsWithNamedSnapshot,
  } = useMemo(
    () =>
      createZsPageHandlers({
        zsExportBuildInput,
        setUiNotice,
        xlsxExportBusy,
        setXlsxExportBusy,
        buildSnapshot,
        totalPhmax,
        totalPha,
        totalPhp,
        tab,
        mode,
        exportLabel,
        warnings,
        validationIssues,
        namedSnapshots,
        selectedNamedId,
      }),
    [
      zsExportBuildInput,
      xlsxExportBusy,
      buildSnapshot,
      totalPhmax,
      totalPha,
      totalPhp,
      tab,
      mode,
      exportLabel,
      warnings,
      validationIssues,
      namedSnapshots,
      selectedNamedId,
      setUiNotice,
    ],
  );

  const zsComparePreview = useMemo(
    () =>
      buildZsPageComparePreview({
        buildSnapshot,
        totalPhmax,
        totalPha,
        totalPhp,
        warnings,
        namedSnapshots,
        selectedNamedId,
      }),
    [buildSnapshot, namedSnapshots, selectedNamedId, totalPhmax, totalPha, totalPhp, warnings],
  );

  const zsBasicWizardActive = viewMode === "basic" && tab === "phmax";
  const {
    zsWizardHasExceptions,
    zsWizardChoiceOptions,
    effectivePhmaxPane,
    showPhmaxSubNav,
    phmaxPaneShellClass,
    zsShowPhmaxExceptionsToc,
    goToZsWizardStep,
    handlePhmaxSubTabChange,
    handleZsWizardBack,
    handleZsWizardNext,
  } = useZsWizardNavigation({
    tab,
    viewMode,
    zsBasicWizardActive,
    zsWizardStep,
    setZsWizardStep,
    phmaxSubTab,
    setPhmaxSubTab,
    hasSection,
    goToSection,
  });

  const zsTocSections = useMemo((): readonly PageTocSection[] => {
    const sections: PageTocSection[] = [];
    if (viewMode === "expert") {
      sections.push({ id: "guide", label: "Úvod a nápověda" });
    }
    sections.push({ id: "setup", label: "Typ školy a režim" });
    if (tab === "phmax") {
      sections.push({ id: "basic", label: "Běžné třídy" });
      if (zsShowPhmaxExceptionsToc) {
        sections.push({ id: "zs-phmax-exceptions", label: "Výjimky PHmax" });
      }
      sections.push({ id: "phmax-summary", label: "Souhrn PHmax" });
    } else if (tab === "pha") {
      sections.push({ id: "pha", label: "PHAmax" });
    } else {
      sections.push({ id: "php", label: "PHPmax" });
    }
    sections.push({ id: "overview", label: "Celkový přehled" });
    return sections;
  }, [tab, viewMode, zsShowPhmaxExceptionsToc]);

  const zsTabPrimaryLabel = tab === "phmax" ? "PHmax celkem" : tab === "pha" ? "PHAmax celkem" : "PHPmax celkem";
  const zsTabPrimaryValue = tab === "phmax" ? totalPhmax : tab === "pha" ? totalPha : totalPhp;

  useFocusInputsOnMount(zsScrollToInputs);

  const zsPhmaxTabPanelProps = buildZsPhmaxTabPanelProps({
    viewMode,
    mode,
    hasSection,
    hasIssue,
    showPhmaxSubNav,
    effectivePhmaxPane,
    handlePhmaxSubTabChange,
    zsBasicWizardActive,
    zsWizardStep,
    zsWizardHasExceptions,
    validationHighlight,
    resetPhmax,
    zsMethodologyHighlights,
    basicType,
    setBasicType,
    basic1Classes,
    basic1Pupils,
    basic2Classes,
    basic2Pupils,
    setBasic1Classes,
    setBasic1Pupils,
    setBasic2Classes,
    setBasic2Pupils,
    basic1Avg,
    basic2Avg,
    basicFirstBand,
    basicSecondBand,
    basic1Phmax,
    basic2Phmax,
    basicPhmax,
    prepClassPhmax,
    prepSpecialPhmax,
    par38Phmax,
    par41Phmax,
    sec16FirstClasses,
    sec16FirstPupils,
    sec16SecondClasses,
    sec16SecondPupils,
    setSec16FirstClasses,
    setSec16FirstPupils,
    setSec16SecondClasses,
    setSec16SecondPupils,
    incl1Avg,
    incl2Avg,
    sec16FirstBand,
    sec16SecondBand,
    incl1Phmax,
    incl2Phmax,
    inclPhmax,
    special1Classes,
    special1Pupils,
    special2Classes,
    special2Pupils,
    specialIIClasses,
    specialIIPupils,
    setSpecial1Classes,
    setSpecial1Pupils,
    setSpecial2Classes,
    setSpecial2Pupils,
    setSpecialIIClasses,
    setSpecialIIPupils,
    special1Avg,
    special2Avg,
    specialIIAvg,
    special1Band,
    special2Band,
    specialIIBand,
    special1PhmaxPart,
    special2PhmaxPart,
    specialIIPhmaxPart,
    specialPhmax,
    psychComputedRows,
    addPsych,
    updatePsych,
    removePsych,
    healthComputedRows,
    addHealth,
    updateHealth,
    removeHealth,
    minorityType,
    setMinorityType,
    minority1Classes,
    minority1Pupils,
    minority2Classes,
    minority2Pupils,
    setMinority1Classes,
    setMinority1Pupils,
    setMinority2Classes,
    setMinority2Pupils,
    minority1Avg,
    minority2Avg,
    minority1Band,
    minority2Band,
    minority1Phmax,
    minority2Phmax,
    minorityPhmax,
    gymComputedRows,
    addGym,
    updateGym,
    removeGym,
    mixedMethodFirstZsPupils,
    mixedMethodFirstZsClasses,
    mixedMethodFirstSpecialPupils,
    mixedMethodFirstSpecialClasses,
    mixedMethodSecondZsPupils,
    mixedMethodSecondZsClasses,
    mixedMethodSecondSpecialPupils,
    mixedMethodSecondSpecialClasses,
    mixedMethodFirstZsAvg,
    mixedMethodSecondZsAvg,
    mixedMethodFirstSpecialAvg,
    mixedMethodSecondSpecialAvg,
    mixedMethodFirstZsBand,
    mixedMethodSecondZsBand,
    mixedMethodFirstSpecialBand,
    mixedMethodSecondSpecialBand,
    mixedMethodFirstZsResult,
    mixedMethodSecondZsResult,
    mixedMethodFirstSpecialResult,
    mixedMethodSecondSpecialResult,
    mixedMethodFirstTotal,
    mixedMethodSecondTotal,
    mixedMethodTotal,
    setMixedMethodFirstZsPupils,
    setMixedMethodFirstZsClasses,
    setMixedMethodFirstSpecialPupils,
    setMixedMethodFirstSpecialClasses,
    setMixedMethodSecondZsPupils,
    setMixedMethodSecondZsClasses,
    setMixedMethodSecondSpecialPupils,
    setMixedMethodSecondSpecialClasses,
    prepClasses,
    prepChildren,
    prepSpecialClasses,
    prepSpecialChildren,
    p38First,
    p38Second,
    p41First,
    p41Second,
    setPrepClasses,
    setPrepChildren,
    setPrepSpecialClasses,
    setPrepSpecialChildren,
    setP38First,
    setP38Second,
    setP41First,
    setP41Second,
    prepAvg,
    prepPh,
    prepSpecialAvg,
    prepSpecialPh,
    psychPhmax,
    healthPhmax,
    gymPhmax,
    mixedForTotal,
    extrasPhmax,
    totalPhmax,
  });

  return (
    <div
      className={`app-shell app-shell--gradient ${calculatorShellClassName(viewMode, displayDensity, focusMode)} app-shell--with-toc${validationHighlight ? " app-shell--validation-hint" : ""}${zsBasicWizardActive ? ` zs-basic-wizard-active zs-wizard-step-${zsWizardStep}` : ""}${phmaxPaneShellClass}`}
    >
      <div className="container container--app">
        <ZsHeroHeader
          heroHeaderRef={heroHeaderRef}
          productView={productView}
          setProductView={setProductView}
          viewMode={viewMode}
          setViewMode={setViewMode}
          displayDensity={displayDensity}
          setDisplayDensity={setDisplayDensity}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          glossaryTriggerRef={glossaryTriggerRef}
          glossaryOpen={glossaryOpen}
          setGlossaryOpen={setGlossaryOpen}
          zsGuideOpen={zsGuideOpen}
          toggleZsGuideFromHero={toggleZsGuideFromHero}
          zsHelpButtonRef={zsHelpButtonRef}
          zsTabPrimaryLabel={zsTabPrimaryLabel}
          zsTabPrimaryValue={zsTabPrimaryValue}
          totalPhmax={totalPhmax}
          mode={mode}
          incompleteSections={incompleteSections}
          toolbar={{
            selectedExample,
            exampleLegend: ZS_GUIDE_NATIVE_TOOLTIP_LEGEND,
            onExampleChange: (key) => loadExample(key as ExampleKey),
            onSaveSnapshot: saveSnapshotManually,
            onExportCsv: handleExportCsv,
            onExportXlsx: handleExportXlsx,
            xlsxExportBusy,
            onPrintSummary: printSummaryWindow,
            onRestoreSnapshot: restoreSnapshot,
            exportLabel,
            setExportLabel,
            namedSaveName,
            setNamedSaveName,
            namedSnapshots,
            selectedNamedId,
            setSelectedNamedId,
            onSaveNamedSnapshot: saveNamedSnapshot,
            onRestoreNamedSnapshot: restoreNamedSnapshot,
            onDeleteNamedSnapshot: deleteNamedSnapshot,
            onCompareWithNamedSnapshot: handleCompareZsWithNamedSnapshot,
            onExportAuditJson: handleExportZsAuditJson,
            comparePreview: zsComparePreview,
            onCopySummary: copySummaryToClipboard,
            onClearStored: clearStoredSnapshot,
            onResetAll: resetAll,
          }}
        />

        <ErrorBoundary title="Obsah kalkulačky pro základní školy se nepodařilo zobrazit">
        <ZsQuickOnboardingGuide open={zsGuideOpen} onDismiss={dismissZsGuide} returnFocusRef={zsHelpButtonRef} />
        <ZsWizardShell
          zsBasicWizardActive={zsBasicWizardActive}
          zsWizardStep={zsWizardStep}
          mode={mode}
          zsWizardHasExceptions={zsWizardHasExceptions}
          wizardChoice={wizardChoice}
          wizardOptions={zsWizardChoiceOptions}
          showInputIssueFix={showZsInputBanner}
          onScrollToIssue={zsScrollToInputs}
          onWizardChoice={applyWizardChoice}
          onStepChange={goToZsWizardStep}
          onBack={handleZsWizardBack}
          onNext={handleZsWizardNext}
          viewMode={viewMode}
          tab={tab}
          totalPha={totalPha}
          totalPhp={totalPhp}
          visibleSections={visibleSections}
          hasSection={hasSection}
          onOpenPhmaxWizard={() => {
            setTab("phmax");
            goToZsWizardStep(1);
          }}
        />

        {viewMode === "expert" ? <ZsExpertOnboardingCard /> : null}


        {viewMode === "expert" ? (
          <ZsExpertWizardGuideSection
            wizardChoice={wizardChoice}
            onWizardChoiceChange={applyWizardChoice}
            guideTooltipLegend={ZS_GUIDE_NATIVE_TOOLTIP_LEGEND}
            SectionLead={SectionLead}
          />
        ) : null}

        {showZsInputBanner ? (
          <CalculatorInputIssueBanner
            {...calculatorInputIssueBannerFromVerdict(zsVerdict, zsScrollToInputs)}
            items={zsInputBannerItems.length > 1 ? zsInputBannerItems : undefined}
          />
        ) : null}

        <ZsCalculatorShell
          workspaceStickyRef={workspaceStickyRef}
          workspaceDockLabel={CALCULATOR_WORKSPACE_DOCK_LABEL}
          sticky={{
            anchorRef: heroHeaderRef,
            primaryLabel: zsTabPrimaryLabel,
            primaryValue: zsTabPrimaryValue,
            statusText: zsVerdict.label,
            tone: zsVerdict.tone,
            onSave: saveSnapshotManually,
            onExport: handleExportCsv,
          }}
          dock={{
            tab,
            setTab,
            mode,
            incompleteSections,
            zsTabPrimaryLabel,
            zsTabPrimaryValue,
            totalPhmax,
            totalPha,
            totalPhp,
            zsVerdictTone: zsVerdict.tone,
            zsVerdictLabel: zsVerdict.label,
            zsVerdictDetail: zsVerdict.detail,
            zsDockIssueSummaries,
            zsBasicWizardActive,
            zsWorkflowSteps: zsWorkflow.steps,
            viewMode,
            firstIssueSection,
            goToSection,
            saveSnapshotManually,
            handleExportCsv,
            handleCompareZsWithNamedSnapshot,
          }}
          main={
            <>

        <ZsSetupSection
          mode={mode}
          modeOptions={modeOptions}
          onModeChange={setMode}
          SectionLead={SectionLead}
        />

        {tab === "phmax" ? <ZsPhmaxTabPanel {...zsPhmaxTabPanelProps} /> : null}

        <ZsPhaPhpTabPanels
          tab={tab}
          pha={
            tab === "pha"
              ? {
                  viewMode,
                  hasPhaIssue: hasIssue("pha"),
                  phaComputedRows,
                  totalPha,
                  onAdd: addPha,
                  onReset: resetPha,
                  onUpdate: updatePha,
                  onRemove: removePha,
                }
              : null
          }
          php={
            tab === "php"
              ? {
                  viewMode,
                  hasPhpIssue: hasIssue("php"),
                  phpWizardStep,
                  phpMethodMode,
                  phpYear1,
                  phpYear2,
                  phpYear3,
                  phpExcludedAbroad,
                  phpExcludedForeignSchoolCz,
                  phpExcludedIndividual,
                  phpExcludedSchool,
                  phpBaseValue,
                  phpExcludedTotal,
                  phpAdjustedValue,
                  phpBand,
                  totalPhp,
                  onWizardStepChange: setPhpWizardStep,
                  onMethodModeChange: setPhpMethodMode,
                  onYear1Change: setPhpYear1,
                  onYear2Change: setPhpYear2,
                  onYear3Change: setPhpYear3,
                  onExcludedAbroadChange: setPhpExcludedAbroad,
                  onExcludedForeignSchoolCzChange: setPhpExcludedForeignSchoolCz,
                  onExcludedIndividualChange: setPhpExcludedIndividual,
                  onExcludedSchoolChange: setPhpExcludedSchool,
                  onReset: resetPhp,
                }
              : null
          }
          totalPhmax={totalPhmax}
          totalPha={totalPha}
          totalPhp={totalPhp}
        />

            </>
          }
          afterWorkspace={
            <>
              {viewMode === "expert" ? <ProductLegisContextPanel variant="zs" /> : null}
              {viewMode === "expert" ? <MethodologyStrip /> : null}
            </>
          }
          footer={
            <footer className="zs-app-footer">
              <HeroStatusBar
                productLabel={PRODUCT_CALCULATOR_TITLES.zs}
                lastSavedAt={lastSavedAt}
                notice={uiNotice}
                variant="zs"
                placement="footer"
              />
              <AuthorCreditFooter />
            </footer>
          }
          tocSections={zsTocSections}
        />
        </ErrorBoundary>

        <GlossaryDialog
          open={glossaryOpen}
          onClose={() => setGlossaryOpen(false)}
          terms={GLOSSARY_TERMS}
          triggerRef={glossaryTriggerRef}
        />
      </div>
    </div>
  );

}

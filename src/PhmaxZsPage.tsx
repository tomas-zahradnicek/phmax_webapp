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
import { InputOutputLegend, ResultCard } from "./phmax-zs-ui";
import { HeroExampleSelect } from "./HeroExampleSelect";
import { ZS_HERO_EXAMPLE_GROUPS, type ZsHeroExampleKey } from "./zs-hero-example-groups";
import type { CalculatorMode, FormSection } from "./config/calculator-config";
import { MODE_CONFIG, formatModeRežimStatValue } from "./config/calculator-config";
import { getVisibleSections } from "./config/field-visibility";
import { DEFAULT_MODE } from "./config/default-form-state";
import { GlossaryDialog } from "./GlossaryDialog";
import { GlossaryIconButton } from "./GlossaryIconButton";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductLegisContextPanel, ZsLegisRef } from "./PhmaxProductLegisUi";
import { ZS_LEGIS_PARAGRAPH_TOOLTIPS } from "./phmax-zs-legislativa";
import { QuickOnboarding, QuickOnboardingHeroButton } from "./QuickOnboarding";
import { useQuickOnboarding } from "./useQuickOnboarding";
import { useUiNotice } from "./useUiNotice";
import { useFocusExampleOnMount } from "./useFocusExampleOnMount";
import { useFocusInputsOnMount } from "./useFocusInputsOnMount";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { HeroActionsDrawer } from "./HeroActionsDrawer";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import {
  PhmaxZsMethodologyReferenceTables,
  type PhmaxZsMethodologyHighlights,
} from "./phmax-zs-methodology-tables";
import { buildZsConnectedBlocks } from "./phmax-zs-connected-blocks";
import {
  HeroIconActionButton,
  IconClearStored,
  IconCopy,
  IconCsv,
  IconExcel,
  IconPrint,
  IconPrintSummary,
  IconResetAll,
  IconRestoreQuick,
  IconSpinner,
} from "./HeroActionIconButton";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { HeroStatusBar } from "./HeroStatusBar";
import { CalculatorWorkflowDock } from "./CalculatorWorkflowDock";
import { CalculatorFocusToggle } from "./CalculatorFocusToggle";
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
import { appendGeneratedRow, removeRowById, updateRowById } from "./zs/zs-dynamic-rows";
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
import { runZsExportCsv, runZsExportXlsx } from "./zs/zs-export-actions";
import type { ZsExportBuildInput } from "./zs/zs-export-build";
import { ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER } from "./zs/zs-export-rows";
import { ZsPhaTabPanel } from "./zs/ZsPhaTabPanel";
import { ZsPhpTabPanel } from "./zs/ZsPhpTabPanel";
import { ZsPhmaxBasicSection } from "./zs/ZsPhmaxBasicSection";
import { ZsPhmaxSec16Section } from "./zs/ZsPhmaxSec16Section";
import { ZsPhmaxSpecialSection } from "./zs/ZsPhmaxSpecialSection";
import { ZsPhmaxPsychSection } from "./zs/ZsPhmaxPsychSection";
import { ZsPhmaxHealthSection } from "./zs/ZsPhmaxHealthSection";
import { ZsPhmaxMinoritySection } from "./zs/ZsPhmaxMinoritySection";
import { ZsPhmaxGymSection } from "./zs/ZsPhmaxGymSection";
import { ZsPhmaxMixedSection } from "./zs/ZsPhmaxMixedSection";
import { ZsPhmaxExtrasSection } from "./zs/ZsPhmaxExtrasSection";
import { CalculatorProductShell } from "./CalculatorProductShell";
import { HeroCompactToolbar, HeroToolbarSaveButton } from "./HeroCompactToolbar";
import { HeroExpertStrip } from "./HeroExpertStrip";
import { DisplayDensityToggle } from "./DisplayDensityToggle";
import { useDisplayDensity } from "./useDisplayDensity";
import { calculatorShellClassName } from "./calculator-view-mode";
import { ZsBasicWizard } from "./ZsBasicWizard";
import { ZsPhaPhpBasicGuide } from "./ZsPhaPhpBasicGuide";
import {
  PhmaxZsPhmaxSubNav,
  phmaxPaneFromWizardStep,
  wizardStepFromPhmaxPane,
  type PhmaxZsPhmaxPane,
} from "./PhmaxZsPhmaxSubNav";
import {
  clampZsBasicWizardStep,
  readZsBasicWizardStep,
  resolveZsWizardScrollSection,
  ZS_BASIC_WIZARD_LS_KEY,
  type ZsBasicWizardStep,
} from "./zs-basic-wizard";
import { CompareVariantsPanel } from "./CompareVariantsPanel";
import {
  BROWSER_ERROR_NEXT_STEP_HINT,
  CALCULATOR_LIMITS_NOTE,
  LAY_USER_QUICK_START_ZS,
  LAY_USER_QUICK_START_MOBILE_UX,
  MSG_NAMED_BACKUP_PICK_TO_COMPARE,
  MSG_NO_LOCAL_AUTOSAVE_DATA,
  MSG_ZS_NAMED_BACKUP_NO_AUDIT_TOTALS,
  EXPORT_ORIENTACNI_NOTE,
  formatZsLayContextLine,
  HERO_ACTIONS_ICON_LEGEND,
  HERO_ACTIONS_ICON_LEGEND_ZS_EXTRA,
  NAMED_BACKUPS_COMPARE_JSON_LABEL,
  NAMED_BACKUPS_DELETE_LABEL,
  NAMED_BACKUPS_NAME_LABEL,
  NAMED_BACKUPS_RESTORE_LABEL,
  NAMED_BACKUPS_SAVE_LABEL,
  NAMED_BACKUPS_SELECT_PLACEHOLDER,
  CALCULATOR_WORKSPACE_DOCK_LABEL,
  PHMAX_ZS_ONBOARDING_LS_KEY,
  PRODUCT_CALCULATOR_TITLES,
  namedBackupsMicrocopy,
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
import { MAX_NAMED_SNAPSHOTS } from "./zs-named-snapshots";
import { createZsProductAuditProtocol, parseZsSnapshotAuditTotals } from "./phmax-product-audit";
import { comparePhmaxProductVariants } from "./phmax-product-compare";
import { downloadPhmaxProductAuditJson, downloadPhmaxProductCompareJson } from "./phmax-product-audit-download";

/** Orientační označení souladu s metodikou MŠMT (aplikace nenahrazuje oficiální výpočet). */
const METHODIKA_VERSION_LABEL = "Metodika PHmax/PHAmax/PHPmax pro ZV, verze 5 (březen 2026)";
const ZS_VIEW_MODE_LS_KEY = "phmax-zs-view-mode";

type TabKey = "phmax" | "pha" | "php";

type PhpWizardStep = "a" | "b" | "c" | "d";
type PhpMethodMode = "three_year_avg" | "short_period";
type Nv75Role = "ucitel" | "reditel";
type Nv75School = "plavecka_skola";
type ExampleKey = ZsHeroExampleKey;
type WizardChoice =
  | ""
  | "php_small"
  | "php_deductions"
  | "ph_inclusion"
  | "ph_psych"
  | "ph_health"
  | "ph_mixed"
  | "ph_prep";
type DataMode = "own" | "example";

/** Viditelná legenda + doplněk k nativním tooltipům (`title`) u řádků v seznamech. */
const ZS_GUIDE_NATIVE_TOOLTIP_LEGEND =
  "U řádků s předpisy najděte myší na položku v seznamu – prohlížeč zobrazí krátký text (atribut title). U tečkovaných citací § v textu stránky použijte stejný postup jako v záložce „Legislativa a výklad (ZŠ)“ (hover nebo Tab).";

const WIZARD_CHOICE_TITLES: Record<Exclude<WizardChoice, "">, string> = {
  php_small: "Menší škola – PHPmax se určí podle metodiky z průměrného počtu žáků a příslušných pásem.",
  php_deductions:
    "Žáci, kteří se do PHPmax nezapočítávají (zahraničí, individuální vzdělávání, školy v zahraničí v ČR apod.) – snížení vypočteného základu dle metodiky.",
  ph_inclusion: ZS_LEGIS_PARAGRAPH_TOOLTIPS["zs-16-9"],
  ph_psych:
    "Škola při psychiatrické nemocnici – přepne na režim s tabulkami PHmax pro psychiatrickou školu a načte ukázková data.",
  ph_health:
    "ZŠ při zdravotnickém zařízení (ne psychiatrie) – řádky B11–B13, průměr žáků jako u psychiatrie dle zvoleného režimu.",
  ph_mixed:
    "Smíšené třídy § 16 odst. 9 a ZŠ speciální – tabulky podle převažujícího oboru vzdělání (B9–B10 vs. B26–B28).",
  ph_prep:
    "Přípravná třída základní školy nebo přípravný stupeň ZŠ speciální – samostatné položky PHmax v metodice.",
};

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

  const addPha = () => appendGeneratedRow(setPhaRows, createEmptyPhaRow);
  const updatePha = (id: number, key: keyof PhaRow, value: string | number) => updateRowById(setPhaRows, id, key, value);
  const removePha = (id: number) => removeRowById(setPhaRows, id);

  const addPsych = () => appendGeneratedRow(setPsychRows, createEmptyPsychRow);
  const updatePsych = (id: number, key: keyof PsychRow, value: string | number) =>
    updateRowById(setPsychRows, id, key, value);
  const removePsych = (id: number) => removeRowById(setPsychRows, id);

  const addHealth = () => appendGeneratedRow(setHealthRows, createEmptyHealthRow);
  const updateHealth = (id: number, key: keyof HealthRow, value: string | number) =>
    updateRowById(setHealthRows, id, key, value);
  const removeHealth = (id: number) => removeRowById(setHealthRows, id);

  const addGym = () => appendGeneratedRow(setGymRows, createEmptyGymRow);
  const updateGym = (id: number, key: keyof GymRow, value: string | number) => updateRowById(setGymRows, id, key, value);
  const removeGym = (id: number) => removeRowById(setGymRows, id);

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
    if (!choice) return;
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

  const workspaceStickyRef = useRef<HTMLDivElement>(null);
  const tabChangeSkipRef = useRef(true);

  const goToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (!element || !(element instanceof HTMLElement)) return;
    const dock = workspaceStickyRef.current;
    const offset = dock?.offsetHeight ?? 100;
    const top = element.getBoundingClientRect().top + window.scrollY - offset - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (tabChangeSkipRef.current) {
      tabChangeSkipRef.current = false;
      return;
    }
    const targetId = tab === "phmax" ? "basic" : tab;
    requestAnimationFrame(() => {
      const el = (document.querySelector(`[data-section="${targetId}"]`) ??
        document.querySelector(`[data-section="guide"]`)) as HTMLElement | null;
      if (!el) return;
      const dock = workspaceStickyRef.current;
      const offset = dock?.getBoundingClientRect().height ?? 100;
      const rect = el.getBoundingClientRect();
      if (rect.top < offset + 12 || rect.bottom > window.innerHeight - 32) {
        const top = rect.top + window.scrollY - offset - 12;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    });
  }, [tab]);

  const zsNeedsInputBanner = zsVerdict.tone !== "ok";
  const zsScrollToInputs = useCallback(() => {
    if (firstIssueSection) goToSection(firstIssueSection);
  }, [firstIssueSection, goToSection]);
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
    (): readonly (readonly [string, string | number])[] => [
    ["Běžné třídy ZŠ – 1. stupeň", basic1Phmax],
    ["Běžné třídy ZŠ – 2. stupeň", basic2Phmax],
    ["Běžné třídy ZŠ – celkem", basicPhmax],
    ["Třídy podle § 16 odst. 9 – 1. stupeň", incl1Phmax],
    ["Třídy podle § 16 odst. 9 – 2. stupeň", incl2Phmax],
    ["Třídy podle § 16 odst. 9 – celkem", inclPhmax],
    ["Škola při psychiatrické nemocnici", psychPhmax],
    ["ZŠ při zdravotnickém zařízení (mimo psychiatrii), ř. B11–B13", healthPhmax],
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
    ],
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
      mixedMethodFirstTotal,
      mixedMethodSecondTotal,
      mixedMethodTotal,
      mixedRows,
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
    (): ZsExportBuildInput => ({
      tab,
      modeLabel: MODE_CONFIG[mode].label,
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
      methodikaLabel: METHODIKA_VERSION_LABEL,
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

  const handleExportCsv = () => {
    void runZsExportCsv(zsExportBuildInput, setUiNotice);
  };

  const handleExportXlsx = async () => {
    await runZsExportXlsx(zsExportBuildInput, {
      busy: xlsxExportBusy,
      setBusy: setXlsxExportBusy,
      onNotice: setUiNotice,
    });
  };

  const handleExportZsAuditJson = () => {
    downloadPhmaxProductAuditJson(
      createZsProductAuditProtocol({
        formSnapshot: buildSnapshot() as Record<string, unknown>,
        totals: {
          totalPhmax,
          breakdown: { totalPha, totalPhp },
        },
        validationIssues: [
          ...warnings.map((w) => ({ severity: "warning" as const, message: w })),
          ...validationIssues.map((v) => ({
            severity: "info" as const,
            code: v.section,
            message: v.label,
          })),
        ],
        narrative: `${tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax"} – ${MODE_CONFIG[mode].label}${
          exportLabel ? `; export: ${exportLabel}` : ""
        }`,
      }),
      "zs",
    );
    setUiNotice("Stažen auditní protokol (JSON).");
  };

  const handleCompareZsWithNamedSnapshot = () => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice(MSG_NAMED_BACKUP_PICK_TO_COMPARE);
      return;
    }
    const stored = parseZsSnapshotAuditTotals(item.snapshot);
    if (!stored) {
      setUiNotice(MSG_ZS_NAMED_BACKUP_NO_AUDIT_TOTALS);
      return;
    }
    const currentProtocol = createZsProductAuditProtocol({
      formSnapshot: buildSnapshot() as Record<string, unknown>,
      totals: { totalPhmax, breakdown: { totalPha, totalPhp } },
      validationIssues: warnings.map((w) => ({ severity: "warning" as const, message: w })),
      narrative: "Aktuální stav",
    });
    const namedProtocol = createZsProductAuditProtocol({
      formSnapshot: {
        namedBackup: item.name,
        exportLabel: typeof item.snapshot.exportLabel === "string" ? item.snapshot.exportLabel : "",
        tabAtSave: stored.tab,
      },
      totals: {
        totalPhmax: stored.totalPhmax,
        breakdown: { totalPha: stored.totalPha, totalPhp: stored.totalPhp },
      },
      narrative: item.name,
    });
    const cmp = comparePhmaxProductVariants([
      { id: "current", label: "Aktuální stav", protocol: currentProtocol },
      { id: "named", label: item.name, protocol: namedProtocol },
    ]);
    downloadPhmaxProductCompareJson(cmp, "zs");
    setUiNotice(
      `Staženo srovnání: aktuální stav vs „${item.name}“ (JSON). Krátké doporučení: ${cmp.recommendation}`,
    );
  };

  const zsComparePreview = useMemo(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) return null;
    const stored = parseZsSnapshotAuditTotals(item.snapshot);
    if (!stored) return null;
    const currentProtocol = createZsProductAuditProtocol({
      formSnapshot: buildSnapshot() as Record<string, unknown>,
      totals: { totalPhmax, breakdown: { totalPha, totalPhp } },
      validationIssues: warnings.map((w) => ({ severity: "warning" as const, message: w })),
      narrative: "Aktuální stav",
    });
    const namedProtocol = createZsProductAuditProtocol({
      formSnapshot: {
        namedBackup: item.name,
        exportLabel: typeof item.snapshot.exportLabel === "string" ? item.snapshot.exportLabel : "",
        tabAtSave: stored.tab,
      },
      totals: {
        totalPhmax: stored.totalPhmax,
        breakdown: { totalPha: stored.totalPha, totalPhp: stored.totalPhp },
      },
      narrative: item.name,
    });
    return comparePhmaxProductVariants([
      { id: "current", label: "Aktuální stav", protocol: currentProtocol },
      { id: "named", label: item.name, protocol: namedProtocol },
    ]);
  }, [buildSnapshot, namedSnapshots, selectedNamedId, totalPhmax, totalPha, totalPhp, warnings]);

  const zsBasicWizardActive = viewMode === "basic" && tab === "phmax";
  const effectivePhmaxPane: PhmaxZsPhmaxPane =
    zsBasicWizardActive && zsWizardStep >= 2 ? phmaxPaneFromWizardStep(zsWizardStep) : phmaxSubTab;
  const showPhmaxSubNav = tab === "phmax" && (!zsBasicWizardActive || zsWizardStep >= 2);
  const phmaxPaneShellClass =
    tab === "phmax" && (!zsBasicWizardActive || zsWizardStep >= 2)
      ? ` phmax-zs-pane-active-${effectivePhmaxPane}`
      : "";

  const zsWizardVisibleExceptionIds = useMemo(() => {
    const ids: string[] = [];
    if (hasSection("sec16_first") || hasSection("sec16_second")) ids.push("sec16");
    if (hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) {
      ids.push("special");
    }
    if (hasSection("psych_groups")) ids.push("psych");
    if (hasSection("health_groups")) ids.push("health");
    if (hasSection("minority_first")) ids.push("minority");
    if (hasSection("gym_groups")) ids.push("gym");
    if (hasSection("dominant_c_first") || hasSection("dominant_b_first")) ids.push("mixed");
    if (hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) {
      ids.push("extras");
    }
    return ids;
  }, [hasSection]);

  const zsWizardHasExceptions = zsWizardVisibleExceptionIds.length > 0;

  const zsWizardChoiceOptions = useMemo(
    () =>
      [
        { value: "php_small", label: "Menší škola – PHPmax", title: WIZARD_CHOICE_TITLES.php_small },
        { value: "php_deductions", label: "PHPmax – nezapočítávaní žáci", title: WIZARD_CHOICE_TITLES.php_deductions },
        { value: "ph_inclusion", label: "Inkluze a § 16/9", title: WIZARD_CHOICE_TITLES.ph_inclusion },
        { value: "ph_psych", label: "Škola při psychiatrii", title: WIZARD_CHOICE_TITLES.ph_psych },
        { value: "ph_health", label: "ZŠ při zdravotnickém zařízení", title: WIZARD_CHOICE_TITLES.ph_health },
        { value: "ph_mixed", label: "Smíšené třídy", title: WIZARD_CHOICE_TITLES.ph_mixed },
        { value: "ph_prep", label: "Přípravná třída / stupeň ZŠS", title: WIZARD_CHOICE_TITLES.ph_prep },
      ] as const,
    [],
  );

  const goToZsWizardStep = useCallback(
    (step: ZsBasicWizardStep) => {
      setZsWizardStep(step);
      if (step >= 2) {
        setPhmaxSubTab(phmaxPaneFromWizardStep(step));
      }
      window.requestAnimationFrame(() => {
        goToSection(resolveZsWizardScrollSection(step, zsWizardVisibleExceptionIds));
      });
    },
    [goToSection, zsWizardVisibleExceptionIds],
  );

  const handlePhmaxSubTabChange = useCallback(
    (pane: PhmaxZsPhmaxPane) => {
      setPhmaxSubTab(pane);
      if (zsBasicWizardActive) {
        goToZsWizardStep(wizardStepFromPhmaxPane(pane));
        return;
      }
      const target =
        pane === "classes" ? "basic" : pane === "exceptions" ? zsWizardVisibleExceptionIds[0] ?? "sec16" : "phmax-summary";
      goToSection(target);
    },
    [goToSection, goToZsWizardStep, zsBasicWizardActive, zsWizardVisibleExceptionIds],
  );

  const handleZsWizardBack = useCallback(() => {
    goToZsWizardStep(clampZsBasicWizardStep(zsWizardStep - 1));
  }, [goToZsWizardStep, zsWizardStep]);

  const handleZsWizardNext = useCallback(() => {
    if (zsWizardStep >= 5) {
      goToSection("overview");
      return;
    }
    if (zsWizardStep === 3 && !zsWizardHasExceptions) {
      goToZsWizardStep(4);
      return;
    }
    goToZsWizardStep(clampZsBasicWizardStep(zsWizardStep + 1));
  }, [goToSection, goToZsWizardStep, zsWizardHasExceptions, zsWizardStep]);

  const zsShowPhmaxExceptionsToc =
    tab === "phmax" &&
    (viewMode === "expert" || zsWizardHasExceptions || (zsBasicWizardActive && zsWizardStep >= 3));

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

  return (
    <div
      className={`app-shell app-shell--gradient ${calculatorShellClassName(viewMode, displayDensity, focusMode)} app-shell--with-toc${validationHighlight ? " app-shell--validation-hint" : ""}${zsBasicWizardActive ? ` zs-basic-wizard-active zs-wizard-step-${zsWizardStep}` : ""}${phmaxPaneShellClass}`}
    >
      <div className="container container--app">
        <header className="hero hero--feature" ref={heroHeaderRef}>
          <div className="hero__orb hero__orb--one" />
          <div className="hero__orb hero__orb--two" />

          <div className="hero__pills-row">
            <ProductViewPills productView={productView} setProductView={setProductView} />
            <div className="hero__pills-row-trailing">
              <div className="checks" role="group" aria-label="Režim zobrazení ZŠ">
                <label>
                  <input
                    type="radio"
                    name="zs-view-mode"
                    checked={viewMode === "basic"}
                    onChange={() => setViewMode("basic")}
                  />
                  Základní
                </label>
                <label>
                  <input
                    type="radio"
                    name="zs-view-mode"
                    checked={viewMode === "expert"}
                    onChange={() => setViewMode("expert")}
                  />
                  Expertní
                </label>
              </div>
              <DisplayDensityToggle density={displayDensity} onChange={setDisplayDensity} name="zs-display-density" />
              <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />
              <GlossaryIconButton
                ref={glossaryTriggerRef}
                className="glossary-icon-btn--hero"
                expanded={glossaryOpen}
                onClick={() => setGlossaryOpen(true)}
              />
              <QuickOnboardingHeroButton guideOpen={zsGuideOpen} onToggle={toggleZsGuideFromHero} buttonRef={zsHelpButtonRef} />
            </div>
          </div>

          <HeroExpertStrip
            title="PHmax, PHAmax a PHPmax – základní škola"
            kpis={[
              { label: zsTabPrimaryLabel.replace(" celkem", ""), value: zsTabPrimaryValue },
              { label: "PHmax", value: totalPhmax },
              { label: "Režim", value: MODE_CONFIG[mode].label },
              {
                label: "Stav",
                value: incompleteSections > 0 ? `${incompleteSections} nevyplněno` : "Vstupy kompletní",
              },
            ]}
          />

          <div className="grid two hero__grid hero__grid--context">
            <div>
              <p className="hero-zone-label">A. Kontext výpočtu</p>
              <h1 className="hero__title hero__title--zs">PHmax, PHAmax a PHPmax – základní škola</h1>
              <p className="hero__text hero__text--zs">
                Orientační výpočet podle metodiky PHmax, PHAmax a PHPmax pro ZŠ (verze 5 / 2026) a souvisejících
                předpisů. Ukázkové situace a zálohy scénářů jsou v horní liště; podrobnosti k modulům najdete v nápovědě.
              </p>
            </div>
          </div>

          <section className="hero-zone-actions hero-zone-actions--toolbar" aria-label="Akce výpočtu">
            <div className="hero-zone-actions__toolbar-row">
            <div className="field field--hero-select hero-actions__example hero-zs-example-select">
              <span className="field__label field__label--hero" id="zs-hero-example-label">
                Ukázkový příklad
              </span>
              <HeroExampleSelect
                id="zs-hero-example-select"
                aria-labelledby="zs-hero-example-label"
                aria-describedby="zs-hero-example-legend"
                title="Ukázkové příklady z metodiky ZŠ. Najeďte na konkrétní řádek v seznamu pro stručný výklad situace a předpisů."
                value={selectedExample}
                groups={ZS_HERO_EXAMPLE_GROUPS}
                onChange={(key) => loadExample(key as ExampleKey)}
              />
              <p id="zs-hero-example-legend" className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "44rem", lineHeight: 1.5 }}>
                {ZS_GUIDE_NATIVE_TOOLTIP_LEGEND}
              </p>
            </div>
            <HeroActionsDrawer>
              <HeroCompactToolbar
                primary={
                  <>
                    <HeroToolbarSaveButton onClick={saveSnapshotManually} />
                    <HeroIconActionButton
                      showLabel
                      className="btn btn--light"
                      label="Tisk stránky"
                      icon={<IconPrint />}
                      onClick={() => window.print()}
                    />
                    <HeroIconActionButton
                      showLabel
                      className="btn ghost"
                      label="Export CSV"
                      icon={<IconCsv />}
                      onClick={handleExportCsv}
                    />
                    <HeroIconActionButton
                      showLabel
                      className="btn ghost"
                      label={xlsxExportBusy ? "Připravuji Excel…" : "Export Excel"}
                      icon={xlsxExportBusy ? <IconSpinner /> : <IconExcel />}
                      disabled={xlsxExportBusy}
                      aria-busy={xlsxExportBusy}
                      onClick={() => void handleExportXlsx()}
                    />
                    <HeroIconActionButton
                      showLabel
                      className="btn btn--light"
                      label="Tisk shrnutí"
                      icon={<IconPrintSummary />}
                      onClick={printSummaryWindow}
                    />
                  </>
                }
                backups={
                  <>
                    <HeroIconActionButton
                      showLabel
                      className="btn ghost"
                      label="Obnovit uložený průběh"
                      icon={<IconRestoreQuick />}
                      onClick={restoreSnapshot}
                    />
                    <div className="hero-named-grid hero-actions-tiered__named" aria-label="Pojmenované zálohy">
                      <p className="hero-actions-tiered__hint">
                        {namedBackupsMicrocopy(MAX_NAMED_SNAPSHOTS, "kompletní stav ZŠ včetně aktivní záložky a označení pro export")}
                      </p>
                      <label className="hero-named-field hero-named-field--export">
                        <span className="field__label field__label--hero-named">Označení pro export</span>
                        <input
                          type="text"
                          className="input"
                          placeholder="např. název školy, školní rok…"
                          value={exportLabel}
                          onChange={(e) => setExportLabel(e.target.value)}
                          aria-label="Označení pro export a shrnutí"
                        />
                      </label>
                      <label className="hero-named-field hero-named-field--backup-name">
                        <span className="field__label field__label--hero-named">{NAMED_BACKUPS_NAME_LABEL}</span>
                        <input
                          type="text"
                          className="input"
                          placeholder="např. stav 2026/27"
                          value={namedSaveName}
                          onChange={(e) => setNamedSaveName(e.target.value)}
                          aria-label="Název pojmenované zálohy"
                        />
                      </label>
                      <div className="hero-named-field hero-named-field--save">
                        <button type="button" className="btn ghost btn--hero-named" onClick={saveNamedSnapshot}>
                          {NAMED_BACKUPS_SAVE_LABEL}
                        </button>
                      </div>
                      <div className="hero-named-field hero-named-field--select">
                        <select
                          className="input"
                          value={selectedNamedId}
                          onChange={(e) => setSelectedNamedId(e.target.value)}
                          aria-label="Vybrat uloženou zálohu"
                        >
                          <option value="">{NAMED_BACKUPS_SELECT_PLACEHOLDER}</option>
                          {namedSnapshots.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="hero-named-field hero-named-field--restore-delete">
                        <button type="button" className="btn ghost btn--hero-named" onClick={restoreNamedSnapshot}>
                          {NAMED_BACKUPS_RESTORE_LABEL}
                        </button>
                        <button type="button" className="btn ghost btn--hero-named" onClick={deleteNamedSnapshot}>
                          {NAMED_BACKUPS_DELETE_LABEL}
                        </button>
                      </div>
                    </div>
                  </>
                }
                technical={
                  <>
                    <button type="button" className="btn ghost btn--hero-named ux-expert-only" onClick={handleCompareZsWithNamedSnapshot}>
                      {NAMED_BACKUPS_COMPARE_JSON_LABEL}
                    </button>
                    <button type="button" className="btn ghost btn--hero-named ux-expert-only" onClick={handleExportZsAuditJson}>
                      Stáhnout audit (JSON)
                    </button>
                    <div className="ux-expert-only hero-actions-tiered__compare">
                      <CompareVariantsPanel
                        title="Porovnání 2 variant (náhled)"
                        result={zsComparePreview}
                        emptyHint="Vyberte pojmenovanou zálohu se součty auditního exportu pro porovnání s aktuálním stavem."
                        exportSlug="zs"
                      />
                    </div>
                    <HeroIconActionButton
                      showLabel
                      className="btn ghost"
                      label="Kopírovat shrnutí"
                      icon={<IconCopy />}
                      onClick={copySummaryToClipboard}
                    />
                    <HeroIconActionButton
                      showLabel
                      className="btn ghost"
                      label="Vymazat uložená data"
                      icon={<IconClearStored />}
                      onClick={clearStoredSnapshot}
                    />
                    <HeroIconActionButton
                      showLabel
                      className="btn ghost"
                      label="Vymazat formulář"
                      icon={<IconResetAll />}
                      onClick={resetAll}
                    />
                  </>
                }
              />
            </HeroActionsDrawer>
            </div>
          </section>
        </header>

        <ErrorBoundary title="Obsah kalkulačky pro základní školy se nepodařilo zobrazit">
        <QuickOnboarding
          title="Stručné pokyny"
          open={zsGuideOpen}
          onDismiss={dismissZsGuide}
          anchorId="zs-quick-guide"
          returnFocusRef={zsHelpButtonRef}
        >
          <p>
            <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
          </p>
          <p>{LAY_USER_QUICK_START_ZS}</p>
          <p>{LAY_USER_QUICK_START_MOBILE_UX}</p>
          <p>
            <strong>PHmax</strong> zadejte podle typu školy v rozbalovacím režimu; u specialit (psychiatrie, zdravotnické zařízení,
            menšina, gymnázia…) přepněte na odpovídající položku. <strong>PHAmax</strong> a <strong>PHPmax</strong> mají vlastní záložky.
            Žáky podle <strong>§ 38</strong> a <strong>§ 41</strong> školského zákona (navýšení PHmax o 0,25 / 0,5 h podle stupně) zadejte v sekci{" "}
            <strong>Samostatné položky PHmax</strong> – u většiny režimů ZŠ je přímo pod hlavními tabulkami; přípravné třídy a přípravný stupeň ZŠS
            jsou navíc v režimu „PHmax – přípravné třídy, přípravný stupeň, § 38 a § 41“.
          </p>
          <p>
            Průměry u škol při zdravotnickém zařízení a psychiatrii počítá aplikace jako vyšší z minulého roku a aktuálního sběru – doplňte oba sloupce, pokud je znáte.
            Pojmenované zálohy (max. {MAX_NAMED_SNAPSHOTS}) drží celý stav včetně záložky a pole „Označení pro export“.
            Srovnání aktuálního stavu se zálohou (JSON) používá uložené součty PHmax / PHAmax / PHPmax – u starších záloh z předchozí verze aplikace tuto položku znovu uložte.
          </p>
          <p>{EXPORT_ORIENTACNI_NOTE}</p>
          <p className="onboarding-hero-legend">
            {HERO_ACTIONS_ICON_LEGEND}
            {HERO_ACTIONS_ICON_LEGEND_ZS_EXTRA}
          </p>
          <p>
            V první skupině ukázek jsou čísla z modelových postupů PHmax v metodické příloze (včetně smíšených tříd 570 h).
            Model <ZsLegisRef citeId="zs-16-9" label="§ 16/9" /> a ZŠ speciální (AD1/AD2, řádky B35–B43) je v metodice v5 jako PHAmax – v rozbalovači ukázka „PHAmax“; po načtení se otevře záložka PHAmax.
            Ostatní ukázky doplňují typické situace; údaje můžete po načtení upravit.
          </p>
          <p>
            <strong>Právní a metodický podklad:</strong> metodika PHmax, PHAmax a PHPmax pro ZV (typicky verze 5 / 2026),{" "}
            <ZsLegisRef citeId="nv123-1" label="NV č. 123/2018 Sb." />, <ZsLegisRef citeId="vyhl48" label="vyhl. č. 48/2005 Sb." />.
            {ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER}
          </p>
        </QuickOnboarding>
        {zsBasicWizardActive ? (
          <ZsBasicWizard
            step={zsWizardStep}
            modeLabel={MODE_CONFIG[mode].label}
            hasExceptionModules={zsWizardHasExceptions}
            wizardChoice={wizardChoice}
            wizardOptions={zsWizardChoiceOptions}
            inputIssueFix={showZsInputBanner ? { onFix: zsScrollToInputs } : undefined}
            onWizardChoice={(value) => applyWizardChoice(value as WizardChoice)}
            onStepChange={goToZsWizardStep}
            onBack={handleZsWizardBack}
            onNext={handleZsWizardNext}
          />
        ) : viewMode === "basic" && tab === "pha" ? (
          <ZsPhaPhpBasicGuide
            tab="pha"
            totalValue={totalPha}
            moduleApplies={visibleSections.some(
              (s) => s.startsWith("pha_rvp") || s === "pha_disability_flags",
            )}
            onOpenPhmaxWizard={() => {
              setTab("phmax");
              goToZsWizardStep(1);
            }}
          />
        ) : viewMode === "basic" && tab === "php" ? (
          <ZsPhaPhpBasicGuide
            tab="php"
            totalValue={totalPhp}
            moduleApplies={hasSection("php_years") || hasSection("php_options")}
            onOpenPhmaxWizard={() => {
              setTab("phmax");
              goToZsWizardStep(1);
            }}
          />
        ) : null}

        {viewMode === "expert" ? (
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
        ) : null}


        {viewMode === "expert" ? (
        <section className="card card--accent section-card section-card--guide" data-section="guide">
          <h2 className="section-title">Rychlý rozcestník</h2>
          <SectionLead>
            Nejste si jistí, kde začít? Vyberte situaci, která se nejvíc blíží vaší škole. Aplikace vás přesměruje na správnou část kalkulačky a vyplní odpovídající ukázkový příklad.
          </SectionLead>
<div className="grid two">
            <div className="field">
              <span id="zs-wizard-choice-label">Jakou situaci chcete řešit?</span>
              <select
                id="zs-wizard-choice-select"
                aria-labelledby="zs-wizard-choice-label"
                aria-describedby="zs-wizard-choice-legend"
                title="Rychlý rozcestník: po výběru se načte ukázka a přepne se záložka. Najeďte na řádek pro stručný popis situace."
                value={wizardChoice}
                onChange={(e) => applyWizardChoice(e.target.value as WizardChoice)}
              >
                <option value="">Vyberte situaci…</option>
                <option value="php_small" title={WIZARD_CHOICE_TITLES.php_small}>
                  Máme menší školu a chceme zjistit PHPmax
                </option>
                <option value="php_deductions" title={WIZARD_CHOICE_TITLES.php_deductions}>
                  Máme žáky, kteří se do PHPmax nezapočítávají
                </option>
                <option value="ph_inclusion" title={WIZARD_CHOICE_TITLES.ph_inclusion}>
                  Jsme škola s inkluzí a třídami podle § 16
                </option>
                <option value="ph_psych" title={WIZARD_CHOICE_TITLES.ph_psych}>
                  Jsme škola při psychiatrické nemocnici
                </option>
                <option value="ph_health" title={WIZARD_CHOICE_TITLES.ph_health}>
                  Jsme ZŠ při zdravotnickém zařízení (ne psychiatrie)
                </option>
                <option value="ph_mixed" title={WIZARD_CHOICE_TITLES.ph_mixed}>
                  Máme smíšené třídy
                </option>
                <option value="ph_prep" title={WIZARD_CHOICE_TITLES.ph_prep}>
                  Máme přípravnou třídu nebo přípravný stupeň ZŠS
                </option>
              </select>
              <p id="zs-wizard-choice-legend" className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", lineHeight: 1.5 }}>
                {ZS_GUIDE_NATIVE_TOOLTIP_LEGEND}
              </p>
            </div>

            <div className="subcard">
              <h3>Co rozcestník udělá</h3>
              <p className="muted-text">
                Vybere vhodnou záložku a načte příklad, který odpovídá zvolené situaci. Potom můžete všechna data ručně upravit podle vlastní školy.
              </p>
            </div>
          </div>
        </section>
        ) : null}

        {showZsInputBanner ? (
          <CalculatorInputIssueBanner
            {...calculatorInputIssueBannerFromVerdict(zsVerdict, zsScrollToInputs)}
            items={zsInputBannerItems.length > 1 ? zsInputBannerItems : undefined}
          />
        ) : null}

        <CalculatorProductShell
          sticky={{
            anchorRef: heroHeaderRef,
            primaryLabel: zsTabPrimaryLabel,
            primaryValue: zsTabPrimaryValue,
            statusText: zsVerdict.label,
            tone: zsVerdict.tone,
            onSave: saveSnapshotManually,
            onExport: handleExportCsv,
          }}
          workspaceDockLabel={CALCULATOR_WORKSPACE_DOCK_LABEL}
          dockSticky
          dockStickyRef={workspaceStickyRef}
          dock={
            <CalculatorWorkflowDock
              header={
                <>
                  <div className="tabs tabs--sticky tabs--sticky-sdlike">
                    <button type="button" className={tab === "phmax" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("phmax")}>PHmax</button>
                    <button type="button" className={tab === "pha" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("pha")}>PHAmax</button>
                    <button type="button" className={tab === "php" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("php")}>PHPmax</button>
                  </div>
                  <p className="muted-text workflow-dock__context-line">
                    {formatZsLayContextLine(MODE_CONFIG[mode].label, tab, incompleteSections)}
                  </p>
                </>
              }
              tone={zsVerdict.tone}
              primaryLabel={zsTabPrimaryLabel}
              primaryValue={zsTabPrimaryValue}
              statusBadge={zsVerdict.label}
              stats={[
                { label: "PHmax", value: totalPhmax },
                { label: "PHAmax", value: totalPha },
                { label: "PHPmax", value: totalPhp },
                { label: "Režim", value: formatModeRežimStatValue(MODE_CONFIG[mode].label) },
              ]}
              verdictLabel={zsVerdict.label}
              verdictDetail={zsDockIssueSummaries.length > 0 ? "" : zsVerdict.detail}
              issueSummaries={zsDockIssueSummaries}
              workflowSteps={zsBasicWizardActive ? [] : zsWorkflow.steps}
              viewMode={viewMode}
              actions={[
                ...(firstIssueSection
                  ? [{ label: "Přejít k chybě", onClick: () => goToSection(firstIssueSection) }]
                  : []),
                { label: "Uložit scénář", onClick: saveSnapshotManually },
                { label: "Export CSV", onClick: handleExportCsv },
                { label: "Porovnat se zálohou", onClick: handleCompareZsWithNamedSnapshot },
              ]}
            />
          }
          main={
            <>

        <section className="card card--elevated section-card section-card--setup" data-section="setup" data-wizard-step="1">
          <h2 className="section-title">Typ školy a režim výpočtu</h2>
          <SectionLead>
            Tady vyberete, jaký typ výpočtu chcete zobrazit. Rozcestník výše vám může s výběrem pomoci.
          </SectionLead>
          <InputOutputLegend />
          <div className="grid two">
            <div className="field">
              <span id="zs-mode-select-label">Vyberte režim</span>
              <select
                id="zs-mode-select"
                aria-labelledby="zs-mode-select-label"
                aria-describedby="zs-mode-select-legend"
                title="Režim určuje viditelné části kalkulačky. U každé položky v seznamu je po najetí myší stručný popis; detail aktivního režimu je vpravo."
                value={mode}
                onChange={(e) => setMode(e.target.value as CalculatorMode)}
              >
                {modeOptions.map((item) => (
                  <option key={item.id} value={item.id} title={item.description}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p id="zs-mode-select-legend" className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", lineHeight: 1.5 }}>
                Každá položka seznamu má vlastní nápovědu (najetí na řádek). U předpisů lze použít i záložku „Legislativa a
                výklad (ZŠ)“.
              </p>
            </div>

            <div className="subcard">
              <h3>{MODE_CONFIG[mode].label}</h3>
              <p className="muted-text">{MODE_CONFIG[mode].description}</p>
            </div>
          </div>
        </section>


        {tab === "phmax" && (
          <div className="stack">
            {showPhmaxSubNav ? (
              <PhmaxZsPhmaxSubNav active={effectivePhmaxPane} onChange={handlePhmaxSubTabChange} />
            ) : null}
            {zsBasicWizardActive && zsWizardStep === 3 && !zsWizardHasExceptions ? (
              <section className="card muted section-card" data-wizard-step="3" data-section="wizard-exceptions-empty">
                <h2 className="section-title">Výjimky</h2>
                <p className="muted-text" style={{ margin: 0 }}>
                  Pro zvolený režim „{MODE_CONFIG[mode].label}“ nejsou v metodice viditelné doplňkové moduly (§ 16/9, ZŠ
                  speciální, psychiatrie…). Pokračujte na souhrn nebo změňte režim v kroku 1.
                </p>
              </section>
            ) : null}
            <ZsPhmaxBasicSection
              hasBasicIssue={hasIssue("basic")}
              showBasicFirst={hasSection("basic_first")}
              showBasicSecond={hasSection("basic_second")}
              showSchoolVariantFirstOnly={hasSection("school_variant_first_stage_only")}
              showPrepClass={hasSection("prep_class")}
              showPrepSpecial={hasSection("prep_special")}
              showPar38={hasSection("par38")}
              showPar41={hasSection("par41")}
              basicType={basicType}
              onBasicTypeChange={setBasicType}
              basic1Classes={basic1Classes}
              basic1Pupils={basic1Pupils}
              basic2Classes={basic2Classes}
              basic2Pupils={basic2Pupils}
              onBasic1ClassesChange={setBasic1Classes}
              onBasic1PupilsChange={setBasic1Pupils}
              onBasic2ClassesChange={setBasic2Classes}
              onBasic2PupilsChange={setBasic2Pupils}
              basic1Avg={basic1Avg}
              basic2Avg={basic2Avg}
              basicFirstBand={basicFirstBand}
              basicSecondBand={basicSecondBand}
              basic1Phmax={basic1Phmax}
              basic2Phmax={basic2Phmax}
              basicPhmax={basicPhmax}
              prepClassPhmax={prepClassPhmax}
              prepSpecialPhmax={prepSpecialPhmax}
              par38Phmax={par38Phmax}
              par41Phmax={par41Phmax}
            />

            <div className="grid two" data-section="zs-phmax-exceptions">
              <ZsPhmaxSec16Section
                viewMode={viewMode}
                showFirst={hasSection("sec16_first")}
                showSecond={hasSection("sec16_second")}
                firstClasses={sec16FirstClasses}
                firstPupils={sec16FirstPupils}
                secondClasses={sec16SecondClasses}
                secondPupils={sec16SecondPupils}
                onFirstClassesChange={setSec16FirstClasses}
                onFirstPupilsChange={setSec16FirstPupils}
                onSecondClassesChange={setSec16SecondClasses}
                onSecondPupilsChange={setSec16SecondPupils}
                firstAvg={incl1Avg}
                secondAvg={incl2Avg}
                firstBand={sec16FirstBand}
                secondBand={sec16SecondBand}
                firstPhmax={incl1Phmax}
                secondPhmax={incl2Phmax}
                totalPhmax={inclPhmax}
              />

              {(hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) && (
                <ZsPhmaxSpecialSection
                  viewMode={viewMode}
                  special1Classes={special1Classes}
                  special1Pupils={special1Pupils}
                  special2Classes={special2Classes}
                  special2Pupils={special2Pupils}
                  specialIIClasses={specialIIClasses}
                  specialIIPupils={specialIIPupils}
                  onSpecial1ClassesChange={setSpecial1Classes}
                  onSpecial1PupilsChange={setSpecial1Pupils}
                  onSpecial2ClassesChange={setSpecial2Classes}
                  onSpecial2PupilsChange={setSpecial2Pupils}
                  onSpecialIIClassesChange={setSpecialIIClasses}
                  onSpecialIIPupilsChange={setSpecialIIPupils}
                  special1Avg={special1Avg}
                  special2Avg={special2Avg}
                  specialIIAvg={specialIIAvg}
                  special1Band={special1Band}
                  special2Band={special2Band}
                  specialIIBand={specialIIBand}
                  special1PhmaxPart={special1PhmaxPart}
                  special2PhmaxPart={special2PhmaxPart}
                  specialIIPhmaxPart={specialIIPhmaxPart}
                  specialPhmax={specialPhmax}
                />
              )}
            </div>

            <div className="grid two">
              {hasSection("psych_groups") && (
                <ZsPhmaxPsychSection
                  viewMode={viewMode}
                  rows={psychComputedRows}
                  onAdd={addPsych}
                  onUpdate={(id, key, value) => updatePsych(id, key as keyof PsychRow, value)}
                  onRemove={removePsych}
                />
              )}

              {hasSection("health_groups") && (
                <ZsPhmaxHealthSection
                  viewMode={viewMode}
                  rows={healthComputedRows}
                  onAdd={addHealth}
                  onUpdate={(id, key, value) => updateHealth(id, key as keyof HealthRow, value)}
                  onRemove={removeHealth}
                />
              )}

              {hasSection("minority_first") && (
                <ZsPhmaxMinoritySection
                  viewMode={viewMode}
                  minorityType={minorityType}
                  onMinorityTypeChange={setMinorityType}
                  showSecondStage={hasSection("minority_second")}
                  minority1Classes={minority1Classes}
                  minority1Pupils={minority1Pupils}
                  minority2Classes={minority2Classes}
                  minority2Pupils={minority2Pupils}
                  onMinority1ClassesChange={setMinority1Classes}
                  onMinority1PupilsChange={setMinority1Pupils}
                  onMinority2ClassesChange={setMinority2Classes}
                  onMinority2PupilsChange={setMinority2Pupils}
                  minority1Avg={minority1Avg}
                  minority2Avg={minority2Avg}
                  minority1Band={minority1Band}
                  minority2Band={minority2Band}
                  minority1Phmax={minority1Phmax}
                  minority2Phmax={minority2Phmax}
                  minorityPhmax={minorityPhmax}
                />
              )}
            </div>

            <div className="grid two">
              {hasSection("gym_groups") && (
                <ZsPhmaxGymSection
                  viewMode={viewMode}
                  rows={gymComputedRows}
                  onAdd={addGym}
                  onUpdate={updateGym}
                  onRemove={removeGym}
                />
              )}

              {(hasSection("dominant_c_first") || hasSection("dominant_b_first")) && (
                <ZsPhmaxMixedSection
                  viewMode={viewMode}
                  validationHighlight={validationHighlight}
                  mixedMethodFirstZsPupils={mixedMethodFirstZsPupils}
                  mixedMethodFirstZsClasses={mixedMethodFirstZsClasses}
                  mixedMethodFirstSpecialPupils={mixedMethodFirstSpecialPupils}
                  mixedMethodFirstSpecialClasses={mixedMethodFirstSpecialClasses}
                  mixedMethodSecondZsPupils={mixedMethodSecondZsPupils}
                  mixedMethodSecondZsClasses={mixedMethodSecondZsClasses}
                  mixedMethodSecondSpecialPupils={mixedMethodSecondSpecialPupils}
                  mixedMethodSecondSpecialClasses={mixedMethodSecondSpecialClasses}
                  mixedMethodFirstZsAvg={mixedMethodFirstZsAvg}
                  mixedMethodSecondZsAvg={mixedMethodSecondZsAvg}
                  mixedMethodFirstSpecialAvg={mixedMethodFirstSpecialAvg}
                  mixedMethodSecondSpecialAvg={mixedMethodSecondSpecialAvg}
                  mixedMethodFirstZsBand={mixedMethodFirstZsBand}
                  mixedMethodSecondZsBand={mixedMethodSecondZsBand}
                  mixedMethodFirstSpecialBand={mixedMethodFirstSpecialBand}
                  mixedMethodSecondSpecialBand={mixedMethodSecondSpecialBand}
                  mixedMethodFirstZsResult={mixedMethodFirstZsResult}
                  mixedMethodSecondZsResult={mixedMethodSecondZsResult}
                  mixedMethodFirstSpecialResult={mixedMethodFirstSpecialResult}
                  mixedMethodSecondSpecialResult={mixedMethodSecondSpecialResult}
                  mixedMethodFirstTotal={mixedMethodFirstTotal}
                  mixedMethodSecondTotal={mixedMethodSecondTotal}
                  mixedMethodTotal={mixedMethodTotal}
                  onMixedMethodFirstZsPupilsChange={setMixedMethodFirstZsPupils}
                  onMixedMethodFirstZsClassesChange={setMixedMethodFirstZsClasses}
                  onMixedMethodFirstSpecialPupilsChange={setMixedMethodFirstSpecialPupils}
                  onMixedMethodFirstSpecialClassesChange={setMixedMethodFirstSpecialClasses}
                  onMixedMethodSecondZsPupilsChange={setMixedMethodSecondZsPupils}
                  onMixedMethodSecondZsClassesChange={setMixedMethodSecondZsClasses}
                  onMixedMethodSecondSpecialPupilsChange={setMixedMethodSecondSpecialPupils}
                  onMixedMethodSecondSpecialClassesChange={setMixedMethodSecondSpecialClasses}
                />
              )}
            </div>

            {(hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) && (
              <ZsPhmaxExtrasSection
                viewMode={viewMode}
                gateTitle={
                  hasSection("prep_class") || hasSection("prep_special")
                    ? "Samostatné položky PHmax"
                    : "§ 38 a § 41 (navýšení PHmax)"
                }
                showPrepClass={hasSection("prep_class")}
                showPrepSpecial={hasSection("prep_special")}
                showPar38={hasSection("par38")}
                showPar41={hasSection("par41")}
                prepClasses={prepClasses}
                prepChildren={prepChildren}
                prepSpecialClasses={prepSpecialClasses}
                prepSpecialChildren={prepSpecialChildren}
                p38First={p38First}
                p38Second={p38Second}
                p41First={p41First}
                p41Second={p41Second}
                onPrepClassesChange={setPrepClasses}
                onPrepChildrenChange={setPrepChildren}
                onPrepSpecialClassesChange={setPrepSpecialClasses}
                onPrepSpecialChildrenChange={setPrepSpecialChildren}
                onP38FirstChange={setP38First}
                onP38SecondChange={setP38Second}
                onP41FirstChange={setP41First}
                onP41SecondChange={setP41Second}
                prepAvg={prepAvg}
                prepPh={prepPh}
                prepSpecialAvg={prepSpecialAvg}
                prepSpecialPh={prepSpecialPh}
                prepClassPhmax={prepClassPhmax}
                prepSpecialPhmax={prepSpecialPhmax}
                par38Phmax={par38Phmax}
                par41Phmax={par41Phmax}
              />
            )}

            <div className="toolbar">
              <button className="btn ghost" onClick={resetPhmax}>Vymazat údaje PHmax</button>
            </div>

            <section className="card muted card--summary section-card section-card--summary-phmax" data-section="phmax-summary" data-wizard-step="4" data-phmax-pane="summary">
              <h2 className="section-title">Souhrn výsledků PHmax</h2>
              <div className="grid four">
                <ResultCard label="Běžné třídy" value={basicPhmax} />
                <ResultCard
                  methodStepLabel="§ 16 odst. 9"
                  label={<ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" />}
                  value={inclPhmax}
                />
                <ResultCard label="Škola při psychiatrické nemocnici" value={psychPhmax} />
                <ResultCard label="ZŠ při zdrav. zař. (B11–B13)" value={healthPhmax} />
                <ResultCard label="Jazyk menšiny" value={minorityPhmax} />
                <ResultCard label="Víceletá gymnázia" value={gymPhmax} />
                <ResultCard label="Smíšené třídy" value={mixedForTotal} />
                <ResultCard label="ZŠ speciální" value={specialPhmax} />
                {(() => {
                  const extraDetailRows: { key: string; label: string; value: number }[] = [];
                  if (prepClassPhmax > 0) {
                    extraDetailRows.push({ key: "prep", label: "Samostatné – přípravná třída", value: prepClassPhmax });
                  }
                  if (prepSpecialPhmax > 0) {
                    extraDetailRows.push({
                      key: "prepSp",
                      label: "Samostatné – přípravný stupeň ZŠS",
                      value: prepSpecialPhmax,
                    });
                  }
                  if (par38Phmax > 0) {
                    extraDetailRows.push({ key: "p38", label: "Samostatné – § 38", value: par38Phmax });
                  }
                  if (par41Phmax > 0) {
                    extraDetailRows.push({ key: "p41", label: "Samostatné – § 41", value: par41Phmax });
                  }
                  if (extraDetailRows.length === 0) {
                    return <ResultCard label="Samostatné položky" value={extrasPhmax} />;
                  }
                  return (
                    <>
                      {extraDetailRows.map((r) =>
                        r.key === "p38" ? (
                          <ResultCard
                            key={r.key}
                            methodStepLabel={r.label}
                            label={
                              <>
                                Samostatné – <ZsLegisRef citeId="zs-par38" label="§ 38" />
                              </>
                            }
                            value={r.value}
                          />
                        ) : r.key === "p41" ? (
                          <ResultCard
                            key={r.key}
                            methodStepLabel={r.label}
                            label={
                              <>
                                Samostatné – <ZsLegisRef citeId="zs-par41" label="§ 41" />
                              </>
                            }
                            value={r.value}
                          />
                        ) : (
                          <ResultCard key={r.key} label={r.label} value={r.value} />
                        ),
                      )}
                      {extraDetailRows.length > 1 ? (
                        <ResultCard label="Samostatné položky celkem" value={extrasPhmax} />
                      ) : null}
                    </>
                  );
                })()}
                <ResultCard label="Výsledek PHmax" tone="success" value={totalPhmax} />
              </div>
            </section>

            <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 18 }}>
              <summary className="section-title" style={{ fontSize: "1.02rem", cursor: "pointer" }}>
                Rozpad / ověřovací tabulka PHmax
              </summary>
              <p className="muted-text" style={{ marginTop: 10, marginBottom: 12, fontSize: "0.86rem", lineHeight: 1.5 }}>
                Dílčí částky odpovídají kartám v souhrnu výše; součet řádků (včetně nul) má dát stejný výsledek jako
                „Výsledek PHmax“. Užitečné pro kontrolu výkazu a metodiky.
              </p>
              <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
                <table className="sd-phmax-breakdown">
                  <thead>
                    <tr>
                      <th scope="col">Položka</th>
                      <th scope="col" className="sd-phmax-breakdown__head-num">
                        Hodnota (h/týd.)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        Běžné třídy
                      </th>
                      <td className="sd-phmax-breakdown__num">{basicPhmax}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        <ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" />
                      </th>
                      <td className="sd-phmax-breakdown__num">{inclPhmax}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        Škola při psychiatrické nemocnici
                      </th>
                      <td className="sd-phmax-breakdown__num">{psychPhmax}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        ZŠ při zdrav. zař. (B11–B13)
                      </th>
                      <td className="sd-phmax-breakdown__num">{healthPhmax}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        Jazyk menšiny
                      </th>
                      <td className="sd-phmax-breakdown__num">{minorityPhmax}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        Víceletá gymnázia
                      </th>
                      <td className="sd-phmax-breakdown__num">{gymPhmax}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        Smíšené třídy
                      </th>
                      <td className="sd-phmax-breakdown__num">{mixedForTotal}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        ZŠ speciální
                      </th>
                      <td className="sd-phmax-breakdown__num">{specialPhmax}</td>
                    </tr>
                    {prepClassPhmax > 0 ? (
                      <tr>
                        <th scope="row" className="sd-phmax-breakdown__label">
                          Samostatné – přípravná třída
                        </th>
                        <td className="sd-phmax-breakdown__num">{prepClassPhmax}</td>
                      </tr>
                    ) : null}
                    {prepSpecialPhmax > 0 ? (
                      <tr>
                        <th scope="row" className="sd-phmax-breakdown__label">
                          Samostatné – přípravný stupeň ZŠS
                        </th>
                        <td className="sd-phmax-breakdown__num">{prepSpecialPhmax}</td>
                      </tr>
                    ) : null}
                    {par38Phmax > 0 ? (
                      <tr>
                        <th scope="row" className="sd-phmax-breakdown__label">
                          Samostatné – <ZsLegisRef citeId="zs-par38" label="§ 38" />
                        </th>
                        <td className="sd-phmax-breakdown__num">{par38Phmax}</td>
                      </tr>
                    ) : null}
                    {par41Phmax > 0 ? (
                      <tr>
                        <th scope="row" className="sd-phmax-breakdown__label">
                          Samostatné – <ZsLegisRef citeId="zs-par41" label="§ 41" />
                        </th>
                        <td className="sd-phmax-breakdown__num">{par41Phmax}</td>
                      </tr>
                    ) : null}
                  </tbody>
                  <tfoot>
                    <tr className="sd-phmax-breakdown__total">
                      <th scope="row">Výsledek PHmax (součet modulu)</th>
                      <td className="sd-phmax-breakdown__num">{totalPhmax}</td>
                    </tr>
                  </tfoot>
                </table>
              </ScrollGrabRegion>
            </details>

            {viewMode === "expert" ? <PhmaxZsMethodologyReferenceTables highlights={zsMethodologyHighlights} /> : null}
          </div>
        )}

        {tab === "pha" && (
          <ZsPhaTabPanel
            viewMode={viewMode}
            hasPhaIssue={hasIssue("pha")}
            phaComputedRows={phaComputedRows}
            totalPha={totalPha}
            onAdd={addPha}
            onReset={resetPha}
            onUpdate={updatePha}
            onRemove={removePha}
          />
        )}

        {tab === "php" && (
          <ZsPhpTabPanel
            viewMode={viewMode}
            hasPhpIssue={hasIssue("php")}
            phpWizardStep={phpWizardStep}
            phpMethodMode={phpMethodMode}
            phpYear1={phpYear1}
            phpYear2={phpYear2}
            phpYear3={phpYear3}
            phpExcludedAbroad={phpExcludedAbroad}
            phpExcludedForeignSchoolCz={phpExcludedForeignSchoolCz}
            phpExcludedIndividual={phpExcludedIndividual}
            phpExcludedSchool={phpExcludedSchool}
            phpBaseValue={phpBaseValue}
            phpExcludedTotal={phpExcludedTotal}
            phpAdjustedValue={phpAdjustedValue}
            phpBand={phpBand}
            totalPhp={totalPhp}
            onWizardStepChange={setPhpWizardStep}
            onMethodModeChange={setPhpMethodMode}
            onYear1Change={setPhpYear1}
            onYear2Change={setPhpYear2}
            onYear3Change={setPhpYear3}
            onExcludedAbroadChange={setPhpExcludedAbroad}
            onExcludedForeignSchoolCzChange={setPhpExcludedForeignSchoolCz}
            onExcludedIndividualChange={setPhpExcludedIndividual}
            onExcludedSchoolChange={setPhpExcludedSchool}
            onReset={resetPhp}
          />
        )}

        <section className="card muted card--summary section-card section-card--overview" data-section="overview" data-wizard-step="5" data-phmax-pane="summary">
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

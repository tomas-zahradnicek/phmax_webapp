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
import { InputOutputLegend, NumberField, ResultCard } from "./phmax-zs-ui";
import { IntegerInput } from "./IntegerInput";
import { FieldHintButton } from "./FieldHintButton";
import { HeroExampleSelect } from "./HeroExampleSelect";
import { ZS_HERO_EXAMPLE_GROUPS, type ZsHeroExampleKey } from "./zs-hero-example-groups";
import type { CalculatorMode, FormSection } from "./config/calculator-config";
import { MODE_CONFIG, formatModeRežimStatValue } from "./config/calculator-config";
import { getVisibleSections } from "./config/field-visibility";
import { DEFAULT_MODE } from "./config/default-form-state";
import { GlossaryDialog } from "./GlossaryDialog";
import { GlossaryIconButton } from "./GlossaryIconButton";
import { exportCsvLocalized, downloadTextFile } from "./export-utils";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductLegisContextPanel, ZsLegisRef } from "./PhmaxProductLegisUi";
import { ZS_LEGIS_PARAGRAPH_TOOLTIPS } from "./phmax-zs-legislativa";
import { QuickOnboarding, QuickOnboardingHeroButton } from "./QuickOnboarding";
import { useQuickOnboarding } from "./useQuickOnboarding";
import { useUiNotice } from "./useUiNotice";
import { useFocusExampleOnMount } from "./useFocusExampleOnMount";
import { sectionNeedsAttentionClass } from "./calculator-section-focus";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { HeroStat } from "./HeroStat";
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
import { TableOuter } from "./TableOuter";
import { MixedStageTable } from "./MixedStageTable";
import { HeroStatusBar } from "./HeroStatusBar";
import { CalculatorWorkflowDock } from "./CalculatorWorkflowDock";
import { CalculatorStickyContextBar } from "./CalculatorStickyContextBar";
import { CalculatorFocusToggle } from "./CalculatorFocusToggle";
import { useCalculatorFocusMode } from "./useCalculatorFocusMode";
import { CollapsibleSection } from "./CollapsibleSection";
import { PageTableOfContents, type PageTocSection } from "./PageTableOfContents";
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
import { buildZsExtendedExportMetaRows, ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER } from "./zs/zs-export-rows";
import { ZsPhaTabPanel } from "./zs/ZsPhaTabPanel";
import { ZsPhpTabPanel } from "./zs/ZsPhpTabPanel";
import { ZsPhmaxBasicSection } from "./zs/ZsPhmaxBasicSection";
import { ZsPhmaxSec16Section } from "./zs/ZsPhmaxSec16Section";
import { ZsPhmaxSpecialSection } from "./zs/ZsPhmaxSpecialSection";
import { ZsPhmaxPsychSection } from "./zs/ZsPhmaxPsychSection";
import { ZsPhmaxHealthSection } from "./zs/ZsPhmaxHealthSection";
import { CalculatorProductShell } from "./CalculatorProductShell";
import { HeroCompactToolbar, HeroToolbarSaveButton } from "./HeroCompactToolbar";
import { HeroExpertStrip } from "./HeroExpertStrip";
import { DisplayDensityToggle } from "./DisplayDensityToggle";
import { useDisplayDensity } from "./useDisplayDensity";
import { calculatorShellClassName } from "./calculator-view-mode";
import { ZsModuleGate } from "./ZsModuleGate";
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
  ADVANCED_AUDIT_GROUP_LABEL,
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  APP_AUTHOR_EXPORT_ROWS,
  BROWSER_ERROR_NEXT_STEP_HINT,
  CALCULATOR_LIMITS_NOTE,
  INLINE_VALIDATION_MSG_POSITIVE_INTEGER,
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
  TABLE_SCROLL_HINT,
  namedBackupsMicrocopy,
} from "./calculator-ui-constants";
import { APP_VERSION } from "./app-version";
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

function getInitialPreferredMode(): CalculatorMode {
  const preferred = Object.values(MODE_CONFIG).find(
    (item) =>
      item.group === "phmax" &&
      item.label.toLowerCase().includes("úplná zš") &&
      !item.label.includes("§ 16")
  );

  return (preferred?.id ?? DEFAULT_MODE) as CalculatorMode;
}

function getInitialPhaMode(): CalculatorMode {
  const preferred = Object.values(MODE_CONFIG).find((item) => item.group === "phamax");
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
  return <FieldHintButton text={text} />;
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

function buildShareText(data: {
  modeLabel: string;
  tab: string;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  warnings: string[];
  inputMode: DataMode;
  exportLabel?: string;
}) {
  const rows = [
    "Shrnutí kalkulačky ZŠ",
    "",
    ...(data.exportLabel?.trim()
      ? [`Označení / škola: ${data.exportLabel.trim()}`, ""]
      : []),
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
  rows.push("", APP_AUTHOR_CREDIT_LINE);
  return rows.join("\n");
}

export type PhmaxZsPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export function PhmaxZsPage({ productView, setProductView }: PhmaxZsPageProps) {
  const [tab, setTab] = useState<TabKey>("phmax");
  const [mode, setMode] = useState<CalculatorMode>(getInitialPreferredMode());
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
    mode,
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
  ]);

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

  const addHealth = () => setHealthRows((prev) => [...prev, createEmptyHealthRow(Date.now())]);
  const updateHealth = (id: number, key: keyof HealthRow, value: string | number) =>
    setHealthRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const removeHealth = (id: number) => setHealthRows((prev) => prev.filter((r) => r.id !== id));

  const addGym = () => setGymRows((prev) => [...prev, createEmptyGymRow(Date.now())]);
  const updateGym = (id: number, key: keyof GymRow, value: string | number) => setGymRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const removeGym = (id: number) => setGymRows((prev) => prev.filter((r) => r.id !== id));


  const applyResetPhmax = () => {
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
    setHealthRows([]);
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

  const resetPhmax = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_PHMAX)) return;
    applyResetPhmax();
  };

  const applyResetPha = () => {
    setPhaRows([]);
  };

  const resetPha = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_PHA)) return;
    applyResetPha();
  };

  const applyResetPhp = () => {
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

  const resetPhp = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_PHP)) return;
    applyResetPhp();
  };

  const resetNv75 = () => {
    setNv75Role("ucitel");
    setNv75School("plavecka_skola");
    setNv75TeacherMin(22);
    setNv75TeacherMax(30);
  };

  const resetAll = () => {
    if (!confirmDestructive(MSG_CONFIRM_ZS_RESET_ALL)) return;
    applyResetPhmax();
    applyResetPha();
    applyResetPhp();
    resetNv75();
    setSelectedExample("");
    setWizardChoice("");
    setDataMode("own");
    setExportLabel("");
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
    if (!example) {
      setSelectedExample("");
      setDataMode("own");
      return;
    }

    applyResetPhmax();
    applyResetPha();
    applyResetPhp();
    resetNv75();
    setWizardChoice("");
    setDataMode("example");
    setSelectedExample(example);
    setTab("phmax");

    if (example === "priloha_uplna_zs_sec16") {
      setMode(
        findModeBySections("basic_first", "basic_second", "sec16_first", "sec16_second")
      );
      setBasicType("full_more_than_2");
      setBasic1Classes(10);
      setBasic1Pupils(250);
      setBasic2Classes(8);
      setBasic2Pupils(225);
      setIncl1Classes(5);
      setIncl1Pupils(40);
      setIncl2Classes(4);
      setIncl2Pupils(32);
      return;
    }

    if (example === "priloha_zs_1st_sec16") {
      setMode(findModeBySections("school_variant_first_stage_only", "sec16_first"));
      setBasicType("first_only_3");
      setBasic1Classes(3);
      setBasic1Pupils(30);
      setIncl1Classes(1);
      setIncl1Pupils(6);
      return;
    }

    if (example === "phmax_bezna_zs") {
      setMode(getInitialPreferredMode());
      setBasicType("full_more_than_2");
      setBasic1Classes(10);
      setBasic1Pupils(250);
      setBasic2Classes(8);
      setBasic2Pupils(225);
      return;
    }

    if (example === "priloha_phamax_uplna_zs_sec16_zss") {
      setMode(getInitialPhaMode());
      setTab("pha");
      setPhaRows([
        { id: 1, kind: "zs1", classes: 2, pupils: 15 },
        { id: 2, kind: "zs1Heavy", classes: 1, pupils: 7 },
        { id: 3, kind: "zs2", classes: 3, pupils: 21 },
        { id: 4, kind: "zss1Heavy", classes: 1, pupils: 6 },
        { id: 5, kind: "zss2Heavy", classes: 2, pupils: 11 },
        { id: 6, kind: "zssII", classes: 1, pupils: 6 },
      ]);
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
      setPsychRows([
        { id: 1, kind: "psych1", mode: "higher_of_two", currentPupils: 7, currentClasses: 1, prevPupils: 6, prevClasses: 1 },
      ]);
      return;
    }

    if (example === "zdravotnicke_zs") {
      setMode(findModeBySections("health_groups"));
      setHealthRows([
        { id: 1, kind: "health1", mode: "higher_of_two", currentPupils: 8, currentClasses: 1, prevPupils: 7, prevClasses: 1 },
      ]);
      return;
    }

    if (example === "smisene_tridy") {
      setMode(findModeBySections("dominant_c_first"));
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

    if (choice === "ph_health") {
      loadExample("zdravotnicke_zs");
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
    const text = buildShareText({
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
      buildShareText({
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
  const [activeScrollSection, setActiveScrollSection] = useState("");
  const tabChangeSkipRef = useRef(true);

  const goToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (!element || !(element instanceof HTMLElement)) return;
    const dock = workspaceStickyRef.current;
    const offset = dock?.offsetHeight ?? 100;
    const top = element.getBoundingClientRect().top + window.scrollY - offset - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  const phmaxJumpSections = useMemo(() => {
    const items: { id: string; label: React.ReactNode }[] = [
      { id: "guide", label: "Rozcestník" },
      { id: "setup", label: "Režim" },
    ];
    if (hasSection("basic_first") || hasSection("basic_second") || hasSection("school_variant_first_stage_only")) {
      items.push({ id: "basic", label: "Běžné třídy" });
    }
    if (hasSection("sec16_first") || hasSection("sec16_second")) {
      items.push({ id: "sec16", label: <ZsLegisRef citeId="zs-16-9" label="§ 16/9" /> });
    }
    if (hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) {
      items.push({ id: "special", label: "ZŠ speciální" });
    }
    if (hasSection("psych_groups")) items.push({ id: "psych", label: "Psychiatrie" });
    if (hasSection("health_groups")) items.push({ id: "health", label: "Zdravotnické zařízení" });
    if (hasSection("minority_first")) items.push({ id: "minority", label: "Menšina" });
    if (hasSection("gym_groups")) items.push({ id: "gym", label: "Gymnázia" });
    if (hasSection("dominant_c_first") || hasSection("dominant_b_first")) items.push({ id: "mixed", label: "Smíšené" });
    if (hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) {
      items.push({ id: "extras", label: "Samostatné" });
    }
    items.push({ id: "phmax-summary", label: "Souhrn PHmax" });
    return items;
  }, [mode, visibleSections]);

  const jumpSections = useMemo(() => {
    if (tab === "pha") return [{ id: "pha", label: "PHAmax" }];
    if (tab === "php") return [{ id: "php", label: "PHPmax" }];
    return phmaxJumpSections;
  }, [tab, phmaxJumpSections]);

  useEffect(() => {
    const updateActiveFromScroll = () => {
      const dock = workspaceStickyRef.current;
      const anchorY = (dock?.getBoundingClientRect().bottom ?? 100) + 6;
      const candidates = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
      let best = "";
      let bestScore = Infinity;
      for (const el of candidates) {
        const id = el.dataset.section;
        if (!id) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom < anchorY + 20) continue;
        const score = Math.abs(r.top - anchorY);
        if (score < bestScore) {
          bestScore = score;
          best = id;
        }
      }
      if (best) setActiveScrollSection((prev) => (prev === best ? prev : best));
    };

    updateActiveFromScroll();
    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll);
    return () => {
      window.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, [tab, mode, visibleSections]);

  useEffect(() => {
    const onFocusIn = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const sec = t.closest("[data-section]");
      if (sec instanceof HTMLElement && sec.dataset.section) {
        setActiveScrollSection(sec.dataset.section);
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
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
    [validationIssues, warnings],
  );
  const showZsInputBanner = zsInputBannerItems.length > 0;

  const summaryRows: readonly (readonly [string, string | number])[] = [
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
  ];

  const buildXlsxContextRows = (): [string, string | number][] => {
    const tabLabel = tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax";
    return [
      ["Verze aplikace", APP_VERSION],
      ["Název exportu", "Kalkulačka ZŠ – souhrn (XLSX)"],
      ["Datum a čas exportu (ISO)", new Date().toISOString()],
      ["Datum a čas exportu (místní)", new Date().toLocaleString("cs-CZ")],
      ["Metodický podklad (orientačně)", METHODIKA_VERSION_LABEL],
      ["Režim výpočtu (typ školy)", MODE_CONFIG[mode].label],
      ["Aktivní záložka při exportu", tabLabel],
      ["Označení exportu / škola", exportLabel.trim() || "–"],
      ["Průvodce (volba scénáře)", wizardChoice || "–"],
      ["Práce s údaji", dataMode === "example" ? "ukázkový příklad" : "vlastní škola"],
      ["Identifikátor ukázkového příkladu", selectedExample || "–"],
      ["", ""],
      ["Varování", warnings.length ? warnings.join(" | ") : "–"],
      ["", ""],
      [
        "Poznámka",
        "Úplný dvousloupcový výpis (vstupy, výstupy, detaily PHAmax / psych / gym / smíšené) je na listu „Hodnoty“.",
      ],
      ["Vytvořil:", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
    ];
  };

  const buildExtendedCsvRows = (): readonly (readonly [string, string | number])[] => {
    const tabLabel = tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax";
    const exportNow = new Date();
    const head: [string, string | number][] = [
      ...buildZsExtendedExportMetaRows({
        appVersion: APP_VERSION,
        methodikaLabel: METHODIKA_VERSION_LABEL,
        modeLabel: MODE_CONFIG[mode].label,
        tabLabel,
        exportLabel,
        wizardChoice,
        dataMode,
        selectedExample,
        exportIso: exportNow.toISOString(),
        exportLocal: exportNow.toLocaleString("cs-CZ"),
      }),
      ["=== PHmax – vstupy (agregované) ===", ""],
      ["basicType (kód)", basicType],
      ["Běžné třídy – 1. st. počet tříd", basic1Classes],
      ["Běžné třídy – 1. st. počet žáků", basic1Pupils],
      ["Běžné třídy – 2. st. počet tříd", basic2Classes],
      ["Běžné třídy – 2. st. počet žáků", basic2Pupils],
      ["§ 16/9 – 1. st. třídy", incl1Classes],
      ["§ 16/9 – 1. st. žáci", incl1Pupils],
      ["§ 16/9 – 2. st. třídy", incl2Classes],
      ["§ 16/9 – 2. st. žáci", incl2Pupils],
      ["Psychiatrická škola – počet řádků", psychRows.length],
      ["ZŠ při zdrav. zař. (B11–B13) – počet řádků", healthRows.length],
      ["Menšina – variant (kód)", minorityType],
      ["Menšina – 1. st. třídy / žáci", `${minority1Classes} / ${minority1Pupils}`],
      ["Menšina – 2. st. třídy / žáci", `${minority2Classes} / ${minority2Pupils}`],
      ["Gymnázia – počet řádků", gymRows.length],
      ["Smíšené (zjednodušený seznam řádků) – počet", mixedRows.length],
      ["Smíšené tab. – 1. st. C/01 žáci / třídy", `${mixedMethodFirstZsPupils} / ${mixedMethodFirstZsClasses}`],
      ["Smíšené tab. – 1. st. B/01 žáci / třídy", `${mixedMethodFirstSpecialPupils} / ${mixedMethodFirstSpecialClasses}`],
      ["Smíšené tab. – 2. st. C/01 žáci / třídy", `${mixedMethodSecondZsPupils} / ${mixedMethodSecondZsClasses}`],
      ["Smíšené tab. – 2. st. B/01 žáci / třídy", `${mixedMethodSecondSpecialPupils} / ${mixedMethodSecondSpecialClasses}`],
      ["ZŠ speciální I. díl – 1. st. třídy / žáci", `${special1Classes} / ${special1Pupils}`],
      ["ZŠ speciální I. díl – 2. st. třídy / žáci", `${special2Classes} / ${special2Pupils}`],
      ["ZŠ speciální II. díl třídy / žáci", `${specialIIClasses} / ${specialIIPupils}`],
      ["Přípravná třída třídy / děti", `${prepClasses} / ${prepChildren}`],
      ["Přípravný stupeň ZŠS třídy / děti", `${prepSpecialClasses} / ${prepSpecialChildren}`],
      ["§ 38 žáci 1. st. / 2. st.", `${p38First} / ${p38Second}`],
      ["§ 41 žáci 1. st. / 2. st.", `${p41First} / ${p41Second}`],
      ["", ""],
      ["=== PHPmax – vstupy ===", ""],
      ["PHP metoda", phpMethodMode === "three_year_avg" ? "tříletý průměr" : "kratší období"],
      ["PHP rok 1 / 2 / 3 žáci", `${phpYear1} / ${phpYear2} / ${phpYear3}`],
      ["PHP nezapoč. zahraničí / ZŠ v ČR / individuální", `${phpExcludedAbroad} / ${phpExcludedForeignSchoolCz} / ${phpExcludedIndividual}`],
      ["PHP škola vyloučena z výpočtu", phpExcludedSchool ? "ano" : "ne"],
      ["", ""],
      ["=== Varování ===", warnings.length ? warnings.join(" | ") : "–"],
      ["", ""],
      ["=== Souhrnné výstupy ===", ""],
    ];
    const out: [string, string | number][] = [...head, ...summaryRows.map((r) => [r[0], r[1]] as [string, string | number])];
    if (phaRows.length > 0) {
      out.push(["", ""]);
      out.push(["=== PHAmax – jednotlivé řádky ===", ""]);
      phaRows.forEach((r, i) => {
        out.push([`PHA ${i + 1} – typ (kód)`, r.kind]);
        out.push([`PHA ${i + 1} – třídy`, r.classes]);
        out.push([`PHA ${i + 1} – žáci`, r.pupils]);
      });
    }
    if (psychRows.length > 0) {
      out.push(["", ""]);
      out.push(["=== Psychiatrická škola – jednotlivé řádky ===", ""]);
      psychComputedRows.forEach((r, i) => {
        out.push([`Psych ${i + 1} – typ (kód)`, r.kind]);
        out.push([`Psych ${i + 1} – režim průměru`, r.mode === "current_only" ? "jen aktuální" : "vyšší ze dvou"]);
        out.push([`Psych ${i + 1} – aktuální žáci / třídy`, `${r.currentPupils} / ${r.currentClasses}`]);
        out.push([`Psych ${i + 1} – předchozí žáci / třídy`, `${r.prevPupils} / ${r.prevClasses}`]);
        out.push([`Psych ${i + 1} – použitý průměr žáků/třídu`, r.usedAvg]);
        out.push([`Psych ${i + 1} – pásmo / PHmax na 1 třídu`, `${r.bandLabel} / ${r.perClass}`]);
        out.push([`Psych ${i + 1} – řádkový výsledek PHmax`, r.subtotal]);
      });
    }
    if (healthRows.length > 0) {
      out.push(["", ""]);
      out.push(["=== ZŠ při zdravotnickém zařízení (B11–B13) – řádky ===", ""]);
      healthComputedRows.forEach((r, i) => {
        out.push([`ZdrZař ${i + 1} – typ (kód)`, r.kind]);
        out.push([`ZdrZař ${i + 1} – režim průměru`, r.mode === "current_only" ? "jen aktuální" : "vyšší ze dvou"]);
        out.push([`ZdrZař ${i + 1} – aktuální žáci / třídy`, `${r.currentPupils} / ${r.currentClasses}`]);
        out.push([`ZdrZař ${i + 1} – předchozí žáci / třídy`, `${r.prevPupils} / ${r.prevClasses}`]);
        out.push([`ZdrZař ${i + 1} – použitý průměr žáků/třídu`, r.usedAvg]);
        out.push([`ZdrZař ${i + 1} – pásmo / PHmax na 1 třídu`, `${r.bandLabel} / ${r.perClass}`]);
        out.push([`ZdrZař ${i + 1} – řádkový výsledek PHmax`, r.subtotal]);
      });
    }
    if (gymRows.length > 0) {
      out.push(["", ""]);
      out.push(["=== Nižší ročníky gymnázií – jednotlivé řádky ===", ""]);
      gymComputedRows.forEach((r, i) => {
        out.push([`Gym ${i + 1} – typ (kód)`, r.kind]);
        out.push([`Gym ${i + 1} – třídy / žáci`, `${r.classes} / ${r.pupils}`]);
        out.push([`Gym ${i + 1} – průměr žáků/třídu`, r.avg]);
        out.push([`Gym ${i + 1} – pásmo / PHmax na 1 třídu`, `${r.bandLabel} / ${r.perClass}`]);
        out.push([`Gym ${i + 1} – řádkový výsledek PHmax`, r.subtotal]);
      });
    }
    if (mixedRows.length > 0) {
      out.push(["", ""]);
      out.push(["=== Smíšené třídy (zjednodušený seznam řádků) ===", ""]);
      mixedRows.forEach((row, i) => {
        const avg = row.classes > 0 ? row.pupils / row.classes : 0;
        const band =
          row.majority === "zs"
            ? pickBand(avg, row.stage === "first" ? B9_B10.first : B9_B10.second)
            : pickBand(avg, row.stage === "first" ? B26_B28.special1 : B26_B28.special2);
        const linePhmax = round2(row.classes * band.value);
        out.push([`Smíšené ${i + 1} – stupeň (kód)`, row.stage]);
        out.push([`Smíšené ${i + 1} – převažující obor (kód)`, row.majority]);
        out.push([`Smíšené ${i + 1} – třídy / žáci`, `${row.classes} / ${row.pupils}`]);
        out.push([`Smíšené ${i + 1} – průměr žáků/třídu`, round2(avg)]);
        out.push([`Smíšené ${i + 1} – pásmo / PHmax na 1 třídu`, `${band.label} / ${band.value}`]);
        out.push([`Smíšené ${i + 1} – řádkový výsledek PHmax`, linePhmax]);
      });
    }
    for (const row of APP_AUTHOR_EXPORT_ROWS) {
      out.push([row[0], row[1]]);
    }
    return out;
  };

  const handleExportCsv = () => {
    downloadTextFile("kalkulacka-zs-souhrn.csv", exportCsvLocalized(buildExtendedCsvRows()), "text/csv;charset=utf-8");
    setUiNotice("Rozšířený souhrn byl exportován do CSV (vstupy, výstupy, PHAmax a podrobné řádky dle potřeby).");
  };

  const handleExportXlsx = async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await downloadCalculatorXlsx({
        contextRows: buildXlsxContextRows(),
        valueRows: buildExtendedCsvRows(),
        filename: `kalkulacka-zs-souhrn-${stamp}.xlsx`,
      });
      setUiNotice("Byl stažen soubor Excel (XLSX): list „Kontext“ a list „Hodnoty“.");
    } catch (error) {
      console.error(error);
      setUiNotice(`Export do Excelu se nepodařil. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    } finally {
      setXlsxExportBusy(false);
    }
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

  const scrollToWorkspaceDock = () => {
    workspaceStickyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
  }, [mode, visibleSections]);

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
                <ZsModuleGate sectionId="minority" title="ZŠ s jazykem národnostní menšiny" viewMode={viewMode}>
                <section className="card section-card section-card--module section-card--module-minority" data-section="minority" data-wizard-step="3" data-phmax-pane="exceptions">
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
                    {minorityType === "minorityFull1" && hasSection("minority_second") ? <ResultCard label="PHmax – jazyk menšiny 2. stupeň" value={minority2Phmax} tone="success" /> : <ResultCard label="PHmax – jazyk menšiny 2. stupeň" value="–" tone="primary" />}
                    <ResultCard label="PHmax – jazyk menšiny celkem" value={minorityPhmax} tone="success" />
                  </div>
                </section>
                </ZsModuleGate>
              )}
            </div>

            <div className="grid two">
              {hasSection("gym_groups") && (
                <ZsModuleGate sectionId="gym" title="Nižší ročníky víceletých gymnázií" viewMode={viewMode}>
                <section className="card section-card section-card--module section-card--module-gym" data-section="gym" data-wizard-step="3" data-phmax-pane="exceptions">
                  <h2>Nižší ročníky víceletých gymnázií</h2>
                  <p className="muted-text gym-module__lead">
                    Každý řádek je jeden typ nižšího ročníku gymnázia. Zadejte třídy a žáci; průměr, pásmo a PHmax se dopočítají. Tabulka používá celou šířku karty – na velmi úzkém displeji se může zobrazit posuvník.
                  </p>
                  <ScrollGrabRegion className="gym-table-scroll">
                    <p className="table-outer__hint table-outer__hint--inset">{TABLE_SCROLL_HINT}</p>
                    <table className="table table--gym">
                      <thead>
                        <tr>
                          <th scope="col">Typ gymnázia</th>
                          <th scope="col">Třídy</th>
                          <th scope="col">Žáci</th>
                          <th scope="col">Průměr</th>
                          <th scope="col">Pásmo</th>
                          <th scope="col">PHmax / třída</th>
                          <th scope="col">Mezisoučet</th>
                          <th scope="col"><span className="gym-table__sr-head">Smazat</span></th>
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
                          <td><IntegerInput value={row.classes} onChange={(v) => updateGym(row.id, "classes", v)} /></td>
                          <td><IntegerInput value={row.pupils} onChange={(v) => updateGym(row.id, "pupils", v)} /></td>
                          <td>{row.avg}</td>
                          <td>{row.bandLabel}</td>
                          <td>{row.perClass}</td>
                          <td>{row.subtotal}</td>
                          <td><button className="icon-btn" onClick={() => removeGym(row.id)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </ScrollGrabRegion>
                  <button type="button" className="btn ghost gym-module__add" onClick={addGym}>Přidat třídu / řádek</button>
                </section>
                </ZsModuleGate>
              )}

              {(hasSection("dominant_c_first") || hasSection("dominant_b_first")) && (
                <ZsModuleGate sectionId="mixed" title="Smíšené třídy a ZŠ speciální" viewMode={viewMode}>
                <section className="card section-card section-card--module section-card--module-mixed mixed-module" data-section="mixed" data-wizard-step="3" data-phmax-pane="exceptions">
                  <h2>
                    Smíšené třídy <ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" /> a ZŠ speciální{" "}
                    <HelpHint text="Podle metodiky se tyto třídy posuzují samostatně podle převažujícího oboru vzdělání. Pokud ve třídě převažuje obor 79-01-C/01, použijí se řádky B9 až B10. Pokud převažuje 79-01-B/01 nebo je počet žáků shodný, použijí se řádky B26 až B28." />
                  </h2>
                  <p className="muted-text mixed-module__lead">
                    Přehled v tabulkách: každý řádek je jeden obor (C/01 běžná ZŠ, B/01 ZŠ speciální). Sloupce vedou od vstupů přes průměr a pásmo až po dílčí PHmax; dole je součet za stupeň.
                  </p>

                  <div className="mixed-module__tables">
                    <MixedStageTable
                      stageTitle="1. stupeň"
                      methodNote="Metodika: řádky B9 (obor 79-01-C/01) a B26 (obor 79-01-B/01), 1. stupeň."
                      zsPupils={mixedMethodFirstZsPupils}
                      zsClasses={mixedMethodFirstZsClasses}
                      zsAvg={mixedMethodFirstZsAvg}
                      zsBand={mixedMethodFirstZsBand}
                      zsResult={mixedMethodFirstZsResult}
                      specPupils={mixedMethodFirstSpecialPupils}
                      specClasses={mixedMethodFirstSpecialClasses}
                      specAvg={mixedMethodFirstSpecialAvg}
                      specBand={mixedMethodFirstSpecialBand}
                      specResult={mixedMethodFirstSpecialResult}
                      stageTotal={mixedMethodFirstTotal}
                      setZsPupils={setMixedMethodFirstZsPupils}
                      setZsClasses={setMixedMethodFirstZsClasses}
                      setSpecPupils={setMixedMethodFirstSpecialPupils}
                      setSpecClasses={setMixedMethodFirstSpecialClasses}
                      emphasizeEmpty={validationHighlight}
                    />
                    <MixedStageTable
                      stageTitle="2. stupeň"
                      methodNote="Metodika: řádky B10 (obor 79-01-C/01) a B27 (obor 79-01-B/01), 2. stupeň."
                      zsPupils={mixedMethodSecondZsPupils}
                      zsClasses={mixedMethodSecondZsClasses}
                      zsAvg={mixedMethodSecondZsAvg}
                      zsBand={mixedMethodSecondZsBand}
                      zsResult={mixedMethodSecondZsResult}
                      specPupils={mixedMethodSecondSpecialPupils}
                      specClasses={mixedMethodSecondSpecialClasses}
                      specAvg={mixedMethodSecondSpecialAvg}
                      specBand={mixedMethodSecondSpecialBand}
                      specResult={mixedMethodSecondSpecialResult}
                      stageTotal={mixedMethodSecondTotal}
                      setZsPupils={setMixedMethodSecondZsPupils}
                      setZsClasses={setMixedMethodSecondZsClasses}
                      setSpecPupils={setMixedMethodSecondSpecialPupils}
                      setSpecClasses={setMixedMethodSecondSpecialClasses}
                      emphasizeEmpty={validationHighlight}
                    />
                  </div>

                  <div className="mixed-totals-bar" role="group" aria-label="Souhrn PHmax – smíšené třídy">
                    <div className="mixed-totals-bar__cell">
                      <span className="mixed-totals-bar__label">1. stupeň</span>
                      <span className="mixed-totals-bar__value">{mixedMethodFirstTotal}</span>
                    </div>
                    <div className="mixed-totals-bar__cell">
                      <span className="mixed-totals-bar__label">2. stupeň</span>
                      <span className="mixed-totals-bar__value">{mixedMethodSecondTotal}</span>
                    </div>
                    <div className="mixed-totals-bar__cell mixed-totals-bar__cell--grand">
                      <span className="mixed-totals-bar__label">Celkem – smíšené třídy</span>
                      <span className="mixed-totals-bar__value">{mixedMethodTotal}</span>
                    </div>
                  </div>
                </section>
                </ZsModuleGate>
              )}
            </div>

            {(hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) && (
              <ZsModuleGate
                sectionId="extras"
                title={
                  hasSection("prep_class") || hasSection("prep_special")
                    ? "Samostatné položky PHmax"
                    : "§ 38 a § 41 (navýšení PHmax)"
                }
                viewMode={viewMode}
              >
              <section className="card section-card section-card--module section-card--module-extras" data-section="extras" data-wizard-step="3" data-phmax-pane="exceptions">
                <h2>
                  {hasSection("prep_class") || hasSection("prep_special") ? (
                    "Samostatné položky PHmax"
                  ) : (
                    <>
                      <ZsLegisRef citeId="zs-par38" label="§ 38" /> a <ZsLegisRef citeId="zs-par41" label="§ 41" /> školského
                      zákona (navýšení PHmax)
                    </>
                  )}{" "}
                  <HelpHint text="Za žáka podle § 38 nebo § 41 se celkové PHmax školy navyšuje o 0,25 h (1. stupeň) nebo 0,5 h (2. stupeň) na žáka; tito žáci se nezapočítávají do průměru třídy pro tabulky B1–B28. Aplikace neřeší rozvržení hodin do týdnů – k přímé pedagogické činnosti a úvazku viz výklad MŠMT: https://www.msmt.cz/dokumenty/pravni-vyklad-k-23-zakona-opedagogickych-pracovnicich" />
                </h2>
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
                      <NumberField
                        label={
                          <>
                            <ZsLegisRef citeId="zs-par38" label="§ 38" /> – 1. stupeň
                          </>
                        }
                        value={p38First}
                        onChange={setP38First}
                      />
                      <NumberField
                        label={
                          <>
                            <ZsLegisRef citeId="zs-par38" label="§ 38" /> – 2. stupeň
                          </>
                        }
                        value={p38Second}
                        onChange={setP38Second}
                      />
                    </>
                  )}

                  {hasSection("par41") && (
                    <>
                      <NumberField
                        label={
                          <>
                            <ZsLegisRef citeId="zs-par41" label="§ 41" /> – 1. stupeň
                          </>
                        }
                        value={p41First}
                        onChange={setP41First}
                      />
                      <NumberField
                        label={
                          <>
                            <ZsLegisRef citeId="zs-par41" label="§ 41" /> – 2. stupeň
                          </>
                        }
                        value={p41Second}
                        onChange={setP41Second}
                      />
                    </>
                  )}
                </div>
                <div className="grid four section-results-strip">
                  {hasSection("prep_class") ? <ResultCard label="PHmax – přípravná třída" value={prepClassPhmax} tone="success" /> : null}
                  {hasSection("prep_special") ? <ResultCard label="PHmax – přípravný stupeň ZŠS" value={prepSpecialPhmax} tone="success" /> : null}
                  {hasSection("par38") ? (
                    <ResultCard
                      methodStepLabel="PHmax – § 38"
                      label={
                        <>
                          PHmax – <ZsLegisRef citeId="zs-par38" label="§ 38" />
                        </>
                      }
                      value={par38Phmax}
                      tone="success"
                    />
                  ) : null}
                  {hasSection("par41") ? (
                    <ResultCard
                      methodStepLabel="PHmax – § 41"
                      label={
                        <>
                          PHmax – <ZsLegisRef citeId="zs-par41" label="§ 41" />
                        </>
                      }
                      value={par41Phmax}
                      tone="success"
                    />
                  ) : null}
                </div>
              </section>
              </ZsModuleGate>
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

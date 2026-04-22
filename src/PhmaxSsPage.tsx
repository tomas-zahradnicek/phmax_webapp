import React, { useCallback, useEffect, useRef, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import {
  ADVANCED_AUDIT_GROUP_LABEL,
  CALCULATOR_LIMITS_NOTE,
  EXPORT_ORIENTACNI_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
  NAMED_BACKUPS_COMPARE_JSON_LABEL,
  NAMED_BACKUPS_DELETE_LABEL,
  NAMED_BACKUPS_NAME_LABEL,
  NAMED_BACKUPS_RESTORE_LABEL,
  NAMED_BACKUPS_SAVE_LABEL,
  NAMED_BACKUPS_SELECT_PLACEHOLDER,
  namedBackupsMicrocopy,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { GlossaryDialog, type GlossaryTerm } from "./GlossaryDialog";
import { GlossaryIconButton } from "./GlossaryIconButton";
import { HeroActionsDrawer } from "./HeroActionsDrawer";
import {
  HeroIconActionButton,
  IconAddTableRow,
  IconClearStored,
  IconCopy,
  IconCsv,
  IconExcel,
  IconPrint,
  IconPrintSummary,
  IconRemoveTableRow,
  IconResetAll,
  IconRestoreQuick,
  IconSaveQuick,
  IconSpinner,
} from "./HeroActionIconButton";
import { HeroStat } from "./HeroStat";
import { HeroStatusBar } from "./HeroStatusBar";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { QuickOnboarding } from "./QuickOnboarding";
import {
  PHMAX_SS_FRAMEWORK_FIRST_PHASE,
  PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY,
  PHMAX_SS_LEGISLATIVE_MD_REL_PATH,
  PHMAX_SS_UNITS_SECTION,
  PHMAX_SS_UNITS_STORAGE_KEY,
  PHMAX_SS_LOCAL_DOC_EXAMPLE_NAMES,
  PHMAX_SS_MAX_NAMED_SNAPSHOTS,
  PHMAX_SS_METHODOLOGY_LABEL,
  PHMAX_SS_MSMT_PAGE_URL,
  PHMAX_SS_RIZENI_SKOLY_URL,
  PHMAX_SS_SOURCE_FOLDER_HINT,
} from "./ss/phmax-ss-constants";
import {
  PHMAX_SS_CALCULATION_BRANCH_GUIDE,
  PHMAX_SS_NV123_FORM_COEFFICIENTS,
  PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE,
  PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE,
  PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE,
  PHMAX_SS_SECTION4_PHMAX_GUIDE,
  type PhmaxSsCalcBranch,
  type PhmaxSsNv123FormCoefficient,
  type PhmaxSsPar16ExampleRow,
  type PhmaxSsPracticalSchoolPhamaxRow,
  type PhmaxSsPracticalSchoolPhmaxRow,
} from "./ss/phmax-ss-methodology-guides";
import {
  ssHeroExampleSnapshot,
  SS_HERO_EXAMPLE_GROUP_82_TALENT,
  SS_HERO_EXAMPLE_GROUP_AGGREGAT_JEDNO,
  SS_HERO_EXAMPLE_GROUP_FORMA_REGIME,
  SS_HERO_EXAMPLE_GROUP_GYMNAZIUM,
  SS_HERO_EXAMPLE_GROUP_MATURITNI,
  SS_HERO_EXAMPLE_GROUP_PRIJIMACI,
  SS_HERO_EXAMPLE_GROUP_SPECIAL_TYP,
  SS_HERO_EXAMPLE_GROUP_VICEOBOR,
  SS_HERO_EXAMPLE_META,
  SS_HERO_EXAMPLE_SELECT_LEGEND,
  type SsHeroExampleKey,
} from "./ss/phmax-ss-hero-examples";
import { PhmaxSsUnitsForm, type SsDashboardMetrics } from "./ss/PhmaxSsUnitsForm";
import { usePhmaxSsUnits, type SsNamedSnapshot } from "./ss/use-phmax-ss-units";

const SS_GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    term: "PHmax (střední vzdělávání)",
    description: (
      <>
        <p style={{ margin: "0 0 8px" }}>
          <strong>PHmax</strong> je podle <strong>NV č. 123/2018 Sb.</strong> maximální týdenní rozsah přímé pedagogické
          činnosti hrazený ze státního rozpočtu. Stanovuje se vždy pro konkrétní <strong>obor</strong>,{" "}
          <strong>formu vzdělávání</strong> a <strong>typ třídy</strong>.
        </p>
        <p style={{ margin: "0 0 6px" }}>
          <strong>V metodice se vychází zejména z:</strong>
        </p>
        <ul style={{ margin: "0 0 8px", paddingLeft: "1.25rem" }}>
          <li>tabulek PHmax v příloze NV č. 123/2018 Sb. (pásma podle průměrného počtu žáků),</li>
          <li>pravidel pro dělení odborné výuky a skupiny dle navazujících předpisů,</li>
          <li>rozlišení jednoobor / víceobor / § 16 odst. 9 / přechodné režimy dle metodiky MŠMT.</li>
        </ul>
        <p style={{ margin: 0 }}>
          V aplikaci je výpočet <strong>orientační</strong>; při oficiálním vykazování je nutné ověřit výsledek vůči
          aktuální metodice MŠMT a výkazům školy.
        </p>
      </>
    ),
  },
  {
    term: "Typ třídy (SŠ)",
    description: (
      <>
        Pro potřeby metodiky se pod pojmem <strong>typ třídy</strong> rozumí členění na třídy jednooborové, dvouoborové,
        tříoborové, více než tříoborové u oborů vzdělání <strong>skupiny 82</strong> a třídy zřízené podle{" "}
        <strong>§ 16 odst. 9 školského zákona</strong>. PHmax se stanovuje samostatně pro každý obor středního
        vzdělání, <strong>formu vzdělávání</strong> a <strong>typ třídy</strong>.
      </>
    ),
  },
  {
    term: "Víceoborová třída a součet PHmax",
    description: (
      <>
        Ve víceoborové třídě je v PHmax obsažen <strong>poměrný</strong> počet hodin všeobecně vzdělávací složky a{" "}
        <strong>plný</strong> počet hodin odborné složky vzdělávání. Při součtu PHmax ve víceoborové třídě získáte plný
        počet hodin pro výuku všeobecné i odborné složky — odpovídá tomu, že všeobecně vzdělávací předměty jsou
        vyučovány společně a předměty odborné složky se dělí do skupin podle oborů.
      </>
    ),
  },
  {
    term: "Organizace víceoborových tříd (vyhl. č. 13/2005 Sb.)",
    description: (
      <>
        <p style={{ margin: "0 0 8px" }}>
          Pravidla jsou v <strong>vyhlášce č. 13/2005 Sb.</strong> o středním vzdělávání a vzdělávání v konzervatoři, ve
          znění novel (mj. <strong>vyhláška č. 145/2018 Sb.</strong>). Za víceoborovou třídu se považuje třída, kde se
          vzdělávají žáci <strong>více oborů společně</strong>; všeobecně vzdělávací předměty společně, u odborných se
          žáci dělí do skupin podle oboru.
        </p>
        <p style={{ margin: "0 0 6px" }}>
          <strong>Běžné podmínky zřízení</strong> (shrnutí pro orientaci v aplikaci — neúplná náhrada textu vyhlášky):
        </p>
        <ul style={{ margin: "0 0 8px", paddingLeft: "1.25rem" }}>
          <li>
            typicky alespoň u jednoho oboru je počet žáků <strong>nižší než 17</strong> a celkový počet žáků ve třídě
            nepřekročí povolený počet žáků (horní limit kapacity třídy aplikace zvlášť neověřuje);
          </li>
          <li>
            obory mají stejnou <strong>kategorii</strong> dosaženého vzdělání, stejnou <strong>formu</strong> a{" "}
            <strong>délku</strong> vzdělávání a stejný <strong>ročník</strong>;
          </li>
          <li>
            nejvýše <strong>tři obory</strong> kategorie <strong>E</strong> nebo <strong>H</strong>, případně nejvýše{" "}
            <strong>dva obory</strong> kategorie <strong>L</strong> nebo <strong>M</strong>;
          </li>
          <li>
            u kategorie <strong>K</strong> víceoborovou třídu nelze obecně zřizovat; výjimka je kombinace{" "}
            <strong>gymnázium + gymnázium se sportovní přípravou</strong>;
          </li>
          <li>
            lze ji zřídit i tehdy, je-li v jednom oboru více než 17 žáků a v druhém méně než 17, pokud škola{" "}
            <strong>nemá dva obory</strong> s méně než 17 žáky (zvláštní režim — v kontrole pravidel jako upozornění).
          </li>
        </ul>
        <p style={{ margin: "0 0 8px" }}>
          Obory s <strong>talentovou zkouškou</strong> v přijímacím řízení dle RVP mohou tvořit víceoborovou třídu jen
          mezi sebou; počet oborů pak není omezen. Směs oborů s talentovou zkouškou a bez ní se řídí ustanoveními
          vyhlášky č. 13/2005 Sb.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          <strong>Přechodné ustanovení:</strong> pravidla se nevztahují na třídy zřízené nejpozději ve školním roce{" "}
          <strong>2017/2018</strong>; v nich se počet oborů nesmí zvýšit (v aplikaci příznak „přechodná víceoborová
          třída“).
        </p>
        <p style={{ margin: 0 }}>
          Podle <strong>vyhlášky č. 248/2019 Sb.</strong> (mj. novela vyhl. č. 27/2016 Sb.) ve třídě podle{" "}
          <strong>§ 16 odst. 9 školského zákona</strong> mohou být žáci více oborů <strong>stejné kategorie</strong> dle
          nařízení o soustavě oborů; <strong>pravidla víceoborových tříd z vyhl. č. 13/2005 Sb. se neuplatní</strong> —
          v aplikaci režim „třída § 16/9“ u kontroly pravidel.
        </p>
      </>
    ),
  },
  {
    term: "Víceletá gymnázia a konzervatoř (PHmax)",
    description: (
      <>
        U oborů víceletých gymnázií a víceletých gymnázií se sportovní přípravou se PHmax{" "}
        <strong>vždy stanovuje samostatně pro nižší a vyšší stupeň</strong>. Výjimku tvoří obory{" "}
        <strong>79-43-K/61</strong> (Dvojjazyčné gymnázium) a <strong>79-41-K/610</strong> (Gymnázium – vybrané
        předměty v cizím jazyce), u kterých se tento postup neuplatňuje.
      </>
    ),
  },
  {
    term: "Individuální vzdělávací plán (PHmax SŠ)",
    description: (
      <>
        PHmax pro žáky středních škol a konzervatoří vzdělávaných podle <strong>individuálního vzdělávacího plánu</strong>{" "}
        se samostatně nestanovuje — žáci se započítávají do celkových počtů žáků podle oborů vzdělání a ročníků.
      </>
    ),
  },
  {
    term: "PHAmax (střední vzdělávání)",
    description: (
      <>
        <p style={{ margin: "0 0 8px" }}>
          PHAmax je maximální <strong>týdenní</strong> počet hodin přímé pedagogické činnosti{" "}
          <strong>asistenta pedagoga</strong>. V metodice SŠ se řeší samostatně od PHmax.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          V této verzi aplikace je PHAmax dopočítán pro obory <strong>Praktická škola jednoletá (78-62-C/01)</strong> a{" "}
          <strong>Praktická škola dvouletá (78-62-C/02)</strong> v denní formě podle tabulky metodiky (pásma podle
          průměrného počtu žáků ve třídě).
        </p>
        <p style={{ margin: 0 }}>
          <strong>Důležité:</strong> PHmax a PHAmax jsou oddělené rámce; přebytky mezi nimi nelze převádět. Pro další
          scénáře mimo PrŠ použijte plný metodický postup MŠMT.
        </p>
      </>
    ),
  },
  {
    term: "Dílčí jednotka výpočtu",
    description: (
      <>
        <p style={{ margin: "0 0 8px" }}>
          Dílčí jednotka je jeden řádek evidence (třída/skupina) pro konkrétní kombinaci:
        </p>
        <ul style={{ margin: "0 0 8px", paddingLeft: "1.25rem" }}>
          <li>kód oboru,</li>
          <li>forma vzdělávání,</li>
          <li>typ třídy (jednoobor / víceobor / § 16 odst. 9),</li>
          <li>průměrný počet žáků a počet tříd.</li>
        </ul>
        <p style={{ margin: 0 }}>
          Z těchto vstupů aplikace počítá orientační PHmax a provádí kontrolu pravidel pro víceoborové třídy.
        </p>
      </>
    ),
  },
  {
    term: "§ 4 — Stanovení PHmax (a tabulky PrŠ)",
    description: (
      <>
        Metodika rozlišuje postupy <strong>1</strong> (jednoobor denně), <strong>1a</strong> (jednoobor jiné formy —
        koeficienty NV), <strong>2</strong> (víceobor dle vyhl. 13), <strong>2a</strong> (víceobor jiné formy),{" "}
        <strong>3</strong> (přechodné ustanovení) a <strong>4</strong> (§ 16 odst. 9, Praktická škola, PHAmax). Plný
        textový přepis a tabulky kódů <strong>78-62-C/01</strong> a <strong>78-62-C/02</strong> je v rozbalení{" "}
        <strong>„Metodika § 4: Stanovení PHmax…“</strong> na této stránce.
      </>
    ),
  },
  {
    term: "Rozcestník výpočtu (1–4) a průměr § 16/9",
    description: (
      <>
        Metodika rozlišuje čtyři situace: jednooborová třída <strong>(1)</strong>, víceoborová dle vyhl. č. 13/2005 Sb.{" "}
        <strong>(2)</strong>, přechodné ustanovení NV <strong>(3)</strong>, třída podle § 16{" "}
        <strong>(4)</strong>. Postup výpočtu průměrného počtu žáků podle § 16 odst. 9 (včetně kroků pro jedno-, dvou- a
        tříoborové třídy a pro třídy § 16/9) je shrnut v rozbalení{" "}
        <strong>„Metodika: rozcestník a průměr žáků (§ 16 odst. 9)“</strong> na této stránce — pro kontrolu znění vůči
        oficiálnímu dokumentu MŠMT.
      </>
    ),
  },
];

type PhmaxSsPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

function applySsHeroExampleSelection(
  key: SsHeroExampleKey,
  handlers: {
    setSelected: (value: SsHeroExampleKey) => void;
    applySnapshot: (snapshot: unknown) => void;
    setNotice: (message: string) => void;
  },
) {
  handlers.setSelected(key);
  if (!key) return;
  try {
    const snapshot = ssHeroExampleSnapshot(key);
    handlers.applySnapshot({ rows: snapshot.rows });
    handlers.setNotice("Načten ukázkový příklad SŠ (orientační model).");
  } catch {
    handlers.setNotice("Ukázkový příklad SŠ se nepodařilo načíst.");
  }
}

export function PhmaxSsPage({ productView, setProductView }: PhmaxSsPageProps) {
  const fw = PHMAX_SS_FRAMEWORK_FIRST_PHASE;
  const ssUnitsUi = PHMAX_SS_UNITS_SECTION;
  const s4 = PHMAX_SS_SECTION4_PHMAX_GUIDE;
  const [ssMetrics, setSsMetrics] = useState<SsDashboardMetrics>({
    rowCount: 1,
    phmaxTotal: 0,
    phamaxTotal: null,
  });
  const ss = usePhmaxSsUnits(setSsMetrics);
  const [selectedSsHeroExample, setSelectedSsHeroExample] = useState<SsHeroExampleKey>("");
  const selectedSsHeroExampleMeta =
    selectedSsHeroExample && selectedSsHeroExample in SS_HERO_EXAMPLE_META
      ? SS_HERO_EXAMPLE_META[selectedSsHeroExample as Exclude<SsHeroExampleKey, "">]
      : null;
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [ssGuideOpen, setSsGuideOpen] = useState(false);
  const glossaryTriggerRef = useRef<HTMLButtonElement>(null);

  const [phase1Notes, setPhase1Notes] = useState(() => {
    try {
      return localStorage.getItem(PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY) ?? "";
    } catch {
      return "";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY, phase1Notes);
    } catch {
      /* ignore */
    }
  }, [phase1Notes]);

  const toggleSsGuideFromHero = useCallback(() => {
    setSsGuideOpen((o) => !o);
  }, []);

  const phmaxHeroValue = ssMetrics.phmaxTotal.toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const phamaxHeroValue =
    ssMetrics.phamaxTotal == null
      ? "–"
      : ssMetrics.phamaxTotal.toLocaleString("cs-CZ", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <div className="hero__pills-row">
          <ProductViewPills productView={productView} setProductView={setProductView} />
          <div className="hero__pills-row-trailing">
            <GlossaryIconButton
              ref={glossaryTriggerRef}
              className="glossary-icon-btn--hero"
              onClick={() => setGlossaryOpen(true)}
            />
            <button
              type="button"
              className="btn btn--hero-help"
              onClick={toggleSsGuideFromHero}
              aria-expanded={ssGuideOpen}
            >
              {ssGuideOpen ? "Skrýt nápovědu" : "Nápověda"}
            </button>
          </div>
        </div>

        <div className="grid two hero__grid">
          <div>
            <h1 className="hero__title">PHmax a PHAmax – střední školy</h1>
            <p className="hero__text">
              Přehledná kalkulačka pro <strong>střední vzdělávání</strong> podle{" "}
              <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
                {PHMAX_SS_METHODOLOGY_LABEL}
              </a>
              . Doplňující souvislosti:{" "}
              <a href={PHMAX_SS_RIZENI_SKOLY_URL} target="_blank" rel="noopener noreferrer" className="status-link">
                metodické doporučení (ŘŠ)
              </a>
              . Kód SŠ je oddělený od ZŠ, PV a ŠD (složka{" "}
              <code className="methodology-strip__code">src/ss/</code>).
            </p>
            <p className="hero__note" style={{ marginTop: 10 }}>
              {PHMAX_SS_SOURCE_FOLDER_HINT} Příklad názvu souboru:{" "}
              <code className="methodology-strip__code">{PHMAX_SS_LOCAL_DOC_EXAMPLE_NAMES[0]}</code>. Legislativní vrstva
              (pravidla × zdroj):{" "}
              <code className="methodology-strip__code">{PHMAX_SS_LEGISLATIVE_MD_REL_PATH}</code>.
            </p>
          </div>
          <div className="hero__stats">
            <HeroStat label="Aktivní modul" value="PHmax SŠ" />
            <HeroStat label="Zvolený režim" value="Evidence dílčích jednotek" />
            <HeroStat label="Výsledek PHmax" value={phmaxHeroValue} />
            <HeroStat
              label="Výsledek PHAmax"
              value={phamaxHeroValue}
              title={
                ssMetrics.phamaxTotal == null
                  ? "PHAmax v aplikaci počítáme jen pro Praktickou školu (78-62-C/01, 78-62-C/02) v denní formě podle tabulky metodiky. Jiné obory: použijte metodiku / výkaz."
                  : "Součet PHAmax pro řádky PrŠ (78-62-C/01, 78-62-C/02), denní forma, podle přílohy metodiky. Ostatní typy tříd nejsou v tomto součtu."
              }
            />
            <HeroStat label="Řádků ve formuláři" value={ssMetrics.rowCount} />
          </div>
        </div>
        <p className="hero__note" style={{ marginTop: 10 }}>
          PHAmax mimo PrŠ (78-62-C/01, 78-62-C/02) dopočítejte plným postupem metodiky MŠMT – navazující kroky a tabulky jsou na{" "}
          <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
            stránce metodiky pro SŠ
          </a>
          .
        </p>

        <div className="hero-actions hero-actions--compact">
          <div className="field field--hero-select hero-actions__example hero-ss-example-select">
            <span className="field__label field__label--hero" id="ss-hero-example-label">
              Ukázkový příklad
            </span>
            <select
              id="ss-hero-example-select"
              className="input"
              aria-labelledby="ss-hero-example-label"
              aria-describedby="ss-hero-example-legend"
              title="Ukázkový orientační příklad pro SŠ. Po načtení upravte vstupy podle reálné evidence tříd školy."
              value={selectedSsHeroExample}
              onChange={(e) =>
                applySsHeroExampleSelection(e.target.value as SsHeroExampleKey, {
                  setSelected: setSelectedSsHeroExample,
                  applySnapshot: ss.applySsRowsSnapshot,
                  setNotice: ss.setUiNotice,
                })
              }
            >
              <option value="">Vyberte ukázkový příklad…</option>
              <optgroup label="Jednoobor a agregát">
                {SS_HERO_EXAMPLE_GROUP_AGGREGAT_JEDNO.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Maturitní obory (denní)">
                {SS_HERO_EXAMPLE_GROUP_MATURITNI.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Obory z praxe (přijímací řízení / výkaz)">
                {SS_HERO_EXAMPLE_GROUP_PRIJIMACI.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Gymnázium">
                {SS_HERO_EXAMPLE_GROUP_GYMNAZIUM.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Víceoborová třída">
                {SS_HERO_EXAMPLE_GROUP_VICEOBOR.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Forma studia a režim">
                {SS_HERO_EXAMPLE_GROUP_FORMA_REGIME.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Skupina 82 / talent">
                {SS_HERO_EXAMPLE_GROUP_82_TALENT.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Zvláštní typ školy (PrŠ, § 16/9)">
                {SS_HERO_EXAMPLE_GROUP_SPECIAL_TYP.map((k) => {
                  const m = SS_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
            </select>
            <p
              id="ss-hero-example-legend"
              className="muted-text"
              style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "44rem", lineHeight: 1.5 }}
            >
              {SS_HERO_EXAMPLE_SELECT_LEGEND}
            </p>
            {selectedSsHeroExampleMeta ? (
              <p className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "44rem", lineHeight: 1.5 }}>
                <strong>Tento příklad ilustruje:</strong> {selectedSsHeroExampleMeta.title}
              </p>
            ) : null}
          </div>
          <HeroActionsDrawer>
            <div className="hero-actions__group hero-actions__group--primary">
              <HeroIconActionButton
                className="btn btn--light"
                label="Tisk stránky"
                icon={<IconPrint />}
                onClick={() => window.print()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label={ssUnitsUi.addRow}
                title="Přidá nový řádek na konec tabulky evidence dílčích jednotek níže."
                icon={<IconAddTableRow />}
                onClick={ss.addRow}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Rychle uložit průběh do prohlížeče"
                icon={<IconSaveQuick />}
                onClick={ss.saveSnapshotManually}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Rychle obnovit uložený průběh"
                icon={<IconRestoreQuick />}
                onClick={ss.restoreSnapshot}
              />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions__group hero-actions__group--meta">
              <HeroIconActionButton
                className="btn ghost"
                label={ssUnitsUi.removeLastRowHeroLabel}
                title={ssUnitsUi.removeLastRowHeroTitle}
                icon={<IconRemoveTableRow />}
                onClick={ss.removeLastRow}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat uložená data v prohlížeči"
                icon={<IconClearStored />}
                onClick={ss.clearStoredSnapshot}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat všechny údaje ve formuláři"
                icon={<IconResetAll />}
                onClick={ss.resetAll}
              />
            </div>
            <div className="hero-actions__group hero-actions__group--named">
              <div className="hero-named-grid" aria-label="Export a pojmenované zálohy">
                <p className="muted-text" style={{ gridColumn: "1 / -1", margin: "0 0 6px", fontSize: "0.85rem", lineHeight: 1.45 }}>
                  {namedBackupsMicrocopy(PHMAX_SS_MAX_NAMED_SNAPSHOTS, "kompletní stav řádkové evidence SŠ a označení pro export")}
                </p>
                <label className="hero-named-field hero-named-field--export">
                  <span className="field__label field__label--hero-named">Označení pro export</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="např. název školy, školní rok…"
                    value={ss.exportLabel}
                    onChange={(e) => ss.setExportLabel(e.target.value)}
                    aria-label="Označení pro export a shrnutí"
                  />
                </label>
                <label className="hero-named-field hero-named-field--backup-name">
                  <span className="field__label field__label--hero-named">
                    {NAMED_BACKUPS_NAME_LABEL}
                    <span
                      title={namedBackupsMicrocopy(PHMAX_SS_MAX_NAMED_SNAPSHOTS, "kompletní stav řádkové evidence SŠ a označení pro export")}
                      aria-label={namedBackupsMicrocopy(PHMAX_SS_MAX_NAMED_SNAPSHOTS, "kompletní stav řádkové evidence SŠ a označení pro export")}
                      className="help-hint"
                    >
                      i
                    </span>
                  </span>
                  <input
                    type="text"
                    className="input"
                    placeholder="např. stav 2026/27"
                    value={ss.namedSaveName}
                    onChange={(e) => ss.setNamedSaveName(e.target.value)}
                    aria-label="Název pojmenované zálohy"
                  />
                </label>
                <div className="hero-named-field hero-named-field--save">
                  <span className="hero-named-field__btn-slot" aria-hidden="true" />
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.saveNamedSsSnapshot}>
                    {NAMED_BACKUPS_SAVE_LABEL}
                  </button>
                </div>
                <div className="hero-named-field hero-named-field--select">
                  <select
                    className="input"
                    value={ss.selectedNamedId}
                    onChange={(e) => ss.setSelectedNamedId(e.target.value)}
                    aria-label="Vybrat uloženou zálohu"
                  >
                    <option value="">{NAMED_BACKUPS_SELECT_PLACEHOLDER}</option>
                    {ss.namedSnapshots.map((n: SsNamedSnapshot) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hero-named-field hero-named-field--restore-delete">
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.restoreNamedSsSnapshot}>
                    {NAMED_BACKUPS_RESTORE_LABEL}
                  </button>
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.deleteNamedSsSnapshot}>
                    {NAMED_BACKUPS_DELETE_LABEL}
                  </button>
                </div>
                <div className="hero-named-field" style={{ gridColumn: "1 / -1" }}>
                  <p className="hero-actions__group-title">{ADVANCED_AUDIT_GROUP_LABEL}</p>
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.handleCompareSsWithNamedSnapshot}>
                    {NAMED_BACKUPS_COMPARE_JSON_LABEL}
                  </button>
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.handleExportSsAuditJson}>
                    Stáhnout auditní protokol (JSON)
                  </button>
                </div>
              </div>
            </div>

            <div className="hero-actions__group hero-actions__group--exports">
              <HeroIconActionButton
                className="btn ghost"
                label="Exportovat data jako CSV"
                icon={<IconCsv />}
                onClick={ss.handleExportCsv}
              />
              <HeroIconActionButton
                className="btn ghost"
                label={ss.xlsxExportBusy ? "Připravuji Excel…" : "Stáhnout shrnutí jako Excel (.xlsx)"}
                icon={ss.xlsxExportBusy ? <IconSpinner /> : <IconExcel />}
                disabled={ss.xlsxExportBusy}
                aria-busy={ss.xlsxExportBusy}
                showLabel={ss.xlsxExportBusy}
                onClick={() => void ss.handleExportXlsx()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Kopírovat textové shrnutí do schránky"
                icon={<IconCopy />}
                onClick={() => void ss.copySummaryToClipboard()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Tisk textového shrnutí"
                icon={<IconPrintSummary />}
                onClick={ss.printSummaryWindow}
              />
            </div>
          </HeroActionsDrawer>
        </div>
      </header>

      <GlossaryDialog
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        terms={SS_GLOSSARY_TERMS}
        triggerRef={glossaryTriggerRef}
        scopeHint="SŠ — pojmy podle metodiky stanovení PHmax a PHAmax pro střední vzdělávání (kontrola znění oproti oficiálnímu dokumentu)."
      />

      <QuickOnboarding
        title="Nápověda – střední školy (PHmax / PHAmax)"
        open={ssGuideOpen}
        onDismiss={() => setSsGuideOpen(false)}
        dismissButtonLabel="Skrýt nápovědu"
        anchorId="ss-quick-onboarding"
      >
        <p>
          <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
        </p>
        <p>
          Kalkulačka je orientační; výsledky ověřte vůči aktuální{" "}
          <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
            metodice MŠMT pro SŠ
          </a>{" "}
          a výkazům školy. Vedle tlačítka <strong>Nápověda</strong> je <strong>Slovníček</strong> s definicemi pojmů (PHmax,
          typ třídy, víceobor…).
        </p>
        <p>
          <strong>1. fáze – rámec vstupů a výstupů.</strong> Shrnuje, co metodika očekává jako vstupy školy a co dopočítá
          aplikace. Můžete si vést <strong>volitelné poznámky</strong> (ukládají se jen v tomto prohlížeči, odděleně od
          evidence řádků).
        </p>
        <p>
          <strong>2. fáze – evidence tříd a skupin.</strong> Každý <strong>řádek</strong> = jedna dílčí jednotka: přesný{" "}
          <strong>kód oboru z RVP</strong>, průměr žáků, počet tříd, forma studia, typ třídy. Sloupec <strong>Režim PHmax</strong>{" "}
          nechte na <em>Automaticky</em> (podle počtu oborů ve třídě a příznaku talentové 82) nebo režim ručně vynuťte. U
          více oborů ve stejné třídě vyplňte <strong>Další obory</strong> a volitelně <strong>Žáci / obor</strong> – níže
          proběhne kontrola pravidel. U každého řádku můžete řádek také <strong>Odstranit</strong> (konkrétní řádek).
        </p>
        <p>
          <strong>PHAmax v aplikaci.</strong> V horním přehledu se PHAmax dopočítává jen pro{" "}
          <strong>Praktickou školu</strong> (kódy <code className="methodology-strip__code">78-62-C/01</code>,{" "}
          <code className="methodology-strip__code">78-62-C/02</code>) v <strong>denní</strong> formě podle tabulky z
          metodiky. U ostatních oborů použijte plný postup MŠMT – PHAmax neinterpretujte z této verze jako úplný.
        </p>
        <p>
          <strong>Horní nástrojová lišta (pod ukázkovým příkladem).</strong> Zleva doprava typicky: <strong>tisk</strong>{" "}
          stránky, <strong>Přidat řádek</strong> a <strong>Odstranit poslední řádek</strong> (evidence v tabulce níže;
          vždy zůstane alespoň jeden řádek), rychlé <strong>uložení / obnovení</strong> průběhu v prohlížeči,{" "}
          <strong>vymazání uložených dat</strong> nebo <strong>vyčištění formuláře</strong>, pojmenované zálohy (max.{" "}
          {PHMAX_SS_MAX_NAMED_SNAPSHOTS}), export <strong>CSV</strong> a <strong>Excel</strong>, kopie a tisk textového
          shrnutí, <strong>auditní JSON</strong>. Řádky evidence se automaticky ukládají do{" "}
          <code className="methodology-strip__code">localStorage</code> (klíč{" "}
          <code className="methodology-strip__code">{PHMAX_SS_UNITS_STORAGE_KEY}</code>).
        </p>
        <p>{EXPORT_ORIENTACNI_NOTE}</p>
        <p className="onboarding-hero-legend">{HERO_ACTIONS_ICON_LEGEND}</p>
        <p>
          Po vyplnění sledujte sekci <strong>Orientační výpočet PHmax</strong> (řádek po řádku) a blok{" "}
          <strong>Kontrola pravidel</strong> u víceoborových tříd. U řádku lze rozbalit vysvětlení výpočtu („proč takto
          PHmax“) a vyhodnocení pravidel.
        </p>
      </QuickOnboarding>

      <section
        className="card section-card section-card--ss"
        aria-labelledby="ss-framework-heading"
        style={{ marginTop: 24, marginBottom: 24 }}
      >
        <h2 id="ss-framework-heading" className="section-title">
          {fw.heading}
        </h2>
        <p className="muted-text ss-framework-compact-note">
          Rychlý souhrn: evidujte řádky po oboru/formě/typu třídy; PHmax a PHAmax jsou oddělené rámce.
        </p>

        <details className="ss-framework-details" open>
          <summary className="ss-framework-details__summary">Rozbalit metodický kontext a omezení v aplikaci</summary>
          <p className="muted-text" style={{ marginTop: 10, lineHeight: 1.55 }}>
            {fw.lead}
          </p>
          <p className="muted-text" style={{ marginTop: 10, lineHeight: 1.55 }}>
            <strong>V aplikaci:</strong> {fw.implementationNote}
          </p>
        </details>

        <details className="ss-framework-details">
          <summary className="ss-framework-details__summary">Rozbalit vstupy / výstupy podle metodiky</summary>
          <div className="grid two" style={{ marginTop: 14, gap: "18px 24px", alignItems: "start" }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: "1.05rem", fontWeight: 700 }}>
                Vstupy (uživatel / škola)
              </h3>
              <ul className="muted-text" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
                {fw.inputs.map((line) => (
                  <li key={line} style={{ marginBottom: 6 }}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: "1.05rem", fontWeight: 700 }}>
                Výstupy (dopočítá aplikace)
              </h3>
              <ul className="muted-text" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
                {fw.outputs.map((line) => (
                  <li key={line} style={{ marginBottom: 6 }}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>

        <label className="field" style={{ marginTop: 16, marginBottom: 0 }}>
          <span className="field__label">{fw.phase1NotesFieldLabel}</span>
          <textarea
            rows={4}
            value={phase1Notes}
            onChange={(e) => setPhase1Notes(e.target.value)}
            placeholder="Krátké poznámky k škole, oborům nebo postupu…"
            aria-describedby="ss-framework-phase1-notes-hint"
          />
          <span id="ss-framework-phase1-notes-hint" className="muted-text" style={{ fontSize: "0.85rem", marginTop: 6 }}>
            {fw.phase1NotesFieldHint}
          </span>
        </label>

        <p className="muted-text ss-framework-compact-note">
          Přímý odkaz: <code className="methodology-strip__code">?view=ss</code> • právní rámec viz níže („Verze metodik a
          předpisy“):{" "}
          <a href="https://www.zakonyprolidi.cz/cs/2018-123" target="_blank" rel="noopener noreferrer" className="status-link">
            NV č. 123/2018 Sb.
          </a>{" "}
          +{" "}
          <a href="https://www.zakonyprolidi.cz/cs/2005-75" target="_blank" rel="noopener noreferrer" className="status-link">
            NV č. 75/2005 Sb.
          </a>
          .
        </p>
      </section>

      <details className="subcard section-card" style={{ marginBottom: 24 }}>
        <summary className="section-title" style={{ cursor: "pointer", fontSize: "1.02rem" }}>
          Metodika: rozcestník a průměr žáků (§ 16 odst. 9)
        </summary>
        <div style={{ marginTop: 14 }}>
          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
            {PHMAX_SS_CALCULATION_BRANCH_GUIDE.title}
          </h3>
          <p className="muted-text" style={{ margin: "0 0 12px", lineHeight: 1.55 }}>
            {PHMAX_SS_CALCULATION_BRANCH_GUIDE.lead}
          </p>
          {PHMAX_SS_CALCULATION_BRANCH_GUIDE.branches.map((b: PhmaxSsCalcBranch, i: number) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <p className="muted-text" style={{ margin: "0 0 6px", lineHeight: 1.5 }}>
                <strong>{b.question}</strong>
              </p>
              <ul className="muted-text" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
                <li>
                  <strong>Ano:</strong> {b.yesOutcome}{" "}
                  <span className="methodology-strip__code" title="Označení ve schématu metodiky">
                    ({b.codeYes})
                  </span>
                </li>
                {"noContinue" in b ? (
                  <li>
                    <strong>Ne:</strong> {b.noContinue}
                  </li>
                ) : (
                  <li>
                    <strong>Ne:</strong> {b.noOutcome}{" "}
                    <span className="methodology-strip__code" title="Označení ve schématu metodiky">
                      ({b.codeNo})
                    </span>
                  </li>
                )}
              </ul>
            </div>
          ))}

          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "18px 0 8px" }}>
            {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.title}
          </h3>
          <p className="muted-text" style={{ margin: "0 0 10px", lineHeight: 1.55 }}>
            {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.intro}
          </p>
          <ol className="muted-text" style={{ margin: "0 0 14px", paddingLeft: "1.25rem", lineHeight: 1.55 }}>
            {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.steps.map((s: string, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <strong>{idx + 1})</strong> {s}
              </li>
            ))}
          </ol>
          <p className="muted-text" style={{ margin: "0 0 6px", fontWeight: 600 }}>
            {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.exampleTitle}
          </p>
          <p className="muted-text" style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
            {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.exampleObor}
          </p>
          <table className="sd-phmax-breakdown" style={{ maxWidth: 420, fontSize: "0.88rem" }}>
            <thead>
              <tr>
                <th scope="col">Třída</th>
                <th scope="col" className="sd-phmax-breakdown__head-num">
                  Žáci
                </th>
              </tr>
            </thead>
            <tbody>
              {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.exampleRows.map((r: PhmaxSsPar16ExampleRow) => (
                <tr key={r.className}>
                  <th scope="row">{r.className}</th>
                  <td className="sd-phmax-breakdown__num">{r.pupils}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted-text" style={{ margin: "10px 0 6px", lineHeight: 1.55, fontSize: "0.86rem" }}>
            {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.exampleNote}
          </p>
          <p className="muted-text" style={{ margin: 0, lineHeight: 1.55, fontSize: "0.86rem" }}>
            {PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.exampleConclusion}
          </p>
          <p className="muted-text" style={{ marginTop: 14, fontSize: "0.82rem", lineHeight: 1.5 }}>
            Grafické schéma z metodiky můžete držet vedle tohoto textu; v repozitáři zůstává tato textová podoba kvůli
            údržbě a diffům. Pokud budete chtít vložit i PNG/PDF přímo do aplikace, lze doplnit do{" "}
            <code className="methodology-strip__code">public/</code> a odkázat z tohoto bloku.
          </p>
        </div>
      </details>

      <details className="subcard section-card" style={{ marginBottom: 24 }}>
        <summary className="section-title" style={{ cursor: "pointer", fontSize: "1.02rem" }}>
          Metodika § 4: Stanovení PHmax (1, 1a, 2, 2a, 3, 4) a tabulky PrŠ / PHAmax
        </summary>
        <div className="muted-text" style={{ marginTop: 14, lineHeight: 1.55 }}>
          <p style={{ margin: "0 0 14px" }}>{s4.lead}</p>

          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
            {s4.jednooborDaily.title}
          </h3>
          {s4.jednooborDaily.paragraphs.map((p: string) => (
            <p key={p} style={{ margin: "0 0 8px" }}>
              {p}
            </p>
          ))}
          <ol style={{ margin: "0 0 16px", paddingLeft: "1.25rem" }}>
            {s4.jednooborDaily.flowSummary.map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ol>

          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
            {s4.jednooborOtherForms.title}
          </h3>
          {s4.jednooborOtherForms.paragraphs.map((p: string) => (
            <p key={p} style={{ margin: "0 0 8px" }}>
              {p}
            </p>
          ))}
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Koeficienty (NV č. 123/2018 Sb., § 2)</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: "1.25rem" }}>
            {PHMAX_SS_NV123_FORM_COEFFICIENTS.map((c: PhmaxSsNv123FormCoefficient) => (
              <li key={c.label} style={{ marginBottom: 4 }}>
                {c.label}: <strong>{c.value}</strong> násobek hodnoty PHmax
              </li>
            ))}
          </ul>

          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
            {s4.multiDaily.title}
          </h3>
          {s4.multiDaily.paragraphs.map((p: string) => (
            <p key={p} style={{ margin: "0 0 8px" }}>
              {p}
            </p>
          ))}
          <ol style={{ margin: "0 0 16px", paddingLeft: "1.25rem" }}>
            {s4.multiDaily.flowSummary.map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ol>

          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
            {s4.multiOtherForms.title}
          </h3>
          {s4.multiOtherForms.paragraphs.map((p: string) => (
            <p key={p} style={{ margin: "0 0 8px" }}>
              {p}
            </p>
          ))}
          <p style={{ margin: "0 0 16px", fontSize: "0.9rem" }}>
            Koeficienty jsou shodné s bodem 1a (viz výše).
          </p>

          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
            {s4.transitional.title}
          </h3>
          {s4.transitional.paragraphs.map((p: string) => (
            <p key={p} style={{ margin: "0 0 8px" }}>
              {p}
            </p>
          ))}
          <ol style={{ margin: "0 0 16px", paddingLeft: "1.25rem" }}>
            {s4.transitional.flowSummary.map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ol>

          <h3 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
            {s4.par16AndPractical.title}
          </h3>
          {s4.par16AndPractical.paragraphs.map((p: string) => (
            <p key={p} style={{ margin: "0 0 8px" }}>
              {p}
            </p>
          ))}
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Schéma § 16 odst. 9 (shrnutí kroků)</p>
          <ol style={{ margin: "0 0 12px", paddingLeft: "1.25rem" }}>
            {s4.par16AndPractical.par16FlowSummary.map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ol>
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>PHmax Praktická škola — postup a–e</p>
          <ol style={{ margin: "0 0 12px", paddingLeft: "1.25rem" }}>
            {s4.par16AndPractical.practicalPhmaxSteps.map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ol>

          <p style={{ margin: "12px 0 8px", fontSize: "0.9rem", fontWeight: 600 }}>{PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE.caption}</p>
          <div className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact" style={{ marginBottom: 16 }}>
            <table className="sd-phmax-breakdown" style={{ fontSize: "0.86rem" }}>
              <thead>
                <tr>
                  <th scope="col">Kód</th>
                  <th scope="col">Obor</th>
                  {PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE.colBands.map((h: string) => (
                    <th key={h} scope="col" className="sd-phmax-breakdown__head-num" title={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE.rows.map((r: PhmaxSsPracticalSchoolPhmaxRow) => (
                  <tr key={r.code}>
                    <td>
                      <code className="methodology-strip__code">{r.code}</code>
                    </td>
                    <td>{r.name}</td>
                    {r.values.map((v: number, j: number) => (
                      <td key={j} className="sd-phmax-breakdown__num">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: "0.82rem" }}>{PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE.footnote7}</p>

          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>PHAmax Praktická škola — postup a–e</p>
          <ol style={{ margin: "0 0 12px", paddingLeft: "1.25rem" }}>
            {s4.par16AndPractical.practicalPhamaxSteps.map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ol>
          <p style={{ margin: "12px 0 8px", fontSize: "0.9rem", fontWeight: 600 }}>{PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE.caption}</p>
          <div className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact" style={{ marginBottom: 12 }}>
            <table className="sd-phmax-breakdown" style={{ fontSize: "0.86rem" }}>
              <thead>
                <tr>
                  <th scope="col">Kód</th>
                  <th scope="col">Obor</th>
                  {PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE.colBands.map((h: string) => (
                    <th key={h} scope="col" className="sd-phmax-breakdown__head-num" title={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE.rows.map((r: PhmaxSsPracticalSchoolPhamaxRow) => (
                  <tr key={r.code}>
                    <td>
                      <code className="methodology-strip__code">{r.code}</code>
                    </td>
                    <td>{r.name}</td>
                    {r.values.map((v: number, j: number) => (
                      <td key={j} className="sd-phmax-breakdown__num">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "0.82rem" }}>{PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE.footnote8}</p>
          <p style={{ margin: "0 0 16px", fontSize: "0.82rem" }}>{s4.par16AndPractical.phamaxUnder4}</p>

          <p style={{ margin: 0, fontSize: "0.86rem" }}>{s4.closing}</p>
        </div>
      </details>

      <PhmaxSsUnitsForm model={ss} hideBackupSubcard />

      <MethodologyStrip />

      <footer className="zs-app-footer">
        <HeroStatusBar
          productLabel={PRODUCT_CALCULATOR_TITLES.ss}
          lastSavedAt=""
          notice=""
          variant="ss"
          placement="footer"
        />
        <AuthorCreditFooter />
      </footer>

      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </>
  );
}

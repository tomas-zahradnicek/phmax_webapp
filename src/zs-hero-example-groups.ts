import type { HeroExampleSelectGroup } from "./HeroExampleSelect";
import { ZS_LEGIS_PARAGRAPH_TOOLTIPS } from "./phmax-zs-legislativa";

export type ZsHeroExampleKey =
  | ""
  | "priloha_uplna_zs_sec16"
  | "priloha_zs_1st_sec16"
  | "phmax_bezna_zs"
  | "phpmax_tri_roky"
  | "psychiatricka_nemocnice"
  | "smisene_tridy"
  | "pripravna_trida"
  | "mala_skola_pod_limitem"
  | "skola_s_odecty_phpmax"
  | "inkluzivni_skola"
  | "priloha_phamax_uplna_zs_sec16_zss"
  | "pha_zss_prep_b45"
  | "zdravotnicke_zs"
  | "gymnazium_phmax"
  | "mensina_phmax";

const ZS_HERO_EXAMPLE_OPTION_TITLES: Partial<Record<Exclude<ZsHeroExampleKey, "">, string>> = {
  priloha_uplna_zs_sec16: ZS_LEGIS_PARAGRAPH_TOOLTIPS["zs-16-9"],
  priloha_zs_1st_sec16: ZS_LEGIS_PARAGRAPH_TOOLTIPS["zs-16-9"],
  smisene_tridy:
    "Smíšené třídy § 16 odst. 9 (obor C/01) a ZŠ speciální (B/01) – v metodice řádky B9–B10 vs. B26–B28 podle převažujícího oboru; součet dle přílohy (např. 570 h).",
  phmax_bezna_zs: ZS_LEGIS_PARAGRAPH_TOOLTIPS["nv123-priloha1"],
  inkluzivni_skola: `${ZS_LEGIS_PARAGRAPH_TOOLTIPS["zs-16-9"]} Kombinace běžných tříd a § 16/9; čísla se mohou lišit od modelu v příloze.`,
  psychiatricka_nemocnice:
    "Škola při psychiatrické nemocnici – samostatné tabulky PHmax pro 1. stupeň, 2. stupeň nebo společnou výuku; průměr často jako vyšší z aktuálního a předchozího sběru (dle zvoleného režimu).",
  zdravotnicke_zs:
    "ZŠ při zdravotnickém zařízení mimo psychiatrii – řádky B11–B13 metodiky ZV, pásma podle průměru žáků ve třídě.",
  gymnazium_phmax:
    "Nižší ročníky víceletého gymnázia – řádky B22–B25 metodiky; průměr žáků ve třídě určuje pásmo hodin.",
  mensina_phmax:
    "ZŠ s vyučovacím jazykem národnostní menšiny – řádky B17–B21; varianta tabulky dle typu školy.",
  pripravna_trida:
    "Přípravná třída ZŠ a přípravný stupeň ZŠ speciální – PHmax se stanovuje samostatně (mimo součet běžných řádků B1–B28).",
  priloha_phamax_uplna_zs_sec16_zss: `${ZS_LEGIS_PARAGRAPH_TOOLTIPS["zs-16-9"]} ${ZS_LEGIS_PARAGRAPH_TOOLTIPS["phamax-nv123"]}`,
  pha_zss_prep_b45:
    "PHAmax – přípravný stupeň ZŠ speciální (řádek B45). Minimálně 4 žáci ve třídě pro nenulové pásmo; jinak 0 h.",
  phpmax_tri_roky:
    "PHPmax – průměrný počet žáků za tři školní roky (nebo kratší období); část žáků lze z výpočtu vyloučit dle metodiky.",
  mala_skola_pod_limitem: "Menší škola pod limitem pro PHPmax – v metodice ZV jiná pravidla pro určení PHPmax.",
  skola_s_odecty_phpmax: "PHPmax se silnějšími odečty žáků nezapočítávaných do průměru dle metodiky.",
};

/** Skupiny ukázkových příkladů ZŠ pro hero výběr (sdílené UI). */
export const ZS_HERO_EXAMPLE_GROUPS: HeroExampleSelectGroup[] = [
  {
    label: "Příloha – modelové postupy PHmax",
    options: [
      {
        value: "priloha_uplna_zs_sec16",
        label: "Úplná ZŠ + třídy § 16/9 (obě st., 934 h dle modelu A–D)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.priloha_uplna_zs_sec16,
      },
      {
        value: "priloha_zs_1st_sec16",
        label: "ZŠ jen 1. stupeň + § 16/9 (92 h dle modelu A–D)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.priloha_zs_1st_sec16,
      },
      {
        value: "smisene_tridy",
        label: "Smíšené třídy § 16/9 + obory C/01 a B/01 (570 h, příloha)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.smisene_tridy,
      },
    ],
  },
  {
    label: "PHmax – další ukázky",
    options: [
      {
        value: "phmax_bezna_zs",
        label: "Běžná úplná ZŠ bez § 16/9 v datech (jen běžné třídy)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.phmax_bezna_zs,
      },
      {
        value: "inkluzivni_skola",
        label: "Inkluzivní škola (běžné + § 16/9, jiná čísla než v příloze)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.inkluzivni_skola,
      },
      {
        value: "psychiatricka_nemocnice",
        label: "Škola při psychiatrické nemocnici",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.psychiatricka_nemocnice,
      },
      {
        value: "zdravotnicke_zs",
        label: "ZŠ při zdravotnickém zařízení (mimo psychiatrii, B11–B13)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.zdravotnicke_zs,
      },
      {
        value: "gymnazium_phmax",
        label: "Víceleté gymnázium – nižší ročníky (B22–B25)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.gymnazium_phmax,
      },
      {
        value: "mensina_phmax",
        label: "ZŠ s jazykem národnostní menšiny (B17–B21)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.mensina_phmax,
      },
      {
        value: "pripravna_trida",
        label: "Přípravná třída",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.pripravna_trida,
      },
    ],
  },
  {
    label: "Příloha – PHAmax (asistenti pedagoga)",
    options: [
      {
        value: "priloha_phamax_uplna_zs_sec16_zss",
        label: "Úplná ZŠ § 16/9 + ZŠ speciální, rozlišení AD1/AD2 (474 h, ř. B35–B44 dle metodiky v5)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.priloha_phamax_uplna_zs_sec16_zss,
      },
      {
        value: "pha_zss_prep_b45",
        label: "Přípravný stupeň ZŠ speciální – řádek B45 (4 žáci, 20 h/třída)",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.pha_zss_prep_b45,
      },
    ],
  },
  {
    label: "PHPmax – ukázky",
    options: [
      {
        value: "phpmax_tri_roky",
        label: "Tříletý průměr + dílčí nezapočtení žáků",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.phpmax_tri_roky,
      },
      {
        value: "mala_skola_pod_limitem",
        label: "Menší škola pod limitem PHPmax",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.mala_skola_pod_limitem,
      },
      {
        value: "skola_s_odecty_phpmax",
        label: "Škola s vyššími odečty žáků",
        title: ZS_HERO_EXAMPLE_OPTION_TITLES.skola_s_odecty_phpmax,
      },
    ],
  },
];

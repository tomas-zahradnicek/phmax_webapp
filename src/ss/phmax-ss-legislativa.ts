/**
 * Tooltipy u odkazů na ustanovení (legislativa_phmax.md + NV / vyhlášky).
 * Klíč = interní id, label zobrazí SsLegisRef.
 */
export const SS_LEGIS_PARAGRAPH_TOOLTIPS: Record<string, string> = {
  "nv123-1":
    "PHmax = maximální týdenní počet hodin výuky na 1 třídu hrazený ze státního rozpočtu (NV č. 123/2018 Sb., § 1 odst. 1–2).",
  "nv123-1-3":
    "PHmax školy = součet PHmax jednotlivých tříd (NV č. 123/2018 Sb., § 1 odst. 3).",
  "nv123-priloha1":
    "Počet hodin se určuje podle pásma odpovídajícího průměrnému počtu žáků ve třídě (NV č. 123/2018 Sb., příloha č. 1).",
  "nv123-2":
    "U dalších forem vzdělávání se základ z přílohy násobí koeficientem (večerní 0,3; kombinovaná 0,26; kombinovaná u konzervatoří 0,48; dálková 0,2; distanční 0,05) — NV č. 123/2018 Sb., § 2.",
  "vyhl13-2a1":
    "Víceoborovou třídu lze zřídit jen při stejné kategorii dosaženého vzdělání, stejné formě, stejné délce vzdělávání a stejném ročníku (vyhl. č. 13/2005 Sb., § 2a odst. 1).",
  "vyhl13-2a2":
    "Kategorie E a H: nejvýše 3 obory; kategorie L a M: nejvýše 2 obory. Kategorie K: víceoborovou třídu nelze obecně zřizovat, výjimka je jen kombinace gymnázium + gymnázium se sportovní přípravou (vyhl. č. 13/2005 Sb., § 2a odst. 2 a 3, ve znění vyhl. č. 145/2018 Sb.).",
  "vyhl13-2a3":
    "Víceoborovou třídu obvykle nelze v kategorii K; výjimka: gymnázium + gymnázium se sportovní přípravou (§ 2a odst. 3).",
  "vyhl13-2c1":
    "Víceoborovou třídu lze zřídit, pokud alespoň jeden obor má méně než 17 žáků (vyhl. č. 13/2005 Sb., § 2c odst. 1); detaily i v metodice MŠMT.",
  "vyhl13-2c2":
    "Omezení počtu oborů neplatí pro obory s talentovou zkouškou a pro skupinu 82 (vyhl. č. 13/2005 Sb., § 2c odst. 2).",
  "vyhl248-16":
    "U tříd podle § 16 odst. 9 školského zákona platí zvláštní režim (vyhl. č. 248/2019 Sb.) — v aplikaci zatím jen informativně u business rules.",
  "phamax-nv123":
    "PHAmax = horní hranice hodin asistenta pedagoga; nelze převádět přebytky mezi PHmax a PHAmax; typicky praktické školy — metodika MŠMT.",
};

/** Krátké popisky pro tooltip u citací v UI. */
export const SS_LEGIS_CITE_LABELS: Record<string, string> = {
  "nv123-1": "§ 1 NV",
  "nv123-1-3": "§ 1 odst. 3 NV",
  "nv123-priloha1": "Příloha č. 1 NV",
  "nv123-2": "§ 2 NV",
  "vyhl13-2a1": "§ 2a odst. 1",
  "vyhl13-2a2": "§ 2a odst. 2",
  "vyhl13-2a3": "§ 2a odst. 3",
  "vyhl13-2c1": "§ 2c odst. 1",
  "vyhl13-2c2": "§ 2c odst. 2",
  "vyhl248-16": "§ 16 (vyhl. 248/2019)",
  "phamax-nv123": "PHAmax (NV)",
};

/** Odkazy na zakonyprolidi (pro panel „Proč“). */
export const SS_LEGIS_ZAKONY_URL: Record<string, string> = {
  nv123: "https://www.zakonyprolidi.cz/cs/2018-123",
  vyhl13: "https://www.zakonyprolidi.cz/cs/2005-13",
};

export type BruleLegisEntry = {
  citeIds: string[];
  note: string;
};

/** Mapování kódu hlášky z evaluateBusinessRules → legislativní kontext. */
export const SS_BRULE_CODE_LEGIS: Record<string, BruleLegisEntry> = {
  EMPTY_INPUT: { citeIds: [], note: "Nebyl zadán žádný obor k posouzení." },
  ONE_OBOR: { citeIds: ["nv123-1", "nv123-priloha1"], note: "Jednooborová třída — základní výpočet PHmax podle NV a datasetu." },
  PAR16_CATEGORY_MISMATCH: { citeIds: ["vyhl248-16"], note: "U třídy podle § 16 odst. 9 musí být obory ve stejné kategorii." },
  PAR16_MULTI: { citeIds: ["vyhl248-16"], note: "§ 16 odst. 9 — neuplatní se běžná pravidla víceoborových tříd z § 2a." },
  LEGACY_MULTI: { citeIds: ["vyhl13-2a2"], note: "Přechodné ustanovení — třída vzniklá do 2017/2018; omezení navyšování počtu oborů." },
  LEGACY_OVER_LIMIT: { citeIds: ["vyhl13-2a2"], note: "Počet oborů nesmí překročit stav ke dni účinnosti novely." },
  CATEGORY_MISMATCH: { citeIds: ["vyhl13-2a1"], note: "Víceoborová třída vyžaduje stejnou kategorii dosaženého vzdělání." },
  FORM_MISMATCH: { citeIds: ["vyhl13-2a1"], note: "Všechny obory ve třídě musí mít stejnou formu vzdělávání." },
  DURATION_MISMATCH: { citeIds: ["vyhl13-2a1"], note: "Stejná délka vzdělávání u všech oborů ve třídě." },
  YEAR_MISMATCH: { citeIds: ["vyhl13-2a1"], note: "Stejný ročník u všech oborů ve třídě." },
  CATEGORY_NOT_ALLOWED: { citeIds: ["vyhl13-2a1", "vyhl13-2a2"], note: "Kategorie oboru není pro běžnou víceoborovou třídu přípustná." },
  NO_UNDER_17: { citeIds: ["vyhl13-2c1"], note: "Alespoň jeden obor musí mít méně než 17 žáků." },
  PARTIAL_OVER_17: { citeIds: ["vyhl13-2c1"], note: "Kombinace oborů s 17+ žáky — zvláštní režim dle metodiky, pokud nelze třídu složit jen z oborů pod 17." },
  K_NOT_ALLOWED: { citeIds: ["vyhl13-2a3"], note: "Kategorie K — víceoborová třída jen ve výjimce gymnázium + gymnázium se sportovní přípravou." },
  ALL_TALENT: { citeIds: ["vyhl13-2c2"], note: "Talentové obory — omezení počtu oborů dle § 2a odst. 2 neplatí." },
  MIXED_TALENT_REGIME: {
    citeIds: ["vyhl13-2c2", "vyhl13-2a1"],
    note: "Kombinace oborů s/bez talentové zkoušky — plná pravidla organizace třídy dle vyhl. č. 13/2005 Sb.; u čistě talentových oborů § 2c odst. 2.",
  },
  EH_TOO_MANY: { citeIds: ["vyhl13-2a2"], note: "Kategorie E/H — nejvýše 3 obory v běžné víceoborové třídě." },
  LM_TOO_MANY: { citeIds: ["vyhl13-2a2"], note: "Kategorie L/M — nejvýše 2 obory v běžné víceoborové třídě (kategorii K řeší zvlášť § 2a odst. 3)." },
};

export function getBruleLegis(code: string): BruleLegisEntry | undefined {
  return SS_BRULE_CODE_LEGIS[code];
}

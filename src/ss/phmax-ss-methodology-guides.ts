/**
 * Textové podklady metodiky SŠ pro UI (§ 4, rozcestník, § 16, tabulky PrŠ).
 * Odděleno od `phmax-ss-constants.ts`, aby šlo bezpečněji verzovat a commitovat.
 */

/**
 * Rozcestník typu výpočtu dle metodiky MŠMT (grafické schéma — textová podoba pro kontrolu v aplikaci).
 * Čísla 1–4 odpovídají kruhům ve schématu.
 */
export const PHMAX_SS_CALCULATION_BRANCH_GUIDE = {
  title: "Rozcestník typu výpočtu (metodika)",
  lead:
    "Třídy máme rozděleny podle formy vzdělávání (a typu třídy). Níže stejná logika jako v grafickém schématu z metodiky:",
  branches: [
    {
      question: "Třída je zřízená podle § 16?",
      yesOutcome: "Výpočet pro třídy zřízené podle § 16",
      codeYes: "4",
      noContinue: "Ne → pokračujte další otázkou.",
    },
    {
      question: "Třída má jeden obor vzdělání?",
      yesOutcome: "Výpočet pro jednooborovou třídu",
      codeYes: "1",
      noContinue: "Ne → pokračujte další otázkou.",
    },
    {
      question: "Třída má více oborů vzdělání v souladu s vyhláškou č. 13/2005 Sb.?",
      yesOutcome: "Výpočet pro víceoborovou třídu",
      codeYes: "2",
      noOutcome: "Výpočet podle přechodného ustanovení NV",
      codeNo: "3",
    },
  ],
} as const;

/**
 * Postup výpočtu průměrného počtu žáků ve třídě včetně § 16 odst. 9 (denní forma — z metodiky).
 */
export const PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE = {
  title: "Průměrný počet žáků ve třídě (§ 16 odst. 9)",
  intro:
    "Nejprve se rozdělí obory vzdělání podle formy vzdělávání a typu třídy. Následně se pro daný obor a formu postupuje takto:",
  steps: [
    "Sečteme všechny žáky oboru vzdělání v jednooborových třídách denní formy vzdělávání a součet vydělíme počtem jednooborových tříd denní formy vzdělávání daného oboru vzdělání, které jsou ve škole zřízeny.",
    "Sečteme všechny žáky v oboru vzdělání v dvouoborových třídách denní formy vzdělávání a součet vydělíme počtem dvouoborových tříd denní formy vzdělávání daného oboru vzdělání, které jsou ve škole zřízeny.",
    "Sečteme všechny žáky oboru vzdělání v tříoborových třídách denní formy vzdělávání a součet vydělíme počtem tříoborových tříd daného oboru vzdělání, které jsou ve škole zřízeny.",
    "Sečteme všechny žáky oboru vzdělání v denní formě vzdělávání ve třídách zřízených podle § 16 odst. 9 a součet vydělíme počtem tříd zřízených podle § 16 odst. 9 daného oboru vzdělání, které jsou ve škole zřízeny.",
    "Tento postup použijeme pro všechny obory vzdělání a formy vzdělávání.",
  ] as const,
  exampleTitle: "Příklad (metodika)",
  exampleObor: "Obor vzdělání: Mechanik strojů a zařízení (denní forma vzdělávání)",
  exampleRows: [
    { className: "1. A", pupils: 19 },
    { className: "1. B", pupils: 21 },
    { className: "2. A", pupils: 23 },
    { className: "3. A", pupils: 18 },
  ] as const,
  exampleNote:
    "Sečteme všechny žáky uvedeného oboru v jednooborových třídách: 19 + 21 + 23 + 18 = 81. Součet vydělíme počtem tříd: 81 : 4 = 20,25.",
  exampleConclusion:
    "Průměrný počet žáků v jednooborové třídě oboru vzdělání Mechanik strojů a zařízení v denní formě vzdělávání je 20,25.",
} as const;

/** Koeficienty NV č. 123/2018 Sb., § 2 — násobek PHmax v „dalších“ formách (jednoobor i víceobor, postupy 1a / 2a). */
export const PHMAX_SS_NV123_FORM_COEFFICIENTS = [
  { label: "Večerní forma vzdělávání", value: "0,3" },
  { label: "Kombinovaná forma", value: "0,26" },
  { label: "Kombinovaná forma pro obory vzdělání konzervatoří", value: "0,48" },
  { label: "Dálková forma vzdělávání", value: "0,2" },
  { label: "Distanční forma vzdělávání", value: "0,05" },
] as const;

/** Tabulka z metodiky — PHmax podle průměru žáků (Praktická škola). */
export const PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE = {
  caption: "Údaje pro stanovení hodnoty PHmax – průměrný počet žáků ve třídě (skupina 78)",
  colBands: ["méně než 4", "4 – 6", "více než 6 – 10", "více než 10"] as const,
  rows: [
    { code: "78-62-C/02", name: "Praktická škola dvouletá", values: [23, 32, 46, 60] as const },
    { code: "78-62-C/01", name: "Praktická škola jednoletá", values: [22, 30, 41, 57] as const },
  ] as const,
  footnote7:
    "Vysvětlivka 7: V případě, že se v jedné třídě vzdělávají žáci současně podle oboru Praktická škola dvouletá a Praktická škola jednoletá, stanoví se maximální počet hodin podle toho oboru, v němž se vzdělává vyšší počet žáků. Je-li u obou oborů stejný počet žáků, použije se Praktická škola dvouletá.",
} as const;

/** Tabulka z metodiky — PHAmax (asistent pedagoga), Praktická škola. */
export const PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE = {
  caption:
    "Údaje pro stanovení hodnoty maximálního počtu hodin výuky s asistentem pedagoga – průměrný počet žáků ve třídě (skupina 78)",
  colBands: ["méně než 4", "4 – méně než 6", "6 – 10", "Více než 10"] as const,
  rows: [
    { code: "78-62-C/02", name: "Praktická škola dvouletá", values: [0, 24, 32, 48] as const },
    { code: "78-62-C/01", name: "Praktická škola jednoletá", values: [0, 23, 30, 43] as const },
  ] as const,
  footnote8:
    "Vysvětlivka 8: Při současné výuce Praktická škola dvouletá a jednoletá v jedné třídě platí stejná pravidla výběru oboru jako u PHmax (vyšší počet žáků; při shodě Praktická škola dvouletá).",
} as const;

/**
 * § 4 metodiky — stanovení PHmax / souvislosti PHAmax (textová podoba ke grafům z přílohy).
 * Slouží ke kontrole vůči oficiálnímu dokumentu; výpočetní jádro aplikace vychází z datasetu.
 */
export const PHMAX_SS_SECTION4_PHMAX_GUIDE = {
  title: "4. Stanovení PHmax pro obory středního vzdělávání",
  lead:
    "Následující odstavce odpovídají struktuře metodiky (včetně odkazů 1, 1a, 2, 2a, 3, 4). Grafické schémata jsou nahrazena výčtem kroků vhodným pro údržbu v repozitáři.",
  jednooborDaily: {
    title: "1 — PHmax pro jednooborové třídy (denní forma)",
    paragraphs: [
      "PHmax oboru v jednooborové třídě se rovná hodnotě PHmax v NV pro stanovený průměrný počet žáků, vynásobené počtem jednooborových tříd daného oboru a formy vzdělávání.",
      "Pro třídy s průměrným počtem žáků vyšším než 30 se použijí hodnoty pásma „více než 27“ žáků.",
      "Do průměru pro stanovení PHmax jednooborové třídy se nezapočítává počet žáků daného oboru ve třídě, kde se vzdělávají žáci více oborů vzdělání (výjimka z metodiky).",
    ] as const,
    flowSummary: [
      "Obor je ve třídě samostatně → jednooborová třída.",
      "Vypočítáme průměrný počet žáků oboru ve třídě.",
      "K průměru přiřadíme pásmo v NV (pásma PHmax pro jednooborové třídy).",
      "V pásmu vyhledáme hodnotu pro daný obor.",
      "Hodnotu vynásobíme počtem tříd oboru.",
      "Má třída denní formu? Ano → výsledek PHmax jednooborové třídy. Ne → pokračuje postup 1a (koeficienty).",
    ] as const,
  },
  jednooborOtherForms: {
    title: "1a — PHmax jednooborové třídy v dalších formách vzdělávání",
    paragraphs: [
      "Vychází se z PHmax pro jednooborovou třídu v denní formě, který se vynásobí koeficientem příslušné formy (NV č. 123/2018 Sb., § 2).",
      "Rozhodovací tok (graf metodiky): postupně se zjišťuje kombinovaná → dálková → večerní → distanční forma; při prvním „ano“ se použije příslušný koeficient a výsledkem je PHmax jednooborové třídy v dané formě.",
    ] as const,
  },
  multiDaily: {
    title: "2 — PHmax pro víceoborové třídy (v souladu s vyhl. č. 13/2005 Sb.)",
    paragraphs: [
      "Výsledné PHmax oboru ve víceoborové třídě = hodnota PHmax v NV pro stanovený průměr žáků × počet příslušných víceoborových tříd daného oboru a formy.",
      "Postup platí i u třídy, kde jeden obor má 17 a více žáků a druhý méně, pokud celkový součet nepřekročí nejvyšší povolený počet žáků ve třídě.",
      "PHmax oboru závisí na průměru žáků daného oboru připadajícím na jednu víceoborovou třídu v tomto oboru.",
    ] as const,
    flowSummary: [
      "Obor je ve třídě s více obory → rozhodnutí, zda organizace vyhovuje vyhl. č. 13/2005 Sb.",
      "Ne → odkaz na postup 3 (přechodné ustanovení). Ano → obory roztřídit na dvou-, tří- a čtyř a víceoborové.",
      "Sečíst žáky každého oboru zvlášť pro každý typ třídy a vydělit počtem tříd.",
      "K průměru přiřadit pásmo dle NV (pásma pro dvou-, tří- a víceoborové).",
      "Hodnotu vynásobit počtem tříd oboru.",
      "Denní forma? Ano → PHmax oborů ve víceoborové třídě. Ne → postup 2a (stejné koeficienty jako u 1a).",
    ] as const,
  },
  multiOtherForms: {
    title: "2a — PHmax víceoborové třídy v dalších formách vzdělávání",
    paragraphs: [
      "Nejprve se stanoví PHmax podle typu třídy (denní výpočet), poté se výsledek vynásobí koeficientem formy — stejná sada koeficientů jako u bodu 1a.",
    ] as const,
  },
  transitional: {
    title: "3 — Víceoborová třída podle přechodného ustanovení (vyhl. č. 145/2018 Sb.)",
    paragraphs: [
      "Jde o třídy s více obory, než připouští vyhláška č. 13/2005 Sb., zřízené v souladu s přechodným ustanovením.",
      "U nejnaplněnějších oborů se použije výpočet pro víceoborovou třídu; u oborů „nad rámec“ výpočet pro jednooborovou třídu. Při stejném počtu žáků lze obory seřadit výhodněji z hlediska výsledného PHmax.",
      "Zjednodušeně: u přechodné třídy nemá na výpočet vliv rozdílná kategorie dosaženého vzdělání, ročník ani délka vzdělávání — obory se seřadí podle počtu žáků od nejvyššího po nejnižší.",
      "Dvouoborová kombinace kategorií C, J, E, H, L, M nebo K: pro E, H, L, M, K hodnoty pro dvouoborovou třídu; pro C, J hodnoty pro jednooborovou třídu.",
      "Tří a více oborů, přičemž alespoň jeden obor je E nebo H (mohou být i C, J, L, M, K): první tři nejnaplněnější obory podle pravidel víceoborové třídy; každý další podle jednooborové třídy. U těch tří nejvyšších: kategorie E a H → tabulka pro tříoborovou třídu; kategorie L, M, K → tabulka pro dvouoborovou třídu; kategorie C a J → vždy jednooborová třída.",
    ] as const,
    flowSummary: [
      "Vstup: obory ve třídě s více obory dle přechodného ustanovení.",
      "Seřadit obory podle počtu žáků sestupně.",
      "První dva/tři nejvyšší podle pravidel víceoborové třídy (dle kategorie viz text výše).",
      "Každý další obor podle výpočtu jednooborové třídy.",
    ] as const,
  },
  par16AndPractical: {
    title: "4 — § 16 odst. 9 školského zákona, ústavní / ochranná výchova, Praktická škola",
    paragraphs: [
      "PHmax pro obory kategorie C, J se stanoví jako v jednooborové třídě; obory C, J mají vlastní PHmax v NV.",
      "Společná třída Praktická škola jednoletá a dvouletá: PHmax podle oboru s vyšším počtem žáků; při shodě podle Praktická škola dvouletá.",
      "PHmax ve střední škole nebo třídě SŠ zřízené podle § 16 odst. 9 se stanoví podle údajů pro denní formu příslušných oborů v jednooborových třídách; u konzervatoří obdobně podle denní formy v konzervatoři.",
      "Mapování průměru žáků ve třídě: při průměru 6–10 žáků použít sloupec odpovídající pásmu 17–20; při průměru více než 10 do 14 žáků sloupec „více než 20–24“; při méně než 6 žácích 70 % hodnoty ze sloupce 17–20.",
    ] as const,
    par16FlowSummary: [
      "Třída podle § 16 odst. 9.",
      "Je třída jednooborová? Ne → rozdělit víceoborovou třídu na jednotlivé obory. Ano → dál.",
      "Vypočítat průměr žáků v oboru podle typu třídy.",
      "Podle průměru přiřadit pásmo (včetně pravidel >10, 6–10, <6 s 70 %).",
      "Ve vybraném pásmu najít PHmax pro obor, vynásobit počtem tříd oboru.",
    ] as const,
    practicalPhmaxSteps: [
      "a) stanovit příslušný RVP,",
      "b) určit průměrný počet žáků ve třídě,",
      "c) přiřadit hodnotu PHmax pro charakteristiku třídy,",
      "d) vynásobit počtem tříd a PHmax,",
      "e) sečíst dílčí PHmax z bodu d).",
    ] as const,
    practicalPhamaxSteps: [
      "a) stanovit příslušný RVP,",
      "b) určit průměrný počet žáků ve třídě,",
      "c) přiřadit hodnotu PHAmax pro charakteristiku třídy,",
      "d) vynásobit počtem tříd a PHAmax,",
      "e) sečíst dílčí PHAmax z bodu d).",
    ] as const,
    phamaxUnder4:
      "PHAmax: ve třídě s méně než 4 žáky maximální počet hodin s asistentem pedagoga stanoven není (samostatné schéma v metodice).",
  } as const,
  closing:
    "Organizace tříd ve středním vzdělávání je v souladu s vyhláškou č. 13/2005 Sb.; kontrolu provádí Česká školní inspekce. V aplikaci volba „Kombinovaná (konzervatoř)“ odpovídá koeficientu 0,48 v datech (`phmax-ss-dataset.json`).",
} as const;

export type PhmaxSsCalcBranch = (typeof PHMAX_SS_CALCULATION_BRANCH_GUIDE.branches)[number];
export type PhmaxSsPar16ExampleRow = (typeof PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE.exampleRows)[number];
export type PhmaxSsNv123FormCoefficient = (typeof PHMAX_SS_NV123_FORM_COEFFICIENTS)[number];
export type PhmaxSsPracticalSchoolPhmaxRow = (typeof PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE.rows)[number];
export type PhmaxSsPracticalSchoolPhamaxRow = (typeof PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE.rows)[number];

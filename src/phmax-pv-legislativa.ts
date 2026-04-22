/** Tooltipy a odkazy – předškolní vzdělávání (metodika PHmax/PHAmax PV v4). */
export const PV_LEGIS_PARAGRAPH_TOOLTIPS: Record<string, string> = {
  "pv-nv123":
    "NV č. 123/2018 Sb. stanovuje rámec PHmax (max. týdenní hodiny na třídu hrazené ze SR); konkrétní pásma pro PV vycházejí z metodické přílohy (tabulky 1–3).",
  "pv-vyhl14":
    "Vyhláška č. 14/2005 Sb. o předškolním vzdělávání – prováděcí předpis včetně pravidel pro organizaci a výjimky z nejnižšího počtu dětí.",
  "pv-metodika-t13":
    "Metodika MŠMT pro PV: podle druhu provozu (polodenní, celodenní, internátní) se vybere tabulka 1, 2 nebo 3; řádek = počet tříd, sloupec = pásmo průměrné denní doby.",
  "pv-1d3":
    "§ 1d odst. 3 vyhl. č. 14/2005 Sb. – při nesplnění nejnižšího počtu dětí může krajský úřad určit nižší PHmax; tato kalkulačka krácení automaticky neprovádí.",
  "pv-zdr31":
    "Zdravotnický kmen (mateřská škola při zdravotnickém zařízení) – v metodice PV pevná hodnota PHmax na třídu (31 h); PHAmax podle samostatné tabulky.",
};

export const PV_LEGIS_ZAKONY_URL = {
  nv123: "https://www.zakonyprolidi.cz/cs/2018-123",
  vyhl14: "https://www.zakonyprolidi.cz/cs/2005-14",
  msmtPv: "https://edu.gov.cz/methodology/metodika-stanoveni-phmax-a-phamax-pro-predskolni-vzdelavani/",
} as const;

export const SCHOOL_TYPE_CODES = [
  "ZAKLADNI_SKOLA",
  "STREDNI_SKOLA",
  "KONZERVATOR",
  "VYSSI_ODBORNA_SKOLA",
  "MATERSKA_SKOLA",
  "ZAKLADNI_UMELECKA_SKOLA",
  "JAZYKOVA_SKOLA_S_PRAVEM_STATNI_JAZYKOVE_ZKOUSKY",
  "SKOLSKE_ZARIZENI",
  "JINE",
] as const;

export type SchoolTypeCode = (typeof SCHOOL_TYPE_CODES)[number];

export const SCHOOL_TYPE_LABELS: Record<SchoolTypeCode, string> = {
  ZAKLADNI_SKOLA: "Základní škola",
  STREDNI_SKOLA: "Střední škola",
  KONZERVATOR: "Konzervatoř",
  VYSSI_ODBORNA_SKOLA: "Vyšší odborná škola",
  MATERSKA_SKOLA: "Mateřská škola",
  ZAKLADNI_UMELECKA_SKOLA: "Základní umělecká škola",
  JAZYKOVA_SKOLA_S_PRAVEM_STATNI_JAZYKOVE_ZKOUSKY: "Jazyková škola s právem státní jazykové zkoušky",
  SKOLSKE_ZARIZENI: "Školské zařízení",
  JINE: "Jiné / neuvedené",
};

export const SCHOOL_TYPE_SELECT_OPTIONS: ReadonlyArray<{ value: SchoolTypeCode; label: string }> = SCHOOL_TYPE_CODES.map(
  (code) => ({
    value: code,
    label: SCHOOL_TYPE_LABELS[code],
  }),
);

const SCHOOL_TYPE_ALIASES: ReadonlyArray<{ code: SchoolTypeCode; aliases: readonly string[] }> = [
  {
    code: "ZAKLADNI_SKOLA",
    aliases: ["zakladni skola", "zakladni", "zs", "základní škola"],
  },
  {
    code: "STREDNI_SKOLA",
    aliases: ["stredni skola", "stredni", "ss", "sš", "střední škola"],
  },
  {
    code: "KONZERVATOR",
    aliases: ["konzervator", "konzervatoř"],
  },
  {
    code: "VYSSI_ODBORNA_SKOLA",
    aliases: ["vyssi odborna skola", "vyšší odborná škola", "vos", "voš"],
  },
  {
    code: "MATERSKA_SKOLA",
    aliases: ["materska skola", "mateřská škola", "ms", "mš"],
  },
  {
    code: "ZAKLADNI_UMELECKA_SKOLA",
    aliases: ["zakladni umelecka skola", "základní umělecká škola", "zus", "zuš"],
  },
  {
    code: "JAZYKOVA_SKOLA_S_PRAVEM_STATNI_JAZYKOVE_ZKOUSKY",
    aliases: [
      "jazykova skola s pravem statni jazykove zkousky",
      "jazyková škola s právem státní jazykové zkoušky",
      "jazykova skola",
      "jazyková škola",
    ],
  },
  {
    code: "SKOLSKE_ZARIZENI",
    aliases: [
      "skolske zarizeni",
      "školské zařízení",
      "skolni druzina",
      "školní družina",
      "skolni klub",
      "školní klub",
    ],
  },
  {
    code: "JINE",
    aliases: ["jine", "jiné", "neuvedene", "neuvedené"],
  },
];

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveSchoolTypeCode(value: string | null | undefined): SchoolTypeCode | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if ((SCHOOL_TYPE_CODES as readonly string[]).includes(trimmed)) {
    return trimmed as SchoolTypeCode;
  }

  const normalized = normalizeForMatch(trimmed);
  for (const item of SCHOOL_TYPE_ALIASES) {
    if (item.aliases.some((alias) => normalizeForMatch(alias) === normalized)) {
      return item.code;
    }
  }

  return "JINE";
}

export function getSchoolTypeSelectValue(value: string | null | undefined): SchoolTypeCode {
  return resolveSchoolTypeCode(value) ?? "JINE";
}

export function getSchoolTypeLabel(value: string | null | undefined): string {
  const code = resolveSchoolTypeCode(value);
  if (!code) return "";
  return SCHOOL_TYPE_LABELS[code];
}

export function toSchoolTypeStorageValue(code: SchoolTypeCode): string {
  return SCHOOL_TYPE_LABELS[code];
}

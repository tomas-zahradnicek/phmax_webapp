import type { Nv75DeputyKind } from "../nv75-deputy-bank";

export const NV75_DEPUTY_KIND_OPTIONS: readonly { value: Nv75DeputyKind; label: string }[] = [
  { value: "ms", label: "MŠ (příl. 2)" },
  { value: "ms_internat", label: "MŠ internátní / SPC (příl. 2)" },
  { value: "zs", label: "ZŠ (příl. 2)" },
  { value: "ss_konz", label: "SŠ a konzervatoř (příl. 2)" },
  { value: "sd", label: "Školní družina (příl. 2)" },
  { value: "internat", label: "Internát (příl. 3)" },
  { value: "zus_individual", label: "ZUŠ – zástupce (individuální výuka) (příl. 3)" },
  { value: "zus_group", label: "ZUŠ – zástupce (skupinová/kolektivní) (příl. 3)" },
  { value: "jazykova", label: "Jazyková škola s právem SJZ (příl. 3)" },
  { value: "ustavni", label: "ŠZ pro ústavní/ochrannou výchovu (příl. 3)" },
  { value: "domov_mladeze", label: "Domov mládeže (příl. 3)" },
  { value: "poradenske", label: "Školské poradenské zařízení (příl. 3)" },
  { value: "vos", label: "Vyšší odborná škola (příl. 3)" },
  { value: "skolni_klub", label: "Školní klub (příl. 3)" },
];

export const NV75_KIND_LABEL: Record<Nv75DeputyKind, string> = Object.fromEntries(
  NV75_DEPUTY_KIND_OPTIONS.map((x) => [x.value, x.label]),
) as Record<Nv75DeputyKind, string>;

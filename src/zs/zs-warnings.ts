import type { BasicType } from "../phmax-zs-logic";
import { B17_B21 } from "../phmax-zs-logic";

export type ZsWarningsInput = {
  basicType: BasicType;
  basic1Classes: number;
  basic2Classes: number;
  phpExcludedTotal: number;
  phpBaseValue: number;
  phpExcludedSchool: boolean;
  phpAdjustedValue: number;
  minorityType: keyof typeof B17_B21;
  minority2Classes: number;
};

export function buildZsWarnings(input: ZsWarningsInput): string[] {
  const items: string[] = [];
  if (input.basicType === "full_max_2" && input.basic1Classes > 0 && input.basic1Classes < 5) {
    items.push("U úplné ZŠ s nejvýše 2 třídami v každém ročníku bývá obvykle na 1. stupni nejméně 5 běžných tříd.");
  }
  if (input.basicType.startsWith("first_only_") && input.basic2Classes > 0) {
    items.push("U neúplné ZŠ tvořené jen 1. stupněm se 2. stupeň do výpočtu běžných tříd nezadává.");
  }
  if (input.phpExcludedTotal > input.phpBaseValue && !input.phpExcludedSchool) {
    items.push("Součet nezapočítávaných žáků je vyšší než rozhodná hodnota pro PHPmax – metodický výpočet.");
  }
  if (input.phpAdjustedValue > 0 && input.phpAdjustedValue < 180 && !input.phpExcludedSchool) {
    items.push("PHPmax – metodický výpočet vychází 0, protože očištěný rozhodný počet žáků je pod hranicí 180.");
  }
  if (input.phpExcludedSchool) {
    items.push("Škola je označena jako vyloučená z PHPmax – metodický výpočet, proto je výsledek 0.");
  }
  if (input.minorityType !== "minorityFull1" && input.minority2Classes > 0) {
    items.push("U menšinové školy zadané jen pro 1. stupeň se 2. stupeň nezapočítá.");
  }
  return items;
}

import { useCallback, useState } from "react";
import {
  readCalculatorFocusMode,
  writeCalculatorFocusMode,
  type CalculatorFocusMode,
} from "./calculator-focus-mode";

export function useCalculatorFocusMode(): readonly [CalculatorFocusMode, (mode: CalculatorFocusMode) => void] {
  const [mode, setMode] = useState<CalculatorFocusMode>(() => readCalculatorFocusMode());

  const setFocusMode = useCallback((next: CalculatorFocusMode) => {
    setMode(next);
    writeCalculatorFocusMode(next);
  }, []);

  return [mode, setFocusMode] as const;
}

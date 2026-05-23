import React, { useState } from "react";
import { selectInputContents } from "./integer-input";
import {
  clampNumber,
  formatNumericInputDisplay,
  parseNumericInput,
  sanitizeNumericInputString,
} from "./numeric-input";

type NumericInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Když true (výchozí), nula se v poli zobrazí prázdně. */
  emptyWhenZero?: boolean;
};

/** Vstup pro desetinná čísla bez úvodních nul v celé části (např. 10 místo 010). */
export function NumericInput({
  value,
  onChange,
  min,
  max,
  emptyWhenZero = true,
  className,
  disabled,
  onFocus,
  onBlur,
  ...rest
}: NumericInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const formatted = formatNumericInputDisplay(value, emptyWhenZero);
  const displayValue = draft ?? formatted;

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      className={className}
      value={displayValue}
      onFocus={(event) => {
        setDraft(formatted);
        selectInputContents(event);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (draft === "") {
          onChange(min !== undefined ? min : 0);
        }
        setDraft(null);
        onBlur?.(event);
      }}
      onChange={(event) => {
        const sanitized = sanitizeNumericInputString(event.target.value);
        setDraft(sanitized);
        if (sanitized === "") return;
        onChange(clampNumber(parseNumericInput(sanitized), min, max));
      }}
    />
  );
}

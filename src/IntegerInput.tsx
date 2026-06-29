import React, { useState } from "react";
import {
  clampInteger,
  formatIntegerInputDisplay,
  parseIntegerInput,
  selectInputContents,
} from "./integer-input";

type IntegerInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Když true, nula se v poli zobrazí prázdně. */
  emptyWhenZero?: boolean;
};

/** Vstup pro celá čísla bez úvodních nul (např. 20 místo 020). */
export function IntegerInput({
  value,
  onChange,
  min,
  max,
  emptyWhenZero = false,
  className,
  disabled,
  onFocus,
  onBlur,
  ...rest
}: IntegerInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const formatted =
    emptyWhenZero && (!Number.isFinite(value) || value === 0)
      ? ""
      : formatIntegerInputDisplay(value);
  const displayValue = draft ?? formatted;

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
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
        const raw = event.target.value.replace(/[^\d]/g, "");
        setDraft(raw);
        if (raw === "") return;
        onChange(clampInteger(parseIntegerInput(raw), min, max));
      }}
    />
  );
}

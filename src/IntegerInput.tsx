import React from "react";
import { clampInteger, formatIntegerInputDisplay, parseIntegerInput } from "./integer-input";

type IntegerInputProps = Omit<
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

/** Vstup pro celá čísla bez úvodních nul (např. 20 místo 020). */
export function IntegerInput({
  value,
  onChange,
  min,
  max,
  emptyWhenZero = true,
  className,
  disabled,
  ...rest
}: IntegerInputProps) {
  const displayValue =
    emptyWhenZero && (!Number.isFinite(value) || value === 0)
      ? ""
      : formatIntegerInputDisplay(value);

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      className={className}
      value={displayValue}
      onChange={(e) => {
        const next = clampInteger(parseIntegerInput(e.target.value), min, max);
        onChange(next);
      }}
    />
  );
}

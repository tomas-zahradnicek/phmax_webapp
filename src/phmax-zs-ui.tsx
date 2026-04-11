import React from "react";

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  disabled?: boolean;
};

type ResultCardProps = {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "primary" | "success" | "warning";
  hint?: string;
};

const toneMeta: Record<NonNullable<ResultCardProps["tone"]>, string> = {
  default: "Vstup",
  primary: "Mezivýsledek",
  success: "Výsledek",
  warning: "Upozornění",
};

function HintBadge({ text }: { text: string }) {
  return (
    <span className="help-hint help-hint--ui" title={text} aria-label={text}>
      i
    </span>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  hint,
  disabled = false,
}: NumberFieldProps) {
  const isEmptyLikeZero = value === 0;

  return (
    <label className="number-field">
      <span className="number-field__label">
        <span>{label}</span>
        {hint ? <HintBadge text={hint} /> : null}
      </span>

      <div className="number-field__control">
        <input
          className={`number-field__input${isEmptyLikeZero ? " is-empty" : ""}`}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const next = raw === "" ? 0 : Number(raw);
            onChange(Number.isFinite(next) ? next : 0);
          }}
        />
        <div className="number-field__suffix">číslo</div>
      </div>

      <div className="number-field__meta">
        <span className="number-field__hint">
          {hint ?? "Zadejte počet pro výpočet."}
        </span>

        {value > 0 ? (
          <button
            type="button"
            className="number-field__clear"
            onClick={(e) => {
              e.preventDefault();
              onChange(0);
            }}
            title="Vymazat hodnotu"
          >
            Vymazat
          </button>
        ) : null}
      </div>
    </label>
  );
}

export function ResultCard({
  label,
  value,
  tone = "default",
  hint,
}: ResultCardProps) {
  return (
    <div className={`result-card result-card--${tone}`}>
      <div className="result-card__head">
        <div>
          <div className="result-card__type">{toneMeta[tone]}</div>
          <div className="result-card__label">{label}</div>
        </div>
        {hint ? <HintBadge text={hint} /> : null}
      </div>

      <div className="result-card__value">{value}</div>
    </div>
  );
}

export default {
  NumberField,
  ResultCard,
};

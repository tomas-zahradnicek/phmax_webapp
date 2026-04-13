import React from "react";

const INPUT_OUTPUT_LEGEND_TEXT =
  "Oranžový okraj značí pole k vyplnění; šedý levý pruh u karty značí dopočítanou hodnotu, kterou nelze přímo měnit.";

const INPUT_OUTPUT_LEGEND_ARIA = "Legenda: vstupní pole oproti výstupním hodnotám";

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

type MethodStep = "a" | "b" | "c" | "d" | "warning";

function HintBadge({ text }: { text: string }) {
  return (
    <span className="help-hint help-hint--ui" title={text} aria-label={text}>
      i
    </span>
  );
}

function inferMethodStep(label: string, tone: NonNullable<ResultCardProps["tone"]>): MethodStep {
  const value = label.toLowerCase();

  if (tone === "warning") return "warning";

  if (
    value.includes("výsledek") ||
    value.includes("celkem") ||
    value.includes("počet tříd ×") ||
    value.includes("přehledový součet")
  ) {
    return "d";
  }

  if (
    value.includes("pásmo") ||
    value.includes("na 1 třídu") ||
    value.includes("zařazení do pásma") ||
    value.includes("hodnota podle pásma") ||
    value.includes("základní tabulky")
  ) {
    return "c";
  }

  if (
    value.includes("průměr") ||
    value.includes("rozhodná hodnota") ||
    value.includes("očištěná hodnota") ||
    value.includes("součet nezapočítávaných")
  ) {
    return "b";
  }

  return "a";
}

function stepMeta(step: MethodStep) {
  if (step === "a") {
    return {
      text: "Krok A · vstupní údaje",
      className: "result-card__type result-card__type--a",
    };
  }

  if (step === "b") {
    return {
      text: "Krok B · průměrný počet žáků",
      className: "result-card__type result-card__type--b",
    };
  }

  if (step === "c") {
    return {
      text: "Krok C · pásmo a PHmax",
      className: "result-card__type result-card__type--c",
    };
  }

  if (step === "d") {
    return {
      text: "Krok D · výsledná hodnota",
      className: "result-card__type result-card__type--d",
    };
  }

  return {
    text: "Upozornění",
    className: "result-card__type result-card__type--warning",
  };
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
    <label className="number-field number-field--entry">
      <span className="number-field__label">
        <span>{label}</span>
        {hint ? <HintBadge text={hint} /> : null}
      </span>

      <div className="number-field__control number-field__control--large">
        <input
          className={`number-field__input${isEmptyLikeZero ? " is-empty" : ""}${disabled ? " is-disabled" : ""}`}
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
  const step = inferMethodStep(label, tone);
  const meta = stepMeta(step);

  return (
    <div className={`result-card result-card--output result-card--${tone} result-card--step-${step}`}>
      <div className="result-card__head">
        <div>
          <div className={meta.className}>{meta.text}</div>
          <div className="result-card__label">{label}</div>
        </div>
        {hint ? <HintBadge text={hint} /> : null}
      </div>

      <div className="result-card__value">{value}</div>
    </div>
  );
}

type InputOutputLegendProps = {
  /** Menší odsazení a písmo – např. u přilepeného souhrnu výsledků */
  compact?: boolean;
  className?: string;
};

export function InputOutputLegend({ compact = false, className = "" }: InputOutputLegendProps) {
  const rootClass = ["input-output-legend", compact ? "input-output-legend--compact" : "", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} role="note" aria-label={INPUT_OUTPUT_LEGEND_ARIA}>
      <p className="input-output-legend__text">{INPUT_OUTPUT_LEGEND_TEXT}</p>
      <div className="input-output-legend__swatches" aria-hidden="true">
        <span className="input-output-legend__swatch input-output-legend__swatch--entry">
          <span className="input-output-legend__swatch-label">Zadání</span>
        </span>
        <span className="input-output-legend__swatch input-output-legend__swatch--output">
          <span className="input-output-legend__swatch-label">Výsledek</span>
        </span>
      </div>
    </div>
  );
}

export default {
  NumberField,
  ResultCard,
  InputOutputLegend,
};

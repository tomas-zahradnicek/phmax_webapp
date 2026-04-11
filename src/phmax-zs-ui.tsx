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

function cardBaseStyle() {
  return {
    borderRadius: 18,
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  } as React.CSSProperties;
}

function labelStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    letterSpacing: "0.01em",
  } as React.CSSProperties;
}

function hintBadge(text: string) {
  return (
    <span
      title={text}
      aria-label={text}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#e2e8f0",
        color: "#0f172a",
        fontSize: 11,
        fontWeight: 800,
        cursor: "help",
        flex: "0 0 auto",
      }}
    >
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
    <label
      style={{
        display: "block",
        padding: 14,
        ...cardBaseStyle(),
      }}
    >
      <span style={labelStyle()}>
        <span>{label}</span>
        {hint ? hintBadge(hint) : null}
      </span>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
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
          style={{
            width: "100%",
            appearance: "none",
            borderRadius: 14,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: disabled
              ? "rgba(241,245,249,0.85)"
              : isEmptyLikeZero
              ? "rgba(248,250,252,1)"
              : "rgba(255,255,255,1)",
            color: "#0f172a",
            fontSize: 18,
            lineHeight: 1.2,
            fontWeight: 700,
            padding: "14px 44px 14px 14px",
            outline: "none",
            boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            fontWeight: 700,
            color: isEmptyLikeZero ? "#94a3b8" : "#64748b",
            pointerEvents: "none",
          }}
        >
          číslo
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          minHeight: 18,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#64748b",
          }}
        >
          {hint ?? "Zadejte počet pro výpočet."}
        </span>

        {value > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange(0);
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563eb",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
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

function resultTone(tone: ResultCardProps["tone"]) {
  if (tone === "primary") {
    return {
      background: "linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(59,130,246,0.16) 100%)",
      border: "1px solid rgba(37,99,235,0.22)",
      accent: "#1d4ed8",
    };
  }

  if (tone === "success") {
    return {
      background: "linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(34,197,94,0.14) 100%)",
      border: "1px solid rgba(22,163,74,0.18)",
      accent: "#15803d",
    };
  }

  if (tone === "warning") {
    return {
      background: "linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(251,191,36,0.16) 100%)",
      border: "1px solid rgba(245,158,11,0.20)",
      accent: "#b45309",
    };
  }

  return {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 100%)",
    border: "1px solid rgba(148,163,184,0.22)",
    accent: "#0f172a",
  };
}

export function ResultCard({
  label,
  value,
  tone = "default",
  hint,
}: ResultCardProps) {
  const theme = resultTone(tone);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        background: theme.background,
        border: theme.border,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
        minHeight: 104,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.35,
            fontWeight: 700,
            color: "#475569",
          }}
        >
          {label}
        </div>
        {hint ? hintBadge(hint) : null}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 28,
          lineHeight: 1.1,
          fontWeight: 800,
          color: theme.accent,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default {
  NumberField,
  ResultCard,
};

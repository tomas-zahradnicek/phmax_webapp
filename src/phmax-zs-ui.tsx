import React from "react";

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

export function ResultCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="result-card">
      <div className="result-label">{label}</div>
      <div className="result-value">{value}</div>
      {sub ? <div className="result-sub">{sub}</div> : null}
    </div>
  );
}

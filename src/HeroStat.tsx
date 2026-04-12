import React from "react";

export function HeroStat({
  label,
  value,
  compact,
}: {
  label: string;
  value: React.ReactNode;
  /** Menší karty v hero (PV, ŠD). */
  compact?: boolean;
}) {
  return (
    <div className={["hero-stat", compact ? "hero-stat--compact" : ""].filter(Boolean).join(" ")}>
      <div className="hero-stat__label">{label}</div>
      <div className="hero-stat__value">{value}</div>
    </div>
  );
}

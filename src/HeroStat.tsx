import React from "react";

export function HeroStat({
  label,
  value,
  compact,
  title,
}: {
  label: string;
  value: React.ReactNode;
  /** Menší karty v hero (PV, ŠD). */
  compact?: boolean;
  /** Volitelný tooltip (nativní `title`). */
  title?: string;
}) {
  return (
    <div
      className={["hero-stat", compact ? "hero-stat--compact" : ""].filter(Boolean).join(" ")}
      title={title}
    >
      <div className="hero-stat__label">{label}</div>
      <div className="hero-stat__value">{value}</div>
    </div>
  );
}

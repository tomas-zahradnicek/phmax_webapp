import React from "react";

export function HeroStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat__label">{label}</div>
      <div className="hero-stat__value">{value}</div>
    </div>
  );
}

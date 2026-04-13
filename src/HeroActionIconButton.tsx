import type { ButtonHTMLAttributes, ReactNode } from "react";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function IconPrint() {
  return (
    <svg {...iconProps}>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
    </svg>
  );
}

export function IconPrintSummary() {
  return (
    <svg {...iconProps}>
      <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5l2 2h7a2 2 0 012 2v12a2 2 0 01-2 2z" />
    </svg>
  );
}

export function IconSaveQuick() {
  return (
    <svg {...iconProps}>
      <path d="M4 4a2 2 0 012-2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      <path d="M14 2v4h4M12 11v6M9 14h6" />
    </svg>
  );
}

export function IconRestoreQuick() {
  return (
    <svg {...iconProps}>
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}

export function IconClearStored() {
  return (
    <svg {...iconProps}>
      <path d="M8 6h8M6 6h2m0 0l1 14h8l1-14M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export function IconResetAll() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

export function IconCsv() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" />
      <text
        x="12"
        y="16.2"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        style={{
          fontSize: "7px",
          fontWeight: 800,
          fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
          letterSpacing: "-0.02em",
        }}
      >
        CSV
      </text>
    </svg>
  );
}

export function IconExcel() {
  return (
    <svg {...iconProps}>
      {/* Tabulka (sešit) + X jako typický odkaz na formát Excel */}
      <rect x="3" y="4" width="18" height="16" rx="1.25" />
      <path d="M3 9h18M3 14h18M9 4v16M15 4v16" />
      <path d="M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

export function IconCopy() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export function IconSpinner() {
  return (
    <svg {...iconProps} className="hero-action-icon-btn__spinner">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
    </svg>
  );
}

export type HeroIconActionButtonProps = {
  label: string;
  icon: ReactNode;
  className?: string;
  /** Na širokém panelu zůstane viditelný text (např. stav „Připravuji…“). */
  showLabel?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label">;

export function HeroIconActionButton({
  label,
  icon,
  className = "",
  showLabel = false,
  title,
  type = "button",
  ...rest
}: HeroIconActionButtonProps) {
  const btnClass = [
    "btn",
    "hero-action-icon-btn",
    showLabel ? "hero-action-icon-btn--show-label" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={btnClass} aria-label={label} {...rest} title={title ?? label}>
      {icon}
      <span className="hero-action-icon-btn__label">{label}</span>
    </button>
  );
}

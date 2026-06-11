import React from "react";
import { CS_HOURS_PER_WEEK_SHORT, formatCsNumberOrDash } from "../cs-format";
import type { DashboardSchoolProfileModel } from "./build-dashboard-school-profile";

type DashboardSchoolProfileProps = {
  profile: DashboardSchoolProfileModel;
  onModuleChipClick: (id: DashboardSchoolProfileModel["moduleChips"][number]["id"]) => void;
  onPrintProfile?: () => void;
};

function csModulesInUseLabel(count: number): string {
  if (count === 1) return "modul v provozu";
  if (count >= 2 && count <= 4) return "moduly v provozu";
  return "modulů v provozu";
}

function csModulesOkLabel(count: number): string {
  if (count === 1) return "modul v pořádku";
  if (count >= 2 && count <= 4) return "moduly v pořádku";
  return "modulů v pořádku";
}

function formatAttentionCount(count: number): string {
  if (count === 0) return "bez upozornění";
  if (count === 1) return "1 modul ke kontrole";
  if (count >= 2 && count <= 4) return `${count} moduly ke kontrole`;
  return `${count} modulů ke kontrole`;
}

export function DashboardSchoolProfile({ profile, onModuleChipClick, onPrintProfile }: DashboardSchoolProfileProps) {
  return (
    <section
      className={`card section-card dash-school-profile dash-school-profile--${profile.tone}`}
      aria-labelledby="dash-school-profile-heading"
    >
      <div className="dash-school-profile__head">
        <div className="dash-school-profile__head-row">
          <h2 id="dash-school-profile-heading" className="section-title dash-school-profile__title">
            Školní profil
          </h2>
          {onPrintProfile ? (
            <button
              type="button"
              className="btn ghost btn--sm dash-school-profile__print"
              data-testid="dash-school-profile-print"
              onClick={onPrintProfile}
            >
              Tisk profilu školy
            </button>
          ) : null}
        </div>
        <p className="muted-text dash-school-profile__scenario">
          Scénář: <strong>{profile.scenarioLabel}</strong>
        </p>
      </div>

      <div className="dash-school-profile__metrics" aria-label="Souhrn školy">
        <div className="dash-school-profile__metric dash-school-profile__metric--primary">
          <span className="dash-school-profile__metric-label">Celkem PHmax</span>
          <strong className="dash-school-profile__metric-value">
            {formatCsNumberOrDash(profile.totalPhmax)}
            {profile.totalPhmax != null ? ` ${CS_HOURS_PER_WEEK_SHORT}` : ""}
          </strong>
          {profile.totalPhmaxIncomplete ? (
            <span className="muted-text dash-school-profile__metric-note">některé moduly neúplné</span>
          ) : null}
        </div>
        <div className="dash-school-profile__metric">
          <span className="dash-school-profile__metric-label">Moduly v provozu</span>
          <strong className="dash-school-profile__metric-value">
            {profile.modulesInUse} {csModulesInUseLabel(profile.modulesInUse)}
          </strong>
          <span className="muted-text dash-school-profile__metric-note">
            {profile.modulesOk} {csModulesOkLabel(profile.modulesOk)} · {formatAttentionCount(profile.attentionCount)}
          </span>
        </div>
        <div className="dash-school-profile__metric">
          <span className="dash-school-profile__metric-label">Pojmenované zálohy</span>
          <strong className="dash-school-profile__metric-value">{profile.namedBackupsTotal}</strong>
        </div>
        <div className="dash-school-profile__metric">
          <span className="dash-school-profile__metric-label">Poslední export</span>
          <strong className="dash-school-profile__metric-value dash-school-profile__metric-value--text">
            {profile.lastExportLabel}
          </strong>
        </div>
      </div>

      <div className="dash-school-profile__modules" aria-label="Moduly školy">
        {profile.moduleChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={[
              "dash-school-profile__chip",
              chip.active ? "" : "dash-school-profile__chip--empty",
              chip.needsAttention ? "dash-school-profile__chip--warn" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onModuleChipClick(chip.id)}
            aria-label={`${chip.label}: ${chip.phmaxLabel}`}
          >
            <span className="dash-school-profile__chip-label">{chip.label}</span>
            <strong className="dash-school-profile__chip-value">{chip.phmaxLabel}</strong>
          </button>
        ))}
      </div>

      {profile.lead ? <p className={`dash-school-profile__lead dash-school-profile__lead--${profile.tone}`}>{profile.lead}</p> : null}
    </section>
  );
}

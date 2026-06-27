import React, { useMemo } from "react";
import { PROFIL_SKOLY_PATH } from "../calculator-ui-constants";
import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getAnnualReportApplicability } from "./vyrocni-zprava-applicability-logic";

type VyrocniZpravaApplicabilityNoticeProps = {
  schoolProfile: Pick<SchoolProfile, "schoolType">;
};

function buildNoticeClass(level: ReturnType<typeof getAnnualReportApplicability>["level"]): string {
  switch (level) {
    case "DIRECTLY_APPLICABLE":
      return "vyrocni-zprava-applicability-notice vyrocni-zprava-applicability-notice--direct card";
    case "NOT_STANDARDLY_REQUIRED":
      return "vyrocni-zprava-applicability-notice vyrocni-zprava-applicability-notice--optional card";
    default:
      return "vyrocni-zprava-applicability-notice vyrocni-zprava-applicability-notice--unknown card";
  }
}

export function VyrocniZpravaApplicabilityNotice({ schoolProfile }: VyrocniZpravaApplicabilityNoticeProps) {
  const applicability = useMemo(() => getAnnualReportApplicability(schoolProfile), [schoolProfile]);

  return (
    <section className={buildNoticeClass(applicability.level)} role="status" aria-live="polite">
      <h2 className="vyrocni-zprava-applicability-notice__title">{applicability.title}</h2>
      <p className="vyrocni-zprava-applicability-notice__message">{applicability.message}</p>
      <p className="vyrocni-zprava-applicability-notice__recommended">{applicability.recommendedAction}</p>
      <p className="vyrocni-zprava-applicability-notice__legal-note">{applicability.legalNote}</p>
      <a className="btn ghost" href={PROFIL_SKOLY_PATH}>
        Upravit Profil školy
      </a>
    </section>
  );
}

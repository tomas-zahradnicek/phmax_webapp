/** Sdílený seed localStorage pro dashboard cross-PHmax a export E2E. */

export const CROSS_PHMAX_LS = {
  ssDraft: "phmax-ss-units-draft",
  ssWizard: "phmax-ss-basic-wizard-step",
  pv: "edu-cz-pv-calculator-state",
  pvWizard: "phmax-pv-basic-wizard-step",
  zs: "edu-cz-zs-calculator-state",
  zsWizard: "phmax-zs-basic-wizard-step",
  sd: "edu-cz-sd-calculator-state",
  sdWizard: "phmax-sd-basic-wizard-step",
  isEndpoint: "phmax-is-handoff-endpoint",
} as const;

export type CrossPhmaxSeedOptions = {
  sdKey: string;
  zsKey: string;
  pvKey: string;
  ssKey: string;
  sdWizard: string;
  zsWizard: string;
  pvWizard: string;
  ssWizard: string;
  pvRowKey: string;
  ssRowId: number;
  /** Auditní totalPhmax v ZŠ autosave (dashboard KPI). */
  zsAuditTotalPhmax?: number;
  /** Pokud je číslo, nastaví _phmaxAuditTotals na PV (nesoulad s přepočtem řádků). */
  pvAuditTotalPhmax?: number;
  /** Volitelný IS handoff endpoint v localStorage. */
  isHandoffUrl?: string;
  isHandoffLsKey?: string;
};

/** Spouští se v prohlížeči přes `page.addInitScript`. */
export function applyCrossPhmaxSeed(opts: CrossPhmaxSeedOptions): void {
  if (opts.isHandoffUrl && opts.isHandoffLsKey) {
    localStorage.setItem(opts.isHandoffLsKey, opts.isHandoffUrl);
  }
  const zsAudit = opts.zsAuditTotalPhmax ?? 200;
  localStorage.setItem(opts.sdWizard, "2");
  localStorage.setItem(
    opts.sdKey,
    JSON.stringify({ pupils: 30, manualDepts: false, departments: 1, inputMode: "summary" }),
  );
  localStorage.setItem(opts.zsWizard, "2");
  localStorage.setItem(
    opts.zsKey,
    JSON.stringify({
      tab: "phmax",
      basic1Classes: 2,
      basic1Pupils: 40,
      _phmaxAuditTotals: { totalPhmax: zsAudit, totalPha: 0, totalPhp: 0, tab: "phmax" },
    }),
  );
  const pvPayload: Record<string, unknown> = {
    rows: [
      {
        id: opts.pvRowKey,
        label: "",
        provoz: "celodenni",
        classCount: 2,
        avgHours: 8,
        sec16Count: 0,
        languageGroups: 0,
      },
    ],
  };
  if (typeof opts.pvAuditTotalPhmax === "number") {
    pvPayload._phmaxAuditTotals = { totalPhmax: opts.pvAuditTotalPhmax, tab: "phmax" };
  }
  localStorage.setItem(opts.pvWizard, "2");
  localStorage.setItem(opts.pvKey, JSON.stringify(pvPayload));
  localStorage.setItem(opts.ssWizard, "2");
  localStorage.setItem(
    opts.ssKey,
    JSON.stringify([
      {
        id: opts.ssRowId,
        label: "",
        educationField: "39-41-L/01",
        studyForm: "denni",
        phmaxMode: "",
        oborCountInClass: "1",
        additionalOborCodes: "",
        oborStudentCountsRaw: "",
        isArt82TalentClass: false,
        classType: "",
        isPar16Class: false,
        isLegacyMultioborClass: false,
        legacyMaxOborCount: "",
        note: "",
        averageStudents: "17",
        classCount: "2",
      },
    ]),
  );
}

export const defaultCrossPhmaxSeedKeys = (): Omit<CrossPhmaxSeedOptions, "pvRowKey" | "ssRowId"> => ({
  sdKey: CROSS_PHMAX_LS.sd,
  zsKey: CROSS_PHMAX_LS.zs,
  pvKey: CROSS_PHMAX_LS.pv,
  ssKey: CROSS_PHMAX_LS.ssDraft,
  sdWizard: CROSS_PHMAX_LS.sdWizard,
  zsWizard: CROSS_PHMAX_LS.zsWizard,
  pvWizard: CROSS_PHMAX_LS.pvWizard,
  ssWizard: CROSS_PHMAX_LS.ssWizard,
});

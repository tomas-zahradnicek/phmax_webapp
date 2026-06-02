import {
  calculateSchoolDruzinaPhmaxDetailed,
  calculateSchoolDruzinaPhmaxFromSummary,
  normalizeSchoolDruzinaInput,
  suggestedDepartmentsFromPupils,
  type SdDepartmentInput,
} from "../phmax-sd-logic";

function parseSdSnapshotLoose(data: unknown): {
  pupils: number;
  manualDepts: boolean;
  departments: number;
  inputMode: "summary" | "detail";
  regularExceptionGranted: boolean;
  specialExceptionGranted: boolean;
  schoolFirstStageClassCount: 1 | 2 | 3 | null;
  summarySpecialDepartments: { participants: number; specialExceptionGranted?: boolean }[];
  detailDepartments: SdDepartmentInput[];
} | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const pupils = r.pupils;
  const departments = r.departments;
  const manualDepts = r.manualDepts;
  if (typeof pupils !== "number" || !Number.isFinite(pupils) || pupils < 0) return null;
  if (typeof departments !== "number" || !Number.isFinite(departments) || departments < 1) return null;
  if (typeof manualDepts !== "boolean") return null;
  const inputMode = r.inputMode === "detail" ? "detail" : "summary";
  const regularExceptionGranted = typeof r.regularExceptionGranted === "boolean" ? r.regularExceptionGranted : false;
  const specialExceptionGranted = typeof r.specialExceptionGranted === "boolean" ? r.specialExceptionGranted : false;
  const schoolFirstStageClassCount =
    r.schoolFirstStageClassCount === 1 || r.schoolFirstStageClassCount === 2 || r.schoolFirstStageClassCount === 3
      ? r.schoolFirstStageClassCount
      : null;
  const summarySpecialDepartments: { participants: number; specialExceptionGranted?: boolean }[] = Array.isArray(
    r.summarySpecialDepartments,
  )
    ? r.summarySpecialDepartments.reduce<{ participants: number; specialExceptionGranted?: boolean }[]>((acc, x) => {
        if (!x || typeof x !== "object") return acc;
        const o = x as Record<string, unknown>;
        if (typeof o.participants !== "number" || !Number.isFinite(o.participants) || o.participants < 0) return acc;
        acc.push({
          participants: o.participants,
          specialExceptionGranted:
            typeof o.specialExceptionGranted === "boolean" ? o.specialExceptionGranted : undefined,
        });
        return acc;
      }, [])
    : [];
  const detailDepartments = Array.isArray(r.detailDepartments)
    ? r.detailDepartments
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const o = x as Record<string, unknown>;
          if (o.kind !== "regular" && o.kind !== "special") return null;
          if (typeof o.participants !== "number" || !Number.isFinite(o.participants) || o.participants < 0) return null;
          return {
            kind: o.kind,
            participants: o.participants,
            participantsFirstStage:
              typeof o.participantsFirstStage === "number" && Number.isFinite(o.participantsFirstStage)
                ? o.participantsFirstStage
                : undefined,
            specialExceptionGranted:
              typeof o.specialExceptionGranted === "boolean" ? o.specialExceptionGranted : undefined,
          } as SdDepartmentInput;
        })
        .filter((x): x is SdDepartmentInput => x != null)
    : [];
  return {
    pupils,
    manualDepts,
    departments,
    inputMode,
    regularExceptionGranted,
    specialExceptionGranted,
    schoolFirstStageClassCount,
    summarySpecialDepartments,
    detailDepartments,
  };
}

/** Přepočet PHmax ze ŠD autosave – stejná logika jako na stránce ŠD. */
export function computeSdPhmaxTotalFromSnapshot(snapshot: unknown): number | null {
  const snap = parseSdSnapshotLoose(snapshot);
  if (!snap) return null;
  const effectiveDepts = snap.manualDepts ? snap.departments : suggestedDepartmentsFromPupils(snap.pupils);
  if (effectiveDepts < 1) return null;
  try {
    if (snap.inputMode === "summary") {
      const result = calculateSchoolDruzinaPhmaxFromSummary({
        regularDepartments: effectiveDepts,
        regularParticipantsTotal: snap.pupils,
        regularExceptionGranted: snap.regularExceptionGranted,
        specialExceptionGranted: snap.specialExceptionGranted,
        schoolFirstStageClassCount: snap.schoolFirstStageClassCount,
        specialDepartments: snap.summarySpecialDepartments,
      });
      return result.finalPhmax;
    }
    if (snap.detailDepartments.length === 0) return null;
    const result = calculateSchoolDruzinaPhmaxDetailed(
      normalizeSchoolDruzinaInput({
        departments: snap.detailDepartments,
        regularExceptionGranted: snap.regularExceptionGranted,
        specialExceptionGranted: false,
        schoolFirstStageClassCount: snap.schoolFirstStageClassCount,
      }),
    );
    return result.finalPhmax;
  } catch {
    return null;
  }
}

export function computeSdPhaMaxFromSnapshot(snapshot: unknown): number | null {
  const snap = parseSdSnapshotLoose(snapshot);
  if (!snap) return null;
  const effectiveDepts = snap.manualDepts ? snap.departments : suggestedDepartmentsFromPupils(snap.pupils);
  if (effectiveDepts < 1) return null;
  try {
    if (snap.inputMode === "summary") {
      return calculateSchoolDruzinaPhmaxFromSummary({
        regularDepartments: effectiveDepts,
        regularParticipantsTotal: snap.pupils,
        regularExceptionGranted: snap.regularExceptionGranted,
        specialExceptionGranted: snap.specialExceptionGranted,
        schoolFirstStageClassCount: snap.schoolFirstStageClassCount,
        specialDepartments: snap.summarySpecialDepartments,
      }).finalPhaMax;
    }
    if (snap.detailDepartments.length === 0) return null;
    return calculateSchoolDruzinaPhmaxDetailed(
      normalizeSchoolDruzinaInput({
        departments: snap.detailDepartments,
        regularExceptionGranted: snap.regularExceptionGranted,
        specialExceptionGranted: false,
        schoolFirstStageClassCount: snap.schoolFirstStageClassCount,
      }),
    ).finalPhaMax;
  } catch {
    return null;
  }
}

import { CS_HOURS_PER_WEEK_SHORT, formatCsNumber } from "./cs-format";

const MAX_STUDENTS_PROBE = 2000;

function bonus4cGeneralHours(studentsIn: number): number {
  const students = Math.max(0, Math.floor(studentsIn));
  if (students <= 0) return 0;
  if (students <= 120) return 7;
  return 7 + Math.ceil((students - 120) / 120) * 2;
}

function bonus4cSec16Hours(studentsIn: number): number {
  const students = Math.max(0, Math.floor(studentsIn));
  if (students <= 0) return 0;
  if (students <= 42) return 7;
  return 7 + Math.ceil((students - 42) / 42) * 2;
}

function nextThresholdHoursHint(
  label: string,
  students: number,
  hoursAt: (n: number) => number,
  blockSize: number,
  firstBlockMax: number,
): string | null {
  if (students <= 0) return null;
  const current = hoursAt(students);
  if (current <= 0) return null;

  for (let probe = students + 1; probe <= MAX_STUDENTS_PROBE; probe++) {
    const nextHours = hoursAt(probe);
    if (nextHours > current) {
      const deltaStudents = probe - students;
      const hoursDelta = nextHours - current;
      const bandNote =
        students <= firstBlockMax
          ? `první pásmo do ${firstBlockMax} žáků (${formatCsNumber(current)} ${CS_HOURS_PER_WEEK_SHORT})`
          : `aktuálně ${formatCsNumber(current)} ${CS_HOURS_PER_WEEK_SHORT} (blok po ${blockSize} žácích)`;
      return (
        `${label}: ${students} žáků → bonus ${bandNote}. ` +
        `Vyšší pásmo: orientačně +${deltaStudents} žáků (od ${probe} žáků, +${formatCsNumber(hoursDelta)} ${CS_HOURS_PER_WEEK_SHORT} – ověřte v NV 75 §4c).`
      );
    }
  }
  return null;
}

export function buildNv75Bonus4cGeneralHint(studentsCounted: number): string | null {
  return nextThresholdHoursHint(
    "NV75 §4c odst. 1 (obecně započtení)",
    Math.max(0, Math.floor(studentsCounted)),
    bonus4cGeneralHours,
    120,
    120,
  );
}

export function buildNv75Bonus4cSec16Hint(studentsSec16: number): string | null {
  return nextThresholdHoursHint(
    "NV75 §4c odst. 2 (§ 16)",
    Math.max(0, Math.floor(studentsSec16)),
    bonus4cSec16Hours,
    42,
    42,
  );
}

export function buildNv75Bonus4cUpgradeHints(input: {
  practicalStudentsGeneralCounted: number;
  practicalStudentsSec16: number;
}): string[] {
  const out: string[] = [];
  const general = buildNv75Bonus4cGeneralHint(input.practicalStudentsGeneralCounted);
  if (general) out.push(general);
  const sec16 = buildNv75Bonus4cSec16Hint(input.practicalStudentsSec16);
  if (sec16) out.push(sec16);
  return out;
}

export function countNv75PracticalGeneralForBonus4c(input: {
  practicalGeneralNonOv?: number;
  practicalOvEhl0?: number;
  ovGroupsSchool?: number;
  ovGroupsInstructor?: number;
}): number {
  const practicalNonOv = Math.max(0, Math.floor(input.practicalGeneralNonOv ?? 0));
  const practicalOv = Math.max(0, Math.floor(input.practicalOvEhl0 ?? 0));
  const ovGroupsSchool = Math.max(0, Math.floor(input.ovGroupsSchool ?? 0));
  const ovGroupsInstructor = Math.max(0, Math.floor(input.ovGroupsInstructor ?? 0));
  const ovGroupsEquivalent = ovGroupsSchool + Math.floor(ovGroupsInstructor / 2);
  return practicalNonOv + (ovGroupsEquivalent < 10 ? practicalOv : 0);
}

export function buildNv75Bonus4cHintsFromAutosave(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const s = snapshot as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const counted = countNv75PracticalGeneralForBonus4c({
    practicalGeneralNonOv: num(s.practicalGeneralNonOv),
    practicalOvEhl0: num(s.practicalOvEhl0),
    ovGroupsSchool: num(s.ovGroupsSchool),
    ovGroupsInstructor: num(s.ovGroupsInstructor),
  });
  if (counted <= 0 && num(s.practicalSec16) <= 0) return [];
  return buildNv75Bonus4cUpgradeHints({
    practicalStudentsGeneralCounted: counted,
    practicalStudentsSec16: num(s.practicalSec16),
  });
}

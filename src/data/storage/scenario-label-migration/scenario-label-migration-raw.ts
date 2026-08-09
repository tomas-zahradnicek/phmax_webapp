import type { RawStoredText } from "./scenario-label-migration-types";

/** Map a raw `getItem` result into discriminated storage state. */
export function rawStoredTextFromNullable(raw: string | null): RawStoredText {
  if (raw === null) {
    return { exists: false };
  }
  return { exists: true, value: raw };
}

/** Exact raw equality. No trim, no `|| ""`, no `?? ""`. */
export function rawStoredTextEqual(left: RawStoredText, right: RawStoredText): boolean {
  if (left.exists !== right.exists) {
    return false;
  }
  if (!left.exists) {
    return true;
  }
  if (!right.exists) {
    return false;
  }
  return left.value === right.value;
}

export function isRawStoredTextMissing(raw: RawStoredText): boolean {
  return !raw.exists;
}

export function isRawStoredTextPresentEmpty(raw: RawStoredText): boolean {
  return raw.exists && raw.value === "";
}

export function isRawStoredTextPresentText(raw: RawStoredText): boolean {
  return raw.exists && raw.value !== "";
}

export function authoritativePresenceFromRaw(
  raw: RawStoredText,
): "present" | "absent" {
  return raw.exists ? "present" : "absent";
}

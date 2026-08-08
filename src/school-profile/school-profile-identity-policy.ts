import { readIdentityRegistry } from "../data/identity/identity-registry";

/**
 * Presence of Identity Registry for school-profile identity guards.
 * Corrupted / unavailable must NOT be treated as missing (fail-closed).
 */
export type IdentityRegistryPresenceStatus =
  | "missing"
  | "valid"
  | "corrupted"
  | "storage_unavailable";

export function readIdentityRegistryPresence(): IdentityRegistryPresenceStatus {
  const result = readIdentityRegistry();
  if (!result.ok) {
    return result.code;
  }
  if (result.registry == null) {
    return "missing";
  }
  return "valid";
}

/** @deprecated Prefer readIdentityRegistryPresence(); true only for valid registry with schoolId. */
export function hasStableIdentityRegistry(): boolean {
  return readIdentityRegistryPresence() === "valid";
}

/**
 * How strictly to lock IČO / RED IZO / IZO on profile save.
 * - none: legacy missing registry — edits allowed
 * - established_only: valid registry — block changes to already-filled identifiers
 * - all: corrupted / storage_unavailable — block any identity-field change (fail-closed)
 */
export type IdentitySensitiveLockMode = "none" | "established_only" | "all";

export function identitySensitiveLockMode(
  status: IdentityRegistryPresenceStatus,
): IdentitySensitiveLockMode {
  if (status === "missing") return "none";
  if (status === "valid") return "established_only";
  return "all";
}

export type SchoolProfileIdentityBlockReason = "replace_required" | "registry_unsafe";

export function identityBlockReasonForStatus(
  status: IdentityRegistryPresenceStatus,
): SchoolProfileIdentityBlockReason | null {
  if (status === "valid") return "replace_required";
  if (status === "corrupted" || status === "storage_unavailable") return "registry_unsafe";
  return null;
}

export const MSG_SCHOOL_PROFILE_IDENTITY_FIELDS_LOCKED =
  "Identifikační údaje školy (IČO, RED IZO, IZO) nelze v tomto kroku měnit. Pokud jde o jinou školu, bude potřeba samostatná operace nahrazení školy — ta zatím není k dispozici.";

export const MSG_SCHOOL_PROFILE_IDENTITY_FIELDS_UNSAFE =
  "Identifikační údaje školy nyní nelze bezpečně změnit. Ostatní údaje profilu můžete upravit.";

export function messageForIdentityBlockReason(
  reason: SchoolProfileIdentityBlockReason | null,
): string | null {
  if (reason === "replace_required") return MSG_SCHOOL_PROFILE_IDENTITY_FIELDS_LOCKED;
  if (reason === "registry_unsafe") return MSG_SCHOOL_PROFILE_IDENTITY_FIELDS_UNSAFE;
  return null;
}

export const MSG_CONFIRM_RESET_SCHOOL_PROFILE_FIELDS = [
  "Vymazat údaje profilu?",
  "",
  "Odstraněny budou běžné údaje formuláře (název, adresa, kontakty a další atributy).",
  "Identifikační údaje IČO / RED IZO / IZO a identita školy zůstanou zachovány.",
  "",
  "Data kalkulaček a výroční zprávy zůstanou zachována.",
  "Nejde o odstranění školy ze systému.",
].join("\n");

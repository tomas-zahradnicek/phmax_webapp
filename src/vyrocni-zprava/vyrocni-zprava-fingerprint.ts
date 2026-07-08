const IGNORED_FINGERPRINT_KEYS = new Set(["__expanded", "__selected", "__uiState"]);

function normalizeValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item));
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(input).sort()) {
    if (IGNORED_FINGERPRINT_KEYS.has(key)) continue;
    output[key] = normalizeValue(input[key]);
  }
  return output;
}

function hashString(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}

export function buildAnnualReportInputFingerprint(input: unknown): string {
  const normalized = normalizeValue(input);
  return hashString(JSON.stringify(normalized));
}

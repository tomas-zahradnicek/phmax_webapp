import { describe, expect, it } from "vitest";
import { computeSdPhmaxTotalFromSnapshot } from "./sd-compute-phmax-total-from-snapshot";

describe("computeSdPhmaxTotalFromSnapshot", () => {
  it("souhrnný režim – 30 účastníků, navržená 2 oddělení", () => {
    const total = computeSdPhmaxTotalFromSnapshot({
      pupils: 30,
      manualDepts: false,
      departments: 1,
      inputMode: "summary",
    });
    expect(total).toBe(57.5);
  });

  it("neplatný snapshot vrací null", () => {
    expect(computeSdPhmaxTotalFromSnapshot(null)).toBeNull();
  });
});

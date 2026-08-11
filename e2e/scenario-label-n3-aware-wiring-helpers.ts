/**
 * TEST-ONLY helper: seed an already-namespaced scenario authority fixture.
 * Production app still creates 0 first namespaced authority (no cutover).
 */

import type { Page } from "@playwright/test";

const FENCE_RESOURCE = "phmax-scenario-label/value";

export async function seedNamespacedScenarioReady(
  page: Page,
  schoolId: string,
  label: string,
): Promise<void> {
  await page.evaluate(
    ({ schoolId: sid, label: value, resource }) => {
      const legacy = "phmax-school-scenario-label";
      const v2 = `reditelsky-pruvodce:v2:school:${sid}:module:phmax-scenario-label:resource:value`;
      const marker = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${sid}`;
      const fence = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${sid}`;
      localStorage.setItem(legacy, value);
      localStorage.setItem(v2, value);
      localStorage.setItem(
        marker,
        JSON.stringify({
          schemaVersion: 2,
          authority: "namespaced",
          mirrorHealth: "synced",
          authoritativePresence: "present",
        }),
      );
      localStorage.setItem(
        fence,
        JSON.stringify({
          schemaVersion: 1,
          protocolGeneration: 3,
          authority: "namespaced",
          markerSchemaVersion: 2,
          schoolId: sid,
          resource,
          committedRaw: { exists: true, value },
        }),
      );
    },
    { schoolId, label, resource: FENCE_RESOURCE },
  );
}

export async function seedNamespacedScenarioDegraded(
  page: Page,
  schoolId: string,
  v2Label: string,
  legacyLabel: string,
): Promise<void> {
  await page.evaluate(
    ({ schoolId: sid, v2Label: v2Value, legacyLabel: legacyValue, resource }) => {
      const legacy = "phmax-school-scenario-label";
      const v2 = `reditelsky-pruvodce:v2:school:${sid}:module:phmax-scenario-label:resource:value`;
      const marker = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${sid}`;
      const fence = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${sid}`;
      localStorage.setItem(legacy, legacyValue);
      localStorage.setItem(v2, v2Value);
      localStorage.setItem(
        marker,
        JSON.stringify({
          schemaVersion: 2,
          authority: "namespaced",
          mirrorHealth: "dirty",
          authoritativePresence: "present",
        }),
      );
      localStorage.setItem(
        fence,
        JSON.stringify({
          schemaVersion: 1,
          protocolGeneration: 3,
          authority: "namespaced",
          markerSchemaVersion: 2,
          schoolId: sid,
          resource,
          committedRaw: { exists: true, value: v2Value },
        }),
      );
    },
    { schoolId, v2Label, legacyLabel, resource: FENCE_RESOURCE },
  );
}

export async function seedBlockedScenarioAuthority(
  page: Page,
  schoolId: string,
): Promise<void> {
  await page.evaluate(
    ({ schoolId: sid, resource }) => {
      const legacy = "phmax-school-scenario-label";
      const v2 = `reditelsky-pruvodce:v2:school:${sid}:module:phmax-scenario-label:resource:value`;
      const marker = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${sid}`;
      const fence = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${sid}`;
      localStorage.setItem(legacy, "A");
      localStorage.setItem(v2, "A");
      localStorage.setItem(
        marker,
        JSON.stringify({
          schemaVersion: 2,
          authority: "namespaced",
          mirrorHealth: "synced",
          authoritativePresence: "present",
        }),
      );
      // Fence authority mismatch → AUTHORITY_BLOCKED
      localStorage.setItem(
        fence,
        JSON.stringify({
          schemaVersion: 1,
          protocolGeneration: 3,
          authority: "legacy",
          markerSchemaVersion: 1,
          schoolId: sid,
          resource,
          committedRaw: { exists: true, value: "A" },
        }),
      );
    },
    { schoolId, resource: FENCE_RESOURCE },
  );
}

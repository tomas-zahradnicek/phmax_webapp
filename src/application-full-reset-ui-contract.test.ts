import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("Full Application Reset UI contract", () => {
  const dialogSource = readSource("src/dashboard/DashboardFullResetDialog.tsx");
  const cardSource = readSource("src/dashboard/DashboardBackupExportCard.tsx");
  const profileSource = readSource("src/ProfilSkolyPage.tsx");
  const dashboardSource = readSource("src/PhmaxDashboardPage.tsx");
  const lifecycleDocs = readSource("docs/platform-metadata-lifecycle.md");

  it("má jediné canonical otevření Full Resetu v dashboard backup kartě", () => {
    expect(cardSource).toContain('data-testid="full-reset-open"');
    expect(profileSource).not.toContain('data-testid="full-reset-open"');
    expect(dashboardSource).not.toContain('data-testid="full-reset-open"');
  });

  it("nepoužívá pro Full Reset window.confirm", () => {
    expect(dialogSource).toContain('role="dialog"');
    expect(dialogSource).toContain('aria-modal="true"');
    expect(dialogSource).not.toContain("window.confirm");
  });

  it("vyžaduje přesný token SMAZAT bez trim nebo case heuristiky", () => {
    expect(dialogSource).toContain(
      'confirmationToken !== FULL_RESET_CONFIRMATION_TOKEN',
    );
    expect(dialogSource).not.toContain("confirmationToken.trim");
    expect(dialogSource).not.toContain("confirmationToken.toUpperCase");
  });

  it("copy rozlišuje doporučený backup od úplné kopie browser storage", () => {
    expect(dialogSource).toContain("rozpracované údaje v rychlých");
    expect(dialogSource).toContain("Reset můžete provést i bez nové zálohy.");
    expect(dialogSource).toContain("jiném panelu nebo");
    expect(dialogSource).not.toContain("všechna data lze obnovit");
  });

  it("partial backup nikdy neoznačí jako kompletní", () => {
    expect(dialogSource).toContain(
      "Stažení centrální zálohy bylo zahájeno, ale některá data se do ní nepodařilo zahrnout.",
    );
    expect(dialogSource).toContain(
      "Stažení centrální zálohy bylo zahájeno.",
    );
    expect(dialogSource).not.toContain("Centrální záloha byla stažena.");
  });

  it("recovery nabízí pouze retry a explicitní reload", () => {
    expect(dialogSource).toContain('data-testid="full-reset-retry"');
    expect(dialogSource).toContain('data-testid="full-reset-reload"');
    expect(dialogSource).toContain("!resetFailed");
    expect(dialogSource).toContain("if (!canClose) return");
  });

  it("user-facing recovery nevypisuje raw storage keys", () => {
    expect(dialogSource).not.toContain(
      "reditelsky-pruvodce-identity-registry-v1",
    );
    expect(dialogSource).not.toContain("phmax-dash-last-visit-");
    expect(dialogSource).not.toContain("result.failed");
  });

  it("dokumentace pravdivě označuje Identity Registry jako backupovanou", () => {
    expect(lifecycleDocs).toContain(
      "Identity Registry je v centrálním backupu od 0E-2.",
    );
    expect(lifecycleDocs).not.toContain(
      "Identity Registry ani AppContext se dnes do exportu nezapisují",
    );
  });
});

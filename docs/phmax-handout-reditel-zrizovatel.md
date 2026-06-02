# PHmax webapp – orientační kalkulačka pro školu

**Verze 0.3.8** · jednostránkový přehled pro ředitele a zřizovatele  
*Dokument je informativní; nejedná se o závazný výkaz ani právní posudek.*

---

## K čemu slouží

Webová aplikace v prohlížeči pomáhá **spočítat a zkontrolovat orientační PHmax** (a související údaje) podle metodiky MŠMT pro jednotlivé typy zařízení. Data zůstávají **v prohlížeči uživatele** (autosave); lze je exportovat pro archiv nebo předání IT.

| Modul | Pro koho | Co orientačně počítá |
|-------|----------|----------------------|
| **PV** | mateřská škola | PHmax / PHAmax po pracovištích, náhled § 1d odst. 3 |
| **ZŠ** | základní škola | PHmax, PHAmax, PHPmax |
| **SŠ** | střední škola | PHmax po řádcích, PHAmax PrŠ (vybrané obory, denní forma) |
| **ŠD** | školní družina | PHmax podle oddělení / souhrnu |
| **NV75** | zástupce ředitele | banka odpočtů (hodiny, ne PHmax) |
| **Dashboard** | vedení / metodik | přehled modulů, součet PHmax, export JSON |

---

## Co aplikace **není**

- **Není** oficiální výkaz pro zřizovatele ani náhrada informačního systému školy.
- **Není** závazný výsledek krácení PHmax podle § 1d bez rozhodnutí krajského úřadu (KÚ).
- **Neobsahuje** plný výpočet některých složitých situací (např. agregace SŠ dle § 4, plný § 16 u SŠ) – u těchto případů slouží k **kontrole vstupů a varování**.

---

## Co je hotové k běžnému použití (v0.3.7)

| Oblast | Stav | Poznámka pro vedení školy |
|--------|------|---------------------------|
| Výpočty v modulech PV, ZŠ, ŠD, NV75 | **Ano** | wizard, mobilní souhrn, export CSV/XLSX |
| **PV** § 1d krácení | **Orientačně** | s upozorněním; závazně až po KÚ |
| **SŠ** běžné řádky + PrŠ PHAmax | **Ano** | kontrolní nástroj; § 16 jen náhled |
| **Dashboard** – součet PHmax (PV+ŠD+ZŠ+SŠ) | **Ano** | neoficiální kontrola; bez NV75 a bez §1d v součtu |
| Export **scénář celá škola** (JSON) | **Ano** | archiv stavu modulů v prohlížeči |
| Export **handoff pro IS** (JSON) | **Ano** | pro integrátora IS; ne automatický import do Bakalářů/EduPage |
| Import do IS / šablona zřizovatele | **Ne (0.4.0)** | čeká na schválený formát |

---

## Doporučený postup pro školu (15 minut)

1. Otevřít **Dashboard** (`?view=dash`) – zkontrolovat dlaždice a případně „Vyžaduje pozornost“.
2. Otevřít příslušný modul (PV / ZŠ / SŠ …), načíst **ukázkový příklad** a upravit na vlastní data.
3. Zkontrolovat **souhrn výsledků** a varování u neúplných vstupů.
4. **Exportovat** CSV (modul) nebo JSON scénář (dashboard) pro archiv.
5. Na sdíleném počítači po ukončení použít **Vymazat lokální data**.

---

## Pro zřizovatele / IT

- **Scénář celá škola (JSON)** – orientační snapshot autosave všech modulů; vhodný pro archivaci nebo ETL u integrátora.
- **Export pro IS školy (JSON)** – schéma `phmax-is-handoff-v1`; detail v `docs/phmax-is-integration.md`.
- **Mapování polí** pro budoucí oficiální export – návrh v `docs/export-field-mapping.md` (realizace až po schválení šablony).

---

## Důležité upozornění na výstupy

Všechny exporty obsahují **verzi aplikace a datum** a jsou označeny jako **orientační**. Před použitím ve vztahu k úřadům nebo ve smluvní dokumentaci je nutné ověření odpovědnou osobou školy (metodik, ekonom, právník).

---

**Technická podpora / další dokumentace:** repozitář projektu – `docs/acceptance-pv-zs-nv75.md`, `docs/ss-acceptance-checklist.md`, `CHANGELOG.md`.

*PHmax webapp 0.3.7 · orientační kalkulačka · neoficiální výstup*

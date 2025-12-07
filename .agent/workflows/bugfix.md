---
description: Bugfix Workflow
---

# Bugfix Workflow

Tento workflow slúži na systematickú opravu chýb v aplikácii.

## Fáza 1: Diagnostika
- [ ] **Analýza:** Prečítaj si popis chyby.
- [ ] **Lokácia:** Nájdi súbor a riadok kódu, ktorý chybu spôsobuje.
    - Použi `grep` alebo vyhľadávanie kľúčových slov, ak nevieš presne, kde to je.
- [ ] **Pochopenie kontextu:** Prečítaj si celý súbor (`view_file`), aby si nerozbil inú funkcionalitu.

## Fáza 2: Oprava
- [ ] **Implementácia fixu:**
    - Aplikuj opravu.
    - Ak meníš logiku, pridaj komentár vysvetľujúci "prečo" (ak je to nejasné).
- [ ] **Typová kontrola:** Spusti `npx tsc`. Oprava chyby nesmie spôsobiť TypeScript chyby inde.

## Fáza 3: Overenie
- [ ] **Self-Review:**
    - Pozri sa na zmenený kód.
    - Zmizli `console.log`?
    - Sú premenné správne pomenované?
- [ ] **Git:** Ak používateľ potvrdí funkčnosť príkazom "funguje", commitni zmenu s prefixom `fix:`.
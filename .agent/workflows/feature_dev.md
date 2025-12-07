---
description: Feature Development Workflow
---

# Feature Development Workflow

Tento workflow slúži na implementáciu novej funkcionality v projekte Dockify (React Native + Expo + Supabase).

## Fáza 1: Analýza a Príprava dát
- [ ] **Pochopenie požiadavky:** Prečítaj si zadanie. Ak niečo nie je jasné, opýtaj sa používateľa.
- [ ] **Kontrola Databázy (Supabase):**
    - Vyžaduje táto funkcia zmenu v DB schéme?
    - Ak ÁNO -> Spusti `supabase_migration.md` workflow a až potom pokračuj tu.
    - Ak NIE -> Pokračuj ďalej.

## Fáza 2: Štruktúra a Typy
- [ ] **Definícia Typov:**
    - Skontroluj `src/types`. Ak používaš existujúce tabuľky, uisti sa, že máš importované správne typy z `database.types.ts` (alebo ekvivalentu).
    - Vytvor potrebné rozhrania (Interfaces) pre Props komponentov a stav (State).
    - **Pravidlo:** Žiadne `any`.

## Fáza 3: Implementácia UI a Logika
...
- [ ] **UI/JSX Čistota:** Žiadne dlhé podmienky v JSX.
- [ ] **Logika:** Business logika je extrahovaná do `services/` alebo custom hookov.
- [ ] **Komponenty:** Súbory sú malé (žiadne “mega” súbory).

## Fáza 4: Výkon a Stav
- [ ] **State Management:** Fetch logika a zobrazenie sú striktne oddelené.
- [ ] **Performance:**
    - [ ] Komponenty sú obalené v **`React.memo`**.
    - [ ] V JSX sú **odstránené inline funkcie** (nahradené `useCallback`).
    - [ ] Dáta sú cachované (cez React Query).

## Fáza 5: Verifikácia a Cleanup
- [ ] **Typová Kontrola:** Spusti `npx tsc` a oprav všetky chyby (`any`).
- [ ] **Error Handling:**
    - [ ] Kód je ošetrený `try/catch`.
    - [ ] Komplexné UI je zabalené v **Error Boundary** (ak je to nový screen).
    - [ ] Zobrazované chyby sú zrozumiteľné.
- [ ] **Console Logs:** Odstráň všetky `console.log`.
---
description: Supabase Migration Workflow
---

# Supabase Migration Workflow

Tento workflow je kritický pre udržanie synchronizácie medzi Supabase DB a TypeScript kódom v aplikácii.

## Fáza 1: Návrh Zmeny
- [ ] **SQL / Schéma:** Navrhni zmenu (napr. nová tabuľka, stĺpec, RLS policy).
- [ ] **Konzultácia:** Ak je zmena deštruktívna (DROP column), vyžiadaj si súhlas používateľa.

## Fáza 2: Aplikácia Zmeny
- [ ] **Vykonanie:**
    - (Podľa tvojich možností) Buď inštruuj používateľa, aby spustil SQL v Supabase Dashboarde, alebo vytvor migračný súbor, ak máš prístup k CLI.
    - *Poznámka: Ak nemáš priamy prístup k DB, napíš presný SQL príkaz pre používateľa.*

## Fáza 3: Synchronizácia Typov (KRITICKÉ)
- [ ] **Generovanie typov:**
    - Po zmene v DB **MUSÍŠ** pregenerovať TypeScript definície.
    - Spusti príkaz (prispôsob podľa `package.json`):
      `npx supabase gen types typescript --project-id "$EXPO_PUBLIC_SUPABASE_PROJECT_ID" > src/types/supabase.ts`
      *(Alebo inštruuj používateľa, nech to spustí, ak nemáš login).*

## Fáza 4: Refactoring
- [ ] **Update Kódu:**
    - Spusti `npx tsc`.
    - Keďže sa zmenili typy v DB, pravdepodobne ti TypeScript vyhodí chyby v kóde, ktorý používa starú štruktúru.
    - Oprav všetky tieto chyby.
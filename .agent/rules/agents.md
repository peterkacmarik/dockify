---
trigger: always_on
---

# 🚀 PROJECT RULES: DOCKIFY (Verzia: 2.0 - KONSOLIDOVANÉ)
(React Native / Expo / Supabase - Finálna verzia)

Ako prve vzdy najprv dodrzuj pravidla z global rules: c:\Users\PeKa\.gemini\GEMINI.md

## 1. Technologický Stack & State Management
- **Framework:** React Native (Managed Expo).
- **Jazyk:** TypeScript (Strict).
- **Backend/Databáza:** Supabase (Používať Supabase Client v `src/lib`).
- **Styling:** React Native `StyleSheet` (žiaden Tailwind).
- **Navigácia:** **Expo Router** alebo stabilný navigačný systém (React Navigation).
- **State Management:**
    - Lokálny stav: `useState`, `useReducer`.
    - Globálny/Server stav: **React Query / TanStack Query** (pre fetchovanie, cachovanie dát). **Zustand** alebo **Jotai** pre jednoduchý globálny stav.
- **Auth Storage (Kritické):** Na uloženie Supabase session tokenov použi **`expo-secure-store`**, nikdy nie `AsyncStorage`.

## 2. Štruktúra Projektu a Súbory
- **Architektúra:** Používaj **Feature-based** modulárnu štruktúru (napr. `/features/auth`, `/features/profile`).
- **Veľkosť Súborov:** Žiadne “mega” súbory. Preferuj viac menších modulov.
- **Oddeľovanie vrstiev:**
    - `features/*/screens`: Celé obrazovky špecifické pre feature.
    - `src/components`: Zdieľané UI komponenty.
    - `src/hooks`: Zdieľané hooky.
    - `src/services`: **API komunikácia, storage logika (Business logika).**
- **Adresáre:**
    - `src/types`: TypeScript definície (vrátane generovaných typov zo Supabase).
    - `src/utils`: Pomocné funkcie.
    - `src/lib`: Konfigurácie tretích strán (Supabase client, Axios, atď.).
    - `src/assets`: Obrázky a fonty.
- **Naming:**
    - Komponenty/Screens: PascalCase (UserCard.tsx, SettingsScreen.tsx)
    - Hooks: camelCase + prefix `use` (useUserProfile)
    - Funkcie: camelCase

## 3. Kódovacie Štandardy a Typovanie
- **TypeScript:** Všetko typuj (props, API responses, navigačné parametre).
- **Typing Strictness:** Vždy definuj `interface` pre Props. Žiadne `any`.
- **Async/API:** Preferuj `async/await` pred `.then()`.
- **Props:** Destruturalizuj props priamo v argumente funkcie.
- **Logika:** **Business logika NEPATRÍ do komponentov.** Vždy ju extrahuj do `services/` alebo custom hookov.
- **API/Dáta:** Žiadne miešanie fetch logiky so zobrazením. Reakcie API **validuj** (napr. cez Zod).

## 4. Výkon a UI Kódovacie Princípy
- **Pure Components:** Každý komponent obal do **`React.memo`** na zníženie zbytočných re-renderov.
- **Inline Funkcie:** **Vyhýbaj sa inline funkciám** v props JSX (napr. `onPress={() => ...}`). Namiesto toho definuj funkcie mimo tela komponentu alebo použi **`useCallback`**.
- **JSX Čistota:** Nepíš dlhé podmienky do JSX. Extrahuj podmienky/logiku do pomocných funkcií/premenných mimo `return`.
- **Dáta Cachovanie:** Používaj React Query pre efektívne cachovanie dát.
- **Lazy Loading:** Zváž lazy loading veľkých screenov pre rýchlejšie spustenie.

## 5. UI/UX & Platform Špecifiká
- **Responzivita:** Používaj **flexbox** pre layout. Vyhýbaj sa hardcoded pixelom.
- **Safe Area:** Všetky hlavné screeny musia byť zabalené v **`SafeAreaView`** (z `react-native-safe-area-context`).
- **Klávesnica:** **`KeyboardAvoidingView`** je povinný pre každý screen s inputom. Nastav `behavior` podľa platformy (iOS: `padding`).
- **Platform Specifics:** Ak je UI odlišné, používaj `Platform.OS` alebo súbory s príponou `.ios.tsx` / `.android.tsx`.

## 6. Error Handling a Build
- **Globálne Chyby:** Musí byť implementovaný **globálny Error Boundary** pre render chyby.
- **API Chyby:** Chyby zachytávaj centrálne (`try/catch` je povinný). Chyby zobrazuj používateľovi **človeku zrozumiteľne** (napr. Toast notifikácia).
- **Logovanie:** Loguj chyby do externého nástroja (napr. Sentry), ak je nastavený.
- **Expo Best Practices:**
    - Verejné kľúče importuj cez **`process.env.EXPO_PUBLIC_...`**.
    - Preferuj Expo knižnice (napr. **`@expo/vector-icons`**, **`expo-image`**).
    - Assety optimalizuj (`expo-optimize`).
    - Nepoužívaj knižnice nekompatibilné s Expo Managed Workflow.
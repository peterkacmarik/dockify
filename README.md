# Dockify 🚀

**Dockify** je mobilná aplikácia pre správu skladových zásob a objednávok, postavená na React Native (Expo) s Supabase backendom.

## 📋 Funkcie

### ✅ Implementované
- **🔐 Autentifikácia** - Google OAuth 2.0 cez Supabase Auth
- **📊 Excel Understanding Agent** - Inteligentné spracovanie Excel/CSV súborov
  - Automatická detekcia stĺpcov (SKU, množstvo, popis, cena)
  - Pravidlová analýza + voliteľný Gemini LLM fallback
  - Manuálne mapovanie stĺpcov s ukladaním šablón
  - Data cleaning & validácia (SKU formát, rozsahy, duplicity)
  - Paginácia pre veľké datasety (10 000+ riadkov)
- **🌍 Internacionalizácia** - Slovenčina + Angličtina (i18next)
- **🎨 Témy** - Svetlý/Tmavý režim

### 🚧 V Pláne
- Ukladanie validovaných objednávok do Supabase
- Správa inventára
- História objednávok
- Notifikácie

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo SDK 52)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini 2.0 Flash (voliteľné)
- **Navigácia**: Expo Router (file-based)
- **State**: React Query + Zustand
- **Styling**: React Native StyleSheet
- **Validácia**: Custom validators
- **Excel/CSV**: xlsx + custom parser

## 🚀 Začíname

### Predpoklady
- Node.js 18+
- npm alebo yarn
- Expo Go app (pre testovanie na mobile)

### Inštalácia

1. **Klonujte repozitár**
   ```bash
   git clone https://github.com/peterkacmarik/dockify.git
   cd dockify
   ```

2. **Nainštalujte závislosti**
   ```bash
   npm install
   ```

3. **Nastavte environment premenné**
   
   Vytvorte `.env` súbor v root adresári:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key  # Voliteľné
   ```

4. **Spustite vývojový server**
   ```bash
   npx expo start
   ```

5. **Otvorte aplikáciu**
   - Naskenujte QR kód v Expo Go (Android/iOS)
   - Alebo stlačte `a` pre Android emulátor
   - Alebo stlačte `i` pre iOS simulátor

## 📁 Štruktúra Projektu

```
dockify/
├── src/
│   ├── app/                    # Expo Router screens
│   ├── components/             # Zdieľané UI komponenty
│   │   └── ui/                 # Button, Input, atď.
│   ├── contexts/               # React Context (Theme, Auth)
│   ├── features/               # Feature-based moduly
│   │   ├── auth/
│   │   └── order-intake/       # Excel Understanding Agent
│   │       ├── components/     # ColumnMapper
│   │       ├── screens/        # OrderIntakeScreen
│   │       └── services/       # excelParser, dataValidator, llmParser
│   ├── lib/                    # Konfigurácie (Supabase, Gemini, i18n)
│   ├── locales/                # Preklady (sk.json, en.json)
│   └── types/                  # TypeScript typy
├── .env                        # Environment premenné (gitignored)
└── package.json
```

## 🧪 Excel Understanding Agent - Workflow

1. **Upload** - Používateľ nahrá Excel/CSV súbor
2. **Analýza** - Automatická detekcia stĺpcov (pravidlová + voliteľná AI)
3. **Mapovanie** - Manuálna úprava mapovania (ak potrebné)
4. **Validácia** - Kontrola SKU, množstva, duplicít
5. **Paginácia** - Zobrazenie 50 položiek na stranu
6. **Import** - Potvrdenie a uloženie (TODO: Supabase integrácia)

## 🔑 Konfigurácia

### Supabase Setup
1. Vytvorte projekt na [supabase.com](https://supabase.com)
2. Povoľte Google OAuth v Authentication > Providers
3. Nastavte Redirect URL: `exp://localhost:8081/auth/callback`
4. Skopírujte URL a Anon Key do `.env`

### Gemini API (Voliteľné)
1. Získajte API kľúč na [ai.google.dev](https://ai.google.dev)
2. Pridajte do `.env` ako `EXPO_PUBLIC_GEMINI_API_KEY`
3. Zapnite AI analýzu v aplikácii pomocou prepínača ✨

## 📝 Skripty

```bash
npm start              # Spustí Expo dev server
npm run android        # Spustí na Android
npm run ios            # Spustí na iOS
npm run web            # Spustí web verziu
npm run reset-project  # Resetuje projekt na čistý stav
```

## 🤝 Prispievanie

Príspevky sú vítané! Prosím:
1. Forkujte repozitár
2. Vytvorte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commitujte zmeny (`git commit -m 'feat: add AmazingFeature'`)
4. Pushnite do branchu (`git push origin feature/AmazingFeature`)
5. Otvorte Pull Request

## 📄 Licencia

Tento projekt je licencovaný pod MIT licenciou.

## 👨‍💻 Autor

**Peter Kačmárik**
- GitHub: [@peterkacmarik](https://github.com/peterkacmarik)

## 🙏 Poďakovanie

- [Expo](https://expo.dev) - React Native framework
- [Supabase](https://supabase.com) - Backend as a Service
- [Google Gemini](https://ai.google.dev) - LLM API

# BudgetPro

A personal expense tracker mobile app built with Expo (React Native).

## Tech Stack

- **Framework:** Expo ~54 with Expo Router (file-based routing)
- **Backend:** Supabase (auth + database)
- **State:** Zustand
- **Font:** Manrope

## Getting Started

```bash
npm install
npm start          # Expo dev server (scan QR with Expo Go)
npm run ios        # iOS simulator
npm run android    # Android emulator
```

## Auth Flow

Supabase session is bootstrapped in `src/app/_layout.js`. Unauthenticated users are redirected to `/login`; authenticated users on a public route are redirected to `/(tabs)`.
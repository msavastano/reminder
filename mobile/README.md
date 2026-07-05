# Reminder — mobile (Expo / React Native, iOS)

Native iOS client for the Reminder app. It is a **pure API client** against the
existing Express backend (`../backend`) — no Prisma, no DB credentials on device.
Auth is a JWT stored in the iOS Keychain (`expo-secure-store`) and sent as an
`Authorization: Bearer` header.

This project is intentionally **standalone** (its own `node_modules`) and is
**not** part of the repo's root npm workspaces, to avoid Metro monorepo config.

## Prerequisites

- Node 18+ and npm (development is done on Windows; commands below are PowerShell).
- The backend running and reachable (see `../backend`).
- Expo Go on a physical iPhone, or an Android emulator for faster local iteration.

## Configure the API URL

The base URL comes from `EXPO_PUBLIC_API_URL` (surfaced via `app.config.ts`
`extra.apiUrl`, read by `src/lib/apiClient.ts`).

- **Dev:** a physical iPhone on Expo Go cannot reach `localhost` — use your dev
  machine's LAN IP, and point at the Express port directly (routes have no
  `/api` prefix locally):

  ```powershell
  $env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:4000"   # your machine's LAN IP
  ```

- **Prod:** the deployed Vercel origin's `/api` mount:

  ```powershell
  $env:EXPO_PUBLIC_API_URL = "https://<your-app>.vercel.app/api"
  ```

## Run (development loop)

```powershell
npm install
npm run start        # Expo dev server; scan the QR with Expo Go on the iPhone
npm run android      # or launch on an Android emulator for fast iteration
npm run typecheck    # tsc --noEmit
```

`expo-secure-store` is included in Expo Go, so the auth flow runs in Expo Go
without a custom dev build.

## What's implemented (first slice)

- Bearer-token auth flow: Login screen -> token persisted in SecureStore ->
  session restored on launch via `GET /auth/me`.
- Patient home: renders the signed-in patient's reminders.
- Caregiver home: renders the caregiver's linked patients.

Screens are ported incrementally; reminder create/edit, messaging, and the AI
panels are not in this slice.

## Build & distribution (not configured yet)

iOS binaries are built in the cloud via **EAS Build** (no macOS needed):

```powershell
npm install -g eas-cli
eas build --platform ios --profile preview
eas submit --platform ios
```

`eas.json` (development/preview/production profiles) and an Apple Developer
account are required before the first `eas build` — deferred to a later step.

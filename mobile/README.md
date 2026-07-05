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

## Build & distribution (EAS — Windows/PowerShell)

iOS binaries are built in the cloud via **EAS Build** — no macOS/Xcode needed.
`eas.json` defines three profiles:

- **development** — internal dev-client build (`expo-dev-client`) for on-device
  debugging against a LAN backend. Points `EXPO_PUBLIC_API_URL` at your dev
  machine's LAN IP (edit it in `eas.json`).
- **preview** — internal distribution (ad-hoc / TestFlight-style) against the
  deployed Vercel API.
- **production** — App Store build, `autoIncrement` on, against the Vercel API.

One-time setup:

```powershell
npm install -g eas-cli
eas login                      # your Expo account
eas init                       # links the project, writes extra.eas.projectId
```

Fill in the real values before building/submitting:

- In `eas.json`, replace the `your-app.vercel.app` URLs and the `REPLACE_WITH_*`
  submit fields (`appleId`, `ascAppId`, `appleTeamId`). EAS can also manage these
  interactively at submit time instead of storing them here.

Build & submit:

```powershell
# On-device dev build (install once, then use the Metro dev server)
eas build --platform ios --profile development

# Shareable internal build
eas build --platform ios --profile preview

# App Store build + submission (EAS manages signing/certificates)
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Requires an **Apple Developer account** (you have one). EAS handles certificates
and provisioning profiles; you'll authenticate with Apple when prompted (or via
`eas credentials`).

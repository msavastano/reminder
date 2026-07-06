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
- **preview** — internal (ad-hoc) distribution against the deployed Vercel API.
  Installs only on devices whose UDID you register (`eas device:create`).
- **production** — App Store distribution build, `autoIncrement` on. Needs **no**
  device registration.

The EAS project is already linked in `app.config.ts` (`owner` +
`extra.eas.projectId`), so `eas init` is **not** needed and non-interactive
GitHub/dashboard builds resolve the project automatically.

Before a build actually reaches a real backend, set the profile's
`EXPO_PUBLIC_API_URL` in `eas.json` to your deployed Vercel URL (the
`your-app.vercel.app` values are placeholders). This does **not** block the
build; it only affects which API the installed app calls.

### iOS signing credentials

A build fails at the signing step until an Apple Distribution Certificate +
Provisioning Profile exist on EAS. GitHub/dashboard builds run
non-interactively and can't create them on the fly, so establish them **once**
by initiating a build from your terminal (the build still runs in EAS cloud;
this just lets you answer the Apple prompts). The **production** profile is the
least-friction target because App Store distribution needs no device UDIDs:

```powershell
npm install -g eas-cli
eas login                                     # account in your Expo org
cd mobile
eas build --platform ios --profile production
```

First-time prompts: log in to your Apple account (Apple ID + 2FA), pick the Team
with your paid membership, then answer **Yes** to "Generate a new Apple
Distribution Certificate" and "Generate a new Apple Provisioning Profile". EAS
registers the bundle ID `com.reminder.mobile`, creates the cert + profile, and
stores them on EAS servers. After this, **re-running the GitHub/dashboard build
reuses them with no prompts**.

Fully-automated alternative (no terminal): create an **App Store Connect API
Key** (App Store Connect → Users and Access → Integrations → App Store Connect
API; role App Manager), download the `.p8` once, note the Key ID + Issuer ID, and
add it under the project's iOS credentials in the Expo dashboard (or
`eas credentials`). EAS then manages certs/profiles with zero interactive Apple
login.

> Never commit the `.p8`, your Apple ID, or any key to the repo or `eas.json`.
> The `submit.*` Apple fields in `eas.json` are read only by `eas submit`, never
> by `eas build`.

### Install on your own iPhone / submit

```powershell
# Install a test build on your iPhone — register the device first
eas device:create
eas build --platform ios --profile preview

# App Store build + submission (fill in eas.json submit.* fields first)
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

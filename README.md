# Smart Disaster Early-Warning & Emergency Coordination System (Sri Lanka)

One backend, two clients.

```
apps/api      Node + Express + TypeScript + Prisma  → Neon PostgreSQL
apps/web      React + Vite + Tailwind + react-leaflet (OpenStreetMap)
apps/mobile   React Native (Expo)
```

| Actor | App | Demo login (password `Password123!`) |
|---|---|---|
| DMC Officer | Web | dmc@demo.lk |
| District Officer ("EOC Coordinator" in the wireframes) | Web | district@demo.lk |
| Organisation Coordinator | Web | org@demo.lk |
| Citizen | Mobile | citizen@demo.lk |
| Community Volunteer | Mobile | volunteer@demo.lk |
| Rescue Team Leader | Mobile | leader@demo.lk |
| Shelter Operator | Mobile | shelter@demo.lk |

## 1. Database (Neon)
1. Create a free project at https://neon.tech.
2. Copy the **pooled** and **direct** connection strings.
3. `cp apps/api/.env.example apps/api/.env` and paste them in.

## 2. Install and run
```bash
npm install                      # installs api + web (workspaces)
cd apps/api
npx prisma generate
npx prisma db push               # creates tables in Neon
npm run db:seed                  # demo data
cd ../..
npm run api                      # http://localhost:4000
npm run web                      # http://localhost:5173   (copy apps/web/.env.example to .env if the API URL differs)
```

Mobile (separate install, it is not part of the workspaces):
```bash
cd apps/mobile
npm install
cp .env.example .env             # set EXPO_PUBLIC_API_URL to your PC's LAN IP, e.g. http://192.168.1.10:4000/api
npx expo start                   # scan the QR with Expo Go
```

## Design rules implemented (from the improved report)
- UC1: authorization on every action, recipient count shown before sending, no issue with 0 recipients, **unique citizens reached**, retry failed alerts, escalate/cancel.
- UC2: GPS failure → manual location, offline queue with client UUIDs (idempotent), volunteer priority, Under Review lock, Request More Info adds to the SAME report.
- UC3: ranked available teams, declined/timed-out teams removed automatically, configurable timeout (`COORDINATOR_TIMEOUT_MIN`), Returning ≠ Completed (leader confirms completion).
- UC4: alternatives by distance + capacity, offline updates revalidated (conflicts flagged, not applied), stock shown and validated before and inside the transaction.

## Not covered by the supplied wireframes (placeholders / simple UI)
Login screens, Citizens/Notifications/Settings/Hazard-events pages, Org Coordinator pages, District Officer centre dashboard, Team Leader and alerts screens on mobile.

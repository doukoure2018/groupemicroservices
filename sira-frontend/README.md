# sira-frontend — Monorepo React / React Native

Migration du frontend SIRA Guinée / SYNERGIA : Angular → React (web), Flutter → React Native/Expo (mobile).
Le backend (gateway `:9000`) ne change pas — tout ce monorepo consomme le même contrat API.

## Structure

```
sira-frontend/
├── packages/
│   ├── core/         @sira/core       — modèles métier TypeScript (portés depuis src/app/interface Angular),
│   │                                    helpers de formatage GNF/durées/LocalTime, machine à états offres, rôles
│   ├── api-client/   @sira/api-client — client HTTP typé de TOUS les endpoints (billetterie, user, immo),
│   │                                    refresh automatique + rejeu sur 401, endpoints publics sans Bearer
│   └── auth/         @sira/auth       — PKCE réel (corrige dette S1), refresh silencieux (corrige dette T1),
│                                        stores de jetons (mémoire web / SecureStore mobile), login REST mobile
├── e2e/              @sira/e2e        — tests Playwright de PARITÉ : exécutés d'abord contre l'Angular actuel,
│                                        ils deviennent le contrat que le React devra respecter (même E2E_BASE_URL à changer)
└── apps/             (phase 1+)
    ├── web/          React 19 + Vite + TanStack Query + PrimeReact   (à créer en phase 1)
    └── mobile/       Expo + expo-router + TanStack Query             (à créer en phase 3)
```

## Commandes

```bash
npm install                # depuis sira-frontend/
npm run build              # compile les 3 paquets
npm run typecheck          # vérification TypeScript stricte

# Tests de parité (l'app Angular doit tourner : npm start dans frontend/ultima-ng-19.0.0)
npx playwright install chromium --with-deps    # une seule fois
E2E_BASE_URL=http://localhost:4202 npm run test:e2e

# Suite complète (44 tests, écrans connectés inclus) contre l'environnement de test :
E2E_BASE_URL=https://test.synergia-guinee.com E2E_EMAIL=<compte SUPER_ADMIN> E2E_PASSWORD=<mot de passe> \
  npx playwright test --config e2e/playwright.config.ts --workers 1

# Code local contre le backend de test (sans pile Spring) : proxy Vite vers l'API distante,
# puis E2E_BASE_URL=http://localhost:5173. Reconstruire dist/ des packages après toute
# modification de packages/* (npx tsc -b packages/core packages/api-client packages/auth).
SIRA_API_DISTANTE=https://test.synergia-guinee.com npx vite --config apps/web/vite.config.ts apps/web --port 5173
```

## Décisions de la phase 0

| Décision | Raison |
|---|---|
| TypeScript strict partout | les 23 modèles Angular étaient déjà typés ; on ne régresse pas |
| `ApiResponse<T>` générique | remplace le `IResponse.data` fourre-tout Angular : chaque endpoint déclare son payload |
| Access token jamais en localStorage | dette sécurité de l'ancien front ; mémoire + refresh token (sessionStorage web, SecureStore mobile) |
| PKCE généré à chaque login | l'ancien front avait un `code_verifier` en dur dans le bundle (dette S1) |
| Refresh + rejeu sur 401 dans le client HTTP | l'ancien front déconnectait au premier 401 (dette T1) ; permettra de re-raccourcir le TTL 8 h côté serveur (V30) |
| Endpoints publics avec `auth: false` explicite | reproduit la skip-list du TokenInterceptor Angular, mais déclarée endpoint par endpoint |

## Prochaines étapes (phase 1)

1. `apps/web` : scaffold Vite + React, brancher `createSiraApi` + `AuthSession`, pages home publique + recherche + réservation.
2. Compléter la suite e2e au fil des écrans migrés (réservation, login) — chaque écran migré = ses tests d'abord verts sur Angular, puis verts sur React.
3. Côté backend, une fois le refresh silencieux en service : re-raccourcir le TTL access token (V30 → 15–30 min).

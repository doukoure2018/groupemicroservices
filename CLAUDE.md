# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microservices application with a Spring Boot backend and a React web frontend for transport ticketing (billetterie) and real estate (immobilier) in Guinea. The mobile app is being rebuilt in React Native (Expo) in `sira-frontend/apps/mobile`; the legacy Flutter app in `mobile_app/` stays until parity.

## Tech Stack

- **Backend**: Java 21, Spring Boot 3.4.1, Spring Cloud 2024.0.0
- **Web frontend**: React 19 + TypeScript + Vite, PrimeReact 10 (keep ^10, v11 is incompatible), TanStack Query, react-router-dom 7, npm workspaces monorepo in `sira-frontend/`
- **Mobile**: Expo SDK 58 + Expo Router in `sira-frontend/apps/mobile` (`EXPO_PUBLIC_ENV=test|prod`, defaults to test; run `npx expo start` there, verify with `npx tsc --noEmit`, `npx expo-doctor`, `npx expo export`). Legacy Flutter app in `mobile_app/` until parity. React must stay a single version across the monorepo (currently 19.3.0): a duplicate React breaks the mobile bundle.
- **Database**: PostgreSQL 16 (port 5433)
- **Messaging**: Apache Kafka
- **Auth**: OAuth2 Authorization Server with JWT

## Build Commands

### Backend (from `/microservers`)
```bash
# Build all services
mvn clean package

# Build specific service
mvn -pl userservice clean package

# Run single service (example)
mvn -pl userservice spring-boot:run

# Run tests for all services
mvn test

# Run tests for specific service
mvn -pl userservice test

# Build Docker images (uses JIB)
mvn package jib:build
```

### Web frontend (from `/sira-frontend`)
```bash
npm install                                   # Install all workspaces
npx tsc -b packages/core packages/api-client packages/auth   # Rebuild shared packages (@sira/* resolve via dist/)
npm run dev --workspace @sira/web             # Vite dev server on port 5173 (proxies API to gateway :9000)
npm run build --workspace @sira/web           # Production build
cd e2e && E2E_BASE_URL=http://localhost:5173 E2E_EMAIL=... E2E_PASSWORD=... npx playwright test   # 47 e2e tests (run from e2e/)
```
Shared code lives in `packages/` (`@sira/core` models and formatting, `@sira/api-client` typed API, `@sira/auth` PKCE and sessions) and must never be duplicated between web and mobile.

### Database Migrations
```bash
# Local environment
./microservers/migrate-local.sh

# Or manually
mvn -pl database-migrations compile
mvn -pl database-migrations flyway:migrate -Plocal
```

### Docker Compose
```bash
# Start infrastructure only (db, kafka, zookeeper)
docker compose up postgresdb kafka zookeeper -d

# Run migrations
docker compose --profile migration up flyway-migrations

# Start all services
docker compose up -d
```

## Architecture

### Microservices (in `/microservers`)

| Service | Port | Purpose |
|---------|------|---------|
| gateway | 9000 | API Gateway - single entry point |
| authorizationserver | 8090 | OAuth2/JWT authentication |
| discoveryserver | 5003 | Eureka service registry |
| userservice | 8095 | User management |
| billetterieservice | 8097 | Ticketing/events |
| notificationserver | 8096 | Email notifications (SendGrid) |
| clients | - | Shared OpenFeign clients |
| database-migrations | - | Flyway SQL migrations |

### Gateway Routes
- `/authorization/**` → authorizationserver
- `/user/**` → userservice
- `/billetterie/**` → billetterieservice
- `/notification/**` → notificationservice

### Service Package Structure
Each service follows: `io.multi.<servicename>` with subdirectories:
- `domain/` - JPA entities
- `dto/` - Data transfer objects
- `repository/` - Spring Data repositories
- `service/` - Business logic
- `resource/` - REST controllers
- `security/` or `securite/` - Security config

### Web Frontend Structure (`/sira-frontend/apps/web/src`)
- `pages/` - Public and client pages (home, auth, reservation, payment return, my trips, agency, compliance)
- `pages/admin/` - Back-office screens behind `AdminLayout` + `RequireRole`; `ReferentielCrud.tsx` is the generic CRUD, `shared.tsx` holds notifications and confirmations
- `pages/accueil/` - Static editorial sections of the home page (map, travel guide, services...)
- `components/` - Shared UI (auth card, error boundary, document title, order confirmation)
- `api.ts` / `auth-context.tsx` - API client instance and session; styles in `styles.css` plus per-area CSS files

## Key Configuration Files

- `.env` / `.env.prod` - Environment variables (DB credentials, OAuth settings)
- `docker-compose.yml` - Container orchestration
- `microservers/pom.xml` - Parent Maven POM with shared dependencies
- `sira-frontend/apps/web/vite.config.ts` - Vite dev proxy (same-origin API calls relayed to the gateway, `/authorization` prefix stripped in dev only)
- `nginx/` - Host vhosts uploaded by `backend-cd.yml` (prod web on 127.0.0.1:4203, test web on 14203)

## Inter-Service Communication

- **Sync**: OpenFeign clients via Eureka service discovery
- **Async**: Kafka for event-driven messaging between services
- **Auth**: JWT tokens validated against authorizationserver JWKS endpoint

## Database

- Single PostgreSQL instance shared by services
- Migrations in `/microservers/database-migrations/src/main/resources/db/migration/`
- Migration naming: `V{version}__{description}.sql`

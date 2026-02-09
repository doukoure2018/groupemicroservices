# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant microservices application with Spring Boot backend and Angular frontend for a ticketing/billetterie system.

## Tech Stack

- **Backend**: Java 21, Spring Boot 3.4.1, Spring Cloud 2024.0.0
- **Frontend**: Angular 19, PrimeNG 19, TailwindCSS
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

### Frontend (from `/frontend/ultima-ng-19.0.0`)
```bash
npm install          # Install dependencies
npm start            # Dev server on port 4202
npm run build        # Production build
npm test             # Run Karma tests
npm run format       # Prettier formatting
```

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

### Frontend Structure (`/frontend/ultima-ng-19.0.0/src/app`)
- `pages/` - Page components (auth, dashboard, crud, etc.)
- `apps/` - Feature modules (blog, chat, files, kanban, mail, tasklist)
- `layout/` - Layout components
- `service/` - Angular services
- `interceptors/` - HTTP interceptors (TokenInterceptor, CacheInterceptor)

## Key Configuration Files

- `.env` / `.env.prod` - Environment variables (DB credentials, OAuth settings)
- `docker-compose.yml` - Container orchestration
- `microservers/pom.xml` - Parent Maven POM with shared dependencies
- `frontend/ultima-ng-19.0.0/angular.json` - Angular build config

## Inter-Service Communication

- **Sync**: OpenFeign clients via Eureka service discovery
- **Async**: Kafka for event-driven messaging between services
- **Auth**: JWT tokens validated against authorizationserver JWKS endpoint

## Database

- Single PostgreSQL instance shared by services
- Migrations in `/microservers/database-migrations/src/main/resources/db/migration/`
- Migration naming: `V{version}__{description}.sql`

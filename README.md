# GroupeMicroservices — Plateforme de Billetterie de Transport Routier

Plateforme microservices Spring Boot / Angular pour la **réservation de places dans les véhicules de transport interurbain** (Guinée). Système complet : gestion des trajets, véhicules, offres datées, réservations multi-passagers, billets QR, paiements, notifications email/SMS.

---

## 📑 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Services d'infrastructure](#-1-services-dinfrastructure)
  - [discoveryserver](#11-discoveryserver-port-5003--eureka-server)
  - [gateway](#12-gateway-port-9000--spring-cloud-gateway-mvc)
  - [authorizationserver](#13-authorizationserver-port-8090--oauth2-authorization-server)
- [Services métier](#-2-services-métier)
  - [userservice](#21-userservice-port-8095--gestion-des-utilisateurs)
  - [billetterieservice](#22-billetterieservice-port-8097--cœur-métier)
  - [notificationserver](#23-notificationserver-port-8096--emails--sms)
  - [clients](#24-clients--module-partagé-openfeign)
- [Modèle de données](#-3-modèle-de-données-12-migrations-flyway)
- [Flux métier](#-4-flux-métier-complets)
- [Fonctionnalités par domaine](#-5-synthèse-des-fonctionnalités-par-domaine)
- [Démarrage](#-démarrage)
- [Points d'attention](#-points-dattention)

---

## 🎯 Vue d'ensemble

Le projet est une **plateforme de billetterie de transport routier en Guinée** : système de réservation de places dans des véhicules de transport interurbain (bus, minibus, taxi-brousse, 4x4, van).

**Acteurs** :
- **Clients** : recherchent et réservent des trajets
- **Transporteurs** : enregistrent leurs véhicules et publient des offres
- **Contrôleurs** : valident les billets au scan QR
- **Administrateurs** : gèrent le référentiel et les utilisateurs

---

## 🛠 Stack technique

| Couche | Technologie |
|---|---|
| **Backend** | Java 21, Spring Boot 3.4.1, Spring Cloud 2024.0.0 |
| **Frontend Web** | Angular 19, PrimeNG 19, TailwindCSS |
| **Mobile** | Flutter (Dart) — deep-link `com.billetterie.gn://` |
| **Base de données** | PostgreSQL 16 + PostGIS (interne 5433, host 5435 par défaut, configurable via `POSTGRES_HOST_PORT`) |
| **Messaging** | Apache Kafka |
| **Auth** | OAuth2 Authorization Server, JWT RSA, PKCE, MFA TOTP |
| **Email** | JavaMailSender + Gmail SMTP + Thymeleaf |
| **SMS** | Orange API Guinée |
| **Service Discovery** | Netflix Eureka |
| **API Gateway** | Spring Cloud Gateway MVC |
| **Migrations BD** | Flyway |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTENDS                                                  │
│  • Angular 19 (web - port 4202)                             │
│  • Mobile App (Flutter - com.billetterie.gn:// deep-link)   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS + JWT
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  GATEWAY (port 9000) — point d'entrée unique                │
│  Routes: /authorization /user /billetterie /notification    │
└──┬────────────────┬────────────────┬──────────────────────┬─┘
   ▼                ▼                ▼                      ▼
┌──────────┐  ┌──────────┐    ┌─────────────────┐  ┌──────────────────┐
│ AUTH-SRV │  │ USER-SRV │    │ BILLETTERIE-SRV │  │ NOTIFICATION-SRV │
│ :8090    │  │ :8095    │    │ :8097           │  │ :8096            │
│ OAuth2/  │  │ Profils  │    │ Trajets/Offres/ │  │ Email (Gmail)    │
│ JWT/MFA  │  │ MFA/SMS  │    │ Billets/Paiement│  │ SMS (Orange)     │
└────┬─────┘  └────┬─────┘    └─────┬───────────┘  └────────▲─────────┘
     │             │                │                       │
     │             │                │   Kafka NOTIFICATION_TOPIC
     └─────────────┴────────────────┴───────────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ DISCOVERY (Eureka:5003) │
              │ PostgreSQL (:5433 int)  │
              │ Kafka (:9092)           │
              └─────────────────────────┘
```

| Service | Port (dev) | Port (prod) | Rôle |
|---|---|---|---|
| gateway | 9000 | 9000 | Point d'entrée unique |
| authorizationserver | 8090 | 8090 | OAuth2 / JWT |
| discoveryserver | 5003 | 8761 | Eureka registry |
| userservice | 8095 | 8091 | Gestion utilisateurs |
| billetterieservice | 8097 | 8097 | Métier billetterie |
| notificationserver | 8096 | 8093 | Email + SMS |

---

## 🧩 1. Services d'infrastructure

### 1.1 `discoveryserver` (port 5003) — Eureka Server
- Registre central des services
- Authentification HTTP Basic (`manager:manager2711`)
- Données utilisateurs lues depuis PostgreSQL pour auth
- Prod : port 8761, self-preservation activé

### 1.2 `gateway` (port 9000) — Spring Cloud Gateway MVC

**Routes** :
| Préfixe | Service cible |
|---|---|
| `/authorization/**` | `lb://AUTHORIZATIONSERVER` |
| `/user/**` | `lb://USERSERVICE` |
| `/billetterie/**` | `lb://BILLETTERIESERVICE` |
| `/notification/**` | `lb://NOTIFICATIONSERVICE` |

**Sécurité** :
- OAuth2 Resource Server, valide JWT via JWKS (`http://localhost:8090/oauth2/jwks`)
- **CORS** : autorise `localhost:4202` (web), domaines `guidipress-io.com`, schéma de deep-link mobile `com.billetterie.gn://`
- **Endpoints publics** : `/user/register`, `/user/verify/**`, `/user/resetpassword/**`, `/user/image/**`

### 1.3 `authorizationserver` (port 8090) — OAuth2 Authorization Server

**3 flux d'authentification supportés** :

| Flux | Endpoint | Usage |
|---|---|---|
| **OAuth2 Authorization Code + PKCE** | `/oauth2/authorize`, `/oauth2/token` | Web + Mobile |
| **Direct Token API (JSON)** | `POST /api/auth/token` | App mobile native |
| **Google OAuth2** | `POST /api/auth/google` ou redirect web | Login Google |

**Caractéristiques** :
- **JWT signés RSA** (clés `private.key` / `public.key`)
- **MFA TOTP** (Google Authenticator/Authy) avec QR code généré
- **3 types de tokens** : `access_token` (1h), `refresh_token` (30 jours), `id_token` OIDC (30 min)
- **2 clients OAuth2** : `client` (web) et `mobile-app-client` (mobile, PKCE obligatoire)
- **Producteur Kafka** : publie `USER_CREATED`, `RESETPASSWORD` sur `NOTIFICATION_TOPIC`

**Endpoints clés** :
- OAuth2 : `/oauth2/authorize`, `/oauth2/token`, `/oauth2/jwks`, `/oauth2/userinfo`
- API mobile : `/api/auth/token`, `/api/auth/register`, `/api/auth/google`, `/api/auth/refresh`
- Web : `/login`, `/register`, `/forgot-password`, `/mfa`, `/logout`

---

## 🧩 2. Services métier

### 2.1 `userservice` (port 8095) — Gestion des utilisateurs

> ⚠️ **Architecture particulière** : utilise **JDBC brut** (`JdbcClient`) avec **procédures/fonctions PostgreSQL stockées**, pas JPA.

**Fonctionnalités principales** :

| Catégorie | Endpoints | Description |
|---|---|---|
| **Inscription** | `POST /user/register` | Crée compte + envoie email de vérification (token 24h) |
| **Vérification compte** | `GET /user/verify/account?token=X` | Active le compte après clic email |
| **Mot de passe** | `POST /user/updatepassword`, `POST /user/resetpassword`, `POST /user/resetpassword/reset` | Changement + reset 3 étapes |
| **Profil** | `GET /user/profile`, `PATCH /user/update`, `GET /user/photo` | Profil utilisateur + upload photo |
| **MFA TOTP** | `PATCH /user/mfa/enable`, `PATCH /user/mfa/disabled` | Active/désactive MFA (QR code) |
| **Rôles** | `PATCH /user/{uuid}/role`, `GET /user/roles` | Gestion des rôles |
| **États compte** | `PATCH /user/toggleaccount{expired,locked,enabled}` | Bascule flags sécurité |
| **Récupération** | `GET /user/getUser/{id}`, `GET /user/user/{email}`, `GET /user/getUser/uuid/{uuid}` | Lecture user |

**Producteur Kafka** : `USER_CREATED`, `RESETPASSWORD` sur `NOTIFICATION_TOPIC`

**Intégration SMS Orange** (Guinée) : `OrangeSmsService` avec OAuth2, expéditeur `+224622459305`

### 2.2 `billetterieservice` (port 8097) — Cœur métier

Service le plus volumineux. **Domaine** : transport routier (trajets entre villes, véhicules avec chauffeurs, offres datées, réservations multi-passagers).

#### 📍 Référentiel géographique (hiérarchie 5 niveaux)
`Region` → `Ville` → `Commune` → `Quartier` → `Localisation` (GPS lat/long)

Puis :
- **Site** (gares routières) lié à une Localisation
- **Depart** et **Arrivee** (points de départ/arrivée dans un site)

#### 🚐 Gestion des véhicules
- **5 TypeVehicule** : Bus, Minibus, Taxi-brousse, 4x4, Van
- **Vehicule** : immatriculation, chauffeur, marque, modèle, places, climatisation
- **Documents** : assurance + visite technique (avec dates expiration)
- **Statuts** : ACTIF, INACTIF, EN_MAINTENANCE, SUSPENDU
- **CRUD complet** + recherche (climatisés, assurance expirée, etc.)

#### 🗺️ Trajets et offres
- **Trajet** : route définie entre `Depart` et `Arrivee`, avec `montantBase` + `montantBagages`
- **Offre** : instance datée d'un trajet sur un véhicule (date, heure, places, promotion)
- **Cycle de vie** : `EN_ATTENTE` → `OUVERT` → `EN_COURS` → `TERMINE` (ou `ANNULE`, `SUSPENDU`)
- **Calcul auto** : `niveauRemplissage` (%), `montantEffectif` (avec promo)
- **Recherche avancée** : par villes, dates, places disponibles, en promotion

#### 🎫 Commandes & billets (workflow principal)

```
POST /billetterie/commandes
  ├─ Vérifier offre (statut=OUVERT, places suffisantes)
  ├─ Calculer tarif : montantPlaces + 5000 GNF frais service + frais mode paiement
  ├─ Créer commande (statut=CONFIRMEE)
  ├─ Créer 1 billet par passager (statut=VALIDE, codeBillet généré)
  ├─ Enregistrer paiement (statut=REUSSI)
  └─ Publier Kafka COMMANDE_CONFIRMEE → emails + SMS
```

**Validation au scan (contrôleur)** :
```
POST /billetterie/billets/validate {codeBillet}
  ├─ Vérifier statut (si UTILISE → 409 CONFLICT avec infos billet)
  ├─ UPDATE billet → UTILISE + dateValidation + validePar
  ├─ Si tous billets UTILISE → commande passe à UTILISEE
  └─ Publier Kafka BILLET_VALIDE
```

**Annulation** : `PUT /billetterie/commandes/{uuid}/annuler` (≤ 48h, libère places, publie `COMMANDE_ANNULEE`)

#### 💳 Paiements
**6 modes** : Espèces, Orange Money, MTN Mobile Money, Credit Money, Carte Bancaire, Virement
- Frais configurables (% + fixe) par mode (table `modes_reglement`)
- Référence externe générée `PAY-XXXXXXXX`

#### ⭐ Avis voyageurs
- Note 1-5 + commentaire (1 avis par commande)
- Calcul auto de `noteMoyenne` du véhicule via trigger PostgreSQL

#### 🔔 Tâches planifiées (`@Scheduled` toutes les 15 min)
- **Remplissage** : détecte offres à 50%, 75%, 100% → publie `REMPLISSAGE_*`
- **Rappels** : J-1 et H-2 avant départ → publie `RAPPEL_J1`, `RAPPEL_H2`
- **Idempotence** : `existsByReference` empêche les doublons

#### Endpoints principaux

| Resource | Base path |
|---|---|
| Commandes | `/billetterie/commandes` |
| Billets | `/billetterie/billets` |
| Offres | `/billetterie/offres` |
| Trajets | `/billetterie/trajets` |
| Véhicules | `/billetterie/vehicules` |
| Avis | `/billetterie/avis` |
| Sites | `/billetterie/sites` |
| Régions/Villes/Communes/Quartiers | `/billetterie/{regions,villes,communes,quartiers}` |
| Localisations | `/billetterie/localisations` |
| Départs/Arrivées | `/billetterie/{departs,arrivees}` |
| Modes de règlement | `/billetterie/modes-reglement` |
| Types véhicules | `/billetterie/types-vehicules` |
| Partenaires | `/billetterie/partenaires` |
| Notifications | `/billetterie/notifications` |

### 2.3 `notificationserver` (port 8096) — Emails + SMS

> **Aucun endpoint REST**. Consommateur Kafka exclusivement (topic `NOTIFICATION_TOPIC`).

**12 types d'événements consommés** :

| Catégorie | Types |
|---|---|
| Compte | `USER_CREATED`, `RESETPASSWORD`, `ACCOUNT_VERIFIED` |
| Réservations | `COMMANDE_CONFIRMEE`, `COMMANDE_ANNULEE`, `BILLET_VALIDE` |
| Rappels | `RAPPEL_J1`, `RAPPEL_H2` |
| Remplissage | `REMPLISSAGE_50`, `REMPLISSAGE_75`, `REMPLISSAGE_100` |

**Stack** :
- **Emails** : JavaMailSender + Gmail SMTP + **8 templates Thymeleaf** (newaccount.html, bookingconfirmation.html, billetvalide.html, etc.)
- **SMS** : Orange API Guinée (OAuth2, sender `+224622459305`)
- Tous les envois **`@Async`** (non-bloquant)

### 2.4 `clients` — Module partagé OpenFeign

Module Maven minimal (interfaces + DTOs uniquement) :
- **UserClient** : `getUserById(Long)`, `getUserByUuid(String)` → pointe vers `userservice`
- **User DTO** partagé
- Utilisé par `billetterieservice` pour récupérer les emails utilisateurs

---

## 🗄 3. Modèle de données (12 migrations Flyway)

### Tables principales

**Authentification (V1, V4-V12)** :
`users`, `roles`, `user_roles`, `credentials`, `account_tokens`, `password_tokens`, `devices`, `oauth2_registered_client`

**Géographie (V2)** :
`regions` → `villes` → `communes` → `quartiers` → `localisations` → `sites` → `departs` → `arrivees`

**Transport (V2)** :
`types_vehicules`, `vehicules`, `trajets`, `offres`

**Commerce (V2)** :
`modes_reglement`, `commandes`, `billets`, `paiements`, `avis`

**Transversal (V2)** :
`notifications`, `partenaires`, `audit_logs`

### Mécanismes BD avancés (V3, V7)
- **Triggers de génération** : numéro commande (`CMD-YYYYMMDD-XXXX`), code billet (`TKT-XXXXXXXX` via MD5)
- **Trigger de places** : `update_places_disponibles` recalcule automatiquement les places sur les offres
- **Trigger d'évaluation** : `update_vehicule_rating` met à jour la note moyenne
- **Procédures stockées** : `create_user`, `create_account`, `enable_user_mfa`, `update_user_role`, etc.
- **3 vues** : `v_offres_disponibles`, `v_reservations_details`, `v_billets_details`

### Rôles (V8, V12)
`USER`, `TECH_SUPPORT`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`, `CONTROLEUR` (validation billets)

---

## 🔄 4. Flux métier complets

### Flux 1 : Inscription d'un utilisateur
```
1. POST /user/register → userservice crée user (enabled=false)
2. userservice publie Kafka USER_CREATED
3. notificationserver consomme → envoie email via Gmail
4. User clique lien → GET /user/verify/account?token=X
5. userservice active compte (enabled=true)
```

### Flux 2 : Réservation complète
```
1. User cherche offre : GET /billetterie/offres/recherche?villeDepart=X&villeArrivee=Y&date=Z
2. User réserve : POST /billetterie/commandes (CommandeRequest avec passagers)
3. billetterieservice :
   - Crée commande + billets + paiement
   - Décrémente places sur offre
   - Publie Kafka COMMANDE_CONFIRMEE
4. notificationserver consomme :
   - Email au passager (template bookingconfirmation.html)
   - Email au transporteur
   - SMS via Orange API
```

### Flux 3 : Validation au départ
```
1. Contrôleur scanne QR code : POST /billetterie/billets/validate {codeBillet}
2. billetterieservice :
   - Si billet UTILISE → 409 CONFLICT avec infos (écran orange mobile)
   - Sinon → marque UTILISE + dateValidation + validePar
   - Si tous billets de la commande UTILISE → commande passe à UTILISEE
   - Publie Kafka BILLET_VALIDE
3. notificationserver envoie email/SMS au passager
```

### Flux 4 : Notifications automatiques (Scheduled)
```
Toutes les 15 min :
  - Pour chaque offre OUVERT, calcule remplissage
  - Si seuil 50/75/100 franchi → notifie tous les réservataires
  - existsByReference empêche les doublons
```

---

## 📊 5. Synthèse des fonctionnalités par domaine

### 🔐 Authentification & Sécurité
- Inscription email/password avec vérification (token 24h)
- Login OAuth2 + Google OAuth2
- JWT (access/refresh/id) avec PKCE pour mobile
- MFA TOTP (QR code → Google Authenticator)
- Reset password en 3 étapes
- Devices tracking
- 6 rôles utilisateur
- Toggle account states (expired/locked/enabled)

### 👤 Gestion des utilisateurs
- CRUD profil (avec photo)
- SMS via Orange API (codes de vérification)
- Récupération par ID/UUID/email
- Gestion des rôles

### 🌍 Référentiel géographique
- 5 niveaux : Region → Ville → Commune → Quartier → Localisation
- 8 régions Guinée préchargées
- Sites (gares) avec horaires, capacité
- Géocodage (Google Places, OpenStreetMap)

### 🚐 Flotte de véhicules
- 5 types de véhicules (Bus, Minibus, Taxi-brousse, 4x4, Van)
- Documents : assurance + visite technique (avec alertes expiration)
- Statuts (ACTIF, MAINTENANCE, SUSPENDU)
- Notation moyenne automatique

### 🗺️ Trajets & Offres
- Création trajets avec tarif base + bagages
- Offres datées sur véhicules
- Cycle de vie complet (8 statuts)
- Promotions (montantPromotion < montant)
- Recherche par villes/date/places

### 🎫 Réservations & Billets
- Commandes multi-passagers
- Génération auto billets + codes QR uniques
- Validation au scan (anti-réutilisation)
- Annulation ≤ 48h avec libération des places
- 6 modes de paiement avec frais configurables
- Référence paiement traçable

### 📧 Communications
- 8 templates email Thymeleaf (Gmail SMTP)
- SMS Orange API (Guinée)
- Notifications in-app (BDD)
- Tâches planifiées : rappels J-1, H-2, remplissage

### ⭐ Avis & Évaluations
- Note 1-5 par commande
- Réponse du transporteur
- Calcul auto note moyenne véhicule

### 🛠️ Administration
- 5 rôles + CONTROLEUR
- Audit logs (JSONB old/new values)
- Partenaires (microfinance, points de vente, agences)
- Statistiques par catégorie (offres, véhicules, commandes)

---

## 🚀 Démarrage

### Backend (depuis `/microservers`)

```bash
# Build tous les services
mvn clean package

# Build un service spécifique
mvn -pl userservice clean package

# Lancer un service (exemple)
mvn -pl userservice spring-boot:run

# Tests
mvn test

# Build images Docker (JIB)
mvn package jib:build
```

### Frontend (depuis `/frontend/ultima-ng-19.0.0`)

```bash
npm install          # Install dépendances
npm start            # Serveur dev sur port 4202
npm run build        # Build production
npm test             # Tests Karma
npm run format       # Prettier
```

### Migrations BD

```bash
# Environnement local
./microservers/migrate-local.sh

# Manuellement
mvn -pl database-migrations compile
mvn -pl database-migrations flyway:migrate -Plocal
```

### Docker Compose

```bash
# Infrastructure uniquement (DB, Kafka, Zookeeper)
docker compose up postgresdb kafka zookeeper -d

# Migrations
docker compose --profile migration up flyway-migrations

# Tous les services
docker compose up -d
```

### Ordre de démarrage recommandé

1. PostgreSQL + PostGIS (interne 5433, host 5435 par défaut)
2. Kafka + Zookeeper
3. `discoveryserver` (Eureka, port 5003)
4. `authorizationserver` (port 8090)
5. `userservice` (port 8095)
6. `billetterieservice` (port 8097)
7. `notificationserver` (port 8096)
8. `gateway` (port 9000)
9. Frontend Angular (port 4202)

---

## ⚠️ Points d'attention

1. **`notificationserver`** : pas d'historique d'envoi en BD → risque de doublons si Kafka rejeu. Le contrôle d'idempotence (`existsByReference`) est implémenté côté `billetterieservice` uniquement.
2. **`sendgrid-java`** importé dans `notificationserver` mais inutilisé (le code utilise JavaMailSender/Gmail).
3. **`userservice`** : utilise JDBC + procédures stockées PostgreSQL (`spring.jpa.hibernate.ddl-auto: update` configuré mais inactif sans entités JPA).
4. **Domaine réel** : malgré le nom "billetterie", le système est spécialisé **transport routier en Guinée** (devise GNF, Orange API, régions guinéennes).
5. **Annulation 48h** : la limite de 48h est appliquée côté mobile, pas systématiquement côté backend.

---

## 📁 Structure du projet

```
groupemicroservices/
├── microservers/                      # Backend (parent Maven)
│   ├── pom.xml                        # POM parent
│   ├── gateway/                       # API Gateway (9000)
│   ├── authorizationserver/           # OAuth2 (8090)
│   ├── discoveryserver/               # Eureka (5003)
│   ├── userservice/                   # Users (8095)
│   ├── billetterieservice/            # Métier (8097)
│   ├── notificationserver/            # Email/SMS (8096)
│   ├── clients/                       # Module Feign partagé
│   ├── database-migrations/           # Flyway (V1-V12)
│   ├── migrate-local.sh
│   └── migrate-prod.sh
├── frontend/ultima-ng-19.0.0/         # Angular 19 + PrimeNG
├── mobile_app/                        # App Flutter (Dart)
├── nginx/                             # Reverse proxy prod
├── docker-compose.yml
├── .env / .env.prod
└── CLAUDE.md
```

---

## 🔑 Configuration

Variables d'environnement principales (`.env`) :
- Credentials PostgreSQL
- Credentials Gmail SMTP (`GMAIL_USERNAME`, `GMAIL_APP_PASSWORD`)
- Credentials Orange API
- URLs des services (prod)
- Client OAuth2 (`client_id`, `client_secret`)

---

## 📜 Licence

Projet privé — GroupeMicroservices

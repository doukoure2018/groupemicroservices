# Registre des dettes techniques — SIRA Guinée / SYNERGIA

> Dernière mise à jour : 2026-07-11.
> Priorités : 🔴 sécurité (à traiter en premier) · 🟠 technique · 📄 documentation.
> Quand une dette est réglée, la déplacer dans la section « Réglées » en bas avec la date.

---

## 🔴 Sécurité

### S1. PKCE annulé côté web
Le `code_challenge` est en dur dans `frontend/ultima-ng-19.0.0/src/app/utils/fileutils.ts`
et le `code_verifier` en dur dans `src/app/pages/home/home.component.ts` (~L229).
Le verifier fixe est livré dans le bundle JS : la protection PKCE du flux
Authorization Code web est nulle.
**Cible** : générer challenge/verifier dynamiquement (Web Crypto) à chaque login.

### S2. Secrets en dur versionnés (externaliser PUIS roter)
Toutes ces valeurs sont dans l'historique git : les roter après externalisation.
- Credentials Orange SMS API en clair dans `application.yml` de `userservice`,
  `billetterieservice`, `notificationserver` (valeurs différentes selon le service).
- Mot de passe PostgreSQL `manager2711` dans tous les `application.yml` dev **et**
  dans `microservers/database-migrations/pom.xml` (profil prod, avec IP publique
  `51.91.254.218`).
- Basic Auth Eureka `manager:manager2711` dans les `defaultZone` de tous les services.
- MinIO `minioadmin:minioadmin` dans `immobilierservice/src/main/resources/application.yml`.
- Clé API Google en clair dans `src/app/service/google.place.service.ts` (bundle Angular).

Contre-exemples déjà propres (à imiter) : Google OAuth, FCM (`FCM_SERVICE_ACCOUNT_B64`),
Gmail SMTP, BDD prod — tous via `${VAR}`.

### S3. Feign sans token M2M (dettes #23/#24, documentées dans `clients/UserClient`)
Les appels Feign inter-services partent sans header `Authorization` et ne fonctionnent
que grâce aux `permitAll` de `/user/getUser/**`, `/user/by-role/**` côté userservice.
Fermer ces permitAll aujourd'hui = cascade de 401 silencieuse.
**Cible** : grant `client_credentials` + `RequestInterceptor` Feign, puis fermeture
des permitAll. Inclut la dette `feign-eureka-bypass` (URL directe au lieu du
load-balancing Eureka, bug Spring Cloud 4.2.0 — re-tester après montée de version).

### S4. Signature Android release avec les clés debug
`mobile_app/android/app/build.gradle.kts` (TODO explicite) : `signingConfig` release
pointe sur les clés debug. Bloque la publication Play Store.
**Cible** : keystore de release dédié, hors git, injecté en CI.

### S4b. Clés RSA de l'auth server non provisionnées + fallback mémoire silencieux (2026-07-09)
Le dossier `keys/` monté sur `/app/keys` était **vide** sur TEST **et** PROD :
l'authorizationserver générait des clés RSA **jetables en mémoire** à chaque
démarrage (`KeyUtils.generateInMemoryKeys`), invalidant tous les JWT au moindre
redémarrage (déconnexion générale, échecs de validation JWKS en cascade).
Révélé le 2026-07-09 par un redéploiement CD TEST.
- **Réglé sur TEST** : `openssl genpkey -algorithm RSA` (PKCS8) + `openssl rsa -pubout`
  (X509) dans `~/sira-guinee/test/keys/`, `chmod 644`, restart. Log de contrôle :
  « Successfully loaded RSA keys from files ».
- **PROD encore à faire** (dossier vide) — mêmes commandes, clés distinctes.
- **Cibles** : (1) documenter la génération des clés dans `docs/deploy-ovh-sira.md`
  (checklist nouveau serveur) ; (2) en prod, **échouer le démarrage** si les clés
  fichier sont absentes au lieu de basculer silencieusement en mémoire (un flag
  `key.require-file: true` sur le profil prod) ; (3) le `keyId` est codé en dur
  dans `KeyUtils.buildRSAKey` (« Fixed UUID ») — acceptable mais à externaliser.

### S5. Logs fuitant des préfixes de tokens
- `src/app/interceptors/token.interceptor.ts` : ~15 `console.log` par requête, dont le
  token tronqué.
- `mobile_app/lib/services/api_service.dart` : `debugPrint` d'un préfixe de token ;
  `print()` bruts dans `auth_service.dart` / `auth_provider.dart`.
**Cible** : supprimer les logs de debug en production.

---

## 🟠 Technique

### T1. Refresh silencieux Angular (ajoutée le 2026-07-05)
Le `TokenInterceptor` purge les tokens et déconnecte au premier 401 : la session web
dure exactement la durée de l'access token (8 h depuis la migration V30 ; 5 min avant).
**Cible** : sur 401 (ou juste avant expiration), appeler le `tokenEndpoint` avec
`grant_type=refresh_token`, stocker les nouveaux tokens, rejouer la requête ; ne
déconnecter que si le refresh échoue. Gérer les requêtes concurrentes pendant le
refresh (pattern déjà implémenté côté Flutter dans `lib/services/api_service.dart`).
Une fois en place, re-raccourcir l'access token web (meilleur compromis sécurité).

### T2. `notificationserver` hors du build parent
Le module a un `pom.xml` mais n'est pas déclaré dans `<modules>` de
`microservers/pom.xml` : un `mvn` racine ne le construit pas (le CD le builde à part).
**Cible** : l'ajouter aux modules et simplifier `backend-cd.yml`.

### T3. Couverture de tests quasi nulle
1 seul test backend (`authorizationserver/.../MobileTokenServiceGoogleIdTokenTest`),
0 test Angular (aucun `.spec.ts`), 1 test Flutter cassé (template compteur par défaut).
**Cible prioritaire** : chemins critiques — création de commande + billets, validation
QR (dont le 409 « déjà utilisé »), modération immo, refresh token, login OAuth2 web.

### T4. Duplication `Event`/`Notification` billetterie ↔ immobilier
TODO explicite dans `immobilierservice/.../event/EventType.java` : classes copiées
depuis billetterieservice. **Cible** : extraire dans le module partagé `clients/`.

### T5. Endpoints publics immo dupliqués gateway ↔ immobilierservice
La liste des GET publics (`/immo/proprietes/recherche`, `/immo/photos/*`, …) doit être
maintenue à la main aux deux endroits (documenté dans
`gateway/.../security/ResourceServerConfig.java`). Toute divergence = 401 ou fuite.

### T6. URLs frontend figées à la compilation (`frontend-fileutils-hardcoded-urls`)
Pas de `src/environments/` : `server`, `authorizationServer`, `tokenEndpoint`,
`redirectUri` sont en dur dans `fileutils.ts` → 2 images Docker par environnement
(build-args), rien de configurable au runtime. Inclut l'écart de context-path
(`/authorization` en profil prod, absent en dev Maven — voir le commentaire posé dans
`fileutils.ts` le 2026-07-05).
**Cible** : `environment.ts` + substitution runtime (config.json chargé au boot ou
envsubst nginx).

### T7. Port Kafka incohérent en dev
`userservice/src/main/resources/application.yml` pointe sur `localhost:9092`, tous les
autres services sur `9093` (port exposé par le compose). En dev Maven local, les
notifications de userservice ne partent pas.

### T8. Code mort côté Angular (template Ultima)
- Pages/apps de démo routées : `uikit/*`, `blocks/*`, `ecommerce/*`, `landing/*`,
  `usermanagement/*`, `apps/*` (mail, chat, kanban, blog, tasklist, files) ;
  > 11 000 lignes de mocks dans `pages/service/*`.
- Liens de menu cassés : `/dashboards/credit` et `/dashboards/manager`
  (dans `app.menu.ts`) n'existent pas dans `dashboard.routes.ts` → `/notfound` ;
  `resp-agent.component.ts` non routé.
- `provideHttpClient` appelé deux fois dans `app.config.ts` (L42-43), le second sans
  interceptors.

### T9. Dettes Flutter
- Deux clients HTTP dupliqués (`lib/services/api_service.dart` vs
  `lib/shared/http/api_client.dart`) avec logique de refresh copiée.
- `go_router` déclaré dans `pubspec.yaml` mais navigation 100 % impérative
  (`routes_manager.dart` = code mort).
- Onglet Profil du hub = placeholder.
- `mobile-rejet-republier-2-step-not-atomic` : rejet → republication d'annonce en
  2 étapes non atomiques.
- Branding incohérent (pubspec `DIGI CRG`, config `SIRA Guinée`, hub `YIGUI`,
  natif `SYNERGIA IMMO TRANS GN`, package `com.billetterie.gn`).

### T10. Paiement mobile non intégré à un PSP
`payment_screen.dart` : Orange Money / MTN MoMo / CB = simple code de mode envoyé avec
la commande (`POST /billetterie/commandes`), aucun SDK ni callback de paiement réel.

### T11b. Onboarding agences — suites (ajoutée le 2026-07-06)
- **Audit conformité léger** : les décisions approuver/rejeter d'agences sont tracées
  par logs + colonnes `motif_rejet`/`updated_at`, mais pas dans `immo_admin_action`
  (table liée aux propriétés). Étendre l'audit aux agences (migration + adminUserId).
- **Compte ADMIN_CONFORMITE de prod** : créé à la main en local
  (`conformite@sira-guinee.local`) ; pour TEST/PROD, créer le compte via migration
  (pattern V27/V28 ADMIN_BACKOFFICE).
- **Document RCCM sur bucket public** : l'upload réutilise le bucket `immo-photos`
  (public en download). Les RCCM sont des documents d'entreprise semi-sensibles —
  prévoir un bucket privé + URLs présignées pour la conformité.

### T12. Refactoring du parcours transport billetterie (ajoutée le 2026-07-11)
Analyse complète du parcours de configuration (géo 5 niveaux + infra transport) faite
le 2026-07-11. Principe directeur : **tout doit rester additif** (l'immobilier lit les
tables géo en SQL direct, le mobile consomme `villes/active`, `sites/actifs`,
`offres/recherche`, `communes`, `quartiers/commune/*`, et 3 vues SQL figent les noms
de colonnes). La Phase 0 (corrections sans risque) est faite — voir « Réglées ».

- **T12a — Phase 1 : dénormaliser la ville sur `sites`.** La ville d'un site est
  reconstituée par 6-8 LEFT JOIN via `localisations.quartier_id` **nullable** : une
  localisation sans quartier rend son site invisible dans toutes les recherches par
  ville (dont `offres/recherche` utilisé par le mobile). Cible : migration additive
  V35 `sites.ville_id BIGINT NULL REFERENCES villes` + backfill par la chaîne
  actuelle + obligatoire à la création côté API ; réécrire les `WHERE vd.ville_uuid`
  des `*Query` billetterie avec `COALESCE(s.ville_id, <chaîne actuelle>)`. Aucune
  route ne change.
- **T12b — Phase 2 : wizard « Nouvelle liaison » (frontend seul).** 10-11 écrans
  isolés à visiter dans l'ordre des FK pour publier une offre, zéro lien entre eux.
  Cible : un écran orchestrateur (p-stepper) qui enchaîne les POST existants
  (ville → localisation+site départ → site arrivée → départ+arrivée+trajet → offre).
  Les écrans actuels restent pour la gestion fine.
- **T12c — Phase 3 : factoriser le boilerplate CRUD.** ~60-70 % des ~5 700 lignes de
  composants admin sont dupliquées (villes vs communes : ~90-95 %) ; `handleError`
  copié dans ~14 services Angular ; côté Java, Region/Ville/Commune/Quartier et
  Site/Depart/Arrivee sont des familles copiées-collées (DTO `RegionStatusRequest`
  partagé). Cible : `CrudTableComponent<T>` + `BaseCrudService<T>` (migrer d'abord
  régions/villes/communes/quartiers), `AbstractReferentielService` backend, DTO de
  statut dédiés. Routes et payloads inchangés.
- **T12d — Reportés (coût/risque disproportionné pour l'instant)** : fusion
  `departs`/`arrivees` dans `sites` (le lien départ↔arrivée est encodé 2 fois :
  `arrivees.depart_id` + `trajets` ; `arrivees.libelle_depart` duplique
  `departs.libelle` ; explosion combinatoire N×M) — cible long terme :
  `trajets.site_depart_id/site_arrivee_id` additifs puis dépréciation ; suppression
  du niveau quartier (l'immobilier V32/V34 et l'auto-complétion mobile en dépendent) ;
  pagination serveur généralisée (à déclencher au premier signe de lenteur — mais un
  endpoint de recherche `?q=` pour les dropdowns quartiers/localisations serait déjà
  utile).

### T11. Divers backend
- Dialect Hibernate obsolète `PostgreSQL82Dialect` (discoveryserver).
- Double dépendance `commons-lang` 2.6 + `commons-lang3` (billetterie, immobilier).
- ~24 TODO/FIXME, concentrés dans `OrangeSmsServiceImpl` et `EmailServiceImpl`.
- Success handler d'auth : 300+ lignes de logs à émojis, très verbeux en prod.

---

## 📄 Documentation

### D1. README.md et CLAUDE.md périmés
- Ne mentionnent ni `immobilierservice` (17 des 30 migrations Flyway), ni le rebrand
  SIRA/SYNERGIA.
- CLAUDE.md cite SendGrid alors que le code utilise JavaMailSender/Gmail.
- Ports documentés (userservice 8095, notif 8096, billetterie 8097) ≠ ports prod du
  compose (8091/8093/8092).

---

## ✅ Réglées

- **2026-07-11** — Phase 0 du refactoring transport (T12) : handlers d'erreur de la
  famille B corrigés (`err.error?.message` sur une string → les messages backend
  s'affichent enfin dans sites-gares/points-depart/points-arrivee) ; toasts ajoutés
  quand le chargement d'un dropdown parent échoue (points-depart, points-arrivee,
  vehicules, partenaires, offres-transport, stats) ; 224 `tap(console.log)` supprimés
  des 19 services Angular + imports nettoyés ; logs emojis retirés de localisations ;
  garde-fou quartier (confirmation + hint dans le formulaire localisations) ;
  code mort `formatDate` retiré de vehicules.
- **2026-07-09** — Projet 2 « déclaration de besoin » bouclé et validé E2E sur TEST :
  déclaration mobile (Flutter) → diffusion Kafka aux agences vérifiées de la zone
  (commune → région → toutes) + emails → backoffice agence « Demandes clients »
  (Angular, filtrage par zone, coordonnées client). Migrations V32 (table
  immo_demande_besoin) et V34 (commune/quartier en saisie libre) déployées.
  Endpoints validés : POST /immo/demandes (201), mes-demandes (200), vue agence
  protégée (403 pour non-ADMIN_IMMO).
- **2026-07-08/09** — Rebranding SYNERGIA complet : web (topbar vert, logo, pages
  auth 2 colonnes, emails) et mobile (ColorManager + AppColors vert/or, tous les
  écrans, contraste sur l'or corrigé). Fix connexe : provideHttpClient dupliqué
  (dette T8) retiré ; RCCM servi via endpoint authentifié (dette T11b).
- **2026-07-06** — Parcours complet d'onboarding des agences immobilières livré et
  validé E2E en local : inscription avec type de compte (V31, rôles ADMIN_IMMO /
  ADMIN_CONFORMITE), complétion de profil + upload RCCM (MinIO), soumission,
  backoffice conformité (approbation/rejet + emails Kafka). Au passage : réparation
  du chemin `createAccountUser` (param `:service` fantôme, username auto-généré)
  et du port du profil `local` des migrations Flyway (5433 → 5435).

- **2026-07-05** — Double login web OAuth2 : le success handler ne reprenait pas le flux
  `/oauth2/authorize` quand la `SavedRequest` était perdue → mémorisation de l'URL
  d'autorisation web en session (`MobileOAuthSessionFilter.WEB_AUTH_SESSION_KEY`) +
  reprise en Priorité 3 dans le handler (`AuthorizationServerConfig`).
- **2026-07-05** — Échec de login web en 500 : `UserAuthenticationProvider` enveloppait
  les échecs dans `ApiException` (RuntimeException) → les `AuthenticationException`
  remontent désormais au failureHandler (`/login?error`), et les événements d'échec
  (compteur de tentatives) sont publiés.
- **2026-07-05** — Session web de 5 minutes : migration `V30__extend_web_client_token_ttl.sql`
  (access token du client web 300 s → 8 h, refresh 1 h → 24 h). Voir T1 pour la suite.

# Deployment Security Checklist

Procédure de redéploiement de la plateforme sur un serveur prod (OVH ou neuf).
Ne PAS cocher tant que la vérification n'est pas faite **runtime sur le serveur prod**.

Le déploiement local en dev (`mvn spring-boot:run`) ne valide AUCUN des jalons
ci-dessous — c'est le binding Docker du compose et la conf nginx/firewall qui
définissent l'exposition réelle.

---

## 1. Infrastructure réseau (avant tout `docker compose up`)

### 1.1 Firewall serveur

Seuls 22 (SSH) et 443 (HTTPS) doivent être ouverts depuis internet.

```bash
# Sur le serveur :
sudo ufw status verbose
# OU si firewalld :
sudo firewall-cmd --list-all

# Attendu :
#   22/tcp   ALLOW   (SSH)
#   443/tcp  ALLOW   (HTTPS via nginx)
#   80/tcp   ALLOW   (HTTP→HTTPS redirect uniquement)
#   tout le reste : DENY/DROP
```

- [ ] Firewall actif (status: enabled / running)
- [ ] Port 22 ouvert
- [ ] Port 443 ouvert
- [ ] Port 80 ouvert (HTTP → HTTPS redirect via nginx)
- [ ] **Aucun autre port ouvert** (notamment 5435, 7001, 8090-8098, 9000, 9100-9101)

### 1.2 Nginx — reverse proxy public

Conf attendue (cf. `nginx/guidipress-io.conf` versionné) :
- `guidipress-io.com` (443 SSL) → `proxy_pass http://127.0.0.1:4202` (frontend)
- `api.guidipress-io.com` (443 SSL) → `proxy_pass http://127.0.0.1:9000` (gateway)

```bash
sudo nginx -t                              # syntaxe OK
sudo systemctl status nginx                # actif
curl -I https://guidipress-io.com          # 200 ou 301
curl -I https://api.guidipress-io.com      # 401 attendu sans JWT, mais le service répond
```

- [ ] `nginx -t` syntax OK
- [ ] Service nginx running
- [ ] Certificats Let's Encrypt valides (non expirés — `certbot certificates`)
- [ ] Test HTTPS frontend → 200
- [ ] Test HTTPS api gateway → 401 ou réponse Spring (pas timeout)

---

## 2. Hardening compose — binding loopback (commits "compose hardening")

13 services en `127.0.0.1:port:port` + gateway aussi en `127.0.0.1:9000:9000`.

```bash
# Sur le serveur, après `docker compose up -d` :
for port in 5435 7001 9100 9101 2183 9093 8761 8090 8091 8092 8093 8098 4202 9000; do
  echo -n "Port $port depuis l'IP serveur (non-loopback) : "
  timeout 3 curl -s -o /dev/null -w "%{http_code}\n" "http://<IP_serveur>:$port" || echo "refused/timeout (OK)"
done
```

Attendu : **toutes les requêtes** → `Connection refused` / timeout (binding loopback bloque l'accès depuis l'IP externe).

- [ ] Postgres 5435 — refused
- [ ] pgAdmin 7001 — refused
- [ ] MinIO API 9100 — refused
- [ ] MinIO console 9101 — refused
- [ ] Zookeeper 2183 — refused
- [ ] Kafka 9093 — refused
- [ ] Eureka 8761 — refused
- [ ] Authz 8090 — refused
- [ ] Userservice 8091 — refused (était la fuite RGPD #24)
- [ ] Billetterie 8092 — refused
- [ ] Notif 8093 — refused
- [ ] Immo 8098 — refused
- [ ] Frontend 4202 — refused (nginx fait le proxy)
- [ ] Gateway 9000 — refused (nginx fait le proxy)

**Test de non-régression — l'accès légitime via nginx tient toujours :**
- [ ] `curl https://api.guidipress-io.com/immo/commodites` → 200 (route publique gateway)
- [ ] `curl https://guidipress-io.com/` → 200 (frontend Angular)

---

## 3. Variables d'environnement — `.env.prod`

Le `.env.prod` côté serveur est gitignored. À vérifier **manuellement** :

### 3.1 Creds Gmail SMTP (notificationserver)

```bash
grep -E '^GMAIL_USERNAME=|^GMAIL_APP_PASSWORD=' .env.prod
# Ces valeurs ne DOIVENT PAS être les placeholders de .env.example :
#   votre-email@gmail.com  ←  placeholder, indique non configuré
#   xxxxxxxxxxxxxxxx       ←  placeholder
```

- [ ] `GMAIL_USERNAME` ≠ placeholder (contient un @ et longueur > 21)
- [ ] `GMAIL_APP_PASSWORD` longueur = 16 chars (format App Password Google)
- [ ] **Test runtime** : déclencher 1 commande billetterie test → email reçu sur compte cible

Cf. task #27 (vérifier emails BILLETTERIE en prod — jamais validé runtime).

### 3.2 Creds Orange SMS (Phase 12c)

```bash
grep -E '^ORANGE_API_CREDENTIALS=|^ORANGE_SENDER_ADDRESS=' .env.prod
# Le credentials Basic ne doit pas être la chaîne de .env.example :
#   Basic VExqQ1BlQ1ZDdUxTRURLUjc2Z0RZcXo5QWw4a3h5M3A6...  ← placeholder
```

- [ ] `ORANGE_API_CREDENTIALS` ≠ placeholder
- [ ] `ORANGE_SENDER_ADDRESS` numéro réel whitelisté chez Orange
- [ ] **Test runtime** Phase 12c :
  - `immo.sms.send-enabled=true` (via env override prod)
  - POST /immo/proprietes/{uuid}/contact ciblant un user avec vrai numéro
  - Vérifier SMS reçu sur le téléphone
  - Remettre `immo.sms.send-enabled=false` après test

Cf. task #22 (jalon SMS réel Orange).

### 3.3 Postgres + MinIO + Kafka

- [ ] `POSTGRES_PASSWORD` ≠ valeur par défaut `manager2711` (rotation pour prod)
- [ ] `MINIO_ROOT_PASSWORD` ≠ valeur par défaut `minioadmin`
- [ ] Rotation faite si déjà déployée précédemment avec defaults

### 3.4 Migrations Flyway + cleanup seed dev

```bash
# Sur le serveur, après `docker compose up flyway-migrations` :
docker exec billetterie-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
# Attendu : V21 add_immo_propriete_vue (dédup vues backend) présente + success=true
```

- [ ] Toutes les migrations V1 → V21 appliquées avec `success=true`
- [ ] V21 (table `immo_propriete_vue` dédup vues) présente — schéma critique
  pour le comportement compteur vues vendeur. Sans cette migration, le
  service immo crashera au 1er GET propriete (recordVue ne trouve pas la
  table).

**Cleanup users de test dev** — ces emails ne DOIVENT PAS exister en prod :

```sql
-- Vérification (doit retourner 0)
SELECT user_id, email FROM users WHERE email IN (
  'visiteur-immo-test@test.com',
  'smoketest-immo@test.local',
  'no-profile@test.local',
  'invite-agent@test.local'
);

-- Si présent (ex: dump dev importé) :
DELETE FROM user_roles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.%');
DELETE FROM immo_favori WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.%');
DELETE FROM immo_brouillon WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.%');
DELETE FROM immo_propriete_vue WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.%');
DELETE FROM immo_propriete WHERE profil_id IN (SELECT profil_id FROM immo_profil WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.%'));
DELETE FROM immo_profil WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.%');
DELETE FROM credentials WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.%');
DELETE FROM users WHERE email LIKE '%@test.%';
```

- [ ] Aucun user `*@test.*` en prod
- [ ] Aucun mot de passe BCrypt `$2a$12$ztLkjYfSzxorH8d0IYUI1.URPPLDaFTpQhFxqzaIuzHzYZgB8TF1W`
  (= hash de `VisiteurTest2026!` du seed dev, à grep dans `credentials.password`)

---

## 4. Vérifications post-déploiement Spring

### 4.1 Login user multi-rôle (fix STRING_AGG bug auth)

Ce test garantit que le fix multi-rôles (commit `146c991`) tient toujours après
redéploiement.

```bash
# Promouvoir un user existant à 2 rôles :
docker exec -i billetterie-postgres psql -U inno2711 -d innodb -c \
  "INSERT INTO user_roles (user_id, role_id) SELECT <user_id>, role_id
   FROM roles WHERE name='ADMIN' ON CONFLICT DO NOTHING;"

# Login via API mobile :
curl -X POST https://api.guidipress-io.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}'
# Doit retourner 200 + access_token contenant "ADMIN,USER" dans authorities
```

- [ ] Login mono-rôle → 200
- [ ] Login multi-rôle (2 rôles) → 200, JWT contient les 2 rôles
- [ ] Login multi-rôle (3 rôles) → 200, JWT contient les 3 rôles
- [ ] Cleanup : retirer rôles ajoutés pour test

### 4.2 Endpoint admin (fuite RGPD #24)

```bash
# Sans JWT, via gateway public :
curl https://api.guidipress-io.com/user/getUser/1
# Attendu : 401 (fix #24 — était 200 fuite RGPD avant Phase 13c)

# Avec JWT user authentifié :
curl https://api.guidipress-io.com/user/getUser/1 \
  -H "Authorization: Bearer <jwt>"
# Attendu : 200
```

- [ ] GET `/user/getUser/<id>` sans JWT → 401
- [ ] GET `/user/getUser/<id>` avec JWT → 200

### 4.3 Photos immo via gateway

```bash
# Upload + GET via reverse-proxy :
PHOTO=$(curl -X POST .../immo/photos/test-upload -H "Authorization: Bearer ..." \
  -F "file=@photo.jpg")
UUID=$(echo $PHOTO | jq -r '.data.upload.objectKey')  # à adapter
curl -I https://api.guidipress-io.com/immo/photos/<photoUuid>
# Attendu : 200 + Content-Type image/jpeg + ETag + Cache-Control max-age=86400
```

- [ ] Photo originale via gateway → 200, image rendue
- [ ] Photo `?thumb=true` → 200, JPEG plus petit
- [ ] Photo UUID inexistant → 404 propre (pas de stack)

### 4.4 Workflow immo bout-en-bout

Si users de test seedés en prod :
- [ ] POST /contact → 201 + email reçu chez le vendeur (Phase 11)
- [ ] POST /visites → 201 + email vendeur
- [ ] PATCH /confirmer → 200 + email + SMS visiteur (Phase 12)
- [ ] Job @Scheduled expiration tourne à 2h Africa/Conakry (vérifier le lendemain)

### 4.5 Features récentes (post-MVP-immo)

**Favoris** (commit `7f888c4`) :
```bash
# Login user authentifié → JWT en variable
JWT=$(curl -s -X POST https://api.guidipress-io.com/authorization/api/auth/token \
  -H "Content-Type: application/json" -d '{"email":"...","password":"..."}' | jq -r .access_token)

# Ajouter favori (idempotent)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://api.guidipress-io.com/immo/favoris/<un_uuid_propriete> \
  -H "Authorization: Bearer $JWT"
# Attendu : 201 (1ère fois) ou 200 (déjà favori)

# Liste mes favoris
curl -s https://api.guidipress-io.com/immo/favoris/mes-favoris \
  -H "Authorization: Bearer $JWT" | jq '.data.total'
# Attendu : >= 1
```

- [ ] POST /favoris/{uuid} → 201/200 idempotent
- [ ] GET /favoris/mes-favoris → liste cohérente
- [ ] DELETE /favoris/{uuid} → 200

**Dédup vues** (commit `3c0f60f`, migration V21) :
```bash
# 1ère consultation
curl -s -o /dev/null https://api.guidipress-io.com/immo/proprietes/<uuid> \
  -H "Authorization: Bearer $JWT"

# 2e consultation immédiate (même JWT, même jour)
curl -s -o /dev/null https://api.guidipress-io.com/immo/proprietes/<uuid> \
  -H "Authorization: Bearer $JWT"

# Vérifier en BD : nombre_vues +1 SEULEMENT (pas +2)
docker exec billetterie-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SELECT nombre_vues FROM immo_propriete WHERE propriete_uuid='<uuid>';"
# Attendu : valeur incrémentée d'1 (dédup ON CONFLICT silencieux)

# Vérifier table dédup
docker exec billetterie-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SELECT COUNT(*) FROM immo_propriete_vue WHERE user_id=<user_id> AND vue_date=CURRENT_DATE;"
# Attendu : 1 (pas 2)
```

- [ ] 2 GET successifs même JWT/jour → nombre_vues incrémenté de 1 seulement
- [ ] Table immo_propriete_vue contient 1 row pour ce couple (user, propriete, jour)
- [ ] GET sans JWT (anonyme) → nombre_vues INCHANGÉ (skip silencieux)

**Géolocalisation recherche** (commit `666ff14`) :
```bash
# Recherche avec filtre rayon à Conakry centre
curl -s "https://api.guidipress-io.com/immo/proprietes/recherche?lat=9.5092&lng=-13.7122&rayonKm=10" \
  | jq '.data.proprietes | length, .[0].distanceM'
# Attendu : > 0 résultats, chaque résultat a distanceM non-null, tri DISTANCE_ASC
```

- [ ] Recherche `?lat=&lng=&rayonKm=` → résultats avec `distanceM` non-null
- [ ] Tri auto par distance croissante (le 1er résultat doit avoir la distance la plus faible)

**Partage mobile** (commit `75adf89`) — pas testable serveur (mobile only), couvert par tests App Store submission.

**Géoloc-3 carte tiles** (commit `0beee8b`) :
```bash
# Vérifier que le serveur peut atteindre les tiles OSM (firewall sortant)
curl -s -o /dev/null -w "OSM tile : %{http_code}\n" -m 10 \
  https://tile.openstreetmap.org/15/16384/16384.png
# Attendu : 200 ou 302. Si refused/timeout → le mobile ne peut pas non plus
# (passe par même DNS public).
```

- [ ] Le serveur peut joindre `tile.openstreetmap.org` (relevance : monitoring,
  pas de blocage applicatif puisque l'app mobile tape direct OSM HTTPS sans
  passer par le gateway)

---

## 5. Données — vérifs business

- [ ] Métrique `% users avec phone renseigné` (task #25)
  ```sql
  SELECT COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '') * 100.0 / COUNT(*)
  FROM users;
  ```
  Si < 50% → le canal SMS sera mort-né pour la majorité. Décision : forcer phone à
  l'inscription OU accepter coverage partiel.

- [ ] Aucune ligne `immo_propriete` en statut `EN_ATTENTE_VALIDATION` orpheline (sans
  profil VERIFIE associé) — sinon admin doit traiter
- [ ] Sauvegarde BD configurée (pg_dump cron, ou OVH snapshot quotidien)

---

## 6. Compose hardening — validation runtime

Le commit `4d761b8` impose des limites mémoire serrées + tuning Postgres + log rotation. À vérifier post-`docker compose up -d` :

```bash
# Limites appliquées
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}"
```

- [ ] postgres : limit 1024 MiB respectée, usage typique 200-400 MiB
- [ ] kafka : limit 800 MiB, usage 300-500 MiB
- [ ] auth/user/billet : limit 512 MiB chacun, usage 250-400 MiB heap (JVM)
- [ ] immo : limit 768 MiB, usage 300-500 MiB (peak pendant upload photo)
- [ ] notif : limit 384 MiB, usage 200-300 MiB
- [ ] **Aucun service en orange/rouge** (>80% sustained) → si oui, ajuster
  vers le haut le concerné

**JVM heap allouée vs containers** :
```bash
docker exec billetterie-immobilierservice jcmd 1 VM.flags | grep -E "MaxHeapSize|UseG1GC"
# Attendu : MaxHeapSize ≈ 75% × 768 MiB = ~576 MiB (603979776 bytes)
#          UseG1GC activé
```

- [ ] `MaxRAMPercentage=75.0` honorée par la JVM
- [ ] `UseG1GC` activé

**Postgres tuning effectif** :
```bash
docker exec billetterie-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "SHOW shared_buffers; SHOW effective_cache_size; SHOW work_mem;"
```
- [ ] shared_buffers = 256MB (pas 128MB default)
- [ ] effective_cache_size = 768MB
- [ ] work_mem = 8MB

**Log rotation Docker** :
```bash
docker inspect billetterie-immobilierservice | jq '.[0].HostConfig.LogConfig'
# Attendu : {"Type":"json-file","Config":{"max-file":"5","max-size":"10m"}}
```
- [ ] LogConfig json-file max-size 10m max-file 5 sur tous services hors
  flyway/minio-init one-shot

---

## 7. Sauvegarde BD — procédure exécutable

Pré-prod : configurer **avant le 1er user inscrit**. Une fois la BD a des données utilisateur, restaurer un dump perdu = catastrophique.

### 7.1 Snapshot OVH automatique
- [ ] Snapshot OVH activé (panneau OVH > VPS > Sauvegarde automatique)
- [ ] Fréquence quotidienne, rétention 7 jours minimum

### 7.2 pg_dump local (backup logique, restorable n'importe où)
```bash
# Cron quotidien sur le serveur (3h du matin Africa/Conakry = 02:00 UTC)
0 2 * * * docker exec billetterie-postgres pg_dump -U $POSTGRES_USER -F c -b $POSTGRES_DB \
  > /backups/postgres/innodb_$(date +\%Y\%m\%d).dump && \
  find /backups/postgres/ -name "innodb_*.dump" -mtime +30 -delete
```

- [ ] Script cron installé `/etc/cron.d/postgres-backup`
- [ ] Test manuel : lancer le pg_dump → fichier `.dump` > 1MB créé
- [ ] Rotation 30 jours opérationnelle (find -mtime +30 -delete)
- [ ] Dossier `/backups/postgres/` : permissions 700 propriétaire root

### 7.3 Restore drill (à faire 1× avant lancement, jamais en panique)

```bash
# Sur un container postgres DIFFÉRENT (ou un volume temp pour pas écraser prod) :
docker run --rm -v /backups/postgres/innodb_YYYYMMDD.dump:/dump postgres:16 \
  pg_restore -h $TEMP_HOST -U $POSTGRES_USER -d innodb_test /dump

# Vérifier qu'on retrouve des tables et lignes attendues
docker exec <temp_container> psql -U $POSTGRES_USER -d innodb_test -c \
  "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM immo_propriete;"
```

- [ ] Restore drill réussi 1× avant lancement (pas restore "panic" le jour de la perte)

---

## 8. Monitoring dettes prod

Dettes connues nécessitant surveillance post-lancement :

### 8.1 MinIO down / S3 SDK hang (dette backend-minio-no-short-timeout-debt)

Le S3 SDK Java côté immo hang ~5min si MinIO down (apiCallTimeout pas configuré). Sous trafic, le pool de threads HTTP immo saturer rapidement.

```bash
# Détection : grep retry S3 SDK dans les logs immo
docker logs billetterie-immobilierservice --since 24h 2>&1 | \
  grep -iE "retry|s3.*timeout|s3.*backoff" | head -20
```

- [ ] Pas de retry massif S3 dans les 24 dernières heures (signal MinIO instable)
- [ ] Si présent → vérifier MinIO health avant urgence applicative

### 8.2 Photos thumbnail manquantes (orphelins BD)

Une photo en BD avec `object_key_thumbnail` non-null mais absente de MinIO → cas "orphelin" (cf. `serve photo` Phase 13b qui logue le cas).

```bash
docker logs billetterie-immobilierservice --since 7d 2>&1 | \
  grep "ABSENTE de MinIO" | head -10
```

- [ ] 0 orphelin sur 7 jours → cohérence BD/MinIO OK
- [ ] Si orphelins → admin doit DELETE BD ou re-uploader

### 8.3 Notifications mortes (phone manquant)

Si `% users avec phone renseigné < 30%`, le canal SMS Orange est mort pour la majorité. Métrique à monitorer mensuellement.

```sql
SELECT
  COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone <> '') * 100.0 / COUNT(*) AS pct_phone,
  COUNT(*) AS total
FROM users;
```

- [ ] pct_phone ≥ 50% → canal SMS viable
- [ ] Si < 50% → décision business : forcer phone à l'inscription OU
  accepter coverage partiel

---

## 9. Mobile build prod (avant submission App Store / Play Store)

Couvert sur le poste Flutter (Mac dev), pas sur le serveur. Mais critique
avant `flutter build apk --release` / `flutter build ipa --release`.

### 9.1 AppConfig dev → prod
```bash
# Sur mobile_app/ :
grep -E "isProduction\s*=" lib/config/app_config.dart
# Attendu : "static const bool isProduction = true;"

grep -E "10\.\d+\.\d+\.\d+|172\.\d+|192\.168" lib/config/app_config.dart
# Attendu : aucune occurrence (toutes les IPs LAN dev retirées)
```

- [ ] `AppConfig.isProduction = true`
- [ ] Aucune IP LAN dev hardcodée dans le code (régression possible par patch
  local pour tests émulateur — cf. mémoire [[mobile-apibaseurl-dart-define]])

### 9.2 Permissions OS validées runtime (jamais testées en dev Android)

Cf. mémoire [[mobile-ios-perms-test-pre-appstore]] :

**iOS Simulator / device** :
- [ ] `NSPhotoLibraryUsageDescription` : tap "Galerie" dans le wizard → dialog permission affiché en FR avec wording explicite
- [ ] `NSCameraUsageDescription` : tap "Caméra" → dialog permission affiché en FR
- [ ] `NSLocationWhenInUseUsageDescription` : tap "Utiliser ma position" → dialog permission affiché en FR

**Android** : déjà validé en dev mais re-tester sur device physique différent du Mac de dev.

### 9.3 Texte partage stores
- [ ] `ShareService` partage encore le texte legacy "Télécharge l'app pour les
  détails" — à enrichir avec URLs stores RÉELLES une fois publié (cf. mémoire
  [[mobile-share-stores-urls-debt]]).

### 9.4 minSdk Android
```bash
grep "minSdk" android/app/build.gradle.kts
# Attendu : minSdk = 23 (cf. mémoire mobile-android-minsdk-23)
```
- [ ] minSdk = 23 préservé (pas écrasé par `flutter create .` ou regen Android)

### 9.5 Android License acceptée
```bash
flutter doctor --android-licenses
# Toutes acceptées ?
```

- [ ] Toutes les licences Android acceptées avant `flutter build`

---

## 10. Backlog dettes non bloquantes mais à traiter

- [ ] Bug 401→503 quand service down (task #28) — fallback gateway à configurer
- [ ] M2M token client_credentials (task #23 si elle revient) — UserLookupRepository
  a été supprimé, mais Feign reste sans interceptor JWT. Acceptable car `/user/getUser/**`
  reste permitAll côté userservice (cf. décision Option D).
- [ ] Logback RollingFileAppender par service (cf. mémoire
  [[logback-rolling-fileappender-debt]]) — déclencheur : 1er incident prod
  nécessitant logs >7 jours
- [ ] flutter_map_cache (cf. mémoire [[mobile-flutter-map-tiles-cache-debt]])
  — déclencheur : plaintes UX lenteur cartes Conakry 3G
- [ ] Mes annonces (cf. mémoire [[wizard-publication-brouillon-orpheline-debt]])
  — déclencheur : 1er user qui demande "où sont mes annonces en attente ?"

---

## 11. Quick rollback procedure

Si l'accès public casse après un redéploiement :

```bash
# Sur le serveur :
git log --oneline -10                # voir les commits récents
git revert <SHA_du_commit_cassé>     # revert atomique
docker compose down && docker compose up -d
```

Les commits hardening sont **séparés** (backends VS gateway VS sécurité auth) pour
permettre un revert ciblé sans tout perdre.

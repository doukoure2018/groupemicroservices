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

## 6. Backlog dettes non bloquantes mais à traiter

- [ ] Bug 401→503 quand service down (task #28) — fallback gateway à configurer
- [ ] M2M token client_credentials (task #23 si elle revient) — UserLookupRepository
  a été supprimé, mais Feign reste sans interceptor JWT. Acceptable car `/user/getUser/**`
  reste permitAll côté userservice (cf. décision Option D).

---

## 7. Quick rollback procedure

Si l'accès public casse après un redéploiement :

```bash
# Sur le serveur :
git log --oneline -10                # voir les commits récents
git revert <SHA_du_commit_cassé>     # revert atomique
docker compose down && docker compose up -d
```

Les commits hardening sont **séparés** (backends VS gateway VS sécurité auth) pour
permettre un revert ciblé sans tout perdre.

# Déploiement SIRA Guinée — VPS OVH (`51.255.203.214`)

> Checklist exécutable étape par étape pour passer en production.
> Pré-requis acquis : VPS provisionné, DNS propagé (`sira-guinee.com`, `www`, `api`), repo cloné dans `~/sira-guinee/prod`, `.env.prod` préparé localement.

**Légende** :
- 🖥️ = commande sur le **VPS OVH** (via SSH)
- 💻 = commande sur **ton Mac**
- ⚠️ = step critique, vérifier avant de continuer

---

## Phase 0 — Pré-flight (sur Mac)

### 0.1 Sauvegarde des mots de passe générés

💻 Copier les 4 mots de passe générés dans `.env.prod` vers ton password manager (1Password / Bitwarden / KeePass). Sans backup et si `.env.prod` est perdu, les volumes Postgres/MinIO/Eureka deviennent orphelins.

### 0.2 Remplacer les placeholders

💻 Éditer `.env.prod` et remplacer les 7 `__PLACEHOLDER_*__` par les vrais creds (Gmail, Google, Orange). Vérifier qu'il n'en reste aucun :

```bash
grep -c "__PLACEHOLDER_" .env.prod
# Doit retourner : 0
```

### 0.3 Builder + pousser les images Docker à jour

💻 Les images Docker Hub `doukoure93/billetterie-*:latest` doivent inclure les derniers commits (modération + rebrand SIRA). Builder + push :

```bash
cd ~/Projects/groupemicroservices/microservers
mvn clean package -DskipTests
mvn jib:build  # push vers Docker Hub doukoure93/*
```

⚠️ Si `jib:build` échoue avec auth Docker Hub : `docker login` d'abord.

### 0.4 Vérifier que la branche `main` est pushée

💻 :

```bash
git log --oneline -5
git status  # doit être clean
git push origin main  # au cas où
```

---

## Phase 1 — Préparation VPS OVH

### 1.1 SSH connexion

💻 :

```bash
ssh root@51.255.203.214
```

### 1.2 Mise à jour système + installation des paquets

🖥️ :

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx ufw
systemctl enable --now docker nginx
```

### 1.3 Firewall UFW (ports 22 / 80 / 443 uniquement)

🖥️ :

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose  # vérifier : 22 + 80 + 443 ALLOW
```

⚠️ **Ne PAS exposer le 5433 (Postgres), 9100 (MinIO), 9000 (gateway), 8090 (auth)** — déjà bindés sur 127.0.0.1 par docker-compose, mais UFW est une 2e ligne de défense.

### 1.4 Préparation du dossier deploy + DNS check

🖥️ :

```bash
mkdir -p /var/www/certbot
chown www-data:www-data /var/www/certbot

# Vérifier que le DNS pointe bien vers ce serveur
dig +short sira-guinee.com         # → 51.255.203.214
dig +short www.sira-guinee.com     # → 51.255.203.214
dig +short api.sira-guinee.com     # → 51.255.203.214
```

⚠️ Si les `dig` retournent autre chose, **ne pas continuer** : certbot va échouer.

---

## Phase 2 — Upload des fichiers de configuration

### 2.1 Upload `.env.prod`

💻 depuis Mac :

```bash
scp ~/Projects/groupemicroservices/.env.prod root@51.255.203.214:~/sira-guinee/prod/.env
```

🖥️ sur VPS :

```bash
cd ~/sira-guinee/prod
chmod 600 .env  # secrets — lecture root only
ls -la .env     # vérifier : -rw------- 1 root root ...
```

### 2.2 Pull du repo à jour

🖥️ :

```bash
cd ~/sira-guinee/prod
git fetch origin
git checkout main
git pull origin main
git log --oneline -3  # doit afficher les derniers commits (rebrand SIRA + modération)
```

### 2.3 Upload des configs nginx

💻 depuis Mac :

```bash
scp ~/Projects/groupemicroservices/nginx/sira-guinee.bootstrap.conf root@51.255.203.214:/etc/nginx/sites-available/sira-guinee.bootstrap
scp ~/Projects/groupemicroservices/nginx/sira-guinee.conf           root@51.255.203.214:/etc/nginx/sites-available/sira-guinee
```

---

## Phase 3 — Démarrage backend (Docker)

### 3.1 Pull des images à jour

🖥️ :

```bash
cd ~/sira-guinee/prod
docker compose pull  # récupère les dernières images doukoure93/billetterie-*
```

### 3.2 Migrations BD (Flyway, profile dédié)

🖥️ :

```bash
docker compose --profile migration up flyway-migrations
# Attendre : "Successfully applied X migrations to schema"
docker compose --profile migration down  # cleanup container migration une-fois
```

⚠️ Si erreur de connexion Postgres : vérifier que `POSTGRES_PASSWORD` dans `.env` matche celui qu'on vient de définir (les volumes persistent les mots de passe entre `docker compose up/down`).

### 3.3 Démarrer tous les services

🖥️ :

```bash
docker compose up -d
docker compose ps  # tous doivent passer en "healthy" sous 60-90s
```

⚠️ Si un service n'arrive pas healthy après 2 min :

```bash
docker compose logs --tail=50 <nom-service>
# Inspecter le 1er ERROR / WARN
```

### 3.4 Smoke test depuis le VPS (HTTP interne, pre-nginx)

🖥️ :

```bash
curl -s http://127.0.0.1:9000/actuator/health         # gateway
curl -s http://127.0.0.1:8090/.well-known/openid-configuration  # auth issuer
curl -s http://127.0.0.1:9100/minio/health/live       # minio
# Tous doivent répondre 200
```

⚠️ Si un endpoint timeout : `docker compose logs <service>` puis adapter.

---

## Phase 4 — nginx + Let's Encrypt

### 4.1 Activer la config bootstrap (HTTP-only)

🖥️ :

```bash
ln -sf /etc/nginx/sites-available/sira-guinee.bootstrap /etc/nginx/sites-enabled/sira-guinee

# Désactiver le default site si présent
rm -f /etc/nginx/sites-enabled/default

nginx -t                # syntax check
systemctl reload nginx
```

### 4.2 Obtenir les certificats Let's Encrypt

🖥️ :

```bash
certbot certonly --webroot \
  -w /var/www/certbot \
  -d sira-guinee.com \
  -d www.sira-guinee.com \
  -d api.sira-guinee.com \
  --email contact@sira-guinee.com \
  --agree-tos \
  --no-eff-email
```

⚠️ Doit afficher `Successfully received certificate. Certificate is saved at: /etc/letsencrypt/live/sira-guinee.com/fullchain.pem`. Si erreur DNS / challenge : retry après vérification `dig` du 1.4.

### 4.3 Basculer sur la config HTTPS finale

🖥️ :

```bash
ln -sf /etc/nginx/sites-available/sira-guinee /etc/nginx/sites-enabled/sira-guinee
nginx -t                # syntax check OK ?
systemctl reload nginx
```

### 4.4 Renouvellement automatique

🖥️ vérifier que `certbot.timer` est actif :

```bash
systemctl list-timers | grep certbot
# Doit lister "certbot.timer  ...  active"
```

Test dry-run :

```bash
certbot renew --dry-run  # ne doit pas afficher d'erreur
```

---

## Phase 5 — Smoke tests prod (depuis Mac ou téléphone)

### 5.1 HTTPS public

💻 :

```bash
curl -sI https://sira-guinee.com      # 200 ou 301
curl -sI https://api.sira-guinee.com  # 200 ou 404 sur /
curl -s  https://api.sira-guinee.com/actuator/health  # {"status":"UP"}
```

### 5.2 Frontend dans le navigateur

💻 ouvrir `https://sira-guinee.com` :
- ✅ HTTPS, cadenas vert
- ✅ Logo "SIRA Guinée" visible (orange sur "Guinée")
- ✅ Login page accessible

### 5.3 Login bout-en-bout

💻 dans le navigateur :
1. Aller sur `https://sira-guinee.com`
2. Login avec un compte SUPER_ADMIN (ex: `eureka-manager@guidipress-io.com` si tu l'as migré, sinon créer un nouveau via DB)
3. Naviguer vers **Modération immobilière** (sidebar SIRA Guinée)
4. La liste doit s'afficher (vide si aucune annonce EN_ATTENTE)

### 5.4 Création compte test mobile

💻 :
```bash
curl -X POST https://api.sira-guinee.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test-prod@example.com","password":"TestProd2026!","firstName":"Test","lastName":"Prod"}'
```

Vérifier qu'un email arrive dans la boîte test-prod (Gmail SMTP fonctionne).

---

## Phase 6 — Mobile (après backend validé)

📋 **Reporté** jusqu'à validation Phase 5.

Une fois les smoke tests verts :
1. Update `mobile_app/lib/config/app_config.dart` → `apiBaseUrl = 'https://api.sira-guinee.com'`
2. `flutter build apk --release`
3. Installer sur un vrai phone (idéalement avec carte SIM Guinée pour tester latency réelle)
4. Tester : login, recherche annonces, fiche détail, publication d'une annonce avec photos

---

## Rollback rapide

Si quelque chose part en sucette **et que la prod est cassée** :

🖥️ :

```bash
cd ~/sira-guinee/prod
docker compose down       # stop tous les services
git checkout <ancien-commit-stable>
docker compose pull
docker compose up -d
```

Pour nginx :

```bash
# Si config nginx cassée
rm /etc/nginx/sites-enabled/sira-guinee
ln -s /etc/nginx/sites-available/sira-guinee.bootstrap /etc/nginx/sites-enabled/sira-guinee
nginx -t && systemctl reload nginx
# Tu tombes sur "bootstrap nginx, SSL setup in progress" → temps de réparer
```

---

## Maintenance courante

| Tâche | Commande |
|---|---|
| Voir logs d'un service | `docker compose logs --tail=100 -f gateway` |
| Restart un service | `docker compose restart immobilierservice` |
| Update vers nouvelle version | `git pull && docker compose pull && docker compose up -d` |
| Backup BD | `docker compose exec postgresdb pg_dump -U inno2711 innodb > backup-$(date +%F).sql` |
| Renouvellement SSL manuel | `certbot renew` |
| Nettoyer logs Docker | `docker system prune -af --volumes` (⚠️ supprime les vol non utilisés !) |

---

## Références

- `.env.prod` (local Mac uniquement, jamais commit)
- `nginx/sira-guinee.bootstrap.conf` (bootstrap HTTP-only)
- `nginx/sira-guinee.conf` (final HTTPS)
- `docker-compose.yml` (orchestration, déjà à jour)
- `docs/deployment-security-checklist.md` (vue d'ensemble sécu plus large)

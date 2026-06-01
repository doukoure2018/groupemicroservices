# SIRA Guinée — Mapping GitHub Actions Secrets

> Configuration à effectuer **AVANT le 1er run du workflow `backend-cd.yml`**.

L'architecture utilise les **GitHub Environments** pour isoler les secrets test/prod
(`Settings → Environments → "test" / "prod"`). Les secrets communs (Docker Hub,
OVH, Gmail/Orange si partagés) restent au niveau repo (`Settings → Secrets and
variables → Actions → Repository secrets`).

## Vue d'ensemble

```
github.com/doukoure2018/groupemicroservices/settings/
├── secrets/actions/
│   ├── Repository secrets (12)    ← partagés test & prod
│   └── Environment secrets
│       ├── test (10)              ← valeurs test isolées
│       └── prod (10)              ← valeurs prod isolées
└── environments/
    ├── test                       ← deploy auto sur push main
    └── prod                       ← deploy manuel via workflow_dispatch
                                     (configurer "Required reviewers" pour gating)
```

---

## 1) Repository Secrets (communs)

À créer dans `Settings → Secrets and variables → Actions → Repository secrets`.

| Secret | Valeur | Source |
|---|---|---|
| `DOCKERHUB_USERNAME` | `doukoure93` | Réutiliser (déjà existant) |
| `DOCKERHUB_ACCESS_TOKEN` | (token Docker Hub) | hub.docker.com → Account Settings → Security → New Access Token. Régénérer si perdu. |
| `OVH_HOST` | `51.255.203.214` | IP fixe du VPS OVH |
| `OVH_USER` | `ubuntu` | User par défaut OVH Cloud (image Ubuntu). Sudo configuré sans mot de passe via NOPASSWD pour `docker`, `nginx`, `systemctl reload nginx`. |
| `PROD_SSH_KEY` | (clé privée SSH) | `cat ~/.ssh/id_ed25519` (ou clé dédiée CI/CD). Sa clé publique doit être dans `/home/ubuntu/.ssh/authorized_keys` sur OVH (user `ubuntu`). |
| `GMAIL_USERNAME` | (cf `.env.prod` local Mac, ligne `GMAIL_USERNAME=`) | Compte Gmail MVP partagé test & prod. Sera remplacé par `contact@sira-guinee.com` quand boite SIRA créée. |
| `GMAIL_APP_PASSWORD` | (cf `.env.prod` local Mac, archivé password manager) | App password Gmail (myaccount.google.com/apppasswords). Partagé test & prod. |
| `ORANGE_API_CREDENTIALS` | (cf `.env.prod` local Mac, format `Basic <base64>`) | developer.orange.com. Partagé test & prod tant que pas de compte Orange dédié SIRA. |
| `ORANGE_SENDER_ADDRESS` | (cf `.env.prod` local, format `tel:+224XXXXXXXXX`) | Numéro Orange Guinée E.164. Partagé. |
| `GOOGLE_CLIENT_ID` | (placeholder ou désactivé) | **MVP SKIP** : décision user 2026-06-01, login Google reporté post-MVP. Mettre une valeur bidon (ex: `__GOOGLE_DISABLED__`) ou créer un secret vide. |
| `GOOGLE_CLIENT_SECRET` | (placeholder) | Idem. |
| `SLACK_WEBHOOK_URL` | (URL `hooks.slack.com/services/...`) | Notifications build/deploy (start, images pushed, success, failure) sur les 2 workflows backend-cd + frontend-cd. Régénérer dans l'app Slack si compromis. |
| ~~`POSTGRES_PASSWORD`~~ (legacy) | (à supprimer) | Maintenant dans chaque Environment (POSTGRES_PASSWORD test ≠ prod). Supprimer cet ancien secret repo-level. |

> ⚠️ Si tu n'as pas accès aux valeurs anciennes (DOCKERHUB_ACCESS_TOKEN, PROD_SSH_KEY) : régénérer côté source (Docker Hub UI, `ssh-keygen` + push public key sur OVH).

---

## 2) Environment Secrets — `test`

À créer dans `Settings → Environments → New environment → "test"`, puis ajouter les secrets ci-dessous **dans l'environment** (pas au niveau repo).

| Secret | Valeur recommandée | Notes |
|---|---|---|
| `POSTGRES_PASSWORD` | (générer 32 chars random dédié test) | Ne JAMAIS partager avec prod. `openssl rand -base64 24 \| tr -d '/+=' \| cut -c1-32` |
| `EUREKA_PASSWORD` | (générer dédié test) | Idem |
| `MINIO_ROOT_USER` | `siraadmin-test` | Username MinIO test |
| `MINIO_ROOT_PASSWORD` | (générer dédié test) | Idem |
| `PGADMIN_PASSWORD` | (générer dédié test) | Idem |
| `SENDER_NAME` | `YIGUI` (ou `SIRA-TEST` si validé Orange) | Sender alphanumérique SMS test |

> Si tu veux des **creds Gmail / Orange / Google différents** pour test (compte Gmail séparé pour valider les emails de test), surcharge ici en environment-level. Sinon ils héritent du repository-level.

---

## 3) Environment Secrets — `prod`

À créer dans `Settings → Environments → New environment → "prod"` (configurer "Required reviewers" pour gating manuel).

| Secret | Valeur | Source |
|---|---|---|
| `POSTGRES_PASSWORD` | (cf `.env.prod` local Mac, archivé password manager) | Roté Session A 2026-06-01 |
| `EUREKA_PASSWORD` | (cf `.env.prod` local) | Roté Session A |
| `MINIO_ROOT_USER` | `siraadmin` | Custom MinIO admin (non-secret) |
| `MINIO_ROOT_PASSWORD` | (cf `.env.prod` local) | Roté Session A |
| `PGADMIN_PASSWORD` | (cf `.env.prod` local) | Roté Session A |
| `SENDER_NAME` | `YIGUI` (ou `SIRA` quand validé Orange) | Sender alphanumérique SMS prod |

---

## 4) Configuration des GitHub Environments

### Environment `test`
- **Required reviewers** : OFF (deploy auto sur push main)
- **Deployment branches** : "All branches" (ou restreindre à `main` + `develop`)
- **Wait timer** : 0 minutes

### Environment `prod`
- **Required reviewers** : **ON** — toi-même + 1 autre si team (gating manuel obligatoire)
- **Deployment branches** : "Selected branches" → `main` only
- **Wait timer** : 0 ou 5 min (laisse le temps d'annuler après dispatch)

---

## 5) Récap : ce qui change vs l'ancienne config

| Secret | Avant (Guidipress) | Après (SIRA Guinée) | Action |
|---|---|---|---|
| `POSTGRES_PASSWORD` | `manager2711` (faible) repo-level | Roté 32 chars, ÉCLATÉ test/prod | Régénérer + déplacer en environments |
| `EUREKA_PASSWORD` | Hardcoded `manager2711` dans yml | Secret environment, fort | Ajouter par env |
| `MINIO_ROOT_USER/PASSWORD` | Absent (default `minioadmin`) | Secret environment | Ajouter par env |
| `PGADMIN_PASSWORD` | Repo-level basique | Secret environment | Migrer + roter |
| `SLACK_WEBHOOK_URL` | Référencé partout | Conservé (notifs build/deploy SIRA Guinée) | Régénérer si compromis |
| `GOOGLE_CLIENT_ID/SECRET` | Domain billetterie | MVP désactivé | Placeholder ou supprimer (`__GOOGLE_DISABLED__`) |
| `GMAIL_*`, `ORANGE_*` | Repo-level | Repo-level (partagés test/prod MVP) | Mettre à jour les valeurs avec les nouvelles |
| `SENDER_NAME` | Inexistant | Nouveau, par environment | Créer test=YIGUI, prod=YIGUI |

---

## 6) Checklist d'activation (avant 1er deploy)

```
[ ] Repository secrets (12 entrées)
    [ ] DOCKERHUB_USERNAME, DOCKERHUB_ACCESS_TOKEN
    [ ] OVH_HOST, OVH_USER, PROD_SSH_KEY
    [ ] SLACK_WEBHOOK_URL
    [ ] GMAIL_USERNAME, GMAIL_APP_PASSWORD
    [ ] ORANGE_API_CREDENTIALS, ORANGE_SENDER_ADDRESS
    [ ] GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (placeholders MVP)
[ ] Environment "test" créé + 6 secrets ajoutés
    [ ] POSTGRES_PASSWORD, EUREKA_PASSWORD
    [ ] MINIO_ROOT_USER, MINIO_ROOT_PASSWORD
    [ ] PGADMIN_PASSWORD, SENDER_NAME
[ ] Environment "prod" créé + Required reviewers ON + 6 secrets ajoutés (mêmes noms, valeurs prod)
[ ] Anciens secrets supprimés :
    [ ] POSTGRES_PASSWORD (legacy repo-level)
```

Une fois la checklist verte → `git push origin main` déclenchera automatiquement
build + deploy TEST. Le 1er deploy peut prendre ~10 min (pull images, migrations,
healthchecks).

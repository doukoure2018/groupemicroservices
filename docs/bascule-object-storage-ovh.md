# Bascule des photos vers OVHcloud Object Storage

Les photos d'annonces sont stockées par `immobilierservice` via le SDK S3
d'Amazon. En local et sur les piles actuelles, la cible est le MinIO embarqué
dans `docker-compose.yml`. Ce document décrit le passage à OVHcloud Object
Storage, compatible S3, sans changer le code métier.

## Pourquoi

- Les photos ne remplissent plus le disque du VPS et survivent à sa perte.
- Classe Standard trois zones : environ 0,014 € par Go et par mois, trafic
  sortant et appels API gratuits. Cent gigaoctets ≈ 1,40 €/mois.
- Le conteneur MinIO (400 Mo réservés) disparaît de la pile.

## Ce qui a changé dans le code (rétrocompatible)

| Élément | Avant | Après |
|---|---|---|
| Région de signature | figée `us-east-1` | `MINIO_REGION` (défaut `us-east-1`) |
| Accès par chemin | figé | `MINIO_PATH_STYLE` (défaut `true`) |
| Lecture anonyme des buckets | `minio-init` (mc) | `MINIO_PUBLIC_READ=true` : politique posée par le service au démarrage |
| Noms des buckets | figés | `MINIO_BUCKET_PHOTOS`, `MINIO_BUCKET_THUMBNAILS` |

Tant que les nouvelles variables sont vides, rien ne change : MinIO reste la
cible. La région compte : la signature AWS v4 l'inclut, et OVH refuse une
région incorrecte (`SignatureDoesNotMatch`).

## Côté OVH

1. Manager OVHcloud, Public Cloud : créer un projet (ou réutiliser).
2. Object Storage : créer deux conteneurs S3 dans la même région, classe
   Standard. Région conseillée : `eu-west-par` (Paris, trois zones). Les noms
   sont uniques dans la région : préfixer, par exemple `sira-immo-photos` et
   `sira-immo-photos-thumbnails`.
3. Utilisateurs S3 : créer un utilisateur avec le rôle *ObjectStore operator*,
   puis générer ses identifiants S3 (access key et secret key). La secret key
   n'est affichée qu'une fois.
4. Point d'accès : `https://s3.<région>.io.cloud.ovh.net`. Signature v4, accès
   par chemin accepté.

## Variables à renseigner

| Variable | Valeur |
|---|---|
| `MINIO_ENDPOINT` | `https://s3.eu-west-par.io.cloud.ovh.net` |
| `MINIO_ACCESS_KEY` | access key de l'utilisateur S3 |
| `MINIO_SECRET_KEY` | secret key |
| `MINIO_REGION` | `eu-west-par` |
| `MINIO_PUBLIC_READ` | `true` |
| `MINIO_PUBLIC_URL` | `https://s3.eu-west-par.io.cloud.ovh.net` |
| `MINIO_BUCKET_PHOTOS` | `sira-immo-photos` |
| `MINIO_BUCKET_THUMBNAILS` | `sira-immo-photos-thumbnails` |

- Déploiement par GitHub Actions : ajouter ces huit entrées comme secrets de
  l'environnement (`test` puis `prod`). La chaîne `backend-cd` les relaie dans
  le `.env` généré sur le serveur ; vides, la pile retombe sur MinIO et
  `MINIO_PUBLIC_URL` garde sa valeur historique par environnement.
- Pile lancée à la main : les mettre dans le `.env` à côté du compose.

`MINIO_PUBLIC_URL` sert à construire la colonne `url` des photos :
`<MINIO_PUBLIC_URL>/<bucket>/<clé>`. Avec l'accès par chemin, c'est l'hôte du
point d'accès lui-même.

## Migration des photos existantes

```bash
# rclone : un remote par côté (configuration interactive : rclone config)
rclone sync minio:immo-photos            ovh:sira-immo-photos            --progress
rclone sync minio:immo-photos-thumbnails ovh:sira-immo-photos-thumbnails --progress
```

```sql
-- Ancienne forme : https://api.synergia-guinee.com/immo-photos/<clé>
-- Nouvelle forme : https://s3.eu-west-par.io.cloud.ovh.net/sira-immo-photos/<clé>
UPDATE photos
   SET url = replace(url, 'https://api.synergia-guinee.com/immo-photos/',
                          'https://s3.eu-west-par.io.cloud.ovh.net/sira-immo-photos/'),
       url_thumbnail = replace(url_thumbnail, 'https://api.synergia-guinee.com/immo-photos-thumbnails/',
                          'https://s3.eu-west-par.io.cloud.ovh.net/sira-immo-photos-thumbnails/');
```

Les clés d'objets (`object_key`, `object_key_thumbnail`) ne changent pas ; le
point d'entrée `/immo/photos/{uuid}` continue de fonctionner.

## Ordre des opérations

1. Créer buckets et identifiants sur OVH, poser les secrets GitHub.
2. Déployer le backend : le service crée les buckets manquants et pose la
   politique de lecture publique (trace `Lecture publique activée`).
3. Envoyer une photo depuis l'application, puis ouvrir l'URL retournée dans un
   navigateur sans être connecté.
4. Copier l'existant avec rclone, exécuter la mise à jour SQL.
5. Retirer `minio`, `minio-init`, le volume `minio_data` et le `depends_on`
   correspondant du compose ; redéployer.

## Retour arrière

Vider les huit secrets et redéployer : la pile revient sur MinIO. Tant que
l'étape 5 n'est pas faite, les données MinIO sont intactes. Les URL réécrites
en base doivent alors être rétablies par la requête inverse.

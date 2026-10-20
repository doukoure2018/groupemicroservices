# Mise en service du web React

> Rédigé le 2026-09-10. Complète `deploy-ovh-sira.md`, qui reste la référence
> pour le provisionnement du VPS et la pile backend.

## Ce qui change par rapport à l'image Angular

L'image Angular fige ses URLs à la compilation, ce qui impose deux constructions
et deux images par livraison. Le client React utilise `window.location.origin` et
des chemins relatifs ; le nginx du conteneur relaie ces chemins vers le gateway
par le DNS interne du réseau Docker.

Conséquence : **une seule image sert TEST et PROD**. Les tags `test-latest` et
`prod-latest` pointent sur le même condensat, seul le tag déployé change. La
dette `frontend-fileutils-hardcoded-urls` ne se reporte pas sur le React.

Les cinq préfixes relayés sont exactement ceux que le gateway route, sans
réécriture : `/authorization`, `/user`, `/billetterie`, `/notification`, `/immo`.

## Pièces livrées

| Fichier | Rôle |
|---|---|
| `sira-frontend/Dockerfile` | construction en deux étapes, monorepo npm workspaces |
| `sira-frontend/deploy/nginx.conf` | service du bundle et relais vers le gateway |
| `sira-frontend/deploy/gateway.inc` | en-têtes communs aux cinq relais |
| `sira-frontend/deploy/securite.inc` | en-têtes de sécurité, politique de contenu en observation |
| `docker-compose.yml`, service `web` | conteneur, port local, contrôle de santé |
| `.github/workflows/frontend-react-cd.yml` | vérification du typage, construction, publication, déploiement |

## Cohabitation avec l'Angular

Le service `web` tourne **à côté** du service `frontend`, sur un port distinct.
Les deux applications restent servables tant que la bascule n'est pas décidée.
Basculer ou revenir en arrière ne touche ni les images ni le compose : c'est un
changement de port dans le vhost nginx de l'hôte.

## État au 2026-09-10

`WEB_HOST_PORT` et `WEB_IMAGE_TAG` sont posés sur les **deux** piles du VPS, et
le service `web` tourne sur TEST, en bonne santé, à côté du service Angular
resté intact.

Nuance importante : cette première mise en service a utilisé une image
**construite sur le VPS**, parce qu'aucune session Docker Hub n'était ouverte
depuis le poste et que le poste est en arm64 alors que le serveur est en
x86_64. L'image n'est donc **pas encore publiée sur Docker Hub**, et le
`docker pull` de la chaîne échouera tant qu'elle n'aura pas tourné une première
fois depuis GitHub avec les identifiants du dépôt.

## Prérequis, une seule fois par pile

La convention du projet préfixe les ports du test par un `1`.

Déjà fait le 2026-09-10 sur les deux piles. Pour rejouer l'opération ailleurs :

```bash
# ~/sira-guinee/test/.env
echo 'WEB_HOST_PORT=14203' >> ~/sira-guinee/test/.env

# ~/sira-guinee/prod/.env
echo 'WEB_HOST_PORT=4203' >> ~/sira-guinee/prod/.env
```

Vérifier qu'aucun autre service n'occupe ces ports :

```bash
sudo ss -ltnp | grep -E ':(4203|14203)\b' || echo "ports libres"
```

## Première mise en service sur TEST

La chaîne se déclenche seule à chaque poussée sur `main` touchant
`sira-frontend/`. Pour un premier essai manuel, onglet Actions, workflow
« CD - Build & Deploy Web React SIRA Guinée », environnement `test`.

Contrôle depuis le VPS, sans exposer le service au public :

```bash
curl -fsS http://127.0.0.1:14203/health          # doit répondre OK
curl -fsS http://127.0.0.1:14203/ | head -c 200  # doit contenir <title>SYNERGIA
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:14203/billetterie/villes/active   # 200 : le relais fonctionne
```

Le dernier appel est le contrôle qui compte : il prouve que le conteneur résout
`gateway` et que le relais traverse jusqu'au service métier.

## Exposition publique sur TEST

**Fait le 2026-09-11 : `https://test.synergia-guinee.com` sert le React.** Le vhost
`sira-guinee-test` a été basculé du port 14202 vers 14203 ; la copie du dépôt
dans `nginx/` reflète le serveur. Vérifié depuis Internet avec un navigateur :
neuf écrans montent, la page d'accueil charge de vraies villes à travers toute
la chaîne, et la politique de contenu en observation ne signale aucune
violation sur les écrans publics.

Un sous-domaine dédié aurait été plus prudent, mais le certificat n'est pas un
joker et le DNS n'a pas d'entrée joker : cela aurait demandé une entrée chez le
registraire et une extension du certificat. La bascule directe a été retenue
parce qu'elle est réversible en une ligne, et parce que TEST existe pour cela.

## Bascule et retour arrière

La bascule consiste à changer une seule ligne du vhost concerné, puis :

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Le retour arrière est la même opération dans l'autre sens. Le conteneur Angular
n'a pas été arrêté, donc le retour est immédiat et ne demande aucune
reconstruction.

## Politique de contenu

L'en-tête est livré en mode observation, sous le nom
`Content-Security-Policy-Report-Only`. L'application ne charge ni script ni
police externe ; seule la carte OpenStreetMap est affichée en cadre, et les
documents authentifiés passent par des URL blob.

Avant de l'appliquer réellement, parcourir les écrans avec la console ouverte,
vérifier qu'aucune violation n'est signalée, puis renommer l'en-tête en
`Content-Security-Policy` dans `sira-frontend/deploy/securite.inc`.

## Limites connues à la date de rédaction

- **Aucun test de parité automatisé.** Le seul filet avant la mise en ligne est
  la vérification du typage dans la chaîne. Un écran peut donc partir en ligne
  avec un comportement différent de l'Angular sans que rien ne l'arrête.
- **Le bundle dépasse le mégaoctet** avant compression. Il n'est pas découpé par
  route. Sur les réseaux mobiles de Conakry, c'est le premier chargement qui en
  souffre.
- Le conteneur ne démarre pas si le nom `gateway` ne résout pas. C'est voulu, et
  c'est le même comportement que l'image Angular, mais cela signifie que l'image
  ne peut pas être lancée seule hors de la pile.

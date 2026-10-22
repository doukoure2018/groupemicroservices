# Bascule de domaine : sira-guinee.com → synergia-guinee.com

Décidée le 19 octobre 2026. L'interface affiche SYNERGIA partout ; le mot SIRA
ne subsiste que dans les noms techniques. Le domaine est aligné sur la marque.

## Principe

Les deux domaines fonctionnent en parallèle. `synergia-guinee.com` sert
l'application ; `sira-guinee.com` redirige en 301, ce qui préserve les liens
déjà partagés (emails de vérification, QR codes de billets, annonces). Les
blocs de redirection sont à supprimer à l'expiration de l'ancien domaine, le
31 mai 2027.

## Noms d'hôtes

| Ancien | Nouveau | Rôle |
|---|---|---|
| sira-guinee.com | synergia-guinee.com | site public, production |
| www.sira-guinee.com | www.synergia-guinee.com | alias |
| api.sira-guinee.com | api.synergia-guinee.com | passerelle, production |
| test.sira-guinee.com | test.synergia-guinee.com | site public, test |
| api-test.sira-guinee.com | api-test.synergia-guinee.com | passerelle, test |

## Ce qui est déjà fait dans le dépôt

- Remplacement du domaine dans 25 fichiers : vhosts nginx, chaînes de
  livraison, profils de production des services, frontend React, application
  mobile Flutter, documentation.
- Les listes d'origines autorisées (CORS) du serveur d'autorisation et de la
  passerelle déclarent **les deux domaines**, pour ne rien casser pendant la
  transition.
- Blocs de redirection 301 ajoutés aux deux vhosts, utilisant l'ancien
  certificat. Syntaxe validée avec nginx 1.27.
- Migration `V38__rebrand_synergia_oauth_redirect_uris.sql` : URI de retour et
  de déconnexion OAuth2 pour les deux domaines.

### Ce qui n'a volontairement pas été touché

- **Migrations V22, V23 et V33** : elles contiennent l'ancien domaine mais sont
  déjà appliquées. Les modifier casserait la somme de contrôle Flyway et
  bloquerait tout déploiement. V38 les remplace fonctionnellement.
- **Noms de fichiers** `nginx/sira-guinee-*.conf` : la chaîne de livraison les
  écrase à chaque déploiement sous le même nom. Les renommer laisserait sur le
  serveur un vhost orphelin encore activé, en conflit de `server_name` avec les
  nouveaux blocs de redirection, ce qui ferait échouer `nginx -t` et donc
  sauter silencieusement le rechargement. Incohérence cosmétique assumée.
- **Adresses électroniques des comptes** (`eureka-manager@`, `conformite@`,
  `admin@`) : ce sont des identifiants de connexion, et la suite de tests
  s'appuie sur l'un d'eux. À traiter séparément si souhaité.

## Le serveur

| Élément | Valeur |
|---|---|
| Nom | `vps-9c0c080e.vps.ovh.net` |
| IPv4 | **146.59.15.185** |
| IPv6 | `2001:41d0:601:1100::8077` |
| Modèle | VPS-4 2027 — 8 vCore, 24 Go, 200 Go NVMe |
| Localisation | Europe — Royaume-Uni, Erith |
| Système | Ubuntu 26.04, utilisateur `ubuntu` |
| Mis en service | 22 octobre 2026 |

**L'ancien serveur SIRA n'existe plus.** L'alias SSH `sira` pointait sur
`51.255.203.214`, machine disparue des abonnements OVH : l'abonnement a expiré
et OVH l'a reprise. Ne pas confondre non plus avec `51.91.254.218`, qui héberge
le projet Crédit Rural de Guinée.

Vérifier l'adresse avant de créer la moindre entrée :

```bash
dig +short vps-9c0c080e.vps.ovh.net
```

## ⚠️ Le domaine est livré lié à un hébergement mutualisé

`synergia-guinee.com` a été commandé avec l'offre gratuite `hosting-free-100m`.
OVH configure donc la zone pour pointer vers le cluster mutualisé, et non vers
le VPS : au 22 octobre 2026, `www.synergia-guinee.com` résout déjà vers
`51.91.236.255` (`cluster129.hosting.ovh.net`).

**Il faut reprendre la main sur la zone** une fois sa création terminée, sous
24 à 48 heures. L'hébergement mutualisé étant gratuit, il suffit de l'ignorer ;
inutile de le résilier. Les enregistrements MX peuvent rester, l'envoi des
emails passant par SMTP Gmail et non par ce domaine.

## ⚠️ Risque ouvert : la zone de sira-guinee.com pointe dans le vide

Les cinq enregistrements A de `sira-guinee.com` désignent encore
`51.255.203.214`, une adresse qu'OVH a reprise et qui sera réattribuée à un
autre client. Tant qu'ils subsistent :

- quiconque obtient cette adresse reçoit le trafic destiné à vos noms et peut
  y servir le contenu de son choix sous votre domaine ;
- il peut aussi obtenir un certificat TLS valide pour `sira-guinee.com` par
  validation HTTP, puisque le domaine résout vers sa machine.

**À faire sans attendre le nouveau serveur** : supprimer ces enregistrements A,
ou les faire pointer vers une adresse que vous contrôlez. Cela n'aggrave rien,
le site est déjà inaccessible.

Zone à corriger : <https://www.ovh.com/manager/#/web/domain/sira-guinee.com/zone>

## Ordre des opérations

L'ordre compte : sans certificat, `nginx -t` échoue et la chaîne de livraison
conserve l'ancienne configuration sans prévenir.

1. **Disposer d'un serveur.** L'ancien n'existe plus (voir plus haut). Rien
   au-delà de l'étape 2 n'est possible sans machine : le certificat exige un
   serveur joignable sur le port 80.
2. **Acheter le domaine** chez OVH, même compte que l'actuel. Indépendant du
   serveur, donc faisable immédiatement.
3. **Zone DNS** : faire pointer vers `146.59.15.185` les cinq noms de
   `synergia-guinee.com` (apex, `www`, `api`, `test`, `api-test`), en
   remplaçant ceux que l'hébergement mutualisé a installés. Faire pointer
   **aussi** les cinq noms de `sira-guinee.com` vers la même adresse : les
   blocs de redirection en ont besoin pour obtenir leur certificat. Attendre
   la propagation (`dig +short synergia-guinee.com`).
4. **Certificat**, sur le serveur. Les configurations d'amorçage servent le
   défi HTTP :
   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot \
     -d synergia-guinee.com -d www.synergia-guinee.com \
     -d api.synergia-guinee.com -d test.synergia-guinee.com \
     -d api-test.synergia-guinee.com \
     -d sira-guinee.com -d www.sira-guinee.com \
     -d api.sira-guinee.com -d test.sira-guinee.com \
     -d api-test.sira-guinee.com
   ```
   Les dix noms tiennent dans **un seul certificat**, dont la lignée prend le
   nom du premier : `/etc/letsencrypt/live/synergia-guinee.com/`. Les vhosts,
   blocs de redirection compris, s'y réfèrent tous. L'ancien certificat du
   serveur disparu n'est pas récupérable, d'où l'inclusion des anciens noms
   ici. Si l'un d'eux ne résout pas encore, certbot échoue sur l'ensemble :
   vérifier les dix avec `dig` avant de lancer la commande.
5. **Secrets GitHub** de l'environnement concerné : mettre à jour les valeurs
   qui portent le domaine, en particulier celles destinées à `MINIO_PUBLIC_URL`
   si la bascule Object Storage est faite.
6. **Déployer le backend** (chaîne backend, environnement test puis prod). Elle
   téléverse les vhosts, régénère le `.env` avec `UI_APP_URL` et `OAUTH_ISSUER`
   sur le nouveau domaine, et applique la migration V38.
7. **Déployer le frontend web**.
8. **Vérifier** : ouverture du site sur le nouveau domaine, connexion complète,
   envoi d'un email de réinitialisation et clic sur le lien reçu, puis accès à
   une ancienne adresse pour confirmer la redirection 301.

## Effets à connaître

- **Les sessions en cours survivent.** Aucun service aval ne valide l'émetteur
  du jeton ; seule la signature est vérifiée via JWKS interne. Changer
  `OAUTH_ISSUER` n'affecte que les jetons émis ensuite.
- **Les photos déjà stockées ne portent pas le domaine**, le stockage étant
  vide à ce jour. Si des photos existaient, leurs adresses en base devraient
  être réécrites (voir `bascule-object-storage-ovh.md`).
- **L'application mobile** embarque les adresses à la compilation : un nouveau
  binaire est nécessaire pour que les versions installées visent le nouveau
  domaine. Les anciennes continuent de fonctionner par la redirection.

## Retour arrière

Les vhosts servent encore l'ancien domaine ; il suffit d'inverser les
redirections et de remettre `UI_APP_URL` et `OAUTH_ISSUER` sur
`sira-guinee.com`, puis de redéployer. La migration V38 n'a pas besoin d'être
annulée, elle déclare les deux domaines.

# Bascule de domaine : sira-guinee.com → synergia-guinee.com

Décidée le 19 octobre 2026. L'interface affiche SYNERGIA partout ; le mot SIRA
ne subsiste que dans les noms techniques. Le domaine est aligné sur la marque.

## Principe

`synergia-guinee.com` sert l'application. **L'ancien domaine `sira-guinee.com`
est abandonné** (décision du 23 octobre 2026) : son serveur avait déjà disparu,
le site était donc hors service depuis des semaines et aucun lien partagé ne
fonctionnait plus. Aucune redirection n'est conservée.

## Noms d'hôtes

| Nom | Rôle | État |
|---|---|---|
| synergia-guinee.com | site public, production | ✅ DNS + certificat |
| www.synergia-guinee.com | alias | ✅ DNS + certificat |
| api.synergia-guinee.com | passerelle, production | ✅ DNS + certificat |
| test.synergia-guinee.com | site public, test | ✅ DNS + certificat |
| api-test.synergia-guinee.com | passerelle, test | ✅ DNS + certificat |

Chaque nom résout en IPv4 (`146.59.15.185`) et en IPv6
(`2001:41d0:601:1100::8077`).

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

## Clôture de l'ancien domaine

`sira-guinee.com` n'est plus utilisé. Deux actions restent à faire dans
l'espace client, sans urgence technique mais pour éviter de payer et de
laisser traîner une zone trompeuse :

- **supprimer ses enregistrements A**, qui désignent encore `51.255.203.214`,
  adresse reprise par OVH et qui sera réattribuée à un autre client ;
- **désactiver son renouvellement automatique** (échéance 31 mai 2027,
  13,49 €/an).

## Ordre des opérations

L'ordre compte : sans certificat, `nginx -t` échoue et la chaîne de livraison
conserve l'ancienne configuration sans prévenir.

1. **Disposer d'un serveur.** L'ancien n'existe plus (voir plus haut). Rien
   au-delà de l'étape 2 n'est possible sans machine : le certificat exige un
   serveur joignable sur le port 80.
2. **Acheter le domaine** chez OVH, même compte que l'actuel. Indépendant du
   serveur, donc faisable immédiatement.
3. **Zone DNS** — *fait le 23 octobre 2026*. Les cinq noms pointent vers
   `146.59.15.185` en A et `2001:41d0:601:1100::8077` en AAAA. ⚠️ Le domaine
   ayant été commandé avec l'offre `hosting-free-100m`, OVH avait d'abord posé
   des A **et des AAAA** vers le cluster mutualisé. Corriger les A seuls ne
   suffit pas : Let's Encrypt privilégie IPv6 et aurait validé contre le
   mauvais serveur.
4. **Certificat** — *émis le 23 octobre 2026*, expire le 21 janvier 2027,
   renouvellement automatique vérifié par simulation.

   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot \
     -d synergia-guinee.com -d www.synergia-guinee.com \
     -d api.synergia-guinee.com -d test.synergia-guinee.com \
     -d api-test.synergia-guinee.com \
     --non-interactive --agree-tos --register-unsafely-without-email
   ```

   Lignée : `/etc/letsencrypt/live/synergia-guinee.com/`. Enregistré sans
   adresse de contact : le renouvellement est automatique, mais aucun rappel
   d'expiration n'est envoyé. Pour en ajouter une :
   `sudo certbot update_account --email <adresse>`.
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

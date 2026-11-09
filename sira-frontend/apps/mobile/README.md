# SYNERGIA mobile (Expo)

Application mobile de SYNERGIA, en React Native via Expo. Elle réunira **deux
univers** — *Voyager* (recherche, réservation, billets) et *Me loger*
(recherche de biens, contact, visites, publication) — dans une seule
application ; l'architecture retenue est décrite dans
`docs/proposition-application-unique.md`. Aujourd'hui seul l'univers Voyager
est construit ; il remplace la partie transport de l'application Flutter de
`mobile_app/`, dont l'immobilier sera porté ensuite.

Elle consomme les paquets partagés du monorepo : `@sira/core` (modèles,
formatage), `@sira/api-client` (API typée) et `@sira/auth` (session,
rafraîchissement silencieux), avec les jetons dans le trousseau du téléphone
(`expo-secure-store`).

**Identité** : nom `SYNERGIA`, court nom Expo `synergia`, schémas de liens
`sira://` (hérité ; le site l'emploie pour le retour de paiement et
l'activation par courriel) et `synergia://`. L'icône et l'écran de lancement
portent l'emblème de marque ; le bus identifie l'univers Voyager à l'intérieur.
Paquet Android et identifiant iOS : `com.synergiaguinee.app`, le même des deux
côtés, décidé le 9 novembre 2026 avant toute publication. Les anciens noms
(`com.billetterie.gn`, `com.sira.guinee.app`) venaient de l'époque SIRA. Ce
renommage attend encore deux choses : une application Android
`com.synergiaguinee.app` dans le projet Firebase, dont le `google-services.json`
remplacera celui du dépôt (toujours au nom de l'ancien paquet : une
construction native Android échoue tant qu'il n'est pas remplacé), et les
clients OAuth Google recréés pour ce paquet. Expo Go n'en dépend pas.

## Lancer

```bash
# depuis la racine du monorepo, une fois : paquets partagés
npx tsc -b packages/core packages/api-client packages/auth

cd apps/mobile
EXPO_PUBLIC_ENV=test npx expo start      # environnement de test (défaut si rien n'est précisé)
EXPO_PUBLIC_ENV=prod npx expo start      # production
```

Il n'y a pas d'environnement « localhost » : un téléphone ne voit pas la machine
de développement, et le backend de test est joignable de partout. Le défaut est
le test, jamais la production.

Expo Go suffit tant qu'aucun module natif hors de sa liste n'est ajouté. Les
routes vivent dans `src/app/` (Expo Router) ; le reste dans `src/`.

### Deux univers, une barre d'onglets

L'application réunit *Voyager* (le transport) et *Me loger* (l'immobilier).
Le choix se fait une fois, au premier lancement (`src/app/choisir-univers.tsx`),
puis l'application rouvre le dernier univers utilisé : l'état vit dans
`src/univers.ts`, retenu sur l'appareil. La barre d'onglets est unique
(`src/app/(tabs)/_layout.tsx`) et sa composition dépend de l'univers :
Réservation · Billets · Contrôle · Compte d'un côté, Recherche · Compte de
l'autre ; les onglets de l'autre univers sont retirés de la barre (`href: null`)
mais restent joignables, et y arriver bascule l'univers. *Compte*, la
connexion, les notifications, les préférences et le paiement sont communs. Le
sélecteur « Voyager | Me loger » vit dans l'en-tête des deux accueils
(`src/ui/selecteur-univers.tsx`). Les raisons de ce découpage sont dans
`docs/proposition-application-unique.md`, § 4.

## Construire avec EAS

```bash
npx eas-cli@latest build --profile test --platform android     # APK de test, distribution interne
npx eas-cli@latest build --profile production --platform all   # magasins
```

Le projet EAS est `@doukoure2711/synergia` (identifiant dans `app.json`,
`extra.eas.projectId`) ; les profils `development`, `test` et `production` sont
dans `eas.json`. La première construction EAS demandera de confier à EAS la
clé de signature Android et, pour iOS, un compte du programme développeur
Apple. Les magasins attendent la validation complète du parcours. Le schéma de
lien profond `sira` reste celui des courriels de vérification.

## Vérifier

```bash
npx tsc --noEmit
npx expo-doctor
EXPO_PUBLIC_ENV=test npx expo export --platform android --output-dir .expo-export-check   # empaquetage Metro complet
```

## Parcours couverts

L'application s'ouvre sur la recherche, **sans compte** : les onglets
Réservation, Billets et Mon compte se visitent sans session, comme le site.
Seuls les écrans qui en ont besoin (réserver, billets d'une commande,
changement de date, notation, notifications) sont enveloppés par
`ExigerSession` (`src/auth/exiger-session.tsx`) : sans session, la connexion
s'ouvre à leur place avec le chemin visé en paramètre `suite`, et y revient
une fois faite. Sans compte, Billets et Mon compte invitent à s'identifier.
La fiche d'un voyage (`GET /billetterie/offres/{uuid}`) est lisible sans jeton,
par une règle d'expression régulière sur l'UUID dans la passerelle et le service.

Connexion par email et mot de passe ou par Google (avec complétion du profil,
adresse exigée, au premier passage), inscription d'un particulier (les agences
s'inscrivent sur le site), activation du compte par lien profond `sira://verify`
(la page du site active puis renvoie vers l'application, connectée d'emblée),
mot de passe oublié (le lien du courriel mène à la page du site), recherche de
voyage à la manière de l'application de référence (villes actives, calendrier
sur soixante jours, feuille Passagers / Bagages avec adultes, enfants et
bagages ; squelette avec l'emblème pendant le chargement ; bandeau des
prochains jours sur les résultats, cartes heure-durée-arrivée (+1 jour)-gares-
véhicule-prix par personne, étiquettes « Le moins cher » et « Le plus rapide »,
filtres de tri, de plages horaires et de véhicule, détail du voyage en feuille
basse avec « Continuer » — tout se calcule sur le client avec `@sira/core`
`recherche.ts`), réservation en quatre étapes (passagers adultes et enfants
avec date de naissance et règle d'âge, bagages supplémentaires, contact,
sièges — plan du véhicule dessiné depuis `GET /billetterie/offres/{uuid}/sieges`,
choix au doigt ou « Ignorer la sélection » pour une attribution automatique
côte à côte —, bagages, contact, règlement) dont le récapitulatif vient du **devis serveur**
(`POST /billetterie/commandes/devis`, public) : le total renvoyé à la
création est celui affiché, le serveur refuse si le prix a changé ; compte à
rebours du délai de paiement sur l'écran d'attente, paiement en
ligne (page du prestataire dans le navigateur du système, puis interrogation
de l'état jusqu'à décision), billets avec code QR, mes voyages avec reprise
d'un paiement interrompu, changement de date vers un autre départ du même
trajet (montant réglé conservé, règle du serveur), annulation et notation d'un
voyage effectué (note de 1 à 5, commentaire facultatif, un seul avis par
commande), notifications in-app (cloche avec compteur de non-lues, liste,
marquage lu, tap vers la commande ou la notation) et notifications poussées
sur Android (jeton FCM natif enregistré auprès du serveur), profil, et pour
les contrôleurs un onglet de contrôle des billets : lecture du QR par
l'appareil photo ou saisie du code, un seul scan traité à la fois, verdict
vert ou rouge avec le message du serveur.

## Paiement en ligne : pourquoi une WebView

La page du prestataire s'affiche **dans** l'écran de paiement
(`react-native-webview`), pas dans le navigateur du téléphone. Chrome refuse
de rendre la main à une application sans un geste du voyageur ; or la
redirection de retour est déclenchée par l'opérateur lui-même, et Chrome
répondait par une page puis une demande de permission (« Poursuivre dans
SYNERGIA ? »). Dans l'application, c'est nous qui voyons passer l'adresse de
retour (`/paiement/retour…` ou `sira://`) et fermons la page ; l'application
restant au premier plan, l'interrogation de l'état continue pendant le
paiement, et une confirmation donnée sur la demande Orange Money suffit à
ouvrir les billets. Les liens d'application Android (`assetlinks.json`, route
`paiement/retour`) restent en place pour un paiement lancé depuis le site.

Module natif : après son ajout, la version de développement se reconstruit
(`npx expo run:android`) ; Expo Go ne l'embarque pas.

## Reste à porter depuis le Flutter

Notifications poussées et connexion Google sur iOS : les deux demandent un
fichier `GoogleService-Info.plist` et une décision sur la chaîne de push
(voir ci-dessous). Le périmètre fonctionnel du Flutter est couvert, immobilier
compris depuis les lots I0 à I3 (recherche, fiche, favoris, demandes,
publication) ; voir `docs/proposition-application-unique.md`.

## Immobilier : où sont les écrans

L'univers Me loger vit dans les onglets `biens` (recherche), `favoris`,
`demandes`, et dans les écrans `biens/resultats`, `bien/[uuid]` (fiche, avec
contact, visite et signalement), `declarer-besoin`, `mes-annonces` et
`publier/*` (profil, assistant en quatre étapes, photos). Les briques de
formulaire communes sont dans `src/ui/formulaire.tsx`. Les modèles et les
appels sont dans `@sira/core` et `@sira/api-client` (`immo.ts`), vérifiés
appel par appel contre le serveur de test : les noms des critères de
recherche, les clés des réponses et les valeurs de tri viennent du serveur,
jamais d'une supposition.

## Lien profond d'activation

La route `src/app/verify.tsx` accepte deux formes. Celle que la page du site
envoie aujourd'hui porte les jetons déjà émis (`accessToken`, `refreshToken`,
`idToken`) : c'est ce qu'attend aussi l'application Flutter encore publiée, et
c'est une dette connue, des jetons transitent dans une adresse. La forme saine
ne porte que le jeton de vérification à usage unique (`token`) et laisse
l'application appeler le serveur. Dès que le Flutter sera retiré, la page
`VerifyMobilePage` du web pourra rediriger vers `sira://verify?token=…` et la
dette disparaîtra sans toucher au mobile.

Pour l'essayer sans courriel, depuis un terminal avec un appareil connecté :

```bash
npx uri-scheme open "sira://verify?token=<jeton>" --android
```

## Notifications poussées

Le serveur envoie par FCM. Sur Android, le jeton natif rendu par
`expo-notifications` est un jeton FCM : il est enregistré tel quel auprès du
serveur à la connexion, avec le fichier `google-services.json` repris du
Flutter (même paquet Android, même projet Firebase). Sur iOS, le jeton natif
est un jeton APNs que le serveur ne sait pas utiliser sans le SDK Firebase :
rien n'est enregistré tant que la chaîne iOS n'est pas décidée, soit le SDK
Firebase dans l'application, soit un envoi par le service de push d'Expo côté
serveur.

Expo Go ne reçoit plus de notifications poussées sur Android depuis le SDK 53 :
pour les tester il faut une construction de développement ou l'APK du profil
`test`. Les notifications in-app, elles, fonctionnent dans Expo Go.

## Connexion Google

Module natif `@react-native-google-signin/google-signin`, configuré avec
l'identifiant client web du projet Google : c'est l'audience que le serveur
vérifie sur le jeton d'identité (`POST /authorization/api/auth/google`), qui
retrouve ou crée le compte. Android est prêt grâce au `google-services.json`
repris du Flutter. iOS attend un `GoogleService-Info.plist` et l'option
`iosUrlScheme` du plugin.

Comme les notifications poussées, ce module ne fonctionne pas dans Expo Go :
il faut une construction de développement (`npx expo run:android`) ou l'APK du
profil `test`. Dans Expo Go, le bouton Google échoue proprement et la
connexion par email reste disponible.

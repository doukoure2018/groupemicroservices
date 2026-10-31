# SYNERGIA mobile (Expo)

Application mobile voyageur, en React Native via Expo, qui remplace progressivement
l'application Flutter de `mobile_app/`. Elle consomme les paquets partagés du
monorepo : `@sira/core` (modèles, formatage), `@sira/api-client` (API typée) et
`@sira/auth` (session, rafraîchissement silencieux), avec les jetons dans le
trousseau du téléphone (`expo-secure-store`).

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

## Construire avec EAS

```bash
npx eas-cli@latest build --profile test --platform android     # APK de test, distribution interne
npx eas-cli@latest build --profile production --platform all   # magasins
```

Les identifiants sont ceux de l'application Flutter, pour que la publication
soit une mise à jour et non une seconde application : `com.billetterie.gn`
(Android) et `com.sira.guinee.app` (iOS). Le schéma de lien profond `sira`
est celui des courriels de vérification.

## Vérifier

```bash
npx tsc --noEmit
npx expo-doctor
EXPO_PUBLIC_ENV=test npx expo export --platform android --output-dir .expo-export-check   # empaquetage Metro complet
```

## Parcours couverts

Connexion par email et mot de passe ou par Google (avec complétion du profil,
adresse exigée, au premier passage), inscription d'un particulier (les agences
s'inscrivent sur le site), activation du compte par lien profond `sira://verify`
(la page du site active puis renvoie vers l'application, connectée d'emblée),
mot de passe oublié (le lien du courriel mène à la page du site), recherche de voyage (villes actives, sept prochains jours),
résultats, détail, réservation (passagers, mode de règlement), paiement en
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

## Reste à porter depuis le Flutter

Notifications poussées et connexion Google sur iOS : les deux demandent un
fichier `GoogleService-Info.plist` et une décision sur la chaîne de push
(voir ci-dessous). Le périmètre fonctionnel du Flutter est couvert.

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

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

Connexion par email et mot de passe, recherche de voyage (villes actives, sept
prochains jours), résultats, détail, réservation (passagers, mode de règlement),
paiement en ligne (page du prestataire dans le navigateur du système, puis
interrogation de l'état jusqu'à décision), billets avec code QR, mes voyages
avec reprise d'un paiement interrompu et annulation, profil.

## Reste à porter depuis le Flutter

Inscription et complétion de profil, mot de passe oublié, lien profond de
vérification de compte, modification de date, notation du voyage,
notifications, scanner du contrôleur, connexion Google.

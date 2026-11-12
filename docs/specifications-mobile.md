# Spécifications — application mobile SYNERGIA (React Native)

Fiche technique de l'application `sira-frontend/apps/mobile`, relevée sur le
dépôt le 12 novembre 2026. Les valeurs ci-dessous sont celles du projet, pas
des recommandations générales : elles se vérifient dans `package.json`,
`app.json` et les dossiers natifs générés.

Les règles de texte et de couleur sont dans `docs/charte-typographique-mobile.md`,
les images dans `docs/charte-images-mobile.md`, et l'architecture des deux
univers dans `docs/proposition-application-unique.md`.

---

## 1. Identité et périmètre

| | |
|---|---|
| Nom affiché | **SYNERGIA** |
| Court nom Expo | `synergia` |
| Paquet Android, identifiant iOS | `com.synergiaguinee.app` des deux côtés |
| Schémas de lien profond | `sira://` (hérité, employé par les courriels et le retour de paiement) et `synergia://` |
| Projet EAS | `@doukoure2711/synergia` |
| Projet Google / Firebase | `supple-alpha-405513` |
| Deux univers | **Voyager** (billetterie) et **Me loger** (immobilier), une seule application, un seul compte |

Une seule application sert les deux métiers. Le choix d'univers se fait au
premier lancement, se retient sur l'appareil, et se change par le sélecteur de
l'en-tête. La barre d'onglets est unique et sa composition dépend de l'univers.

---

## 2. Socle technique

| Brique | Version | Remarque |
|---|---|---|
| Expo SDK | 58.0.22 | `~58.0.24` attendu par la trousse, écart de correctif |
| React Native | 0.88.1 | |
| React | 19.3.0 | **une seule version dans tout le dépôt** : un React en double casse le paquet mobile |
| TypeScript | ~6.0.3 | mode strict, `npx tsc --noEmit` sans erreur |
| Expo Router | ~58.0.29 | routage par fichiers, routes typées activées |
| TanStack Query | ^5.62.0 | cache des requêtes, invalidations par clé |
| Node (poste de développement) | 26.7 | |

**Modules natifs retenus** : `expo-camera` (lecture des codes QR),
`expo-image-picker` (photos des annonces), `expo-notifications`,
`expo-secure-store` (jetons de session), `expo-splash-screen`,
`expo-web-browser`, `expo-linking`, `expo-constants`, `expo-device`,
`react-native-webview` 14.0.1 (paiement), `react-native-qrcode-svg` et
`react-native-svg` (billets), `react-native-safe-area-context`,
`react-native-screens`, `@react-native-google-signin/google-signin` 17.

Aucune police n'est téléchargée : l'application utilise celle du système, Roboto
sur Android et San Francisco sur iPhone. Aucune bibliothèque de cartes n'est
installée ; une adresse s'ouvre dans l'application de cartes du téléphone.

---

## 3. Appareils visés

| | Android | iOS |
|---|---|---|
| Version minimale | API 24 (Android 7) | iOS 16.4 |
| Cible de compilation | `targetSdk` 36, `compileSdk` 37 | SDK courant d'Xcode 26 |
| Architecture de référence | 720 × 1600, densité 280 (environ 270 ppp), 2 Go de mémoire | iPhone récent |

L'application est conçue pour le téléphone d'entrée de gamme guinéen, lu
dehors, en plein soleil, sur un réseau intermittent. Cela commande la charte
typographique, le plancher de 14 points pour tout texte utile, le contraste de
7:1, et le fait que chaque écran supporte une perte de réseau sans se vider.

**Orientation** : portrait seulement. **Largeur de référence** : 360 points.
**Zoom système** : respecté partout, plafonné à 1,6 sur les titres, la barre
d'onglets et les boutons, pour que la mise en page tienne au réglage « Très
grand ».

---

## 4. Architecture

```
src/
├── app/                 39 fichiers de routes (Expo Router)
│   ├── (tabs)/          barre d'onglets, composée selon l'univers
│   ├── bien/, biens/    fiche et résultats de l'immobilier
│   ├── publier/         assistant en quatre étapes et photos
│   ├── agence/          espace des comptes d'agence
│   ├── paiement/        WebView de paiement et retours
│   └── …                connexion, inscription, notifications, paramètres
├── ui/                  briques partagées : thème, formulaire, feuille, calendrier…
├── immo/                carte d'un bien, critères, favoris, feuilles de relation
├── recherche/, sieges/  composants de l'univers Voyager
├── auth/                session, gardes (session requise, compte d'agence)
├── notifications/       push et destination d'un tap
├── univers.ts           univers courant, retenu dans le trousseau
└── config.ts            environnement cible
```

**Code partagé, jamais recopié** : trois paquets du monorepo,
`@sira/core` (modèles et formatage), `@sira/api-client` (API typée),
`@sira/auth` (OAuth PKCE et sessions). Le site web consomme les mêmes. Toute
divergence de contrat se corrige dans le paquet, pas dans l'écran.

**État** : TanStack Query pour tout ce qui vient du serveur ; `useState` local
pour le reste ; un petit état partagé pour l'univers courant. Aucune
bibliothèque d'état global.

---

## 5. Environnements

L'environnement se choisit à la construction par `EXPO_PUBLIC_ENV`, et vaut
`test` par défaut : une application lancée sans rien préciser ne touche jamais
aux vrais paiements.

| | test | prod |
|---|---|---|
| API | `https://api-test.synergia-guinee.com` | `https://api.synergia-guinee.com` |
| Site | `https://test.synergia-guinee.com` | `https://synergia-guinee.com` |

Il n'y a pas de mode « localhost » : un téléphone ne voit pas la machine de
développement, et le serveur de test est joignable de partout.

---

## 6. Capacités natives et permissions

| Permission | Pourquoi | Quand elle est demandée |
|---|---|---|
| Appareil photo | lire le code QR d'un billet au contrôle, photographier un bien | à l'ouverture du scanner ou de l'envoi de photos |
| Photothèque | illustrer une annonce | au choix d'une photo |
| Notifications | confirmation de paiement, départ, visite confirmée | après la connexion |
| Internet | tout | — |

Chaque permission est demandée au moment où elle sert, jamais au démarrage, et
un refus laisse l'application utilisable : sans appareil photo, le contrôle
passe par la saisie du code ; sans photothèque, l'annonce se publie sans photo.

**Liens d'application Android** vérifiés pour trois domaines, sur
`/paiement/retour` et `/biens/`. Les liens universels iOS ne sont pas
configurés : ils demandent un compte développeur Apple.

---

## 7. Sécurité et session

- Authentification **OAuth 2.0 avec PKCE** contre le serveur d'autorisation ; jamais de mot de passe stocké.
- Jetons dans **`expo-secure-store`**, soit le trousseau iOS et le magasin chiffré d'Android, jamais dans le stockage ordinaire.
- **Rafraîchissement silencieux** et rejeu automatique d'une requête refusée pour jeton expiré.
- **Connexion Google** par jeton d'identité vérifié côté serveur, dont l'audience est l'identifiant client Web du projet.
- **Paiement en WebView** à l'intérieur de l'application : la page de l'opérateur ne quitte jamais l'application, et le retour est intercepté. Aucune donnée de carte ne transite par le code de l'application.
- **Aucun secret** dans le dépôt mobile. Les fichiers Firebase y sont, mais ils ne contiennent que des identifiants publics.
- La plupart des écrans se visitent **sans compte** : chercher un voyage ou un bien n'exige rien. La session est demandée au moment d'agir, et la connexion ramène où l'on était.

---

## 8. Construction et distribution

```bash
npx expo start                 # développement, Expo Go ou construction de développement
npx expo run:android           # construction native locale
npx expo run:ios               # idem, iOS
npx eas-cli@latest build --profile test --platform android     # APK de test
npx eas-cli@latest build --profile production --platform all   # magasins
```

Trois profils EAS : `development` (client de développement), `test` (APK,
distribution interne) et `production` (magasins, numéro de version
automatique). Les dossiers `android/` et `ios/` sont **régénérés** par
`npx expo prebuild` et ignorés par git : rien ne se modifie à la main dedans.

**Avant la première publication**, deux choses restent : ajouter l'empreinte de
la clé de signature d'EAS au client OAuth Android et au fichier des liens
d'application, et ouvrir un compte développeur Apple pour l'iPhone, les
notifications poussées iOS et les liens universels.

**Ordres de grandeur** : paquet JavaScript 3,9 Mo ; APK de débogage 269 Mo, non
représentatif, une construction de production étant minifiée et découpée par
architecture.

---

## 9. Ce qui est vérifié avant toute livraison

1. `npx tsc --noEmit` dans l'application et dans les trois paquets partagés.
2. `npx expo export --platform android` : l'empaquetage Metro doit passer.
3. `npx expo-doctor` : 19 contrôles sur 20 passent aujourd'hui, le dernier signalant des écarts de correctif sur quatre modules Expo.
4. Les appels réellement émis par les écrans, rejoués contre le serveur de test, avec la même écriture des paramètres que le client HTTP partagé. C'est ce contrôle qui a révélé, pour l'immobilier, des noms de critères et des valeurs de tri faux dans les modèles partagés.
5. Un essai sur l'appareil pour tout ce qui touche au natif : paiement, liens profonds, photos, notifications.

---

## 10. Limites connues

- **Expo Go** ne porte ni notifications poussées, ni schémas de lien profond, ni connexion Google. Le reste du parcours y fonctionne, paiement compris.
- **Pas de carte dessinée** : la fiche d'un bien donne l'adresse et ouvre le point dans l'application de cartes.
- **L'adresse d'un bien publié depuis l'application** est saisie en texte, sans position ni quartier : ce bien n'est donc pas trouvé par le filtre de ville.
- **Les notifications du logement** ne sont pas filtrables par l'utilisateur : les réglages *Logement* portent sur les SMS du service immobilier.
- **iOS** : notifications poussées, liens universels et installation sur appareil attendent un compte développeur Apple.
- **Écarts de version** : quatre modules Expo et `react-native-safe-area-context` sont un cran derrière ce que la trousse attend ; à aligner par `npx expo install --check` au prochain passage.

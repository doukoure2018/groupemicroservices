# Images de l'application mobile SYNERGIA — spécifications de conception

Ce document s'adresse à la personne qui dessine les images. Il dit, pour
chaque image, à quoi elle sert, où elle apparaît, et ce que les plateformes
exigent d'elle. Les fichiers livrés se déposent tels quels dans
`sira-frontend/apps/mobile/assets/` sous les noms indiqués ; le branchement
dans l'application est fait de notre côté.

État au 2 novembre 2026 : toutes les variantes techniques — icône iOS, calques
de l'icône adaptative Android, icône monochrome, écran de lancement, favicon,
icône de notification, emblème de chargement — ont été **dérivées
mécaniquement de l'emblème existant** (recoloration en blanc et or, fenêtres
transparentes, mise à l'échelle dans les zones de sécurité, fond vert) et sont
en place dans l'application. Ce qui suit reste la référence pour les
**redessiner** proprement à partir d'un fichier vectoriel : la dérivation a
les limites de sa source — une image pixel de 1024 px, aux contours
anticrénelés — et l'icône de notification, à 24 px, gagnerait à être une
silhouette simplifiée. Les quatre illustrations d'écrans vides (§ 4.3)
restent à dessiner.

---

## 1. Charte à respecter

| Rôle | Couleur |
|---|---|
| Vert SYNERGIA (fond des en-têtes, boutons) | `#1b5e3b` |
| Vert foncé (textes sur fond pâle) | `#14472c` |
| Vert pâle (puces, surfaces douces) | `#e6f1ea` |
| Or (accent, badge, alerte douce) | `#c9a227` |
| Fond des écrans | `#f7f8f5` |
| Encre (texte principal) | `#1d2721` |
| Gris (texte secondaire) | `#55635a` |
| Blanc | `#ffffff` |

Règles générales :

- **Espace colorimétrique sRGB**, PNG 24 bits (PNG-32 quand il y a de la transparence), sans entrelacement, sans profil ICC exotique.
- **Un fichier maître vectoriel** (SVG ou .ai/.fig) pour chaque image, à partir duquel les PNG sont exportés. On ne redessine jamais à la main à une autre taille.
- **Aucun texte dans les icônes** : illisible à 48 px, et l'emblème seul suffit à identifier l'application.
- Le vert `#1b5e3b` est le fond dominant : tout ce qui s'y pose doit être **blanc ou or**, jamais vert foncé (contraste insuffisant).
- Pas de dégradés subtils ni d'ombres portées fines sur les icônes : les systèmes les compressent et les recadrent, le résultat devient boueux.

---

## 2. Icône de l'application

C'est l'image la plus vue : écran d'accueil du téléphone, tiroir d'applications, boutiques, notifications, réglages.

### 2.1 Icône principale — `icon.png`

| | |
|---|---|
| Taille | **1024 × 1024 px**, carré |
| Format | PNG **sans transparence** (iOS refuse les icônes avec couche alpha) |
| Coins | **droits** — chaque système applique son propre masque arrondi |
| Fond | couleur pleine, vert `#1b5e3b` recommandé |
| Zone de sécurité | tout élément important dans les **80 % centraux** (un carré de 820 px centré) : les coins sont rognés par les masques |
| Contenu | l'emblème seul, blanc (ou blanc et or), centré, occupant 60 à 70 % de la largeur |

### 2.2 Icône adaptative Android

Android ne prend pas une icône mais **des calques** qu'il recompose et anime (cercle, carré arrondi, goutte, selon le téléphone). Trois fichiers :

| Fichier | Taille | Contenu |
|---|---|---|
| `android-icon-foreground.png` | 1024 × 1024, PNG **avec transparence** | l'emblème seul, blanc ou blanc et or, **dans le cercle central de 66 %** (diamètre 676 px) — tout ce qui dépasse sera coupé par certains masques |
| `android-icon-background.png` | 1024 × 1024, PNG opaque | le fond : vert `#1b5e3b` uni, ou une texture très discrète (le premier plan bouge par-dessus lors de l'effet de parallaxe) |
| `android-icon-monochrome.png` | 1024 × 1024, PNG avec transparence | l'emblème en **une seule couleur, blanc pur**, silhouette pleine sans détails fins : Android 13+ le teinte aux couleurs du fond d'écran de l'utilisateur (« icône thématique ») |

Le premier plan et l'arrière-plan doivent fonctionner **ensemble** : prévisualiser dans l'outil « Image Asset » d'Android Studio ou le module Figma indiqué plus bas.

### 2.3 Favicon (version web et PWA) — `favicon.png`

512 × 512 px, PNG, mêmes règles que l'icône principale (fond plein). Nous en dérivons les petites tailles.

---

## 3. Écran de lancement (splash screen)

Affiché pendant que l'application démarre, une seconde ou deux. Android 12+ et iOS imposent une mise en page : **un fond uni et une image centrée**, rien d'autre — pas de pleine page illustrée, elle serait recadrée différemment sur chaque appareil.

| Fichier | `splash-icon.png` |
|---|---|
| Taille | **1024 × 1024 px**, PNG **avec transparence** |
| Contenu | l'emblème seul, **blanc**, centré, dans le cercle central de 66 % (Android 12+ l'affiche dans un disque de 192 dp et coupe ce qui dépasse) |
| Fond | fourni **comme couleur**, pas comme image : vert `#1b5e3b` |
| À éviter | le logotype « SYNERGIA » en toutes lettres : trop petit sur le disque Android, illisible |

Variante facultative pour le mode sombre : même image, fond `#14472c`.

L'écran de lancement et l'icône doivent se ressembler : le voyageur touche l'icône, voit le même emblème s'ouvrir en grand, puis l'application.

---

## 4. Images dans l'application

### 4.1 Emblème de chargement — `logo-emblem.png`

Affiché au centre de l'écran pendant la recherche de voyages (carte blanche à coins arrondis, 112 × 112 pt, sur le squelette gris des résultats).

| | |
|---|---|
| Taille | 1024 × 1024 px, PNG avec transparence |
| Contenu | l'emblème en couleurs (vert et or), **fond transparent**, marges nulles (l'image est posée sur fond blanc, on gère l'espace autour) |
| Existant | `web/public/brand/synergia-emblem-512x512.png` convient — s'assurer que le fond est bien transparent et non blanc |

### 4.2 Logotype horizontal — `logo-synergia.png` et `logo-synergia-blanc.png`

Pour l'en-tête de l'écran de connexion (fond vert : version blanche) et l'écran « Mon compte » (fond blanc : version verte).

| | |
|---|---|
| Rapport | **5,5 : 1** (comme l'existant 1320 × 240) |
| Taille | exporter à **1320 × 240 px** ; nous en tirons les densités @1x/@2x/@3x (330 × 60, 660 × 120, 990 × 180) |
| Format | PNG avec transparence ; le SVG maître est le bienvenu |
| Versions | **verte** (emblème couleur + mot en `#14472c`) et **blanche** (tout blanc, pour les fonds verts) |
| Existant | `web/public/brand/synergia-logo-660x120.png` et `…-blanc-660x120.png` : réutilisables tels quels |

### 4.3 Illustrations des écrans vides et d'accompagnement

Quatre écrans montrent aujourd'hui un dessin ou n'en montrent pas encore :

| Écran | Illustration à produire | Message qu'elle accompagne |
|---|---|---|
| Billets, sans compte | un billet incliné (existe en SVG, à redessiner dans le style retenu) | « Vous n'avez pas encore de billets » |
| Billets, compte sans réservation | une place de bus vide, ou une route qui s'ouvre | « Aucune réservation » |
| Notifications vides | une cloche au repos | « Rien de nouveau » |
| Mon compte, sans session | une personne tenant un téléphone avec un billet (à la manière de l'application de référence) | « Votre compte » |

Spécifications communes :

| | |
|---|---|
| Format | **SVG** de préférence (l'application sait les dessiner nativement et les colorer) ; sinon PNG avec transparence, exporté à **@2x et @3x** |
| Cadre | 4 : 3, soit **360 × 270 pt** → PNG 720 × 540 (@2x) et 1080 × 810 (@3x) |
| Palette | les huit couleurs de la charte, trois ou quatre par dessin ; fond transparent, un disque `#e6f1ea` derrière le sujet si l'on veut une assise |
| Trait | formes pleines plutôt que traits fins : les écrans de 5 pouces les écrasent |
| Ton | sobre, lisible, sans visages détaillés ; ce sont des pictogrammes grands, pas des scènes |

### 4.4 Icône des notifications Android — `notification-icon.png`

Le petit symbole dans la barre d'état quand une notification arrive.

| | |
|---|---|
| Taille | **96 × 96 px** |
| Format | PNG avec transparence, **blanc pur uniquement**, aucune autre couleur (Android ne garde que la forme et la teinte lui-même) |
| Contenu | la silhouette de l'emblème, simplifiée : à 24 px à l'écran, les détails disparaissent |

### 4.5 Images de la vitrine (plus tard, pour les boutiques)

À prévoir quand l'application sera publiée, pas avant :

- **Google Play** — bannière 1024 × 500 px (JPG ou PNG opaque), captures d'écran 1080 × 1920 px (2 à 8).
- **App Store** — captures 1290 × 2796 px (iPhone 6,7"), 1242 × 2208 px (5,5").
- Les captures se prennent depuis l'application elle-même ; seule la bannière se dessine.

---

## 5. Récapitulatif des livrables

| Fichier à livrer | Taille | Transparence | Priorité |
|---|---|---|---|
| `icon.png` | 1024 × 1024 | non | **1** |
| `android-icon-foreground.png` | 1024 × 1024 | oui | **1** |
| `android-icon-background.png` | 1024 × 1024 | non | **1** |
| `android-icon-monochrome.png` | 1024 × 1024 | oui, blanc seul | **1** |
| `splash-icon.png` | 1024 × 1024 | oui, blanc | **1** |
| `favicon.png` | 512 × 512 | non | 2 |
| `logo-emblem.png` | 1024 × 1024 | oui | existe |
| `logo-synergia.png` / `-blanc.png` | 1320 × 240 | oui | existent |
| `notification-icon.png` | 96 × 96 | oui, blanc seul | 2 |
| 4 illustrations d'écrans vides | SVG ou 720 × 540 + 1080 × 810 | oui | 3 |
| Fichiers maîtres (SVG / .fig / .ai) | — | — | avec chaque livrable |

---

## 6. Logiciels

### Pour dessiner (vectoriel — c'est l'outil principal)

| Logiciel | Pour qui | Prix | Notes |
|---|---|---|---|
| **Figma** | recommandé | gratuit (plan Starter) | travaille dans le navigateur ou l'application ; exporte PNG à @1x/@2x/@3x et SVG en un clic ; modules communautaires « App Icon Template » et « Android Adaptive Icon » pour prévisualiser les masques ; partage d'un lien de relecture |
| **Adobe Illustrator** | si déjà équipé | abonnement | la référence pour les logotypes ; exporter en « Exporter pour les écrans » avec les échelles 1x/2x/3x |
| **Affinity Designer 2** | alternative à l'achat unique | ~70 € une fois | très complet, export par tranches et par échelles |
| **Inkscape** | gratuit et libre | gratuit | suffit pour emblème, icônes et illustrations ; export PNG par la boîte « Exporter » |
| **Canva** | pour aller vite | gratuit / Pro | pratique pour une bannière de boutique, trop limité pour les icônes adaptatives (pas de calques exportables séparément) |

### Pour vérifier le rendu des icônes

- **Android Studio → Image Asset Studio** (gratuit) : charge le premier plan et l'arrière-plan, montre l'icône sous tous les masques (cercle, carré arrondi, goutte) et la version thématique Android 13.
- **Figma, module « Adaptive Icon Preview »** : même chose sans quitter Figma.
- Pour iOS, un simple aperçu avec masque « superellipse » (coins iOS) dans Figma suffit.

### Pour les photos et retouches (bannière de boutique)

Photoshop, **Affinity Photo**, ou **GIMP** (gratuit). Inutiles pour les icônes et illustrations, qui doivent rester vectorielles.

### Pour alléger les PNG avant livraison

**ImageOptim** (Mac, gratuit), **Squoosh** (navigateur, gratuit) ou TinyPNG. Sans perte visible, souvent −50 à −70 % de poids ; l'application se télécharge d'autant plus vite.

### Si l'on part d'une génération par IA (facultatif)

Un brouillon d'illustration peut venir d'Adobe Firefly ou de Midjourney, mais il doit ensuite être **redessiné en vectoriel** (Figma, Illustrator, ou l'outil « Vectoriser » d'Illustrator / Affinity) : une image générée est une photo pixelisée, sans calques, avec des couleurs hors charte et des détails inutilisables à petite taille.

---

## 7. Ce que nous ferons à réception

1. Dépôt des fichiers dans `apps/mobile/assets/` sous les noms ci-dessus.
2. Branchement de l'écran de lancement (`expo-splash-screen`) avec le fond `#1b5e3b` et l'image à 200 dp.
3. Reconstruction de l'application (`npx expo run:android`, puis EAS) — icône et écran de lancement sont des ressources natives, un simple rechargement ne suffit pas.
4. Vérification sur le Samsung et le simulateur iPhone : icône sous les masques, lancement, icône thématique, notification.

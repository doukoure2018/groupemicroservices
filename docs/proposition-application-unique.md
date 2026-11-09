# Une seule application, deux univers — proposition d'architecture

SYNERGIA Trans (voyages) et SYNERGIA Immo (logement) vivront dans **la même
application mobile**. Ce document propose comment les y faire tenir ensemble
sans que l'une encombre l'autre : ce que le voyageur voit en premier, comment
il passe d'un univers à l'autre, ce qui est partagé, comment le code s'organise,
et dans quel ordre construire. Rien ici n'est encore codé, sauf le point 7.

---

## 1. Ce qui existe déjà

| Côté | Transport | Immobilier |
|---|---|---|
| Serveur | `billetterieservice`, complet | `immobilierservice`, **complet** : 20 tables, 19 ressources (biens, photos, favoris, contacts, visites, besoins, brouillons, agences, conformité, signalements, préférences) ; recherche et fiche d'un bien **publiques** |
| Paquets partagés | `@sira/core` + `@sira/api-client` | **déjà là** : `immo.ts` dans les deux (modèles `Propriete`, `LeadContact`, `LeadVisite`, `DemandeBesoin`, `AgenceOnboarding`… ; clients `proprieteApi`, `immoClientApi`, `agenceApi`, `leadApi`) |
| Site web | tout le parcours voyageur + administration | **côté agences seulement** : inscription d'agence, demandes clients, conformité, modération. Aucune recherche de bien pour le public |
| Mobile Expo | 25 écrans, tout le parcours | rien |
| Mobile Flutter | parcours ancien | 7 écrans : recherche avec filtres, fiche du bien (le plus riche : photos, carte, contact, visite, partage, favori), favoris, mes demandes, déclarer un besoin, assistant de publication en 4 étapes, mes annonces |

Deux conséquences. **L'application mobile sera le canal grand public de
l'immobilier** — le site n'en a pas — ce qui justifie d'y mettre du soin. Et
**tout le travail serveur est fait** : l'immobilier mobile est un chantier
d'écrans, pas de modèle.

---

## 2. Ce que le hub Flutter enseigne

Il réunissait les deux univers dans une barre à trois onglets — *Immobilier*
(premier au démarrage), *Billetterie*, *Profil* — chaque univers ayant **sa
propre palette** (orange d'un côté, sarcelle de l'autre), et le transport
embarqué comme une application dans l'application.

Ce qu'il faut garder : **un seul compte, un seul profil, une seule session**,
et des univers joignables en un geste.

Ce qu'il faut changer :

- **Deux palettes = deux applications.** Le voyageur sentait la couture. SYNERGIA a une charte — vert et or — et un emblème par univers (le bus, les bâtiments). L'univers se reconnaît à son emblème et à ses mots, pas à un changement de couleur.
- **Les univers ne sont pas des onglets.** Chacun a besoin de sa propre barre : *Réservation · Billets* d'un côté, *Recherche · Favoris · Demandes* de l'autre. Les mettre au même niveau forçait soit des barres imbriquées, soit un onglet *Profil* fourre-tout où s'entassaient favoris, demandes et publication.
- **L'immobilier en premier** était un choix d'époque. Le billet de bus est l'usage récurrent ; le logement, l'usage épisodique.

---

## 3. Le modèle proposé : un sélecteur d'univers, une barre par univers

```
┌──────────────────────────────────────────┐
│  [🚌 Voyager]  [🏠 Me loger]        🔔   │  ← sélecteur dans l'en-tête de l'accueil
│                                          │
│  (contenu de l'univers choisi)           │
│                                          │
├──────────────────────────────────────────┤
│ Réservation   Billets   Contrôle  Compte │  ← barre PROPRE à Voyager
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  [🚌 Voyager]  [🏠 Me loger]        🔔   │
│                                          │
│  (recherche de biens)                    │
│                                          │
├──────────────────────────────────────────┤
│ Recherche    Favoris    Demandes  Compte │  ← barre PROPRE à Me loger
└──────────────────────────────────────────┘
```

**Règles**

1. **Premier lancement** : un écran de choix, deux grandes cartes — *Voyager* (le bus), *Me loger* (les bâtiments) — avec une ligne pour chacune. Un seul geste, jamais bloquant ensuite.
2. **L'application se souvient** du dernier univers et s'y rouvre. Le voyageur régulier ne revoit jamais le choix ; il change d'univers par le sélecteur de l'en-tête, ou depuis *Compte*.
3. **Une barre d'onglets par univers**, et seulement les siens. *Compte* figure dans les deux barres : c'est le même écran.
4. **Une seule palette.** L'en-tête reste vert ; c'est l'emblème (bus ou bâtiments), le squelette de chargement et le vocabulaire qui disent où l'on est. Si l'on veut une nuance, l'or peut être plus présent dans l'immobilier (badges *Vente / Location*), jamais une autre couleur de fond.
5. **Partagé, donc hors des univers** : connexion, inscription, activation, mot de passe oublié, compléter le profil, *Compte*, notifications, paramètres, préférences de notification, **paiement** (le logement aura un jour des frais de visite ou de mise en avant : l'écran et l'adresse de retour `/paiement/retour` restent communs).
6. **La cloche est commune** et chaque notification porte son univers (petit emblème). Les préférences de notification se présentent en deux sections : *Voyages* (mises à jour du trajet, promotions) et *Logement* (nouveau contact, visite confirmée — déjà en base côté serveur).
7. **Les rôles s'ajoutent sans gêner** : *Contrôle* n'apparaît qu'au contrôleur dans la barre Voyager ; *Mes annonces* et *Demandes clients* n'apparaissent qu'à l'agent d'agence, dans *Compte* et dans la barre Me loger.

**Pourquoi pas un simple quatrième onglet « Immobilier »** : parce qu'il aurait fallu y loger recherche, favoris, demandes et publication derrière un seul bouton — c'est précisément l'onglet *Profil* fourre-tout du hub Flutter, reconstitué.

**Pourquoi pas un écran d'accueil à chaque ouverture** : un geste de plus, à chaque fois, pour un voyageur qui a déjà choisi la veille. Le souvenir du dernier univers rend le choix initial gratuit.

---

## 4. Organisation du code (Expo Router)

```
src/app/
├── _layout.tsx                 fournisseurs, pile de navigation
├── index.tsx                   aiguillage : dernier univers mémorisé, sinon le choix
├── choisir-univers.tsx         premier lancement : deux cartes
│
├── (voyager)/                  ← tout le transport actuel, déplacé tel quel
│   ├── (tabs)/                 Réservation · Billets · Contrôle · Compte
│   ├── recherche.tsx, reserver/[uuid].tsx, commande/[uuid].tsx,
│   ├── modifier-date/, noter/, reservation-consultation.tsx, villes-desservies.tsx
│
├── (loger)/                    ← l'immobilier, à construire
│   ├── (tabs)/                 Recherche · Favoris · Demandes · Compte
│   ├── bien/[uuid].tsx         fiche d'un bien
│   ├── contacter/[uuid].tsx, visite/[uuid].tsx
│   ├── declarer-besoin.tsx
│   ├── publier/                assistant : profil, infos, photos, validation
│   ├── mes-annonces.tsx, mes-annonces/[uuid].tsx
│
├── compte.tsx                  partagé (aujourd'hui (tabs)/profil.tsx)
├── notifications.tsx, parametres.tsx, preferences-notification.tsx
├── connexion.tsx, inscription.tsx, verify.tsx, mot-de-passe-oublie.tsx, completer-profil.tsx
└── paiement/                   partagé : [reference], retour, retour/[reference]
```

**Mise en œuvre retenue au lot I0 (7 novembre 2026)** : une seule barre
d'onglets, dont la composition dépend de l'univers courant, plutôt que deux
groupes `(voyager)` et `(loger)`. Deux groupes auraient donné deux écrans
`index` à la même adresse `/`, et *Compte*, pourtant le même écran, aurait dû
exister deux fois. Avec une barre unique, les onglets de l'autre univers sont
simplement retirés de la barre (`href: null`) et restent joignables : une
notification de voyage ouvre toujours ses billets, et ouvrir un écran de
l'autre univers y bascule la barre, puisque l'application retient le dernier
univers *utilisé*. L'état vit dans `src/univers.ts` (SecureStore, clé
`synergia.univers`) ; l'aiguillage est le `index.tsx` racine ; le choix du
premier lancement est `choisir-univers.tsx`. Les écrans immobiliers à venir
gardent des noms qui leur sont propres (`biens`, `bien/[uuid]`…) et les
adresses du transport ne changent pas.

Trois précautions techniques :

- **Les groupes `(voyager)` et `(loger)` n'apparaissent pas dans les adresses.** Deux écrans du même nom dans deux groupes auraient la même adresse : les écrans immobiliers portent donc des noms qui leur sont propres (`bien/[uuid]`, pas `offre/[uuid]`). Les adresses du transport **ne changent pas** — `/paiement/retour` reste reconnu par les liens d'application Android.
- **Les routes typées d'Expo** rendent le déplacement sûr : chaque `router.push` vers une adresse déplacée devient une erreur de compilation, corrigée avant d'exécuter quoi que ce soit.
- **L'univers courant** vit dans un petit état partagé (`src/univers.ts`), persisté dans le stockage local — ce n'est pas une donnée personnelle, elle peut rester sur l'appareil — et lu par `index.tsx`, le sélecteur et la cloche.

Côté paquets partagés, rien à créer : `@sira/core/immo.ts` et `@sira/api-client/immo.ts` servent déjà le site. Les éléments d'interface (`ui/`) sont communs ; l'immobilier y ajoutera ce qui lui manque (carrousel de photos, badge *Vente / Location*, carte).

---

## 5. Identité : une application, SYNERGIA

| | |
|---|---|
| Nom affiché | **SYNERGIA** (et non « SYNERGIA Trans », renommage du 7 novembre à défaire) |
| Icône et écran de lancement | **l'emblème de marque** — les bâtiments et le toit, celui du site. C'est aussi le dessin du logo immobilier : c'est la marque qui l'a voulu ainsi, l'emblème mère étant né de l'immobilier. Le bus identifie l'univers Voyager **à l'intérieur** de l'application, pas l'application elle-même |
| En-tête de connexion | le logotype SYNERGIA générique (blanc sur vert), sans mention d'univers |
| Squelettes de chargement | l'emblème de l'univers : le bus pour une recherche de voyage, les bâtiments pour une recherche de bien |
| Court nom Expo, schéma de liens | `synergia`, `synergia://` — un seul projet, plus de collision à craindre |
| Paquet Android, identifiant iOS | inchangés (`com.billetterie.gn`, `com.sira.guinee.app`) ; à décider avant la première publication, voir le README de l'application |

---

## 6. Lots de construction

| Lot | Contenu | Serveur | Ordre de grandeur |
|---|---|---|---|
| **I0 — Socle** ✅ livré le 7 nov. | barre d'onglets par univers (voir § 4), écran de choix, souvenir de l'univers, sélecteur dans l'en-tête des deux accueils, *Compte* commun avec l'entrée *Univers*, accueil Me loger avec le formulaire de recherche (résultats au lot I1), préférences en deux sections *Voyages* / *Logement* (les réglages SMS d'`immobilierservice`, exposés dans `@sira/api-client`) | non | fait en ½ j |
| **I1 — Chercher et voir** ✅ livré le 8 nov. | recherche publique (louer / acheter, ville, type, budget), résultats paginés avec filtres (type, budget, chambres, commodités) et tri, **fiche du bien** (photos, commodités, conditions de location, qui publie), favoris. Voir les réserves ci-dessous | non | fait en 1 j |
| **I2 — Entrer en relation** ✅ livré le 8 nov. | depuis la fiche : contacter, demander une visite, signaler ; onglet *Demandes* (visites, contacts, besoins, annulations) ; *Déclarer un besoin*, diffusé aux agences de la zone | **oui**, léger : les listes « mes contacts » et « mes visites » nomment désormais le bien (même vue que les leads du back-office) | fait en ½ j |
| **I3 — Publier** ✅ livré le 9 nov. | profil de publieur, assistant en quatre étapes avec brouillon enregistré sur le serveur à chaque pas, photos depuis la galerie ou l'appareil (`expo-image-picker`, douze au plus, couverture), *Mes annonces* avec les gestes propres à chaque état. Voir les réserves ci-dessous | non | fait en ½ j |
| **I4 — Notifications** ✅ livré le 9 nov. | le service billetterie consomme les événements du logement et en fait des notifications in-app et poussées pour l'utilisateur visé (visite confirmée, demande de visite et contact pour le back-office, annonce validée, refusée ou bientôt expirée) ; chaque notification porte l'emblème de son univers et ouvre l'écran utile ; page publique `/biens/{uuid}` sur le site, cible des courriels, des SMS et des liens d'application Android. Préférences *Logement* livrées au lot I0 | **oui**, léger : `destinataireUserId` dans les événements, un consommateur Kafka côté billetterie | fait en ½ j |
| **I5 — Agences** *(optionnel)* | demandes clients et inscription d'agence sur mobile — ou renvoi au site, qui les a déjà | non | 2–3 j |

Chaque lot se livre sur test, avec `tsc`, l'empaquetage Metro, l'essai sur le Samsung, et des tests e2e du site pour ce qui le touche.

**Réserves du lot I1**, à lever plus tard :

- **La carte n'est pas dessinée.** La fiche donne l'adresse et un bouton qui ouvre le point dans l'application de cartes du téléphone. Une vraie carte demanderait un module natif (`react-native-maps`) et une clé ; cela viendra avec les photos prises depuis l'appareil, au lot I3.
- **Le filtre par ville ne trouve rien pour l'instant.** Le serveur relie un bien à une ville par sa *localisation*, qui exige un quartier ; or les communes de Conakry n'ont aucun quartier au référentiel. Le filtre fonctionne, il n'a rien à trouver. À décider : créer les quartiers de Conakry.
- **Pas de photos** sur les biens de démonstration : l'envoi de photos est un chantier du lot I3.
- **Contacter et demander une visite** sont le lot I2 ; la fiche se contente de dire qui publie.

**Données de démonstration.** Quatre biens ont été publiés sur l'environnement de test pour vérifier ces écrans : appartement à Kipé, villa à Nongo, terrain à Kagbelen, bureau à Kaloum. Ils appartiennent au compte de gestion ; le serveur refusant qu'on mette sa propre annonce en favori, le cœur répond par un message sur ces quatre-là. `DELETE /immo/proprietes/{uuid}` les retire.

**Réserves du lot I4.** Les notifications poussées du logement ne sont pas
filtrables par l'utilisateur : les réglages *Logement* portent sur les SMS du
service immobilier, et le service billetterie n'y a pas accès. Un contact
reçu prévient le back-office, pas le publieur : c'est la règle actuelle du
service immobilier (intermédiation), reprise telle quelle. Les liens
universels iOS ne sont pas configurés, comme pour le retour de paiement.

**Réserves du lot I3.** L'adresse est saisie en texte, sans position GPS ni
carte : les nouvelles annonces n'ont donc pas de bouton « Ouvrir dans les
cartes » tant qu'un choix sur la carte n'existe pas. La date de disponibilité
n'est pas demandée. Le profil « agent d'agence » ne se crée pas ici : il naît
de l'invitation d'une agence, lot I5. **Les constructions de développement
doivent être refaites** (`npx expo run:android`, `npx expo run:ios`) pour que
le sélecteur de photos, module natif, soit présent ; Expo Go l'a déjà.

**Leçon de contrat.** Les modèles partagés de l'immobilier n'avaient jamais été confrontés au serveur, le site n'ayant pas de recherche publique : les noms des critères (`villeUuid`, `typeBienCodes`, `chambresMin`, `commoditesCodes`, `trier`), la clé de la liste des types de bien (`types`) et les valeurs de tri (`DATE_DESC`, et non `RECENT`) étaient tous faux. Ils sont corrigés et vérifiés appel par appel contre test.

---

## 7. Fait sans attendre : l'identité

Le renommage en « SYNERGIA Trans » reposait sur une prémisse fausse ; il est
défait dans le même mouvement que cette proposition : nom `SYNERGIA`, court nom
`synergia`, schéma `synergia://`, icône et lancement sur l'emblème de marque,
logotype générique à la connexion, bus réservé au squelette de la recherche de
voyage.

---

## 8. À trancher avant le lot I0

1. **Le premier écran** : le choix à deux cartes au premier lancement, puis souvenir (recommandé) — ou toujours *Voyager* en premier, avec le sélecteur pour aller au logement ?
2. **Une seule palette** (recommandé), ou un accent or plus marqué pour l'immobilier ?
3. **Les agences sur mobile** (lot I5) ou sur le site seulement ?
4. **Les libellés** : *Voyager / Me loger* (verbes, recommandé) — ou *Transport / Immobilier* ?

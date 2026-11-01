# Proposition d'implémentation — processus de réservation « à la FlixBus » pour SYNERGIA

Source : `docs/Processus de reservation completer a implementer avec synergia.docx` (26 captures de l'application de référence + consignes).
Périmètre : mobile Expo d'abord, web React en parité, backend `billetterieservice`. Tout se livre sur **test** ; la production reste figée jusqu'au signal.

---

## 1. Ce que décrit le document, écran par écran

| # | Écran de référence | Consigne du document |
|---|---|---|
| 1 | Accueil : De / Vers, Aller / Retour, « Passagers/Vélos », Rechercher ; onglets **Réservation · Billets · Mon compte** | Première page **sans connexion** ; recherche accessible sans s'authentifier |
| 2–3 | Feuille « Passagers/Vélos » : compteurs Adulte / Enfant / Vélo | Remplacer Vélo par **Bagage** ; choisir le nombre d'adultes et d'enfants |
| 4 | Écran de chargement : squelette gris + logo au centre | Prévoir le **logo SYNERGIA** |
| 5–6 | Résultats : bandeau de **dates** (J-1 · J · J+1), « N résultats », cartes *heure départ · durée · heure arrivée (+1 jour) · gares · pastille « Bus Direct » · prix par personne · ›*, étiquettes **LE MOINS CHER / LE PLUS RAPIDE**, « Pas d'emplacement vélo — Chercher sans l'option vélo » | Voir les autres offres du même trajet via les dates ; catégories *moins cher et plus rapide, plus cher, moins cher, sans bagage* ; **minibus et 4x4** doivent aussi apparaître |
| 8 | Filtres : tri (places vélo, départ le plus tôt, prix le plus bas, durée la moins longue), curseurs heure de départ / d'arrivée, « Afficher les voyages (18) » | — |
| 7 | Détail d'un trajet (feuille basse) : durée, direct, chronologie des arrêts, Wi-Fi/prises, « Arrivée le … », « Exploitée par … », **Continuer** | Accessible via la flèche › |
| 9, 14, 15 | Plan de sièges : volant, rangées numérotées, toilettes, escalier, sièges indisponibles ✕, catégories payantes (Classique / Devant / Panorama), compteur « 2 sièges réservés +7,98 € », **Ignorer la sélection** | Ignorer = quitter l'écran, la réservation continue ; le plan s'adapte au **type de véhicule (bus, minibus, 4x4) et au nombre de places** |
| 10, 11, 16, 17 | Tunnel en 4 étapes avec **compte à rebours** : ① Passagers (adulte : prénom, nom ; enfant : + date de naissance, erreur « Âge maximum : 15 ans ») ② Réservation de siège ③ Options (bagages inclus, bagage supplémentaire, bagage spécial) ④ Contact (e-mail, téléphone) | Adultes/enfants choisis en amont sont repris ; règle d'âge à 15 ans |
| 12, 13 | Moyen de paiement, bon d'achat, **Votre commande** (lignes : 1 adulte 1 enfant, emplacement vélo, frais de service, Total TTC), **Payer maintenant** | — |
| 18 | « Attente de la confirmation de paiement » (jusqu'à 5 min, ne pas fermer) | — |
| 19 | Onglet **Billets** vide : « S'identifier ou s'inscrire », bouton **Rechercher une réservation** | — |
| 20–21 | Création de compte : e-mail seul → Continuer ; « Connectez-vous ici » | — |
| 22 | Rechercher une réservation : numéro de réservation + e-mail ou téléphone | — |
| 23–24 | **Mon compte** : carte « Votre compte » + S'identifier ; Général (Notifications, Paramètres, Préférences de notification) ; Services (Besoin d'aide ?, Arrêts) ; Mentions légales ; version | — |
| 25 | Paramètres : monnaie, langue, confidentialité, supprimer les données locales, effacer le mode de paiement | — |
| 26 | Préférences de notification : *Mises à jour du trajet* et *Remises et promos* (interrupteurs) | — |

---

## 2. État des lieux : ce que SYNERGIA sait déjà faire

| Besoin | Existant | Verdict |
|---|---|---|
| Recherche sans compte | `GET /billetterie/offres/recherche` et `/villes/active` sont **déjà publics** (passerelle + service). Le **web** cherche sans session. Le **mobile** force la connexion dès l'ouverture (`index.tsx` → `/connexion`, `(tabs)/_layout` redirige) | Mobile à restructurer, **zéro backend** |
| Données d'une carte résultat | L'offre porte `heureDepart`, `heureArriveeEstimee`, `trajetDureeMinutes`, `siteDepart/siteArrivee`, `typeVehiculeLibelle`, `vehiculeClimatise`, `nombrePlacesDisponibles`, `montant/montantPromotion`, `userFullName` (transporteur) | Suffit pour cartes, étiquettes, tri, filtres et détail : **client seulement** |
| Types de véhicules | Table `types_vehicules` (Bus, Minibus, Taxi-brousse… libellé libre) | Ajouter le mot-clé de **gabarit** (voir §4) |
| Adulte / enfant | Rien : `PassagerDto` = nom, prénom, téléphone, pièce ; un seul prix par offre | **Backend** |
| Bagages | `trajets.montant_bagages` existe, jamais utilisé par les commandes | **Backend** léger |
| Sièges | `billets.numero_siege` existe, **jamais écrit** (`INSERT_BILLET` ne le renseigne pas) ; aucun plan | **Backend** |
| Frais | Le serveur ajoute **5 000 GNF de frais de service codés en dur** + frais du mode (`frais_pourcentage`, `frais_fixe`) et **ignore** le `montantTotal` envoyé par le client. Les deux clients affichent pourtant `prix × passagers` | Défaut à corriger : le récapitulatif doit venir d'un **devis serveur** |
| Paiement en ligne et attente | Chaîne ChapChap complète ; `/paiement/[reference]` interroge l'état toutes les 3 s ; purge à 30 min | Réutiliser ; ajouter le **compte à rebours** |
| Compte, Google, activation, mot de passe oublié | Écrans mobiles faits | Réutiliser, changer les points d'entrée |
| Notifications in-app + push | Faits ; la table `notifications` a déjà `categorie` (RESERVATION, PAIEMENT, DEPART, PROMOTION) | Préférences à ajouter (**backend** léger, modèle de `immo_preferences_notification`) |
| Recherche d'une réservation sans compte | Rien ; `commandes.user_id NOT NULL`, `/paiements/{ref}/etat` réservé au propriétaire | **Backend** + décision |

---

## 3. Décisions de conception (recommandations)

1. **Compte requis au moment de payer, pas avant.** Tout le parcours (accueil, recherche, filtres, détail, choix des sièges) se fait sans session. La connexion n'est demandée qu'au **Continuer** du tunnel, avec retour automatique à l'étape en cours. Raison : la commande, l'état du paiement, l'annulation, le changement de date, la notation et les billets sont tous rattachés à un utilisateur ; une commande « invitée » demanderait de refaire toute cette chaîne. L'onglet Billets propose « S'identifier ou s'inscrire » exactement comme la référence.
2. **Règle d'âge, configurable** : `billetterie.age-adulte-minimum: 15`. Un **enfant a moins de 15 ans révolus à la date du voyage** ; à 15 ans et plus c'est un adulte (c'est ce que montre l'erreur « Âge maximum : 15 ans » de la référence et le « minimum 15 ans » du document). La date de naissance n'est demandée que pour les enfants. Une commande contient **au moins un adulte**. Le serveur recalcule l'âge ; le client ne fait que prévenir tôt.
3. **Tarif enfant** : `montant_enfant` sur l'offre, par défaut hérité du trajet, et à défaut plein tarif. Le transporteur fixe donc son tarif enfant une fois par liaison et peut le surcharger sur une offre. Pas de tarif « bébé » tant qu'il n'est pas demandé.
4. **Bagages, simple et guinéen** : l'offre déclare `bagages_inclus_par_passager` (défaut 1), `montant_bagage_supplementaire` (défaut `trajets.montant_bagages`) et `bagages_autorises` (false ⇒ étiquette **« Sans bagage »** et message « Pas de place bagage — Chercher sans bagage » quand la recherche en demande). Pas de gestion de capacité de soute dans un premier temps. Le compteur « Bagage » de l'accueil = bagages **supplémentaires** souhaités ; il préremplit l'étape Options.
5. **Plan de sièges généré par le serveur** à partir du type de véhicule et de `nombre_places`, surchargeable par un plan JSON sur le véhicule. Trois gabarits : **BUS** (2+2, allée centrale, toilettes/escalier optionnels), **MINIBUS** (2+1), **VOITURE** (4x4 / taxi-brousse : 1 à l'avant + rangées de 3). Une seule implémentation du générateur, côté serveur, exposée par l'API ; les clients ne font que dessiner. Sièges payants (Devant / Panorama) : **non**, pas dans ce lot — le JSON prévoit un champ `supplement` pour plus tard.
6. **Ignorer la sélection = attribution automatique** des plus petits numéros libres, en bloc contigu si possible, au moment de la commande. Le billet porte toujours un siège ; le contrôleur le voit.
7. **Le prix est un devis serveur.** Nouvel appel `POST /billetterie/commandes/devis` : il renvoie les lignes (adultes, enfants, bagages, frais de service, frais du mode) et le total ; le récapitulatif affiche ces lignes ; `POST /commandes` recalcule et **refuse** si le total diffère de celui que le client a vu (évite de payer un montant jamais affiché). Les 5 000 GNF deviennent `billetterie.frais-service` (fixe ou pourcentage, 0 possible).
8. **Aller-retour : pas dans ce chantier.** Le modèle est une commande = une offre et le paiement est une transaction par commande. Le champ « Retour » n'apparaît pas tant qu'on ne sait pas regrouper deux commandes sous un paiement. Après confirmation d'un aller, l'écran proposera « Réserver le retour » qui relance une recherche inversée.
9. **Rechercher une réservation** (numéro + e-mail/téléphone) : endpoint public à **débit limité**, qui ne répond que si le contact fourni est celui du compte propriétaire ; retourne statut, trajet et billets. Utile pour un voyageur sur un autre téléphone ou sans session. Lot tardif.
10. **Compte à rebours** : le serveur expose `expireLe` sur la commande (`date_reservation + délai d'expiration`) ; le tunnel et l'écran de paiement l'affichent. Il reflète la purge réelle, pas un minuteur local.

---

## 4. Modèle de données (migrations)

**V43 — tarification passagers et bagages**
```sql
ALTER TABLE trajets  ADD COLUMN montant_enfant DECIMAL(15,2);
ALTER TABLE offres   ADD COLUMN montant_enfant DECIMAL(15,2),
                     ADD COLUMN bagages_autorises BOOLEAN NOT NULL DEFAULT TRUE,
                     ADD COLUMN bagages_inclus_par_passager INTEGER NOT NULL DEFAULT 1,
                     ADD COLUMN montant_bagage_supplementaire DECIMAL(15,2);
ALTER TABLE billets  ADD COLUMN type_passager VARCHAR(10) NOT NULL DEFAULT 'ADULTE',   -- ADULTE | ENFANT
                     ADD COLUMN date_naissance DATE,
                     ADD COLUMN montant DECIMAL(15,2);                                  -- prix de ce billet
ALTER TABLE commandes ADD COLUMN nombre_adultes INTEGER NOT NULL DEFAULT 1,
                      ADD COLUMN nombre_enfants INTEGER NOT NULL DEFAULT 0,
                      ADD COLUMN nombre_bagages INTEGER NOT NULL DEFAULT 0,
                      ADD COLUMN montant_bagages DECIMAL(15,2) NOT NULL DEFAULT 0,
                      ADD COLUMN contact_email VARCHAR(150),
                      ADD COLUMN contact_telephone VARCHAR(20);
```
`montant_frais` existant = frais de service ; `montant_paye` garde le total après frais du mode.

**V44 — sièges**
```sql
ALTER TABLE types_vehicules ADD COLUMN gabarit VARCHAR(10) NOT NULL DEFAULT 'BUS';   -- BUS | MINIBUS | VOITURE
UPDATE types_vehicules SET gabarit = 'MINIBUS' WHERE libelle ILIKE 'minibus%';
UPDATE types_vehicules SET gabarit = 'VOITURE' WHERE libelle ILIKE 'taxi%' OR libelle ILIKE '%4x4%';
ALTER TABLE vehicules ADD COLUMN plan_sieges JSONB;            -- null ⇒ généré depuis gabarit + nombre_places
ALTER TABLE billets   ADD COLUMN offre_id BIGINT REFERENCES offres(offre_id);
UPDATE billets b SET offre_id = c.offre_id FROM commandes c WHERE c.commande_id = b.commande_id;
ALTER TABLE billets ALTER COLUMN offre_id SET NOT NULL;
CREATE UNIQUE INDEX uq_billets_siege_par_offre ON billets (offre_id, numero_siege)
    WHERE numero_siege IS NOT NULL AND statut <> 'ANNULE';
```
L'index unique partiel est le verrou : deux clients qui choisissent le même siège au même instant, le second reçoit « siège 12 déjà pris, choisissez-en un autre » et rien n'est créé (l'insertion est dans la transaction de la commande). Une commande annulée ou purgée libère ses sièges parce que ses billets passent `ANNULE` — à vérifier dans `expirerCommande`/`annuler`, sinon l'ajouter.

Format `plan_sieges` (le même en sortie d'API) :
```json
{ "gabarit": "BUS", "colonnes": ["A","B",null,"C","D"],
  "rangees": [ { "numero": 1, "sieges": ["1","2",null,"3","4"] },
               { "numero": 7, "sieges": ["25","26",null,{"equipement":"TOILETTES"},null] } ],
  "indisponibles": ["5"] }
```

**V45 — préférences de notification**
```sql
CREATE TABLE preferences_notification (
    user_id            BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    mises_a_jour_trajet BOOLEAN NOT NULL DEFAULT TRUE,   -- RESERVATION, PAIEMENT, DEPART
    promotions          BOOLEAN NOT NULL DEFAULT TRUE,   -- PROMOTION
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
```
Absence de ligne = tout activé. Le service de notification consulte la ligne avant d'envoyer un push de la catégorie concernée (l'in-app reste écrit, il est consultable).

---

## 5. API

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/billetterie/offres/recherche` | inchangé ; les résultats embarquent les nouveaux champs (`montantEnfant`, `bagagesAutorises`, `montantBagageSupplementaire`, `gabaritVehicule`) |
| GET | `/billetterie/offres/{uuid}/sieges` **public** | `{ plan, occupes: ["1","2"], restants: 31 }` — plan généré ou lu, sièges pris calculés depuis `billets` |
| POST | `/billetterie/commandes/devis` **public** | entrée : `offreUuid, nombreAdultes, nombreEnfants, nombreBagages, modeReglementCode?` ; sortie : lignes + total + `fraisMode` |
| POST | `/billetterie/commandes` | `PassagerDto` gagne `typePassager`, `dateNaissance`, `numeroSiege?` ; la requête porte `nombreBagages`, `contactEmail`, `contactTelephone`, `montantTotal` (= devis vu) ; le téléphone passager devient optionnel pour les enfants ; auto-attribution des sièges manquants |
| GET | `/billetterie/commandes/consultation?numero=&contact=` **public, débit limité** | lecture d'une réservation sans session (lot 5) |
| GET/PUT | `/billetterie/notifications/preferences` | préférences (lot 5) |
| — | commande lue | nouveaux champs `expireLe`, `nombreAdultes`, `nombreEnfants`, `nombreBagages`, lignes de montants ; billet : `typePassager`, `numeroSiege` enfin renseigné |

Le mapping `montantTotal` des clients : aujourd'hui ignoré par le serveur ; après le devis il devient une **vérification**.

---

## 6. Mobile Expo — écrans et routes

Structure cible des onglets : **Réservation · Billets · Mon compte** (+ Contrôle, caché sauf rôles), visibles **sans session**. `index.tsx` ne redirige plus vers la connexion ; `(tabs)/_layout` n'exige plus `user`. Un composant `ExigerSession` enveloppe les seules routes qui en ont besoin (`reserver/*`, `commande/*`, `modifier-date/*`, `noter/*`, `notifications`, scanner) et mémorise la destination pour y revenir après connexion.

| Écran | Route | Contenu |
|---|---|---|
| Accueil | `(tabs)/index` | Bandeau illustré avec logo ; De / Vers (sélecteur existant) ; Aller (bandeau 7 jours existant → calendrier 60 jours) ; **Passagers/Bagages** (feuille basse : Adulte ≥1, Enfant, Bagage) ; Rechercher. La dernière recherche est mémorisée localement |
| Chargement | — | Squelette gris des cartes + logo SYNERGIA centré, 400 ms minimum pour ne pas clignoter |
| Résultats | `recherche` | Bandeau de dates (J-1 · J · J+1, défilant), « N résultats », bouton **Filtres**, cartes : `06:40 — 5h55 — 12:35 (+1 jour)`, gares, pastille **Bus / Minibus / 4x4** (gabarit), prix **par personne** (tarif adulte), étiquettes **LE MOINS CHER**, **LE PLUS RAPIDE**, **SANS BAGAGE**, mention « Pas de place bagage — Chercher sans bagage » si la recherche demandait des bagages et `bagagesAutorises=false`. Les jours voisins sont préchargés |
| Filtres | `filtres` (modale) | Tri : départ le plus tôt · prix le plus bas · durée la moins longue · bagages acceptés ; curseurs heure de départ et d'arrivée ; type de véhicule ; « Afficher les voyages (N) ». Tout se calcule **sur le client** |
| Détail | feuille basse sur `recherche` | `Durée 5h55, Direct`, chronologie départ → arrivée avec gares, climatisation, « Arrivée le … », « Exploité par {transporteur} », conditions d'annulation, **Continuer** |
| Sièges | `sieges/[uuid]` | Plan dessiné depuis l'API (volant, rangées, allée, équipements, ✕ indisponibles) ; nombre de sièges à choisir = adultes + enfants ; compteur « 2 sièges choisis » ; **Confirmer** ou **Ignorer la sélection** |
| Tunnel | `reserver/[uuid]` | En-tête trajet + **compte à rebours** ; ① Passagers (adulte : prénom, nom ; enfant : + date de naissance avec contrôle d'âge) ② Sièges (résumé + lien vers le plan) ③ Options (inclus / bagages supplémentaires ± avec prix) ④ Contact (préremplis depuis le compte, modifiables) ; mode de règlement ; **Votre commande** (lignes du devis) ; **Payer maintenant** / **Confirmer** |
| Attente | `paiement/[reference]` | Existant, enrichi : fenêtre « Attente de la confirmation de paiement — jusqu'à 5 minutes, ne fermez pas » + compte à rebours |
| Billets | `(tabs)/billets` | Sans session : illustration, « Vous n'avez pas encore de billets », **S'identifier ou s'inscrire**, **Rechercher une réservation**. Avec session : « Mes voyages » actuel |
| Rechercher une réservation | `reservation-consultation` | Numéro + e-mail/téléphone → fiche et billets QR (lot 5) |
| Mon compte | `(tabs)/compte` | Carte « Votre compte » (ou identité) ; Général : Notifications, Paramètres, Préférences de notification ; Services : Besoin d'aide ? (téléphone/WhatsApp), Arrêts (gares par ville, données publiques) ; Mentions légales (pages web ouvertes dans le navigateur intégré) ; version (`expo-constants`) ; Déconnexion |
| Paramètres | `parametres` | Monnaie **GNF** (information), Langue **Français** (information, préparation i18n), Confidentialité, **Supprimer les données stockées localement** (trousseau + cache + dernière recherche), **Effacer le mode de paiement mémorisé** |
| Préférences | `preferences-notification` | Deux interrupteurs, enregistrés via l'API, explication sous chacun |

Le logo : `apps/mobile/assets/splash-icon.png` existe ; un `logo-synergia.png` dédié (fond transparent) est à fournir ou à extraire de `apps/web/public/brand`.

---

## 7. Web React — parité

Même tunnel, mêmes règles, mêmes données : `HomePage` reçoit le sélecteur Passagers/Bagages et le bandeau de dates ; la page de résultats gagne filtres, étiquettes et détail ; `ReservationPage` devient le tunnel en 4 étapes avec plan de sièges (SVG) et récapitulatif du devis ; `MesVoyagesPage` affiche adultes/enfants/bagages et le siège de chaque billet ; l'admin (Trajets, Offres, Types de véhicules, Véhicules) reçoit les champs tarif enfant, bagages, gabarit et plan. La logique partagée va dans `@sira/core` (`tarification.ts` : types de devis, `estEnfant(dateNaissance, dateVoyage, ageAdulte)` ; `recherche.ts` : tri, filtres, étiquettes, `heureArrivee(+1 jour)` ; `sieges.ts` : types du plan et validation du choix) et les appels dans `@sira/api-client`. Les tests e2e Playwright suivent chaque lot.

---

## 8. Lots, dans l'ordre de livraison (test uniquement)

| Lot | Contenu | Backend | Ordre de grandeur |
|---|---|---|---|
| **0 — Mobile sans session** | onglets Réservation/Billets/Mon compte visibles sans compte, `ExigerSession`, retour après connexion, écran Billets vide, squelette + logo | non | 1–2 j |
| **1 — Recherche enrichie** | feuille Passagers/Bagages, bandeau de dates, cartes complètes, étiquettes, filtres, détail en feuille basse, Continuer | non | 3–4 j |
| **2 — Devis serveur, enfants, bagages** | V43, `POST /devis`, création recalculée, tunnel ① ③ ④, récapitulatif, règle d'âge, compte à rebours, admin web des tarifs | oui | 4–5 j |
| **3 — Sièges** | V44, générateur des trois gabarits, `GET /sieges`, écran plan, étape ②, auto-attribution, siège sur les billets et au scanner | oui | 4–5 j |
| **4 — Web en parité + e2e** | tunnel web, plan SVG, admin, tests | non | 3–4 j |
| **5 — Compte et services** | V45, préférences, Mon compte, Paramètres, Arrêts, aide, mentions légales, consultation d'une réservation | oui | 3 j |
| **6 — Plus tard, sur décision** | sièges payants (Devant/Panorama), capacité de soute, aller-retour sous un seul paiement, commande invitée, bon d'achat, langues | oui | — |

Chaque lot se termine par : build TypeScript (`tsc -b` des paquets), essai sur le Samsung et l'iPhone simulé, commit, déploiement test automatique.

---

## 9. Points à trancher avant de commencer

1. Compte requis au paiement (recommandé) ou commande invitée dès maintenant ?
2. Règle d'âge : enfant = **moins de 15 ans** (recommandé) — confirmer, et confirmer qu'un enfant ne voyage jamais seul.
3. Frais de service : garder **5 000 GNF fixes**, passer à un pourcentage, ou 0 sur test ? Ils apparaîtront désormais noir sur blanc dans « Votre commande ».
4. Bagages : un seul bagage inclus par passager par défaut ? prix du bagage supplémentaire fixé par liaison (trajet) ?
5. Gabarits de sièges : les trois proposés (BUS 2+2, MINIBUS 2+1, VOITURE 1+3+3) suffisent-ils pour la flotte réelle ? Y a-t-il des bus avec toilettes à représenter ?
6. Logo : fournir le fichier définitif (PNG transparent, ≥ 512 px).

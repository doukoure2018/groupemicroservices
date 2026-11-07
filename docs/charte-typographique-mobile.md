# Charte typographique — application mobile

**Objectif : un texte très lisible, y compris en extérieur et en plein soleil,
sur des téléphones d'entrée de gamme.**

État au 7 novembre 2026. Cette charte s'applique à l'application Expo
(`sira-frontend/apps/mobile`), aux deux univers Voyager et Me loger. Elle est
visible dans la maquette interactive : écran « Charte typographique » pour
les tailles, écran « Passagers et bagages » pour les mots, bouton « Simuler le
plein soleil » en haut de page. Les images ont leur propre charte :
`docs/charte-images-mobile.md`.

---

## 1. Les conditions réelles de lecture

Le voyageur lit son téléphone debout, à la gare routière de Matoto ou sur le
quai de Manquepas, à midi, souvent en marchant, parfois avec des lunettes de
soleil. Le logement se cherche dans la rue, devant l'immeuble. Trois
contraintes en découlent, et toute la charte sert à y répondre.

- **Le plein soleil écrase le contraste.** Même à luminosité maximale, l'écran
  reçoit bien plus de lumière qu'il n'en émet ; un gris moyen sur blanc
  disparaît, un texte fin sur vert se fond dans le fond. Les lunettes
  polarisées assombrissent encore l'écran selon l'orientation.
- **L'écran d'entrée de gamme est pauvre.** 720 × 1600 pixels pour 6,5 pouces,
  soit environ 270 pixels par pouce : les graisses fines bavent, les
  empattements se bouchent, les petits chiffres se confondent. La luminosité de
  pointe est modeste, et souvent réduite encore pour épargner la batterie.
- **La lecture est courte et interrompue.** On cherche une heure, un prix, un
  numéro de siège, un quai. Le texte doit se saisir d'un coup d'œil, pas se
  lire.

---

## 2. Les règles

Les règles sont numérotées parce que le plan d'application (§ 5) et la
vérification (§ 6) y renvoient.

1. **Police du système, aucune police téléchargée.** Roboto sur Android, San
   Francisco sur iPhone. Elles sont optimisées pour l'écran, déjà présentes
   (rien à charger sur un réseau lent), et suivent le réglage de taille du
   système. Aucune police de titre décorative dans l'application : l'identité
   passe par le vert, l'or et les emblèmes, pas par une fonte.
2. **Trois graisses seulement : 400, 600 et 700.** Pas de 800 ni d'extra-gras :
   en grande taille, sur Roboto et San Francisco, le très gras fatigue l'œil
   et bouche les contre-formes sur un écran pauvre. Le gras (700) est réservé
   aux titres, aux chiffres forts et aux boutons ; ce qui doit ressortir dans
   une liste ou un champ est demi-gras (600). Jamais de graisse fine (300 et
   moins), jamais d'italique pour porter une information. Sur fond vert, le
   texte est toujours blanc et au moins demi-gras.
3. **Plancher de taille : 14 sp pour tout texte porteur d'information.**
   Le corps est à 16 sp. Le 12 sp est réservé aux mentions qui accompagnent
   un autre élément (badge à côté d'un titre, libellé sous une icône
   d'onglet) et ne sont jamais seules à dire quelque chose. Rien en dessous de
   12 sp.
4. **Contraste 7:1 au moins pour tout texte** (niveau AAA), sur le fond où il
   est posé. Tolérance à 4,5:1 uniquement pour les chiffres forts d'au moins
   18 sp gras. Les valeurs mesurées et les couleurs retenues sont au § 4. L'or
   `#c9a227` n'est jamais une couleur de texte : il sert de fond de badge
   (texte encre dessus), de filet ou de point de notification.
5. **Interligne généreux, lignes courtes, pas de justification.** Corps 16/22,
   secondaire 14/20, titres 1,2 à 1,25. Sur 360 dp de large, une ligne de
   corps fait naturellement 38 à 42 caractères : on n'allonge pas. Un
   paragraphe de l'application tient en trois lignes ; au-delà, c'est une
   liste ou un second écran.
6. **Les chiffres sont la matière première : tabulaires et gros.** Prix,
   heures, durées, numéros de siège, compte à rebours utilisent
   `fontVariant: ['tabular-nums']` pour s'aligner et ne pas sauter quand ils
   changent. Prix en 20 sp gras, heures en 22 sp gras. Le nombre et son unité
   ne se séparent jamais : espace insécable (` `) entre « 50 000 » et
   « GNF », entre « 2 » et « h ». Les milliers sont séparés par une espace,
   jamais par un point.
7. **Pas de capitales espacées sur du petit texte, casse de phrase partout.**
   Les capitales en petite taille perdent leur silhouette de mot. Les titres
   sont en casse de phrase (« Prochain départ », pas « PROCHAIN DÉPART »). Les
   capitales gardent leurs accents (« À », « É ») : c'est la règle du français
   et cela distingue des mots.
8. **Le texte sur photo ou image est toujours posé sur un voile.** Dégradé
   encre à 60 % sous un texte blanc gras, ou pastille blanche opaque. Jamais de
   blanc nu sur une photo de bien ou de bus.
9. **On ne tronque jamais ce qui sert à décider.** Ville, heure, prix, numéro
   de siège, nom de la gare s'affichent en entier, quitte à passer à la ligne.
   `numberOfLines` ne s'applique qu'aux descriptions et aux libellés
   secondaires, et le texte coupé garde une fin visible (« … »).
10. **Le réglage de taille du système est respecté.** `allowFontScaling`
    reste activé partout. Les titres, les barres d'onglets et les boutons
    reçoivent `maxFontSizeMultiplier={1.6}` pour que la mise en page tienne
    jusqu'au réglage « Très grand » d'Android, qui est courant chez les
    lecteurs qui en ont besoin. Un bouton fait 48 dp de haut au minimum et son
    libellé est un seul verbe (« Rechercher », « Payer », « Continuer »).
11. **Quatre tailles de texte au plus par écran.** L'échelle du § 3 en offre
    dix ; un écran n'en prend que trois ou quatre, et la hiérarchie se voit
    sans effort. Le formulaire de recherche en utilise trois : libellé,
    valeur, bouton.

---

## 3. L'échelle

Tailles en points indépendants de la densité (sp sur Android, pt sur iOS).
Dix rôles suffisent ; un texte qui ne rentre dans aucun rôle est un texte à
reconsidérer.

| Rôle | Taille / interligne | Graisse | Couleur | Emploi | Jeton proposé |
|---|---|---|---|---|---|
| Titre d'écran | 22 / 28 | 700 | encre, ou blanc sur vert | « Où allez-vous ? », « Mes billets », titre d'une feuille | `texte.titre` |
| Titre de section | 17 / 22 | 700 | encre | « Prochain départ », « À Ratoma, cette semaine » | `texte.section` |
| Chiffre fort | 20 / 26, tabulaire | 700 | encre, vert ou or-texte | heures de départ et d'arrivée, total à payer, siège, compte d'une feuille | `texte.chiffre` |
| Prix | 18 / 24, tabulaire | 700 | encre ou vert | prix d'une offre, loyer | `texte.prix` |
| Corps | 16 / 22 | 400 | encre | description, adresse, message | `texte.corps` |
| Corps appuyé | 16 / 22 | 600 | encre | valeur d'un champ, nom de gare, nom du bien, ligne de menu | `texte.appuye` |
| Libellé de champ | 14 / 18 | 600 | encre | « Départ », « Destination », « Date » | `texte.libelle` |
| Secondaire | 14 / 20 | 400 | gris foncé | durée, « par personne », « publié il y a 3 jours » | `texte.secondaire` |
| Mention | 12 / 16 | 600 | selon le fond | badge, libellé d'onglet, compteur de photos | `texte.mention` |
| Bouton | 16 / 20 | 700 | blanc sur vert, vert sur blanc | tous les boutons | `texte.bouton` |

Le bandeau vert utilise : titre d'écran en blanc, sous-titre en secondaire
sur vert (`#edf4ef`, 14 sp, 400), sélecteur d'univers en 14 sp 600.

Les tailles ont été abaissées d'un cran le 7 novembre après relecture de la
maquette : à 24 et en 800, les titres et les chiffres « faisaient mal à
l'œil ». La hiérarchie tient avec 22 / 17 / 16 / 14 et deux graisses, parce
que le corps est à 16 et que les titres sont courts.

---

## 4. Les couleurs de texte, mesurées

Rapports de contraste WCAG calculés sur la palette actuelle (`src/ui/theme.ts`).
Objectif : 7:1 ; tolérance 4,5:1 pour les chiffres forts.

| Texte | Fond | Actuel | Verdict | Retenu | Nouveau rapport |
|---|---|---|---|---|---|
| encre `#1d2721` | blanc / fond `#f7f8f5` | 15,4 / 14,4 | bon | inchangé | — |
| gris `#55635a` | blanc / fond | 6,3 / 5,9 | **insuffisant** au soleil | **`#44504a`** | 8,4 / 7,9 |
| gris | vert pâle `#e6f1ea` | 5,5 | insuffisant | `#44504a` | 7,3 |
| vert `#1b5e3b` | blanc / fond | 7,8 / 7,3 | bon | inchangé | — |
| vert foncé `#14472c` | blanc / vert pâle | 10,7 / 9,2 | bon | inchangé | — |
| blanc | vert `#1b5e3b` | 7,8 | bon | inchangé | — |
| sous-titre sur vert `#d7e6dc` | vert | 6,0 | juste | **`#edf4ef`** | 6,9 |
| or `#c9a227` | blanc ou vert | 2,4 / 3,2 | **interdit en texte** | fond de badge, texte encre dessus | 6,4 |
| or-texte `#8a6d12` | blanc / alerte pâle | 4,9 / 4,5 | insuffisant | **`#6e560d`** | 7,0 / 6,4 |
| alerte `#b7791f` | blanc / alerte pâle | 3,6 / 3,3 | **insuffisant** | **`#7d510f`** (texte) | 6,9 / 6,3 |
| danger `#b3402e` | blanc / danger pâle | 5,7 / 4,9 | juste | **`#a1382a`** | 6,7 / 5,7 |
| blanc | danger `#b3402e` | 5,7 | acceptable pour un bouton gras 16 sp | inchangé | — |

Les fonds pâles (`vertPale`, `alertePale`, `dangerPale`) et la couleur de
bouton ne changent pas : seules les couleurs **de texte** se foncent. Le site
web partage ces variables (`--gris`, `--or-texte`) ; foncer aussi les siennes
est cohérent mais n'est pas requis par cette charte, la lecture au soleil
étant un sujet du mobile.

---

## 5. Ce que cela change dans le code

### Inventaire au 7 novembre

- Aucune police chargée (`expo-font` absent) : la règle 1 est déjà respectée, il s'agit de ne pas y déroger.
- 73 déclarations de `fontSize` dans 23 fichiers. **27 sont sous 14 sp** (1 × 11, 13 × 12, 13 × 13) : à faire remonter vers 12 (mentions) ou 14 (secondaire), au cas par cas.
- `couleurs.gris` est utilisé 27 fois comme couleur de texte : la correction de la règle 4 se fait **en une ligne** dans `theme.ts`.
- `'#d7e6dc'` est écrit en dur deux fois (sous-titre sur vert) : à remplacer par un jeton.
- Aucun `maxFontSizeMultiplier` : au réglage « Très grand », les titres et la barre d'onglets débordent (règle 10).
- Les chiffres ne sont pas tabulaires (règle 6) : le compte à rebours et les heures bougent latéralement.
- Le formulaire de recherche dit « De », « Vers », « Aller », « Passagers / Bagages », et la feuille « Adultes », « Enfants », « Bagages » : à aligner sur le vocabulaire du § 7.
- `formatDateFr` produit « sam. 08 nov. 2026 », avec un zéro initial et l'année systématique : à corriger selon la règle de date du § 7.

### Jetons à ajouter dans `src/ui/theme.ts`

```ts
export const couleurs = {
    // ...inchangé, sauf :
    gris: '#44504a',            // était #55635a — 8,4:1 sur blanc
    orTexte: '#6e560d',         // était #8a6d12 — 7,0:1
    alerte: '#7d510f',          // était #b7791f — 6,9:1 (texte et bordure)
    danger: '#a1382a',          // était #b3402e — 6,7:1
    surVertSecondaire: '#edf4ef' // remplace '#d7e6dc' écrit en dur
} as const;

export const texte = {
    titre:      { fontSize: 22, lineHeight: 28, fontWeight: '700' },
    section:    { fontSize: 17, lineHeight: 22, fontWeight: '700' },
    chiffre:    { fontSize: 20, lineHeight: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
    prix:       { fontSize: 18, lineHeight: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
    corps:      { fontSize: 16, lineHeight: 22, fontWeight: '400' },
    appuye:     { fontSize: 16, lineHeight: 22, fontWeight: '600' },
    libelle:    { fontSize: 14, lineHeight: 18, fontWeight: '600' },
    secondaire: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    mention:    { fontSize: 12, lineHeight: 16, fontWeight: '600' },
    bouton:     { fontSize: 16, lineHeight: 20, fontWeight: '700' }
} as const;

export const zoomMax = 1.6; // maxFontSizeMultiplier des titres, onglets et boutons
```

### Plan d'application (lot T, environ une journée)

| Étape | Contenu | Règles | Durée |
|---|---|---|---|
| T1 | jetons `couleurs` et `texte` dans `theme.ts` ; `styles` de `base.tsx` (`titre`, `sousTitre`, `sectionTitre`, `attenue`, `champLibelle`, `boutonTexte`) exprimés avec `texte.*` | 3, 4, 5 | 1 h |
| T2 | passage des 23 fichiers : chaque `fontSize` littéral devient un rôle ; les 27 tailles sous 14 remontent ; `'#d7e6dc'` remplacé ; les libellés et résumés passent au vocabulaire du § 7 | 3, 7, 9, § 7 | 4 h |
| T3 | `fontVariant: ['tabular-nums']` sur heures, prix, sièges, compte à rebours ; dans `@sira/core/format.ts`, espaces insécables (montants, durées) et règle de date « sam. 8 nov. » | 6, § 7 | 1 h |
| T4 | `maxFontSizeMultiplier={zoomMax}` sur titres, barre d'onglets, boutons ; vérification au réglage « Très grand » | 10 | 1 h |
| T5 | essai sur le Samsung dehors, à midi, luminosité 50 % ; corrections | toutes | 2 h |

Le lot T est indépendant des décisions sur l'application unique : il
s'applique à l'univers Voyager existant et s'imposera de lui-même à Me loger.
Il se livre sur test avec `npx tsc --noEmit`, `npx expo export` et un
`npx expo run:android`.

---

## 6. Vérification

Critères de sortie, à cocher avant de déclarer le lot T livré.

- Aucun texte sous 12 sp ; aucun texte porteur d'information sous 14 sp (règle 3). Contrôle : `grep -rnE "fontSize: ?(1[0-3]|[0-9])\b" src`, chaque occurrence restante justifiée comme mention.
- Aucun texte sous 7:1 sur son fond, hors chiffres forts d'au moins 18 sp gras à 4,5:1 (règle 4). Contrôle : les couleurs de texte viennent toutes de `couleurs.*`, dont les rapports sont au § 4.
- Au réglage système « Très grand » (environ 130 %) : aucune ville, heure ou prix tronqué ; les boutons restent sur une ligne ou passent proprement à la ligne ; la barre d'onglets tient (règles 9 et 10).
- Dehors, à midi, luminosité à 50 %, avec des lunettes de soleil : la recherche, la fiche d'une offre, le plan des sièges et le billet avec son code se lisent sans rapprocher le téléphone.
- Sur un émulateur Android 720 × 1600, densité 280, API 30, 2 Go de mémoire : mêmes écrans, aucune graisse qui bave, aucun chiffre ambigu.
- Dans la maquette, l'état « plein soleil » laisse lisibles tous les textes de l'écran « Charte typographique ».
- Le vocabulaire du § 7 est respecté. Contrôle : `grep -rnE '"(De|Vers|Aller|Passagers / Bagages)"' src` ne renvoie rien ; aucun résumé de la forme « Adulte 4 » ; aucune date de la forme « 08 nov. 2026 » pour l'année en cours.

---

## 7. Les mots

Le vocabulaire est fixé une fois pour toutes les surfaces : le champ, le
titre de la feuille qu'il ouvre, le bouton, la notification et le billet
emploient le même mot. Les mots retenus sont ceux de la gare routière ; ils se
comprennent isolés, sans qu'il faille lire le formulaire comme une phrase.

| Objet | Mot retenu | Écarté, et pourquoi |
|---|---|---|
| Lieu de départ | **Départ** | « De » : ne se comprend qu'en lisant « De Conakry vers Kindia » |
| Lieu d'arrivée | **Destination** | « Vers », « À », « Arrivée » : « Destination » est le mot que l'on crie sur le quai |
| Jour du voyage | **Date** | « Aller » : laisse croire à un retour que nous ne vendons pas |
| Voyageurs et bagages | **Passagers et bagages** | « Passagers / Bagages » : la barre sans espaces se lit comme un seul mot ; « Voyageurs » n'est pas le mot du métier |
| Lignes de la feuille | **Adulte**, **Enfant**, **Bagage**, au singulier | « Adultes », « Enfants » : la ligne nomme la catégorie, le compte dit le nombre |
| Lancer la recherche | **Rechercher** | « Valider », « OK », « Chercher » |

Règles d'écriture :

1. **Le nombre devant, le pluriel accordé.** « 1 adulte, 1 enfant, 2 bagages »,
   « 4 adultes ». Jamais « Adulte 4 », qui est de l'anglais traduit mot à mot.
   Le résumé du champ, la ligne du devis et le billet suivent la même forme.
2. **Les dates se lisent, elles ne se décodent pas.** « sam. 8 nov. », sans zéro
   initial ; l'année seulement si elle n'est pas celle en cours
   (« sam. 2 janv. 2027 ») ; jamais « 31/10/26 ». Les heures restent « 12:00 »,
   en chiffres tabulaires.
3. **Un champ vide garde son libellé** et affiche en valeur ce qu'il attend :
   « Choisir une ville », « Facultatif ». Jamais un seul mot gris au milieu du
   champ, qui ressemble à un bouton.
4. **L'aide se met sous la ligne qu'elle concerne**, en phrase complète avec un
   point, à 14 sp : « De 0 à 14 ans, accompagné d'un adulte. » Pas
   d'astérisque, pas d'infobulle, pas d'aide groupée en bas d'écran.
5. **Le titre de la feuille reprend mot pour mot le libellé du champ** qui
   l'ouvre : le champ « Passagers et bagages » ouvre la feuille « Passagers et
   bagages ».
6. **Une phrase au plus sous un titre d'écran**, et seulement si elle apprend
   quelque chose. « Aucun compte n'est demandé pour chercher. » apprend ;
   « Cherchez un départ et réservez votre place. » répète le formulaire.
7. **Les seuils viennent de la configuration**, jamais recopiés à la main :
   l'âge adulte est celui du tarificateur (15 ans aujourd'hui), la franchise
   de bagages viendra de la décision en attente. Un texte qui cite un seuil se
   construit à partir de la valeur.

---

## 8. Hors de cette charte

- Les images, icônes et écrans de lancement : `docs/charte-images-mobile.md`.
- Le site web : il garde Manrope et ses tailles ; seul le fonçage éventuel de `--gris` et `--or-texte` est à décider.
- Les codes d'identification (numéro de commande, référence de paiement) : leur alphabet sans lettres ambiguës (O/0, I/1) est une règle serveur, à traiter avec la génération des numéros.

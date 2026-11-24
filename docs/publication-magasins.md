# Publication sur les magasins — dossier de préparation

Relevé le 24 novembre 2026. Ce document dit ce qui est prêt, ce qui manque, et
qui peut faire quoi. Les magasins eux-mêmes attendent la validation de tout le
circuit : rien n'est soumis.

Identité de l'application : `com.synergiaguinee.app` des deux côtés, nom affiché
**SYNERGIA**, projet EAS `@doukoure2711/synergia`. Voir
`docs/specifications-mobile.md` pour le détail technique.

---

## 1. Où nous en sommes

| Élément | État |
|---|---|
| Construction Android signée par EAS | ✅ faite, APK du profil `test`, 118 Mo |
| Empreinte de la clé de signature | ✅ relevée, SHA-256 dans `assetlinks.json` |
| SHA-1 au client OAuth Android de Google | ❌ à ajouter, sinon la connexion Google échoue dans l'APK d'EAS |
| Construction iOS | ✅ compile pour le simulateur, Xcode 26.6, sans compte Apple |
| Compte développeur Apple | ❌ à ouvrir, démarche personnelle et payante |
| Compte Google Play Console | ❌ à ouvrir, frais uniques |
| Politique de confidentialité en ligne | ⚠️ page écrite et déployée sur test, trois mentions à compléter |
| Conditions générales d'utilisation | ❌ aucune page |
| Captures d'écran et visuels de fiche | ❌ à produire |
| Compte de démonstration pour les relecteurs | ❌ à créer |

---

## 2. Ce que vous seuls pouvez faire

1. **Ouvrir le compte développeur Apple.** Identité, moyen de paiement et
   adhésion annuelle. Choisir entre une adhésion au nom d'une personne et une
   adhésion au nom de l'entreprise : la seconde demande un identifiant d'entité
   reconnu par Apple et fait apparaître la raison sociale comme éditeur, ce qui
   est préférable pour une plateforme qui encaisse des paiements.
2. **Ouvrir le compte Google Play Console.** Frais d'inscription uniques,
   vérification d'identité, et pour un compte d'entreprise la vérification de
   l'entité.
3. **Compléter trois mentions de la politique de confidentialité** : raison
   sociale, numéro RCCM, adresse du siège. Elles sont marquées « à compléter »
   sur la page. Confirmer aussi les durées de conservation proposées.
4. **Ajouter le SHA-1 de la clé EAS** au client OAuth Android dans la console
   Google Cloud. L'empreinte est dans `docs/specifications-mobile.md`, § 8.

---

## 3. Google Play

**Obligatoire avant la première soumission**

- Adresse publique de la politique de confidentialité. Ce sera
  `https://synergia-guinee.com/confidentialite`, une fois la page déployée en
  production.
- Formulaire **Sécurité des données**. Il doit correspondre, ligne par ligne, au
  tableau de la politique de confidentialité, qui a été établi en relevant le
  code et non d'après un modèle. À déclarer : identité (nom, courriel,
  téléphone), photos envoyées par l'utilisateur, identifiants d'appareil pour
  les notifications, et activité dans l'application pour les réservations.
  À déclarer comme **non collecté** : position géographique, contacts,
  historique de navigation, données de paiement.
- **Classification du contenu** : questionnaire. L'application ne contient ni
  violence, ni contenu sexuel, ni jeu d'argent. Elle permet des échanges entre
  utilisateurs par formulaire de contact, ce qu'il faut déclarer.
- **Public cible** : adultes. Ne pas cocher la catégorie famille, qui impose des
  règles supplémentaires.
- **Déclaration de données financières** : l'application permet de payer un
  billet par un opérateur tiers. Ce sont des services du monde réel, pas des
  biens numériques : l'achat intégré de Google n'est pas requis.

**Visuels attendus**

| Élément | Format |
|---|---|
| Icône de la fiche | 512 × 512, PNG 32 bits |
| Bandeau de présentation | 1024 × 500 |
| Captures téléphone | au moins 2, au plus 8, côté long entre 1080 et 3840 px |
| Captures tablette | seulement si la fiche vise la tablette |

L'icône de l'application existe déjà dans `apps/mobile/assets`. Le bandeau et
les captures restent à produire : les captures doivent montrer les deux univers,
Voyager et Me loger.

**Construction à téléverser** : un AAB du profil `production`, pas l'APK de
test. La commande figure au § 6.

---

## 4. App Store

**Obligatoire avant la première soumission**

- Adresse publique de la politique de confidentialité, la même.
- **Confidentialité de l'app** dans App Store Connect : même contenu que le
  formulaire de Google, dans un autre vocabulaire. Déclarer que les données ne
  servent pas au suivi publicitaire, ce qui est exact, l'application n'embarquant
  aucun mouchard.
- **Conformité à l'exportation** : déclarée dans `app.json` par
  `ios.config.usesNonExemptEncryption = false`. L'application n'utilise que le
  chiffrement standard du système et HTTPS. Cette déclaration supprime la
  question posée à chaque envoi de version.
- **Compte de démonstration pour la relecture.** Apple refuse une application
  dont une partie exige un compte sans fournir de quoi la parcourir. La
  recherche de voyages et de biens se fait sans compte, mais publier une
  annonce, réserver et voir ses billets non. Créer un compte dédié sur la
  production, avec une annonce et une réservation d'exemple, et le donner dans
  les notes de relecture.
- **Notes de relecture** : expliquer que le paiement passe par un opérateur
  guinéen de paiement mobile, que le service vend des billets de transport
  terrestre et met en relation pour des logements, donc des prestations du monde
  réel exemptées de l'achat intégré.

**Visuels attendus** : captures pour au moins un iPhone 6,7 pouces et un
iPhone 6,5 pouces, plus l'iPad si la fiche vise la tablette, ce que
`ios.supportsTablet = true` implique aujourd'hui. Si vous ne voulez pas produire
de captures iPad, passer ce réglage à `false` avant la soumission.

---

## 5. Liens universels iOS et notifications iOS

Les deux attendent le compte Apple.

**Liens universels.** Il faut servir un fichier d'association à la racine du
site, comme `assetlinks.json` le fait pour Android. Contenu à déposer dans
`apps/web/public/.well-known/apple-app-site-association`, sans extension, servi
en `application/json` :

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "VOTRE_TEAM_ID.com.synergiaguinee.app",
        "paths": ["/paiement/retour", "/paiement/retour/*", "/biens/*"]
      }
    ]
  }
}
```

`VOTRE_TEAM_ID` est l'identifiant d'équipe à dix caractères, visible dans le
compte développeur Apple dès son ouverture. Il faut aussi ajouter le domaine
dans `app.json`, sous `ios.associatedDomains`, sous la forme
`applinks:synergia-guinee.com`.

**Notifications poussées.** Générer une clé APNs dans le compte Apple, puis la
déposer sur EAS. Sans elle, les notifications fonctionnent sur Android et pas
sur iPhone.

---

## 6. Les commandes, le jour venu

```bash
cd sira-frontend/apps/mobile

# Android, paquet pour le magasin
npx eas-cli@latest build --platform android --profile production

# iOS, après ouverture du compte Apple : EAS crée le certificat et le profil
npx eas-cli@latest build --platform ios --profile production

# Envoi aux magasins, seulement sur décision explicite
npx eas-cli@latest submit --platform android --latest
npx eas-cli@latest submit --platform ios --latest
```

Le profil `production` incrémente le numéro de version tout seul et vise
`EXPO_PUBLIC_ENV=prod`, donc l'API et les paiements réels. Ne pas le lancer pour
un essai.

---

## 7. Ce qui reste techniquement

- Aligner dix paquets Expo d'un cran de correctif, par `npx expo install --fix`,
  puis reconstruire.
- Écrire une page de conditions générales d'utilisation. Google ne l'exige pas,
  Apple non plus pour une application gratuite, mais une plateforme qui encaisse
  des paiements et héberge des annonces de tiers en a besoin.
- Produire les captures d'écran des deux univers et le bandeau de Google Play.
- Décider du sort de `ios.supportsTablet`, qui engage à fournir des captures
  iPad.

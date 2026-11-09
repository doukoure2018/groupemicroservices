# Liens d'application Android (App Links)

`assetlinks.json` autorise l'application `com.synergiaguinee.app` à ouvrir
elle-même les adresses `https://<domaine>/paiement/retour…`. Sans ce fichier,
Android ouvre le navigateur et le voyageur doit revenir à la main.

Chaque empreinte de la liste correspond à **une clé de signature**. Il en faut
une par variante installée :

| Variante | D'où vient l'empreinte |
|---|---|
| Build de développement local (`npx expo run:android`) | signé par `android/app/debug.keystore`, généré par `expo prebuild` — **pas** `~/.android/debug.keystore`. Lire l'empreinte réelle : `adb shell pm get-app-links com.billetterie.gn` (ligne *Signatures*) |
| APK et production (EAS) | `eas credentials` → Android → *Keystore* → `SHA-256 Fingerprint` |

Les empreintes présentes sont celles des trousseaux de débogage (celui
qu'`expo prebuild` dépose dans `android/app/`, puis celui de la machine).
**Ajoutez celle d'EAS avant de diffuser l'APK**, sinon le lien ne s'ouvrira
pas dans l'application installée.

Vérification, une fois déployé :

    curl https://test.synergia-guinee.com/.well-known/assetlinks.json
    adb shell pm verify-app-links --re-verify com.synergiaguinee.app
    adb shell pm get-app-links com.synergiaguinee.app      # doit afficher « verified »

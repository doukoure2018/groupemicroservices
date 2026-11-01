# Liens d'application Android (App Links)

`assetlinks.json` autorise l'application `com.billetterie.gn` à ouvrir
elle-même les adresses `https://<domaine>/paiement/retour…`. Sans ce fichier,
Android ouvre le navigateur et le voyageur doit revenir à la main.

Chaque empreinte de la liste correspond à **une clé de signature**. Il en faut
une par variante installée :

| Variante | D'où vient l'empreinte |
|---|---|
| Build de développement local | `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android` |
| APK et production (EAS) | `eas credentials` → Android → *Keystore* → `SHA-256 Fingerprint` |

L'empreinte présente est celle du trousseau de débogage de la machine de
développement. **Ajoutez celle d'EAS avant de diffuser l'APK**, sinon le lien
ne s'ouvrira pas dans l'application installée.

Vérification, une fois déployé :

    curl https://test.synergia-guinee.com/.well-known/assetlinks.json
    adb shell pm verify-app-links --re-verify com.billetterie.gn
    adb shell pm get-app-links com.billetterie.gn      # doit afficher « verified »

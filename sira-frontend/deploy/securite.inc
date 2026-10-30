# En-têtes de sécurité.
#
# nginx n'hérite pas des `add_header` d'un niveau supérieur dès qu'un bloc en
# déclare un à lui. Ce fragment doit donc être inclus dans CHAQUE bloc qui
# ajoute un en-tête, sans quoi les en-têtes de sécurité disparaissent
# silencieusement sur les réponses concernées.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(self), camera=(), microphone=()" always;

# Politique de contenu en mode observation. L'application ne charge ni script
# ni police externe ; seule la carte OpenStreetMap est affichée en cadre, et
# les documents authentifiés passent par des URL blob.
# Pour l'appliquer réellement, renommer l'en-tête en Content-Security-Policy
# après avoir vérifié le rapport de la console du navigateur.
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src https://www.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'" always;

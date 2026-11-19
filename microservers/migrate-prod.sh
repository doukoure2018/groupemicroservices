#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# Identifiants et adresse de la base de production : hors du dépôt, lus dans
# .env.prod. Lecture ciblée plutôt que « source » : une valeur contenant un
# espace ferait exécuter la fin de la ligne par le shell.
if [ ! -f .env.prod ]; then
  echo "Fichier .env.prod introuvable. Il doit définir PROD_DB_URL, DB_USERNAME et DB_PASSWORD." >&2
  exit 1
fi
for cle in PROD_DB_URL DB_USERNAME DB_PASSWORD; do
  valeur=$(grep -E "^${cle}=" .env.prod | tail -1 | cut -d= -f2-)
  if [ -z "$valeur" ]; then
    echo "$cle absente de .env.prod : migration refusée." >&2
    exit 1
  fi
  export "$cle=$valeur"
done

echo "Running migrations for PRODUCTION environment..."
echo "Base visée : ${PROD_DB_URL%%\?*}"
read -r -p "Confirmer la migration de PRODUCTION ? (tapez oui) " reponse
[ "$reponse" = "oui" ] || { echo "Annulé."; exit 1; }

mvn -pl database-migrations clean compile flyway:migrate -Pprod
mvn -pl database-migrations flyway:info -Pprod

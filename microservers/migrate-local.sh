#!/bin/bash
cd "$(dirname "$0")"
echo "Running migrations for LOCAL environment..."

# Les identifiants ne sont plus dans le pom : ils viennent du .env de la racine.
# Lecture ciblee des deux seules variables utiles : sourcer le fichier entier
# echouerait sur une valeur contenant des caracteres speciaux.
if [ -f ../.env ]; then
  DB_USERNAME=$(grep -E "^DB_USERNAME=" ../.env | tail -1 | cut -d= -f2-)
  DB_PASSWORD=$(grep -E "^DB_PASSWORD=" ../.env | tail -1 | cut -d= -f2-)
  export DB_USERNAME DB_PASSWORD
fi
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ]; then
  echo "DB_USERNAME et DB_PASSWORD introuvables : renseignez-les dans .env ou exportez-les." >&2
  exit 1
fi

# Compile first to process resources (CRITICAL!)
mvn -pl database-migrations compile

# Then run migrations
mvn -pl database-migrations flyway:migrate -Plocal
mvn -pl database-migrations flyway:info -Plocal
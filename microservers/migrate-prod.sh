#!/bin/bash
cd "$(dirname "$0")"
source .env.prod
echo "Running migrations for PRODUCTION environment..."

# Compile and migrate in one command
mvn -pl database-migrations clean compile flyway:migrate -Pprod
mvn -pl database-migrations flyway:info -Pprod
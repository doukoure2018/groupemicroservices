#!/bin/bash
cd "$(dirname "$0")"
echo "Running migrations for LOCAL environment..."

# Compile first to process resources (CRITICAL!)
mvn -pl database-migrations compile

# Then run migrations
mvn -pl database-migrations flyway:migrate -Plocal
mvn -pl database-migrations flyway:info -Plocal
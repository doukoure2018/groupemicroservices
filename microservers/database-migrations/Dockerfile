# =============================================================================
# SIRA Guinée — Image Flyway dédiée avec SQL embarqués
# =============================================================================
# Permet d'exécuter les migrations sur le VPS via `docker run --rm` SANS
# avoir le code source du repo sur le serveur (juste l'image versionnée).
#
# Build & push :
#   docker build -t doukoure93/billetterie-flyway-migrations:latest \
#                -t doukoure93/billetterie-flyway-migrations:{BUILD_NUMBER} \
#                -f microservers/database-migrations/Dockerfile \
#                microservers/database-migrations
#   docker push doukoure93/billetterie-flyway-migrations:latest
#   docker push doukoure93/billetterie-flyway-migrations:{BUILD_NUMBER}
#
# Usage sur VPS :
#   docker run --rm --network sira-{env}_sira-network \
#     -e FLYWAY_URL=jdbc:postgresql://postgresdb:5433/innodb \
#     -e FLYWAY_USER=... -e FLYWAY_PASSWORD=... \
#     doukoure93/billetterie-flyway-migrations:latest migrate
# =============================================================================

FROM flyway/flyway:11.3.0

# Embarquer les .sql dans l'image (pas de volume mount = pas de code source VPS)
COPY src/main/resources/db/migration /flyway/sql

# Defaults sûrs (overridables via env)
ENV FLYWAY_SCHEMAS=public \
    FLYWAY_TABLE=flyway_schema_history \
    FLYWAY_BASELINE_ON_MIGRATE=true \
    FLYWAY_VALIDATE_ON_MIGRATE=true \
    FLYWAY_OUT_OF_ORDER=false \
    FLYWAY_CLEAN_DISABLED=true \
    FLYWAY_BASELINE_VERSION=1

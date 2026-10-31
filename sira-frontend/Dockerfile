# =============================================================================
# Image de l'application web React (monorepo npm workspaces).
#
# Aucune URL n'est figée à la compilation. Le client API utilise
# `window.location.origin` et des chemins relatifs, et nginx relaie ces chemins
# vers le gateway du même réseau Docker. Une seule image sert donc TEST et PROD.
# =============================================================================

FROM node:22-alpine AS build

WORKDIR /app

# Les manifestes d'abord : la couche d'installation ne se rejoue que si les
# dépendances changent, pas à chaque modification de code.
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/api-client/package.json packages/api-client/
COPY packages/auth/package.json packages/auth/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/

# --ignore-scripts évite le téléchargement des navigateurs Playwright, inutile
# pour produire le bundle. Les binaires esbuild passent par des dépendances
# optionnelles, pas par un script d'installation.
RUN npm ci --ignore-scripts

COPY . .

# Les paquets partagés exposent leur `dist/` : ils doivent être compilés avant
# que Vite et le vérificateur de types ne résolvent `@sira/core` et consorts.
RUN npx tsc -b packages/core packages/api-client packages/auth \
    && npm run build --workspace @sira/web

# =============================================================================
FROM nginx:alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/gateway.inc /etc/nginx/conf.d/gateway.inc
COPY deploy/securite.inc /etc/nginx/conf.d/securite.inc
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for API URLs
ARG API_BASE_URL=https://api.guidipress-io.com
ARG AUTH_SERVER_URL=https://api.guidipress-io.com/authorization

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Replace API URLs in fileutils.ts for production
RUN sed -i "s|http://localhost:9000|${API_BASE_URL}|g" src/app/utils/fileutils.ts && \
    sed -i "s|http://localhost:8090|${AUTH_SERVER_URL}|g" src/app/utils/fileutils.ts

# Build for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app
COPY --from=build /app/dist/ultima-ng/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for API URLs
ARG API_BASE_URL=https://api.guidipress-io.com
ARG AUTH_SERVER_URL=https://api.guidipress-io.com/authorization
ARG FRONTEND_URL=https://guidipress-io.com

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Replace ALL localhost URLs across all source files for production
RUN find src -type f \( -name "*.ts" -o -name "*.html" \) -exec sed -i \
    -e "s|http://localhost:9000|${API_BASE_URL}|g" \
    -e "s|http://localhost:8090|${AUTH_SERVER_URL}|g" \
    -e "s|http://localhost:8080|${AUTH_SERVER_URL}|g" \
    -e "s|http://localhost:4200|${FRONTEND_URL}|g" \
    -e "s|http://localhost:4202|${FRONTEND_URL}|g" \
    {} +

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

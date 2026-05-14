# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm install

# Build Angular app (production config)
COPY . .
RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

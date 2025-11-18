# Multi-stage build para Frontend

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Crear archivo .env para build
ARG VITE_API_URL
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env

# Build de producción
RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

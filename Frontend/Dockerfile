# ============================================
# RevTicket Frontend Dockerfile
# ============================================
# Multi-stage build:
# Stage 1: Build Angular application
# Stage 2: Serve with Nginx web server
# ============================================

# Stage 1: Build Angular App
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built Angular app from build stage
COPY --from=build /app/dist/rev-ticket /usr/share/nginx/html

# Configure Nginx:
# - Serve Angular app on port 80
# - Handle Angular routing (try_files for SPA)
# - Proxy /api/ requests to backend service
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8080/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Note: For local database setup, change
# proxy_pass to http://localhost:8080/
# in the nginx configuration above
# ============================================

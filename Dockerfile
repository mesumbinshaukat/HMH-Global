# Multi-stage build for production
FROM node:18-alpine as frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY Frontend/hmh-global-frontend/package*.json ./
RUN npm ci --only=production
COPY Frontend/hmh-global-frontend/ ./
COPY Frontend/hmh-global-frontend/.env.production ./.env
RUN npm run build

# Backend stage
FROM node:18-alpine as backend

WORKDIR /app
COPY Backend/package*.json ./
RUN npm ci --only=production

COPY Backend/ ./
COPY --from=frontend-builder /app/frontend/build ./public
COPY Backend/.env.production ./.env

EXPOSE 5000
CMD ["node", "index.js"]

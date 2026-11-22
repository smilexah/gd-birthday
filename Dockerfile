# syntax=docker/dockerfile:1

# 1. Сборка фронтенда
FROM node:26-alpine AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Сборка backend
FROM node:26-alpine AS backend
WORKDIR /src/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# 3. Финальный образ
FROM node:26-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    STATIC_DIR=/app/public
WORKDIR /app
COPY --chown=node:node backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=backend --chown=node:node /src/backend/dist ./dist
COPY --chown=node:node backend/migrations ./migrations
COPY --from=frontend --chown=node:node /src/frontend/dist ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]

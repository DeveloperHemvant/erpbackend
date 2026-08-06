# syntax=docker/dockerfile:1

# -----------------------------
# Dependencies
# -----------------------------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# -----------------------------
# Build
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

RUN npm run build

RUN npm prune --omit=dev

# -----------------------------
# Runtime
# -----------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=8000

# Create user
RUN addgroup -S nodejs && \
    adduser -S nestjs -G nodejs

# Copy application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Create upload folders
RUN mkdir -p \
    /app/uploads/announcements \
    /app/uploads/students \
    /app/uploads/staff \
    /app/uploads/temp \
    /app/uploads/teachers \
    /app/uploads/profile \
 && chown -R nestjs:nodejs /app/uploads \
 && chmod -R 775 /app/uploads

USER nestjs

EXPOSE 8000

CMD ["node", "dist/main.js"]
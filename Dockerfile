FROM node:22-alpine

WORKDIR /app

# Corepack, bağımlılık kurulumu ve build tek RUN içinde
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable \
    && pnpm install --frozen-lockfile

# Proje dosyaları
COPY . .

# Sync ve environment
RUN npx svelte-kit sync

# Environment ve memory optimizasyonları
ENV NODE_OPTIONS="--max-old-space-size=3500"
ENV ESBUILD_WORKER_THREADS=1
ENV UPLOAD_DIR=/app/uploads

# Build
RUN pnpm build

EXPOSE 3000
ENTRYPOINT ["node", "build"]
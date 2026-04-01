FROM node:22-alpine

WORKDIR /app

# Corepack, bağımlılık kurulumu ve build tek RUN içinde
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable \
    && pnpm install --frozen-lockfile \
    && npx svelte-kit sync

# Proje dosyaları
COPY . .

# Environment ve memory optimizasyonları
ENV DATABASE_URL=postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV ESBUILD_WORKER_THREADS=1

# Build
RUN pnpm build

EXPOSE 3000
CMD ["node", "build"]
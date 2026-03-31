FROM node:22-alpine

# pnpm için
RUN corepack enable

WORKDIR /app

# lock ve package önce
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./

# bağımlılıklar (build script'ler .npmrc'de izinli)
RUN pnpm install --frozen-lockfile

# proje dosyaları
COPY . .

# build için dummy env değerleri
ENV DATABASE_URL=postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app

# memory limit - 2.9GB sunucu için 2GB Node heap + sistem için yer bırak
ENV NODE_OPTIONS="--max-old-space-size=2048"

# esbuild worker limit (tek worker = daha az RAM)
ENV ESBUILD_WORKER_THREADS=1

# build öncesi sync
RUN npx svelte-kit sync

# build (tek seferde, memory optimize)
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]

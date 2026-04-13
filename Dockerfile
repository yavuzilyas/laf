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
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV ESBUILD_WORKER_THREADS=1
ENV BODY_SIZE_LIMIT=10M
ENV UPLOAD_DIR=/app/uploads
VOLUME ["/app/uploads"]
# Uploads klasörü oluştur (volume için)
RUN mkdir -p /app/uploads

# Build (cache temizleyerek ve memory limitini zorlayarak)
# Not: Eğer build hala hata veriyorsa, sunucu/docker RAM limitini (1GB -> 2GB+) artırmanız gerekebilir.
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

EXPOSE 3000
ENTRYPOINT ["node", "build"]
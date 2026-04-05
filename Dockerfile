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


# Build
RUN pnpm build

EXPOSE 3000
ENTRYPOINT ["node", "build"]
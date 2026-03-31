FROM node:22-alpine

# pnpm için corepack
RUN corepack enable

WORKDIR /app

# lock ve package önce kopyalanır
COPY package.json pnpm-lock.yaml ./

# pnpm dependencies kurulumu ve build script onayı
RUN pnpm install
RUN pnpm approve-builds --all

# svelte-kit ve diğer config dosyaları
COPY svelte.config.js ./
COPY .npmrc ./

# proje dosyaları
COPY . .

# environment değişkenleri (boşluk yok!)
ENV DATABASE_URL=postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app
ENV NODE_OPTIONS="--max-old-space-size=4096"

# build
RUN pnpm exec svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
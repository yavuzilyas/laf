FROM node:22-alpine

# pnpm için
RUN corepack enable

WORKDIR /app

# lock ve package önce
COPY package.json pnpm-lock.yaml ./
COPY svelte.config.js ./
COPY .npmrc ./

# bağımlılıklar (build scripts .npmrc ile otomatik onaylanıyor)
RUN pnpm install --frozen-lockfile

# proje dosyaları
COPY . .

# build için dummy env değerleri (runtime'da gerçek değerler kullanılır)
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NODE_OPTIONS="--max-old-space-size=4096"

# build
RUN npx svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
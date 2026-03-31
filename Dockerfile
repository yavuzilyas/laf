FROM node:22-alpine

# pnpm için
RUN corepack enable

WORKDIR /app

# lock ve package önce
COPY package.json pnpm-lock.yaml ./
COPY svelte.config.js ./
COPY .npmrc ./

# pnpm build scripts izinleri
ENV PNPM_ONLY_BUILT_DEPENDENCIES=@tailwindcss/oxide,argon2,core-js,esbuild,sharp

# proje dosyaları
COPY . .

# build için dummy env değerleri (runtime'da gerçek değerler kullanılır)
ENV DATABASE_URL = postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app
ENV NODE_OPTIONS="--max-old-space-size=4096"

# build
RUN npx svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
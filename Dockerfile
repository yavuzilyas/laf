FROM node:20-alpine

# pnpm için
RUN corepack enable

WORKDIR /app

# lock ve package önce
COPY package.json pnpm-lock.yaml ./
COPY svelte.config.js ./

RUN npm install -g npm@11.12.1

# build script izinleri (native modüller için)
RUN pnpm approve-builds @prisma/engines @tailwindcss/oxide argon2 core-js esbuild prisma sharp

# bağımlılıklar
RUN pnpm install --frozen-lockfile

# proje dosyaları
COPY . .

# build için dummy env değerleri (runtime'da gerçek değerler kullanılır)
ENV DATABASE_URL=postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app

# build
RUN npx svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
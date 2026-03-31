FROM node:20-alpine

# pnpm için
RUN corepack enable

WORKDIR /app

# lock ve package önce
COPY package.json pnpm-lock.yaml ./

RUN npm install -g npm@11.12.1

# bağımlılıklar
RUN pnpm install --frozen-lockfile

# proje dosyaları
COPY . .

# build için dummy env değerleri (runtime'da gerçek değerler kullanılır)
ENV DATABASE_URL=postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app
ENV NODE_OPTIONS="--max-old-space-size=8192"

# build (memory optimizasyonu için worker'ları devre dışı bırak)
ENV VITE_NODE_OPTIONS="--max-old-space-size=8192"
RUN npx svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
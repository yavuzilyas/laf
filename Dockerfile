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

ENV DATABASE_URL=postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app

RUN npx svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
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

# build
RUN npx svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
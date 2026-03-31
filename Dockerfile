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
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV MONGODB_URL=mongodb://localhost:27017/dummy
ENV NODE_OPTIONS="--max-old-space-size=4096"

# build
RUN npx svelte-kit sync
RUN pnpm build

EXPOSE 3000

CMD ["node", "build"]
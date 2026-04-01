# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
ENV DATABASE_URL=postgresql://laf_user:WdYsA6HfI06AxmUbUMNQ@laf-db-kuli76:5432/laf_app
RUN npx svelte-kit sync && pnpm build

# Runtime stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "build"]
FROM node:24-alpine AS build

RUN apk add --no-cache git

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json typedoc.json ./
COPY src ./src
COPY website ./website
COPY .git ./.git

RUN corepack enable
RUN pnpm install --frozen-lockfile

RUN pnpm website:build

FROM caddy:alpine

COPY website/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/website/.vitepress/dist/ /srv/

FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# ACR's BuildKit filesystem can still hold esbuild's binary open while npm is
# running package lifecycle scripts. Install first, then run those scripts in
# a separate image layer after the files are settled.
RUN npm ci --ignore-scripts
RUN npm rebuild --foreground-scripts

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=builder /app/dist/standalone ./

EXPOSE 3000
CMD ["node", "server.js"]

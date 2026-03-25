FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache vips-dev build-base
COPY package*.json ./
RUN npm ci --omit=dev && apk del build-base
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/migrations ./dist/db/migrations
RUN mkdir -p uploads
EXPOSE 4000
CMD ["node", "dist/index.js"]

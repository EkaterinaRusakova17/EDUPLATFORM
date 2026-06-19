FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache font-dejavu
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/storage/originals /app/storage/processed
EXPOSE 3001
CMD ["node", "dist/index.js"]

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --include=dev --legacy-peer-deps
COPY . .
RUN ./node_modules/.bin/prisma generate
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/src/main"]

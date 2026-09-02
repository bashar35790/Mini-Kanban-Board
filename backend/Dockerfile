FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Prisma client is generated at container start (see docker-compose command),
# not at build time — the build has no .env / connection vars available.

EXPOSE 5000

CMD ["npm", "run", "start:dev"]
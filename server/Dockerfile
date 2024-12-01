FROM node:22.11-slim AS builder

ENV PORT 8080

WORKDIR /app

RUN rm -rf node_modules

COPY . .

RUN npm ci --only=production --omit=dev

EXPOSE 8080

CMD ["npm", "start"]
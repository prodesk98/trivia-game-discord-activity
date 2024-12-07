FROM node:22.11-slim AS builder

WORKDIR /app

COPY . .
RUN rm -rf /app/node_modules

RUN npm install

RUN npm run build

FROM node:22.11-slim

WORKDIR /app

COPY --from=builder /app/dist /app/dist

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
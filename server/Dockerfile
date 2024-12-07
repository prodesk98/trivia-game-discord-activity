FROM node:22.11-slim AS builder

WORKDIR /app

COPY . .
RUN rm -rf /app/node_modules

RUN npm install

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
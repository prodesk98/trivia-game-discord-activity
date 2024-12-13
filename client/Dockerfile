FROM node:22.11-slim AS builder

WORKDIR /app

COPY . .
RUN rm -rf /app/node_modules

RUN npm --loglevel verbose install

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

FROM node:22.11-slim AS builder

WORKDIR /app

RUN rm -rf node_modules

COPY . .

RUN npm install

RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

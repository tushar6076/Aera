# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=https://aera-cloud.hacksmiths.dev
ARG VITE_WS_URL=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5175

CMD ["nginx", "-g", "daemon off;"]
# Note: Nginx is configured to listen on port 5175 in nginx.conf
# ---------- BUILD ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

# 👇 mais leve e menos propenso a travar
RUN npm install --no-audit --progress=false

COPY . .

RUN npm run build


# ---------- RUN ----------
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
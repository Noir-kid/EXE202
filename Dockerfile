FROM node:20-alpine AS build

WORKDIR /app

ENV NODE_OPTIONS=--max_old_space_size=4096

COPY package*.json ./
RUN npm install

COPY . .

ARG REACT_APP_API_BASE_URL=/api
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

RUN npm run build

FROM nginx:alpine AS runtime

COPY --from=build /app/build /usr/share/nginx/html
COPY frontend-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

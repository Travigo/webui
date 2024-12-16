FROM alpine:3.21 AS builder

RUN apk add --update nodejs npm

RUN mkdir -p /tmp/nginx/vue-single-page-app
WORKDIR /tmp/nginx/vue-single-page-app
COPY . .

RUN npm install
RUN npm run build


FROM alpine:3.21

RUN apk add --update nginx

RUN mkdir -p /var/log/nginx
RUN mkdir -p /var/www/html

COPY nginx_config/nginx.conf /etc/nginx/nginx.conf
COPY nginx_config/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /tmp/nginx/vue-single-page-app/dist/ /var/www/html/

RUN chown -R nginx:nginx /var/www/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

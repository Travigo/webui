FROM alpine:3.15 AS builder

# Add nodejs
RUN apk add --update nodejs npm

RUN mkdir -p /tmp/nginx/vue-single-page-app

# Set the directory we want to run the next commands for
WORKDIR /tmp/nginx/vue-single-page-app
# Copy our source code into the container
COPY . .
# Install the dependencies, can be commented out if you're running the same node version
RUN npm install

# run webpack and the vue-loader
RUN npm run build

FROM alpine:3.15

RUN apk add --update nginx

# Create the directories we will need
RUN mkdir -p /var/log/nginx
RUN mkdir -p /var/www/html

# Copy the respective nginx configuration files
COPY nginx_config/nginx.conf /etc/nginx/nginx.conf
COPY nginx_config/default.conf /etc/nginx/conf.d/default.conf

# copy the built app to our served directory
COPY --from=builder /tmp/nginx/vue-single-page-app/dist/* /var/www/html/

# make all files belong to the nginx user
RUN chown nginx:nginx /var/www/html

EXPOSE 80

# start nginx and keep the process from backgrounding and the container from quitting
CMD ["nginx", "-g", "daemon off;"]

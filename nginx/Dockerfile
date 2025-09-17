FROM nginx:alpine

WORKDIR /etc/nginx

# Module for hiding headers
RUN apk update && apk add -y nginx-extras

# Copy config files
COPY nginx.conf .
COPY headers.conf .
COPY ssl.conf .

# Copy SSL certs
COPY certs/example/live/local.hideawayseoul.com/local.hideawayseoul.com.pem ./certs/local.hideawayseoul.com/local.hideawayseoul.com.pem
COPY certs/example/live/local.hideawayseoul.com/local.hideawayseoul.com-key.pem ./certs/local.hideawayseoul.com/local.hideawayseoul.com-key.pem
COPY certs/example/dhparam-2048.pem ./certs/dhparam-2048.pem

# Copy sites files
COPY sites-enabled/ ./

# Create new files as www-data, not root
RUN usermod -u 1000 www-data

CMD nginx
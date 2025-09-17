FROM nginx:alpine

WORKDIR /etc/nginx

# Module for hiding headers
RUN apk update && apk add -y nginx-extras

# Copy config files
COPY nginx.conf .
COPY headers.conf .
COPY ssl.conf .

# Copy dhparam file (always needed for SSL)
COPY certs/example/dhparam-2048.pem ./certs/dhparam-2048.pem

# Note: SSL certificates are mounted as volumes in production
# They are generated on the server using Let's Encrypt

# Copy sites files
COPY sites-enabled/ ./

# Create new files as www-data, not root
RUN usermod -u 1000 www-data

CMD nginx
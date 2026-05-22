FROM nginx:alpine

WORKDIR /etc/nginx

# Copy config files
COPY nginx.conf .
COPY headers.conf .
COPY ssl.conf .
COPY cloudflare.conf .

# Copy dhparam file (always needed for SSL)
COPY certs/example/dhparam-2048.pem ./certs/dhparam-2048.pem

# Note: SSL certificates are mounted as volumes in production
# They are generated on the server using Let's Encrypt

# Copy production site config only (default.conf is dev-only)
RUN mkdir -p sites-enabled
COPY sites-enabled/production.conf ./sites-enabled/production.conf

CMD nginx

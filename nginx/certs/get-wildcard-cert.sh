#!/bin/bash
# Generate wildcard SSL certificate for hideawayseoul.com
# Usage: ./get-wildcard-cert.sh hideawayseoul.com your-email@domain.com

DOMAIN=${1:-hideawayseoul.com}
EMAIL=${2:-admin@hideawayseoul.com}

docker run -it --rm \
    -v "$PWD":/etc/letsencrypt \
    certbot/certbot \
    certonly --manual \
    --preferred-challenges=dns \
    --server https://acme-v02.api.letsencrypt.org/directory \
    --email $EMAIL \
    --agree-tos \
    -d *.$DOMAIN -d $DOMAIN

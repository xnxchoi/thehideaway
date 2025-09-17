# SSL Certificate Setup for hideawayseoul.com

## Production SSL Certificate Generation

### Method 1: Let's Encrypt (Recommended for Production)

1. **On your production server (hq.hideawayseoul.com):**

```bash
# Install certbot
sudo apt update
sudo apt install -y certbot

# Stop nginx temporarily (if running)
sudo docker compose -f /opt/thehideaway/compose.prod.yaml stop nginx

# Generate certificate using standalone mode
sudo certbot certonly --standalone \
  --email seanschoi@hideawayseoul.com \
  --agree-tos \
  --no-eff-email \
  -d hideawayseoul.com \
  -d www.hideawayseoul.com

# Certificates are automatically available at /etc/letsencrypt/live/hideawayseoul.com/
# No need to copy - they're mounted directly in Docker Compose

# Start nginx with SSL
sudo docker compose -f /opt/thehideaway/compose.prod.yaml up -d
```

2. **Set up automatic renewal:**

```bash
# Create renewal script
sudo tee /opt/thehideaway/renew-ssl.sh << 'EOF'
#!/bin/bash
cd /opt/thehideaway

# Stop nginx
docker compose -f compose.prod.yaml stop nginx

# Renew certificate
certbot renew --standalone

# Restart nginx (certificates are automatically available via volume mounts)
docker compose -f compose.prod.yaml up -d nginx

echo "SSL certificate renewed successfully"
EOF

sudo chmod +x /opt/thehideaway/renew-ssl.sh

# Schedule automatic renewal (runs monthly)
(crontab -l 2>/dev/null; echo "0 3 1 * * /opt/thehideaway/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
```

### Method 2: Manual Certificate Upload

If you have existing SSL certificates:

1. **Copy your certificates to the correct location:**

```bash
# Copy your certificate files
cp your-certificate.pem /opt/thehideaway/nginx/certs/example/live/hideawayseoul.com/hideawayseoul.com.pem
cp your-private-key.pem /opt/thehideaway/nginx/certs/example/live/hideawayseoul.com/hideawayseoul.com-key.pem

# Set proper permissions
chmod 644 /opt/thehideaway/nginx/certs/example/live/hideawayseoul.com/hideawayseoul.com.pem
chmod 600 /opt/thehideaway/nginx/certs/example/live/hideawayseoul.com/hideawayseoul.com-key.pem
```

## Development SSL (Self-Signed)

For local development with HTTPS:

```bash
# Generate self-signed certificate for localhost
cd /Users/seanchoi/WebstormProjects/thehideaway/nginx/certs/example/live/local.hideawayseoul.com/

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout local.hideawayseoul.com-key.pem \
  -out local.hideawayseoul.com.pem \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=Hideaway/OU=Development/CN=localhost"
```

## Verification

After setting up SSL certificates:

```bash
# Test certificate validity
openssl x509 -in /opt/thehideaway/nginx/certs/example/live/hideawayseoul.com/hideawayseoul.com.pem -text -noout

# Test nginx configuration
docker compose -f compose.prod.yaml exec nginx nginx -t

# Check SSL connection
curl -I https://hideawayseoul.com
```

## Troubleshooting

### Common Issues:

1. **Certificate not found error:**
   - Verify file paths in nginx configuration
   - Check file permissions (644 for .pem, 600 for -key.pem)

2. **SSL handshake errors:**
   - Ensure certificate matches domain name
   - Check if intermediate certificates are included

3. **Permission denied:**
   - Run: `sudo chown -R www-data:www-data /opt/thehideaway/nginx/certs/`

### Certificate Information:

```bash
# Check certificate expiration
openssl x509 -in certificate.pem -noout -dates

# Check certificate domain names
openssl x509 -in certificate.pem -noout -subject -issuer
```

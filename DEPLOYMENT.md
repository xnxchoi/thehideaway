# Complete Docker Deployment Guide

This comprehensive guide covers deploying your Next.js application with Docker on a VCS (Virtual Private Server), including server optimization, backup strategies, and external services integration.

## 📁 File Structure Overview

```
├── .env                    # Example values (safe to commit)
├── .env.production        # Production secrets (DO NOT COMMIT)
├── compose.prod.yaml      # Production Docker Compose
├── prod.Dockerfile        # Production Dockerfile
├── nginx/                 # Reverse proxy configuration
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── sites-enabled/
│   └── certs/
└── postgres/              # Database configuration
```

## 🔧 Environment Configuration

### 1. Environment Files Explained

- **`.env`**: Contains example/default values. Safe to commit to git.
- **`.env.local`**: Development secrets. Used locally, gitignored.
- **`.env.production`**: Production secrets. Used on server, gitignored.

### 2. Setting Up Production Environment

1. Copy `.env.production` to your server
2. Fill in your actual production values:
   ```bash
   # Update these values for production
   PAYLOAD_SECRET=your_secure_random_string_here
   NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
   DATABASE_URI=postgresql://postgres:secure_password@postgres:5432/theestate
   ```

## 🚀 Deployment Process

### Prerequisites on VCS Server

1. **Install Docker & Docker Compose**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Create Docker network**:
   ```bash
   docker network create hideaway
   ```

## 🔄 Deployment Methods

### Method 1: Git-Based Deployment (Recommended)

This method uses Git for version control and enables easy updates:

1. **Initial Setup on Server**:
   ```bash
   # Clone your repository
   git clone https://github.com/yourusername/thehideaway.git /opt/thehideaway
   cd /opt/thehideaway
   
   # Create production environment file
   cp .env.production.example .env.production
   nano .env.production  # Fill with actual values
   ```

2. **Deploy with Dockge Integration**:
   ```bash
   # Install Dockge first (see Dockge section below)
   # Then deploy your stack through Dockge web interface
   ```

3. **Updates** (Simple git pull + restart):
   ```bash
   cd /opt/thehideaway
   git pull origin main
   # Restart via Dockge web interface or:
   docker-compose -f compose.prod.yaml up -d --build
   ```

### Method 2: Direct File Upload

For cases where Git isn't available:

```bash
# Using rsync (recommended)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' ./ user@your-server:/opt/thehideaway/

# Or using scp
scp -r ./ user@your-server:/opt/thehideaway/
```

2. **SSH into your server**:
   ```bash
   ssh user@your-server
   cd /path/to/app
   ```

3. **Set up environment file**:
   ```bash
   # Copy and edit the production environment file
   cp .env.production.example .env.production
   nano .env.production  # Edit with your actual values
   ```

4. **Deploy the application**:
   ```bash
   # Build and start services
   docker compose -f compose.prod.yaml up -d --build
   
   # Check logs
   docker compose -f compose.prod.yaml logs -f
   ```

## 🖥️ Complete Ubuntu Server Optimization

### Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt dist-upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip htop ncdu tree fail2ban ufw

# Ubuntu/Debian
sudo curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose is now included with Docker
# No separate installation needed for Docker Compose v2

# Install Micro
cd /usr/bin
sudo curl https://getmic.ro/r | sudo sh


# Create non-root user (if not already done)
#sudo adduser deploy
#sudo usermod -aG sudo deploy
#sudo usermod -aG docker deploy

# Configure SSH key authentication (recommended)
# Execute these commands ON THE SERVER after SSH'ing in
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Copy your LOCAL machine's public key to the server
# On your LOCAL machine:
# cat ~/.ssh/id_ed25519.pub
# Copy the output, then on the SERVER:
sudo micro ~/.ssh/authorized_keys
# Paste the copied content
# Save and exit

sudo chmod 600 ~/.ssh/authorized_keys
```

### System Performance Optimization

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
sudo tee -a /etc/sysctl.conf << EOF
# Network optimizations
net.core.somaxconn = 65536
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

# Apply kernel parameters
sudo sysctl -p
```

### Security Hardening

```bash
# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create jail for SSH
sudo tee /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

# Restart fail2ban
sudo systemctl restart fail2ban

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5001/tcp  # Dockge
# Restrict Dockge access to your IP only (recommended)
# Find your IP: curl ifconfig.me or visit whatismyipaddress.com
sudo ufw allow from YOUR_PUBLIC_IP to any port 5001
# Example: sudo ufw allow from 203.0.113.45 to any port 5001

# Alternative: Allow from anywhere (less secure)
# sudo ufw allow 5001/tcp
sudo ufw --force enable

# Configure SSH security settings
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/#AuthorizedKeysFile/AuthorizedKeysFile/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### Docker Optimization

```bash
# Configure Docker daemon for production
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false,
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF

# Restart Docker
sudo systemctl restart docker

# Enable Docker auto-start
sudo systemctl enable docker
```

### Monitoring Setup

```bash
# Install and configure htop for process monitoring
sudo apt install -y htop iotop nethogs

# Create monitoring aliases
tee -a ~/.bashrc << EOF
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias ports='netstat -tulanp'
alias meminfo='free -m -l -t'
alias psmem='ps auxf | sort -nr -k 4'
alias pscpu='ps auxf | sort -nr -k 3'
alias cpuinfo='lscpu'
alias diskspace='df -h'
alias folders='find . -maxdepth 1 -type d -print0 | xargs -0 du -sk | sort -rn'
alias dockerps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dockerlogs='docker compose -f /opt/thehideaway/compose.prod.yaml logs -f'
EOF

source ~/.bashrc
```

### Automatic Updates & Maintenance

```bash
# Configure automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Create maintenance script
sudo tee /usr/local/bin/server-maintenance.sh << 'EOF'
#!/bin/bash
# Server maintenance script

echo "Starting server maintenance..."

# Update system packages
apt update && apt upgrade -y

# Clean up Docker
docker system prune -f
docker volume prune -f

# Clean up logs older than 7 days
find /var/log -type f -name "*.log" -mtime +7 -delete
journalctl --vacuum-time=7d

# Clean up apt cache
apt autoremove -y
apt autoclean

# Check disk space
df -h

echo "Server maintenance completed!"
EOF

sudo chmod +x /usr/local/bin/server-maintenance.sh

# Schedule weekly maintenance (Sundays at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * 0 /usr/local/bin/server-maintenance.sh >> /var/log/maintenance.log 2>&1") | crontab -
```

## 🔒 Security & SSL Configuration

### SSL/TLS Setup with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Update nginx configuration for your domain first
sudo nano /opt/thehideaway/nginx/sites-enabled/production.conf
# Ensure hideawayseoul.com is configured correctly

# Get SSL certificate for hideawayseoul.com
sudo certbot --nginx -d hideawayseoul.com -d www.hideawayseoul.com

# Test auto-renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron job
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

### Additional Security Measures

**⚠️ ClamAV Warning**: ClamAV can freeze low-resource servers during installation. Skip this section if you have <2GB RAM.

```bash
# Option 1: Lightweight security (recommended for small VPS)
# Install rkhunter for rootkit detection
sudo apt install -y rkhunter
sudo rkhunter --update
sudo rkhunter --propupd

# Schedule weekly rootkit scan
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/bin/rkhunter --check --skip-keypress --report-warnings-only") | crontab -

# Option 2: Full antivirus (only for servers with >2GB RAM)
# sudo apt install -y clamav clamav-daemon
# sudo freshclam
# sudo systemctl enable clamav-daemon
# (crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/clamscan -r /opt --quiet --infected --remove") | crontab -

# Configure logwatch for log monitoring
sudo apt install -y logwatch
sudo sed -i 's/MailTo = root/MailTo = your-email@domain.com/' /usr/share/logwatch/default.conf/logwatch.conf
```

**If your server froze during ClamAV installation:**
```bash
# After server restart, remove ClamAV
sudo systemctl stop clamav-daemon clamav-freshclam 2>/dev/null
sudo apt remove --purge clamav clamav-daemon -y
sudo apt autoremove -y

# Use lightweight alternative above instead
```

## 🛠 Dockge: Complete Container Management

[Dockge](https://github.com/louislam/dockge) provides a web UI for Docker Compose management and is the recommended way to manage your entire deployment lifecycle.

### Why Use Dockge?

- **Visual Management**: Web interface for all Docker operations
- **Easy Updates**: One-click container rebuilds and restarts
- **Log Monitoring**: Real-time container logs in the browser
- **Environment Management**: Edit environment variables through UI
- **Stack Management**: Import/export Docker Compose files
- **Terminal Access**: Built-in terminal for container debugging

### Complete Dockge Setup

1. **Install Dockge**:
   ```bash
   # Create Dockge directory
   mkdir -p /opt/dockge
   cd /opt/dockge
   
   # Download Dockge compose file
   curl -L https://raw.githubusercontent.com/louislam/dockge/master/compose.yaml -o compose.yaml
   
   # Start Dockge
   docker compose up -d
   ```

2. **Initial Dockge Configuration**:
   ```bash
   # Access Dockge web interface
   # Visit: http://your-server-ip:5001
   # Create admin account on first visit
   ```

3. **Deploy Your Application via Dockge**:
   - **Option A**: Import existing stack
     - In Dockge, click "Import Stack"
     - Upload your `compose.prod.yaml`
     - Set stack name: `thehideaway`
     - Click "Deploy"
   
   - **Option B**: Create new stack
     - Click "Create Stack"
     - Name: `thehideaway`
     - Copy contents of `compose.prod.yaml`
     - Click "Deploy"

4. **Managing Your Application**:
   - **Start/Stop**: Use buttons in Dockge interface
   - **View Logs**: Click on container names to see real-time logs
   - **Update**: Edit compose file in Dockge, then click "Update"
   - **Rebuild**: Click "Down" then "Up" to rebuild containers

### Dockge-Integrated Deployment Workflow

```bash
# 1. Initial server setup (one-time)
git clone https://github.com/yourusername/thehideaway.git /opt/thehideaway
cd /opt/thehideaway
cp .env.production.example .env.production
nano .env.production  # Fill with actual values

# 2. Install Dockge (one-time)
mkdir -p /opt/dockge && cd /opt/dockge
curl -L https://raw.githubusercontent.com/louislam/dockge/master/compose.yaml -o compose.yaml
docker-compose up -d

# 3. Deploy via Dockge web interface
# Visit http://your-server:5001 and import /opt/thehideaway/compose.prod.yaml

# 4. Future updates
cd /opt/thehideaway
git pull origin main
# Then use Dockge web interface to restart containers
```

## 🔍 Troubleshooting

### Common Issues

1. **Environment variables not loading**:
   - Ensure `.env.production` exists and has correct format
   - Check file permissions: `chmod 600 .env.production`

2. **Database connection issues**:
   - Verify `DATABASE_URI` uses `postgres` as hostname (not `localhost`)
   - Check if postgres container is healthy: `docker compose ps`

3. **Nginx not starting**:
   - Check nginx configuration: `docker compose exec nginx nginx -t`
   - Verify SSL certificates exist in the correct paths

4. **Build failures**:
   - Clear Docker cache: `docker system prune -a`
   - Check build logs: `docker compose logs payload`

### Useful Commands

```bash
# View logs
docker compose -f compose.prod.yaml logs -f [service_name]

# Restart services
docker compose -f compose.prod.yaml restart

# Update application
git pull
docker compose -f compose.prod.yaml up -d --build

# Database backup
docker compose exec postgres pg_dump -U postgres theestate > backup.sql

# Database restore
docker compose exec -T postgres psql -U postgres theestate < backup.sql
```

## 📊 Monitoring

Consider setting up monitoring with:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Log aggregation**: ELK stack, Grafana Loki
- **Metrics**: Prometheus + Grafana
- **Error tracking**: Sentry

## 💾 Comprehensive Backup Strategy

### Automated Database Backups

```bash
# Create backup directory
sudo mkdir -p /opt/backups/database
sudo chown deploy:deploy /opt/backups

# Create database backup script
tee /opt/backups/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="postgres"

# Create backup
docker exec $CONTAINER_NAME pg_dump -U postgres theestate | gzip > "$BACKUP_DIR/theestate_$DATE.sql.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: theestate_$DATE.sql.gz"
EOF

chmod +x /opt/backups/backup-database.sh

# Schedule daily backups at 1 AM
(crontab -l 2>/dev/null; echo "0 1 * * * /opt/backups/backup-database.sh >> /var/log/backup.log 2>&1") | crontab -
```

### File System Backups

```bash
# Create file backup script
tee /opt/backups/backup-files.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
SOURCE_DIR="/opt/thehideaway"

mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules, .git, .next)
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude=".next" \
  --exclude="*.log" \
  -C /opt thehideaway

# Backup uploaded media files
docker run --rm -v theestate_pgdata:/data -v $BACKUP_DIR:/backup alpine \
  tar -czf /backup/media_$DATE.tar.gz -C /data .

# Keep only last 3 days of file backups (they're larger)
find $BACKUP_DIR -name "*.tar.gz" -mtime +3 -delete

echo "File backup completed: app_$DATE.tar.gz, media_$DATE.tar.gz"
EOF

chmod +x /opt/backups/backup-files.sh

# Schedule weekly file backups (Sundays at 1:30 AM)
(crontab -l 2>/dev/null; echo "30 1 * * 0 /opt/backups/backup-files.sh >> /var/log/backup.log 2>&1") | crontab -
```

### Backup Restoration

```bash
# Database restore example
gunzip -c /opt/backups/database/theestate_20240101_010000.sql.gz | \
docker exec -i postgres psql -U postgres -d theestate

# Application files restore
tar -xzf /opt/backups/files/app_20240101_010000.tar.gz -C /opt
```

## 🚀 CDN Setup (Minimal Cost)

### Option 1: Cloudflare (Free Tier)

```bash
# 1. Sign up at cloudflare.com
# 2. Add your domain
# 3. Update nameservers at your domain registrar
# 4. Configure DNS records:
#    A record: @ -> your-server-ip
#    A record: www -> your-server-ip
# 5. Enable "Proxied" status for both records
```

**Benefits:**
- Free SSL certificates
- Global CDN
- DDoS protection
- Caching for static assets
- Analytics

### Option 2: BunnyCDN (Low Cost)

**Cost**: ~$1/month for 500GB bandwidth

```bash
# 1. Sign up at bunny.net
# 2. Create a Pull Zone
# 3. Set origin URL to your domain
# 4. Configure CNAME record: cdn.yourdomain.com -> your-bunny-url
```

## ⚡ Redis Cache Setup (Minimal)

### Docker Redis Integration

Add Redis to your `compose.prod.yaml`:

```yaml
  redis:
    restart: always
    container_name: redis
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - hideaway
    ports:
      - "127.0.0.1:6379:6379"  # Only localhost access

volumes:
  pgdata:
  node_modules:
  redis_data:  # Add this line
```

### Next.js Redis Configuration

Update your `.env.production`:

```bash
# Add Redis configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=  # Leave empty for no auth in private network
```

### Redis Usage Examples

```javascript
// lib/redis.js
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

export async function getRedisClient() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

// Example: Cache API responses
export async function getCachedData(key, fetchFunction, ttl = 3600) {
  const redis = await getRedisClient();
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const data = await fetchFunction();
    await redis.setEx(key, ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Redis error:', error);
    return await fetchFunction(); // Fallback to direct fetch
  }
}
```

## 🔄 Updates & Maintenance

### Git-Based Update Workflow

```bash
# On your server (via SSH or Dockge terminal)
cd /opt/thehideaway
git pull origin main

# Via Dockge web interface:
# 1. Go to your stack
# 2. Click "Down" to stop containers
# 3. Click "Up" to rebuild and start
```

### Automated Update Script

```bash
# Create update script
tee /opt/thehideaway/update.sh << 'EOF'
#!/bin/bash
cd /opt/thehideaway

echo "Pulling latest changes..."
git pull origin main

echo "Rebuilding containers..."
docker compose -f compose.prod.yaml down
docker compose -f compose.prod.yaml up -d --build

echo "Cleaning up unused images..."
docker image prune -f

echo "Update completed!"
EOF

chmod +x /opt/thehideaway/update.sh

# Run updates
./update.sh
```

## 🆘 Support

If you encounter issues:
1. Check the logs first: `docker compose -f compose.prod.yaml logs`
2. Verify environment variables are set correctly
3. Ensure all required ports are open
4. Check Docker and system resources (disk space, memory)
5. Use Dockge web interface for easier debugging

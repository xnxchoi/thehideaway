#!/bin/bash

# Docker Setup Script for thehideaway project
# This script sets up the initial Docker configuration and networks

set -e  # Exit on any error

echo "🚀 Setting up Docker configuration for thehideaway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if user is in docker group
check_docker_permissions() {
    print_status "Checking Docker permissions..."
    if ! groups $USER | grep &>/dev/null '\bdocker\b'; then
        print_warning "User $USER is not in the docker group"
        print_status "Adding user to docker group..."
        sudo usermod -aG docker $USER
        print_warning "Please log out and log back in for group changes to take effect"
        print_warning "Or run: newgrp docker"
    else
        print_success "User has Docker permissions"
    fi
}

# Create Docker network
create_docker_network() {
    print_status "Creating Docker network 'hideaway'..."
    
    # Check if network already exists
    if docker network ls | grep -q "hideaway"; then
        print_warning "Network 'hideaway' already exists"
    else
        docker network create hideaway
        print_success "Created Docker network 'hideaway'"
    fi
}

# Configure Docker daemon for production
configure_docker_daemon() {
    print_status "Configuring Docker daemon..."
    
    DAEMON_CONFIG="/etc/docker/daemon.json"
    
    if [ -f "$DAEMON_CONFIG" ]; then
        print_warning "Docker daemon.json already exists, backing up..."
        sudo cp "$DAEMON_CONFIG" "$DAEMON_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    print_status "Creating optimized Docker daemon configuration..."
    sudo tee "$DAEMON_CONFIG" > /dev/null << 'EOF'
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
    
    print_success "Docker daemon configuration created"
}

# Restart Docker service
restart_docker() {
    print_status "Restarting Docker service..."
    sudo systemctl restart docker
    sudo systemctl enable docker
    print_success "Docker service restarted and enabled"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create logs directory for nginx
    mkdir -p nginx/logs
    
    # Create SSL certificates directory if it doesn't exist
    mkdir -p nginx/certs/example/live/hideawayseoul.com
    
    print_success "Directories created"
}

# Set up environment files
setup_environment_files() {
    print_status "Setting up environment files..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found"
        print_status "Please create .env.production with your production values"
        print_status "You can use .env as a template"
    else
        print_success ".env.production exists"
    fi
    
    # Check if .env.local exists for development
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found for development"
        print_status "Consider creating .env.local for development secrets"
    else
        print_success ".env.local exists"
    fi
}

# Check system requirements
check_system_requirements() {
    print_status "Checking system requirements..."
    
    # Check available disk space (minimum 10GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=10485760  # 10GB in KB
    
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        print_warning "Low disk space detected. Recommended: 10GB+ available"
    else
        print_success "Sufficient disk space available"
    fi
    
    # Check available memory (minimum 2GB)
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    REQUIRED_MEMORY=2048  # 2GB in MB
    
    if [ "$AVAILABLE_MEMORY" -lt "$REQUIRED_MEMORY" ]; then
        print_warning "Low memory detected. Recommended: 2GB+ available"
    else
        print_success "Sufficient memory available"
    fi
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    thehideaway Docker Setup                  ║"
    echo "║                                                              ║"
    echo "║  This script will set up Docker configuration and networks   ║"
    echo "║  for the hideawayseoul.com production deployment             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Run setup steps
    check_system_requirements
    check_docker
    check_docker_permissions
    create_docker_network
    configure_docker_daemon
    restart_docker
    create_directories
    setup_environment_files
    
    echo ""
    echo -e "${GREEN}✅ Docker setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Ensure .env.production is configured with your production values"
    echo "2. Generate SSL certificates: cd nginx/certs && ./get-wildcard-cert.sh"
    echo "3. Deploy with: docker compose -f compose.prod.yaml up -d"
    echo ""
    echo -e "${YELLOW}Note: If you added the user to docker group, please log out and back in${NC}"
}

# Run main function
main "$@"

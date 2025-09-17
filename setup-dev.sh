#!/bin/bash

# Development Setup Script for thehideaway project
# This script sets up the development environment

set -e  # Exit on any error

echo "🛠️ Setting up development environment for thehideaway..."

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
        exit 1
    fi
    print_success "Docker is installed"
}

# Create Docker network
create_docker_network() {
    print_status "Creating Docker network 'hideaway'..."
    
    if docker network ls | grep -q "hideaway"; then
        print_warning "Network 'hideaway' already exists"
    else
        docker network create hideaway
        print_success "Created Docker network 'hideaway'"
    fi
}

# Create development directories
create_dev_directories() {
    print_status "Creating development directories..."
    
    mkdir -p nginx/logs
    mkdir -p postgres/data
    
    print_success "Development directories created"
}

# Set up development environment files
setup_dev_environment() {
    print_status "Setting up development environment files..."
    
    if [ ! -f ".env.local" ]; then
        print_status "Creating .env.local template..."
        cat > .env.local << 'EOF'
# Development Environment Variables
# Copy values from .env and override with your local development secrets

# Application Secrets (generate secure values for development)
PAYLOAD_SECRET=dev_payload_secret_change_me
PREVIEW_SECRET=dev_preview_secret_change_me
BETTER_AUTH_SECRET=dev_better_auth_secret_change_me
CRON_SECRET=dev_cron_secret_change_me

# OAuth Credentials (use your development app credentials)
AUTH_NAVER_ID=your_dev_naver_id_here
AUTH_NAVER_SECRET=your_dev_naver_secret_here
GOOGLE_CLIENT_ID=your_dev_google_client_id_here
GOOGLE_CLIENT_SECRET=your_dev_google_client_secret_here
AUTH_ADMINS_GOOGLE_ID=your_dev_admin_google_id_here
AUTH_ADMINS_GOOGLE_SECRET=your_dev_admin_google_secret_here

# API Keys (use development/test keys)
EXCHANGE_RATE_KEY=your_dev_exchange_rate_key_here
HOLIDAY_API_KEY=your_dev_holiday_api_key_here
API_KEY_UNSPLASH=your_dev_unsplash_key_here

# Database Configuration (development)
DATABASE_URI=postgresql://postgres:H1dden!@localhost:5432/theestate
POSTGRES_PASSWORD=H1dden!
POSTGRES_USER=postgres
POSTGRES_DB=theestate
EOF
        print_success "Created .env.local template"
        print_warning "Please update .env.local with your actual development values"
    else
        print_success ".env.local already exists"
    fi
}

# Install dependencies (if package.json exists)
install_dependencies() {
    if [ -f "package.json" ]; then
        print_status "Installing Node.js dependencies..."
        
        if command -v pnpm &> /dev/null; then
            pnpm install
            print_success "Dependencies installed with pnpm"
        elif command -v npm &> /dev/null; then
            npm install
            print_success "Dependencies installed with npm"
        else
            print_warning "No package manager found. Please install dependencies manually."
        fi
    else
        print_warning "No package.json found. Skipping dependency installation."
    fi
}

# Start development environment
start_dev_environment() {
    print_status "Starting development environment..."
    
    # Build and start development containers
    docker compose -f compose.dev.yaml up -d --build
    
    print_success "Development environment started"
    print_status "Services running:"
    docker compose -f compose.dev.yaml ps
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                thehideaway Development Setup                 ║"
    echo "║                                                              ║"
    echo "║  This script sets up your local development environment      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Run setup steps
    check_docker
    create_docker_network
    create_dev_directories
    setup_dev_environment
    install_dependencies
    
    # Ask if user wants to start the environment
    echo ""
    read -p "Do you want to start the development environment now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_dev_environment
    fi
    
    echo ""
    echo -e "${GREEN}✅ Development setup completed!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update .env.local with your development credentials"
    echo "2. Start development: docker compose -f compose.dev.yaml up -d"
    echo "3. View logs: docker compose -f compose.dev.yaml logs -f"
    echo "4. Access your app at: http://localhost:3000"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "• Stop: docker compose -f compose.dev.yaml down"
    echo "• Rebuild: docker compose -f compose.dev.yaml up -d --build"
    echo "• Database: docker compose -f compose.dev.yaml exec postgres psql -U postgres -d theestate"
}

# Run main function
main "$@"

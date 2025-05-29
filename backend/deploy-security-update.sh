#!/bin/bash

# 🔐 Security Update Deployment Script
# This script safely deploys the enhanced authentication system to production

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    local missing_vars=()
    
    if [ -z "$MONGODB_URI" ]; then
        missing_vars+=("MONGODB_URI")
    fi
    
    if [ -z "$ACCESS_TOKEN_SECRET" ]; then
        missing_vars+=("ACCESS_TOKEN_SECRET")
    fi
    
    if [ -z "$REFRESH_TOKEN_SECRET" ]; then
        missing_vars+=("REFRESH_TOKEN_SECRET")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Function to create backup
create_backup() {
    print_status "Creating database backup..."
    
    local backup_dir="./backups/$(date +%Y%m%d-%H%M%S)-security-update"
    mkdir -p "$backup_dir"
    
    if command_exists mongodump; then
        mongodump --uri="$MONGODB_URI" --out="$backup_dir" 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "Database backup created at: $backup_dir"
            echo "$backup_dir" > .last_backup_path
        else
            print_warning "mongodump failed, but continuing with migration (backup will be created by migration script)"
        fi
    else
        print_warning "mongodump not found, backup will be created by migration script"
    fi
}

# Function to check migration status
check_migration_status() {
    print_status "Checking current migration status..."
    npm run migrate:security:check
}

# Function to run migration
run_migration() {
    print_status "Running security fields migration..."
    
    if npm run migrate:security; then
        print_success "Migration completed successfully!"
        return 0
    else
        print_error "Migration failed!"
        return 1
    fi
}

# Function to validate migration
validate_migration() {
    print_status "Validating migration..."
    npm run migrate:security:check
}

# Function to restart application (if using PM2)
restart_application() {
    if command_exists pm2; then
        print_status "Restarting application with PM2..."
        pm2 restart all
        print_success "Application restarted"
    else
        print_warning "PM2 not found. Please restart your application manually."
        print_warning "If using systemd: sudo systemctl restart your-app-name"
        print_warning "If using Docker: docker-compose restart"
    fi
}

# Function to test application
test_application() {
    print_status "Testing application endpoints..."
    
    # Test health endpoint
    if command_exists curl; then
        local health_url="http://localhost:8000/health"
        if curl -s "$health_url" > /dev/null; then
            print_success "Health endpoint is responding"
        else
            print_warning "Health endpoint not responding. Check if application is running."
        fi
        
        # Test security status endpoint
        local security_url="http://localhost:8000/api/security/status"
        if curl -s "$security_url" > /dev/null; then
            print_success "Security status endpoint is responding"
        else
            print_warning "Security status endpoint not responding"
        fi
    else
        print_warning "curl not found. Please test endpoints manually:"
        echo "  - Health: http://localhost:8000/health"
        echo "  - Security: http://localhost:8000/api/security/status"
    fi
}

# Function to rollback migration
rollback_migration() {
    print_warning "Rolling back migration..."
    
    if npm run migrate:security:rollback; then
        print_success "Rollback completed successfully"
    else
        print_error "Rollback failed!"
        exit 1
    fi
}

# Main deployment function
deploy_security_update() {
    echo "🔐 Security Update Deployment"
    echo "============================="
    echo ""
    
    # Pre-deployment checks
    print_status "Starting pre-deployment checks..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the backend directory."
        exit 1
    fi
    
    # Check Node.js and npm
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check environment variables
    check_env_vars
    
    # Install dependencies
    print_status "Installing/updating dependencies..."
    npm install
    
    # Create backup
    create_backup
    
    # Check current migration status
    check_migration_status
    
    # Ask for confirmation
    echo ""
    print_warning "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
    echo "This will update your production database with new security fields."
    echo "The migration is designed to be safe and zero-downtime."
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled by user"
        exit 0
    fi
    
    # Run migration
    if run_migration; then
        print_success "Migration completed successfully!"
    else
        print_error "Migration failed!"
        
        # Ask if user wants to rollback
        echo ""
        read -p "Do you want to rollback the migration? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_migration
        fi
        
        exit 1
    fi
    
    # Validate migration
    validate_migration
    
    # Restart application
    restart_application
    
    # Test application
    test_application
    
    # Final success message
    echo ""
    print_success "🎉 Security update deployment completed successfully!"
    echo ""
    echo "New security features are now active:"
    echo "  ✅ Token blacklisting"
    echo "  ✅ Rate limiting"
    echo "  ✅ Enhanced session tracking"
    echo "  ✅ Secure cookie handling"
    echo ""
    echo "Monitor your application logs for any issues:"
    echo "  tail -f your-app-logs.log | grep -E '(🔐|🚨|❌)'"
    echo ""
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        deploy_security_update
        ;;
    "check")
        check_migration_status
        ;;
    "migrate")
        run_migration
        ;;
    "rollback")
        rollback_migration
        ;;
    "test")
        test_application
        ;;
    "backup")
        create_backup
        ;;
    *)
        echo "Usage: $0 [deploy|check|migrate|rollback|test|backup]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment process (default)"
        echo "  check    - Check migration status"
        echo "  migrate  - Run migration only"
        echo "  rollback - Rollback migration"
        echo "  test     - Test application endpoints"
        echo "  backup   - Create database backup"
        exit 1
        ;;
esac 
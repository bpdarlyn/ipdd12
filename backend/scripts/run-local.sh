#!/bin/bash

# Local Development Server Script
# Runs the FastAPI application locally with proper environment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.local exists
if [ ! -f "../.env.local" ]; then
    print_error ".env.local file not found!"
    print_warning "Run ./get-prod-env.sh first to create environment variables"
    print_warning "Or copy .env.example to .env.local and customize it"
    exit 1
fi

print_status "Starting local development server..."
print_status "Environment file: .env.local"
print_status "FastAPI will be available at: http://localhost:8000"
print_status "API Documentation: http://localhost:8000/api/v1/docs"
print_status "Health endpoint: http://localhost:8000/health"

# Change to src directory and run uvicorn
cd ../src
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

print_status "Development server stopped."
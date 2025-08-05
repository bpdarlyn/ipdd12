#!/bin/bash

# SAM Local Development Script
# Runs the Lambda function locally using SAM CLI

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

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    print_error "SAM CLI is not installed!"
    print_warning "Install SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
    exit 1
fi

# Update env.json with real values from CloudFormation if .env.local exists
if [ -f "../.env.local" ]; then
    print_status "Updating env.json with values from .env.local..."
    
    # Source the .env.local file
    source <(grep -v '^#' ../.env.local | sed 's/^/export /')
    
    # Update env.json with real values
    cat > ../env.json << EOF
{
  "ApiLambdaFunction": {
    "DATABASE_URL": "$DATABASE_URL",
    "S3_BUCKET": "$S3_BUCKET",
    "COGNITO_USER_POOL_ID": "$COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID": "$COGNITO_CLIENT_ID",
    "COGNITO_REGION": "$COGNITO_REGION",
    "JWT_SECRET_KEY": "$JWT_SECRET_KEY",
    "JWT_ACCESS_TOKEN_EXPIRE_MINUTES": "$JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    "ENVIRONMENT": "$ENVIRONMENT",
    "DEBUG": "$DEBUG"
  }
}
EOF
    print_status "env.json updated with environment variables"
fi

cd ..

print_status "Building SAM application..."
sam build

print_status "Starting SAM local API..."
print_status "Lambda API will be available at: http://localhost:3000"
print_status "API Documentation: http://localhost:3000/api/v1/docs"
print_status "Health endpoint: http://localhost:3000/health"

print_warning "Make sure you're connected to VPN to access RDS database"

# Start SAM local API
sam local start-api --env-vars env.json --host 0.0.0.0 --port 3000

print_status "SAM local API stopped."
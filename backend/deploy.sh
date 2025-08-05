#!/bin/bash

# IEM IPDD 12 Backend Deployment Script

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "Deploying IEM IPDD 12 Backend to environment: $ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
command -v aws >/dev/null 2>&1 || { print_error "AWS CLI is required but not installed. Aborting."; exit 1; }
command -v sam >/dev/null 2>&1 || { print_error "SAM CLI is required but not installed. Aborting."; exit 1; }

# Deploy Data Persistence Stack
print_status "Deploying Data Persistence Stack..."
cd infrastructure

# Prompt for database password if not set
if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter database password: " DB_PASSWORD
    echo
fi

aws cloudformation deploy \
    --template-file data-persistence.yaml \
    --stack-name ipdd12-data-persistence-$ENVIRONMENT \
    --parameter-overrides Environment=$ENVIRONMENT DBPassword=$DB_PASSWORD \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

if [ $? -eq 0 ]; then
    print_status "Data Persistence Stack deployed successfully"
else
    print_error "Failed to deploy Data Persistence Stack"
    exit 1
fi

# Deploy Business Logic Stack
print_status "Deploying Business Logic Stack..."
cd ..

# Build SAM application
print_status "Building SAM application..."
sam build

if [ $? -eq 0 ]; then
    print_status "SAM build completed successfully"
else
    print_error "SAM build failed"
    exit 1
fi

# Deploy SAM application
print_status "Deploying SAM application..."
if [ "$ENVIRONMENT" = "dev" ]; then
    sam deploy --config-env default
elif [ "$ENVIRONMENT" = "staging" ]; then
    sam deploy --config-env staging
elif [ "$ENVIRONMENT" = "prod" ]; then
    sam deploy --config-env prod
else
    print_error "Invalid environment: $ENVIRONMENT. Use dev, staging, or prod."
    exit 1
fi

if [ $? -eq 0 ]; then
    print_status "Business Logic Stack deployed successfully"
    
    # Get API Gateway URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name ipdd12-backend-$ENVIRONMENT \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text \
        --region $REGION)
    
    print_status "Deployment completed successfully!"
    print_status "API Gateway URL: $API_URL"
    print_status "API Documentation: $API_URL/api/v1/docs"
    
else
    print_error "Failed to deploy Business Logic Stack"
    exit 1
fi

print_warning "Don't forget to run database migrations after first deployment!"
print_status "Deployment script completed."
#!/bin/bash

# Get Production Environment Variables Script
# This script retrieves environment variables from AWS and creates a local .env file

set -e

ENVIRONMENT=${1:-prod}
REGION=${2:-us-east-1}
STACK_NAME="ipdd12-data-persistence-${ENVIRONMENT}"

echo "Retrieving environment variables from AWS for environment: $ENVIRONMENT"

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

# Get CloudFormation outputs
print_status "Getting CloudFormation stack outputs..."

DATABASE_URL=$(AWS_PROFILE=nylrad aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseURL`].OutputValue' \
    --output text 2>/dev/null || echo "")

S3_BUCKET=$(AWS_PROFILE=nylrad aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AttachmentsBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")

COGNITO_USER_POOL_ID=$(AWS_PROFILE=nylrad aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text 2>/dev/null || echo "")

COGNITO_CLIENT_ID=$(AWS_PROFILE=nylrad aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text 2>/dev/null || echo "")

# Create .env.local file
ENV_FILE="../.env.local"
print_status "Creating $ENV_FILE with production values..."

cat > "$ENV_FILE" << EOF
# Local Development Environment Variables
# Generated from AWS environment: $ENVIRONMENT
# Generated on: $(date)

# Database Configuration (using VPN connection to RDS)
DATABASE_URL=$DATABASE_URL

# AWS Configuration
AWS_REGION=$REGION
S3_BUCKET=$S3_BUCKET

# Cognito Configuration
COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
COGNITO_REGION=$REGION

# JWT Configuration
JWT_SECRET_KEY=ipdd12-local-development-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Local Development Settings
ENVIRONMENT=local
DEBUG=true
EOF

print_status "Environment file created successfully: $ENV_FILE"
print_warning "Make sure you're connected to the VPN to access the RDS database"
print_status "Environment variables loaded:"
echo "  DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "  S3_BUCKET: $S3_BUCKET"
echo "  COGNITO_USER_POOL_ID: $COGNITO_USER_POOL_ID"
echo "  COGNITO_CLIENT_ID: $COGNITO_CLIENT_ID"

print_status "Script completed successfully!"
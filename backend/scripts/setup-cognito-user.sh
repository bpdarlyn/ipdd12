#!/bin/bash

# Script to setup Cognito user and avoid force change password status
# Usage: ./setup-cognito-user.sh <environment> <email> <password>

set -e

# Check if required parameters are provided
if [ $# -ne 3 ]; then
    echo "Usage: $0 <environment> <email> <password>"
    echo "Example: $0 prod bpdarlyn@gmail.com MySecurePassword123!"
    exit 1
fi

ENVIRONMENT=$1
EMAIL=$2
PASSWORD=$3

echo "Setting up Cognito user for environment: $ENVIRONMENT"
echo "Email: $EMAIL"

# Get the User Pool ID from CloudFormation stack
USER_POOL_ID=$(AWS_PROFILE=nylrad aws cloudformation describe-stacks \
    --stack-name ipdd12-data-persistence-$ENVIRONMENT \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

if [ -z "$USER_POOL_ID" ]; then
    echo "Error: Could not retrieve User Pool ID from CloudFormation stack"
    exit 1
fi

echo "User Pool ID: $USER_POOL_ID"

# Set permanent password for the user
echo "Setting permanent password for user..."
AWS_PROFILE=nylrad aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username $EMAIL \
    --password $PASSWORD \
    --permanent \
    --region us-east-1

# Confirm the user (mark as verified)
echo "Confirming user..."
AWS_PROFILE=nylrad aws cognito-idp admin-confirm-sign-up \
    --user-pool-id $USER_POOL_ID \
    --username $EMAIL \
    --region us-east-1 2>/dev/null || echo "User already confirmed (skipping)"

# Verify email attribute
echo "Verifying email attribute..."
AWS_PROFILE=nylrad aws cognito-idp admin-update-user-attributes \
    --user-pool-id $USER_POOL_ID \
    --username $EMAIL \
    --user-attributes Name=email_verified,Value=true \
    --region us-east-1

echo "✅ User setup completed successfully!"
echo "User $EMAIL is now:"
echo "  - Password set as permanent (no force change required)"
echo "  - Account confirmed and verified"
echo "  - Email attribute verified"
echo ""
echo "You can now login with:"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
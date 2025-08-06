#!/bin/bash

# IPDD12 Frontend Deployment Script
# Usage: ./deploy-frontend.sh [dev|staging|prod] [region] [domain] [certificate-arn]

set -e

# Default values
ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
DOMAIN_NAME=${3:-}
CERTIFICATE_ARN=${4:-}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 IPDD12 Frontend Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}❌ Error: Environment must be dev, staging, or prod${NC}"
    exit 1
fi

# Stack name
STACK_NAME="ipdd12-frontend-hosting-${ENVIRONMENT}"

echo -e "${YELLOW}📋 Step 1: Deploying CloudFormation stack...${NC}"

# Prepare parameters
PARAMETERS="ParameterKey=Environment,ParameterValue=${ENVIRONMENT}"

if [[ -n "$DOMAIN_NAME" ]]; then
    PARAMETERS="${PARAMETERS} ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME}"
fi

if [[ -n "$CERTIFICATE_ARN" ]]; then
    PARAMETERS="${PARAMETERS} ParameterKey=CertificateArn,ParameterValue=${CERTIFICATE_ARN}"
fi

# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file infrastructure/frontend-hosting.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides $PARAMETERS \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"
else
    echo -e "${RED}❌ CloudFormation deployment failed${NC}"
    exit 1
fi

# Get stack outputs
echo -e "${YELLOW}📋 Step 2: Getting stack outputs...${NC}"

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
    --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

ACCESS_KEY_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DeploymentAccessKeyId`].OutputValue' \
    --output text)

SECRET_ACCESS_KEY=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DeploymentSecretAccessKey`].OutputValue' \
    --output text)

echo -e "${BLUE}📝 Stack Information:${NC}"
echo -e "   S3 Bucket: ${BUCKET_NAME}"
echo -e "   CloudFront Distribution ID: ${DISTRIBUTION_ID}"
echo -e "   Website URL: ${WEBSITE_URL}"

# Check if we should build and deploy
read -p "$(echo -e ${YELLOW}"🔨 Do you want to build and deploy the frontend now? (y/N): "${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📋 Step 3: Building frontend...${NC}"
    
    cd frontend
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install
    fi
    
    # Build for production
    echo -e "${YELLOW}🔨 Building for production...${NC}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build completed successfully${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📋 Step 4: Deploying to S3...${NC}"
    
    # Deploy to S3
    aws s3 sync dist/ s3://$BUCKET_NAME --delete --region $REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Files uploaded to S3 successfully${NC}"
    else
        echo -e "${RED}❌ S3 upload failed${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📋 Step 5: Creating CloudFront invalidation...${NC}"
    
    # Create CloudFront invalidation
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text \
        --region $REGION)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ CloudFront invalidation created: ${INVALIDATION_ID}${NC}"
        echo -e "${YELLOW}⏳ Invalidation may take 5-15 minutes to complete${NC}"
    else
        echo -e "${RED}❌ CloudFront invalidation failed${NC}"
        exit 1
    fi
    
    cd ..
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📝 Important Information:${NC}"
echo -e "   Website URL: ${WEBSITE_URL}"
echo -e "   S3 Bucket: ${BUCKET_NAME}"
echo -e "   CloudFront Distribution: ${DISTRIBUTION_ID}"
echo
echo -e "${YELLOW}🔐 CI/CD Credentials (Store securely!):${NC}"
echo -e "   AWS_ACCESS_KEY_ID: ${ACCESS_KEY_ID}"
echo -e "   AWS_SECRET_ACCESS_KEY: ${SECRET_ACCESS_KEY}"
echo
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Test your website: ${WEBSITE_URL}"
echo -e "   2. Set up your CI/CD pipeline with the provided credentials"
echo -e "   3. Configure your custom domain in Route 53 (if using custom domain)"
echo
echo -e "${YELLOW}🔄 To deploy updates:${NC}"
echo -e "   npm run build && aws s3 sync dist/ s3://${BUCKET_NAME} --delete"
echo -e "   aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths '/*'"
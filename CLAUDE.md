# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the IEM IPDD 12 Backend - a church report management system built with FastAPI, deployed as AWS Lambda functions. The system manages weekly reports for church activities (célula meetings and culto celebrations) with authentication via AWS Cognito.

## Architecture

**Two-Stack Deployment Model:**
- **Data Persistence Stack**: RDS MySQL, S3 buckets, Cognito User Pool, VPC infrastructure
- **Business Logic Stack**: Lambda functions, API Gateway, IAM roles

**Key Components:**
- FastAPI application wrapped with Mangum for Lambda compatibility
- Hybrid authentication: Cognito for user management + internal JWT for API access
- Service layer pattern with dedicated service classes for business logic
- SQLAlchemy models with relationship mappings between persons, reports, participants, and attachments

## Common Commands

### Local Development
```bash
pip install -r requirements.txt
```

### Deployment
```bash
# Full deployment (data + business logic)
./deploy.sh [dev|staging|prod] [region]

# Manual deployment steps
cd infrastructure
aws cloudformation deploy --template-file data-persistence.yaml --stack-name ipdd12-data-persistence-dev --parameter-overrides Environment=dev DBPassword=PASSWORD --capabilities CAPABILITY_NAMED_IAM

cd ../
sam build
sam deploy --config-env default
```

### Database Migration (after first deployment)
```python
from sqlalchemy import create_engine
from models import Base
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
```

## Critical Implementation Details

### Authentication Flow
1. User authenticates with Cognito (username/email + password)
2. System receives Cognito tokens and creates internal JWT
3. All subsequent API calls use the internal JWT
4. JWT verification includes validation against Cognito user info

### Domain Models
- **Report Types**: `celula` (cell meetings), `culto` (celebration services)
- **Currencies**: `USD`, `BOB` (Bolivianos)
- **Participant Types**: `M` (Member), `V` (Visitor), `P` (Participant)

### File Handling
- S3 service generates unique keys for file uploads using UUID
- Attachments are linked to reports via foreign key relationships
- File metadata (name, size, content-type) stored in database

### Environment Configuration
All environments use the same Lambda function but different CloudFormation stacks. The `samconfig.toml` defines environment-specific parameters that reference the corresponding data persistence stack outputs.

### Database Relationships
- Person ← Report (via leader_person_id)
- Report → ReportParticipant (one-to-many)
- Report → ReportAttachment (one-to-many)

### API Versioning
All endpoints are prefixed with `/api/v1/` to support future versioning. The FastAPI app is configured with custom OpenAPI paths for Lambda deployment.

## Stack Dependencies

The business logic stack depends on outputs from the data persistence stack:
- `AttachmentsBucket` - S3 bucket name
- `DatabaseURL` - MySQL connection string
- `UserPoolId` and `UserPoolClientId` - Cognito configuration
- `LambdaSecurityGroupId` and `PrivateSubnetIds` - VPC networking

When modifying infrastructure, always deploy the data persistence stack first, then the business logic stack.
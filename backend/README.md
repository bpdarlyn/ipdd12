# IEM IPDD 12 Backend

Backend API for the IEM IPDD 12 report management system built with FastAPI and AWS Lambda.

## Architecture

- **Framework**: FastAPI
- **Runtime**: Python 3.9
- **Database**: MySQL (RDS)
- **Authentication**: AWS Cognito
- **File Storage**: AWS S3
- **Deployment**: AWS Lambda + API Gateway using SAM

## Project Structure

```
backend/
├── src/
│   ├── api/v1/              # API endpoints version 1
│   │   ├── endpoints/       # Route handlers
│   │   └── schemas/         # Pydantic models
│   ├── auth/                # Authentication modules
│   ├── models/              # Database models (SQLAlchemy)
│   ├── services/            # Business logic services
│   └── utils/               # Utilities and configuration
├── infrastructure/          # CloudFormation templates
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
├── template.yaml            # SAM template
└── samconfig.toml          # SAM configuration
```

## Database Schema

### Tables
- **persons**: Store person information (leaders, participants)
- **reports**: Main report information
- **report_participants**: Participants in each report
- **report_attachments**: File attachments for reports

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /login` - User login with Cognito
- `POST /logout` - User logout
- `GET /me` - Get current user info

### Persons (`/api/v1/persons`)
- `POST /` - Create new person
- `GET /` - List all persons
- `GET /{id}` - Get person by ID
- `PUT /{id}` - Update person
- `DELETE /{id}` - Delete person

### Reports (`/api/v1/reports`)
- `POST /` - Create new report
- `GET /` - List all reports
- `GET /{id}` - Get report by ID
- `PUT /{id}` - Update report
- `DELETE /{id}` - Delete report
- `POST /{id}/attachments` - Upload file attachment
- `DELETE /{id}/attachments/{attachment_id}` - Delete attachment

## Environment Variables

Configure these in the Lambda environment:

```
DATABASE_URL=mysql+pymysql://user:pass@host:port/db
S3_BUCKET=bucket-name
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
JWT_SECRET_KEY=your-secret-key
```

## Deployment

### Prerequisites
- AWS CLI configured
- SAM CLI installed
- Python 3.9

### Deploy Data Persistence Stack
```bash
cd infrastructure
aws cloudformation deploy \
  --template-file data-persistence.yaml \
  --stack-name ipdd12-data-persistence-dev \
  --parameter-overrides Environment=dev DBPassword=YourSecurePassword \
  --capabilities CAPABILITY_NAMED_IAM
```

### Deploy Business Logic Stack
```bash
cd backend
sam build
sam deploy --config-env default
```

### Database Migration
After deployment, run database migrations to create tables:

```python
from sqlalchemy import create_engine
from models import Base

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
```

## Local Development

### Setup Local Environment

1. **Get production environment variables:**
   ```bash
   cd scripts
   ./get-prod-env.sh prod
   ```

2. **Connect to VPN** (required for RDS access):
   - Import your `.ovpn` file to OpenVPN client
   - Connect to the VPN

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Running Locally

#### Option 1: Direct FastAPI (Recommended for development)
```bash
cd scripts
./run-local.sh
```
- Available at: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

#### Option 2: SAM Local (Lambda simulation)
```bash
cd scripts  
./run-sam-local.sh
```
- Available at: http://localhost:3000
- API Docs: http://localhost:3000/api/v1/docs

### Environment Files

- `.env.example` - Template for environment variables
- `.env.local` - Your local environment (auto-generated or manual)
- `env.json` - SAM local environment file

## Report Types
- `celula`: Célula meetings
- `culto`: Culto de Celebración meetings

## Currency Support
- `USD`: US Dollars
- `BOB`: Bolivianos

## Participant Types
- `M`: Miembro (Member)
- `V`: Visitas (Visitor)
- `P`: Participantes (Participant)

## Security

- All endpoints require authentication except `/health` and `/api/v1/auth/login`
- JWT tokens are issued after successful Cognito authentication
- File uploads are stored securely in S3 with unique keys
- Database connections use SSL encryption
- VPC configuration isolates Lambda functions
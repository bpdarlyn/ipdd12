#!/bin/bash

# AWS Client VPN Endpoint Creation Script
# Usage: ./create-vpn-client-endpoint.sh [environment] [region]
# Example: ./create-vpn-client-endpoint.sh prod us-east-1

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
STACK_NAME="ipdd12-data-persistence-${ENVIRONMENT}"

echo "Creating AWS Client VPN Endpoint for environment: $ENVIRONMENT in region: $REGION"

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

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed or not in PATH"
    exit 1
fi

# Create certificates directory
CERT_DIR="$HOME/aws-vpn-certs-${ENVIRONMENT}"
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

print_status "Generating certificates for VPN authentication..."

# Generate CA private key
openssl genrsa -out ca.key 2048

# Generate CA certificate
openssl req -new -x509 -days 365 -key ca.key -out ca.crt -subj "/C=US/ST=State/L=City/O=IPDD12/CN=vpn.ipdd12.${ENVIRONMENT}.local"

# Generate server private key
openssl genrsa -out server.key 2048

# Generate server certificate signing request
openssl req -new -key server.key -out server.csr -subj "/C=US/ST=State/L=City/O=IPDD12/CN=server.vpn.ipdd12.${ENVIRONMENT}.local"

# Sign server certificate with CA
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365

# Generate client private key
openssl genrsa -out client1.key 2048

# Generate client certificate signing request
openssl req -new -key client1.key -out client1.csr -subj "/C=US/ST=State/L=City/O=IPDD12/CN=client1.vpn.ipdd12.${ENVIRONMENT}.local"

# Sign client certificate with CA
openssl x509 -req -in client1.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client1.crt -days 365

print_status "Uploading certificates to AWS Certificate Manager..."

# Import server certificate to ACM
SERVER_CERT_ARN=$(AWS_PROFILE=nylrad aws acm import-certificate \
    --certificate fileb://server.crt \
    --private-key fileb://server.key \
    --certificate-chain fileb://ca.crt \
    --region $REGION \
    --query 'CertificateArn' \
    --output text)

print_status "Server certificate ARN: $SERVER_CERT_ARN"

# Import CA certificate for client authentication
CA_CERT_ARN=$(AWS_PROFILE=nylrad aws acm import-certificate \
    --certificate fileb://ca.crt \
    --private-key fileb://ca.key \
    --region $REGION \
    --query 'CertificateArn' \
    --output text)

print_status "CA certificate ARN: $CA_CERT_ARN"

print_status "Creating Client VPN Endpoint..."

# Create Client VPN Endpoint
VPN_ENDPOINT_ID=$(AWS_PROFILE=nylrad aws ec2 create-client-vpn-endpoint \
    --client-cidr-block 10.10.0.0/16 \
    --server-certificate-arn "$SERVER_CERT_ARN" \
    --authentication-options "Type=certificate-authentication,MutualAuthentication={ClientRootCertificateChainArn=$CA_CERT_ARN}" \
    --connection-log-options Enabled=false \
    --description "IPDD12 Client VPN - ${ENVIRONMENT}" \
    --region $REGION \
    --query 'ClientVpnEndpointId' \
    --output text)

print_status "VPN Endpoint ID: $VPN_ENDPOINT_ID"

print_status "Getting private subnet IDs from CloudFormation stack..."

# Get private subnet IDs from CloudFormation stack
SUBNET_IDS=$(AWS_PROFILE=nylrad aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' \
    --output text)

if [ -z "$SUBNET_IDS" ]; then
    print_error "Could not retrieve subnet IDs from stack: $STACK_NAME"
    exit 1
fi

IFS=',' read -ra SUBNET_ARRAY <<< "$SUBNET_IDS"

print_status "Associating VPN endpoint with subnets..."

# Associate VPN endpoint with each subnet
for subnet in "${SUBNET_ARRAY[@]}"; do
    ASSOCIATION_ID=$(AWS_PROFILE=nylrad aws ec2 associate-client-vpn-target-network \
        --client-vpn-endpoint-id "$VPN_ENDPOINT_ID" \
        --subnet-id "$subnet" \
        --region $REGION \
        --query 'AssociationId' \
        --output text)
    print_status "Associated with subnet $subnet (Association ID: $ASSOCIATION_ID)"
done

print_status "Creating authorization rules..."

# Authorize access to VPC
AWS_PROFILE=nylrad aws ec2 authorize-client-vpn-ingress \
    --client-vpn-endpoint-id "$VPN_ENDPOINT_ID" \
    --target-network-cidr 10.0.0.0/16 \
    --authorize-all-groups \
    --description "Allow access to VPC - ${ENVIRONMENT}" \
    --region $REGION

# Authorize internet access
AWS_PROFILE=nylrad aws ec2 authorize-client-vpn-ingress \
    --client-vpn-endpoint-id "$VPN_ENDPOINT_ID" \
    --target-network-cidr 0.0.0.0/0 \
    --authorize-all-groups \
    --description "Allow internet access - ${ENVIRONMENT}" \
    --region $REGION

print_status "Downloading VPN client configuration..."

# Export client configuration
AWS_PROFILE=nylrad aws ec2 export-client-vpn-client-configuration \
    --client-vpn-endpoint-id "$VPN_ENDPOINT_ID" \
    --output text \
    --region $REGION > "ipdd12-${ENVIRONMENT}-client-config.ovpn"

# Add CA certificate to configuration
echo "" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
echo "<ca>" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
cat ca.crt >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
echo "</ca>" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"

# Add client certificate to configuration
echo "" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
echo "<cert>" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
cat client1.crt >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
echo "</cert>" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"

# Add client private key to configuration
echo "" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
echo "<key>" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
cat client1.key >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"
echo "</key>" >> "ipdd12-${ENVIRONMENT}-client-config.ovpn"

print_status "VPN Client Endpoint created successfully!"
print_status "Environment: $ENVIRONMENT"
print_status "VPN Endpoint ID: $VPN_ENDPOINT_ID"
print_status "DNS Name: $(AWS_PROFILE=nylrad aws ec2 describe-client-vpn-endpoints --client-vpn-endpoint-ids "$VPN_ENDPOINT_ID" --region $REGION --query 'ClientVpnEndpoints[0].DnsName' --output text)"
print_status "Client Configuration File: $CERT_DIR/ipdd12-${ENVIRONMENT}-client-config.ovpn"

print_warning "To connect to the VPN:"
print_warning "1. Install an OpenVPN client (Tunnelblick for macOS, OpenVPN Connect for Windows)"
print_warning "2. Import the configuration file: ipdd12-${ENVIRONMENT}-client-config.ovpn"
print_warning "3. Connect to the VPN"

print_status "Script completed successfully!"
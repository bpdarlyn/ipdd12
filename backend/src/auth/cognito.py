import boto3
from botocore.exceptions import ClientError
from typing import Optional, Dict, Any
from utils.config import settings
import os

class CognitoService:
    def __init__(self):
        # Use AWS profile for local development
        session = boto3.Session(profile_name='nylrad') if settings.ENVIRONMENT == 'local' else boto3.Session()
        
        self.client = session.client(
            'cognito-idp',
            region_name=settings.COGNITO_REGION
        )
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        self.client_id = settings.COGNITO_CLIENT_ID

    async def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.admin_initiate_auth(
                UserPoolId=self.user_pool_id,
                ClientId=self.client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password
                }
            )
            
            if 'AuthenticationResult' in response:
                return {
                    'access_token': response['AuthenticationResult']['AccessToken'],
                    'refresh_token': response['AuthenticationResult']['RefreshToken'],
                    'id_token': response['AuthenticationResult']['IdToken'],
                    'token_type': response['AuthenticationResult']['TokenType']
                }
            return None
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code in ['NotAuthorizedException', 'UserNotFoundException']:
                return None
            raise e

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.get_user(AccessToken=access_token)
            
            user_attributes = {}
            for attr in response['UserAttributes']:
                user_attributes[attr['Name']] = attr['Value']
            
            return {
                'username': response['Username'],
                'attributes': user_attributes
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NotAuthorizedException':
                return None
            raise e

cognito_service = CognitoService()
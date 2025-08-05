import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from typing import Optional
import uuid
import os
from utils.config import settings

class S3Service:
    def __init__(self):
        # Use AWS profile for local development
        session = boto3.Session(profile_name='nylrad') if settings.ENVIRONMENT == 'local' else boto3.Session()
        
        self.s3_client = session.client('s3', region_name=settings.AWS_REGION)
        self.bucket_name = settings.S3_BUCKET

    async def upload_file(self, file: UploadFile, prefix: str = "") -> str:
        try:
            # Generate unique file key
            file_extension = os.path.splitext(file.filename)[1]
            file_key = f"{prefix}{uuid.uuid4()}{file_extension}"
            
            # Upload file to S3
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                file_key,
                ExtraArgs={
                    'ContentType': file.content_type,
                    'Metadata': {
                        'original_filename': file.filename
                    }
                }
            )
            
            return file_key
            
        except ClientError as e:
            raise Exception(f"Failed to upload file to S3: {str(e)}")

    async def delete_file(self, file_key: str) -> bool:
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return True
            
        except ClientError as e:
            raise Exception(f"Failed to delete file from S3: {str(e)}")

    async def get_file_url(self, file_key: str, expiration: int = 3600) -> str:
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            return url
            
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

s3_service = S3Service()
#!/usr/bin/env python3
"""
Database migration script for IPDD12 Backend
Usage: python run-migrations.py
"""

import sys
import os
from pathlib import Path

# Add the src directory to the Python path
backend_dir = Path(__file__).parent.parent
src_dir = backend_dir / "src"
sys.path.insert(0, str(src_dir))

from sqlalchemy import create_engine, text
from utils.config import settings
from models.base import Base
from models.person import Person
from models.report import Report, ReportParticipant, ReportAttachment

def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    try:
        # Parse database URL to get connection without database name
        url_parts = settings.DATABASE_URL.split('/')
        base_url = '/'.join(url_parts[:-1])  # Remove database name
        db_name = url_parts[-1]
        
        print(f"Creating database '{db_name}' if it doesn't exist...")
        
        # Connect without specifying database
        engine = create_engine(base_url + '/mysql')
        
        with engine.connect() as conn:
            # Create database if it doesn't exist
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
            conn.commit()
            print(f"✅ Database '{db_name}' is ready")
            
    except Exception as e:
        print(f"⚠️  Warning: Could not create database: {e}")
        print("Assuming database already exists...")

def run_migrations():
    """Run database migrations"""
    print("Starting database migrations...")
    print(f"Database URL: {settings.DATABASE_URL}")
    
    # Create database if needed
    create_database_if_not_exists()
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
    
        # Create all tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # List created tables
        with engine.connect() as conn:
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            
        print("\n📋 Created tables:")
        for table in tables:
            print(f"  - {table}")
            
        print(f"\n🎉 Migration completed successfully!")
        print(f"Total tables created: {len(tables)}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
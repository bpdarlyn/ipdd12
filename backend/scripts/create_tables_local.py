#!/usr/bin/env python3
"""
Script to create all tables using SQLAlchemy models.
This can be used for testing the schema changes locally.
"""

import os
import sys
from sqlalchemy import create_engine

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from models import Base
from utils.config import settings

def create_all_tables():
    """Create all tables based on the current models."""
    
    # For local testing, you might want to use SQLite
    database_url = "sqlite:///./test.db"  # Local SQLite for testing
    # Or use the configured DATABASE_URL if you have access
    # database_url = settings.DATABASE_URL
    
    print(f"Creating tables with database URL: {database_url}")
    
    engine = create_engine(database_url)
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # Print created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"📋 Created tables: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_all_tables()
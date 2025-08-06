#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from sqlalchemy import create_engine, text
from config.database import get_database_url

def remove_report_type_column():
    """Remove the report_type column from the reports table"""
    database_url = get_database_url()
    engine = create_engine(database_url)
    
    print("Removing report_type column from reports table...")
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'reports' 
                AND COLUMN_NAME = 'report_type'
            """))
            
            column_exists = result.fetchone()[0] > 0
            
            if column_exists:
                print("Column report_type exists, removing it...")
                
                # Drop the column
                conn.execute(text("ALTER TABLE reports DROP COLUMN report_type"))
                
                print("✅ Successfully removed report_type column from reports table")
            else:
                print("Column report_type does not exist in reports table")
            
            # Commit transaction
            trans.commit()
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"❌ Error removing column: {e}")
            raise

if __name__ == "__main__":
    remove_report_type_column()
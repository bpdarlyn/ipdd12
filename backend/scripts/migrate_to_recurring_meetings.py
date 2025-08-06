#!/usr/bin/env python3
"""
Migration script to add recurring_meetings table and update reports table structure.
This script should be run after deploying the new model definitions.
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from models import Base
from utils.config import settings

def run_migration():
    """Run the migration to add recurring_meetings and update reports table."""
    
    database_url = settings.DATABASE_URL
    engine = create_engine(database_url)
    
    print("Starting migration to add recurring_meetings functionality...")
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Step 1: Create recurring_meetings table
            print("Creating recurring_meetings table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS recurring_meetings (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    meeting_datetime DATETIME NOT NULL,
                    leader_person_id INT NOT NULL,
                    report_type ENUM('celula', 'culto') NOT NULL,
                    location VARCHAR(500) NOT NULL,
                    google_maps_link VARCHAR(1000),
                    periodicity ENUM('WEEKLY', 'MONTHLY', 'DAILY') NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (leader_person_id) REFERENCES persons(id)
                )
            """))
            
            # Step 2: Add recurring_meeting_id column to reports table
            print("Adding recurring_meeting_id column to reports table...")
            conn.execute(text("""
                ALTER TABLE reports 
                ADD COLUMN recurring_meeting_id INT,
                ADD FOREIGN KEY (recurring_meeting_id) REFERENCES recurring_meetings(id)
            """))
            
            # Step 3: Create default recurring meetings for existing reports
            print("Creating default recurring meetings for existing reports...")
            
            # Get unique combinations of leader_person_id, report_type, and location from existing reports
            result = conn.execute(text("""
                SELECT DISTINCT 
                    leader_person_id,
                    report_type,
                    location,
                    google_maps_link,
                    MIN(meeting_datetime) as first_meeting
                FROM reports 
                GROUP BY leader_person_id, report_type, location, google_maps_link
            """))
            
            recurring_meetings = result.fetchall()
            
            for rm in recurring_meetings:
                # Insert recurring meeting
                result = conn.execute(text("""
                    INSERT INTO recurring_meetings 
                    (meeting_datetime, leader_person_id, report_type, location, google_maps_link, periodicity, created_at, updated_at)
                    VALUES (:meeting_datetime, :leader_person_id, :report_type, :location, :google_maps_link, 'WEEKLY', NOW(), NOW())
                """), {
                    'meeting_datetime': rm.first_meeting,
                    'leader_person_id': rm.leader_person_id,
                    'report_type': rm.report_type,
                    'location': rm.location,
                    'google_maps_link': rm.google_maps_link
                })
                
                recurring_meeting_id = result.lastrowid
                
                # Update all reports that match this recurring meeting
                conn.execute(text("""
                    UPDATE reports 
                    SET recurring_meeting_id = :recurring_meeting_id
                    WHERE leader_person_id = :leader_person_id 
                    AND report_type = :report_type 
                    AND location = :location
                    AND (google_maps_link = :google_maps_link OR (google_maps_link IS NULL AND :google_maps_link IS NULL))
                """), {
                    'recurring_meeting_id': recurring_meeting_id,
                    'leader_person_id': rm.leader_person_id,
                    'report_type': rm.report_type,
                    'location': rm.location,
                    'google_maps_link': rm.google_maps_link
                })
            
            # Step 4: Make recurring_meeting_id NOT NULL after populating it
            print("Making recurring_meeting_id NOT NULL...")
            
            # First drop the foreign key constraint
            conn.execute(text("""
                ALTER TABLE reports 
                DROP FOREIGN KEY reports_ibfk_2
            """))
            
            # Then modify the column to be NOT NULL
            conn.execute(text("""
                ALTER TABLE reports 
                MODIFY COLUMN recurring_meeting_id INT NOT NULL
            """))
            
            # Recreate the foreign key constraint
            conn.execute(text("""
                ALTER TABLE reports 
                ADD CONSTRAINT fk_reports_recurring_meeting 
                FOREIGN KEY (recurring_meeting_id) REFERENCES recurring_meetings(id)
            """))
            
            print("Migration completed successfully!")
            trans.commit()
            
        except Exception as e:
            print(f"Migration failed: {e}")
            trans.rollback()
            raise

if __name__ == "__main__":
    run_migration()
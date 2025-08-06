#!/usr/bin/env python3
"""
Script to complete the recurring meetings migration.
This script checks the current state and completes any pending steps.
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from models import Base
from utils.config import settings

def complete_migration():
    """Complete the migration checking current state."""
    
    database_url = settings.DATABASE_URL
    engine = create_engine(database_url)
    
    print("Checking current migration state...")
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Check if recurring_meetings table exists
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            if 'recurring_meetings' not in tables:
                print("❌ recurring_meetings table does not exist")
                return False
            else:
                print("✅ recurring_meetings table exists")
            
            # Check if recurring_meeting_id column exists in reports
            reports_columns = [col['name'] for col in inspector.get_columns('reports')]
            
            if 'recurring_meeting_id' not in reports_columns:
                print("❌ recurring_meeting_id column does not exist in reports")
                return False
            else:
                print("✅ recurring_meeting_id column exists in reports")
            
            # Check if there are any NULL values in recurring_meeting_id
            result = conn.execute(text("SELECT COUNT(*) FROM reports WHERE recurring_meeting_id IS NULL"))
            null_count = result.scalar()
            
            if null_count > 0:
                print(f"⚠️  Found {null_count} reports with NULL recurring_meeting_id")
                
                # Create default recurring meetings for reports without them
                print("Creating recurring meetings for reports without them...")
                
                # Get reports without recurring_meeting_id
                result = conn.execute(text("""
                    SELECT DISTINCT 
                        leader_person_id,
                        report_type,
                        location,
                        google_maps_link,
                        MIN(meeting_datetime) as first_meeting
                    FROM reports 
                    WHERE recurring_meeting_id IS NULL
                    GROUP BY leader_person_id, report_type, location, google_maps_link
                """))
                
                null_reports = result.fetchall()
                
                for rm in null_reports:
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
                        WHERE recurring_meeting_id IS NULL
                        AND leader_person_id = :leader_person_id 
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
                    
                print(f"✅ Created {len(null_reports)} recurring meetings")
            else:
                print("✅ All reports have recurring_meeting_id assigned")
            
            # Check if the column is NOT NULL
            reports_column_info = inspector.get_columns('reports')
            recurring_meeting_col = next((col for col in reports_column_info if col['name'] == 'recurring_meeting_id'), None)
            
            if recurring_meeting_col and recurring_meeting_col.get('nullable', True):
                print("Making recurring_meeting_id NOT NULL...")
                
                # Check for foreign key constraints
                fks = inspector.get_foreign_keys('reports')
                recurring_fk = next((fk for fk in fks if 'recurring_meeting_id' in fk['constrained_columns']), None)
                
                if recurring_fk:
                    # Drop the foreign key first
                    conn.execute(text(f"ALTER TABLE reports DROP FOREIGN KEY {recurring_fk['name']}"))
                
                # Make column NOT NULL
                conn.execute(text("ALTER TABLE reports MODIFY COLUMN recurring_meeting_id INT NOT NULL"))
                
                # Recreate foreign key
                conn.execute(text("""
                    ALTER TABLE reports 
                    ADD CONSTRAINT fk_reports_recurring_meeting 
                    FOREIGN KEY (recurring_meeting_id) REFERENCES recurring_meetings(id)
                """))
                
                print("✅ Made recurring_meeting_id NOT NULL with foreign key constraint")
            else:
                print("✅ recurring_meeting_id is already NOT NULL")
            
            # Final verification
            result = conn.execute(text("SELECT COUNT(*) FROM recurring_meetings"))
            rm_count = result.scalar()
            
            result = conn.execute(text("SELECT COUNT(*) FROM reports"))
            reports_count = result.scalar()
            
            result = conn.execute(text("SELECT COUNT(*) FROM reports WHERE recurring_meeting_id IS NOT NULL"))
            linked_reports = result.scalar()
            
            print(f"\n📊 Migration Summary:")
            print(f"   • Recurring meetings: {rm_count}")
            print(f"   • Total reports: {reports_count}")
            print(f"   • Reports with recurring_meeting_id: {linked_reports}")
            
            if linked_reports == reports_count:
                print("\n🎉 Migration completed successfully!")
                trans.commit()
                return True
            else:
                print(f"\n❌ Migration incomplete: {reports_count - linked_reports} reports still unlinked")
                trans.rollback()
                return False
                
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            trans.rollback()
            raise

if __name__ == "__main__":
    complete_migration()
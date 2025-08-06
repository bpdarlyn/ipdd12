# Database Migrations with Alembic

This directory contains database migrations for the IPDD12 Backend project using Alembic.

## Configuration

Alembic is configured to:
- Auto-detect changes in SQLAlchemy models
- Use database configuration from `utils/config.py`
- Generate migrations automatically

## Common Commands

### Check current state
```bash
cd backend
alembic current
```

### View migration history
```bash
alembic history
```

### Create new migration (auto-generated)
```bash
alembic revision --autogenerate -m "description of change"
```

### Create empty migration (manual)
```bash
alembic revision -m "description of change"
```

### Apply migrations
```bash
# Apply all pending migrations
alembic upgrade head

# Apply specific migration
alembic upgrade <revision_id>

# Apply next N migrations
alembic upgrade +2
```

### Rollback migrations
```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific migration
alembic downgrade <revision_id>

# Rollback all migrations
alembic downgrade base
```

## Workflow

1. **Modify models** in `src/models/`
2. **Generate migration** automatically:
   ```bash
   alembic revision --autogenerate -m "description"
   ```
3. **Review generated migration** in `alembic/versions/`
4. **Apply migration**:
   ```bash
   alembic upgrade head
   ```

## Implemented Features

- ✅ **CASCADE constraints**: Cascade deletion configured
  - When deleting a person → deletes their recurring meetings and reports
  - When deleting a recurring meeting → deletes its reports
  - When deleting a report → deletes its participants and attachments

## File Structure

- `env.py`: Alembic configuration and DB connection
- `script.py.mako`: Template for generating new migrations  
- `versions/`: Directory with all migrations
- `../alembic.ini`: Main configuration file
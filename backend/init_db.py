from database import engine, Base

# Import models so SQLAlchemy knows about all tables.
import models


print("Creating Charter Compass database...")

Base.metadata.create_all(
    bind=engine
)

print("Database initialization complete.")
print("Database file: charter_compass.db")
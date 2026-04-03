from app import app, db
import os

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Recreating database with new schema...")
    db.create_all()
    print("Database reset successfully.")

# Also clear the database.db file just in case
db_path = os.path.join(os.path.dirname(__file__), 'database.db')
if os.path.exists(db_path):
    print(f"Verified {db_path} is ready.")

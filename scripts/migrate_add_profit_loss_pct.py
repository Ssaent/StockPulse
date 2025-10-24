import os
from sqlalchemy import create_engine, text

# Use your actual DB URI (from your config). Example for SQLite file in project root:
DB_URI = os.getenv("DATABASE_URL", "sqlite:///stockpulse.db")

engine = create_engine(DB_URI, future=True)

TABLE = "prediction_logs"
COLUMN = "profit_loss_pct"
TYPE = "FLOAT"

with engine.begin() as conn:
    cols = conn.execute(text(f"PRAGMA table_info({TABLE})")).mappings().all()
    existing = {c["name"] for c in cols}
    if COLUMN in existing:
        print("✅ Column already exists — no changes.")
    else:
        print(f"⚙️  Adding {COLUMN} to {TABLE}...")
        conn.execute(text(f"ALTER TABLE {TABLE} ADD COLUMN {COLUMN} {TYPE}"))
        print("✅ Done.")

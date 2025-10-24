# scripts/migrate_prediction_logs_using_app.py
import os
import sys
from pathlib import Path

from flask import Flask
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database.models import db  # imports your models so metadata is registered

TABLE = "prediction_logs"
MISSING_COLS = {
    "profit_loss_pct": "FLOAT",
    # Add more if needed, e.g.:
    # "accuracy_pct": "FLOAT",
    # "profit_if_followed": "FLOAT",
}

def load_config(app: Flask) -> None:
    try:
        from config import config as cfg_map  # type: ignore
        app.config.from_object(cfg_map[os.getenv("FLASK_CONFIG", "development")])
    except Exception:
        db_path = ROOT / "stockpulse.db"
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

def make_app() -> Flask:
    app = Flask(__name__)
    load_config(app)
    db.init_app(app)
    return app

def main() -> None:
    app = make_app()
    with app.app_context():
        engine: Engine = db.engine
        insp = inspect(engine)

        # Ensure base tables exist (creates missing tables only)
        db.create_all()

        if TABLE not in set(insp.get_table_names()):
            print(f"ℹ️ Table '{TABLE}' does not exist yet on {engine.url}. "
                  f"Run your app/validator once to trigger create_all(), then re-run this script.")
            return

        # Use a 2.x-style connection
        with engine.connect() as conn:
            # Read current columns
            rows = conn.execute(text(f"PRAGMA table_info({TABLE})")).mappings().all()
            existing = {r["name"] for r in rows}

            to_add = [c for c in MISSING_COLS if c not in existing]
            if not to_add:
                print("✅ No migration needed; all required columns already exist.")
                return

            print(f"⚙️ Adding columns to '{TABLE}' on {engine.url}: {to_add}")
            # Wrap ALTERs in a transaction
            with conn.begin():
                for col in to_add:
                    coltype = MISSING_COLS[col]
                    conn.execute(text(f"ALTER TABLE {TABLE} ADD COLUMN {col} {coltype}"))
            print("✅ Migration complete.")

if __name__ == "__main__":
    main()

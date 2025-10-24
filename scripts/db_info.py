# scripts/db_info.py
import os
import sys
from pathlib import Path

from flask import Flask
from sqlalchemy import inspect
from sqlalchemy.engine import Engine

# Make project root importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Import your shared db + models (this ensures tables are registered)
from backend.database.models import db  # noqa: E402


def load_config(app: Flask) -> None:
    """
    Try to load config like your app does. Falls back to a robust default.
    """
    # 1) If user has CONFIG_NAME env var (production/dev), honor it
    cfg_name = os.getenv("FLASK_CONFIG", "development")

    # 2) Try `from config import config` (common pattern in your code)
    try:
        from config import config as cfg_map  # type: ignore
        app.config.from_object(cfg_map[cfg_name])
    except Exception:
        # 3) Fallback: robust SQLite in project root (absolute path)
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
        # Ensure any missing tables are created (won't drop/alter existing)
        db.create_all()

        engine: Engine = db.engine
        insp = inspect(engine)

        print("DB URL:", engine.url)
        print("Tables:", insp.get_table_names())


if __name__ == "__main__":
    main()

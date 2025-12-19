"""
Quick database inspector to check prediction data before validation
"""
import sys
import os
import sqlite3
from datetime import datetime

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
backend_dir = os.path.join(project_root, 'backend')

# Insert backend at the beginning of sys.path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Also add project root for 'backend' module imports
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Change to backend directory
os.chdir(backend_dir)

def get_db_path():
    """Get the database path"""
    return os.path.join(project_root, 'instance', 'stockpulse.db')

def inspect_database():
    """Inspect database contents using direct SQLite queries"""
    print(f"\n{'='*60}")
    print("StockPulse Database Inspector")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    db_path = get_db_path()
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return

    print(f"📊 Using database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check total predictions
        cursor.execute("SELECT COUNT(*) FROM prediction_logs")
        total_predictions = cursor.fetchone()[0]
        print(f"📊 Total Predictions: {total_predictions}")

        # Check validated vs unvalidated
        cursor.execute("SELECT COUNT(*) FROM prediction_logs WHERE is_validated = 1")
        validated = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM prediction_logs WHERE is_validated = 0")
        unvalidated = cursor.fetchone()[0]

        print(f"✅ Validated: {validated}")
        print(f"⏳ Unvalidated: {unvalidated}")

        # Check pending validations (target date passed)
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            SELECT COUNT(*) FROM prediction_logs
            WHERE is_validated = 0 AND target_date <= ?
        """, (now,))
        pending = cursor.fetchone()[0]

        print(f"🎯 Ready for Validation: {pending}")

        if pending > 0:
            print(f"\n📋 Sample pending predictions:")
            cursor.execute("""
                SELECT symbol, exchange, target_date FROM prediction_logs
                WHERE is_validated = 0 AND target_date <= ?
                LIMIT 5
            """, (now,))
            pending_preds = cursor.fetchall()

            for pred in pending_preds:
                symbol, exchange, target_date = pred
                days_overdue = (datetime.now() - datetime.strptime(target_date, '%Y-%m-%d %H:%M:%S')).days
                print(f"  - {symbol} ({exchange}) - {target_date.split(' ')[0]} ({days_overdue}d overdue)")

        # Check users
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        print(f"\n👥 Total Users: {total_users}")

        # Check recent activity
        cursor.execute("""
            SELECT symbol, is_validated, prediction_date FROM prediction_logs
            ORDER BY prediction_date DESC LIMIT 3
        """)
        recent = cursor.fetchall()

        if recent:
            print(f"\n🕒 Recent Predictions:")
            for pred in recent:
                symbol, is_validated, pred_date = pred
                status = "✅" if is_validated else "⏳"
                print(f"  {status} {symbol} - {pred_date.split(' ')[0] if pred_date else 'N/A'}")

        print(f"\n{'='*60}")

    except Exception as e:
        print(f"❌ Database Error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        conn.close()

if __name__ == '__main__':
    inspect_database()
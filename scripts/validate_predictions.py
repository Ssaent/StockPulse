"""
Prediction Validation Script - scripts/validate_predictions.py
Run daily to validate predictions against actual market data
"""

import sys
import os
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

# Change to backend directory for Flask app context
os.chdir(backend_dir)

# Set Python path environment variable as fallback
os.environ['PYTHONPATH'] = f"{backend_dir}{os.pathsep}{project_root}"

# Now imports will work
try:
    from database.models import db
    from services.backtesting_service import BacktestingEngine
    from app import create_app
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print(f"\nCurrent directory: {os.getcwd()}")
    print(f"Backend directory: {backend_dir}")
    print(f"Python path: {sys.path[:3]}")
    sys.exit(1)


def main():
    """Validate all pending predictions"""
    print(f"\n{'='*60}")
    print(f"StockPulse Prediction Validation")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    try:
        # Create Flask app
        app = create_app()

        # Run validation in app context
        with app.app_context():
            # Initialize backtesting engine
            engine = BacktestingEngine()

            # Validate predictions
            count = engine.validate_predictions()

            # Get updated statistics
            stats = engine.get_accuracy_stats(days=30)

            # Print summary
            print(f"\n{'='*60}")
            print("VALIDATION SUMMARY")
            print(f"{'='*60}")
            print(f"Predictions Validated: {count}")

            if stats and stats.get('total', 0) > 0:
                print(f"\nOverall Statistics (Last 30 Days):")
                print(f"  Total Validated: {stats['total']}")
                print(f"  Accuracy Rate: {stats['accuracy_rate']}%")
                print(f"  Win Rate: {stats['win_rate']}%")
                print(f"  Total Profit: {stats['total_profit_pct']:+.2f}%")
                print(f"  Average Profit: {stats['avg_profit_pct']:+.2f}%")

                if stats.get('by_timeframe'):
                    print(f"\nBreakdown by Timeframe:")
                    for timeframe, tf_stats in stats['by_timeframe'].items():
                        print(f"  {timeframe.upper()}:")
                        print(f"    Total: {tf_stats['total']}")
                        print(f"    Accuracy: {tf_stats['accuracy_rate']}%")
                        print(f"    Avg Profit: {tf_stats['avg_profit']:+.2f}%")
            else:
                print("\nNo predictions validated yet")
                print("Predictions will be validated automatically after their target dates")

            print(f"{'='*60}\n")

    except Exception as e:
        print(f"\n❌ ERROR during validation:")
        print(f"{str(e)}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
"""
Simple Validation Script - scripts/validate_simple.py
Runs validation without complex import dependencies
"""

import sys
import os

# Navigate to backend directory and run from there
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
backend_dir = os.path.join(project_root, 'backend')

# Change to backend directory
os.chdir(backend_dir)

# Add to path
sys.path.insert(0, backend_dir)

# Simple validation runner
if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("StockPulse Prediction Validation")
    print("=" * 60 + "\n")

    try:
        # Import after changing directory
        from database.models import db
        from services.backtesting_service import BacktestingEngine
        from app import create_app

        # Create app
        app = create_app()

        # Run validation
        with app.app_context():
            engine = BacktestingEngine()
            count = engine.validate_predictions()
            stats = engine.get_accuracy_stats(days=30)

            # Print results
            print(f"\n{'=' * 60}")
            print("VALIDATION SUMMARY")
            print(f"{'=' * 60}")
            print(f"Predictions Validated: {count}")

            if stats and stats.get('total', 0) > 0:
                print(f"\nOverall Statistics:")
                print(f"  Total: {stats['total']}")
                print(f"  Accuracy: {stats['accuracy_rate']}%")
                print(f"  Win Rate: {stats['win_rate']}%")
                print(f"  Total Profit: {stats['total_profit_pct']:+.2f}%")
                print(f"  Avg Profit: {stats['avg_profit_pct']:+.2f}%")

                if stats.get('by_timeframe'):
                    print(f"\nBy Timeframe:")
                    for tf, tf_stats in stats['by_timeframe'].items():
                        print(f"  {tf.upper()}: {tf_stats['accuracy_rate']}% accuracy")
            else:
                print("\nNo validated predictions yet")

            print(f"{'=' * 60}\n")

    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback

        traceback.print_exc()
        sys.exit(1)
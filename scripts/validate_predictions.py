"""
Production Validation Script - Real Market Price Validation
Fetches actual prices from Yahoo Finance to validate predictions
"""

import sys
import os
import sqlite3
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
backend_dir = os.path.join(project_root, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.chdir(backend_dir)

def get_db_path():
    """Get database path"""
    return os.path.join(project_root, 'instance', 'stockpulse.db')

def get_actual_price_at_date(symbol, target_date):
    """
    Get actual stock price closest to target date
    Fixed timezone compatibility issues
    """
    try:
        # Make target_date timezone-naive for compatibility
        if hasattr(target_date, 'tzinfo') and target_date.tzinfo is not None:
            target_date = target_date.replace(tzinfo=None)
        
        # Add some buffer days around target date
        start_date = target_date - timedelta(days=3)
        end_date = target_date + timedelta(days=3)
        
        ticker = yf.Ticker(f"{symbol}.NS")
        hist = ticker.history(start=start_date, end=end_date)
        
        if hist.empty:
            print(f"❌ No price data for {symbol} around {target_date.strftime('%Y-%m-%d')}")
            return None
        
        # Convert Yahoo Finance timezone-aware index to timezone-naive
        if hasattr(hist.index, 'tz') and hist.index.tz is not None:
            hist.index = hist.index.tz_convert('UTC').tz_localize(None)
        elif hasattr(hist.index, 'tzinfo') and hist.index.tzinfo is not None:
            hist.index = hist.index.tz_convert('UTC').tz_localize(None)
        
        # Find closest date to target using total_seconds for better comparison
        hist['date_diff'] = abs((hist.index - target_date).total_seconds())
        closest_idx = hist['date_diff'].idxmin()
        closest_row = hist.loc[closest_idx]
        
        days_diff = (closest_row.name - target_date).days
        if abs(days_diff) > 3:
            print(f"⚠️  Closest price for {symbol} is {days_diff} days away")
            return None
        
        actual_price = float(closest_row['Close'])
        print(f"✅ Found price for {symbol}: ₹{actual_price:.2f} ({days_diff:+d} days from target)")
        return actual_price
        
    except Exception as e:
        print(f"❌ Error fetching price for {symbol}: {e}")
        return None

def validate_predictions():
    """Validate predictions against real market data"""
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return 0
    
    print(f"📊 Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get pending predictions
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            SELECT id, symbol, exchange, target_date, predicted_change_pct, current_price_at_prediction
            FROM prediction_logs
            WHERE is_validated = 0 AND target_date <= ?
        """, (now,))
        
        pending = cursor.fetchall()
        print(f"🎯 Found {len(pending)} predictions ready for validation")
        
        validated_count = 0
        
        for pred in pending:
            pred_id, symbol, exchange, target_date_str, predicted_change, current_price = pred
            
            # Parse target date with microseconds handling
            try:
                # Try with microseconds first (SQLite format)
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d %H:%M:%S.%f')
            except ValueError:
                # Fallback without microseconds
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d %H:%M:%S')
            
            try:
                # Get actual price at target date
                actual_price = get_actual_price_at_date(symbol, target_date)
                
                if actual_price is None:
                    print(f"⚠️  Skipping {symbol} - no price data")
                    continue
                
                # Calculate actual change
                actual_change = ((actual_price - current_price) / current_price) * 100
                
                # Determine accuracy (direction match)
                predicted_direction = 1 if predicted_change > 0 else -1
                actual_direction = 1 if actual_change > 0 else -1
                is_accurate = predicted_direction == actual_direction
                
                # Calculate profit/loss if followed prediction
                # Using 5% stop loss as example
                if is_accurate:
                    profit_pct = actual_change
                else:
                    profit_pct = max(actual_change, -5.0)  # Stop loss at -5%
                
                # Update the prediction
                cursor.execute("""
                    UPDATE prediction_logs
                    SET actual_price = ?,
                        actual_change_pct = ?,
                        is_accurate = ?,
                        profit_loss_pct = ?,
                        is_validated = 1,
                        validated_at = ?
                    WHERE id = ?
                """, (actual_price, round(actual_change, 2), is_accurate, round(profit_pct, 2), now, pred_id))
                
                accuracy_icon = "✅" if is_accurate else "❌"
                print(f"{accuracy_icon} {symbol}: Predicted {predicted_change:+.2f}%, Actual {actual_change:+.2f}%")
                
                validated_count += 1
                
            except Exception as e:
                print(f"❌ Error validating {symbol}: {e}")
                continue
        
        conn.commit()
        return validated_count
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        conn.rollback()
        return 0
        
    finally:
        conn.close()

def get_stats():
    """Get accuracy statistics"""
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        return None
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get total validated predictions
        cursor.execute("SELECT COUNT(*) FROM prediction_logs WHERE is_validated = 1")
        total = cursor.fetchone()[0]
        
        if total == 0:
            return {'total': 0, 'accuracy_rate': 0, 'win_rate': 0, 'avg_profit': 0}
        
        # Get accuracy rate
        cursor.execute("SELECT COUNT(*) FROM prediction_logs WHERE is_validated = 1 AND is_accurate = 1")
        accurate = cursor.fetchone()[0]
        
        # Get win rate (profitable predictions)
        cursor.execute("SELECT COUNT(*) FROM prediction_logs WHERE is_validated = 1 AND profit_loss_pct > 0")
        profitable = cursor.fetchone()[0]
        
        # Get average profit
        cursor.execute("SELECT AVG(profit_loss_pct) FROM prediction_logs WHERE is_validated = 1")
        avg_profit = cursor.fetchone()[0] or 0
        
        # Get timeframe breakdown
        cursor.execute("""
            SELECT timeframe, COUNT(*), 
                   SUM(CASE WHEN is_accurate = 1 THEN 1 ELSE 0 END),
                   AVG(profit_loss_pct)
            FROM prediction_logs 
            WHERE is_validated = 1 
            GROUP BY timeframe
        """)
        timeframe_stats = cursor.fetchall()
        
        return {
            'total': total,
            'accurate': accurate,
            'accuracy_rate': round(accurate / total * 100, 1),
            'win_rate': round(profitable / total * 100, 1),
            'avg_profit': round(avg_profit, 2),
            'timeframe_breakdown': {
                row[0]: {
                    'total': row[1],
                    'accurate': row[2],
                    'accuracy_rate': round(row[2] / row[1] * 100, 1) if row[1] > 0 else 0,
                    'avg_profit': round(row[3] or 0, 2)
                }
                for row in timeframe_stats
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
        return None
        
    finally:
        conn.close()

def main():
    """Main validation function"""
    print(f"\n{'='*60}")
    print(f"StockPulse Real Market Validation")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")
    
    try:
        # Validate predictions against real market data
        count = validate_predictions()
        
        # Get statistics
        stats = get_stats()
        
        # Print summary
        print(f"\n{'='*60}")
        print("VALIDATION SUMMARY")
        print(f"{'='*60}")
        print(f"Predictions Validated: {count}")
        
        if stats and stats.get('total', 0) > 0:
            print(f"\nOverall Statistics:")
            print(f"  Total Validated: {stats['total']}")
            print(f"  Accuracy Rate: {stats['accuracy_rate']}%")
            print(f"  Win Rate: {stats['win_rate']}%")
            print(f"  Average Profit: {stats['avg_profit']:+.2f}%")
            
            if 'timeframe_breakdown' in stats:
                print(f"\nBy Timeframe:")
                for tf, tf_stats in stats['timeframe_breakdown'].items():
                    print(f"  {tf.upper():8}: {tf_stats['accuracy_rate']}% accuracy, {tf_stats['avg_profit']:+.2f}% avg profit")
        else:
            print("\nNo validated predictions yet")
            
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ ERROR during validation:")
        print(f"{str(e)}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
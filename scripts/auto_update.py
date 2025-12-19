"""
Automated model update script
Runs weekly to retrain models with latest data
"""

import sys
import os
from datetime import datetime
import logging

# Setup logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, f'model_update_{datetime.now().strftime("%Y%m%d")}.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend'))

from data_fetchers.price_fetcher import RealTimePriceFetcher
from data_fetchers.live_stock_fetcher import LiveStockFetcher
from ai_engine.feature_engineer import FeatureEngineer
from ai_engine.advanced_lstm import AdvancedStockPredictor
import yfinance as yf


class AutoUpdater:
    """Automatically update models with fresh data"""

    def __init__(self, model_dir='data/models'):
        self.model_dir = model_dir
        self.stock_fetcher = LiveStockFetcher()
        self.price_fetcher = RealTimePriceFetcher()
        self.feature_engineer = FeatureEngineer()

        self.updated_count = 0
        self.failed_count = 0
        self.skipped_count = 0

    def get_existing_models(self):
        """Get list of stocks that already have trained models"""
        if not os.path.exists(self.model_dir):
            return []

        models = []
        for file in os.listdir(self.model_dir):
            if file.endswith('_model.h5'):
                symbol = file.replace('_model.h5', '')
                models.append(symbol)

        return models

    def get_top_stocks_dynamic(self, limit=50):
        """Get top stocks by market cap and volume"""
        logging.info("Fetching top stocks dynamically...")

        all_stocks = self.stock_fetcher.fetch_nse_stocks()
        stock_metrics = []

        for stock in all_stocks[:200]:
            try:
                symbol = stock['symbol']
                ticker = yf.Ticker(f"{symbol}.NS")
                info = ticker.info

                market_cap = info.get('marketCap', 0)
                volume = info.get('volume', 0)

                if market_cap > 0 and volume > 100000:
                    stock_metrics.append({
                        'symbol': symbol,
                        'market_cap': market_cap,
                        'volume': volume,
                        'score': (market_cap / 1e9) + (volume / 1000)
                    })
            except:
                continue

        stock_metrics.sort(key=lambda x: x['score'], reverse=True)
        return [s['symbol'] for s in stock_metrics[:limit]]

    def should_update_model(self, symbol):
        """Check if model needs updating (older than 7 days)"""
        model_file = os.path.join(self.model_dir, f'{symbol}_model.h5')

        if not os.path.exists(model_file):
            return True

        # Check file modification time
        mod_time = os.path.getmtime(model_file)
        days_old = (datetime.now().timestamp() - mod_time) / 86400

        return days_old >= 7

    def update_model(self, symbol):
        """Update model with latest data"""
        logging.info(f"Updating model for {symbol}...")

        try:
            # Fetch latest data
            hist_data = self.price_fetcher.get_historical_data(symbol, 'NSE', period='5y')

            if hist_data is None or len(hist_data) < 500:
                logging.warning(f"Insufficient data for {symbol}")
                self.failed_count += 1
                return False

            # Feature engineering
            hist_data = self.feature_engineer.create_features(hist_data)
            hist_data = hist_data.dropna()

            if len(hist_data) < 200:
                logging.warning(f"Insufficient data after feature engineering for {symbol}")
                self.failed_count += 1
                return False

            # Get features
            feature_cols = self.feature_engineer.select_features()
            feature_cols = [f for f in feature_cols if f in hist_data.columns]

            # Train model
            predictor = AdvancedStockPredictor()
            predictor.train(hist_data, feature_cols, validation_split=0.2)
            predictor.save_model(symbol)

            logging.info(f"✅ Model updated for {symbol}")
            self.updated_count += 1
            return True

        except Exception as e:
            logging.error(f"Failed to update {symbol}: {e}")
            self.failed_count += 1
            return False

    def run_update(self, mode='existing'):
        """
        Run model updates
        Modes:
        - 'existing': Update only existing models
        - 'top50': Update top 50 stocks
        - 'top100': Update top 100 stocks
        """
        logging.info("=" * 70)
        logging.info("StockPulse Auto-Update Starting")
        logging.info(f"Mode: {mode}")
        logging.info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logging.info("=" * 70)

        if mode == 'existing':
            # Update only existing models
            stocks = self.get_existing_models()
            logging.info(f"Found {len(stocks)} existing models")
        elif mode == 'top50':
            stocks = self.get_top_stocks_dynamic(50)
            logging.info(f"Selected top 50 stocks")
        elif mode == 'top100':
            stocks = self.get_top_stocks_dynamic(100)
            logging.info(f"Selected top 100 stocks")
        else:
            logging.error(f"Invalid mode: {mode}")
            return

        # Check which models need updating
        to_update = []
        for symbol in stocks:
            if self.should_update_model(symbol):
                to_update.append(symbol)
            else:
                self.skipped_count += 1
                logging.info(f"Skipping {symbol} (updated recently)")

        logging.info(f"\n{len(to_update)} models need updating")

        # Update models
        for i, symbol in enumerate(to_update, 1):
            logging.info(f"\n[{i}/{len(to_update)}] Updating {symbol}...")
            self.update_model(symbol)

        # Summary
        logging.info("\n" + "=" * 70)
        logging.info("UPDATE SUMMARY")
        logging.info("=" * 70)
        logging.info(f"Total stocks checked: {len(stocks)}")
        logging.info(f"[OK] Updated: {self.updated_count}")
        logging.info(f"[SKIP] Skipped (recent): {self.skipped_count}")
        logging.info(f"[FAIL] Failed: {self.failed_count}")
        logging.info(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logging.info("=" * 70)


def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(description='Auto-update StockPulse models')
    parser.add_argument(
        '--mode',
        choices=['existing', 'top50', 'top100'],
        default='existing',
        help='Update mode (default: existing)'
    )

    args = parser.parse_args()

    updater = AutoUpdater()
    updater.run_update(mode=args.mode)


if __name__ == '__main__':
    main()
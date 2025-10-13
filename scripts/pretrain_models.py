"""
Pre-train models for popular stocks
Automatically fetches top stocks by market cap and volume - NO HARDCODING
Run this once after deployment, then weekly/monthly to update models
"""

import sys
import os
from datetime import datetime
import yfinance as yf

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend'))

from data_fetchers.price_fetcher import RealTimePriceFetcher
from data_fetchers.live_stock_fetcher import LiveStockFetcher
from ai_engine.feature_engineer import FeatureEngineer
from ai_engine.advanced_lstm import AdvancedStockPredictor
from ai_engine.technical_analyzer import TechnicalAnalyzer


class ModelPretrainer:
    """Pre-train models for top stocks dynamically"""

    def __init__(self):
        self.stock_fetcher = LiveStockFetcher()
        self.price_fetcher = RealTimePriceFetcher()
        self.feature_engineer = FeatureEngineer()
        self.tech_analyzer = TechnicalAnalyzer()

        self.success_count = 0
        self.failed_count = 0
        self.failed_stocks = []

    def get_top_stocks(self, limit=50):
        """Get top stocks by market cap and volume dynamically"""

        print("Fetching all NSE stocks...")
        all_stocks = self.stock_fetcher.fetch_nse_stocks()

        print(f"Analyzing {len(all_stocks)} stocks to find top performers...")

        stock_metrics = []

        for i, stock in enumerate(all_stocks[:200]):  # Check top 200 for speed
            try:
                symbol = stock['symbol']

                # Get basic info
                ticker = yf.Ticker(f"{symbol}.NS")
                info = ticker.info

                market_cap = info.get('marketCap', 0)
                volume = info.get('volume', 0)

                # Only include liquid stocks
                if market_cap > 0 and volume > 100000:
                    stock_metrics.append({
                        'symbol': symbol,
                        'name': stock['name'],
                        'market_cap': market_cap,
                        'volume': volume,
                        'score': (market_cap / 1e9) + (volume / 1000)  # Combined score
                    })

                if (i + 1) % 20 == 0:
                    print(f"Analyzed {i + 1} stocks...")

            except Exception as e:
                continue

        # Sort by score (market cap + volume)
        stock_metrics.sort(key=lambda x: x['score'], reverse=True)

        top_stocks = [s['symbol'] for s in stock_metrics[:limit]]

        print(f"\n✅ Selected top {len(top_stocks)} stocks by market cap and liquidity")
        print("\nTop 10:")
        for i, s in enumerate(stock_metrics[:10], 1):
            print(f"{i}. {s['symbol']}: Market Cap ₹{s['market_cap'] / 1e9:.1f}B")

        return top_stocks

    def train_stock_model(self, symbol, exchange='NSE'):
        """Train model for a specific stock"""

        print(f"\n{'=' * 70}")
        print(f"Training model for {symbol}")
        print(f"{'=' * 70}")

        try:
            # Check if model already exists
            predictor = AdvancedStockPredictor()
            if predictor.load_model(symbol):
                print(f"✅ Model already exists for {symbol}, skipping...")
                self.success_count += 1
                return True

            # Fetch historical data
            print(f"Fetching 5 years of data for {symbol}...")
            hist_data = self.price_fetcher.get_historical_data(symbol, exchange, period='5y')

            if hist_data is None or len(hist_data) < 500:
                print(f"❌ Insufficient data for {symbol}: {len(hist_data) if hist_data is not None else 0} days")
                self.failed_count += 1
                self.failed_stocks.append(symbol)
                return False

            print(f"✅ Data fetched: {len(hist_data)} days")

            # Feature engineering
            print("Creating features...")
            hist_data = self.feature_engineer.create_features(hist_data)
            hist_data = hist_data.dropna()

            if len(hist_data) < 200:
                print(f"❌ Insufficient data after feature engineering: {len(hist_data)}")
                self.failed_count += 1
                self.failed_stocks.append(symbol)
                return False

            print(f"✅ Features created: {len(hist_data)} clean data points")

            # Get feature columns
            feature_cols = self.feature_engineer.select_features()
            feature_cols = [f for f in feature_cols if f in hist_data.columns]

            print(f"Training with {len(feature_cols)} features...")

            # Train model
            predictor.train(hist_data, feature_cols, validation_split=0.2)
            predictor.save_model(symbol)

            print(f"✅ Model trained and saved for {symbol}")
            self.success_count += 1
            return True

        except Exception as e:
            print(f"❌ Error training {symbol}: {e}")
            self.failed_count += 1
            self.failed_stocks.append(symbol)
            return False

    def pretrain_all(self, top_n=50):
        """Pre-train models for top N stocks"""

        print("=" * 70)
        print("StockPulse Model Pre-training")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)

        # Get top stocks dynamically
        top_stocks = self.get_top_stocks(limit=top_n)

        print(f"\nStarting training for {len(top_stocks)} stocks...")
        print("This will take 1-3 hours depending on your system.\n")

        start_time = datetime.now()

        for i, symbol in enumerate(top_stocks, 1):
            print(f"\n[{i}/{len(top_stocks)}] Processing {symbol}...")
            self.train_stock_model(symbol)

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds() / 60

        # Summary
        print("\n" + "=" * 70)
        print("TRAINING SUMMARY")
        print("=" * 70)
        print(f"Total stocks: {len(top_stocks)}")
        print(f"✅ Successful: {self.success_count}")
        print(f"❌ Failed: {self.failed_count}")
        print(f"Time taken: {duration:.1f} minutes")

        if self.failed_stocks:
            print(f"\nFailed stocks:")
            for stock in self.failed_stocks:
                print(f"  - {stock}")

        print("\n✅ Pre-training complete!")
        print(f"Models saved in: data/models/")
        print(f"Finished at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")


def main():
    """Main execution"""
    print("\nStockPulse Model Pre-trainer")
    print("This will automatically train models for top stocks\n")

    choice = input("How many top stocks to pre-train? (10/50/100): ").strip()

    try:
        num_stocks = int(choice)
        if num_stocks not in [10, 50, 100]:
            print("Invalid choice. Using 50 stocks.")
            num_stocks = 50
    except:
        print("Invalid input. Using 50 stocks.")
        num_stocks = 50

    confirm = input(f"\nThis will train {num_stocks} models (takes 1-3 hours). Continue? (yes/no): ")

    if confirm.lower() != 'yes':
        print("Cancelled.")
        return

    pretrainer = ModelPretrainer()
    pretrainer.pretrain_all(top_n=num_stocks)


if __name__ == '__main__':
    main()
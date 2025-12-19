"""Run this weekly to update models with new data"""
import os
import sys

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))

from pretrain_models import ModelPretrainer

if __name__ == '__main__':
    print("Weekly Model Update")
    pretrainer = ModelPretrainer()

    # Get top 50 stocks (will retrain if patterns changed)
    pretrainer.pretrain_all(top_n=50)
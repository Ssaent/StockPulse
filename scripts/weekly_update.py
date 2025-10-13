"""Run this weekly to update models with new data"""
import os
from pretrain_models import ModelPretrainer

if __name__ == '__main__':
    print("Weekly Model Update")
    pretrainer = ModelPretrainer()

    # Get top 50 stocks (will retrain if patterns changed)
    pretrainer.pretrain_all(top_n=50)
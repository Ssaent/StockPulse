import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Target, Award, DollarSign, RefreshCw, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import api from '../services/api';

export default function Backtesting() {
  const [stats, setStats] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [selectedTimeframe, selectedDays]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get stats
      const params = new URLSearchParams();
      if (selectedTimeframe !== 'all') params.append('timeframe', selectedTimeframe);
      params.append('days', selectedDays);

      const [statsRes, predictionsRes] = await Promise.all([
        api.get(`/backtest/stats?${params.toString()}`),
        api.get('/backtest/recent?limit=20')
      ]);

      setStats(statsRes.data);
      setRecentPredictions(predictionsRes.data.predictions || []);
    } catch (error) {
      console.error('Error loading backtest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateNow = async () => {
    setValidating(true);
    try {
      const response = await api.post('/backtest/validate');
      alert(`Validated ${response.data.count} predictions!`);
      loadData(); // Reload data
    } catch (error) {
      alert('Failed to validate predictions');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const accuracyChartData = stats?.by_timeframe ? {
    labels: Object.keys(stats.by_timeframe),
    datasets: [{
      label: 'Accuracy Rate (%)',
      data: Object.values(stats.by_timeframe).map(tf => tf.accuracy_rate),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Accuracy by Timeframe',
        color: '#fff',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI Accuracy Tracker</h1>
                  <p className="text-sm text-gray-400">Backtesting & Performance</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleValidateNow}
              disabled={validating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${validating ? 'animate-spin' : ''}`} />
              <span>Validate Now</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Time Period Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[7, 30, 90, 180].map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedDays === days
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'glass hover:bg-white/10'
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        {stats && stats.total > 0 ? (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Total Predictions</div>
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-xs text-gray-500 mt-1">Last {stats.period_days} days</div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Accuracy Rate</div>
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400">{stats.accuracy_rate}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.accurate} of {stats.total} accurate
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400">{stats.win_rate}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.winning_trades} winning trades
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Total Return</div>
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <div className={`text-3xl font-bold ${stats.total_profit_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.total_profit_pct >= 0 ? '+' : ''}{stats.total_profit_pct}%
                </div>
                <div className="text-xs text-gray-500 mt-1">If followed all signals</div>
              </div>
            </div>

            {/* Accuracy Chart */}
            {accuracyChartData && (
              <div className="card mb-8">
                <h3 className="text-xl font-bold mb-4">Performance by Timeframe</h3>
                <div className="h-80">
                  <Line data={accuracyChartData} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Timeframe Breakdown */}
            <div className="card mb-8">
              <h3 className="text-xl font-bold mb-4">Detailed Breakdown</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(stats.by_timeframe || {}).map(([timeframe, data]) => (
                  <div key={timeframe} className="glass p-4 rounded-lg">
                    <div className="text-sm text-gray-400 uppercase mb-2">{timeframe}</div>
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {data.accuracy_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.accurate}/{data.total} accurate
                    </div>
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${data.accuracy_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Predictions */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Recent Validated Predictions</h3>
                <span className="text-sm text-gray-400">{recentPredictions.length} predictions</span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentPredictions.map((pred) => (
                  <div
                    key={pred.id}
                    className={`p-4 glass rounded-lg border ${
                      pred.is_accurate 
                        ? 'border-green-500/30 bg-green-500/10' 
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold">{pred.symbol}</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {pred.timeframe}
                          </span>
                          {pred.is_accurate ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className={`text-sm font-semibold ${pred.is_accurate ? 'text-green-400' : 'text-red-400'}`}>
                            {pred.accuracy_pct.toFixed(1)}% accurate
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Predicted</div>
                            <div className="font-semibold">₹{pred.predicted_price.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              {pred.predicted_change_pct >= 0 ? '+' : ''}{pred.predicted_change_pct.toFixed(2)}%
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-400">Actual</div>
                            <div className="font-semibold">₹{pred.actual_price.toFixed(2)}</div>
                            <div className={`text-xs ${pred.actual_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pred.actual_change_pct >= 0 ? '+' : ''}{pred.actual_change_pct.toFixed(2)}%
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-400">Confidence</div>
                            <div className="font-semibold">{pred.confidence}%</div>
                            <div className="text-xs text-gray-500">
                              {new Date(pred.prediction_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {pred.profit_if_followed !== null && (
                        <div className="text-right ml-4">
                          <div className="text-xs text-gray-400">If Followed</div>
                          <div className={`text-xl font-bold ${pred.profit_if_followed >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pred.profit_if_followed >= 0 ? '+' : ''}{pred.profit_if_followed.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center py-16">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Predictions Validated Yet</h3>
            <p className="text-gray-400 mb-6">
              Start analyzing stocks to build prediction history.<br/>
              Predictions will be automatically validated after their target dates.
            </p>
            <Link to="/dashboard" className="btn-primary inline-block">
              Analyze Stocks
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
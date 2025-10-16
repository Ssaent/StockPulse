import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign, BarChart3, Clock, Gift, Award, Briefcase } from 'lucide-react';
import { corporateAPI } from '../services/api';

export default function CorporateActions({ symbol, exchange = 'NSE' }) {
  const [actions, setActions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadActions();
  }, [symbol]);

  const loadActions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await corporateAPI.getActions(symbol, exchange);
      setActions(response.data.actions);
    } catch (err) {
      console.error('Error loading corporate actions:', err);
      setError('Failed to load corporate actions');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type) => {
    if (type.includes('Dividend')) return <Gift className="w-5 h-5" />;
    if (type.includes('Split')) return <BarChart3 className="w-5 h-5" />;
    if (type.includes('Earnings')) return <Award className="w-5 h-5" />;
    return <Calendar className="w-5 h-5" />;
  };

  const getActionColor = (type, status) => {
    if (status === 'Upcoming') return {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20'
    };
    if (type.includes('Dividend')) return {
      border: 'border-green-500/30',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      iconBg: 'bg-green-500/20'
    };
    if (type.includes('Split')) return {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/20'
    };
    if (type.includes('Earnings')) return {
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      iconBg: 'bg-purple-500/20'
    };
    return {
      border: 'border-gray-500/30',
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      iconBg: 'bg-gray-500/20'
    };
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-purple-400" />
          <h4 className="text-xl font-bold">Corporate Actions</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-white/10 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-purple-400" />
          <h4 className="text-xl font-bold">Corporate Actions</h4>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const allActions = [
    ...(actions?.dividends || []),
    ...(actions?.splits || []),
    ...(actions?.earnings || []),
    ...(actions?.upcoming_events || [])
  ];

  const upcomingCount = actions?.upcoming_events?.length || 0;
  const dividendCount = actions?.dividends?.length || 0;
  const splitCount = actions?.splits?.length || 0;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Corporate Actions</h4>
            <p className="text-sm text-gray-400">{allActions.length} total events</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass p-3 rounded-lg text-center">
          <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-400">{upcomingCount}</div>
          <div className="text-xs text-gray-400">Upcoming</div>
        </div>
        <div className="glass p-3 rounded-lg text-center">
          <Gift className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-400">{dividendCount}</div>
          <div className="text-xs text-gray-400">Dividends</div>
        </div>
        <div className="glass p-3 rounded-lg text-center">
          <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-blue-400">{splitCount}</div>
          <div className="text-xs text-gray-400">Splits</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['all', 'upcoming', 'dividends', 'splits', 'earnings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'glass hover:bg-white/10'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline View */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {/* Upcoming Events */}
        {(activeTab === 'all' || activeTab === 'upcoming') && actions?.upcoming_events?.length > 0 && (
          <div>
            {activeTab === 'all' && (
              <h5 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming Events
              </h5>
            )}
            {actions.upcoming_events.map((event, index) => {
              const colors = getActionColor(event.type, event.status);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${colors.border} ${colors.bg} mb-2 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                      <div className={colors.text}>
                        {getActionIcon(event.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h6 className="font-bold">{event.type}</h6>
                        <span className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {event.status}
                        </span>
                      </div>
                      {event.amount && (
                        <div className="text-2xl font-bold text-green-400 mb-1">
                          ₹{event.amount.toFixed(2)}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dividends */}
        {(activeTab === 'all' || activeTab === 'dividends') && actions?.dividends?.length > 0 && (
          <div>
            {activeTab === 'all' && (
              <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Dividend History
              </h5>
            )}
            {actions.dividends.map((dividend, index) => {
              const colors = getActionColor(dividend.type, dividend.status);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${colors.border} ${colors.bg} mb-2 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                      <Gift className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-400">
                            ₹{dividend.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">{dividend.relative_time}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-300">
                            {new Date(dividend.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className={`text-xs ${colors.text}`}>{dividend.status}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stock Splits */}
        {(activeTab === 'all' || activeTab === 'splits') && actions?.splits?.length > 0 && (
          <div>
            {activeTab === 'all' && (
              <h5 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Stock Split History
              </h5>
            )}
            {actions.splits.map((split, index) => {
              const colors = getActionColor(split.type, split.status);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${colors.border} ${colors.bg} mb-2 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                      <BarChart3 className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-bold text-blue-400">{split.ratio}</div>
                          <div className="text-sm text-gray-400">{split.relative_time}</div>
                        </div>
                        <div className="text-sm text-gray-300">
                          {new Date(split.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Earnings */}
        {(activeTab === 'all' || activeTab === 'earnings') && actions?.earnings?.length > 0 && (
          <div>
            {activeTab === 'all' && (
              <h5 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Earnings Calendar
              </h5>
            )}
            {actions.earnings.map((earning, index) => {
              const colors = getActionColor(earning.type, earning.status);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${colors.border} ${colors.bg} mb-2 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                      <Award className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-purple-400">{earning.quarter}</div>
                          <div className="text-xs text-gray-400">{earning.status}</div>
                        </div>
                        <div className="text-sm text-gray-300">
                          {new Date(earning.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {allActions.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No corporate actions available for {symbol}</p>
          </div>
        )}
      </div>
    </div>
  );
}
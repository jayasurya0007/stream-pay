import { DollarSign, Gift, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DashboardStats {
  totalEarnings: number;
  earningsToday: number;
  earningsPerSecond: number;
  totalViewers: number;
  peakViewers: number;
  giftsReceived: number;
  streamDuration: number;
}

const CreatorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 156.43,
    earningsToday: 23.87,
    earningsPerSecond: 0.05,
    totalViewers: 1247,
    peakViewers: 1582,
    giftsReceived: 89,
    streamDuration: 7320, // seconds
  });

  const [realtimeEarnings, setRealtimeEarnings] = useState(stats.earningsToday);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeEarnings(prev => prev + stats.earningsPerSecond);
      setStats(prev => ({
        ...prev,
        streamDuration: prev.streamDuration + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.earningsPerSecond]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: number;
    color: string;
  }> = ({ title, value, subtitle, icon, trend, color }) => (
    <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-8 border border-yellow-600/20 shadow-2xl hover:border-yellow-600/40 transition-all duration-300 hover:shadow-yellow-500/10">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color} shadow-lg`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-bold ${
            trend >= 0 ? 'bg-green-900/40 text-green-400 border border-green-500/30' : 'bg-red-900/40 text-red-400 border border-red-500/30'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span>{trend >= 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
        <p className="text-yellow-300 text-lg font-semibold">{title}</p>
        {subtitle && (
          <p className="text-yellow-400/70 text-sm mt-2 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-100 mb-4 flex items-center justify-center space-x-3">
            <span>Creator</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-center text-lg">Real-time analytics for your stream</p>
        </div>

        {/* Live status */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-gray-100 font-bold text-xl">Live</span>
                </div>
                <div className="h-6 w-px bg-gray-700"></div>
                <span className="text-gray-400 font-medium">Duration: {formatDuration(stats.streamDuration)}</span>
              </div>
              <div className="text-right">
                <div className="text-gray-100 font-bold text-2xl">{stats.totalViewers.toLocaleString()} viewers</div>
                <div className="text-gray-400 text-sm font-medium">Peak: {stats.peakViewers.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Today's Earnings"
            value={`$${realtimeEarnings.toFixed(2)}`}
            subtitle={`$${stats.earningsPerSecond.toFixed(3)}/second`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            trend={12.5}
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          
          <StatCard
            title="Total Earnings"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            subtitle="All time"
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="bg-gradient-to-br from-blue-500 to-cyan-600"
          />
          
          <StatCard
            title="Current Viewers"
            value={stats.totalViewers.toLocaleString()}
            subtitle={`Peak: ${stats.peakViewers.toLocaleString()}`}
            icon={<Users className="w-6 h-6 text-white" />}
            trend={8.2}
            color="bg-gradient-to-br from-purple-500 to-pink-600"
          />
          
          <StatCard
            title="Gifts Received"
            value={stats.giftsReceived}
            subtitle="This stream"
            icon={<Gift className="w-6 h-6 text-white" />}
            trend={15.7}
            color="bg-gradient-to-br from-yellow-500 to-orange-600"
          />
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Earnings chart placeholder */}
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-8 border border-yellow-600/20 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Earnings Over Time</h3>
            <div className="h-80 bg-gradient-to-br from-yellow-900/20 via-orange-900/20 to-red-900/20 rounded-2xl flex items-center justify-center border border-yellow-600/20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-yellow-300 font-medium">Chart visualization would go here</p>
              </div>
            </div>
          </div>

          {/* Recent gifts */}
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-8 border border-yellow-600/20 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Gifts</h3>
            <div className="space-y-4">
              {[
                { user: 'GiftGiver123', gift: '💎 Diamond', amount: '$1.00', time: '2m ago' },
                { user: 'StreamFan', gift: '⚡ Lightning', amount: '$0.75', time: '5m ago' },
                { user: 'HeartSender', gift: '❤️ Heart', amount: '$0.01', time: '8m ago' },
                { user: 'RoseLover', gift: '🌹 Rose', amount: '$0.10', time: '12m ago' },
              ].map((gift, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 rounded-xl border border-yellow-600/20 hover:border-yellow-600/40 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg">
                      {gift.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{gift.user}</p>
                      <p className="text-yellow-300 text-sm font-medium">sent {gift.gift}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg">{gift.amount}</p>
                    <p className="text-yellow-400/70 text-sm font-medium">{gift.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
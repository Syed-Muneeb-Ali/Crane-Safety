'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  total_incidents: number;
  red_zone_events: number;
  yellow_zone_events: number;
  active_cranes: number;
  incidents_trend: Array<{ date: string; count: number }>;
  event_breakdown: Array<{ type: string; count: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetchWithAuth('/api/analytics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div>Failed to load dashboard</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-display font-bold mb-6 text-surface-900">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Incidents', value: stats.total_incidents, color: 'text-surface-900' },
            { label: 'Red Zone Events', value: stats.red_zone_events, color: 'text-red-600' },
            { label: 'Yellow Zone Events', value: stats.yellow_zone_events, color: 'text-amber-600' },
            { label: 'Active Cranes', value: stats.active_cranes, color: 'text-primary-600' },
          ].map((card, i) => (
            <div
              key={card.label}
              className="card px-5 py-4 animate-fade-in-up flex flex-col justify-center min-h-0"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
            >
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {card.label}
              </h3>
              <p className={`text-2xl font-bold font-display leading-tight ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            <h3 className="text-lg font-semibold mb-4 text-surface-900">Incidents Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.incidents_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '280ms', animationFillMode: 'backwards' }}>
            <h3 className="text-lg font-semibold mb-4 text-surface-900">Event Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.event_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count">
                  {stats.event_breakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.type === 'red' ? '#ef4444' : '#eab308'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}


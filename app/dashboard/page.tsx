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
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Total Incidents
            </h3>
            <p className="text-3xl font-bold">{stats.total_incidents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Red Zone Events
            </h3>
            <p className="text-3xl font-bold text-red-600">
              {stats.red_zone_events}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Yellow Zone Events
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.yellow_zone_events}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Active Cranes
            </h3>
            <p className="text-3xl font-bold">{stats.active_cranes}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Incidents Trend</h3>
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Event Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.event_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}


'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  total_incidents: number;
  red_zone_events: number;
  yellow_zone_events: number;
  active_cranes: number;
  operator_wise: Array<{ operator: string; count: number }>;
  shift_wise: Array<{ shift: string; count: number }>;
  crane_wise: Array<{ crane_id: string; count: number }>;
}

const COLORS = ['#0ea5e9', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    crane_id: '',
    operator: '',
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await fetchWithAuth(`/api/analytics?${params.toString()}`);
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetchWithAuth('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, filters }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div>Loading analytics...</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div>Failed to load analytics</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) =>
                    setFilters({ ...filters, date_from: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) =>
                    setFilters({ ...filters, date_to: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Crane ID</label>
              <input
                type="text"
                value={filters.crane_id}
                onChange={(e) =>
                  setFilters({ ...filters, crane_id: e.target.value })
                }
                placeholder="Filter by crane..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operator</label>
              <input
                type="text"
                value={filters.operator}
                onChange={(e) =>
                  setFilters({ ...filters, operator: e.target.value })
                }
                placeholder="Filter by operator..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 mr-2"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Incident Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Incidents</span>
                <span className="text-2xl font-bold">{data.total_incidents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Red Zone Events</span>
                <span className="text-2xl font-bold text-red-600">
                  {data.red_zone_events}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Yellow Zone Events</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {data.yellow_zone_events}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Cranes</span>
                <span className="text-2xl font-bold">{data.active_cranes}</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Incidents Over Time</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Event Type Distribution</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Red', value: data.red_zone_events },
                        { name: 'Yellow', value: data.yellow_zone_events },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Red', value: data.red_zone_events },
                        { name: 'Yellow', value: data.yellow_zone_events },
                      ].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#ef4444' : '#f59e0b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Shift Distribution</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={data.shift_wise}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shift" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Operator-wise */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Operator-wise Incidents</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.operator_wise}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operator" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Crane-wise */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Crane-wise Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.crane_wise}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="crane_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}


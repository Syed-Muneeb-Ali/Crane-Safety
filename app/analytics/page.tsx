'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    crane_id: '',
    operator: '',
  });
  const [craneIds, setCraneIds] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadFilters = async () => {
    try {
      const response = await fetchWithAuth('/api/events?limit=1000');
      const data = await response.json();
      const uniqueCranes = [...new Set(data.events.map((e: any) => e.crane_id))];
      const uniqueOperators = [...new Set(data.events.map((e: any) => e.operator).filter(Boolean))];
      setCraneIds(uniqueCranes as string[]);
      setOperators(uniqueOperators as string[]);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

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
    setExporting(format);
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
      alert('Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const clearFilter = (key: string) => {
    setFilters({ ...filters, [key]: '' });
  };

  const clearAllFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      crane_id: '',
      operator: '',
    });
  };

  if (loading && !data) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">Failed to load analytics</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) =>
                      setFilters({ ...filters, date_from: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md ${
                      filters.date_from ? 'pr-8' : ''
                    }`}
                  />
                  {filters.date_from && (
                    <button
                      onClick={() => clearFilter('date_from')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) =>
                      setFilters({ ...filters, date_to: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md ${
                      filters.date_to ? 'pr-8' : ''
                    }`}
                  />
                  {filters.date_to && (
                    <button
                      onClick={() => clearFilter('date_to')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Crane ID</label>
              <div className="relative">
                <select
                  value={filters.crane_id}
                  onChange={(e) =>
                    setFilters({ ...filters, crane_id: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md appearance-none bg-white ${
                    filters.crane_id ? 'pr-10' : 'pr-8'
                  }`}
                >
                  <option value="">All Cranes</option>
                  {craneIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {filters.crane_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter('crane_id');
                    }}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold"
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operator</label>
              <div className="relative">
                <select
                  value={filters.operator}
                  onChange={(e) =>
                    setFilters({ ...filters, operator: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md appearance-none bg-white ${
                    filters.operator ? 'pr-10' : 'pr-8'
                  }`}
                >
                  <option value="">All Operators</option>
                  {operators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {filters.operator && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter('operator');
                    }}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold"
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting === 'pdf' ? (
                <>
                  <LoadingSpinner size="sm" />
                  Exporting PDF...
                </>
              ) : (
                'Export PDF'
              )}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting === 'csv' ? (
                <>
                  <LoadingSpinner size="sm" />
                  Exporting CSV...
                </>
              ) : (
                'Export CSV'
              )}
            </button>
          </div>
        </div>

        {/* Incident Stats */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Incident Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-1">Total Incidents</div>
              <div className="text-3xl font-bold">{data.total_incidents}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-1">Red Zone Events</div>
              <div className="text-3xl font-bold text-red-600">
                {data.red_zone_events}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-1">Yellow Zone Events</div>
              <div className="text-3xl font-bold text-yellow-600">
                {data.yellow_zone_events}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-1">Active Cranes</div>
              <div className="text-3xl font-bold">{data.active_cranes}</div>
            </div>
          </div>
        </div>

        {/* Incidents Over Time Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Incidents Over Time</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Type Distribution - Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Event Type Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Red Zone', value: data.red_zone_events },
                      { name: 'Yellow Zone', value: data.yellow_zone_events },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Red Zone', value: data.red_zone_events },
                      { name: 'Yellow Zone', value: data.yellow_zone_events },
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#ef4444' : '#f59e0b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Shift Distribution - Bar Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Shift Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.shift_wise} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="shift" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operator-wise */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Operator-wise Incidents</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.operator_wise} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="operator" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Crane-wise */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Crane-wise Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.crane_wise} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="crane_id" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
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

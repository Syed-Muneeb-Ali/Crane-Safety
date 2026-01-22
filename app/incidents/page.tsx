'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { format } from 'date-fns';

interface Event {
  id: number;
  event_id: string;
  timestamp: string;
  crane_id: string;
  zone_type: string;
  operator: string | null;
  shift_name: string | null;
  severity: string;
  event_type: string;
}

export default function IncidentsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    event_type: '',
    crane_id: '',
    operator: '',
    shift_id: '',
  });
  const [shifts, setShifts] = useState<any[]>([]);
  const [craneIds, setCraneIds] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);

  useEffect(() => {
    loadShifts();
    loadFilters();
    loadEvents();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadShifts = async () => {
    try {
      const response = await fetchWithAuth('/api/shifts');
      const data = await response.json();
      setShifts(data.shifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const response = await fetchWithAuth('/api/events?limit=1000');
      const data = await response.json();
      const uniqueCranes = [...new Set(data.events.map((e: Event) => e.crane_id))];
      const uniqueOperators = [...new Set(data.events.map((e: Event) => e.operator).filter(Boolean))];
      setCraneIds(uniqueCranes as string[]);
      setOperators(uniqueOperators as string[]);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await fetchWithAuth(`/api/events?${params.toString()}`);
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error loading events:', error);
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
      a.download = `incidents-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Incident List</h1>

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
              <label className="block text-sm font-medium mb-1">
                Red / Yellow Filter
              </label>
              <select
                value={filters.event_type}
                onChange={(e) =>
                  setFilters({ ...filters, event_type: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All</option>
                <option value="red">Red Zone</option>
                <option value="yellow">Yellow Zone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Crane / Operator Filter
              </label>
              <select
                value={filters.crane_id}
                onChange={(e) =>
                  setFilters({ ...filters, crane_id: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Cranes</option>
                {craneIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operator</label>
              <select
                value={filters.operator}
                onChange={(e) =>
                  setFilters({ ...filters, operator: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Operators</option>
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shift</label>
              <select
                value={filters.shift_id}
                onChange={(e) =>
                  setFilters({ ...filters, shift_id: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Shifts</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                  </option>
                ))}
              </select>
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Crane ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Shift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      No incidents found
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {event.crane_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            event.event_type === 'red'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {event.zone_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {event.operator || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {event.shift_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            event.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/incidents/${event.id}`}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}


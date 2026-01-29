'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import { format } from 'date-fns';
import IncidentModal from '@/components/IncidentModal';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  reviewed: boolean;
}

interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
  name: string;
}

export default function IncidentsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
    loadUser();
    loadShifts();
    loadFilters();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  useEffect(() => {
    setPage(1);
    loadEvents(1);
  }, [filters, pageSize]);

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

  const loadEvents = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', pageNum.toString());
      params.append('limit', String(pageSize));
      const response = await fetchWithAuth(`/api/events?${params.toString()}`);
      const data = await response.json();
      
      setEvents(data.events);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    setPage(next);
    loadEvents(next);
  };

  const handleEventReviewed = () => {
    loadEvents(page);
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
      a.download = `incidents-${Date.now()}.${format}`;
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
      event_type: '',
      crane_id: '',
      operator: '',
      shift_id: '',
    });
  };

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-display font-bold mb-6 text-surface-900">Incident List</h1>

        {/* Filters */}
        <div className="card p-6 mb-6 animate-fade-in-up">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-surface-900">Filters</h2>
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
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
              <label className="block text-sm font-medium mb-1">
                Red / Yellow Filter
              </label>
              <div className="relative">
                <select
                  value={filters.event_type}
                  onChange={(e) =>
                    setFilters({ ...filters, event_type: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md appearance-none bg-white ${
                    filters.event_type ? 'pr-10' : 'pr-8'
                  }`}
                >
                  <option value="">All</option>
                  <option value="red">Red Zone</option>
                  <option value="yellow">Yellow Zone</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {filters.event_type && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter('event_type');
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
              <label className="block text-sm font-medium mb-1">
                Crane ID
              </label>
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
            <div>
              <label className="block text-sm font-medium mb-1">Shift</label>
              <div className="relative">
                <select
                  value={filters.shift_id}
                  onChange={(e) =>
                    setFilters({ ...filters, shift_id: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md appearance-none bg-white ${
                    filters.shift_id ? 'pr-10' : 'pr-8'
                  }`}
                >
                  <option value="">All Shifts</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {filters.shift_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter('shift_id');
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
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

        {/* Table */}
        <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
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
                    Reviewed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <LoadingSpinner />
                      </div>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
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
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            event.reviewed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.reviewed ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedEventId(event.id)}
                          className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && (events.length > 0 || totalCount > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const v = Number(e.target.value) as 10 | 20 | 30 | 40 | 50;
                    setPageSize(v);
                    setPage(1);
                    loadEvents(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-700">
                Page {page} of {totalPages || 1}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(1)}
                  disabled={page <= 1 || loading}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  aria-label="First page"
                >
                  &laquo;
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  aria-label="Previous page"
                >
                  &lsaquo;
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  aria-label="Next page"
                >
                  &rsaquo;
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(totalPages)}
                  disabled={page >= totalPages || loading}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  aria-label="Last page"
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
        
        <IncidentModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onReviewed={handleEventReviewed}
          canAddRemarks={user?.role === 'admin'}
        />
      </div>
    </Layout>
  );
}

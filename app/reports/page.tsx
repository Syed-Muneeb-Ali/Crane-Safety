'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ReportsPage() {
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
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);

  useEffect(() => {
    loadShifts();
    loadFilters();
  }, []);

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
      const uniqueCranes = [...new Set(data.events.map((e: any) => e.crane_id))];
      const uniqueOperators = [...new Set(data.events.map((e: any) => e.operator).filter(Boolean))];
      setCraneIds(uniqueCranes as string[]);
      setOperators(uniqueOperators as string[]);
    } catch (error) {
      console.error('Error loading filters:', error);
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
      a.download = `report-${Date.now()}.${format}`;
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
        <h1 className="text-3xl font-bold mb-6">Reports</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Report Filters</h2>
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              <label className="block text-sm font-medium mb-1">Event Type</label>
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

          <div className="flex gap-4">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting === 'pdf' ? (
                <>
                  <LoadingSpinner size="sm" />
                  Exporting PDF...
                </>
              ) : (
                'Export PDF Report'
              )}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting === 'csv' ? (
                <>
                  <LoadingSpinner size="sm" />
                  Exporting CSV...
                </>
              ) : (
                'Export CSV Report'
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

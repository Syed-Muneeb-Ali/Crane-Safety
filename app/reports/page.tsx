'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';

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

  useEffect(() => {
    loadShifts();
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
      a.download = `report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export report');
    }
  };

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Reports</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Report Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              <label className="block text-sm font-medium mb-1">Event Type</label>
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

          <div className="flex gap-4">
            <button
              onClick={() => handleExport('pdf')}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Export PDF Report
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Export CSV Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}


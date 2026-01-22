'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import { format } from 'date-fns';

interface Event {
  id: number;
  event_id: string;
  event_type: string;
  timestamp: string;
  crane_id: string;
  zone_type: string;
  motion_type: string;
  operator: string | null;
  shift_name: string | null;
  shift_manager: string | null;
  ai_confidence_score: number | null;
  image_reference: string | null;
  remarks: string | null;
  severity: string;
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    try {
      const response = await fetchWithAuth(`/api/events/${params.id}`);
      const data = await response.json();
      setEvent(data.event);
      setRemarks(data.event.remarks || '');

      if (data.event.image_reference) {
        setImageUrl(`/api/images/${data.event.image_reference}`);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRemarks = async () => {
    try {
      await fetchWithAuth(`/api/events/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      alert('Remarks updated successfully');
    } catch (error) {
      console.error('Error updating remarks:', error);
      alert('Failed to update remarks');
    }
  };

  const handleMarkReviewed = async () => {
    try {
      await fetchWithAuth(`/api/events/${params.id}/review`, {
        method: 'POST',
      });
      alert('Event marked as reviewed');
      router.push('/incidents');
    } catch (error) {
      console.error('Error marking reviewed:', error);
      alert('Failed to mark as reviewed');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div>Loading incident details...</div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div>Incident not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Incident Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Incident Image</h2>
            {imageUrl ? (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Incident"
                  className="w-full h-auto"
                  onError={() => setImageUrl(null)}
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>

          {/* Event Info Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Event Info</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Event Type:
                </label>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      event.event_type === 'red'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {event.event_type.toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Crane ID:
                </label>
                <p className="mt-1">{event.crane_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Zone:</label>
                <p className="mt-1">{event.zone_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Operator:
                </label>
                <p className="mt-1">{event.operator || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Shift:</label>
                <p className="mt-1">{event.shift_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Timestamp:
                </label>
                <p className="mt-1">
                  {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Confidence:
                </label>
                <p className="mt-1">
                  {event.ai_confidence_score
                    ? `${(event.ai_confidence_score * 100).toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Notes:</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  rows={4}
                  placeholder="Add remarks..."
                />
                <button
                  onClick={handleUpdateRemarks}
                  className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                >
                  Update Remarks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleMarkReviewed}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Mark as Reviewed
          </button>
          <button
            onClick={() => router.push('/incidents')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close Incident
          </button>
        </div>
      </div>
    </Layout>
  );
}


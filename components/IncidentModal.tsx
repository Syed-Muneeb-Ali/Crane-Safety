'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/auth-client';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';

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

interface IncidentModalProps {
  eventId: number | null;
  onClose: () => void;
  onReviewed: () => void;
}

export default function IncidentModal({ eventId, onClose, onReviewed }: IncidentModalProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && eventId) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [eventId, onClose]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/events/${eventId}`);
      const data = await response.json();
      setEvent(data.event);
      setRemarks(data.event.remarks || '');

      if (data.event.image_reference) {
        setImageUrl(`/images/${data.event.image_reference}`);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRemarks = async () => {
    setUpdating(true);
    try {
      await fetchWithAuth(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      alert('Remarks updated successfully');
      if (event) {
        setEvent({ ...event, remarks });
      }
    } catch (error) {
      console.error('Error updating remarks:', error);
      alert('Failed to update remarks');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkReviewed = async () => {
    setUpdating(true);
    try {
      await fetchWithAuth(`/api/events/${eventId}/review`, {
        method: 'POST',
      });
      alert('Event marked as reviewed');
      onReviewed();
      onClose();
    } catch (error) {
      console.error('Error marking reviewed:', error);
      alert('Failed to mark as reviewed');
    } finally {
      setUpdating(false);
    }
  };

  if (!eventId) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Incident Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !event ? (
            <div className="text-center py-12">Incident not found</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Panel */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Incident Image</h3>
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Event Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Event Type:</label>
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
                    <label className="text-sm font-medium text-gray-600">Crane ID:</label>
                    <p className="mt-1">{event.crane_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Zone:</label>
                    <p className="mt-1">{event.zone_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Operator:</label>
                    <p className="mt-1">{event.operator || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Shift:</label>
                    <p className="mt-1">{event.shift_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timestamp:</label>
                    <p className="mt-1">
                      {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Confidence:</label>
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
                      disabled={updating}
                      className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Update Remarks'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!loading && event && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleMarkReviewed}
                disabled={updating}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? 'Processing...' : 'Mark as Reviewed'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


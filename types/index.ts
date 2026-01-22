export type EventType = 'red' | 'yellow';
export type MotionType = 'CT' | 'LT';
export type Severity = 'critical' | 'warning';
export type UserRole = 'admin' | 'viewer';

export interface Event {
  id: number;
  event_id: string;
  event_type: EventType;
  timestamp: string;
  crane_id: string;
  zone_type: string;
  motion_type: MotionType;
  shift_id: number | null;
  operator: string | null;
  ai_confidence_score: number | null;
  image_reference: string | null;
  remarks: string | null;
  severity: Severity;
  created_at: string;
  updated_at: string;
  shift_name?: string;
  shift_manager?: string;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  shift_manager: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventCreatePayload {
  event_id: string;
  event_type: EventType;
  timestamp: string;
  crane_id: string;
  zone_type: string;
  motion_type: MotionType;
  shift_id?: number;
  operator?: string;
  ai_confidence_score?: number;
  image_reference?: string;
  remarks?: string;
}

export interface EventFilters {
  date_from?: string;
  date_to?: string;
  event_type?: EventType;
  crane_id?: string;
  operator?: string;
  shift_id?: number;
  severity?: Severity;
  page?: number;
  limit?: number;
}

export interface AnalyticsData {
  total_incidents: number;
  red_zone_events: number;
  yellow_zone_events: number;
  active_cranes: number;
  incidents_trend: Array<{ date: string; count: number }>;
  event_breakdown: Array<{ type: string; count: number }>;
  operator_wise: Array<{ operator: string; count: number }>;
  shift_wise: Array<{ shift: string; count: number }>;
  crane_wise: Array<{ crane_id: string; count: number }>;
}

export interface DashboardStats {
  total_incidents: number;
  red_zone_events: number;
  yellow_zone_events: number;
  active_cranes: number;
}


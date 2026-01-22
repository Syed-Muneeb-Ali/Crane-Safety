import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const craneId = searchParams.get('crane_id');
    const operator = searchParams.get('operator');

    let dateFilter = '';
    const params: any[] = [];
    let paramCount = 0;

    if (dateFrom) {
      paramCount++;
      dateFilter += ` AND timestamp >= $${paramCount}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      paramCount++;
      dateFilter += ` AND timestamp <= $${paramCount}`;
      params.push(dateTo);
    }
    if (craneId) {
      paramCount++;
      dateFilter += ` AND crane_id = $${paramCount}`;
      params.push(craneId);
    }
    if (operator) {
      paramCount++;
      dateFilter += ` AND operator = $${paramCount}`;
      params.push(operator);
    }

    // Total incidents
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM events WHERE 1=1 ${dateFilter}`,
      params
    );
    const total_incidents = parseInt(totalResult.rows[0].count);

    // Red zone events
    const redResult = await pool.query(
      `SELECT COUNT(*) as count FROM events WHERE event_type = 'red' ${dateFilter}`,
      params
    );
    const red_zone_events = parseInt(redResult.rows[0].count);

    // Yellow zone events
    const yellowResult = await pool.query(
      `SELECT COUNT(*) as count FROM events WHERE event_type = 'yellow' ${dateFilter}`,
      params
    );
    const yellow_zone_events = parseInt(yellowResult.rows[0].count);

    // Active cranes
    const activeCranesResult = await pool.query(
      `SELECT COUNT(DISTINCT crane_id) as count FROM events WHERE 1=1 ${dateFilter}`,
      params
    );
    const active_cranes = parseInt(activeCranesResult.rows[0].count);

    // Incidents trend (daily)
    const trendResult = await pool.query(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM events
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30`,
      params
    );
    const incidents_trend = trendResult.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count),
    }));

    // Event breakdown
    const breakdownResult = await pool.query(
      `SELECT 
        event_type,
        COUNT(*) as count
      FROM events
      WHERE 1=1 ${dateFilter}
      GROUP BY event_type`,
      params
    );
    const event_breakdown = breakdownResult.rows.map((row) => ({
      type: row.event_type,
      count: parseInt(row.count),
    }));

    // Operator-wise
    const operatorResult = await pool.query(
      `SELECT 
        operator,
        COUNT(*) as count
      FROM events
      WHERE operator IS NOT NULL ${dateFilter}
      GROUP BY operator
      ORDER BY count DESC
      LIMIT 10`,
      params
    );
    const operator_wise = operatorResult.rows.map((row) => ({
      operator: row.operator,
      count: parseInt(row.count),
    }));

    // Shift-wise
    const shiftResult = await pool.query(
      `SELECT 
        s.name as shift,
        COUNT(*) as count
      FROM events e
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE 1=1 ${dateFilter}
      GROUP BY s.name
      ORDER BY count DESC`,
      params
    );
    const shift_wise = shiftResult.rows.map((row) => ({
      shift: row.shift || 'Unknown',
      count: parseInt(row.count),
    }));

    // Crane-wise
    const craneResult = await pool.query(
      `SELECT 
        crane_id,
        COUNT(*) as count
      FROM events
      WHERE 1=1 ${dateFilter}
      GROUP BY crane_id
      ORDER BY count DESC
      LIMIT 10`,
      params
    );
    const crane_wise = craneResult.rows.map((row) => ({
      crane_id: row.crane_id,
      count: parseInt(row.count),
    }));

    return NextResponse.json({
      total_incidents,
      red_zone_events,
      yellow_zone_events,
      active_cranes,
      incidents_trend,
      event_breakdown,
      operator_wise,
      shift_wise,
      crane_wise,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}


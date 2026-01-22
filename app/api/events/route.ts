import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isIPAllowed, getClientIP } from '@/lib/ip-whitelist';
import { uploadImage } from '@/lib/minio';
import { EventCreatePayload } from '@/types';

// GET /api/events - List events with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const eventType = searchParams.get('event_type');
    const craneId = searchParams.get('crane_id');
    const operator = searchParams.get('operator');
    const shiftId = searchParams.get('shift_id');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        e.*,
        s.name as shift_name,
        s.shift_manager
      FROM events e
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (dateFrom) {
      paramCount++;
      query += ` AND e.timestamp >= $${paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      query += ` AND e.timestamp <= $${paramCount}`;
      params.push(dateTo);
    }

    if (eventType) {
      paramCount++;
      query += ` AND e.event_type = $${paramCount}`;
      params.push(eventType);
    }

    if (craneId) {
      paramCount++;
      query += ` AND e.crane_id = $${paramCount}`;
      params.push(craneId);
    }

    if (operator) {
      paramCount++;
      query += ` AND e.operator = $${paramCount}`;
      params.push(operator);
    }

    if (shiftId) {
      paramCount++;
      query += ` AND e.shift_id = $${paramCount}`;
      params.push(parseInt(shiftId));
    }

    if (severity) {
      paramCount++;
      query += ` AND e.severity = $${paramCount}`;
      params.push(severity);
    }

    query += ` ORDER BY e.timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM events WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 0;

    if (dateFrom) {
      countParamCount++;
      countQuery += ` AND timestamp >= $${countParamCount}`;
      countParams.push(dateFrom);
    }
    if (dateTo) {
      countParamCount++;
      countQuery += ` AND timestamp <= $${countParamCount}`;
      countParams.push(dateTo);
    }
    if (eventType) {
      countParamCount++;
      countQuery += ` AND event_type = $${countParamCount}`;
      countParams.push(eventType);
    }
    if (craneId) {
      countParamCount++;
      countQuery += ` AND crane_id = $${countParamCount}`;
      countParams.push(craneId);
    }
    if (operator) {
      countParamCount++;
      countQuery += ` AND operator = $${countParamCount}`;
      countParams.push(operator);
    }
    if (shiftId) {
      countParamCount++;
      countQuery += ` AND shift_id = $${countParamCount}`;
      countParams.push(parseInt(shiftId));
    }
    if (severity) {
      countParamCount++;
      countQuery += ` AND severity = $${countParamCount}`;
      countParams.push(severity);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      events: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event (with IP whitelisting)
export async function POST(request: NextRequest) {
  try {
    // IP whitelisting check
    const clientIP = getClientIP(request);
    if (!isIPAllowed(clientIP)) {
      return NextResponse.json(
        { error: 'IP address not allowed' },
        { status: 403 }
      );
    }

    const body: EventCreatePayload = await request.json();

    // Validate required fields
    if (!body.event_id || !body.event_type || !body.timestamp || !body.crane_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine severity based on event type
    const severity = body.event_type === 'red' ? 'critical' : 'warning';

    // Check if event_id already exists (idempotency)
    const existing = await pool.query(
      'SELECT id FROM events WHERE event_id = $1',
      [body.event_id]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { message: 'Event already exists', event_id: existing.rows[0].id },
        { status: 200 }
      );
    }

    // Handle image upload if provided
    let imageReference = body.image_reference;
    if (body.image_reference && typeof body.image_reference === 'string') {
      // Base64 image data
      const base64Data = body.image_reference.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `event-${body.event_id}-${Date.now()}.jpg`;
      imageReference = await uploadImage(buffer, filename);
    }

    // Insert event
    const result = await pool.query(
      `INSERT INTO events (
        event_id, event_type, timestamp, crane_id, zone_type, motion_type,
        shift_id, operator, ai_confidence_score, image_reference, remarks, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        body.event_id,
        body.event_type,
        body.timestamp,
        body.crane_id,
        body.zone_type || 'unknown',
        body.motion_type || 'CT',
        body.shift_id || null,
        body.operator || null,
        body.ai_confidence_score || null,
        imageReference || null,
        body.remarks || null,
        severity,
      ]
    );

    return NextResponse.json(
      { message: 'Event created successfully', event: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}


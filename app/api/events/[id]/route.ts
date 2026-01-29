import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      `SELECT 
        e.*,
        s.name as shift_name,
        s.shift_manager
      FROM events e
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE e.id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(authHeader.substring(7));
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can add or edit remarks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (body.remarks !== undefined) {
      paramCount++;
      updates.push(`remarks = $${paramCount}`);
      values.push(body.remarks);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(params.id);

    const query = `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return NextResponse.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}


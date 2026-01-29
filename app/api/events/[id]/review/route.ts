import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let reviewed = true;
    try {
      const body = await request.json();
      if (typeof body.reviewed === 'boolean') reviewed = body.reviewed;
    } catch {
      // no body or invalid JSON – default to true (mark as reviewed)
    }

    const result = await pool.query(
      'UPDATE events SET reviewed = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [reviewed, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: reviewed ? 'Event marked as reviewed' : 'Event unmarked as reviewed',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Error reviewing event:', error);
    return NextResponse.json(
      { error: 'Failed to review event' },
      { status: 500 }
    );
  }
}


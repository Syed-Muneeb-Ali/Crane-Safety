import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      'UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event marked as reviewed',
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


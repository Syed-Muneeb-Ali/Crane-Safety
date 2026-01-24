import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function POST(request: NextRequest) {
  try {
    const { format, filters } = await request.json();
    const { date_from, date_to, event_type, crane_id, operator, shift_id } = filters || {};

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

    if (date_from) {
      paramCount++;
      query += ` AND e.timestamp >= $${paramCount}`;
      params.push(date_from);
    }
    if (date_to) {
      paramCount++;
      query += ` AND e.timestamp <= $${paramCount}`;
      params.push(date_to);
    }
    if (event_type) {
      paramCount++;
      query += ` AND e.event_type = $${paramCount}`;
      params.push(event_type);
    }
    if (crane_id) {
      paramCount++;
      query += ` AND e.crane_id = $${paramCount}`;
      params.push(crane_id);
    }
    if (operator) {
      paramCount++;
      query += ` AND e.operator = $${paramCount}`;
      params.push(operator);
    }
    if (shift_id) {
      paramCount++;
      query += ` AND e.shift_id = $${paramCount}`;
      params.push(shift_id);
    }

    query += ' ORDER BY e.timestamp DESC';

    const result = await pool.query(query, params);
    const events = result.rows;

    if (format === 'csv') {
      const csv = Papa.unparse(events.map((e: any) => ({
        'Event ID': e.event_id,
        'Event Type': e.event_type,
        'Timestamp': e.timestamp,
        'Crane ID': e.crane_id,
        'Zone Type': e.zone_type,
        'Motion Type': e.motion_type,
        'Operator': e.operator || '',
        'Shift': e.shift_name || '',
        'Severity': e.severity,
        'Confidence Score': e.ai_confidence_score || '',
        'Remarks': e.remarks || '',
      })));

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="crane-incidents-${Date.now()}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Crane Safety Incident Report', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      if (date_from || date_to) {
        doc.text(`Date Range: ${date_from || 'N/A'} to ${date_to || 'N/A'}`, 14, 36);
      }

      autoTable(doc, {
        startY: 45,
        head: [['Time', 'Crane ID', 'Type', 'Zone', 'Operator', 'Shift', 'Severity']],
        body: events.map((e: any) => [
          new Date(e.timestamp).toLocaleString(),
          e.crane_id,
          e.event_type.toUpperCase(),
          e.zone_type,
          e.operator || 'N/A',
          e.shift_name || 'N/A',
          e.severity,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 165, 233] },
      });

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="crane-incidents-${Date.now()}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}


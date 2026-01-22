import { NextRequest, NextResponse } from 'next/server';
import { getImageBuffer } from '@/lib/storage';
// for deployment, use the following import
// import { getImageBuffer } from '@/lib/minio';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const buffer = await getImageBuffer(params.key);
    return new NextResponse(buffer.toString('base64'), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Image not found' },
      { status: 404 }
    );
  }
}


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
    
    // Determine content type based on file extension
    let contentType = 'image/jpeg';
    if (params.key.toLowerCase().endsWith('.avif')) {
      contentType = 'image/avif';
    } else if (params.key.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    } else if (params.key.toLowerCase().endsWith('.webp')) {
      contentType = 'image/webp';
    }
    
    return new NextResponse(buffer.toString('base64'), {
      headers: {
        'Content-Type': contentType,
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


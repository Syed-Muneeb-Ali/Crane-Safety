/**
 * Test script for event ingestion API
 * Usage: node scripts/test-event-api.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testEventIngestion() {
  const testEvent = {
    event_id: `test-${Date.now()}`,
    event_type: 'red',
    timestamp: new Date().toISOString(),
    crane_id: 'CRANE-001',
    zone_type: 'Red Zone A',
    motion_type: 'CT',
    operator: 'Test Operator',
    ai_confidence_score: 0.95,
    remarks: 'Test event from script',
  };

  try {
    console.log('Sending test event...');
    console.log('Event data:', JSON.stringify(testEvent, null, 2));

    const response = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Event created successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Failed to create event');
      console.error('Status:', response.status);
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Helper function to read image and convert to base64 data URI
function getImageAsDataUri(imagePath) {
  try {
    const fullPath = path.join(__dirname, '..', imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(imagePath).toLowerCase();
    
    // Determine MIME type based on extension
    let mimeType = 'image/jpeg';
    if (ext === '.avif') {
      mimeType = 'image/avif';
    } else if (ext === '.png') {
      mimeType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.webp') {
      mimeType = 'image/webp';
    }
    
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error reading image ${imagePath}:`, error.message);
    throw error;
  }
}

// Test with image c1.avif
async function testEventWithImageC1() {
  try {
    const imageDataUri = getImageAsDataUri('images/c1.avif');
    
    const testEvent = {
      event_id: `test-c1-${Date.now()}`,
      event_type: 'red',
      timestamp: new Date().toISOString(),
      crane_id: 'CRANE-001',
      zone_type: 'Red Zone A',
      motion_type: 'CT',
      operator: 'Test Operator C1',
      ai_confidence_score: 0.92,
      remarks: 'Test event with c1.avif image',
      image_reference: imageDataUri,
    };

    console.log('\nSending test event with c1.avif image...');
    const response = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Event with c1.avif image created successfully!');
      console.log('Event ID:', data.event?.id);
      console.log('Image Reference:', data.event?.image_reference);
    } else {
      console.error('❌ Failed to create event');
      console.error('Status:', response.status);
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test with image c2.jpg
async function testEventWithImageC2() {
  try {
    const imageDataUri = getImageAsDataUri('images/c2.jpg');
    
    const testEvent = {
      event_id: `test-c2-${Date.now()}`,
      event_type: 'yellow',
      timestamp: new Date().toISOString(),
      crane_id: 'CRANE-002',
      zone_type: 'Yellow Zone B',
      motion_type: 'LT',
      operator: 'Test Operator C2',
      ai_confidence_score: 0.87,
      remarks: 'Test event with c2.jpg image',
      image_reference: imageDataUri,
    };

    console.log('\nSending test event with c2.jpg image...');
    const response = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Event with c2.jpg image created successfully!');
      console.log('Event ID:', data.event?.id);
      console.log('Image Reference:', data.event?.image_reference);
    } else {
      console.error('❌ Failed to create event');
      console.error('Status:', response.status);
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
(async () => {
  console.log('Testing Event Ingestion API');
  console.log('API URL:', API_URL);
  console.log('---\n');

  await testEventIngestion();
  await testEventWithImageC1();
  await testEventWithImageC2();

  console.log('\n---');
  console.log('Tests completed!');
  console.log('\nNote: Open the incidents page and click on the events to see the images in the modal.');
})();


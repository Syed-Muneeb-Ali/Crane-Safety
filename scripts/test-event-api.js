/**
 * Test script for event ingestion API
 * Usage: node scripts/test-event-api.js
 */

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

// Test with image (base64)
async function testEventWithImage() {
  // This is a 1x1 transparent PNG in base64
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const testEvent = {
    event_id: `test-image-${Date.now()}`,
    event_type: 'yellow',
    timestamp: new Date().toISOString(),
    crane_id: 'CRANE-002',
    zone_type: 'Yellow Zone B',
    motion_type: 'LT',
    operator: 'Test Operator 2',
    ai_confidence_score: 0.87,
    image_data: `data:image/png;base64,${testImageBase64}`,
  };

  try {
    console.log('\nSending test event with image...');
    const response = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Event with image created successfully!');
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

// Run tests
(async () => {
  console.log('Testing Event Ingestion API');
  console.log('API URL:', API_URL);
  console.log('---\n');

  await testEventIngestion();
  await testEventWithImage();

  console.log('\n---');
  console.log('Tests completed!');
})();


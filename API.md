# API Documentation

## Authentication

Most endpoints require authentication via JWT token stored in cookies. The login endpoint sets the token automatically.

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@crane.com",
  "password": "admin123"
}

Response:
{
  "user": {
    "id": 1,
    "email": "admin@crane.com",
    "role": "admin",
    "name": "Admin User"
  },
  "token": "jwt_token_here"
}
```

### Logout
```
POST /api/auth/logout
```

## Event Ingestion

### Create Event
```
POST /api/events
Content-Type: application/json

Required Fields:
- event_id (string, unique)
- event_type ("red" | "yellow")
- timestamp (ISO 8601 string)
- crane_id (string)

Optional Fields:
- zone_type (string)
- motion_type ("CT" | "LT")
- shift_id (number)
- operator (string)
- ai_confidence_score (number, 0-1)
- image_reference (string) - MinIO object key
- image_data (string) - Base64 encoded image with data URI prefix
- remarks (string)

Example:
{
  "event_id": "EVT-2024-001",
  "event_type": "red",
  "timestamp": "2024-01-15T10:30:00Z",
  "crane_id": "CRANE-001",
  "zone_type": "Red Zone A",
  "motion_type": "CT",
  "operator": "John Doe",
  "ai_confidence_score": 0.95,
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}

Response:
{
  "message": "Event created successfully",
  "event": { ... }
}
```

**IP Whitelisting**: This endpoint checks the client IP against `ALLOWED_IPS` environment variable. Requests from non-whitelisted IPs will receive 403 Forbidden.

**Idempotency**: If an event with the same `event_id` already exists, the endpoint returns 200 with the existing event instead of creating a duplicate.

## Event Retrieval

### List Events
```
GET /api/events?date_from=2024-01-01&date_to=2024-01-31&event_type=red&crane_id=CRANE-001&operator=John&shift_id=1&severity=critical&page=1&limit=50

Query Parameters:
- date_from (ISO date string)
- date_to (ISO date string)
- event_type ("red" | "yellow")
- crane_id (string)
- operator (string)
- shift_id (number)
- severity ("critical" | "warning")
- page (number, default: 1)
- limit (number, default: 50)

Response:
{
  "events": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Get Event Details
```
GET /api/events/[id]

Response:
{
  "event": {
    "id": 1,
    "event_id": "EVT-2024-001",
    "event_type": "red",
    "timestamp": "2024-01-15T10:30:00Z",
    "crane_id": "CRANE-001",
    "zone_type": "Red Zone A",
    "motion_type": "CT",
    "operator": "John Doe",
    "shift_name": "Morning Shift",
    "shift_manager": "Manager A",
    "ai_confidence_score": 0.95,
    "image_reference": "1234567890-event.jpg",
    "remarks": "Manual review notes",
    "severity": "critical",
    ...
  }
}
```

### Update Event Remarks
```
PATCH /api/events/[id]
Content-Type: application/json

{
  "remarks": "Updated remarks text"
}

Response:
{
  "event": { ... }
}
```

### Mark Event as Reviewed
```
POST /api/events/[id]/review

Response:
{
  "message": "Event marked as reviewed",
  "event": { ... }
}
```

## Analytics

### Get Analytics Data
```
GET /api/analytics?date_from=2024-01-01&date_to=2024-01-31&crane_id=CRANE-001&operator=John

Query Parameters:
- date_from (ISO date string)
- date_to (ISO date string)
- crane_id (string)
- operator (string)

Response:
{
  "total_incidents": 150,
  "red_zone_events": 45,
  "yellow_zone_events": 105,
  "active_cranes": 5,
  "incidents_trend": [
    { "date": "2024-01-01", "count": 10 },
    ...
  ],
  "event_breakdown": [
    { "type": "red", "count": 45 },
    { "type": "yellow", "count": 105 }
  ],
  "operator_wise": [
    { "operator": "John Doe", "count": 25 },
    ...
  ],
  "shift_wise": [
    { "shift": "Morning Shift", "count": 50 },
    ...
  ],
  "crane_wise": [
    { "crane_id": "CRANE-001", "count": 30 },
    ...
  ]
}
```

## Reports

### Export Report
```
POST /api/reports/export
Content-Type: application/json

{
  "format": "pdf" | "csv",
  "filters": {
    "date_from": "2024-01-01",
    "date_to": "2024-01-31",
    "event_type": "red",
    "crane_id": "CRANE-001",
    "operator": "John",
    "shift_id": 1
  }
}

Response: Binary file (PDF or CSV)
Content-Disposition: attachment; filename="crane-incidents-[timestamp].pdf"
```

## Images

### Get Image
```
GET /api/images/[key]

Response: Binary image data (JPEG)
Content-Type: image/jpeg
Cache-Control: public, max-age=3600
```

The `key` parameter is the `image_reference` stored in the event record, which corresponds to the MinIO object key.

## Shifts

### List Shifts
```
GET /api/shifts

Response:
{
  "shifts": [
    {
      "id": 1,
      "name": "Morning Shift",
      "start_time": "06:00:00",
      "end_time": "14:00:00",
      "shift_manager": "Manager A",
      ...
    },
    ...
  ]
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (IP not whitelisted or insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting for production deployments, especially for the event ingestion endpoint.

## Testing

Use the provided test script:
```bash
node scripts/test-event-api.js
```

Or use curl:
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-001",
    "event_type": "red",
    "timestamp": "2024-01-15T10:30:00Z",
    "crane_id": "CRANE-001",
    "zone_type": "Red Zone A",
    "motion_type": "CT"
  }'
```


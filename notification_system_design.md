# Notification System Design

## Stage 1

The notification platform needs to show students updates about Placements, Events, and Results. When students log in they should see their notifications, and new notifications should reach them in real time.

### What the system should do

- Show the list of notifications for a student
- Show how many are unread (for the bell icon)
- Mark notifications as read (one or all)
- Delete a notification
- Admin should be able to send a new notification to students
- Push new notifications to logged-in students in real time

### REST API Endpoints

All endpoints need a token in the header:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

#### 1. Get all notifications for a student

```http
GET /api/notifications?status=unread&limit=20
```

Response:

```json
{
  "notifications": [
    {
      "id": "d146095a-0d86-4834-9669-3900a14576bc",
      "type": "Placement",
      "message": "TCS visiting campus on May 22",
      "createdAt": "2026-05-15T10:24:11Z",
      "isRead": false
    }
  ],
  "hasMore": true
}
```

#### 2. Get unread count

```http
GET /api/notifications/unread-count
```

Response:

```json
{
  "count": 7
}
```

#### 3. Mark one as read

```http
PATCH /api/notifications/:id/read
```

Response:

```json
{
  "id": "...",
  "isRead": true
}
```

#### 4. Mark all as read

```http
POST /api/notifications/read-all
```

Response:

```json
{
  "updated": 17
}
```

#### 5. Delete a notification

```http
DELETE /api/notifications/:id
```

Response: `204 No Content`

#### 6. Create a notification (admin)

```http
POST /api/notifications
```

Request body:

```json
{
  "type": "Placement",
  "message": "Infosys recruitment drive next week",
  "recipients": "all"
}
```

Response:

```json
{
  "id": "...",
  "status": "sent"
}
```

### Error responses

If something goes wrong the server returns:

```json
{
  "error": "Notification not found"
}
```

Status codes used: 200 (ok), 400 (bad request), 401 (no/invalid token), 404 (not found), 500 (server error).

### Real-time notifications

For real-time I want to use WebSockets. The client connects once when the student logs in, and the server pushes new notifications through that connection.

```text
ws://server/notifications?token=<token>
```

When a new notification is created, the server sends:

```json
{
  "event": "new_notification",
  "data": { "id": "...", "type": "Placement", "message": "..." }
}
```

Why WebSockets instead of polling? If 50,000 students keep polling every 30 seconds it puts a lot of load on the server even when nothing has changed. With WebSockets the server only sends data when there is actually something new, so it is much more efficient.
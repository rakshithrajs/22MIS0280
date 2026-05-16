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

---

## Stage 2

### Which database?

I would choose **PostgreSQL** because:

- Notifications have a fixed structure (id, type, message, timestamp, read status) so a relational DB is a good fit
- Postgres supports indexes which we need for fast lookups by student
- It supports ENUM types which we can use for notification type
- It is reliable and has ACID transactions, so when a notification is sent to many students nothing gets half-written

### Schema

```sql
CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');

CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  roll_no VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_recipients (
  notification_id UUID REFERENCES notifications(id),
  student_id BIGINT REFERENCES students(id),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP,
  PRIMARY KEY (student_id, notification_id)
);
```

I am keeping the notification content in one table and the per-student status in another table. This way the message is stored only once and not copied 50,000 times.

### What problems can come as data grows?

When the data becomes very big (say millions of notifications) some problems will start showing up:

- **Queries become slow** because the database has to scan a lot of rows
- **Counting unread notifications** for every student gets expensive
- **Storage keeps growing** as old notifications are never deleted
- **Inserting notifications for all 50,000 students at once** can lock the table

### How to solve them

- Add proper indexes on the columns we filter by (like `student_id` and `is_read`)
- Use a cache like **Redis** to store the unread count instead of calculating it every time
- Move old notifications (older than maybe 6 months) to an archive table
- Insert recipients in batches instead of all at once
- Use a queue/background job for big broadcasts so the main API stays fast

### SQL queries

#### Get unread notifications for a student

```sql
SELECT n.id, n.type, n.message, n.created_at, r.is_read
FROM notification_recipients r
JOIN notifications n ON n.id = r.notification_id
WHERE r.student_id = $1 AND r.is_read = FALSE
ORDER BY n.created_at DESC
LIMIT 20;
```

#### Get unread count

```sql
SELECT COUNT(*) FROM notification_recipients
WHERE student_id = $1 AND is_read = FALSE;
```

#### Mark one as read

```sql
UPDATE notification_recipients
SET is_read = TRUE, read_at = NOW()
WHERE student_id = $1 AND notification_id = $2;
```

#### Mark all as read

```sql
UPDATE notification_recipients
SET is_read = TRUE, read_at = NOW()
WHERE student_id = $1 AND is_read = FALSE;
```

#### Send a new notification to all students

```sql
INSERT INTO notifications (type, message)
VALUES ('Placement', 'TCS drive next week')
RETURNING id;

INSERT INTO notification_recipients (notification_id, student_id)
SELECT $1, id FROM students;
```

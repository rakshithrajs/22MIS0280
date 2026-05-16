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

## Stage 3

### Is the query accurate?

The query gives the correct result (unread notifications for student 1042 in newest-first order), so it is logically fine. But it has some problems:

- It uses `SELECT *` which pulls every column even when we only need a few
- There is no `LIMIT`, so it returns all matching rows even if we only show 20 on the page
- It depends on indexes to be fast, and as the database has grown to 5 million rows it is now slow

### Why is it slow?

With 5 million notifications and no proper index, the database has to scan through every row to find the ones where `studentID = 1042` and `isRead = false`. Even if only 30 rows match, the database still reads all 5 million to be sure. After that, it sorts the matching rows by `createdAt` which adds more time.

So the cost is roughly proportional to the size of the table (`O(N)` where N is 5 million), not the number of rows the student actually has.

### What I would change

Add a composite index on the columns used in the WHERE and ORDER BY:

```sql
CREATE INDEX idx_notifications_student_unread
ON notifications (studentID, isRead, createdAt DESC);
```

I would also rewrite the query to fetch only the columns the UI needs and add a LIMIT:

```sql
SELECT id, type, message, createdAt
FROM notifications
WHERE studentID = 1042 AND isRead = FALSE
ORDER BY createdAt DESC
LIMIT 20;
```

After this change the database can jump directly to student 1042's unread notifications using the index, instead of scanning the whole table. The cost becomes roughly `O(log N + K)` where K is the number of rows returned, which is very fast.

### Should we add indexes on every column?

No, this is bad advice. Indexes are not free.

- Every index takes up extra disk space
- Every INSERT, UPDATE and DELETE has to also update all the indexes, which makes writes slower
- Indexes on columns that are never used in WHERE or ORDER BY are just dead weight
- A single index on one column does not help when a query filters by multiple columns — for that we need composite indexes

The right way is to look at the actual queries the application runs, figure out the common access patterns, and add indexes that support those specific queries.

### Query: students who got a Placement notification in the last 7 days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days';
```

If we need the student details too:

```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
JOIN notifications n ON n.studentID = s.id
WHERE n.notificationType = 'Placement'
  AND n.createdAt >= NOW() - INTERVAL '7 days';
```

To make this fast we would also want an index like:

```sql
CREATE INDEX idx_notifications_type_created
ON notifications (notificationType, createdAt DESC);
```

---

## Stage 4

The problem is that notifications are fetched on every page load. With many students browsing at the same time, the database is being hit a lot for data that hardly changes between two clicks. This is overwhelming the DB and giving a bad user experience.

### Solutions

#### 1. Add a caching layer (Redis)

Store each student's recent notifications and their unread count in Redis. On a page load the server first checks Redis. If the data is there, return it directly. If not, fetch from the database and put it in Redis with a short TTL (say 60 seconds).

When a notification is marked as read or a new one is created, we update or invalidate the cache so it stays correct.

Tradeoffs:

- **Pro:** Massively reduces DB load. Redis can handle these reads in microseconds.
- **Con:** Need a cache invalidation strategy, otherwise students may see stale data. Adds another service to maintain.

#### 2. Pagination + load on demand

Right now everything is being fetched. Instead, only fetch the first 20 notifications. If the student scrolls or clicks "see more", then fetch the next 20.

Tradeoffs:

- **Pro:** Less data transferred and less work for the DB per request.
- **Con:** Slightly more complex frontend logic for infinite scroll or pagination.

#### 3. Use WebSockets instead of refetching on every page load

Currently the page reloads the list every time. Instead, fetch once when the student opens the app, then keep the list updated through WebSocket events for new notifications and read updates.

Tradeoffs:

- **Pro:** The DB is only hit on first load, not on every action.
- **Con:** WebSocket connections have to be managed (heartbeats, reconnects, scaling across servers).

#### 4. Read replicas

The main database (primary) handles writes, and one or more read replicas handle the reads. The notification listing API reads from the replica.

Tradeoffs:

- **Pro:** Scales reads horizontally without affecting writes.
- **Con:** Replication has a small lag, so a notification that was just marked read might still show as unread for a second.

#### 5. Cache the unread count separately

The unread count is shown everywhere (bell icon) and is the most frequent query. Keep it in Redis as a simple counter per student. Increment when a new notification arrives, decrement on mark-as-read.

Tradeoffs:

- **Pro:** Constant time read regardless of how many notifications the student has.
- **Con:** Need to make sure the counter stays in sync with the actual DB state (re-syncing periodically as a safety net).

### My recommendation

Apply these together:

1. Redis cache for the notification list and unread count (biggest impact)
2. Pagination so we never fetch everything
3. WebSockets to push updates instead of repolling
4. Read replicas if the load is still too high after these

# Appwrite Cloud Setup Guide

This guide walks through setting up Appwrite Cloud for EduSpark.

## Step 1: Create Appwrite Project

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up or log in
3. Create a new project
4. Select **Singapore** region if available
5. Name the project (e.g., "EduSpark")
6. Copy the **Project ID** → set as `VITE_APPWRITE_PROJECT_ID` in `.env`

## Step 2: Configure Authentication

1. In the Appwrite console, go to **Auth**
2. Under **Auth Providers**, ensure **Email/Password** is enabled
3. Disable other providers (Google, Facebook, etc.) for the MVP
4. Set session length to 365 days for persistent login

## Step 3: Create Database

1. Go to **Databases**
2. Create a new database named "EduSpark"
3. Copy the **Database ID** → set as `VITE_APPWRITE_DATABASE_ID` in `.env`

## Step 4: Create Collections

Create each collection listed below. For each collection, add the attributes as specified.

### Collection: `users`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| email | string | 255 | yes | - |
| name | string | 255 | yes | - |
| role | enum | - | yes | student |
| deviceId | string | 255 | yes | - |
| lastSyncAt | datetime | - | yes | - |
| createdAt | datetime | - | yes | - |

**Enum values for role:** `student`, `teacher`, `admin`

**Permissions:**
- Create: `users` (any authenticated user)
- Read: `user:{userId}` (document owner)
- Update: `user:{userId}` (document owner)
- Delete: `user:{userId}` (document owner)

### Collection: `classes`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| name | string | 255 | yes | - |
| courseName | string | 255 | yes | - |
| schoolYear | string | 50 | yes | - |
| teacherId | string | 255 | yes | - |
| joinCode | string | 10 | yes | - |
| joinCodeActive | boolean | - | yes | true |
| status | enum | - | yes | active |
| createdAt | datetime | - | yes | - |

**Enum values for status:** `active`, `archived`

**Indexes:**
- `idx_teacher` on `teacherId`
- `idx_joinCode` on `joinCode` (unique)

**Permissions:**
- Create: `users` (authenticated)
- Read: `users` (any authenticated)
- Update: `user:{teacherId}` (teacher owner)
- Delete: `user:{teacherId}` (teacher owner)

### Collection: `class_members`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| classId | string | 255 | yes | - |
| userId | string | 255 | yes | - |
| role | enum | - | yes | student |
| joinedAt | datetime | - | yes | - |

**Enum values for role:** `student`, `teacher`

**Indexes:**
- `idx_class_user` on `[classId, userId]` (unique)
- `idx_user` on `userId`

**Permissions:**
- Create: `users`
- Read: `users`
- Update: `user:{userId}`
- Delete: `user:{userId}`

### Collection: `readings`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| teacherId | string | 255 | yes | - |
| title | string | 500 | yes | - |
| author | string | 255 | no | - |
| sourceUrl | string | 2000 | no | - |
| description | string | 1000 | no | - |
| content | string | 100000 | yes | - |
| contentFormat | enum | - | yes | plain |
| status | enum | - | yes | draft |
| createdAt | datetime | - | yes | - |
| updatedAt | datetime | - | yes | - |

**Enum values for contentFormat:** `plain`, `markdown`
**Enum values for status:** `draft`, `published`, `archived`

**Indexes:**
- `idx_teacher` on `teacherId`
- `idx_status` on `status`

**Permissions:**
- Create: `users`
- Read: `users` (published readings visible to all authenticated)
- Update: `user:{teacherId}`
- Delete: `user:{teacherId}`

### Collection: `reading_assignments`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| readingId | string | 255 | yes | - |
| classId | string | 255 | yes | - |
| assignedAt | datetime | - | yes | - |
| dueDate | datetime | - | no | - |

**Indexes:**
- `idx_class` on `classId`
- `idx_reading` on `readingId`

**Permissions:**
- Create: `users`
- Read: `users`
- Update: `users`
- Delete: `users`

### Collection: `annotations`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| userId | string | 255 | yes | - |
| readingId | string | 255 | yes | - |
| type | enum | - | yes | highlight |
| selectedText | string | 5000 | yes | - |
| textBefore | string | 1000 | no | - |
| textAfter | string | 1000 | no | - |
| startOffset | integer | - | yes | 0 |
| endOffset | integer | - | yes | 0 |
| blockId | string | 255 | no | - |
| color | string | 20 | no | #facc15 |
| noteText | string | 5000 | no | - |
| createdAt | datetime | - | yes | - |
| updatedAt | datetime | - | yes | - |

**Enum values for type:** `highlight`, `private_note`, `teacher_visible_note`

**Indexes:**
- `idx_reading_user` on `[readingId, userId]`
- `idx_user` on `userId`

**Permissions:**
- Create: `user:{userId}`
- Read: `user:{userId}` (owner can read all; teachers read teacher_visible_note via function)
- Update: `user:{userId}`
- Delete: `user:{userId}`

### Collection: `discussion_questions`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| readingId | string | 255 | yes | - |
| assignmentId | string | 255 | yes | - |
| authorId | string | 255 | yes | - |
| questionText | string | 5000 | yes | - |
| selectedPassage | string | 5000 | no | - |
| voteCount | integer | - | yes | 0 |
| moderationStatus | enum | - | yes | visible |
| discussionStatus | enum | - | yes | none |
| isTeacherQuestion | boolean | - | yes | false |
| teacherVisibleBeforeSubmission | boolean | - | yes | false |
| createdAt | datetime | - | yes | - |

**Enum values for moderationStatus:** `visible`, `hidden`, `removed`
**Enum values for discussionStatus:** `none`, `selected`, `discussed`, `archived`

**Indexes:**
- `idx_assignment` on `assignmentId`
- `idx_reading` on `readingId`
- `idx_author` on `authorId`

**Permissions:**
- Create: Via Appwrite Function only (`submitQuestion`)
- Read: Via Appwrite Function only (`getAnonymousQuestions`)
- Update: `user:{authorId}` (own questions) + admin
- Delete: Admin only

### Collection: `question_votes`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| questionId | string | 255 | yes | - |
| userId | string | 255 | yes | - |
| createdAt | datetime | - | yes | - |

**Indexes:**
- `idx_question` on `questionId`
- `idx_user_question` on `[userId, questionId]` (unique)

**Permissions:**
- Create: Via Appwrite Function only (`toggleVote`)
- Read: `users`
- Delete: Via Appwrite Function only (`toggleVote`)

### Collection: `flashcard_decks`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| creatorId | string | 255 | yes | - |
| title | string | 500 | yes | - |
| description | string | 1000 | no | - |
| type | enum | - | yes | teacher |
| status | enum | - | yes | draft |
| createdAt | datetime | - | yes | - |
| updatedAt | datetime | - | yes | - |

**Enum values for type:** `teacher`, `personal`
**Enum values for status:** `draft`, `published`, `archived`

**Indexes:**
- `idx_creator` on `creatorId`
- `idx_status` on `status`

**Permissions:**
- Create: `users`
- Read: `users` (published teacher decks) + `user:{creatorId}` (personal)
- Update: `user:{creatorId}`
- Delete: `user:{creatorId}`

### Collection: `flashcard_cards`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| deckId | string | 255 | yes | - |
| front | string | 5000 | yes | - |
| back | string | 5000 | yes | - |
| sortOrder | integer | - | yes | 0 |
| createdAt | datetime | - | yes | - |

**Indexes:**
- `idx_deck` on `deckId`
- `idx_deck_order` on `[deckId, sortOrder]`

**Permissions:**
- Create: `user:{creatorId}` (via deck ownership)
- Read: `users`
- Update: `user:{creatorId}`
- Delete: `user:{creatorId}`

### Collection: `deck_assignments`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| deckId | string | 255 | yes | - |
| classId | string | 255 | yes | - |
| isRequired | boolean | - | yes | false |
| assignedAt | datetime | - | yes | - |

**Indexes:**
- `idx_class` on `classId`
- `idx_deck` on `deckId`

**Permissions:**
- Create: `users`
- Read: `users`
- Update: `users`
- Delete: `users`

### Collection: `card_reviews`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| userId | string | 255 | yes | - |
| cardId | string | 255 | yes | - |
| deckId | string | 255 | yes | - |
| rating | enum | - | yes | - |
| reviewAt | datetime | - | yes | - |
| previousState | string | 2000 | no | - |
| newState | string | 2000 | no | - |
| deviceId | string | 255 | no | - |
| operationId | string | 255 | yes | - |

**Enum values for rating:** `again`, `hard`, `good`, `easy`

**Indexes:**
- `idx_user_card` on `[userId, cardId]`
- `idx_user_deck` on `[userId, deckId]`
- `idx_operation` on `operationId` (unique, for idempotency)

**Permissions:**
- Create: `user:{userId}`
- Read: `user:{userId}` (own reviews) + teachers (aggregated via function)
- Update: `user:{userId}`
- Delete: `user:{userId}`

### Collection: `student_card_state`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| userId | string | 255 | yes | - |
| cardId | string | 255 | yes | - |
| deckId | string | 255 | yes | - |
| fsrsState | string | 2000 | no | - |
| dueDate | datetime | - | yes | - |
| status | enum | - | yes | new |
| lastReviewAt | datetime | - | no | - |
| reviewCount | integer | - | yes | 0 |

**Enum values for status:** `new`, `learning`, `review`, `relearning`

**Indexes:**
- `idx_user_due` on `[userId, dueDate]`
- `idx_user_deck` on `[userId, deckId]`
- `idx_user_card` on `[userId, cardId]` (unique)

**Permissions:**
- Create: `user:{userId}`
- Read: `user:{userId}` (own state) + teachers (aggregated via function)
- Update: `user:{userId}`
- Delete: `user:{userId}`

### Collection: `student_deck_notes`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| userId | string | 255 | yes | - |
| cardId | string | 255 | yes | - |
| personalNote | string | 5000 | no | - |
| personalExample | string | 5000 | no | - |

**Indexes:**
- `idx_user_card` on `[userId, cardId]` (unique)

**Permissions:**
- Create: `user:{userId}`
- Read: `user:{userId}`
- Update: `user:{userId}`
- Delete: `user:{userId}`

### Collection: `reading_progress`

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| userId | string | 255 | yes | - |
| readingId | string | 255 | yes | - |
| scrollPercent | integer | - | yes | 0 |
| lastPosition | integer | - | yes | 0 |
| bookmarked | boolean | - | yes | false |
| updatedAt | datetime | - | yes | - |

**Indexes:**
- `idx_user_reading` on `[userId, readingId]` (unique)

**Permissions:**
- Create: `user:{userId}`
- Read: `user:{userId}`
- Update: `user:{userId}`
- Delete: `user:{userId}`

## Step 5: Create Appwrite Functions

### Function: `getAnonymousQuestions`

**Purpose:** Returns sanitized questions (no author info) for students.

**Runtime:** Node.js 18+

**Input:**
```json
{
  "assignmentId": "string",
  "userId": "string"
}
```

**Logic:**
1. Verify user has submitted at least one question for this assignment
2. Query visible questions for the assignment
3. Strip `authorId` and any identifying fields
4. Add `hasVoted` flag per user
5. Return sanitized list

**Output:** JSON array of anonymous questions

### Function: `submitQuestion`

**Purpose:** Submit a question with server-side validation.

**Input:**
```json
{
  "assignmentId": "string",
  "readingId": "string",
  "questionText": "string",
  "selectedPassage": "string"
}
```

**Logic:**
1. Verify user is authenticated
2. Verify user is enrolled in the class
3. Create question document with `authorId` from auth context
4. Return success

### Function: `toggleVote`

**Purpose:** Toggle upvote with validation.

**Input:**
```json
{
  "questionId": "string",
  "remove": false
}
```

**Logic:**
1. Verify question exists and is visible
2. Verify user isn't voting on own question
3. Check vote limit (3 per assignment)
4. Create or delete vote
5. Update question vote count

### Function: `teacherProgress`

**Purpose:** Return aggregated flashcard progress for a class.

**Input:**
```json
{
  "classId": "string"
}
```

**Logic:**
1. Verify caller is the class teacher
2. Aggregate `student_card_state` for class members
3. Return broad categories (not started, learning, review, due, completed)
4. No individual card details

## Step 6: Configure Storage (Optional)

1. Go to **Storage**
2. Create a bucket for reading attachments (if needed)
3. Set file size limit to 10MB
4. Allow authenticated read access

## Step 7: Set Environment Variables

After creating all resources, update `.env`:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_FN_GET_QUESTIONS=your_fn_id
VITE_APPWRITE_FN_SUBMIT_QUESTION=your_fn_id
VITE_APPWRITE_FN_TOGGLE_VOTE=your_fn_id
VITE_APPWRITE_FN_TEACHER_PROGRESS=your_fn_id
```

## Troubleshooting

### CORS Errors
Appwrite Cloud handles CORS automatically for the web SDK. Ensure your domain is added to the **Platforms** section in your Appwrite project settings.

### Permission Errors
Check that collection permissions match the schema above. The most common issue is missing `Create` permission for authenticated users.

### Function Timeouts
Appwrite Functions have a 15-second timeout by default. For large datasets, consider pagination.

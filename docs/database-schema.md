# Database Schema Documentation

## Overview

EduSpark uses two storage layers:
- **Appwrite Cloud** - Server-side database for authoritative data
- **IndexedDB (Dexie)** - Client-side database for offline-first access

## Appwrite Collections

See `docs/appwrite-setup.md` for the full collection definitions with attributes, indexes, and permissions.

### Entity Relationship Diagram

```
users ─┬─< classes (teacherId)
       ├─< class_members (userId)
       ├─< readings (teacherId)
       ├─< annotations (userId)
       ├─< discussion_questions (authorId)
       ├─< question_votes (userId)
       ├─< flashcard_decks (creatorId)
       ├─< card_reviews (userId)
       ├─< student_card_state (userId)
       ├─< student_deck_notes (userId)
       └─< reading_progress (userId)

classes ─┬─< class_members (classId)
         ├─< reading_assignments (classId)
         └─< deck_assignments (classId)

readings ─┬─< reading_assignments (readingId)
          ├─< annotations (readingId)
          └─< discussion_questions (readingId)

flashcard_decks ─┬─< flashcard_cards (deckId)
                 ├─< deck_assignments (deckId)
                 └─< card_reviews (deckId)

flashcard_cards ─┬─< card_reviews (cardId)
                 ├─< student_card_state (cardId)
                 └─< student_deck_notes (cardId)

discussion_questions ─< question_votes (questionId)

reading_assignments ─< discussion_questions (assignmentId)
```

## IndexedDB Schema (Dexie)

The local database mirrors the server schema with additional sync metadata.

### Table: `users`
- **Primary key:** `$id`
- **Indexes:** `email`, `role`

### Table: `classes`
- **Primary key:** `$id`
- **Indexes:** `teacherId`, `joinCode`, `status`

### Table: `class_members`
- **Primary key:** `$id`
- **Indexes:** `classId`, `userId`, `[classId+userId]` (compound)

### Table: `readings`
- **Primary key:** `$id`
- **Indexes:** `teacherId`, `status`

### Table: `reading_assignments`
- **Primary key:** `$id`
- **Indexes:** `readingId`, `classId`

### Table: `annotations`
- **Primary key:** `$id`
- **Indexes:** `readingId`, `userId`, `type`, `syncStatus`
- **Extra field:** `syncStatus` (local, syncing, synced, conflict)

### Table: `discussion_questions`
- **Primary key:** `$id`
- **Indexes:** `readingId`, `assignmentId`, `authorId`, `moderationStatus`
- **Extra field:** `syncStatus`

### Table: `question_votes`
- **Primary key:** `$id`
- **Indexes:** `questionId`, `userId`
- **Extra field:** `syncStatus`

### Table: `flashcard_decks`
- **Primary key:** `$id`
- **Indexes:** `creatorId`, `type`, `status`

### Table: `flashcard_cards`
- **Primary key:** `$id`
- **Indexes:** `deckId`, `sortOrder`

### Table: `deck_assignments`
- **Primary key:** `$id`
- **Indexes:** `deckId`, `classId`

### Table: `card_reviews`
- **Primary key:** `$id`
- **Indexes:** `userId`, `cardId`, `deckId`, `operationId`
- **Extra field:** `syncStatus`

### Table: `student_card_state`
- **Primary key:** `$id` (composite: `{userId}_{cardId}`)
- **Indexes:** `userId`, `cardId`, `deckId`, `dueDate`, `status`

### Table: `student_deck_notes`
- **Primary key:** `$id` (composite: `{userId}_{cardId}`)
- **Indexes:** `userId`, `cardId`

### Table: `reading_progress`
- **Primary key:** `$id` (composite: `{userId}_{readingId}`)
- **Indexes:** `userId`, `readingId`
- **Extra field:** `syncStatus`

### Table: `sync_queue`
- **Primary key:** auto-increment `id`
- **Indexes:** `operationId`, `userId`, `entityType`, `entityId`, `syncStatus`, `createdAt`

### Table: `app_metadata`
- **Primary key:** `key`
- Stores: `currentUserId`, `lastSyncAt`

## Data Types

### SyncStatus
```typescript
type SyncStatus = 'local' | 'syncing' | 'synced' | 'conflict';
```

### UserRole
```typescript
type UserRole = 'student' | 'teacher' | 'admin';
```

### ReviewRating
```typescript
type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
```

### CardStatus
```typescript
type CardStatus = 'new' | 'learning' | 'review' | 'relearning';
```

## Indexes Summary

| Collection | Index Name | Fields | Type |
|-----------|------------|--------|------|
| class_members | idx_class_user | classId, userId | unique |
| class_members | idx_user | userId | non-unique |
| annotations | idx_reading_user | readingId, userId | non-unique |
| discussion_questions | idx_assignment | assignmentId | non-unique |
| question_votes | idx_user_question | userId, questionId | unique |
| card_reviews | idx_operation | operationId | unique |
| card_reviews | idx_user_card | userId, cardId | non-unique |
| student_card_state | idx_user_card | userId, cardId | unique |
| student_card_state | idx_user_due | userId, dueDate | non-unique |
| reading_progress | idx_user_reading | userId, readingId | unique |

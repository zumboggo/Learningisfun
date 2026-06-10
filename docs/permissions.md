# Permissions Documentation

## Role-Based Access Control

EduSpark implements RBAC at three layers:
1. **UI Layer** - Components conditionally render based on user role
2. **Service Layer** - Business logic enforces access rules
3. **Database Layer** - Appwrite document permissions enforce server-side

## Roles

### Student
- Can join classes via join code
- Can view assigned readings
- Can create private and teacher-visible annotations
- Can submit discussion questions
- Can upvote classmates' questions (after submitting own)
- Can review assigned flashcard decks
- Can create and manage personal flashcard decks
- Can import CSV flashcard decks

### Teacher
- All student permissions
- Can create and manage classes
- Can generate/regenerate join codes
- Can create and publish readings
- Can assign readings and decks to classes
- Can create flashcard decks
- Can import CSV flashcard decks
- Can view student question authorship
- Can moderate discussion questions
- Can view aggregated student progress
- Can view teacher-visible annotations

### Administrator
- All teacher permissions
- Can manage teacher accounts
- Can disable accounts
- Can access audit tools
- Can moderate any content

## Permission Enforcement Matrix

| Operation | Student | Teacher | Admin |
|-----------|---------|---------|-------|
| **Classes** | | | |
| Create class | ✗ | ✓ | ✓ |
| View own classes | ✓ | ✓ | ✓ |
| Join class | ✓ | ✓ | ✓ |
| Manage class members | ✗ | Own classes | All |
| Regenerate join code | ✗ | Own classes | All |
| **Readings** | | | |
| Create reading | ✗ | ✓ | ✓ |
| View assigned readings | ✓ | ✓ | ✓ |
| Publish reading | ✗ | Creator | All |
| **Annotations** | | | |
| Create private note | ✓ (own) | ✓ (own) | ✓ (own) |
| Create teacher-visible note | ✓ (own) | ✓ (own) | ✓ (own) |
| View private notes | Own only | ✗ | ✗ |
| View teacher-visible notes | Own + own class | Own classes | All |
| **Discussion Questions** | | | |
| Submit question | ✓ (enrolled) | ✓ | ✓ |
| View anonymous questions | After own submission | All | All |
| View question authorship | ✗ | Own classes | All |
| Moderate questions | ✗ | Own classes | All |
| Vote on question | ✓ (not own) | ✓ (not own) | ✓ (not own) |
| **Flashcards** | | | |
| Create teacher deck | ✗ | ✓ | ✓ |
| Create personal deck | ✓ | ✓ | ✓ |
| View assigned decks | ✓ | ✓ | ✓ |
| View personal decks | Own only | Own only | All |
| Review cards | ✓ (assigned) | ✓ | ✓ |
| View student progress | Own only | Aggregated | All |
| **Sync** | | | |
| Sync own data | ✓ | ✓ | ✓ |
| View sync status | Own only | Class students | All |

## Server-Side Enforcement

### Appwrite Document Permissions

Each document uses Appwrite's permission system:

```javascript
// Example: Student creates an annotation
{
  $permissions: [
    Permission.create(Role.user(userId)),
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}
```

### Appwrite Functions

Functions validate permissions before executing:

```javascript
// getAnonymousQuestions function
async function handler(req) {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) throw new Error('Unauthorized');

  // Verify user submitted a question
  const hasSubmitted = await checkSubmission(userId, assignmentId);
  if (!hasSubmitted) throw new Error('Must submit first');

  // Return sanitized questions (no authorId)
  return sanitizeQuestions(questions);
}
```

### Client-Side Guards

```typescript
// Route protection
function TeacherRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  return children;
}

// Component guards
function ModerationPanel({ classId }) {
  const { user } = useAuth();
  if (!isClassTeacher(user, classId)) return null;
  // ... render moderation UI
}
```

## Data Isolation Rules

### Student Data Privacy
- Personal flashcard decks are never visible to teachers or classmates
- Private annotations are only visible to the owning student
- Individual card review history is private
- FSRS scheduling state is private

### Teacher Visibility
- Teachers can see teacher-visible annotations on their class readings
- Teachers can see question authorship for their class assignments
- Teachers see aggregated progress (not individual card details)
- Teachers can see which students have synced recently

### Anonymous Questions
- Student questions appear anonymous to other students
- Author information is stripped at the API layer (Appwrite Function)
- Teachers can see authorship for moderation purposes
- Vote counts are visible but voter identities are not

## Security Considerations

### Document-Level Security
- Each document has explicit read/write permissions
- Permissions are set at creation time
- Cross-user access is prevented by Appwrite's permission engine

### Function-Level Security
- Functions validate the calling user's identity
- Functions check class membership before returning data
- Functions strip sensitive fields before returning to students

### Client-Side Security
- UI hides unauthorized data
- API calls include proper auth context
- Sensitive operations require re-authentication (future)

### Audit Trail
- Moderation actions are logged
- Class membership changes are logged
- Question deletions are logged
- Account changes are logged

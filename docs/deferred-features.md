# Deferred Post-MVP Features

This document lists features that are intentionally excluded from the MVP but should be considered for future releases.

## High Priority

### Passkey Authentication
- Add WebAuthn/passkey support for students
- Teacher-created usernames for younger students
- Maintain email/password as fallback

### Rich Text Editor
- Replace plain textarea with rich text editor for readings
- Support formatting (bold, italic, lists, headings)
- Markdown preview for teachers

### PDF Support
- Upload and annotate PDF documents
- PDF rendering with text selection
- PDF annotation anchors

### Real-Time Collaboration
- Live question board updates
- Real-time vote counts
- Presence indicators

### Push Notifications
- Notify students of new readings
- Notify students of deck assignments
- Notify teachers of new questions

### Offline Image Support
- Cache images in readings
- Support image-based flashcards
- Offline image storage

## Medium Priority

### Advanced Analytics
- Detailed student progress tracking
- Class performance comparisons
- Reading time analytics
- Question engagement metrics

### Export Features
- Export flashcard decks to Anki format
- Export annotations to PDF
- Export question boards

### Accessibility Enhancements
- Full screen reader support
- Keyboard navigation for all features
- High contrast mode
- Font size persistence

### Multi-Language UI
- Interface localization
- RTL language support
- Language selection

### Collaborative Annotations
- Shared class annotations
- Annotation threads
- Teacher annotation highlights

## Low Priority

### Gamification
- Achievement badges
- Study streaks
- Leaderboards (opt-in)

### Content Library
- Public flashcard deck library
- Shared reading collections
- Template readings

### Advanced Flashcard Features
- Image occlusion cards
- Cloze deletion cards
- Audio cards
- Card templates

### Parent/Guardian Access
- Read-only progress view
- Email summaries
- Account linking

### API for Third-Party Integration
- REST API for external tools
- LTI integration for LMS
- Webhook support

### Advanced Moderation
- Automated content filtering
- Bulk moderation tools
- Moderation history
- Appeal process

### Data Export/Import
- Full account data export (GDPR)
- Class data export
- Backup/restore functionality

### Advanced Search
- Full-text search across readings
- Search annotations
- Search questions

### Offline-First Sync Improvements
- Conflict resolution UI
- Selective sync (choose what to sync)
- Bandwidth-aware sync
- Sync over WiFi only option

### Teacher Tools
- Rubric creation
- Assignment grading
- Student grouping
- Discussion facilitation tools

## Technical Debt

### Performance
- Virtual scrolling for long reading lists
- Lazy loading for large decks
- Image optimization
- Bundle size optimization

### Testing
- End-to-end tests with Playwright
- Visual regression tests
- Performance benchmarks
- Load testing for sync

### Infrastructure
- Error monitoring (Sentry)
- Analytics (privacy-respecting)
- Feature flags
- A/B testing framework

### Code Quality
- Storybook for component development
- Stricter TypeScript settings
- Automated code review
- Documentation generation

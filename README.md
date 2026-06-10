# EduSpark

Offline-first educational flashcard and reading Progressive Web App for high-school students.

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+
- An Appwrite Cloud account (free tier works)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd edu-spark

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Appwrite project credentials
# See docs/appwrite-setup.md for detailed instructions

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `VITE_APPWRITE_ENDPOINT` | Appwrite API endpoint (default: `https://cloud.appwrite.io/v1`) |
| `VITE_APPWRITE_PROJECT_ID` | Your Appwrite project ID |
| `VITE_APPWRITE_DATABASE_ID` | Database ID from Appwrite console |
| `VITE_APPWRITE_STORAGE_BUCKET_ID` | Storage bucket ID (optional for MVP) |
| `VITE_APPWRITE_FN_*` | Appwrite Function IDs (see setup guide) |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** TailwindCSS 4 (mobile-first)
- **Routing:** React Router 7
- **Local DB:** Dexie (IndexedDB)
- **Backend:** Appwrite Cloud
- **Flashcard Scheduling:** ts-fsrs
- **PWA:** vite-plugin-pwa + Workbox
- **Testing:** Vitest, Testing Library

## Project Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Router configuration
├── index.css             # Global styles + Tailwind
├── db/
│   └── schema.ts         # Dexie IndexedDB schema
├── lib/
│   ├── appwrite.ts       # Appwrite client configuration
│   └── fsrs.ts           # FSRS flashcard scheduling wrapper
├── services/             # Business logic layer
│   ├── auth.service.ts   # Authentication
│   ├── class.service.ts  # Class management
│   ├── reading.service.ts # Readings & assignments
│   ├── annotation.service.ts # Highlights & notes
│   ├── question.service.ts # Discussion questions
│   ├── flashcard.service.ts # Decks, cards, reviews
│   └── sync.service.ts   # Sync queue engine
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
├── components/           # Reusable UI components
│   ├── layout/           # App shell, nav, sync indicator
│   ├── common/           # Button, Card, Modal
│   ├── reading/          # Reading view components
│   ├── flashcard/        # Flashcard components
│   └── discussion/       # Discussion components
├── pages/                # Route pages
│   └── teacher/          # Teacher-specific pages
├── utils/                # Utility functions
│   ├── csv-parser.ts     # CSV parsing & column detection
│   └── helpers.ts        # ID generation, etc.
├── types/
│   └── index.ts          # TypeScript type definitions
└── test/                 # Test files
```

## Architecture

### Offline-First Design

Every write goes to IndexedDB first, then queues for Appwrite sync:

1. User action → Write to IndexedDB
2. Add operation to sync queue
3. Sync engine processes queue when online
4. UI updates via Dexie `liveQuery` reactivity

### Sync Triggers

- App opens
- Internet connection restored
- Tab becomes visible
- After local change (debounced 2s)
- Manual sync button

### Conflict Resolution

- **Additive records** (reviews, votes, annotations): Preserve both, deduplicate by operationId
- **Editable content** (notes, personal decks): Prefer newest by timestamp
- **Teacher content** (readings, decks): Teacher version is authoritative; preserve student data

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run test suite with Vitest |
| `npm run lint` | Run ESLint |

## Deployment

See `docs/deployment.md` for detailed deployment instructions.

The app builds to static files in `dist/` and can be deployed to any static hosting:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## Documentation

- [Architecture](docs/architecture.md) - System design, DB schema, sync design
- [Appwrite Setup](docs/appwrite-setup.md) - Backend configuration guide
- [Database Schema](docs/database-schema.md) - Collections, indexes, permissions
- [Offline Sync Design](docs/offline-sync.md) - Sync queue, conflict resolution
- [Deployment](docs/deployment.md) - PWA deployment instructions
- [CSV Templates](docs/csv-templates.md) - Example CSV formats
- [Deferred Features](docs/deferred-features.md) - Post-MVP roadmap

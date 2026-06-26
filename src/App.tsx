import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ReadingPage } from '@/pages/ReadingPage';
import { ReadingsListPage } from '@/pages/ReadingsListPage';
import { FlashcardReviewPage } from '@/pages/FlashcardReviewPage';
import { DecksListPage } from '@/pages/DecksListPage';
import { QuestionBoardPage } from '@/pages/QuestionBoardPage';
import { ClassesListPage } from '@/pages/ClassesListPage';
import { ClassDetailPage } from '@/pages/ClassDetailPage';
import { ClassSessionPage } from '@/pages/ClassSessionPage';
import { ResponsePage } from '@/pages/ResponsePage';
import { SubmissionReviewPage } from '@/pages/SubmissionReviewPage';
import { ParticipationReportPage } from '@/pages/ParticipationReportPage';
import { FlashcardAnalyticsPage } from '@/pages/FlashcardAnalyticsPage';
import { ImportDeckPage } from '@/pages/ImportDeckPage';
import { CreateClassPage } from '@/pages/teacher/CreateClassPage';
import { CreateReadingPage } from '@/pages/teacher/CreateReadingPage';
import { CreateDeckPage } from '@/pages/teacher/CreateDeckPage';
import { QuestionModerationPage } from '@/pages/teacher/QuestionModerationPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function TeacherRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/readings" element={<ProtectedRoute><ReadingsListPage /></ProtectedRoute>} />
          <Route path="/readings/:id" element={<ProtectedRoute><ReadingPage /></ProtectedRoute>} />
          <Route path="/readings/:readingId/questions" element={<ProtectedRoute><QuestionBoardPage /></ProtectedRoute>} />
          <Route path="/assignments/:assignmentId/respond" element={<ProtectedRoute><ResponsePage /></ProtectedRoute>} />
          <Route path="/assignments/:assignmentId/submissions" element={<ProtectedRoute><TeacherRoute><SubmissionReviewPage /></TeacherRoute></ProtectedRoute>} />

          <Route path="/decks" element={<ProtectedRoute><DecksListPage /></ProtectedRoute>} />
          <Route path="/decks/:deckId/review" element={<ProtectedRoute><FlashcardReviewPage /></ProtectedRoute>} />
          <Route path="/decks/import" element={<ProtectedRoute><ImportDeckPage /></ProtectedRoute>} />

          <Route path="/classes" element={<ProtectedRoute><ClassesListPage /></ProtectedRoute>} />
          <Route path="/classes/:classId" element={<ProtectedRoute><ClassDetailPage /></ProtectedRoute>} />
          <Route path="/classes/:classId/reports" element={<ProtectedRoute><TeacherRoute><ParticipationReportPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/classes/:classId/decks/:deckId/progress" element={<ProtectedRoute><TeacherRoute><FlashcardAnalyticsPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/sessions/:sessionId" element={<ProtectedRoute><ClassSessionPage /></ProtectedRoute>} />

          <Route path="/readings/new" element={<ProtectedRoute><TeacherRoute><CreateReadingPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/decks/new" element={<ProtectedRoute><TeacherRoute><CreateDeckPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/classes/new" element={<ProtectedRoute><TeacherRoute><CreateClassPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/questions/:assignmentId/moderate" element={<ProtectedRoute><TeacherRoute><QuestionModerationPage /></TeacherRoute></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

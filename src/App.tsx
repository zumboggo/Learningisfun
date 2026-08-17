import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { JoinClassPage } from '@/pages/JoinClassPage';
import { DashboardPage } from '@/pages/DashboardPage';

import { FlashcardReviewPage } from '@/pages/FlashcardReviewPage';
import { DecksListPage } from '@/pages/DecksListPage';
import { DiscussionsListPage } from '@/pages/DiscussionsListPage';
import { DiscussionPage } from '@/pages/DiscussionPage';
import { QuizzesPage } from '@/pages/QuizzesPage';
import { QuizTakingPage } from '@/pages/QuizTakingPage';
import { WritingPage } from '@/pages/WritingPage';
import { TextsPage } from '@/pages/TextsPage';
import { TextReaderPage } from '@/pages/TextReaderPage';
import { WritingWorkspacePage } from '@/pages/WritingWorkspacePage';
import { WritingResponsesPage } from '@/pages/teacher/WritingResponsesPage';
import { StudentProgressPage } from '@/pages/StudentProgressPage';
import { ClassesListPage } from '@/pages/ClassesListPage';
import { ClassDetailPage } from '@/pages/ClassDetailPage';
import { ClassSessionPage } from '@/pages/ClassSessionPage';
import { TodayNotesPage } from '@/pages/TodayNotesPage';

import { ParticipationReportPage } from '@/pages/ParticipationReportPage';
import { FlashcardAnalyticsPage } from '@/pages/FlashcardAnalyticsPage';
import { ImportDeckPage } from '@/pages/ImportDeckPage';
import { CreateClassPage } from '@/pages/teacher/CreateClassPage';
import { AddClassCardsPage } from '@/pages/teacher/AddClassCardsPage';

import { CreateDeckPage } from '@/pages/teacher/CreateDeckPage';
import { DeckPresentPage } from '@/pages/teacher/DeckPresentPage';
import { TeacherSettingsPage } from '@/pages/TeacherSettingsPage';

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
  const { user, isTeacher } = useAuth();
  if (!user || !isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

/** Signed-in teacher route rendered without the app chrome (slideshow, projector views). */
function FullscreenTeacherRoute({ children }: { children: ReactNode }) {
  const { user, isTeacher, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isTeacher) return <Navigate to="/dashboard" replace />;
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

          {/* Public: works signed out (sign up + enrol) and signed in (enrol only) */}
          <Route path="/join" element={<JoinClassPage />} />
          <Route path="/join/:code" element={<JoinClassPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/discussions" element={<ProtectedRoute><DiscussionsListPage /></ProtectedRoute>} />
          <Route path="/discussions/:sessionId" element={<ProtectedRoute><DiscussionPage /></ProtectedRoute>} />

          <Route path="/quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
          <Route path="/quizzes/:quizId/take" element={<ProtectedRoute><QuizTakingPage /></ProtectedRoute>} />

          <Route path="/writing" element={<ProtectedRoute><WritingPage /></ProtectedRoute>} />
          <Route path="/texts" element={<ProtectedRoute><TextsPage /></ProtectedRoute>} />
          <Route path="/texts/:textId" element={<ProtectedRoute><TextReaderPage /></ProtectedRoute>} />
          <Route path="/writing/:promptId" element={<ProtectedRoute><WritingWorkspacePage /></ProtectedRoute>} />
          <Route path="/writing/:promptId/responses" element={<ProtectedRoute><TeacherRoute><WritingResponsesPage /></TeacherRoute></ProtectedRoute>} />

          <Route path="/decks" element={<ProtectedRoute><DecksListPage /></ProtectedRoute>} />
          <Route path="/decks/:deckId/review" element={<ProtectedRoute><FlashcardReviewPage /></ProtectedRoute>} />
          <Route path="/decks/:deckId/present" element={<FullscreenTeacherRoute><DeckPresentPage /></FullscreenTeacherRoute>} />
          <Route path="/decks/import" element={<ProtectedRoute><ImportDeckPage /></ProtectedRoute>} />
          <Route path="/decks/new" element={<ProtectedRoute><TeacherRoute><CreateDeckPage /></TeacherRoute></ProtectedRoute>} />

          <Route path="/classes" element={<ProtectedRoute><ClassesListPage /></ProtectedRoute>} />
          <Route path="/classes/:classId" element={<ProtectedRoute><ClassDetailPage /></ProtectedRoute>} />
          <Route path="/classes/:classId/cards/new" element={<ProtectedRoute><TeacherRoute><AddClassCardsPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/classes/:classId/reports" element={<ProtectedRoute><TeacherRoute><ParticipationReportPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/classes/:classId/decks/:deckId/progress" element={<ProtectedRoute><TeacherRoute><FlashcardAnalyticsPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/classes/:classId/students/:studentId/progress" element={<ProtectedRoute><TeacherRoute><StudentProgressPage /></TeacherRoute></ProtectedRoute>} />
          <Route path="/classes/:classId/notes/today" element={<FullscreenTeacherRoute><TodayNotesPage /></FullscreenTeacherRoute>} />

          <Route path="/settings" element={<ProtectedRoute><TeacherRoute><TeacherSettingsPage /></TeacherRoute></ProtectedRoute>} />

          <Route path="/sessions/:sessionId" element={<ProtectedRoute><ClassSessionPage /></ProtectedRoute>} />

          <Route path="/classes/new" element={<ProtectedRoute><TeacherRoute><CreateClassPage /></TeacherRoute></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { VetProvider } from './context/VetContext';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { BugReportWidget } from './components/BugReportWidget';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { RouteLoadingFallback } from './components/ui/RouteLoadingFallback';
import { OrgDeletionBanner } from './components/OrgDeletionBanner';
import { ReleaseNotesModal } from './components/ReleaseNotesModal';

// Code-splitting por rutas para aligerar la carga inicial en móviles y tablets
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const PatientRecord = lazy(() => import('./pages/PatientRecord'));
const SearchPatient = lazy(() => import('./pages/SearchPatient'));
const NewPatient = lazy(() => import('./pages/NewPatient'));
const UpcomingEvents = lazy(() => import('./pages/UpcomingEvents'));

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <VetProvider>
          <OrgDeletionBanner />
          <ReleaseNotesModal />
          <GlobalErrorBoundary>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/patient/search" element={<ProtectedRoute><SearchPatient /></ProtectedRoute>} />
                <Route path="/patient/new" element={<ProtectedRoute><NewPatient /></ProtectedRoute>} />
                <Route path="/patient/edit/:id" element={<ProtectedRoute><NewPatient /></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><UpcomingEvents /></ProtectedRoute>} />
                <Route path="/patient/:id" element={<ProtectedRoute><PatientRecord /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </GlobalErrorBoundary>
          <BugReportWidget />
        </VetProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;

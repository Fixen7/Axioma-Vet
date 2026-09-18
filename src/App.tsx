import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import PatientRecord from './pages/PatientRecord';
import SearchPatient from './pages/SearchPatient';
import NewPatient from './pages/NewPatient';
import UpcomingEvents from './pages/UpcomingEvents';
import Login from './pages/Login';
import { VetProvider } from './context/VetContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { BugReportWidget } from './components/BugReportWidget';

function App() {
  return (
    <AuthProvider>
      <VetProvider>
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
        <BugReportWidget />
      </VetProvider>
    </AuthProvider>
  );
}

export default App;


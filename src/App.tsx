import { Navigate, Route, Routes } from 'react-router-dom';
import AppHome from './pages/AppHome';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Signup from './pages/Signup';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthProvider';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-status" role="status" aria-live="polite">
        Loading your session...
      </div>
    );
  }

  return <Navigate to={user ? '/app' : '/login'} replace />;
};

const App = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <AppHome />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;

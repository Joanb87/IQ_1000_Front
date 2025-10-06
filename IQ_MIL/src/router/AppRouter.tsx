import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage/LoginPage';
import { DashboardRouter } from '../components/dashboard/DashboardRouter';
import { useAuth } from '../context/AuthContext';

// Componente de error de validación
const ValidationError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <h2>Error de Autenticación</h2>
    <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
    <button 
      onClick={onRetry}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#ed1b22',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Intentar de nuevo
    </button>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, validationError, validateUser } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  if (validationError) {
    return <ValidationError error={validationError} onRetry={validateUser} />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/dashboard/*" element={
          <PrivateRoute>
            <DashboardRouter />
          </PrivateRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};
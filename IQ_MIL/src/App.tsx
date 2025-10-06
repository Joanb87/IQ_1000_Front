import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './router/AppRouter';
import { AuthGuard } from './components/auth/AuthGuard/AuthGuard';

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppRouter />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
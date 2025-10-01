import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { auth } from '../config/firebase';
import type { User } from 'firebase/auth';
import type { UserData, UserRole } from '../types/auth';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged((firebaseUser: User | null) => {
      if (firebaseUser) {
        // Por ahora, asignamos un rol por defecto 'usuario'
        // En un caso real, esto vendría del backend
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'usuario',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const setUserRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const value = {
    user,
    loading,
    setUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
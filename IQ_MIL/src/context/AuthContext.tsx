import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { auth } from '../config/firebase';
import type { User } from 'firebase/auth';
import type { UserData, UserRole, BackendUserInfo } from '../types/auth';

const BACKEND_USER_STORAGE_KEY = 'auth_backend_user';

function mapRolNombreToUserRole(rolNombre?: string | null): UserRole {
  if (!rolNombre) return 'usuario';
  const n = rolNombre.toLowerCase();
  if (n.startsWith('admin')) return 'admin';
  if (n.startsWith('líder') || n.startsWith('lider')) return 'lider';
  return 'usuario';
}

interface PersistedBackendData {
  backend: BackendUserInfo;
  token?: string;
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  setUserRole: (role: UserRole) => void;
  setUserFromBackend: (params: { firebaseUser: User; backend: BackendUserInfo; token: string }) => void;
  signOutLocal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged((firebaseUser: User | null) => {
      if (firebaseUser) {
        // Intentamos rehidratar datos persistidos del backend
        try {
          const raw = localStorage.getItem(BACKEND_USER_STORAGE_KEY);
          if (raw) {
            const persisted: PersistedBackendData = JSON.parse(raw);
            if (persisted.uid === firebaseUser.uid) {
              const role = mapRolNombreToUserRole(persisted.backend.rol_nombre);
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role,
                displayName: firebaseUser.displayName ?? persisted.backend.nombre ?? null,
                photoURL: firebaseUser.photoURL,
                token: persisted.token,
                roleId: persisted.backend.role_id,
                roleName: persisted.backend.rol_nombre,
                idLeader: persisted.backend.id_lider ?? null,
                active: persisted.backend.activo,
                rawBackend: persisted.backend
              });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('No se pudo rehidratar datos de backend:', e);
        }

        // Fallback mínimo si no hay persistencia todavía
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'usuario',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
        localStorage.removeItem(BACKEND_USER_STORAGE_KEY);
      }
      setLoading(false);
    });
  }, []);

  const setUserRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
      // Actualizamos también el rol en la persistencia si existe
      try {
        const raw = localStorage.getItem(BACKEND_USER_STORAGE_KEY);
        if (raw) {
          const persisted: PersistedBackendData = JSON.parse(raw);
          persisted.backend.rol_nombre = role; // Guardamos simple por consistencia
          localStorage.setItem(BACKEND_USER_STORAGE_KEY, JSON.stringify(persisted));
        }
      } catch { /* noop */ }
    }
  };

  const setUserFromBackend: AuthContextType['setUserFromBackend'] = ({ firebaseUser, backend, token }) => {
    const role = mapRolNombreToUserRole(backend.rol_nombre);
    const enriched: UserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role,
      displayName: firebaseUser.displayName ?? backend.nombre ?? null,
      photoURL: firebaseUser.photoURL,
      token,
      roleId: backend.role_id,
      roleName: backend.rol_nombre,
      idLeader: backend.id_lider ?? null,
      active: backend.activo,
      rawBackend: backend
    };
    setUser(enriched);
    try {
      const persisted: PersistedBackendData = {
        backend,
        token,
        uid: firebaseUser.uid,
        email: firebaseUser.email
      };
      localStorage.setItem(BACKEND_USER_STORAGE_KEY, JSON.stringify(persisted));
    } catch (e) {
      console.warn('No se pudo persistir datos de backend:', e);
    }
  };

  const signOutLocal = async () => {
    await auth.signOut();
    localStorage.removeItem(BACKEND_USER_STORAGE_KEY);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    setUserRole,
    setUserFromBackend,
    signOutLocal,
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
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { auth } from '../config/firebase';
import type { User } from 'firebase/auth';
import type { UserData, UserRole, BackendUserInfo } from '../types/auth';
import { authValidationService } from '../services/authValidationService';

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
  validationError: string | null;
  isValidatingUser: boolean;
  setUserRole: (role: UserRole) => void;
  setUserFromBackend: (params: { firebaseUser: User; backend: BackendUserInfo; token: string }) => void;
  signOutLocal: () => Promise<void>;
  validateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidatingUser, setIsValidatingUser] = useState(false);

  useEffect(() => {
    return auth.onAuthStateChanged((firebaseUser: User | null) => {
      if (firebaseUser) {
        // Intentamos rehidratar datos persistidos del backend
        try {
          const raw = localStorage.getItem(BACKEND_USER_STORAGE_KEY);
          if (raw) {
            const persisted: PersistedBackendData = JSON.parse(raw);
            console.log('[AuthContext] Rehydrating from localStorage - rol_nombre:', persisted.backend.rol_nombre);
            if (persisted.uid === firebaseUser.uid) {
              const role = mapRolNombreToUserRole(persisted.backend.rol_nombre);
              console.log('[AuthContext] localStorage rehydration - mapped role:', role);
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
            } else {
              console.log('[AuthContext] localStorage UID mismatch, clearing storage');
              localStorage.removeItem(BACKEND_USER_STORAGE_KEY);
            }
          }
        } catch (e) {
          console.warn('No se pudo rehidratar datos de backend:', e);
        }

        // Fallback mínimo si no hay persistencia todavía
        console.log('[AuthContext] Setting fallback user with role: usuario');
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
    console.log('[AuthContext] setUserFromBackend - rol_nombre:', backend.rol_nombre, 'mapped to role:', role);
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

  const validateUser = useCallback(async () => {
    const currentUser = user; // Capture current user to avoid stale closure
    if (!currentUser?.email) return;
    
    setIsValidatingUser(true);
    setValidationError(null);
    
    try {
      const validation = await authValidationService.validateCurrentUser(currentUser.email);
      
      if (!validation.isValid) {
        setValidationError(validation.error || 'Error de validación');
        // Auto logout si el usuario no es válido
        await signOutLocal();
        return;
      }

      // Actualizar datos del usuario si cambió algo en backend
      if (validation.user && validation.role && currentUser) {
        const updatedRole = validation.role;
        const updatedActive = validation.user.activo;
        const updatedRoleId = validation.user.role_id ?? undefined;
        
        // Solo actualizar si realmente cambió algo importante
        const hasChanges = 
          currentUser.role !== updatedRole || 
          currentUser.active !== updatedActive ||
          currentUser.roleId !== updatedRoleId;
          
        if (hasChanges) {
          console.log('[AuthContext] User data changed, updating...', {
            oldRole: currentUser.role,
            newRole: updatedRole,
            oldActive: currentUser.active,
            newActive: updatedActive
          });
          
          const enriched: UserData = {
            ...currentUser,
            role: updatedRole,
            active: updatedActive,
            roleId: updatedRoleId,
            roleName: validation.user.role_id?.toString(),
            rawBackend: validation.user as any
          };
          setUser(enriched);
        }
      }
    } catch (error: any) {
      setValidationError(error?.message || 'Error de conexión');
    } finally {
      setIsValidatingUser(false);
    }
  }, [user?.email]);

  const signOutLocal = async () => {
    await auth.signOut();
    localStorage.removeItem(BACKEND_USER_STORAGE_KEY);
    setUser(null);
    setValidationError(null);
  };

  // Validar usuario cada 5 minutos si está logueado
  useEffect(() => {
    if (!user?.email) return;
    
    // Validar inmediatamente al login
    validateUser();
    
    // Luego validar cada 5 minutos
    const interval = setInterval(() => {
      validateUser();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.email]); // Solo depende del email, no de la función validateUser

  const value: AuthContextType = {
    user,
    loading,
    validationError,
    isValidatingUser,
    setUserRole,
    setUserFromBackend,
    signOutLocal,
    validateUser,
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
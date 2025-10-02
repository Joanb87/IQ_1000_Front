export type UserRole = 'admin' | 'lider' | 'usuario';

// Estructura que devuelve el backend tras verificar el token
export interface BackendUserInfo {
  correo: string;
  nombre: string;
  role_id: number;
  rol_nombre: string; // Ej: "Administrador", "Líder", etc.
  id_lider: number | null;
  activo: boolean;
  // Campos adicionales futuros se pueden agregar sin romper dependencias
  [key: string]: unknown;
}

export interface UserData {
  uid: string;
  email: string | null;
  role: UserRole; // Normalizado para la app
  displayName: string | null;
  photoURL: string | null;
  // Datos enriquecidos del backend
  token?: string; // Firebase ID Token (o token de sesión si el backend devuelve otro en el futuro)
  roleId?: number;
  roleName?: string; // rol_nombre original
  idLeader?: number | null; // id_lider
  active?: boolean; // activo
  rawBackend?: BackendUserInfo; // Referencia completa sin transformar
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface InputGroupProps {
  label: string;
  type: string;
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export type SocialProvider = 'facebook' | 'google' | 'apple';

export interface SocialButtonProps {
  provider: SocialProvider;
  onClick: () => void;
}
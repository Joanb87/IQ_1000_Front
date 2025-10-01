export type UserRole = 'admin' | 'lider' | 'usuario';

export interface UserData {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
  photoURL: string | null;
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
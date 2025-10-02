import { api } from './api';

export interface UsuarioRaw {
  correo: string;
  nombre?: string | null;
  role_id?: number | null;
  id_lider?: string | null; // correo del líder
  activo?: boolean | null;
}

export interface Usuario extends Required<Omit<UsuarioRaw, 'nombre' | 'id_lider' | 'role_id' | 'activo'>> {
  nombre: string | null;
  role_id: number | null;
  id_lider: string | null;
  activo: boolean; // default false
}

function adapt(u: UsuarioRaw): Usuario {
  return {
    correo: u.correo,
    nombre: u.nombre ?? null,
    role_id: u.role_id ?? null,
    id_lider: u.id_lider ?? null,
    activo: u.activo ?? false,
  };
}

export const usuariosService = {
  async listar(): Promise<Usuario[]> {
    const resp = await api.fetchWithAuth('/usuarios');
    const arr: UsuarioRaw[] = Array.isArray(resp) ? resp : resp?.data || [];
    return arr.map(adapt);
  },
  async obtener(correo: string): Promise<Usuario | null> {
    try { const r = await api.fetchWithAuth(`/usuarios/${encodeURIComponent(correo)}`); return adapt(r); } catch { return null; }
  },
  async crear(data: { correo: string; nombre?: string; role_id?: number; id_lider?: string; activo?: boolean; }) {
    return api.fetchWithAuth('/usuarios', { method: 'POST', body: JSON.stringify(data) });
  },
  async actualizar(correo: string, data: Partial<{ nombre: string; role_id: number; id_lider: string; activo: boolean; }>) {
    return api.fetchWithAuth(`/usuarios/${encodeURIComponent(correo)}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async eliminar(correo: string) {
    return api.fetchWithAuth(`/usuarios/${encodeURIComponent(correo)}`, { method: 'DELETE' });
  }
};

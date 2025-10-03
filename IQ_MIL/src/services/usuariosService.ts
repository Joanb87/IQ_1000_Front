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

let _cacheUsuarios: Usuario[] | null = null;
let _inFlightUsuarios: Promise<Usuario[]> | null = null;
let _lastUsuariosTs = 0;
const STALE_MS = 1000 * 60 * 10; // 10 minutos

export const usuariosService = {
  async listar(forceRefresh = false): Promise<Usuario[]> {
    const now = Date.now();
    if (!forceRefresh && _cacheUsuarios && (now - _lastUsuariosTs) < STALE_MS) return _cacheUsuarios;
    if (_inFlightUsuarios) return _inFlightUsuarios;
    _inFlightUsuarios = (async () => {
      try {
        const resp = await api.fetchWithAuth('/usuarios');
        const arr: UsuarioRaw[] = Array.isArray(resp) ? resp : resp?.data || [];
        _cacheUsuarios = arr.map(adapt);
        _lastUsuariosTs = Date.now();
        return _cacheUsuarios;
      } finally { _inFlightUsuarios = null; }
    })();
    return _inFlightUsuarios;
  },
  clearCache() { _cacheUsuarios = null; _lastUsuariosTs = 0; },
  getCached() { return _cacheUsuarios; },
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

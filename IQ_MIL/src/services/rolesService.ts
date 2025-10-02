import { api } from './api';

export interface RolRaw { id: number; nombre: string; }
export interface Rol extends RolRaw {}

export const rolesService = {
  async listar(): Promise<Rol[]> {
    const resp = await api.fetchWithAuth('/roles');
    const arr: RolRaw[] = Array.isArray(resp) ? resp : resp?.data || [];
    return arr;
  },
  async obtener(id: number): Promise<Rol | null> { try { return await api.fetchWithAuth(`/roles/${id}`); } catch { return null; } },
  async crear(data: { id: number; nombre: string }) { return api.fetchWithAuth('/roles', { method: 'POST', body: JSON.stringify(data) }); },
  async actualizar(id: number, data: Partial<{ nombre: string }>) { return api.fetchWithAuth(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
  async eliminar(id: number) { return api.fetchWithAuth(`/roles/${id}`, { method: 'DELETE' }); }
};

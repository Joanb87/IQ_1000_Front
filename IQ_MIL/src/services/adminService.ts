import { api } from './api';

// ==== Tipos y adaptación de Casos (fusionado desde casosService) ====
interface CasoRaw {
  id: string;
  radicado: string;
  ips_nit: string | null;
  ips_nombre: string | null;
  factura: string | null;
  valor_factura: string | null;
  ruta_imagen: string | null;
  caso: string | null;
  fecha_asignacion: string | null;
  total_servicios: number | null;
  lider: string | null;
  usuario_asignacion: string | null;
  total_servicios_usuario: number | null;
  estado_id: number | null;
  prioridad: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Caso {
  id: number;
  radicado: string;
  ips_nit: string | null;
  ips_nombre: string | null;
  factura: string | null;
  valor_factura: number | null;
  ruta_imagen: string | null;
  caso: string | null;
  fecha_asignacion: string | null;
  total_servicios: number | null;
  lider: string | null;
  usuario_asignacion: string | null;
  total_servicios_usuario: number | null;
  estado_id: number | null;
  prioridad: number | null;
}

function adaptCaso(raw: CasoRaw): Caso {
  return {
    id: parseInt(raw.id, 10),
    radicado: raw.radicado,
    ips_nit: raw.ips_nit ?? null,
    ips_nombre: raw.ips_nombre ?? null,
    factura: raw.factura ?? null,
    valor_factura: raw.valor_factura ? parseFloat(raw.valor_factura) : null,
    ruta_imagen: raw.ruta_imagen ?? null,
    caso: raw.caso ?? null,
    fecha_asignacion: raw.fecha_asignacion ?? null,
    total_servicios: raw.total_servicios ?? null,
    lider: raw.lider ?? null,
    usuario_asignacion: raw.usuario_asignacion ?? null,
    total_servicios_usuario: raw.total_servicios_usuario ?? null,
    estado_id: raw.estado_id ?? null,
    prioridad: raw.prioridad ?? null,
  };
}

export const adminService = {
  // ===== Casos =====
  async listarCasos(fecha?: string): Promise<Caso[]> {
    const url = fecha ? `/casos?fecha=${encodeURIComponent(fecha)}` : '/casos';
    const resp = await api.fetchWithAuth(url);
    const arr: CasoRaw[] = Array.isArray(resp) ? resp : resp?.data || [];
    return arr.map(adaptCaso);
  },

  async actualizarCasoParcial(id: number | string, patch: Partial<Record<keyof Caso, any>>) {
    const body: Record<string, any> = {};
    Object.entries(patch).forEach(([k, v]) => { if (v !== undefined) body[k] = v; });
    return api.fetchWithAuth(`/casos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  // Métodos específicos para el admin
  async getUsers() {
    return api.fetchWithAuth('/admin/users');
  },

  async getSystemMetrics() {
    return api.fetchWithAuth('/admin/metrics');
  },

  async updateUserRole(userId: string, role: string) {
    return api.fetchWithAuth('/admin/users/role', {
      method: 'PUT',
      body: JSON.stringify({ userId, role })
    });
  },

  /**
   * Actualiza un registro específico en la base de datos
   * @param radicado - El identificador único del registro (radicado)
   * @param columnId - El nombre de la columna a actualizar
   * @param newValue - El nuevo valor para la columna
   */
  async updateRecord(radicado: string, columnId: string, newValue: any) {
    // TODO: Optimizar cuando exista endpoint directo por radicado.
    const lista = await this.listarCasos();
    const found = lista.find(c => c.radicado === radicado);
    if (!found) throw new Error(`Caso con radicado ${radicado} no encontrado`);
    return this.actualizarCasoParcial(found.id, { [columnId]: newValue });

    /* 
     * Alternativa si prefieres enviar todo en el body:
     * 
     * return api.fetchWithAuth('/admin/records/update', {
     *   method: 'PATCH',
     *   body: JSON.stringify({
     *     radicado: radicado,
     *     field: columnId,
     *     value: newValue
     *   })
     * });
     */
  },

  /**
   * Actualiza múltiples registros en una sola llamada (opcional, más eficiente)
   * @param updates - Array de actualizaciones a realizar
   */
  async updateRecordsBatch(updates: Array<{
    radicado: string;
    field: string;
    value: any;
  }>) {
    // Implementación naive: secuencial (podríamos paralelizar con Promise.all si backend lo soporta)
    for (const up of updates) {
      await this.updateRecord(up.radicado, up.field, up.value);
    }
    return { updated: updates.length };
  }
};
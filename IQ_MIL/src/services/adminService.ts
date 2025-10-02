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

  // --- Cache simple en memoria por fechaFrom ---
  _cacheCasos: {} as Record<string, Caso[]>,
  getCachedCasos(dateFrom?: string) {
    return this._cacheCasos[dateFrom || '_all'];
  },

  getAllCachedCasos(): Caso[] {
    const all: Caso[] = [];
    for (const arr of Object.values(this._cacheCasos)) {
      if (Array.isArray(arr)) all.push(...arr);
    }
    return all;
  },

  // Obtiene una página del backend con la nueva firma: /casos?dateFrom=YYYY-MM-DD&page=1&limit=2000&order=DESC
  async fetchCasosPage(params: { dateFrom: string; page: number; limit: number; order?: 'ASC' | 'DESC'; }): Promise<{ data: Caso[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }; }> {
    const { dateFrom, page, limit, order = 'DESC' } = params;
    const url = `/casos?dateFrom=${encodeURIComponent(dateFrom)}&page=${page}&limit=${limit}&order=${order}`;
    const resp = await api.fetchWithAuth(url);
    const rawArr: CasoRaw[] = resp?.data || [];
    const meta = resp?.meta || { total: rawArr.length, page, limit, totalPages: 1, hasNext: false, hasPrev: page > 1 };
    return { data: rawArr.map(adaptCaso), meta };
  },

  // Carga progresiva en segundo plano (append incremental)
  async progressiveLoadCasos(options: {
    dateFrom: string;
    pageSize?: number; // default 2000
    order?: 'ASC' | 'DESC';
    onChunk: (chunk: Caso[], info: { loaded: number; total: number; page: number; pageSize: number; done: boolean; }) => void;
    signal?: AbortSignal;
  }) {
    const { dateFrom, pageSize = 2500, order = 'DESC', onChunk, signal } = options;
    let page = 1;
    let total = 0;
    let loaded = 0;
    const all: Caso[] = [];
    const cacheKey = dateFrom || '_all';

    while (!signal?.aborted) {
      const { data, meta } = await this.fetchCasosPage({ dateFrom, page, limit: pageSize, order });
      if (page === 1) total = meta.total;
      if (!data.length) {
        onChunk([], { loaded, total, page, pageSize, done: true });
        break;
      }
      all.push(...data);
      loaded += data.length;
      const done = !meta.hasNext || loaded >= total;
      onChunk(data, { loaded, total, page, pageSize, done });
      if (done) break;
      page += 1;
    }
    if (!signal?.aborted) {
      this._cacheCasos[cacheKey] = all;
    }
    return { aborted: !!signal?.aborted, totalLoaded: loaded, totalExpected: total, data: all };
  },

  // Subida de archivo Excel (trunca e ingesta en backend)
  async uploadExcel(file: File) : Promise<any> {
    const token = await (await import('../config/firebase')).auth.currentUser?.getIdToken();
    const form = new FormData();
    form.append('file', file);
    const url = `${api.baseURL}/upload-file/excel`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }, // No definir Content-Type manualmente
      body: form
    });
    if (!res.ok) {
      let detail: any = null;
      try { detail = await res.json(); } catch { /* ignore */ }
      throw new Error(detail?.message || `Error ${res.status}`);
    }
    try { return await res.json(); } catch { return null; }
  },

  // Actualiza un campo de un caso por radicado (usa caché + fallback)
  async updateRecord(radicado: string, columnId: string, newValue: any) {
    // TODO: Optimizar cuando exista endpoint directo por radicado.
    // Buscar en todos los caches acumulados (multi fecha si existiera)
    let found: Caso | undefined = this.getAllCachedCasos().find(c => c.radicado === radicado);
    // Fallback mínimo: si no está cacheado aún, intentar una llamada rápida a listarCasos (sin filtros) como último recurso.
    if (!found) {
      try {
        const lista = await this.listarCasos();
        found = lista.find(c => c.radicado === radicado);
      } catch {
        // ignorar, mantendremos not found
      }
    }
    if (!found) throw new Error(`Caso con radicado ${radicado} no encontrado`);
    return this.actualizarCasoParcial(found.id, { [columnId]: newValue });

  },
  // Actualización batch simple (secuencial)
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
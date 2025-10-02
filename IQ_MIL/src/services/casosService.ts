import { api } from './api';

// Forma cruda que devuelve el backend
interface CasoRaw {
  id: string; // viene como string
  radicado: string;
  ips_nit: string | null;
  ips_nombre: string | null;
  factura: string | null;
  valor_factura: string | null; // número como string
  ruta_imagen: string | null;
  caso: string | null;
  fecha_asignacion: string | null; // ISO
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
  id: number;                // parseInt de id
  radicado: string;
  ips_nit: string | null;
  ips_nombre: string | null;
  factura: string | null;
  valor_factura: number | null;
  ruta_imagen: string | null; // dejar tal cual ("SI" / url / null)
  caso: string | null;
  fecha_asignacion: string | null; // ISO
  total_servicios: number | null;
  lider: string | null;
  usuario_asignacion: string | null;
  total_servicios_usuario: number | null;
  estado_id: number | null;  // mantenemos id numérico por ahora
  prioridad: number | null;  // numérico
}

function adapt(raw: CasoRaw): Caso {
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

export const casosService = {
  async listar(fecha?: string): Promise<Caso[]> {
    const url = fecha ? `/casos?fecha=${encodeURIComponent(fecha)}` : '/casos';
    const resp = await api.fetchWithAuth(url);
    // Puede venir como { data: [...] } o directamente array
    const arr: CasoRaw[] = Array.isArray(resp) ? resp : resp?.data || [];
    return arr.map(adapt);
  },

  async actualizarParcial(id: number | string, patch: Partial<Record<keyof Caso, any>>) {
    // Limpiamos campos undefined
    const body: Record<string, any> = {};
    Object.entries(patch).forEach(([k, v]) => {
      if (v !== undefined) body[k] = v;
    });
    return api.fetchWithAuth(`/casos/${id}` , {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },
};

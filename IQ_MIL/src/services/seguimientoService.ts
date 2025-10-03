import { api } from './api';

// Mapeos provisionales nombre <-> id
const ESTADO_ID_MAP: Record<string, number> = {
  'LIQUIDADO': 1,
  'INCONSISTENCIA': 3,
  'DEVOLUCION': 4,
  'ASIGNADA': 5,
  'NO COMPLETADO': 6,
};
const ESTADO_ID_TO_NOMBRE: Record<number, string> = Object.entries(ESTADO_ID_MAP)
  .reduce((acc, [nombre, id]) => { acc[id] = nombre; return acc; }, {} as Record<number, string>);

interface SeguimientoRaw {
  id: string;
  radicado: string;
  usuario: string;
  estado_id: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  total_minutos: number | null;
  total_servicios_usuario: number | null;
  [key: string]: any;
}

export interface Seguimiento {
  id: string;
  radicado: string;
  usuario: string;
  nombre: string;
  estado_id: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  total_minutos: number | null;
  total_servicios: number | null;
  raw: SeguimientoRaw;
}

function adapt(raw: SeguimientoRaw): Seguimiento {
  const estadoNombre = ESTADO_ID_TO_NOMBRE[raw.estado_id] || `ESTADO_${raw.estado_id}`;
  return {
    id: raw.id,
    radicado: raw.radicado,
    usuario: raw.usuario,
    nombre: raw.usuario?.split('@')[0] || raw.usuario,
    estado_id: raw.estado_id,
    estado: estadoNombre,
    fecha_inicio: raw.fecha_inicio,
    fecha_fin: raw.fecha_fin,
    total_minutos: raw.total_minutos ?? null,
    total_servicios: raw.total_servicios_usuario ?? null,
    raw
  };
}

export const seguimientoService = {
  async listar(params: { fecha?: string; usuario?: string }) {
    const q = new URLSearchParams();
    if (params.fecha) q.append('fecha', params.fecha);
    if (params.usuario) q.append('usuario', params.usuario);
    const query = q.toString();
    const endpoint = `/seguimiento${query ? `?${query}` : ''}`;
    const data = await api.fetchWithAuth(endpoint) as SeguimientoRaw[];
    return Array.isArray(data) ? data.map(adapt) : [];
  },

  // añadimos esto mondaface Devuelve objeto con bandera para mostrar overlay en el UI
  async tomarCaso(correo: string): Promise<{ caso: Seguimiento | null; alreadyAssigned: boolean }> {
    const resp = await api.fetchWithAuth('/seguimiento/tomar-caso', {
      method: 'POST',
      body: JSON.stringify({ correo })
    });

    // Backend: [] => ya tienes un caso abierto y no te asignan otro
    if (Array.isArray(resp) && resp.length === 0) {
      return { caso: null, alreadyAssigned: true };
    }

    // Caso asignado
    if (resp && typeof resp === 'object' && 'estado_id' in resp) {
      return { caso: adapt(resp as SeguimientoRaw), alreadyAssigned: false };
    }

    // Otro caso: null/undefined/u otro tipo
    return { caso: null, alreadyAssigned: false };
  },

  async cerrarCaso(params: { usuario: string; radicado: string; total_servicios: number; estado: string }) {
    const estado_id = (ESTADO_ID_MAP[params.estado] ?? Number(params.estado.replace('ESTADO_', ''))) || 0;
    return api.fetchWithAuth('/seguimiento/cerrar-caso', {
      method: 'POST',
      body: JSON.stringify({
        usuario: params.usuario,
        radicado: params.radicado,
        total_servicios: params.total_servicios,
        estado_id
      })
    });
  },

  mapEstadoId(estado: string): number {
    return ESTADO_ID_MAP[estado] ?? 0;
  }
};

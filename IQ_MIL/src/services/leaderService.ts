import { api } from './api';

import { seguimientoService, type Seguimiento } from './seguimientoService';

// Respuesta cruda del backend para /estadisticas/resumen-operadores
interface ResumenOperadorRaw {
  nombre: string;
  correo: string;
  tempo_total_min: string;   // números como string
  radicados: string;
  total_servicios: string;
  caso_abierto?: boolean;    // nuevo campo opcional
}

export interface OperadorResumen {
  nombre: string;
  correo: string;
  total_minutos: number;
  total_radicados: number;
  total_servicios: number;
  caso_abierto: boolean;
}

export const leaderService = {
  async resumenOperadores(fecha: string, correoLider: string): Promise<OperadorResumen[]> {
    const raw = await api.fetchWithAuth('/estadisticas/resumen-operadores', {
      method: 'POST',
      body: JSON.stringify({ fecha, correo_lider: correoLider })
    }) as ResumenOperadorRaw[];
    if (!Array.isArray(raw)) return [];
    return raw.map(r => ({
      nombre: r.nombre,
      correo: r.correo,
      total_minutos: parseInt(r.tempo_total_min || '0', 10) || 0,
      total_radicados: parseInt(r.radicados || '0', 10) || 0,
      total_servicios: parseInt(r.total_servicios || '0', 10) || 0,
      caso_abierto: !!r.caso_abierto,
    }));
  },

  async getMemberSeguimientos(correo: string, fecha?: string): Promise<Seguimiento[]> {
    return seguimientoService.listar({ usuario: correo, fecha });
  }
};
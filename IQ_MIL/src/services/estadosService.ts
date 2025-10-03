import { api } from './api';

export interface EstadoRaw {
  id: number;
  nombre: string;
}

export interface Estado extends EstadoRaw {}

let _cache: Estado[] | null = null;
let _inFlight: Promise<Estado[]> | null = null;
let _lastFetchTs = 0;
const STALE_MS = 1000 * 60 * 30; // 30 minutos (ajustable)

export const estadosService = {
  /** Obtiene lista de estados; usa cache en memoria. Refresca si está vacío o stalen. */
  async listar(forceRefresh = false): Promise<Estado[]> {
    const now = Date.now();
    if (!forceRefresh && _cache && (now - _lastFetchTs) < STALE_MS) {
      return _cache;
    }
    if (_inFlight) return _inFlight; // Reutilizar petición en curso

    _inFlight = (async () => {
      try {
        const resp = await api.fetchWithAuth('/estados');
        const data: Estado[] = Array.isArray(resp)
          ? resp as Estado[]
          : Array.isArray(resp?.data)
            ? resp.data as Estado[]
            : [];
        _cache = data;
        _lastFetchTs = Date.now();
        return data;
      } finally {
        _inFlight = null;
      }
    })();
    return _inFlight;
  },
  /** Limpia manualmente el cache (por si backend cambia). */
  clearCache() { _cache = null; _lastFetchTs = 0; },
  /** Devuelve cache actual sin disparar fetch. */
  getCached(): Estado[] | null { return _cache; }
};

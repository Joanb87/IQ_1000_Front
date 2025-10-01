import { api } from './api';

interface MemberDetail {
  id: number;
  radicado: string;
  nombre: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_minutos: number;
  ruta_imagen: string;
  total_servicios?: number;
}

export const leaderService = {
  getMemberDetails: async (correo: string): Promise<MemberDetail[]> => {
    return api.fetchWithAuth('/leader/member-details', {
      method: 'POST',
      body: JSON.stringify({ correo })
    });
  }
};
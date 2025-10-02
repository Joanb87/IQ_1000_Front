import { api } from './api';

export const adminService = {
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
    // TODO: Reemplazar con la URL real de tu endpoint
    // Ejemplo de endpoint: /admin/records/:radicado
    
    return api.fetchWithAuth(`/admin/records/${radicado}`, {
      method: 'PATCH',
      body: JSON.stringify({
        field: columnId,  // Nombre del campo a actualizar
        value: newValue   // Nuevo valor
      })
    });

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
    // TODO: Reemplazar con la URL real de tu endpoint batch
    return api.fetchWithAuth('/admin/records/batch-update', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    });
  }
};
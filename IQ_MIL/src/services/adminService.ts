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
  }
};
import { api } from './api';

export const userService = {
  // Métodos específicos para el usuario
  async getUserTasks() {
    return api.fetchWithAuth('/user/tasks');
  },

  async getUserMetrics() {
    return api.fetchWithAuth('/user/metrics');
  },

  async updateTaskStatus(taskId: string, status: string) {
    return api.fetchWithAuth('/user/tasks/status', {
      method: 'PUT',
      body: JSON.stringify({ taskId, status })
    });
  }
};
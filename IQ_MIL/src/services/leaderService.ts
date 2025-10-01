import { api } from './api';

export const leaderService = {
  // Métodos específicos para el líder
  async getTeamMetrics() {
    return api.fetchWithAuth('/leader/team/metrics');
  },

  async getTeamProjects() {
    return api.fetchWithAuth('/leader/projects');
  },

  async assignTask(userId: string, taskData: any) {
    return api.fetchWithAuth('/leader/tasks/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, ...taskData })
    });
  }
};
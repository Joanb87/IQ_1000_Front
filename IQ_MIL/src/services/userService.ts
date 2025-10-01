import { api } from './api';

export const userService = {
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
  },

  async createNewCase(caseData?: any) {
    return api.fetchWithAuth('/user/cases/create', {
      method: 'POST',
      body: JSON.stringify(caseData || {})
    });
  },

  async updateCase(caseId: number, data: { total_servicios: number; estado: string }) {
    return api.fetchWithAuth(`/user/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};
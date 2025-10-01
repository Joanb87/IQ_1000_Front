import { auth } from '../config/firebase';

export const api = {
  baseURL: 'tu-api-url',
  
  async getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },

  async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    return response.json();
  }
};
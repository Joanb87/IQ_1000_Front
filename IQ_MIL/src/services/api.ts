import { auth } from '../config/firebase';
import { API_URL } from '../config/api';

export const api = {
  baseURL: API_URL,
  
  async getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },

  async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      let detail: any = null;
      try { detail = await response.json(); } catch { /* ignore */ }
      const message = detail?.message || `Error ${response.status}`;
      throw new Error(message);
    }

    try {
      return await response.json();
    } catch {
      return null; // No content
    }
  }
};
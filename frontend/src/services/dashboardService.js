import { apiRequest } from './api';

function unwrap(response) {
  return response?.data ?? response;
}

export const dashboardService = {
  async getCurrentUser(token) {
    const response = await apiRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrap(response);
  },

  async getOverview(token, period = '7d') {
    const response = await apiRequest(`/api/v1/reports/dashboard?period=${encodeURIComponent(period)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrap(response);
  },
};

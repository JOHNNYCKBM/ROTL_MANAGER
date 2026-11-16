import { apiRequest } from './api';

export const authService = {
  login(credentials) {
    return apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  registerRequest(userData) {
    return apiRequest('/api/v1/auth/register-requests', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser(token) {
    return apiRequest('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

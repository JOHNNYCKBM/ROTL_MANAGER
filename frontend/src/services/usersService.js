import { apiRequest } from './api';

// Ces chemins reprennent les contrats indicatifs du cahier des charges.
// Ils devront être confirmés avec le développeur Spring Boot avant l'intégration réelle.
function request(path, token, options = {}) {
  return apiRequest(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export const usersService = {
  getStatistics(token) {
    return request('/api/v1/users/statistics', token);
  },

  getPendingRequests(token) {
    return request('/api/v1/users/requests', token);
  },

  getEmployees(token) {
    return request('/api/v1/users', token);
  },

  getUser(token, id) {
    return request(`/api/v1/users/${encodeURIComponent(id)}`, token);
  },

  createEmployee(token, payload) {
    return request('/api/v1/users', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  approveRequest(token, id, role) {
    return request(`/api/v1/users/requests/${encodeURIComponent(id)}/approve`, token, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  rejectRequest(token, id) {
    return request(`/api/v1/users/requests/${encodeURIComponent(id)}/reject`, token, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  updateEmployee(token, id, payload) {
    return request(`/api/v1/users/${encodeURIComponent(id)}`, token, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  suspendEmployee(token, id) {
    return request(`/api/v1/users/${encodeURIComponent(id)}/suspend`, token, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },

  activateEmployee(token, id) {
    return request(`/api/v1/users/${encodeURIComponent(id)}/activate`, token, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },

  deleteEmployee(token, id) {
    return request(`/api/v1/users/${encodeURIComponent(id)}`, token, {
      method: 'DELETE',
    });
  },
};

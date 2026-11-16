const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new ApiError("Le serveur n'est pas encore configuré. Ajoutez VITE_API_BASE_URL au fichier .env.", 0);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || 'Une erreur est survenue.', response.status, data);
  }

  return data;
}

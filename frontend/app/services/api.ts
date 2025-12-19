// frontend/app/services/api.ts
import { useAuth } from '../contexts/AuthContext';

const BASE_URL = '/api';

function getAuthHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function get(endpoint: string, token: string | null) {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

export async function post(endpoint: string, body: any, token: string | null) {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Favorite Venues API calls
export async function addFavorite(token: string, venueId: number) {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${BASE_URL}/favorites`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ venueId }),
  });
  return res.json();
}

export async function removeFavorite(token: string, venueId: number) {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${BASE_URL}/favorites/${venueId}`, {
    method: 'DELETE',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
  return res; // No content returned, just status
}

export async function getFavorites(token: string, limit: number, offset: number) {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${BASE_URL}/favorites?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

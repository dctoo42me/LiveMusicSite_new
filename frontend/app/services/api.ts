// frontend/app/services/api.ts
import { useAuth } from '@/contexts/AuthContext';

const BASE_URL = '/api';

function getHeaders(token: string | null): HeadersInit {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export async function get(endpoint: string, token: string | null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: getHeaders(token),
  });
  return res.json();
}

export async function post(endpoint: string, body: any, token: string | null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });
  return res.json();
}

// Favorite Venues API calls
export async function addFavorite(token: string, venueId: number) {
  const res = await fetch(`${BASE_URL}/favorites`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ venueId }),
  });
  return res.json();
}

export async function removeFavorite(token: string, venueId: number) {
  const res = await fetch(`${BASE_URL}/favorites/${venueId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return res; // No content returned, just status
}

export async function getFavorites(token: string, limit: number, offset: number) {
  const res = await fetch(`${BASE_URL}/favorites?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return res.json();
}

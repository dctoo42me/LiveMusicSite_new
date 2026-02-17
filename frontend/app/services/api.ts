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
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

export async function post(endpoint: string, body: any, token: string | null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

// Favorite Venues API calls
export async function addFavorite(token: string, venueId: number) {
  const res = await fetch(`${BASE_URL}/favorites`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ venueId }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

export async function removeFavorite(token: string, venueId: number) {
  const res = await fetch(`${BASE_URL}/favorites/${venueId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res; // No content returned, just status
}

export async function getFavorites(token: string, limit: number, offset: number) {
  const res = await fetch(`${BASE_URL}/favorites?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

export async function getVenueById(id: string) {
  return get(`/venues/${id}`, null);
}

export async function getVenueEvents(id: string) {
  return get(`/venues/${id}/events`, null);
}

// Saved Events API calls
export async function saveEvent(token: string, eventId: number) {
  const res = await fetch(`${BASE_URL}/saved-events`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ eventId }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

export async function unsaveEvent(token: string, eventId: number) {
  const res = await fetch(`${BASE_URL}/saved-events/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res;
}

export async function getSavedEvents(token: string) {
  return get('/saved-events', token);
}

// Venue Claim API calls
export async function getClaims(token: string) {
  return get('/claims', token);
}

export async function updateClaimStatus(token: string, claimId: number, status: 'APPROVED' | 'REJECTED') {
  const res = await fetch(`${BASE_URL}/claims/${claimId}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

// Venue Operator API calls
export async function getManagedVenues(token: string) {
  return get('/manage/my-venues', token);
}

export async function createVenueEvent(token: string, venueId: number, eventData: any) {
  return post(`/manage/${venueId}/events`, eventData, token);
}

// User Profile API
export async function getUserProfile(token: string) {
  return get('/users/profile', token);
}

export async function updateUserProfile(token: string, profileData: { avatarUrl?: string; bio?: string; onboardingCompleted?: boolean; marketingOptIn?: boolean }) {
  const res = await fetch(`${BASE_URL}/users/profile`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(profileData),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

// Venue Media API
export async function getVenueImages(venueId: number) {
  const res = await fetch(`${BASE_URL}/venues/${venueId}/images`);
  return res.json();
}

// Admin API
export async function getAdminStats(token: string) {
  return get('/admin/stats', token);
}

export async function getAuditLogs(token: string) {
  return get('/admin/logs', token);
}

export async function getAdminSubscriptions(token: string) {
  return get('/admin/subscriptions', token);
}

// Support API
export async function submitSupportTicket(ticketData: { name: string; email: string; subject: string; message: string }, token?: string) {
  const res = await fetch(`${BASE_URL}/support/submit`, {
    method: 'POST',
    headers: getHeaders(token || null),
    body: JSON.stringify(ticketData),
  });
  return res.json();
}

export async function getAllSupportTickets(token: string) {
  return get('/support/all', token);
}

export async function updateTicketStatus(token: string, ticketId: number, status: string) {
  const res = await fetch(`${BASE_URL}/support/${ticketId}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });
  return res.json();
}

// Analytics API
export async function trackVenueEvent(venueId: number, eventType: 'view' | 'website_click' | 'map_click', token?: string) {
  return fetch(`${BASE_URL}/analytics/log-event`, {
    method: 'POST',
    headers: getHeaders(token || null),
    body: JSON.stringify({ venueId, eventType }),
  });
}

export async function getVenueMetrics(token: string, venueId: number) {
  return get(`/analytics/venue/${venueId}`, token);
}

export async function getSearchHeatmapData(token: string) {
  return get('/analytics/search-heatmap', token);
}

export async function reportVenue(venueId: number, reportData: { reason: string; description: string; name: string; email: string }) {
  const res = await fetch(`${BASE_URL}/venues/${venueId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });
  return res.json();
}

export async function updateVenueMainImage(token: string, venueId: number, imageUrl: string) {
  const res = await fetch(`${BASE_URL}/manage/${venueId}/main-image`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ imageUrl }),
  });
  return res.json();
}

export async function addVenueImage(token: string, venueId: number, imageUrl: string, altText?: string) {
  return post(`/manage/${venueId}/images`, { imageUrl, altText }, token);
}

export async function deleteVenueImage(token: string, venueId: number, imageId: number) {
  const res = await fetch(`${BASE_URL}/manage/${venueId}/images/${imageId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return res;
}

// Payments API
export async function createCheckoutSession(token: string, venueId: number) {
  return post('/payments/create-checkout-session', { venueId }, token);
}

export async function createPortalSession(token: string, venueId: number) {
  return post('/payments/create-portal-session', { venueId }, token);
}

export async function submitVenueFeedback(token: string, venueId: number, hasLivePerformance: boolean, suggestedWebsite?: string) {
  const res = await fetch(`${BASE_URL}/venues/${venueId}/feedback`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ hasLivePerformance, suggestedWebsite }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res.json();
}

// Authentication API calls
export async function logout(token: string) {
  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Authentication failed or session expired');
  }
  return res; // We expect a 200 OK from the backend, no content.
}

import { test, expect } from '@playwright/test';

test.describe('Security Audit - Backend Headers', () => {
  test('API status endpoint should have essential security headers', async ({ request }) => {
    const response = await request.get('http://localhost:5001/api/status');
    expect(response.ok()).toBeTruthy();
    
    const headers = response.headers();
    
    // Check for Helmet-provided security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['referrer-policy']).toBeDefined();
    expect(headers['x-dns-prefetch-control']).toBe('off');
  });
});

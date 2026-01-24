// frontend/app/api/auth/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Helper function to extract and sanitize the path
async function getBackendPath(params: { path?: string[] | undefined }): Promise<string> {
  if (!params || !params.path || params.path.length === 0) {
    return ''; // Return empty string if no path segments
  }
  return params.path.filter(segment => segment).join('/');
}

async function handleProxyRequest(
  request: NextRequest,
  params: { path?: string[] | undefined },
  method: string
) {
  const path = await getBackendPath(params);
  const expressAuthUrl = `${BACKEND_URL}/api/auth/${path}`;

  try {
    const proxyHeaders = new Headers();
    if (request.headers.get('Content-Type')) {
      proxyHeaders.set('Content-Type', request.headers.get('Content-Type')!);
    }
    // Forward Authorization header if it exists
    if (request.headers.get('Authorization')) {
        proxyHeaders.set('Authorization', request.headers.get('Authorization')!);
    }

    let requestBody: BodyInit | null = null;
    // Only try to parse a body for methods that typically have one
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        try {
            // Read as text first to handle empty bodies gracefully
            const textBody = await request.text();
            if (textBody) {
                requestBody = textBody;
                // Ensure content-type is set if we have a body and it wasn't set before
                if (!proxyHeaders.has('Content-Type')) {
                    proxyHeaders.set('Content-Type', 'application/json');
                }
            }
        } catch (e) {
            // Ignore errors if body is empty or not valid JSON
            console.warn('Auth Proxy: Failed to parse JSON body, assuming empty body:', e);
        }
    }

    const response = await fetch(expressAuthUrl, {
      method: method,
      headers: proxyHeaders,
      body: requestBody,
      redirect: 'manual',
    });

    const responseContentType = response.headers.get('content-type');
    let responseBody;

    if (responseContentType && responseContentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      // If not JSON, read as text and wrap in an error message
      const text = await response.text();
      responseBody = { error: `Unexpected response from backend: ${text.substring(0, 200)}`, originalStatus: response.status };
    }
    
    return NextResponse.json(responseBody, { status: response.status });

  } catch (error) {
    console.error(`Next.js Auth API Proxy Error (${method}):`, error);
    return NextResponse.json(
      { error: 'Failed to process authentication request.' },
      { status: 500 }
    );
  }
}


export async function POST(
  request: NextRequest,
  context: { params: any }
) {
  return handleProxyRequest(request, context.params, 'POST');
}

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  return handleProxyRequest(request, context.params, 'GET');
}
// Add other HTTP methods (PUT, DELETE) if your backend auth routes use them
// For now, POST and GET are typically sufficient for auth.

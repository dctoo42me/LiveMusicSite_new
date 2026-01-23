// frontend/app/api/favorites/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Helper function to extract and sanitize the path
async function getBackendPath(params: { path?: string[] } | Promise<{ path?: string[] }>): Promise<string> {
  const resolvedParams = await Promise.resolve(params);
  if (!resolvedParams || !resolvedParams.path || resolvedParams.path.length === 0) {
    return '';
  }
  return resolvedParams.path.filter(segment => segment).join('/');
}

async function handleProxyRequest(
  request: NextRequest,
  params: { path?: string[] } | Promise<{ path?: string[] }>,
  method: string
) {
  const path = await getBackendPath(params);
  const { searchParams } = new URL(request.url); // Extract query parameters from incoming request

  // Correctly construct the backend URL for favorites, adding a slash only if path is not empty
  // and appending all query parameters from the incoming request.
  const expressFavoritesUrl = `${BACKEND_URL}/api/favorites${path ? '/' + path : ''}?${searchParams.toString()}`; 

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
            // Make sure there is a body to parse
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
        }
    }

    const response = await fetch(expressFavoritesUrl, {
      method: method,
      headers: proxyHeaders,
      body: requestBody,
      redirect: 'manual',
    });

    if (response.status === 204) {
      // No Content, return an empty response with the correct status
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    let responseBody;

    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      const text = await response.text();
      responseBody = { error: `Unexpected response from backend: ${text.substring(0, 200)}`, originalStatus: response.status };
    }
    
    return NextResponse.json(responseBody, { status: response.status });

  } catch (error) {
    console.error(`Next.js Favorites API Proxy Error (${method}):`, error);
    return NextResponse.json(
      { error: 'Failed to process favorites request.' },
      { status: 500 }
    );
  }
}


export async function POST(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return handleProxyRequest(request, params, 'POST');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return handleProxyRequest(request, params, 'GET');
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path?: string[] } }
  ) {
    return handleProxyRequest(request, params, 'DELETE');
  }

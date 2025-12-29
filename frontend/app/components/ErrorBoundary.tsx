'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
          <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-lg">
            <h1 className="text-4xl font-extrabold text-red-600 mb-4">Something went wrong.</h1>
            <p className="text-lg mb-6">
              We're sorry for the inconvenience. An unexpected error occurred.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Our team has been notified. Please try refreshing the page or come back later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

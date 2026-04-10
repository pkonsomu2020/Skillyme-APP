import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Plain HTML only — no shadcn components, no context, no hooks
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '1rem',
          fontFamily: 'sans-serif',
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '480px',
            width: '100%',
            color: '#f1f5f9',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#fee2e2', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h2>
            </div>

            {this.state.error && (
              <details style={{
                background: '#0f172a', borderRadius: '6px',
                padding: '0.75rem', marginBottom: '1.5rem',
                fontSize: '0.75rem', color: '#94a3b8'
              }} open>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem' }}>
                  Error Details
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.625rem 1rem', borderRadius: '6px', border: 'none',
                  background: '#6366f1', color: '#fff', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem'
                }}
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.625rem 1rem', borderRadius: '6px',
                  border: '1px solid #334155', background: 'transparent',
                  color: '#f1f5f9', cursor: 'pointer', fontSize: '0.875rem'
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => { window.location.href = '/login'; }}
                style={{
                  padding: '0.625rem 1rem', borderRadius: '6px', border: 'none',
                  background: 'transparent', color: '#94a3b8',
                  cursor: 'pointer', fontSize: '0.875rem'
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

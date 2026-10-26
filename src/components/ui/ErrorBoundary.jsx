import React from 'react';

/**
 * ErrorBoundary — catches unhandled render errors anywhere in the tree.
 * Without this, a single component crash blanks out the entire app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Anna Sakhi] Unhandled render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
        padding: '2rem',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '3rem' }}>🌴</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: 0 }}>
          Anna Sakhi ran into an unexpected problem. You can try reloading the page.
        </p>
        {this.state.error?.message && (
          <pre style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-surface)',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            maxWidth: 480,
            overflowX: 'auto',
            textAlign: 'left',
          }}>
            {this.state.error.message}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: 'var(--accent-green)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

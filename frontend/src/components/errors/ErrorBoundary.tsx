import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MyMovieGallery crashed', { error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
          <div className="max-w-lg rounded-3xl border p-8 text-center shadow-2xl" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
              <span style={{ color: 'var(--error, #ef4444)', fontSize: '28px', fontWeight: 700 }}>!</span>
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Something went wrong</h1>
            <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
              MyMovieGallery hit an unexpected error. You can try again, or refresh the page to recover the app.
            </p>
            {this.state.error ? (
              <p className="mt-4 rounded-2xl border px-4 py-3 text-left text-xs font-mono leading-5" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {this.state.error.message}
              </p>
            ) : null}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="rounded-full px-5 py-3 text-sm font-medium transition"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="rounded-full border px-5 py-3 text-sm font-medium transition"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

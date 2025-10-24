import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Reset corrupted provider settings if error is related to AI providers
    if (error.message.includes('provider') || error.message.includes('model')) {
      console.log('🔄 Provider-related error detected, resetting to Gemini...');
      try {
        localStorage.removeItem('selected-ai-provider');
        localStorage.setItem('selected-ai-provider', JSON.stringify({
          provider: 'gemini',
          apiKey: '',
          model: 'gemini-1.5-flash'
        }));
      } catch (storageError) {
        console.error('Failed to reset provider settings:', storageError);
      }
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg border">
        <div className="text-center space-y-4">
          <div className="text-destructive text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            The application encountered an error. Don't worry, your data is safe.
          </p>
          {error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Error Details
              </summary>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={retry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                // Clear all app data and reload
                if (confirm('This will reset all your settings. Continue?')) {
                  try {
                    localStorage.clear();
                    window.location.reload();
                  } catch (e) {
                    console.error('Failed to clear storage:', e);
                    window.location.reload();
                  }
                }
              }}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
            >
              Reset App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
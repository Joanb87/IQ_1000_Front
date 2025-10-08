import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorKey: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorKey: 0 };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, errorKey: Date.now() };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Force remount after short delay
    setTimeout(() => {
      this.setState({ hasError: false, errorKey: Date.now() });
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Algo salió mal. Reintentando...</p>
        </div>
      );
    }

    return <div key={this.state.errorKey}>{this.props.children}</div>;
  }
}
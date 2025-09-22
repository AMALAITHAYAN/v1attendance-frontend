import React from "react";

/**
 * Catches render/runtime errors below and shows a friendly screen
 * instead of a blank white page. Also logs to console for debugging.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: String(error?.message || error) };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(180deg,#0b1220 0%, #0f172a 60%, #0b1220 100%)",
          color: "#e2e8f0",
          padding: 24
        }}>
          <div style={{
            maxWidth: 640,
            width: "100%",
            background: "#111827",
            border: "1px solid #243244",
            borderRadius: 14,
            padding: 18,
            boxShadow: "0 10px 22px rgba(0,0,0,.35)"
          }}>
            <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
            <p style={{ opacity: 0.9 }}>
              The app hit an unexpected error and couldn’t render.
            </p>
            <pre style={{
              whiteSpace: "pre-wrap",
              background: "#0b1220",
              border: "1px solid #2b3a55",
              padding: 12,
              borderRadius: 10,
              overflowX: "auto"
            }}>
              {this.state.errorMessage}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

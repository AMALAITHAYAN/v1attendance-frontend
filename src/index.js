import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import ErrorBoundary from "./ErrorBoundary";

// Guard in case #root is missing (prevents silent blank page)
const mount = document.getElementById("root");
if (!mount) {
  // eslint-disable-next-line no-console
  console.error("Failed to find #root element to mount React app.");
} else {
  const root = ReactDOM.createRoot(mount);

  const Shell = () => (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

  // In development, avoid StrictMode to prevent double-invoked effects
  // (helps with camera streams, timers, etc.). Keep it in production.
  if (process.env.NODE_ENV === "production") {
    root.render(
      <React.StrictMode>
        <Shell />
      </React.StrictMode>
    );
  } else {
    root.render(<Shell />);
  }
}

// Optional: performance measurements
reportWebVitals();

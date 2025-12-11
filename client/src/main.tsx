import { initializeSentry } from './lib/sentry';
import ErrorBoundary from './components/ErrorBoundary';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Sentry
initializeSentry();

const root = createRoot(document.getElementById("root")!);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

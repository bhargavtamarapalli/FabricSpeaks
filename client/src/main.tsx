import { initializeSentry } from './lib/sentry';
import ErrorBoundary from './components/ErrorBoundary';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { fetchRuntimeConfig } from './lib/runtime-config';

// Initialize Sentry
initializeSentry();

const root = createRoot(document.getElementById("root")!);

// Boot the app only after config is ready
fetchRuntimeConfig().then(() => {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}).catch(err => {
  console.error('Fatal: Failed to load runtime configuration', err);
  root.render(<div className="p-8 text-red-500">Failed to start application. Please refresh the page.</div>);
});

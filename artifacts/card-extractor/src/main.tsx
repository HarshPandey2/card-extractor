import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedApiUrl = configuredApiUrl ? configuredApiUrl.replace(/\/+$/, "") : null;

const apiUrl = (() => {
  if (!normalizedApiUrl) return null;

  const isLocalhostApi = normalizedApiUrl.startsWith("http://localhost") || normalizedApiUrl.startsWith("http://127.0.0.1");
  const runningOnNetworkHost = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

  // When running the Vite dev server on a local machine and opening from another device,
  // use the relative /api path so the dev server proxy routes requests to the local backend.
  if (import.meta.env.DEV && isLocalhostApi && runningOnNetworkHost) {
    return null;
  }

  return normalizedApiUrl;
})();

setBaseUrl(apiUrl);
setAuthTokenGetter(() => localStorage.getItem("authToken"));

createRoot(document.getElementById("root")!).render(<App />);

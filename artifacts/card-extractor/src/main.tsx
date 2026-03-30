import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiUrl = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, "")
  : null;

setBaseUrl(apiUrl);
setAuthTokenGetter(() => localStorage.getItem("authToken"));

createRoot(document.getElementById("root")!).render(<App />);

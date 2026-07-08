// Solve "global is not defined" error in browser for sockjs-client
if (typeof window !== "undefined" && (window as any).global === undefined) {
  (window as any).global = window;
}
if (typeof window !== "undefined" && (window as any).process === undefined) {
  (window as any).process = { env: {} };
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

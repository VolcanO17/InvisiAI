import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider, ThemeProvider } from "./contexts";
import "./global.css";
import "./lib/settings-reset"; // Enable global reset functions

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);

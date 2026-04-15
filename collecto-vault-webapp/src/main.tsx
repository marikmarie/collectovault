

// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ThemeProvider from "./theme/ThemeProvider";
import { FeedbackProvider } from "./context/FeedbackContext";


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/collectovault">
      <ThemeProvider>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

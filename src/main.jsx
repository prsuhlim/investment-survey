import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Load the global theme once at the top level
import "./styles/global.css";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

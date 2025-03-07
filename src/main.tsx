import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Importações do TensorFlow.js
import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

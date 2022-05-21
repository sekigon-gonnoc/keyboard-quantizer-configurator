import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

if (!(navigator as any).hid) {
  alert("Please use chrome or edge");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

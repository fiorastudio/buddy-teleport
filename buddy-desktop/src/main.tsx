import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { BuddyMascot } from "./components/BuddyMascot";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const params = new URLSearchParams(window.location.search);
if (params.get("window") === "mascot") {
  root.render(
    <React.StrictMode>
      <BuddyMascot />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

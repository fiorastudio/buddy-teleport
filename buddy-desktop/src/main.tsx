import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { BuddyMascot } from "./components/BuddyMascot";
import { routeForWindowSearch } from "./utils/windowRoute.mjs";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const route = routeForWindowSearch(window.location.search);
if (route === "mascot") {
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

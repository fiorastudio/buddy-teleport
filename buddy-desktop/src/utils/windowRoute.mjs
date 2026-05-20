export function routeForWindowSearch(search = "") {
  const params = new URLSearchParams(search);
  const windowName = params.get("window");

  if (windowName === "mascot") {
    return "mascot";
  }

  return "status-popup";
}

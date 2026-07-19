// Helper to handle theme operations outside of components
export function getSavedTheme(): "light" | "dark" {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  }
  return "light";
}

export function saveTheme(theme: "light" | "dark"): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", theme);
  }
}

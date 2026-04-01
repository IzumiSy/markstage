import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "light",
  toggle: () => {},
});

function getSystemScheme(): ColorScheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getSystemScheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", colorScheme);
    root.classList.remove("light", "dark");
    root.classList.add(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => setColorScheme((s) => (s === "light" ? "dark" : "light"));

  return <ThemeContext.Provider value={{ colorScheme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

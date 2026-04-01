import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  colorScheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "light",
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

  return <ThemeContext.Provider value={{ colorScheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

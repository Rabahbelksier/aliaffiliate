import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, AppColors } from "@/constants/colors";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  colors: AppColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  colors: darkColors,
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
});

const THEME_KEY = "@app_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    await AsyncStorage.setItem(THEME_KEY, t);
  };

  const toggleTheme = async () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: theme === "dark" ? darkColors : lightColors,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

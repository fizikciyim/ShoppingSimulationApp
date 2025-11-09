import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

interface DarkModeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const colorScheme = Appearance.getColorScheme();
  // const [isDark, setIsDark] = useState(colorScheme === "dark");
  const [isDark, setIsDark] = useState(false);

  // sistem teması değiştiğinde otomatik güncelle
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === "dark");
    });
    return () => listener.remove();
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);

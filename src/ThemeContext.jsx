import { createContext, useContext, useEffect } from 'react';
const Ctx = createContext();
export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.removeItem('theme');
  }, []);
  return <Ctx.Provider value={{ dark: false, toggle: () => {} }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);

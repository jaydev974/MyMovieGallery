import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { themes, defaultTheme } from '../themes/themes';
import type { ThemeConfig, ThemeName } from '../types';

interface ThemeState {
  themeName: ThemeName;
  theme: ThemeConfig;
  setTheme: (name: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeName: defaultTheme as ThemeName,
      theme: themes[defaultTheme],
      setTheme: (name: ThemeName) => {
        set({ themeName: name, theme: themes[name] });
      },
    }),
    { name: 'mmg-theme' }
  )
);

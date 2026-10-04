import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useStore — minimal global state for ApplyPilot.
 * Only stores what truly needs to be global: theme + user session.
 * All page-level data (applications, stats, etc.) lives in local component state
 * and is fetched via the api/ layer.
 */
const useStore = create(
  persist(
    (set, get) => ({
      // ─── Theme ──────────────────────────────────────────────────────────
      theme: 'light',

      toggleTheme: () => {
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: next };
        });
      },

      initTheme: () => {
        const { theme } = get();
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // ─── User Session ────────────────────────────────────────────────────
      user: null,

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('ap_token');
        set({ user: null });
      },
    }),
    {
      name: 'applypilot-store',
      // Only persist theme and user — not any fetched data
      partialize: (state) => ({
        theme: state.theme,
        user:  state.user,
      }),
    }
  )
);

export default useStore;

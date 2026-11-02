import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>((set) => {
  const isBrowser = typeof window !== 'undefined';
  const initialCollapsed = isBrowser
    ? localStorage.getItem('jp_admin_sidebar_collapsed') === 'true'
    : false;
  const initialSound = isBrowser
    ? localStorage.getItem('jp_admin_sound_enabled') !== 'false'
    : true;

  return {
    sidebarCollapsed: initialCollapsed,
    toggleSidebar: () =>
      set((state) => {
        const next = !state.sidebarCollapsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem('jp_admin_sidebar_collapsed', String(next));
        }
        return { sidebarCollapsed: next };
      }),
    setSidebarCollapsed: (collapsed: boolean) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('jp_admin_sidebar_collapsed', String(collapsed));
      }
      set({ sidebarCollapsed: collapsed });
    },
    soundEnabled: initialSound,
    setSoundEnabled: (enabled: boolean) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('jp_admin_sound_enabled', String(enabled));
      }
      set({ soundEnabled: enabled });
    },
  };
});


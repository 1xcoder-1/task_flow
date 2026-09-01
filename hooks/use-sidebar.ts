import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarStore = {
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
};

export const useSidebar = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      collapse: () => set({ isCollapsed: true }),
      expand: () => set({ isCollapsed: false }),
    }),
    {
      name: "sidebar-storage",
    }
  )
);

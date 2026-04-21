import { create } from 'zustand';

interface ExplorerState {
  selectedPath: string | null;
  selectedDirPath: string | null;
  expandedPaths: Set<string>;
  selectFile: (path: string) => void;
  selectDirectory: (path: string) => void;
  toggleExpanded: (path: string) => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  selectedPath: null,
  selectedDirPath: null,
  expandedPaths: new Set<string>(),
  selectFile: (path) => set({ selectedPath: path, selectedDirPath: null }),
  selectDirectory: (path) =>
    set((state) => {
      const expandedPaths = new Set(state.expandedPaths);
      if (expandedPaths.has(path)) expandedPaths.delete(path);
      else expandedPaths.add(path);
      return {
        selectedPath: null,
        selectedDirPath: path,
        expandedPaths
      };
    }),
  toggleExpanded: (path) =>
    set((state) => {
      const expandedPaths = new Set(state.expandedPaths);
      if (expandedPaths.has(path)) expandedPaths.delete(path);
      else expandedPaths.add(path);
      return { expandedPaths };
    })
}));

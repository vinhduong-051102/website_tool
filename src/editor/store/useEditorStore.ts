import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ASTNode, Breakpoint, Page, Command } from "../types";

// Create a default body container node for the Canvas
export const createDefaultRootNode = (): ASTNode => ({
  id: "root",
  type: "Container",
  props: {
    name: "Body Container",
  },
  styles: {
    desktop: {
      minHeight: "100vh",
      padding: "24px",
      backgroundColor: "#1f2937", // bg-gray-800
      color: "#ffffff",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    tablet: {
      padding: "16px",
    },
    mobile: {
      padding: "12px",
    },
  },
  children: [],
});

interface EditorState {
  pages: Page[];
  activePageId: string;
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
  clipboard: ASTNode[] | null;
  activeBreakpoint: Breakpoint;
  
  // Canvas settings
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;

  // History stack (non-persistent)
  history: Command[];
  historyIndex: number;
}

interface EditorActions {
  // State setters
  setPages: (pages: Page[] | ((prev: Page[]) => Page[])) => void;
  setActivePageId: (id: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setHoveredNodeId: (id: string | null) => void;
  setClipboard: (nodes: ASTNode[] | null) => void;
  setActiveBreakpoint: (bp: Breakpoint) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  resetProject: () => void;

  // Command History Actions
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Helper to fetch the current active AST
  getActiveAST: () => ASTNode;
}

export type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      // Initial States
      pages: [
        {
          id: "home",
          name: "Home",
          path: "/",
          ast: createDefaultRootNode(),
        },
      ],
      activePageId: "home",
      selectedNodeIds: [],
      hoveredNodeId: null,
      clipboard: null,
      activeBreakpoint: "desktop",
      zoom: 1,
      pan: { x: 0, y: 0 },
      showGrid: true,
      snapToGrid: true,

      history: [],
      historyIndex: -1,

      // Setters
      setPages: (pages) => {
        set((state) => {
          const nextPages = typeof pages === "function" ? pages(state.pages) : pages;
          return { pages: nextPages };
        });
      },
      setActivePageId: (id) => set({ activePageId: id, selectedNodeIds: [] }),
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
      setClipboard: (nodes) => set({ clipboard: nodes }),
      setActiveBreakpoint: (bp) => set({ activeBreakpoint: bp }),
      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
      setPan: (pan) => {
        set((state) => {
          const nextPan = typeof pan === "function" ? pan(state.pan) : pan;
          return { pan: nextPan };
        });
      },
      setShowGrid: (show) => set({ showGrid: show }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),

      resetProject: () => {
        set({
          pages: [
            {
              id: "home",
              name: "Home",
              path: "/",
              ast: createDefaultRootNode(),
            },
          ],
          activePageId: "home",
          selectedNodeIds: [],
          hoveredNodeId: null,
          clipboard: null,
          history: [],
          historyIndex: -1,
        });
      },

      // History commands
      executeCommand: (command) => {
        // Run the command logic
        command.execute();

        const { history, historyIndex } = get();
        // Clear any redo history
        const newHistory = history.slice(0, historyIndex + 1);
        
        set({
          history: [...newHistory, command],
          historyIndex: newHistory.length,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= 0) {
          const command = history[historyIndex];
          command.undo();
          set({ historyIndex: historyIndex - 1 });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          const command = history[nextIndex];
          command.execute();
          set({ historyIndex: nextIndex });
        }
      },

      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      getActiveAST: () => {
        const { pages, activePageId } = get();
        const activePage = pages.find((p) => p.id === activePageId);
        return activePage ? activePage.ast : createDefaultRootNode();
      },
    }),
    {
      name: "website-builder-store",
      // Exclude history and selection lists from localStorage to avoid issues with serialization and Next.js hydration
      partialize: (state) => ({
        pages: state.pages,
        activePageId: state.activePageId,
        zoom: state.zoom,
        pan: state.pan,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
      }),
    }
  )
);

// Factory function to create history command for AST changes
export const createASTCommand = (
  name: string,
  newPages: Page[],
  newSelectedNodeIds?: string[]
): Command => {
  const store = useEditorStore.getState();
  const oldPages = store.pages;
  const oldSelectedNodeIds = store.selectedNodeIds;
  const targetSelectedNodeIds = newSelectedNodeIds || oldSelectedNodeIds;

  return {
    name,
    execute: () => {
      useEditorStore.setState({
        pages: newPages,
        selectedNodeIds: targetSelectedNodeIds,
      });
    },
    undo: () => {
      useEditorStore.setState({
        pages: oldPages,
        selectedNodeIds: oldSelectedNodeIds,
      });
    },
  };
};

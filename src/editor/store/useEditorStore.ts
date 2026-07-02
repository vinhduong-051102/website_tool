import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ASTNode, Breakpoint, Page, Command, Project, Layout, StateVariable } from "../types";
import { TEMPLATES } from "./templates";
import { createDefaultRootNode } from "../utils/defaultRoot";
import { createDefaultMainLayout } from "../utils/defaultLayout";

interface EditorState {
  projects: Project[];
  activeProjectId: string;
  pages: Page[];
  layouts: Layout[];
  activePageId: string;
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
  clipboard: ASTNode[] | null;
  activeBreakpoint: Breakpoint;
  apis: { name: string; url: string; method: string; headers?: string; body?: string }[];
  env: Record<string, string>;
  theme: Record<string, unknown>;
  globalVariables: StateVariable[];
  
  // Canvas settings
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;
  isPreviewMode: boolean;

  // History stack (non-persistent)
  history: Command[];
  historyIndex: number;

  selectedVariableKey: string | null;
  propertiesTab: "design" | "events" | "bindings";
}

interface EditorActions {
  // Project Management Actions
  createProject: (name: string, template: string) => void;
  openProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  importProject: (projectJson: string) => void;
  exportProject: (id: string) => void;
  updateProjectEnv: (env: Record<string, string>) => void;
  updateProjectTheme: (theme: Record<string, unknown>) => void;

  // State setters
  setPages: (pages: Page[] | ((prev: Page[]) => Page[])) => void;
  setLayouts: (layouts: Layout[] | ((prev: Layout[]) => Layout[])) => void;
  setGlobalVariables: (vars: StateVariable[] | ((prev: StateVariable[]) => StateVariable[])) => void;
  setActivePageId: (id: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setHoveredNodeId: (id: string | null) => void;
  setClipboard: (nodes: ASTNode[] | null) => void;
  setActiveBreakpoint: (bp: Breakpoint) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setIsPreviewMode: (isPreview: boolean) => void;
  resetProject: () => void;
  setSelectedVariableKey: (key: string | null) => void;
  setPropertiesTab: (tab: "design" | "events" | "bindings") => void;
  addApi: (api: { name: string; url: string; method: string; headers?: string; body?: string }) => void;

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

// Default initial project setup
const defaultProject: Project = {
  id: "default",
  name: "My Project",
  template: "blank",
  pages: [
    {
      id: "home",
      name: "Home",
      path: "/",
      ast: createDefaultRootNode(),
      stateSchema: [],
      layoutId: "main-layout",
    },
  ],
  layouts: [createDefaultMainLayout()],
  apis: [
    { name: "Login", url: "https://api.example.com/auth/login", method: "POST", body: '{"email": "{{state.form.login.email}}", "password": "{{state.form.login.password}}"}' },
    { name: "Get Products", url: "https://api.example.com/products", method: "GET" },
    { name: "Upload Image", url: "https://api.example.com/upload", method: "POST" },
    { name: "Create User", url: "https://api.example.com/users", method: "POST" },
  ],
  env: {
    NEXT_PUBLIC_API_URL: "https://api.example.com",
  },
  theme: {
    primaryColor: "#2563eb",
  },
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      // Initial States
      projects: [defaultProject],
      activeProjectId: "default",
      pages: defaultProject.pages,
      layouts: defaultProject.layouts || [createDefaultMainLayout()],
      activePageId: "home",
      selectedNodeIds: [],
      hoveredNodeId: null,
      clipboard: null,
      activeBreakpoint: "desktop",
      apis: defaultProject.apis,
      env: defaultProject.env || {},
      theme: defaultProject.theme || {},
      globalVariables: defaultProject.globalVariables || [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      showGrid: true,
      snapToGrid: true,
      isPreviewMode: false,

      history: [],
      historyIndex: -1,
      selectedVariableKey: null,
      propertiesTab: "design",

      // Project Actions
      createProject: (name, template) => {
        const id = `project-${Math.random().toString(36).substr(2, 9)}`;
        const templateData = TEMPLATES[template] || TEMPLATES.blank;
        
        // Deep copy pages & apis
        const pages = JSON.parse(JSON.stringify(templateData.pages)) as Page[];
        const layouts = JSON.parse(JSON.stringify(templateData.layouts || [createDefaultMainLayout()])) as Layout[];
        const apis = JSON.parse(JSON.stringify(templateData.apis));
        const env = templateData.env || { NEXT_PUBLIC_API_URL: "https://api.example.com" };
        const theme = { primaryColor: "#2563eb" };

        const newProj: Project = {
          id,
          name,
          template,
          pages,
          layouts,
          apis,
          env,
          theme,
          globalVariables: [],
        };

        set((state) => ({
          projects: [...state.projects, newProj],
          activeProjectId: id,
          pages,
          layouts,
          activePageId: pages[0]?.id || "home",
          apis,
          env,
          theme,
          globalVariables: [],
          selectedNodeIds: [],
          hoveredNodeId: null,
          history: [],
          historyIndex: -1,
        }));
      },

      openProject: (id) => {
        const proj = get().projects.find((p) => p.id === id);
        if (!proj) return;
        set({
          activeProjectId: id,
          pages: proj.pages,
          layouts: proj.layouts || [createDefaultMainLayout()],
          activePageId: proj.pages[0]?.id || "home",
          apis: proj.apis,
          env: proj.env || {},
          theme: proj.theme || {},
          globalVariables: proj.globalVariables || [],
          selectedNodeIds: [],
          hoveredNodeId: null,
          history: [],
          historyIndex: -1,
        });
      },

      renameProject: (id, name) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        }));
      },

      duplicateProject: (id) => {
        const proj = get().projects.find((p) => p.id === id);
        if (!proj) return;

        const newId = `project-${Math.random().toString(36).substr(2, 9)}`;
        const duplicated: Project = JSON.parse(JSON.stringify(proj));
        duplicated.id = newId;
        duplicated.name = `${proj.name} (Copy)`;

        set((state) => ({
          projects: [...state.projects, duplicated],
        }));
      },

      deleteProject: (id) => {
        const { projects, activeProjectId } = get();
        if (projects.length <= 1) {
          alert("Cannot delete the only remaining project.");
          return;
        }

        const nextProjects = projects.filter((p) => p.id !== id);
        let nextActiveId = activeProjectId;
        if (activeProjectId === id) {
          nextActiveId = nextProjects[0].id;
        }

        set({
          projects: nextProjects,
        });

        if (activeProjectId === id) {
          get().openProject(nextActiveId);
        }
      },

      importProject: (projectJson) => {
        try {
          const parsed = JSON.parse(projectJson) as Project;
          if (!parsed.id || !parsed.name || !Array.isArray(parsed.pages)) {
            throw new Error("Invalid project JSON structure");
          }

          // Ensure unique ID
          parsed.id = `project-${Math.random().toString(36).substr(2, 9)}`;
          parsed.name = `${parsed.name} (Imported)`;
          if (!parsed.layouts || parsed.layouts.length === 0) {
            parsed.layouts = [createDefaultMainLayout()];
          }
          if (!parsed.globalVariables) {
            parsed.globalVariables = [];
          }

          set((state) => ({
            projects: [...state.projects, parsed],
            activeProjectId: parsed.id,
            pages: parsed.pages,
            layouts: parsed.layouts || [],
            activePageId: parsed.pages[0]?.id || "home",
            apis: parsed.apis || [],
            env: parsed.env || {},
            theme: parsed.theme || {},
            globalVariables: parsed.globalVariables || [],
            selectedNodeIds: [],
            hoveredNodeId: null,
            history: [],
            historyIndex: -1,
          }));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          alert(`Failed to import project: ${errMsg}`);
        }
      },

      exportProject: (id) => {
        const proj = get().projects.find((p) => p.id === id);
        if (!proj) return;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proj, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${proj.name.toLowerCase().replace(/\s+/g, "-")}-config.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      },

      updateProjectEnv: (env) => {
        set((state) => {
          const nextProjects = state.projects.map((p) =>
            p.id === state.activeProjectId ? { ...p, env } : p
          );
          return { env, projects: nextProjects };
        });
      },

      updateProjectTheme: (theme) => {
        set((state) => {
          const nextProjects = state.projects.map((p) =>
            p.id === state.activeProjectId ? { ...p, theme } : p
          );
          return { theme, projects: nextProjects };
        });
      },

      setPages: (pages) => {
        set((state) => {
          const nextPages = typeof pages === "function" ? pages(state.pages) : pages;
          return { pages: nextPages };
        });
      },
      setLayouts: (layouts) => {
        set((state) => {
          const nextLayouts = typeof layouts === "function" ? layouts(state.layouts) : layouts;
          return { layouts: nextLayouts };
        });
      },
      setGlobalVariables: (vars) => {
        set((state) => {
          const nextVars = typeof vars === "function" ? vars(state.globalVariables) : vars;
          return { globalVariables: nextVars };
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
      setIsPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),
      setSelectedVariableKey: (key) => set({ selectedVariableKey: key }),
      setPropertiesTab: (tab) => set({ propertiesTab: tab }),

      resetProject: () => {
        set({
          pages: [
            {
              id: "home",
              name: "Home",
              path: "/",
              ast: createDefaultRootNode(),
              layoutId: "main-layout",
            },
          ],
          layouts: [createDefaultMainLayout()],
          activePageId: "home",
          globalVariables: [],
          selectedNodeIds: [],
          hoveredNodeId: null,
          clipboard: null,
          isPreviewMode: false,
          apis: [
            { name: "Login", url: "https://api.example.com/auth/login", method: "POST", body: '{"email": "{{state.form.login.email}}", "password": "{{state.form.login.password}}"}' },
            { name: "Get Products", url: "https://api.example.com/products", method: "GET" },
            { name: "Upload Image", url: "https://api.example.com/upload", method: "POST" },
            { name: "Create User", url: "https://api.example.com/users", method: "POST" },
          ],
          history: [],
          historyIndex: -1,
        });
      },

      addApi: (api) => {
        set((state) => ({
          apis: [...(state.apis || []), api]
        }));
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
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        pages: state.pages,
        layouts: state.layouts || [],
        activePageId: state.activePageId,
        zoom: state.zoom,
        pan: state.pan,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
        apis: state.apis || [],
        env: state.env || {},
        theme: state.theme || {},
        globalVariables: state.globalVariables || [],
      }),
    }
  )
);

// Global subscriber to synchronize pages, apis, env, theme, and globalVariables changes back into the projects array
useEditorStore.subscribe((state) => {
  const { projects, activeProjectId, pages, layouts, apis, env, theme, globalVariables } = state;
  const activeProj = projects.find((p) => p.id === activeProjectId);
  if (activeProj) {
    const hasPagesChanged = activeProj.pages !== pages;
    const hasLayoutsChanged = activeProj.layouts !== layouts;
    const hasApisChanged = activeProj.apis !== apis;
    const hasEnvChanged = JSON.stringify(activeProj.env) !== JSON.stringify(env);
    const hasThemeChanged = JSON.stringify(activeProj.theme) !== JSON.stringify(theme);
    const hasGlobalVarsChanged = activeProj.globalVariables !== globalVariables;

    if (hasPagesChanged || hasLayoutsChanged || hasApisChanged || hasEnvChanged || hasThemeChanged || hasGlobalVarsChanged) {
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id === activeProjectId
            ? {
                ...p,
                pages: hasPagesChanged ? pages : p.pages,
                layouts: hasLayoutsChanged ? layouts : p.layouts || [],
                apis: hasApisChanged ? apis : p.apis,
                env: hasEnvChanged ? env : p.env,
                theme: hasThemeChanged ? theme : p.theme,
                globalVariables: hasGlobalVarsChanged ? globalVariables : p.globalVariables || [],
              }
            : p
        ),
      }));
    }
  }
});

export const createASTCommand = (
  name: string,
  newPages: Page[],
  newSelectedNodeIds?: string[],
  newLayouts?: Layout[],
  newGlobalVariables?: StateVariable[],
  newApis?: { name: string; url: string; method: string; headers?: string; body?: string }[]
): Command => {
  const store = useEditorStore.getState();
  const oldPages = store.pages;
  const oldSelectedNodeIds = store.selectedNodeIds;
  const oldLayouts = store.layouts || [];
  const oldGlobalVariables = store.globalVariables || [];
  const oldApis = store.apis || [];
  const targetSelectedNodeIds = newSelectedNodeIds || oldSelectedNodeIds;
  const targetLayouts = newLayouts || oldLayouts;
  const targetGlobalVariables = newGlobalVariables || oldGlobalVariables;
  const targetApis = newApis || oldApis;

  return {
    name,
    execute: () => {
      useEditorStore.setState({
        pages: newPages,
        selectedNodeIds: targetSelectedNodeIds,
        layouts: targetLayouts,
        globalVariables: targetGlobalVariables,
        apis: targetApis,
      });
    },
    undo: () => {
      useEditorStore.setState({
        pages: oldPages,
        selectedNodeIds: oldSelectedNodeIds,
        layouts: oldLayouts,
        globalVariables: oldGlobalVariables,
        apis: oldApis,
      });
    },
  };
};

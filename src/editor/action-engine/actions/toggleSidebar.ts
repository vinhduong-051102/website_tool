import { ActionHandler } from "../types";

export const toggleSidebarAction: ActionHandler = {
  type: "toggleSidebar",
  label: "Toggle Sidebar",
  icon: "PanelLeft",
  category: "UI",
  paramSchema: [],
  execute: async (params, ctx) => {
    const isCollapsed = ctx.getState("layout.sidebarCollapsed") as boolean | undefined;
    // Get default collapsed value if not initialized in runtime state yet
    let defaultCollapsed = false;
    try {
      const { useEditorStore } = await import("../../store/useEditorStore");
      const store = useEditorStore.getState();
      const activePage = store.pages.find((p) => p.id === store.activePageId);
      const activeLayout = store.layouts.find((l) => l.id === activePage?.layoutId);
      defaultCollapsed = activeLayout?.config?.sidebarDefaultCollapsed ?? activeLayout?.config?.sidebarCollapsed ?? false;
    } catch (e) {
      console.warn("Could not retrieve default sidebar collapsed state from editor store", e);
    }
    
    const current = isCollapsed !== undefined ? isCollapsed : defaultCollapsed;
    ctx.setState("layout.sidebarCollapsed", !current);
  },
};

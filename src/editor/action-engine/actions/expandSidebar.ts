import { ActionHandler } from "../types";

export const expandSidebarAction: ActionHandler = {
  type: "expandSidebar",
  label: "Expand Sidebar",
  icon: "PanelLeftOpen",
  category: "UI",
  paramSchema: [],
  execute: async (params, ctx) => {
    ctx.setState("layout.sidebarCollapsed", false);
  },
};

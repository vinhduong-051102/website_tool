import { ActionHandler } from "../types";

export const collapseSidebarAction: ActionHandler = {
  type: "collapseSidebar",
  label: "Collapse Sidebar",
  icon: "PanelLeftClose",
  category: "UI",
  paramSchema: [],
  execute: async (params, ctx) => {
    ctx.setState("layout.sidebarCollapsed", true);
  },
};

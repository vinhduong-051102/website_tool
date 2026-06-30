import { ActionHandler } from "../types";

export const navigateAction: ActionHandler = {
  type: "navigate",
  label: "Navigate",
  icon: "Navigation",
  category: "Navigation",
  paramSchema: [
    { key: "path", label: "Path / URL", type: "text", placeholder: "/dashboard or https://...", required: true },
    { key: "newTab", label: "Open in new tab", type: "boolean", defaultValue: false },
  ],
  execute: async (params) => {
    const path = params.path as string;
    const newTab = params.newTab as boolean;

    if (newTab) {
      window.open(path, "_blank");
    } else {
      window.location.href = path;
    }
  },
};

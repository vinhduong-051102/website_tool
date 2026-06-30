import { ActionHandler } from "../types";

export const showComponentAction: ActionHandler = {
  type: "showComponent",
  label: "Show Component",
  icon: "Eye",
  category: "UI",
  paramSchema: [
    { key: "nodeId", label: "Target Node ID", type: "text", placeholder: "Component ID to show", required: true },
  ],
  execute: async (params, ctx) => {
    const nodeId = params.nodeId as string;
    ctx.setState(`visibility.${nodeId}`, true);
  },
};

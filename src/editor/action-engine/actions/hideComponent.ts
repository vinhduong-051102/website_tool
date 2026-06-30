import { ActionHandler } from "../types";

export const hideComponentAction: ActionHandler = {
  type: "hideComponent",
  label: "Hide Component",
  icon: "EyeOff",
  category: "UI",
  paramSchema: [
    { key: "nodeId", label: "Target Node ID", type: "text", placeholder: "Component ID to hide", required: true },
  ],
  execute: async (params, ctx) => {
    const nodeId = params.nodeId as string;
    ctx.setState(`visibility.${nodeId}`, false);
  },
};

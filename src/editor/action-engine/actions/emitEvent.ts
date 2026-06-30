import { ActionHandler } from "../types";

export const emitEventAction: ActionHandler = {
  type: "emitEvent",
  label: "Emit Event",
  icon: "Zap",
  category: "Flow",
  paramSchema: [
    { key: "targetNodeId", label: "Target Node ID", type: "text", placeholder: "button-abc123", required: true },
    { key: "eventName", label: "Event Name", type: "text", placeholder: "onClick", required: true },
  ],
  execute: async (params, ctx) => {
    const targetNodeId = params.targetNodeId as string;
    const eventName = params.eventName as string;
    await ctx.dispatch(targetNodeId, eventName);
  },
};

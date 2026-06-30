import { ActionHandler } from "../types";

export const delayAction: ActionHandler = {
  type: "delay",
  label: "Delay",
  icon: "Clock",
  category: "Flow",
  paramSchema: [
    { key: "ms", label: "Duration (ms)", type: "number", placeholder: "1000", defaultValue: 1000, required: true },
  ],
  execute: async (params) => {
    const ms = Number(params.ms) || 1000;
    await new Promise((resolve) => setTimeout(resolve, ms));
  },
};

import { ActionHandler } from "../types";

export const resetStateAction: ActionHandler = {
  type: "resetState",
  label: "Reset State",
  icon: "RotateCcw",
  category: "State",
  paramSchema: [
    { key: "path", label: "State Path (empty = reset all)", type: "state-path", placeholder: "Leave empty to reset all" },
  ],
  execute: async (params, ctx) => {
    const path = params.path as string | undefined;
    ctx.resetState(path || undefined);
  },
};

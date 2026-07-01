import { ActionHandler } from "../types";

export const toggleLoadingAction: ActionHandler = {
  type: "toggleLoading",
  label: "Toggle Loading",
  icon: "Loader2",
  category: "UI",
  paramSchema: [
    {
      key: "statePath",
      label: "Loading State Path",
      type: "state-path",
      placeholder: "e.g. loading",
      defaultValue: "loading",
      required: true,
    },
  ],
  execute: async (params, ctx) => {
    const path = (params.statePath as string) || "loading";
    ctx.toggleState(path);
  },
};

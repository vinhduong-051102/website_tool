import { ActionHandler } from "../types";

export const hideLoadingAction: ActionHandler = {
  type: "hideLoading",
  label: "Hide Loading",
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
    ctx.setState(path, false);
  },
};

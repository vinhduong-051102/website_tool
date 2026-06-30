import { ActionHandler } from "../types";

export const toggleStateAction: ActionHandler = {
  type: "toggleState",
  label: "Toggle State",
  icon: "ToggleLeft",
  category: "State",
  paramSchema: [
    { key: "path", label: "State Path", type: "state-path", placeholder: "e.g. modal.login.open", required: true },
  ],
  execute: async (params, ctx) => {
    ctx.toggleState(params.path as string);
  },
};

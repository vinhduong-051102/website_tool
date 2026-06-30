import { ActionHandler } from "../types";

export const openModalAction: ActionHandler = {
  type: "openModal",
  label: "Open Modal",
  icon: "Maximize2",
  category: "UI",
  paramSchema: [
    { key: "name", label: "Modal Name", type: "text", placeholder: "e.g. login, confirm", required: true },
  ],
  execute: async (params, ctx) => {
    const name = params.name as string;
    ctx.setState(`modal.${name}.open`, true);
  },
};

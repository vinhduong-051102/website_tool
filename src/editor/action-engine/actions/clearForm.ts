import { ActionHandler } from "../types";

export const clearFormAction: ActionHandler = {
  type: "clearForm",
  label: "Clear Form",
  icon: "Eraser",
  category: "State",
  paramSchema: [
    { key: "formName", label: "Form Name", type: "text", placeholder: "e.g. login, register", required: true },
  ],
  execute: async (params, ctx) => {
    const formName = params.formName as string;
    // Reset the entire form subtree to empty object
    ctx.setState(`form.${formName}`, {});
  },
};

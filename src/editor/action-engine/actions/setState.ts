import { ActionHandler } from "../types";

export const setStateAction: ActionHandler = {
  type: "setState",
  label: "Set State",
  icon: "Database",
  category: "State",
  paramSchema: [
    { key: "path", label: "State Path", type: "state-path", placeholder: "e.g. form.login.email", required: true },
    { key: "value", label: "Value", type: "text", placeholder: "Value to set", required: true },
  ],
  execute: async (params, ctx) => {
    const path = params.path as string;
    let value: unknown = params.value;

    // Try to parse JSON values (numbers, booleans, objects, arrays)
    if (typeof value === "string") {
      try { value = JSON.parse(value); } catch { /* keep as string */ }
    }

    ctx.setState(path, value);
  },
};

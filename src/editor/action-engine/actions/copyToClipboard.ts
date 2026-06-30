import { ActionHandler } from "../types";

export const copyToClipboardAction: ActionHandler = {
  type: "copyToClipboard",
  label: "Copy to Clipboard",
  icon: "Copy",
  category: "Utility",
  paramSchema: [
    { key: "text", label: "Text to Copy", type: "text", placeholder: "Text or state path expression", required: true },
    { key: "fromState", label: "Read from State?", type: "boolean", defaultValue: false },
  ],
  execute: async (params, ctx) => {
    let text = params.text as string;
    if (params.fromState) {
      text = String(ctx.getState(text) ?? "");
    }
    await navigator.clipboard.writeText(text);
  },
};

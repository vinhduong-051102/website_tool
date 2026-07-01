import { ActionHandler } from "../types";

export const setStateAction: ActionHandler = {
  type: "setState",
  label: "Set State",
  icon: "Database",
  category: "State",
  paramSchema: [
    { key: "path", label: "State Path", type: "state-path", placeholder: "e.g. form.login.email", required: true },
    {
      key: "valueSource",
      label: "Value Source",
      type: "select",
      defaultValue: "event",
      options: [
        { label: "Event Value (auto from input)", value: "event" },
        { label: "Custom Value", value: "custom" },
        { label: "From State Path", value: "state" },
      ],
    },
    { key: "value", label: "Custom Value", type: "text", placeholder: "Static value or {{state.path}}" },
    { key: "sourceStatePath", label: "Source State Path", type: "state-path", placeholder: "e.g. form.login.password" },
  ],
  execute: async (params, ctx) => {
    const path = params.path as string;
    const valueSource = (params.valueSource as string) || "event";

    console.log('[setState Action] params:', JSON.stringify(params));
    console.log('[setState Action] path:', path, 'valueSource:', valueSource);

    let value: unknown;

    if (valueSource === "event") {
      // Use the event's value directly (e.g. input text, switch boolean, select option)
      const eventVal = ctx.event.nativeEvent;
      console.log('[setState Action] event nativeEvent:', eventVal, 'type:', typeof eventVal);
      if (eventVal && typeof eventVal === "object" && "target" in eventVal) {
        value = (eventVal as any).target?.value;
      } else {
        value = eventVal;
      }
    } else if (valueSource === "state") {
      // Read from another state path
      const sourcePath = params.sourceStatePath as string;
      if (sourcePath) {
        value = ctx.getState(sourcePath);
      }
    } else {
      // Custom static value
      value = params.value;
      if (typeof value === "string") {
        try { value = JSON.parse(value); } catch { /* keep as string */ }
      }
    }

    console.log('[setState Action] FINAL: setState("' + path + '",', value, ')');
    ctx.setState(path, value);
  },
};

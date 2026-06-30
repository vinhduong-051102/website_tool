import { ActionHandler } from "../types";

export const runConditionAction: ActionHandler = {
  type: "runCondition",
  label: "Run Condition",
  icon: "GitBranch",
  category: "Flow",
  paramSchema: [
    { key: "statePath", label: "State Path to Check", type: "state-path", placeholder: "e.g. currentUser", required: true },
    {
      key: "operator",
      label: "Operator",
      type: "select",
      defaultValue: "truthy",
      options: [
        { label: "Is Truthy", value: "truthy" },
        { label: "Is Falsy", value: "falsy" },
        { label: "Equals", value: "equals" },
        { label: "Not Equals", value: "notEquals" },
        { label: "Greater Than", value: "gt" },
        { label: "Less Than", value: "lt" },
      ],
    },
    { key: "compareValue", label: "Compare Value", type: "text", placeholder: "Value to compare against" },
    { key: "thenSetPath", label: "Then: Set State Path", type: "state-path", placeholder: "State to set if true" },
    { key: "thenSetValue", label: "Then: Set Value", type: "text", placeholder: "Value if true" },
    { key: "elseSetPath", label: "Else: Set State Path", type: "state-path", placeholder: "State to set if false" },
    { key: "elseSetValue", label: "Else: Set Value", type: "text", placeholder: "Value if false" },
  ],
  execute: async (params, ctx) => {
    const stateValue = ctx.getState(params.statePath as string);
    const operator = (params.operator as string) || "truthy";
    let compareValue: unknown = params.compareValue;

    // Try JSON parse for compare value
    if (typeof compareValue === "string") {
      try { compareValue = JSON.parse(compareValue); } catch { /* keep as string */ }
    }

    let conditionMet = false;

    switch (operator) {
      case "truthy":
        conditionMet = !!stateValue;
        break;
      case "falsy":
        conditionMet = !stateValue;
        break;
      case "equals":
        conditionMet = stateValue === compareValue;
        break;
      case "notEquals":
        conditionMet = stateValue !== compareValue;
        break;
      case "gt":
        conditionMet = Number(stateValue) > Number(compareValue);
        break;
      case "lt":
        conditionMet = Number(stateValue) < Number(compareValue);
        break;
    }

    if (conditionMet) {
      if (params.thenSetPath) {
        let val: unknown = params.thenSetValue;
        if (typeof val === "string") {
          try { val = JSON.parse(val); } catch { /* keep */ }
        }
        ctx.setState(params.thenSetPath as string, val);
      }
    } else {
      if (params.elseSetPath) {
        let val: unknown = params.elseSetValue;
        if (typeof val === "string") {
          try { val = JSON.parse(val); } catch { /* keep */ }
        }
        ctx.setState(params.elseSetPath as string, val);
      }
    }
  },
};

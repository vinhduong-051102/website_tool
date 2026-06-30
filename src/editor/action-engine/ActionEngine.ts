import { EventActionConfig } from "../types";
import { ActionContext } from "./types";
import { getActionHandler } from "./registry";

const resolveValue = (val: unknown, context: ActionContext): any => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    // 1. Full-match expression like {{event}} or {{state.count}}
    const match = trimmed.match(/^\{\{([^}]+)\}\}$/);
    if (match) {
      const expr = match[1].trim();
      if (expr === "event" || expr === "value" || expr === "eventValue") {
        const eventVal = context.event.nativeEvent;
        // If it's a native DOM event, grab target value
        if (eventVal && typeof eventVal === "object" && "target" in eventVal) {
          return (eventVal as any).target?.value;
        }
        return eventVal;
      }
      
      // Resolve path
      const statePath = expr.startsWith("state.") ? expr.substring(6) : expr;
      return context.getState(statePath);
    }

    // 2. Interpolated string: "Hello {{state.name}}"
    return val.replace(/\{\{([^}]+)\}\}/g, (m, expression) => {
      const expr = expression.trim();
      if (expr === "event" || expr === "value" || expr === "eventValue") {
        const eventVal = context.event.nativeEvent;
        if (eventVal !== undefined && eventVal !== null) {
          if (typeof eventVal === "object" && "target" in eventVal) {
            return String((eventVal as any).target?.value ?? "");
          }
          return typeof eventVal === "object" ? JSON.stringify(eventVal) : String(eventVal);
        }
        return "";
      }
      const statePath = expr.startsWith("state.") ? expr.substring(6) : expr;
      const stateVal = context.getState(statePath);
      if (stateVal !== undefined && stateVal !== null) {
        return typeof stateVal === "object" ? JSON.stringify(stateVal) : String(stateVal);
      }
      return "";
    });
  }

  if (Array.isArray(val)) {
    return val.map((item) => resolveValue(item, context));
  }

  if (val !== null && typeof val === "object") {
    const resolvedObj: Record<string, any> = {};
    for (const [key, item] of Object.entries(val)) {
      resolvedObj[key] = resolveValue(item, context);
    }
    return resolvedObj;
  }

  return val;
};

/**
 * Execute a sequence of actions in order.
 * Each action awaits the previous one before starting.
 */
export const executeActions = async (
  actions: EventActionConfig[],
  context: ActionContext
): Promise<void> => {
  for (const action of actions) {
    const handler = getActionHandler(action.type);
    if (!handler) {
      console.warn(`[ActionEngine] Unknown action type: "${action.type}"`);
      continue;
    }

    // Evaluate condition if enabled
    if (action.condition && action.condition.enabled) {
      const stateValue = context.getState(action.condition.statePath);
      const operator = action.condition.operator || "truthy";
      let compareValue: unknown = action.condition.compareValue;

      if (typeof compareValue === "string") {
        try {
          compareValue = JSON.parse(compareValue);
        } catch {
          // Keep as string
        }
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

      if (!conditionMet) {
        continue;
      }
    }

    try {
      const resolvedParams = resolveValue(action.params, context) as Record<string, unknown>;
      await handler.execute(resolvedParams, context);
    } catch (error) {
      console.error(`[ActionEngine] Error executing action "${action.type}":`, error);
      // Continue executing remaining actions even if one fails
    }
  }
};

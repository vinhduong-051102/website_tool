import { EventActionConfig } from "../types";
import { ActionContext } from "./types";
import { getActionHandler } from "./registry";

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

    try {
      await handler.execute(action.params, context);
    } catch (error) {
      console.error(`[ActionEngine] Error executing action "${action.type}":`, error);
      // Continue executing remaining actions even if one fails
    }
  }
};

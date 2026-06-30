import { ASTNode } from "../types";
import { ActionContext } from "../action-engine/types";
import { executeActions } from "../action-engine/ActionEngine";

/**
 * Handle a component event by looking up configured actions on the AST node
 * and delegating execution to the Action Engine.
 */
export const handleComponentEvent = async (
  node: ASTNode,
  eventName: string,
  context: ActionContext
): Promise<void> => {
  const eventConfig = node.events?.find((e) => e.event === eventName);
  if (!eventConfig || eventConfig.actions.length === 0) return;

  await executeActions(eventConfig.actions, context);
};

/**
 * Create event handler functions for a node based on its configured events.
 * Returns a map of event names to handler functions.
 */
export const createEventHandlers = (
  node: ASTNode,
  contextFactory: () => ActionContext
): Record<string, (e?: Event) => void> => {
  const handlers: Record<string, (e?: Event) => void> = {};

  if (!node.events || node.events.length === 0) return handlers;

  for (const eventConfig of node.events) {
    if (eventConfig.actions.length === 0) continue;

    handlers[eventConfig.event] = (nativeEvent?: Event) => {
      const ctx = contextFactory();
      ctx.event.nativeEvent = nativeEvent;
      handleComponentEvent(node, eventConfig.event, ctx);
    };
  }

  return handlers;
};

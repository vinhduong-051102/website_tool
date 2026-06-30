import { ActionHandler } from "./types";
import { setStateAction } from "./actions/setState";
import { toggleStateAction } from "./actions/toggleState";
import { delayAction } from "./actions/delay";
import { showToastAction } from "./actions/showToast";
import { navigateAction } from "./actions/navigate";
import { openModalAction } from "./actions/openModal";
import { closeModalAction } from "./actions/closeModal";
import { callApiAction } from "./actions/callApi";
import { emitEventAction } from "./actions/emitEvent";
import { copyToClipboardAction } from "./actions/copyToClipboard";
import { hideComponentAction } from "./actions/hideComponent";
import { showComponentAction } from "./actions/showComponent";
import { clearFormAction } from "./actions/clearForm";
import { resetStateAction } from "./actions/resetState";
import { runConditionAction } from "./actions/runCondition";

/** Registry mapping action type keys to their handlers */
const actionRegistry: Record<string, ActionHandler> = {};

// Register all built-in actions
const builtInActions: ActionHandler[] = [
  setStateAction,
  toggleStateAction,
  delayAction,
  showToastAction,
  navigateAction,
  openModalAction,
  closeModalAction,
  callApiAction,
  emitEventAction,
  copyToClipboardAction,
  hideComponentAction,
  showComponentAction,
  clearFormAction,
  resetStateAction,
  runConditionAction,
];

for (const action of builtInActions) {
  actionRegistry[action.type] = action;
}

/** Get an action handler by its type key */
export const getActionHandler = (type: string): ActionHandler | undefined => {
  return actionRegistry[type];
};

/** Register a custom action handler (for extensibility) */
export const registerAction = (handler: ActionHandler): void => {
  actionRegistry[handler.type] = handler;
};

/** Get all registered action handlers (for the action picker UI) */
export const getAllActionHandlers = (): ActionHandler[] => {
  return Object.values(actionRegistry);
};

/** Get action handlers grouped by category */
export const getActionsByCategory = (): Record<string, ActionHandler[]> => {
  const grouped: Record<string, ActionHandler[]> = {};
  for (const handler of Object.values(actionRegistry)) {
    if (!grouped[handler.category]) {
      grouped[handler.category] = [];
    }
    grouped[handler.category].push(handler);
  }
  return grouped;
};

import { useCallback } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { useGlobalState } from "../state/useGlobalState";
import { ActionContext } from "../action-engine/types";
import { findNodeById } from "../utils/ast";
import { handleComponentEvent } from "../event-engine/EventEngine";

export const useRuntime = () => {
  const pages = useEditorStore((state) => state.pages);
  const activePageId = useEditorStore((state) => state.activePageId);

  const activePage = pages.find((p) => p.id === activePageId);

  /**
   * Dispatch a custom event on a target node in the AST.
   * This is used by actions like emitEvent to trigger chains on other components.
   */
  const dispatch = useCallback(
    async (targetNodeId: string, eventName: string): Promise<void> => {
      if (!activePage) return;

      const targetNode = findNodeById(activePage.ast, targetNodeId);
      if (!targetNode) {
        console.warn(`[Runtime] Target node "${targetNodeId}" not found for event dispatch.`);
        return;
      }

      const context = createRuntimeContext(targetNodeId, eventName);
      await handleComponentEvent(targetNode, eventName, context);
    },
    [activePage]
  );

  /**
   * Factory function to create an ActionContext for a given component and event.
   */
  const createRuntimeContext = useCallback(
    (nodeId: string, eventName: string, nativeEvent?: Event): ActionContext => {
      const globalState = useGlobalState.getState();
      return {
        getState: globalState.getState,
        setState: globalState.setState,
        toggleState: globalState.toggleState,
        resetState: globalState.resetState,
        event: {
          nodeId,
          eventName,
          nativeEvent,
        },
        dispatch,
      };
    },
    [dispatch]
  );

  return {
    dispatch,
    createRuntimeContext,
  };
};

export default useRuntime;

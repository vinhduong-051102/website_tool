import { useMemo } from "react";
import { ASTNode } from "../types";
import { useGlobalState } from "../state/useGlobalState";
import { resolveBindings } from "./resolver";

/**
 * React hook that subscribes to global state paths referenced by a node's bindings.
 * Returns the node's props with bound values merged in.
 * Uses Zustand selector for optimal re-render performance.
 */
export const useBindings = (node: ASTNode): Record<string, unknown> => {
  const bindings = node.bindings;

  // Collect all state paths this node depends on
  const statePaths = useMemo(() => {
    if (!bindings || bindings.length === 0) return [];
    return bindings.map((b) => b.expression);
  }, [bindings]);

  // Subscribe to the global state data object
  const data = useGlobalState((state) => state.data);

  // Resolve bindings against current state
  return useMemo(() => {
    if (!bindings || bindings.length === 0) return node.props;

    const getState = (path: string): unknown => {
      const keys = path.split(".");
      let current: unknown = data;
      for (const key of keys) {
        if (current === null || current === undefined) return undefined;
        current = (current as Record<string, unknown>)[key];
      }
      return current;
    };

    return resolveBindings(bindings, node.props, getState);
  }, [bindings, node.props, data]);
};

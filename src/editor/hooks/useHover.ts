import { useCallback } from "react";
import { useEditorStore } from "../store/useEditorStore";

export const useHover = (nodeId: string) => {
  const isHovered = useEditorStore(
    useCallback((state) => state.hoveredNodeId === nodeId, [nodeId])
  );
  const setHoveredNodeId = useEditorStore((state) => state.setHoveredNodeId);

  const onMouseEnter = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.stopPropagation();
      setHoveredNodeId(nodeId);
    },
    [nodeId, setHoveredNodeId]
  );

  const onMouseLeave = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.stopPropagation();
      if (useEditorStore.getState().hoveredNodeId === nodeId) {
        setHoveredNodeId(null);
      }
    },
    [nodeId, setHoveredNodeId]
  );

  return { isHovered, onMouseEnter, onMouseLeave };
};

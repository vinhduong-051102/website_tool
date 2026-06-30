import { useCallback } from "react";
import { useEditorStore } from "../store/useEditorStore";

export const useSelection = (nodeId: string) => {
  const isSelected = useEditorStore(
    useCallback((state) => state.selectedNodeIds.includes(nodeId), [nodeId])
  );
  const selectedNodeIds = useEditorStore((state) => state.selectedNodeIds);
  const setSelectedNodeIds = useEditorStore((state) => state.setSelectedNodeIds);

  const select = useCallback(
    (e?: React.MouseEvent | MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (e?.shiftKey) {
        if (isSelected) {
          setSelectedNodeIds(selectedNodeIds.filter((id) => id !== nodeId));
        } else {
          setSelectedNodeIds([...selectedNodeIds, nodeId]);
        }
      } else {
        setSelectedNodeIds([nodeId]);
      }
    },
    [nodeId, isSelected, selectedNodeIds, setSelectedNodeIds]
  );

  return { isSelected, select };
};

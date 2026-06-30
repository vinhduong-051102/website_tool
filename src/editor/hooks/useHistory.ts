import { useEditorStore } from "../store/useEditorStore";

export const useHistory = () => {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.historyIndex >= 0);
  const canRedo = useEditorStore(
    (state) => state.historyIndex < state.history.length - 1
  );

  return { undo, redo, canUndo, canRedo };
};

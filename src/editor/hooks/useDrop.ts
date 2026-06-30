import { useDroppable } from "@dnd-kit/core";

export const useDrop = (nodeId: string) => {
  const { setNodeRef, isOver } = useDroppable({
    id: nodeId,
  });

  return { setNodeRef, isOver };
};
